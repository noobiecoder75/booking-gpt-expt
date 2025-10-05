import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Commission,
  CommissionRule,
  CommissionStatus,
  PaymentMethod,
  CommissionAnalytics,
} from '@/types/financial';
import { useSettingsStore } from './settings-store';

interface CommissionStore {
  // Local cache
  commissions: Commission[];
  commissionRules: CommissionRule[];

  // Sync status
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;

  // Actions
  fetchCommissions: () => Promise<void>;
  createCommission: (commissionData: Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCommission: (id: string, updates: Partial<Commission>) => Promise<void>;
  deleteCommission: (id: string) => Promise<void>;
  getCommissionById: (id: string) => Commission | undefined;

  // Commission calculations
  calculateCommission: (
    agentId: string,
    bookingAmount: number,
    bookingType?: 'flight' | 'hotel' | 'activity' | 'transfer',
    quoteCommissionRate?: number
  ) => number;

  generateCommissionFromBooking: (
    bookingData: {
      agentId: string;
      agentName: string;
      bookingId: string;
      quoteId: string;
      invoiceId?: string;
      customerId: string;
      customerName: string;
      bookingAmount: number;
      bookingType?: 'flight' | 'hotel' | 'activity' | 'transfer';
      quoteCommissionRate?: number;
    }
  ) => Promise<string>;

  generateCommissionFromBookingConfirmation: (booking: {
    totalAmount: number;
    items: Array<{ type?: string }>;
    customerDetails: { name: string };
    bookingId: string;
    createdAt: string;
    commissionRate?: number;
  }, invoiceId: string) => Promise<string>;

  // Commission status management
  updateCommissionStatus: (id: string, status: CommissionStatus) => Promise<void>;
  approveCommission: (id: string) => Promise<void>;
  markCommissionAsPaid: (id: string, paymentMethod: PaymentMethod) => Promise<void>;
  bulkApproveCommissions: (ids: string[]) => Promise<void>;
  bulkMarkAsPaid: (ids: string[], paymentMethod: PaymentMethod) => Promise<void>;

  // Commission rules management (local only)
  createCommissionRule: (ruleData: Omit<CommissionRule, 'id' | 'createdAt'>) => string;
  updateCommissionRule: (id: string, updates: Partial<CommissionRule>) => void;
  deleteCommissionRule: (id: string) => void;
  getCommissionRuleById: (id: string) => CommissionRule | undefined;
  getActiveCommissionRules: () => CommissionRule[];

  // Filtering and querying
  getCommissionsByAgent: (agentId: string) => Commission[];
  getCommissionsByStatus: (status: CommissionStatus) => Commission[];
  getCommissionsByDateRange: (startDate: string, endDate: string) => Commission[];
  getPendingCommissions: () => Commission[];
  getUnpaidCommissions: () => Commission[];

  // Analytics and reporting
  getCommissionAnalytics: (agentId?: string, startDate?: string, endDate?: string) => CommissionAnalytics[];
  getTotalCommissionsEarned: (agentId?: string, startDate?: string, endDate?: string) => number;
  getTotalCommissionsPaid: (agentId?: string, startDate?: string, endDate?: string) => number;
  getTotalCommissionsPending: (agentId?: string) => number;
  getAgentCommissionSummary: (agentId: string, startDate?: string, endDate?: string) => {
    totalEarned: number;
    totalPaid: number;
    totalPending: number;
    commissionRate: number;
    totalBookings: number;
  };

  // Search functionality
  searchCommissions: (query: string) => Commission[];

  // Sync
  syncCommissions: () => Promise<void>;
  clearLocalCache: () => void;
}

// Helper: Convert database row to Commission
function dbRowToCommission(row: any): Commission {
  return {
    id: row.id,
    agentId: row.user_id,
    agentName: row.agent_name || 'Unknown',
    bookingId: row.booking_id,
    quoteId: row.quote_id || row.booking_id,
    invoiceId: row.invoice_id || undefined,
    customerId: row.customer_id || row.booking_id,
    customerName: row.customer_name || 'Unknown',
    bookingAmount: parseFloat(row.booking_amount || '0'),
    commissionRate: parseFloat(row.rate),
    commissionAmount: parseFloat(row.amount),
    status: row.status as CommissionStatus,
    earnedDate: row.earned_date || row.created_at,
    paidDate: row.paid_at || undefined,
    paymentMethod: row.payment_method as PaymentMethod | undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper: Convert Commission to database insert
function commissionToDbInsert(commission: Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>, userId: string): any {
  return {
    user_id: userId,
    booking_id: commission.bookingId,
    quote_id: commission.quoteId || null,
    invoice_id: commission.invoiceId || null,
    agent_name: commission.agentName,
    customer_id: commission.customerId,
    customer_name: commission.customerName,
    booking_amount: commission.bookingAmount,
    rate: commission.commissionRate,
    amount: commission.commissionAmount,
    status: commission.status,
    earned_date: commission.earnedDate,
    paid_at: commission.paidDate || null,
    payment_method: commission.paymentMethod || null,
    notes: commission.notes || null,
  };
}

// Helper: Convert Commission updates to database update
function commissionToDbUpdate(updates: Partial<Commission>): any {
  const dbUpdate: any = {};

  if (updates.status !== undefined) dbUpdate.status = updates.status;
  if (updates.paidDate !== undefined) dbUpdate.paid_at = updates.paidDate;
  if (updates.paymentMethod !== undefined) dbUpdate.payment_method = updates.paymentMethod;
  if (updates.notes !== undefined) dbUpdate.notes = updates.notes;
  if (updates.commissionAmount !== undefined) dbUpdate.amount = updates.commissionAmount;
  if (updates.commissionRate !== undefined) dbUpdate.rate = updates.commissionRate;

  return dbUpdate;
}

export const useCommissionStore = create<CommissionStore>()(
  persist(
    (set, get) => ({
      commissions: [],
      commissionRules: [],
      syncStatus: 'idle',
      lastSyncTime: null,

      fetchCommissions: async () => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.warn('No authenticated user, skipping fetch');
            set({ syncStatus: 'idle' });
            return;
          }

          const { data, error } = await supabase
            .from('commissions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const commissions = data.map(dbRowToCommission);

          set({
            commissions,
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          });
        } catch (error) {
          console.error('Failed to fetch commissions:', error);
          set({ syncStatus: 'error' });
        }
      },

      createCommission: async (commissionData) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No authenticated user');

          const dbInsert = commissionToDbInsert(commissionData, user.id);

          const { data, error } = await supabase
            .from('commissions')
            .insert(dbInsert)
            .select()
            .single();

          if (error) throw error;

          const newCommission = dbRowToCommission(data);

          set((state) => ({
            commissions: [newCommission, ...state.commissions],
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));

          return newCommission.id;
        } catch (error) {
          console.error('Failed to create commission:', error);
          set({ syncStatus: 'error' });

          // Fallback to local
          const id = crypto.randomUUID();
          const now = new Date().toISOString();

          const localCommission: Commission = {
            ...commissionData,
            id,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            commissions: [localCommission, ...state.commissions],
          }));

          return id;
        }
      },

      updateCommission: async (id, updates) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const dbUpdate = commissionToDbUpdate(updates);

          const { data, error } = await supabase
            .from('commissions')
            .update(dbUpdate)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const updatedCommission = dbRowToCommission(data);

          set((state) => ({
            commissions: state.commissions.map((commission) =>
              commission.id === id ? updatedCommission : commission
            ),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to update commission:', error);
          set({ syncStatus: 'error' });

          // Update local cache only
          set((state) => ({
            commissions: state.commissions.map((commission) =>
              commission.id === id
                ? { ...commission, ...updates, updatedAt: new Date().toISOString() }
                : commission
            ),
          }));
        }
      },

      deleteCommission: async (id) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { error } = await supabase
            .from('commissions')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            commissions: state.commissions.filter((commission) => commission.id !== id),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to delete commission:', error);
          set({ syncStatus: 'error' });

          // Delete from local cache only
          set((state) => ({
            commissions: state.commissions.filter((commission) => commission.id !== id),
          }));
        }
      },

      getCommissionById: (id) => {
        return get().commissions.find((commission) => commission.id === id);
      },

      calculateCommission: (agentId, bookingAmount, bookingType, quoteCommissionRate) => {
        if (quoteCommissionRate !== undefined && quoteCommissionRate !== null) {
          return (bookingAmount * quoteCommissionRate) / 100;
        }

        const rules = get().getActiveCommissionRules();

        let applicableRule = rules.find(rule =>
          rule.agentId === agentId &&
          (!rule.bookingType || rule.bookingType === bookingType) &&
          (!rule.minBookingAmount || bookingAmount >= rule.minBookingAmount) &&
          (!rule.maxBookingAmount || bookingAmount <= rule.maxBookingAmount)
        );

        if (!applicableRule) {
          applicableRule = rules.find(rule =>
            !rule.agentId &&
            (!rule.bookingType || rule.bookingType === bookingType) &&
            (!rule.minBookingAmount || bookingAmount >= rule.minBookingAmount) &&
            (!rule.maxBookingAmount || bookingAmount <= rule.maxBookingAmount)
          );
        }

        if (!applicableRule) {
          const settingsStore = useSettingsStore.getState();
          const itemRate = bookingType
            ? settingsStore.getCommissionRateForItemType(bookingType)
            : settingsStore.settings.defaultCommissionRate;
          return (bookingAmount * itemRate) / 100;
        }

        let commission = (bookingAmount * applicableRule.commissionRate) / 100;
        if (applicableRule.flatFee) {
          commission += applicableRule.flatFee;
        }

        return commission;
      },

      generateCommissionFromBooking: async (bookingData) => {
        const commissionAmount = get().calculateCommission(
          bookingData.agentId,
          bookingData.bookingAmount,
          bookingData.bookingType,
          bookingData.quoteCommissionRate
        );

        const commissionRate = bookingData.quoteCommissionRate ??
          (bookingData.bookingAmount > 0 ? (commissionAmount / bookingData.bookingAmount) * 100 : 0);

        const commissionData = {
          ...bookingData,
          invoiceId: bookingData.invoiceId,
          commissionRate,
          commissionAmount,
          status: 'pending' as CommissionStatus,
          earnedDate: new Date().toISOString(),
        };

        return await get().createCommission(commissionData);
      },

      generateCommissionFromBookingConfirmation: async (booking, invoiceId) => {
        const defaultAgentId = 'agent-001';
        const defaultAgentName = 'Travel Agent';

        const quoteCommissionRate = booking.commissionRate;

        let avgCommissionAmount = 0;

        if (booking.items.length > 0) {
          const itemCommissions = booking.items.map((item: any) => {
            const itemAmount = item.details?.totalPrice || (booking.totalAmount / booking.items.length);
            return get().calculateCommission(
              defaultAgentId,
              itemAmount,
              item.type || 'hotel',
              quoteCommissionRate
            );
          });
          avgCommissionAmount = itemCommissions.reduce((sum: number, val: number) => sum + val, 0);
        } else {
          avgCommissionAmount = get().calculateCommission(
            defaultAgentId,
            booking.totalAmount,
            'hotel',
            quoteCommissionRate
          );
        }

        const commissionAmount = avgCommissionAmount;

        const commissionRate = quoteCommissionRate ??
          (booking.totalAmount > 0 ? (commissionAmount / booking.totalAmount) * 100 : 0);

        const commissionData = {
          agentId: defaultAgentId,
          agentName: defaultAgentName,
          bookingId: booking.bookingId,
          quoteId: booking.bookingId,
          invoiceId,
          customerId: booking.bookingId,
          customerName: booking.customerDetails.name,
          bookingAmount: booking.totalAmount,
          commissionRate,
          commissionAmount,
          status: 'pending' as CommissionStatus,
          earnedDate: booking.createdAt,
        };

        return await get().createCommission(commissionData);
      },

      updateCommissionStatus: async (id, status) => {
        const updates: Partial<Commission> = { status };

        if (status === 'paid') {
          updates.paidDate = new Date().toISOString();
        }

        await get().updateCommission(id, updates);
      },

      approveCommission: async (id) => {
        await get().updateCommissionStatus(id, 'approved');
      },

      markCommissionAsPaid: async (id, paymentMethod) => {
        await get().updateCommission(id, {
          status: 'paid',
          paymentMethod,
          paidDate: new Date().toISOString(),
        });
      },

      bulkApproveCommissions: async (ids) => {
        for (const id of ids) {
          await get().approveCommission(id);
        }
      },

      bulkMarkAsPaid: async (ids, paymentMethod) => {
        for (const id of ids) {
          await get().markCommissionAsPaid(id, paymentMethod);
        }
      },

      // Commission rules (local only)
      createCommissionRule: (ruleData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const rule: CommissionRule = {
          ...ruleData,
          id,
          createdAt: now,
        };

        set((state) => ({
          commissionRules: [...state.commissionRules, rule],
        }));

        return id;
      },

      updateCommissionRule: (id, updates) => {
        set((state) => ({
          commissionRules: state.commissionRules.map((rule) =>
            rule.id === id ? { ...rule, ...updates } : rule
          ),
        }));
      },

      deleteCommissionRule: (id) => {
        set((state) => ({
          commissionRules: state.commissionRules.filter((rule) => rule.id !== id),
        }));
      },

      getCommissionRuleById: (id) => {
        return get().commissionRules.find((rule) => rule.id === id);
      },

      getActiveCommissionRules: () => {
        return get().commissionRules.filter((rule) => rule.isActive);
      },

      getCommissionsByAgent: (agentId) => {
        return get().commissions.filter((commission) => commission.agentId === agentId);
      },

      getCommissionsByStatus: (status) => {
        return get().commissions.filter((commission) => commission.status === status);
      },

      getCommissionsByDateRange: (startDate, endDate) => {
        return get().commissions.filter((commission) => {
          const earnedDate = commission.earnedDate;
          return earnedDate >= startDate && earnedDate <= endDate;
        });
      },

      getPendingCommissions: () => {
        return get().getCommissionsByStatus('pending');
      },

      getUnpaidCommissions: () => {
        return get().commissions.filter((commission) =>
          commission.status === 'pending' || commission.status === 'approved'
        );
      },

      getCommissionAnalytics: (agentId, startDate, endDate) => {
        let commissions = get().commissions;

        if (agentId) {
          commissions = commissions.filter(c => c.agentId === agentId);
        }

        if (startDate && endDate) {
          commissions = get().getCommissionsByDateRange(startDate, endDate);
          if (agentId) {
            commissions = commissions.filter(c => c.agentId === agentId);
          }
        }

        const agentGroups = commissions.reduce((groups, commission) => {
          const agentId = commission.agentId;
          if (!groups[agentId]) {
            groups[agentId] = [];
          }
          groups[agentId].push(commission);
          return groups;
        }, {} as Record<string, Commission[]>);

        return Object.entries(agentGroups).map(([agentId, commissions]) => {
          const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
          const totalBookings = commissions.length;
          const averageCommission = totalBookings > 0 ? totalCommissions / totalBookings : 0;
          const averageRate = totalBookings > 0
            ? commissions.reduce((sum, c) => sum + c.commissionRate, 0) / totalBookings
            : 0;

          return {
            agentId,
            agentName: commissions[0]?.agentName || 'Unknown',
            totalCommissions,
            totalBookings,
            averageCommission,
            commissionRate: averageRate,
            period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
          };
        });
      },

      getTotalCommissionsEarned: (agentId, startDate, endDate) => {
        let commissions = get().commissions;

        if (agentId) {
          commissions = commissions.filter(c => c.agentId === agentId);
        }

        if (startDate && endDate) {
          commissions = commissions.filter(c => {
            const earnedDate = c.earnedDate;
            return earnedDate >= startDate && earnedDate <= endDate;
          });
        }

        return commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      },

      getTotalCommissionsPaid: (agentId, startDate, endDate) => {
        let commissions = get().commissions.filter(c => c.status === 'paid');

        if (agentId) {
          commissions = commissions.filter(c => c.agentId === agentId);
        }

        if (startDate && endDate) {
          commissions = commissions.filter(c => {
            const paidDate = c.paidDate || c.earnedDate;
            return paidDate >= startDate && paidDate <= endDate;
          });
        }

        return commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      },

      getTotalCommissionsPending: (agentId) => {
        let commissions = get().getUnpaidCommissions();

        if (agentId) {
          commissions = commissions.filter(c => c.agentId === agentId);
        }

        return commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      },

      getAgentCommissionSummary: (agentId, startDate, endDate) => {
        const agentCommissions = get().getCommissionsByAgent(agentId);

        let filteredCommissions = agentCommissions;
        if (startDate && endDate) {
          filteredCommissions = agentCommissions.filter(c => {
            const earnedDate = c.earnedDate;
            return earnedDate >= startDate && earnedDate <= endDate;
          });
        }

        const totalEarned = filteredCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const totalPaid = filteredCommissions
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + c.commissionAmount, 0);
        const totalPending = filteredCommissions
          .filter(c => c.status === 'pending' || c.status === 'approved')
          .reduce((sum, c) => sum + c.commissionAmount, 0);

        const totalBookings = filteredCommissions.length;
        const averageRate = totalBookings > 0
          ? filteredCommissions.reduce((sum, c) => sum + c.commissionRate, 0) / totalBookings
          : 0;

        return {
          totalEarned,
          totalPaid,
          totalPending,
          commissionRate: averageRate,
          totalBookings,
        };
      },

      searchCommissions: (query) => {
        const lowercaseQuery = query.toLowerCase();
        return get().commissions.filter(commission =>
          commission.agentName.toLowerCase().includes(lowercaseQuery) ||
          commission.customerName.toLowerCase().includes(lowercaseQuery) ||
          commission.bookingId.toLowerCase().includes(lowercaseQuery)
        );
      },

      syncCommissions: async () => {
        await get().fetchCommissions();
      },

      clearLocalCache: () => {
        set({
          commissions: [],
          commissionRules: [],
          syncStatus: 'idle',
          lastSyncTime: null,
        });
      },
    }),
    {
      name: 'commission-store-supabase',
      partialize: (state) => ({
        commissions: state.commissions,
        commissionRules: state.commissionRules,
      }),
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  QuotePayment,
  PaymentSchedule,
  FundAllocation,
  SupplierPayment,
  PriceChange,
  EscrowStatus,
} from '@/types/payment';

interface PaymentStore {
  // Local cache
  payments: QuotePayment[];
  paymentSchedules: PaymentSchedule[];
  fundAllocations: FundAllocation[];
  supplierPayments: SupplierPayment[];
  priceChanges: PriceChange[];

  // Sync status
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;

  // Actions
  fetchPayments: () => Promise<void>;
  createPayment: (payment: Omit<QuotePayment, 'id'>) => Promise<string>;
  updatePayment: (id: string, updates: Partial<QuotePayment>) => Promise<void>;
  getPaymentById: (id: string) => QuotePayment | undefined;
  getPaymentsByQuote: (quoteId: string) => QuotePayment[];
  getTotalPaidForQuote: (quoteId: string) => number;

  // Payment Schedule
  createSchedule: (schedule: Omit<PaymentSchedule, 'id'>) => string;
  updateSchedule: (id: string, updates: Partial<PaymentSchedule>) => void;
  getScheduleById: (id: string) => PaymentSchedule | undefined;
  getSchedulesByQuote: (quoteId: string) => PaymentSchedule[];
  getOverdueSchedules: () => PaymentSchedule[];
  markScheduleAsPaid: (scheduleId: string, paymentId: string) => void;
  incrementReminderCount: (scheduleId: string) => void;

  // Fund Allocation
  createFundAllocation: (allocation: Omit<FundAllocation, 'id'>) => string;
  updateAllocation: (id: string, updates: Partial<FundAllocation>) => void;
  getAllocationByPayment: (paymentId: string) => FundAllocation | undefined;
  updateAllocationStatus: (allocationId: string, itemId: string, status: EscrowStatus) => void;
  releaseEscrowFunds: (allocationId: string, itemId: string) => void;

  // Supplier Payments
  createSupplierPayment: (payment: Omit<SupplierPayment, 'id'>) => string;
  updateSupplierPayment: (id: string, updates: Partial<SupplierPayment>) => void;
  getSupplierPaymentsDue: () => SupplierPayment[];
  markSupplierPaymentPaid: (id: string, stripeTransferId: string) => void;

  // Price Changes
  recordPriceChange: (change: Omit<PriceChange, 'id'>) => string;
  acceptPriceChange: (changeId: string) => void;
  getPriceChangesByQuote: (quoteId: string) => PriceChange[];
  getUnacceptedPriceChanges: (quoteId: string) => PriceChange[];

  // Sync
  syncPayments: () => Promise<void>;
  clearLocalCache: () => void;
}

// Helper: Convert database row to QuotePayment
function dbRowToPayment(row: any): QuotePayment {
  return {
    id: row.id,
    quoteId: row.quote_id || row.booking_id,
    amount: parseFloat(row.amount),
    currency: row.currency,
    method: row.payment_method,
    status: row.status,
    stripePaymentIntentId: row.stripe_payment_intent_id || undefined,
    processedDate: row.payment_date,
    metadata: row.metadata || undefined,
  };
}

// Helper: Convert QuotePayment to database insert
function paymentToDbInsert(payment: Omit<QuotePayment, 'id'>, userId: string): any {
  return {
    user_id: userId,
    booking_id: payment.quoteId,
    amount: payment.amount,
    currency: payment.currency,
    payment_method: payment.method,
    status: payment.status,
    stripe_payment_intent_id: payment.stripePaymentIntentId || null,
    payment_date: payment.processedDate,
    metadata: payment.metadata || null,
  };
}

// Helper: Convert QuotePayment updates to database update
function paymentToDbUpdate(updates: Partial<QuotePayment>): any {
  const dbUpdate: any = {};

  if (updates.amount !== undefined) dbUpdate.amount = updates.amount;
  if (updates.currency !== undefined) dbUpdate.currency = updates.currency;
  if (updates.method !== undefined) dbUpdate.payment_method = updates.method;
  if (updates.status !== undefined) dbUpdate.status = updates.status;
  if (updates.stripePaymentIntentId !== undefined) dbUpdate.stripe_payment_intent_id = updates.stripePaymentIntentId;
  if (updates.processedDate !== undefined) dbUpdate.payment_date = updates.processedDate;
  if (updates.metadata !== undefined) dbUpdate.metadata = updates.metadata;

  return dbUpdate;
}

export const usePaymentStore = create<PaymentStore>()(
  persist(
    (set, get) => ({
      payments: [],
      paymentSchedules: [],
      fundAllocations: [],
      supplierPayments: [],
      priceChanges: [],
      syncStatus: 'idle',
      lastSyncTime: null,

      fetchPayments: async () => {
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
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const payments = data.map(dbRowToPayment);

          set({
            payments,
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          });
        } catch (error) {
          console.error('Failed to fetch payments:', error);
          set({ syncStatus: 'error' });
        }
      },

      createPayment: async (paymentData) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No authenticated user');

          const dbInsert = paymentToDbInsert(paymentData, user.id);

          const { data, error } = await supabase
            .from('payments')
            .insert(dbInsert)
            .select()
            .single();

          if (error) throw error;

          const newPayment = dbRowToPayment(data);

          set((state) => ({
            payments: [newPayment, ...state.payments],
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));

          return newPayment.id;
        } catch (error) {
          console.error('Failed to create payment:', error);
          set({ syncStatus: 'error' });

          // Fallback to local
          const id = crypto.randomUUID();
          const localPayment: QuotePayment = { ...paymentData, id };

          set((state) => ({
            payments: [localPayment, ...state.payments],
          }));

          return id;
        }
      },

      updatePayment: async (id, updates) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const dbUpdate = paymentToDbUpdate(updates);

          const { data, error } = await supabase
            .from('payments')
            .update(dbUpdate)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const updatedPayment = dbRowToPayment(data);

          set((state) => ({
            payments: state.payments.map((payment) =>
              payment.id === id ? updatedPayment : payment
            ),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to update payment:', error);
          set({ syncStatus: 'error' });

          // Update local cache only
          set((state) => ({
            payments: state.payments.map((payment) =>
              payment.id === id ? { ...payment, ...updates } : payment
            ),
          }));
        }
      },

      getPaymentById: (id) => {
        return get().payments.find((payment) => payment.id === id);
      },

      getPaymentsByQuote: (quoteId) => {
        return get().payments.filter((payment) => payment.quoteId === quoteId);
      },

      getTotalPaidForQuote: (quoteId) => {
        const payments = get().getPaymentsByQuote(quoteId);
        return payments
          .filter((p) => p.status === 'completed' || p.status === 'succeeded')
          .reduce((sum, p) => sum + p.amount, 0);
      },

      // Payment Schedule (local only)
      createSchedule: (scheduleData) => {
        const id = crypto.randomUUID();
        const schedule: PaymentSchedule = { ...scheduleData, id };

        set((state) => ({
          paymentSchedules: [...state.paymentSchedules, schedule],
        }));

        return id;
      },

      updateSchedule: (id, updates) => {
        set((state) => ({
          paymentSchedules: state.paymentSchedules.map((schedule) =>
            schedule.id === id
              ? { ...schedule, ...updates, updatedAt: new Date().toISOString() }
              : schedule
          ),
        }));
      },

      getScheduleById: (id) => {
        return get().paymentSchedules.find((schedule) => schedule.id === id);
      },

      getSchedulesByQuote: (quoteId) => {
        return get().paymentSchedules.filter((schedule) => schedule.quoteId === quoteId);
      },

      getOverdueSchedules: () => {
        const now = new Date();
        return get().paymentSchedules.filter((schedule) => {
          if (schedule.status !== 'pending') return false;
          const dueDate = new Date(schedule.dueDate);
          return dueDate < now;
        });
      },

      markScheduleAsPaid: (scheduleId, paymentId) => {
        get().updateSchedule(scheduleId, {
          status: 'paid',
          paymentId,
        });
      },

      incrementReminderCount: (scheduleId) => {
        const schedule = get().getScheduleById(scheduleId);
        if (schedule) {
          get().updateSchedule(scheduleId, {
            reminderCount: schedule.reminderCount + 1,
            lastReminderSent: new Date().toISOString(),
          });
        }
      },

      // Fund Allocation (local only)
      createFundAllocation: (allocationData) => {
        const id = crypto.randomUUID();
        const allocation: FundAllocation = { ...allocationData, id };

        set((state) => ({
          fundAllocations: [...state.fundAllocations, allocation],
        }));

        return id;
      },

      updateAllocation: (id, updates) => {
        set((state) => ({
          fundAllocations: state.fundAllocations.map((allocation) =>
            allocation.id === id
              ? { ...allocation, ...updates, updatedAt: new Date().toISOString() }
              : allocation
          ),
        }));
      },

      getAllocationByPayment: (paymentId) => {
        return get().fundAllocations.find((allocation) => allocation.paymentId === paymentId);
      },

      updateAllocationStatus: (allocationId, itemId, status) => {
        const allocation = get().fundAllocations.find((a) => a.id === allocationId);
        if (!allocation) return;

        const updatedAllocations = allocation.allocations.map((item) =>
          item.quoteItemId === itemId ? { ...item, escrowStatus: status } : item
        );

        get().updateAllocation(allocationId, {
          allocations: updatedAllocations,
        });
      },

      releaseEscrowFunds: (allocationId, itemId) => {
        const allocation = get().fundAllocations.find((a) => a.id === allocationId);
        if (!allocation) return;

        const updatedAllocations = allocation.allocations.map((item) =>
          item.quoteItemId === itemId
            ? {
                ...item,
                escrowStatus: 'released' as EscrowStatus,
                escrowReleaseDate: new Date().toISOString(),
              }
            : item
        );

        get().updateAllocation(allocationId, {
          allocations: updatedAllocations,
        });
      },

      // Supplier Payments (local only)
      createSupplierPayment: (paymentData) => {
        const id = crypto.randomUUID();
        const payment: SupplierPayment = { ...paymentData, id };

        set((state) => ({
          supplierPayments: [...state.supplierPayments, payment],
        }));

        return id;
      },

      updateSupplierPayment: (id, updates) => {
        set((state) => ({
          supplierPayments: state.supplierPayments.map((payment) =>
            payment.id === id
              ? { ...payment, ...updates, updatedAt: new Date().toISOString() }
              : payment
          ),
        }));
      },

      getSupplierPaymentsDue: () => {
        const now = new Date();
        return get().supplierPayments.filter((payment) => {
          if (payment.status !== 'scheduled') return false;
          if (!payment.scheduledPaymentDate) return false;
          const scheduledDate = new Date(payment.scheduledPaymentDate);
          return scheduledDate <= now;
        });
      },

      markSupplierPaymentPaid: (id, stripeTransferId) => {
        get().updateSupplierPayment(id, {
          status: 'paid',
          stripeTransferId,
          paidDate: new Date().toISOString(),
        });
      },

      // Price Changes (local only)
      recordPriceChange: (changeData) => {
        const id = crypto.randomUUID();
        const change: PriceChange = { ...changeData, id };

        set((state) => ({
          priceChanges: [...state.priceChanges, change],
        }));

        return id;
      },

      acceptPriceChange: (changeId) => {
        set((state) => ({
          priceChanges: state.priceChanges.map((change) =>
            change.id === changeId
              ? {
                  ...change,
                  clientAccepted: true,
                  clientAcceptedAt: new Date().toISOString(),
                }
              : change
          ),
        }));
      },

      getPriceChangesByQuote: (quoteId) => {
        return get().priceChanges.filter((change) => change.quoteId === quoteId);
      },

      getUnacceptedPriceChanges: (quoteId) => {
        return get().priceChanges.filter(
          (change) => change.quoteId === quoteId && !change.clientAccepted
        );
      },

      syncPayments: async () => {
        await get().fetchPayments();
      },

      clearLocalCache: () => {
        set({
          payments: [],
          paymentSchedules: [],
          fundAllocations: [],
          supplierPayments: [],
          priceChanges: [],
          syncStatus: 'idle',
          lastSyncTime: null,
        });
      },
    }),
    {
      name: 'payment-store-supabase',
      partialize: (state) => ({
        payments: state.payments,
        paymentSchedules: state.paymentSchedules,
        fundAllocations: state.fundAllocations,
        supplierPayments: state.supplierPayments,
        priceChanges: state.priceChanges,
      }),
    }
  )
);

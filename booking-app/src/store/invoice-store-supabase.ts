import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Invoice,
  InvoiceItem,
  Payment,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  FinancialSummary
} from '@/types/financial';

interface InvoiceStore {
  // Local cache
  invoices: Invoice[];

  // Sync status
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;

  // Actions
  fetchInvoices: () => Promise<void>;
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'remainingAmount'>) => Promise<string>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByStatus: (status: InvoiceStatus) => Invoice[];
  getInvoicesByCustomer: (customerId: string) => Invoice[];
  getOverdueInvoices: () => Invoice[];

  // Invoice generation
  generateInvoiceFromQuote: (
    quoteId: string,
    customerData: {
      customerId: string;
      customerName: string;
      customerEmail: string;
      customerAddress?: any
    },
    terms?: string,
    dueInDays?: number
  ) => Promise<string | null>;
  generateInvoiceFromBooking: (booking: any) => Promise<string | null>;

  // Payment operations
  addPayment: (invoiceId: string, payment: Omit<Payment, 'id'>) => Promise<void>;
  updatePayment: (invoiceId: string, paymentId: string, updates: Partial<Payment>) => Promise<void>;
  deletePayment: (invoiceId: string, paymentId: string) => Promise<void>;

  // Invoice status management
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  markInvoiceAsSent: (id: string) => Promise<void>;
  markInvoiceAsPaid: (id: string, paymentMethod: PaymentMethod, transactionId?: string) => Promise<void>;

  // Invoice items
  addInvoiceItem: (invoiceId: string, item: Omit<InvoiceItem, 'id'>) => Promise<void>;
  updateInvoiceItem: (invoiceId: string, itemId: string, updates: Partial<InvoiceItem>) => Promise<void>;
  removeInvoiceItem: (invoiceId: string, itemId: string) => Promise<void>;

  // Financial calculations
  calculateInvoiceTotals: (invoiceId: string) => void;
  getTotalRevenue: (startDate?: string, endDate?: string) => number;
  getTotalOutstanding: () => number;
  getOverdueAmount: () => number;
  getFinancialSummary: (startDate: string, endDate: string) => FinancialSummary;

  // Search and filtering
  searchInvoices: (query: string) => Invoice[];
  getInvoicesByDateRange: (startDate: string, endDate: string) => Invoice[];

  // Invoice numbering
  generateInvoiceNumber: () => string;

  // Sync
  syncInvoices: () => Promise<void>;
  clearLocalCache: () => void;
}

// Helper: Convert database row to Invoice
function dbRowToInvoice(row: any): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    quoteId: row.quote_id || undefined,
    customerId: row.contact_id,
    customerName: row.customer_name || 'Unknown',
    customerEmail: row.customer_email || '',
    customerAddress: row.customer_address || undefined,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: row.status as InvoiceStatus,
    items: row.line_items || [],
    subtotal: parseFloat(row.subtotal || '0'),
    taxRate: parseFloat(row.tax_rate || '0'),
    taxAmount: parseFloat(row.tax_amount || '0'),
    total: parseFloat(row.total),
    paidAmount: parseFloat(row.paid_amount || '0'),
    remainingAmount: parseFloat(row.remaining_amount),
    payments: row.payments || [],
    terms: row.terms || undefined,
    lastSentDate: row.last_sent_date || undefined,
    discountAmount: row.discount_amount ? parseFloat(row.discount_amount) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper: Convert Invoice to database insert
function invoiceToDbInsert(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'remainingAmount'>, userId: string): any {
  return {
    user_id: userId,
    contact_id: invoice.customerId,
    quote_id: invoice.quoteId || null,
    invoice_number: invoice.invoiceNumber,
    customer_name: invoice.customerName,
    customer_email: invoice.customerEmail,
    customer_address: invoice.customerAddress || null,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    status: invoice.status,
    line_items: invoice.items,
    subtotal: invoice.subtotal,
    tax_rate: invoice.taxRate,
    tax_amount: invoice.taxAmount,
    total: invoice.total,
    paid_amount: 0,
    remaining_amount: invoice.total,
    payments: invoice.payments || [],
    terms: invoice.terms || null,
    discount_amount: invoice.discountAmount || null,
  };
}

// Helper: Convert Invoice updates to database update
function invoiceToDbUpdate(updates: Partial<Invoice>): any {
  const dbUpdate: any = {};

  if (updates.invoiceNumber !== undefined) dbUpdate.invoice_number = updates.invoiceNumber;
  if (updates.customerId !== undefined) dbUpdate.contact_id = updates.customerId;
  if (updates.customerName !== undefined) dbUpdate.customer_name = updates.customerName;
  if (updates.customerEmail !== undefined) dbUpdate.customer_email = updates.customerEmail;
  if (updates.customerAddress !== undefined) dbUpdate.customer_address = updates.customerAddress;
  if (updates.issueDate !== undefined) dbUpdate.issue_date = updates.issueDate;
  if (updates.dueDate !== undefined) dbUpdate.due_date = updates.dueDate;
  if (updates.status !== undefined) dbUpdate.status = updates.status;
  if (updates.items !== undefined) dbUpdate.line_items = updates.items;
  if (updates.subtotal !== undefined) dbUpdate.subtotal = updates.subtotal;
  if (updates.taxRate !== undefined) dbUpdate.tax_rate = updates.taxRate;
  if (updates.taxAmount !== undefined) dbUpdate.tax_amount = updates.taxAmount;
  if (updates.total !== undefined) dbUpdate.total = updates.total;
  if (updates.paidAmount !== undefined) dbUpdate.paid_amount = updates.paidAmount;
  if (updates.remainingAmount !== undefined) dbUpdate.remaining_amount = updates.remainingAmount;
  if (updates.payments !== undefined) dbUpdate.payments = updates.payments;
  if (updates.terms !== undefined) dbUpdate.terms = updates.terms;
  if (updates.lastSentDate !== undefined) dbUpdate.last_sent_date = updates.lastSentDate;
  if (updates.discountAmount !== undefined) dbUpdate.discount_amount = updates.discountAmount;

  return dbUpdate;
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: [],
      syncStatus: 'idle',
      lastSyncTime: null,

      fetchInvoices: async () => {
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
            .from('invoices')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const invoices = data.map(dbRowToInvoice);

          set({
            invoices,
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          });
        } catch (error) {
          console.error('Failed to fetch invoices:', error);
          set({ syncStatus: 'error' });
        }
      },

      createInvoice: async (invoiceData) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No authenticated user');

          const invoiceNumber = get().generateInvoiceNumber();
          const dbInsert = invoiceToDbInsert({ ...invoiceData, invoiceNumber }, user.id);

          const { data, error } = await supabase
            .from('invoices')
            .insert(dbInsert)
            .select()
            .single();

          if (error) throw error;

          const newInvoice = dbRowToInvoice(data);

          set((state) => ({
            invoices: [newInvoice, ...state.invoices],
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));

          return newInvoice.id;
        } catch (error) {
          console.error('Failed to create invoice:', error);
          set({ syncStatus: 'error' });

          // Fallback to local
          const id = crypto.randomUUID();
          const invoiceNumber = get().generateInvoiceNumber();
          const now = new Date().toISOString();

          const localInvoice: Invoice = {
            ...invoiceData,
            id,
            invoiceNumber,
            paidAmount: 0,
            remainingAmount: invoiceData.total,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            invoices: [localInvoice, ...state.invoices],
          }));

          return id;
        }
      },

      updateInvoice: async (id, updates) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const dbUpdate = invoiceToDbUpdate(updates);

          const { data, error } = await supabase
            .from('invoices')
            .update(dbUpdate)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const updatedInvoice = dbRowToInvoice(data);

          set((state) => ({
            invoices: state.invoices.map((invoice) =>
              invoice.id === id ? updatedInvoice : invoice
            ),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to update invoice:', error);
          set({ syncStatus: 'error' });

          // Update local cache only
          set((state) => ({
            invoices: state.invoices.map((invoice) =>
              invoice.id === id
                ? { ...invoice, ...updates, updatedAt: new Date().toISOString() }
                : invoice
            ),
          }));
        }
      },

      deleteInvoice: async (id) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            invoices: state.invoices.filter((invoice) => invoice.id !== id),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to delete invoice:', error);
          set({ syncStatus: 'error' });

          // Delete from local cache only
          set((state) => ({
            invoices: state.invoices.filter((invoice) => invoice.id !== id),
          }));
        }
      },

      getInvoiceById: (id) => {
        return get().invoices.find((invoice) => invoice.id === id);
      },

      getInvoicesByStatus: (status) => {
        return get().invoices.filter((invoice) => invoice.status === status);
      },

      getInvoicesByCustomer: (customerId) => {
        return get().invoices.filter((invoice) => invoice.customerId === customerId);
      },

      getOverdueInvoices: () => {
        const now = new Date();
        return get().invoices.filter((invoice) => {
          const dueDate = new Date(invoice.dueDate);
          return dueDate < now && invoice.status !== 'paid' && invoice.status !== 'cancelled';
        });
      },

      generateInvoiceFromQuote: async (quoteId, customerData, terms = 'Net 30', dueInDays = 30) => {
        try {
          const dueDate = new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000);

          const invoiceItems = [{
            id: crypto.randomUUID(),
            description: 'Travel Services',
            quantity: 1,
            unitPrice: 1000,
            total: 1000,
            taxRate: 0,
            taxAmount: 0,
          }];

          const subtotal = 1000;
          const taxRate = 8.5;
          const taxAmount = subtotal * (taxRate / 100);
          const total = subtotal + taxAmount;

          const invoiceData = {
            quoteId,
            customerId: customerData.customerId,
            customerName: customerData.customerName,
            customerEmail: customerData.customerEmail,
            customerAddress: customerData.customerAddress,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'draft' as InvoiceStatus,
            items: invoiceItems,
            subtotal,
            taxRate,
            taxAmount,
            total,
            payments: [],
            terms: terms,
          };

          const invoiceId = await get().createInvoice(invoiceData);
          return invoiceId;
        } catch (error) {
          console.error('Failed to generate invoice from quote:', error);
          return null;
        }
      },

      generateInvoiceFromBooking: async (booking) => {
        try {
          const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          const invoiceData = {
            quoteId: booking.bookingId,
            customerId: booking.bookingId,
            customerName: booking.customerDetails.name,
            customerEmail: booking.customerDetails.email,
            customerAddress: undefined,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'sent' as InvoiceStatus,
            items: booking.items.map((item: any) => ({
              id: crypto.randomUUID(),
              description: `${item.type === 'flight' ? 'Flight' : 'Hotel'} - ${item.confirmationNumber}`,
              quantity: 1,
              unitPrice: item.details.totalPrice || 0,
              total: item.details.totalPrice || 0,
              taxRate: 0,
              taxAmount: 0,
            })),
            subtotal: booking.totalAmount,
            taxRate: 8.5,
            taxAmount: booking.totalAmount * 0.085,
            total: booking.totalAmount * 1.085,
            payments: [],
            terms: 'Payment due upon booking confirmation',
          };

          const invoiceId = await get().createInvoice(invoiceData);

          if (booking.paymentStatus === 'paid' && invoiceId) {
            await get().addPayment(invoiceId, {
              amount: booking.totalAmount * 1.085,
              method: 'credit_card' as PaymentMethod,
              status: 'completed' as PaymentStatus,
              processedDate: booking.createdAt,
              transactionId: booking.bookingReference,
            });
          }

          return invoiceId;
        } catch (error) {
          console.error('Failed to generate invoice from booking:', error);
          return null;
        }
      },

      addPayment: async (invoiceId, paymentData) => {
        const invoice = get().getInvoiceById(invoiceId);
        if (!invoice) return;

        const payment: Payment = {
          ...paymentData,
          id: crypto.randomUUID(),
          invoiceId,
        };

        const updatedPayments = [...invoice.payments, payment];
        const paidAmount = updatedPayments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0);
        const remainingAmount = invoice.total - paidAmount;

        let status: InvoiceStatus = invoice.status;
        if (remainingAmount <= 0) {
          status = 'paid';
        } else if (paidAmount > 0) {
          status = 'partial';
        }

        await get().updateInvoice(invoiceId, {
          payments: updatedPayments,
          paidAmount,
          remainingAmount,
          status,
        });
      },

      updatePayment: async (invoiceId, paymentId, updates) => {
        const invoice = get().getInvoiceById(invoiceId);
        if (!invoice) return;

        const updatedPayments = invoice.payments.map((payment) =>
          payment.id === paymentId ? { ...payment, ...updates } : payment
        );

        const paidAmount = updatedPayments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0);
        const remainingAmount = invoice.total - paidAmount;

        let status: InvoiceStatus = invoice.status;
        if (remainingAmount <= 0) {
          status = 'paid';
        } else if (paidAmount > 0) {
          status = 'partial';
        } else {
          status = 'sent';
        }

        await get().updateInvoice(invoiceId, {
          payments: updatedPayments,
          paidAmount,
          remainingAmount,
          status,
        });
      },

      deletePayment: async (invoiceId, paymentId) => {
        const invoice = get().getInvoiceById(invoiceId);
        if (!invoice) return;

        const updatedPayments = invoice.payments.filter(p => p.id !== paymentId);
        const paidAmount = updatedPayments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0);
        const remainingAmount = invoice.total - paidAmount;

        let status: InvoiceStatus;
        if (remainingAmount <= 0 && paidAmount > 0) {
          status = 'paid';
        } else if (paidAmount > 0) {
          status = 'partial';
        } else {
          status = 'sent';
        }

        await get().updateInvoice(invoiceId, {
          payments: updatedPayments,
          paidAmount,
          remainingAmount,
          status,
        });
      },

      updateInvoiceStatus: async (id, status) => {
        await get().updateInvoice(id, { status });
      },

      markInvoiceAsSent: async (id) => {
        await get().updateInvoice(id, {
          status: 'sent',
          lastSentDate: new Date().toISOString()
        });
      },

      markInvoiceAsPaid: async (id, paymentMethod, transactionId) => {
        const invoice = get().getInvoiceById(id);
        if (!invoice) return;

        const paymentData = {
          amount: invoice.remainingAmount,
          method: paymentMethod,
          status: 'completed' as PaymentStatus,
          processedDate: new Date().toISOString(),
          transactionId,
        };

        await get().addPayment(id, paymentData);
      },

      addInvoiceItem: async (invoiceId, itemData) => {
        const invoice = get().getInvoiceById(invoiceId);
        if (!invoice) return;

        const item: InvoiceItem = {
          ...itemData,
          id: crypto.randomUUID(),
        };

        await get().updateInvoice(invoiceId, {
          items: [...invoice.items, item]
        });

        get().calculateInvoiceTotals(invoiceId);
      },

      updateInvoiceItem: async (invoiceId, itemId, updates) => {
        const invoice = get().getInvoiceById(invoiceId);
        if (!invoice) return;

        const updatedItems = invoice.items.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );

        await get().updateInvoice(invoiceId, { items: updatedItems });
        get().calculateInvoiceTotals(invoiceId);
      },

      removeInvoiceItem: async (invoiceId, itemId) => {
        const invoice = get().getInvoiceById(invoiceId);
        if (!invoice) return;

        const updatedItems = invoice.items.filter((item) => item.id !== itemId);

        await get().updateInvoice(invoiceId, { items: updatedItems });
        get().calculateInvoiceTotals(invoiceId);
      },

      calculateInvoiceTotals: (invoiceId) => {
        const invoice = get().getInvoiceById(invoiceId);
        if (!invoice) return;

        const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
        const taxAmount = subtotal * (invoice.taxRate / 100);
        const total = subtotal + taxAmount - (invoice.discountAmount || 0);
        const remainingAmount = total - invoice.paidAmount;

        get().updateInvoice(invoiceId, {
          subtotal,
          taxAmount,
          total,
          remainingAmount,
        });
      },

      getTotalRevenue: (startDate, endDate) => {
        let invoices = get().invoices.filter(inv => inv.status === 'paid');

        if (startDate && endDate) {
          invoices = invoices.filter(inv => {
            const invoiceDate = inv.createdAt;
            return invoiceDate >= startDate && invoiceDate <= endDate;
          });
        }

        return invoices.reduce((sum, inv) => sum + inv.total, 0);
      },

      getTotalOutstanding: () => {
        return get().invoices
          .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
          .reduce((sum, inv) => sum + inv.remainingAmount, 0);
      },

      getOverdueAmount: () => {
        return get().getOverdueInvoices()
          .reduce((sum, inv) => sum + inv.remainingAmount, 0);
      },

      getFinancialSummary: (startDate, endDate) => {
        const invoices = get().getInvoicesByDateRange(startDate, endDate);
        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
        const overdueInvoices = invoices.filter(inv => {
          const dueDate = new Date(inv.dueDate);
          return dueDate < new Date() && inv.status !== 'paid';
        });

        return {
          period: { startDate, endDate },
          revenue: {
            totalRevenue: totalPaid,
            totalBookings: invoices.length,
            averageBookingValue: invoices.length > 0 ? totalPaid / invoices.length : 0,
            conversionRate: 0,
          },
          invoices: {
            totalInvoiced,
            totalPaid,
            totalOutstanding,
            overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0),
            overdueCount: overdueInvoices.length,
          },
          commissions: {
            totalCommissionsEarned: 0,
            totalCommissionsPaid: 0,
            totalCommissionsPending: 0,
          },
          expenses: {
            totalExpenses: 0,
            expensesByCategory: {} as any,
          },
          profitLoss: {
            grossProfit: totalPaid,
            netProfit: totalPaid,
            profitMargin: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
          },
          cashFlow: {
            cashInflow: totalPaid,
            cashOutflow: 0,
            netCashFlow: totalPaid,
          },
        };
      },

      searchInvoices: (query) => {
        const lowercaseQuery = query.toLowerCase();
        return get().invoices.filter(invoice =>
          invoice.invoiceNumber.toLowerCase().includes(lowercaseQuery) ||
          invoice.customerName.toLowerCase().includes(lowercaseQuery) ||
          invoice.customerEmail.toLowerCase().includes(lowercaseQuery)
        );
      },

      getInvoicesByDateRange: (startDate, endDate) => {
        return get().invoices.filter(invoice => {
          const invoiceDate = invoice.createdAt;
          return invoiceDate >= startDate && invoiceDate <= endDate;
        });
      },

      generateInvoiceNumber: () => {
        const invoices = get().invoices;
        const currentYear = new Date().getFullYear();
        const yearPrefix = `INV-${currentYear}-`;

        const existingNumbers = invoices
          .filter(inv => inv.invoiceNumber.startsWith(yearPrefix))
          .map(inv => {
            const numberPart = inv.invoiceNumber.replace(yearPrefix, '');
            return parseInt(numberPart, 10) || 0;
          });

        const nextNumber = existingNumbers.length > 0
          ? Math.max(...existingNumbers) + 1
          : 1;

        return `${yearPrefix}${nextNumber.toString().padStart(4, '0')}`;
      },

      syncInvoices: async () => {
        await get().fetchInvoices();
      },

      clearLocalCache: () => {
        set({
          invoices: [],
          syncStatus: 'idle',
          lastSyncTime: null,
        });
      },
    }),
    {
      name: 'invoice-store-supabase',
      partialize: (state) => ({
        invoices: state.invoices,
      }),
    }
  )
);

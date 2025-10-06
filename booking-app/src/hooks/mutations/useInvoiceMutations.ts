import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Invoice, Payment } from '@/types';

export function useInvoiceMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const createInvoice = useMutation({
    mutationFn: async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          quote_id: invoiceData.quoteId,
          customer_id: invoiceData.customerId,
          customer_name: invoiceData.customerName,
          customer_email: invoiceData.customerEmail,
          customer_address: invoiceData.customerAddress,
          issue_date: invoiceData.issueDate,
          due_date: invoiceData.dueDate,
          status: invoiceData.status,
          items: invoiceData.items,
          subtotal: invoiceData.subtotal,
          tax_rate: invoiceData.taxRate,
          tax_amount: invoiceData.taxAmount,
          discount_amount: invoiceData.discountAmount || 0,
          total: invoiceData.total,
          paid_amount: invoiceData.paidAmount || 0,
          remaining_amount: invoiceData.remainingAmount || invoiceData.total,
          currency: invoiceData.currency || 'USD',
          notes: invoiceData.notes,
          terms: invoiceData.terms,
          payments: invoiceData.payments || [],
          sent_at: invoiceData.sentAt,
          viewed_at: invoiceData.viewedAt,
          paid_at: invoiceData.paidAt,
          overdue_at: invoiceData.overdueAt,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Invoice> }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: any = {};
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.items !== undefined) updateData.items = updates.items;
      if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
      if (updates.taxRate !== undefined) updateData.tax_rate = updates.taxRate;
      if (updates.taxAmount !== undefined) updateData.tax_amount = updates.taxAmount;
      if (updates.discountAmount !== undefined) updateData.discount_amount = updates.discountAmount;
      if (updates.total !== undefined) updateData.total = updates.total;
      if (updates.paidAmount !== undefined) updateData.paid_amount = updates.paidAmount;
      if (updates.remainingAmount !== undefined) updateData.remaining_amount = updates.remainingAmount;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.terms !== undefined) updateData.terms = updates.terms;
      if (updates.payments !== undefined) updateData.payments = updates.payments;
      if (updates.sentAt !== undefined) updateData.sent_at = updates.sentAt;
      if (updates.viewedAt !== undefined) updateData.viewed_at = updates.viewedAt;
      if (updates.paidAt !== undefined) updateData.paid_at = updates.paidAt;
      if (updates.overdueAt !== undefined) updateData.overdue_at = updates.overdueAt;

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
    },
  });

  const markInvoiceAsSent = useMutation({
    mutationFn: async (invoiceId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
    },
  });

  const markInvoiceAsViewed = useMutation({
    mutationFn: async (invoiceId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('invoices')
        .update({
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
    },
  });

  const markInvoiceAsPaid = useMutation({
    mutationFn: async ({
      id,
      paymentMethod,
      transactionId
    }: {
      id: string;
      paymentMethod: string;
      transactionId?: string
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First get the invoice to access current data
      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Create payment record
      const payment: Payment = {
        id: crypto.randomUUID(),
        amount: invoice.remaining_amount || invoice.total,
        method: paymentMethod as Payment['method'],
        status: 'completed',
        processedDate: new Date().toISOString(),
        transactionId: transactionId || `TXN-${Date.now()}`,
      };

      // Update invoice
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_amount: invoice.total,
          remaining_amount: 0,
          paid_at: new Date().toISOString(),
          payments: [...(invoice.payments || []), payment],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
    },
  });

  const addPayment = useMutation({
    mutationFn: async ({
      invoiceId,
      payment
    }: {
      invoiceId: string;
      payment: Omit<Payment, 'id'>
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current invoice
      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const newPayment: Payment = {
        ...payment,
        id: crypto.randomUUID(),
      };

      const newPaidAmount = (invoice.paid_amount || 0) + payment.amount;
      const newRemainingAmount = invoice.total - newPaidAmount;
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';

      const { error } = await supabase
        .from('invoices')
        .update({
          payments: [...(invoice.payments || []), newPayment],
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : invoice.paid_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
    },
  });

  const voidInvoice = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'void',
          notes: reason ? `VOIDED: ${reason}` : 'VOIDED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
    },
  });

  const generateInvoiceFromQuote = useMutation({
    mutationFn: async ({
      quoteId,
      customerData,
      terms,
      dueDays = 30
    }: {
      quoteId: string;
      customerData: {
        customerId: string;
        customerName: string;
        customerEmail: string;
        customerAddress?: string;
      };
      terms?: string;
      dueDays?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get quote data
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .eq('user_id', user.id)
        .single();

      if (quoteError) throw quoteError;

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

      // Calculate dates
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Transform quote items to invoice items
      const invoiceItems = quote.items.map((item: any) => ({
        id: crypto.randomUUID(),
        description: item.name || item.description || 'Travel Service',
        quantity: item.quantity || 1,
        unitPrice: item.price,
        total: item.price * (item.quantity || 1),
        taxRate: 0,
        taxAmount: 0,
      }));

      const subtotal = invoiceItems.reduce((sum: number, item: any) => sum + item.total, 0);
      const taxRate = 0; // Can be configured
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          quote_id: quoteId,
          customer_id: customerData.customerId,
          customer_name: customerData.customerName,
          customer_email: customerData.customerEmail,
          customer_address: customerData.customerAddress,
          issue_date: issueDate,
          due_date: dueDate,
          status: 'draft',
          items: invoiceItems,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          discount_amount: 0,
          total,
          paid_amount: 0,
          remaining_amount: total,
          currency: 'USD',
          terms: terms || 'Net 30',
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
    },
  });

  return {
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markInvoiceAsSent,
    markInvoiceAsViewed,
    markInvoiceAsPaid,
    addPayment,
    voidInvoice,
    generateInvoiceFromQuote,
  };
}
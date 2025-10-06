import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Commission } from '@/types/financial';

export function useCommissionMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const createCommission = useMutation({
    mutationFn: async (commissionData: Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('commissions')
        .insert({
          user_id: user.id,
          agent_id: commissionData.agentId,
          agent_name: commissionData.agentName,
          booking_id: commissionData.bookingId,
          quote_id: commissionData.quoteId,
          invoice_id: commissionData.invoiceId,
          customer_id: commissionData.customerId,
          customer_name: commissionData.customerName,
          booking_amount: commissionData.bookingAmount,
          commission_rate: commissionData.commissionRate,
          commission_amount: commissionData.commissionAmount,
          currency: commissionData.currency || 'USD',
          status: commissionData.status || 'pending',
          payment_method: commissionData.paymentMethod,
          paid_at: commissionData.paidAt,
          transaction_id: commissionData.transactionId,
          notes: commissionData.notes,
          booking_type: commissionData.bookingType,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions', user?.id] });
    },
  });

  const updateCommission = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Commission> }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: any = {};
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
      if (updates.paidAt !== undefined) updateData.paid_at = updates.paidAt;
      if (updates.transactionId !== undefined) updateData.transaction_id = updates.transactionId;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.commissionRate !== undefined) updateData.commission_rate = updates.commissionRate;
      if (updates.commissionAmount !== undefined) updateData.commission_amount = updates.commissionAmount;

      const { error } = await supabase
        .from('commissions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions', user?.id] });
    },
  });

  const deleteCommission = useMutation({
    mutationFn: async (commissionId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('commissions')
        .delete()
        .eq('id', commissionId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions', user?.id] });
    },
  });

  const markAsPaid = useMutation({
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

      const { error } = await supabase
        .from('commissions')
        .update({
          status: 'paid',
          payment_method: paymentMethod,
          transaction_id: transactionId || `TXN-${Date.now()}`,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions', user?.id] });
    },
  });

  const approve = useMutation({
    mutationFn: async (commissionId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('commissions')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', commissionId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions', user?.id] });
    },
  });

  const bulkApprove = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('commissions')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions', user?.id] });
    },
  });

  const bulkMarkAsPaid = useMutation({
    mutationFn: async ({
      ids,
      paymentMethod
    }: {
      ids: string[];
      paymentMethod: string
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('commissions')
        .update({
          status: 'paid',
          payment_method: paymentMethod,
          paid_at: new Date().toISOString(),
          transaction_id: `BULK-TXN-${Date.now()}`,
          updated_at: new Date().toISOString(),
        })
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions', user?.id] });
    },
  });

  const generateCommissionFromBooking = useMutation({
    mutationFn: async ({
      agentId,
      agentName,
      bookingId,
      quoteId,
      invoiceId,
      customerId,
      customerName,
      bookingAmount,
      bookingType,
      quoteCommissionRate,
    }: {
      agentId: string;
      agentName: string;
      bookingId: string;
      quoteId?: string;
      invoiceId?: string;
      customerId: string;
      customerName: string;
      bookingAmount: number;
      bookingType?: string;
      quoteCommissionRate?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Calculate commission rate based on booking type if not provided
      const defaultRates: Record<string, number> = {
        hotel: 10,
        flight: 5,
        activity: 12,
        transfer: 8,
      };

      const commissionRate = quoteCommissionRate || defaultRates[bookingType || 'hotel'] || 10;
      const commissionAmount = (bookingAmount * commissionRate) / 100;

      const { data, error } = await supabase
        .from('commissions')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          agent_name: agentName,
          booking_id: bookingId,
          quote_id: quoteId,
          invoice_id: invoiceId,
          customer_id: customerId,
          customer_name: customerName,
          booking_amount: bookingAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          currency: 'USD',
          status: 'pending',
          booking_type: bookingType || 'hotel',
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions', user?.id] });
    },
  });

  return {
    createCommission,
    updateCommission,
    deleteCommission,
    approve,
    bulkApprove,
    markAsPaid,
    bulkMarkAsPaid,
    generateCommissionFromBooking,
  };
}
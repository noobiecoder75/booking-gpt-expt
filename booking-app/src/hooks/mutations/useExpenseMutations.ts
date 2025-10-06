import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Expense } from '@/types/financial';

export function useExpenseMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const addExpense = useMutation({
    mutationFn: async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Transform camelCase to snake_case for Supabase
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          category: expenseData.category,
          subcategory: expenseData.subcategory,
          amount: expenseData.amount,
          currency: expenseData.currency || 'USD',
          description: expenseData.description,
          date: expenseData.date,
          vendor: expenseData.vendor,
          supplier_id: expenseData.supplierId,
          receipt_url: expenseData.receiptUrl,
          approved_by: expenseData.approvedBy,
          approved_date: expenseData.approvedDate,
          status: expenseData.status || 'pending',
          payment_method: expenseData.paymentMethod,
          is_recurring: expenseData.isRecurring || false,
          recurring_frequency: expenseData.recurringFrequency,
          booking_id: expenseData.bookingId,
          agent_id: expenseData.agentId,
          tags: expenseData.tags,
          notes: expenseData.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Expense> }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Transform camelCase to snake_case for Supabase
      const updateData: any = {};
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.vendor !== undefined) updateData.vendor = updates.vendor;
      if (updates.supplierId !== undefined) updateData.supplier_id = updates.supplierId;
      if (updates.receiptUrl !== undefined) updateData.receipt_url = updates.receiptUrl;
      if (updates.approvedBy !== undefined) updateData.approved_by = updates.approvedBy;
      if (updates.approvedDate !== undefined) updateData.approved_date = updates.approvedDate;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
      if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring;
      if (updates.recurringFrequency !== undefined) updateData.recurring_frequency = updates.recurringFrequency;
      if (updates.bookingId !== undefined) updateData.booking_id = updates.bookingId;
      if (updates.agentId !== undefined) updateData.agent_id = updates.agentId;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] });
    },
  });

  const approveExpense = useMutation({
    mutationFn: async ({ id, approvedBy }: { id: string; approvedBy: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('expenses')
        .update({
          approved_by: approvedBy,
          approved_date: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] });
    },
  });

  const bulkApproveExpenses = useMutation({
    mutationFn: async ({ ids, approvedBy }: { ids: string[]; approvedBy: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const approvedDate = new Date().toISOString();

      const { error } = await supabase
        .from('expenses')
        .update({
          approved_by: approvedBy,
          approved_date: approvedDate,
        })
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] });
    },
  });

  return {
    addExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    bulkApproveExpenses,
  };
}

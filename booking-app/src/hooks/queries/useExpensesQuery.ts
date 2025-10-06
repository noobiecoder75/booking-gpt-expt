import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Expense } from '@/types/financial';

// Fetch all expenses for the authenticated user
export function useExpensesQuery() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Transform snake_case to camelCase
      return (data || []).map((expense: any) => ({
        id: expense.id,
        category: expense.category,
        subcategory: expense.subcategory,
        amount: parseFloat(expense.amount),
        currency: expense.currency,
        description: expense.description,
        date: expense.date,
        vendor: expense.vendor,
        supplierId: expense.supplier_id,
        receiptUrl: expense.receipt_url,
        approvedBy: expense.approved_by,
        approvedDate: expense.approved_date,
        status: expense.status,
        paymentMethod: expense.payment_method,
        isRecurring: expense.is_recurring,
        recurringFrequency: expense.recurring_frequency,
        bookingId: expense.booking_id,
        agentId: expense.agent_id,
        tags: expense.tags,
        notes: expense.notes,
        createdAt: expense.created_at,
        updatedAt: expense.updated_at,
      })) as Expense[];
    },
    enabled: !!user?.id,
  });
}

// Fetch a single expense by ID
export function useExpenseByIdQuery(expenseId: string | undefined) {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      if (!expenseId || !user?.id) return null;

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Transform snake_case to camelCase
      return {
        id: data.id,
        category: data.category,
        subcategory: data.subcategory,
        amount: parseFloat(data.amount),
        currency: data.currency,
        description: data.description,
        date: data.date,
        vendor: data.vendor,
        supplierId: data.supplier_id,
        receiptUrl: data.receipt_url,
        approvedBy: data.approved_by,
        approvedDate: data.approved_date,
        status: data.status,
        paymentMethod: data.payment_method,
        isRecurring: data.is_recurring,
        recurringFrequency: data.recurring_frequency,
        bookingId: data.booking_id,
        agentId: data.agent_id,
        tags: data.tags,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Expense;
    },
    enabled: !!expenseId && !!user?.id,
  });
}

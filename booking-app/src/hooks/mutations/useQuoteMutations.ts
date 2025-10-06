import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { TravelQuote, TravelItem } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

export function useQuoteMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  const addQuote = useMutation({
    mutationFn: async (quote: Omit<TravelQuote, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          contact_id: quote.contactId,
          title: quote.title,
          status: quote.status,
          total_amount: quote.totalCost,
          items: quote.items || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', user?.id] });
    },
  });

  const updateQuote = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TravelQuote> }) => {
      const dbUpdate: any = {};

      if (updates.contactId !== undefined) dbUpdate.contact_id = updates.contactId;
      if (updates.title !== undefined) dbUpdate.title = updates.title;
      if (updates.status !== undefined) dbUpdate.status = updates.status;
      if (updates.totalCost !== undefined) dbUpdate.total_amount = updates.totalCost;
      if (updates.items !== undefined) dbUpdate.items = updates.items;

      const { error } = await supabase
        .from('quotes')
        .update(dbUpdate)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', user?.id] });
    },
  });

  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', user?.id] });
    },
  });

  const updateQuoteStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TravelQuote['status'] }) => {
      const { error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', user?.id] });
    },
  });

  return {
    addQuote,
    updateQuote,
    deleteQuote,
    updateQuoteStatus,
  };
}

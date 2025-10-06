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
          quote_number: `Q-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          title: quote.title,
          status: quote.status,
          total_amount: quote.totalCost,
          currency: 'USD',
          items: quote.items || [],
          notes: null,
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

  const addItemToQuote = useMutation({
    mutationFn: async ({ quoteId, item }: { quoteId: string; item: Omit<TravelItem, 'id'> }) => {
      console.log('[addItemToQuote] START - quoteId:', quoteId);
      console.log('[addItemToQuote] - item to add:', item);

      // Fetch current quote to get items
      const { data: quote, error: fetchError } = await supabase
        .from('quotes')
        .select('items')
        .eq('id', quoteId)
        .single();

      if (fetchError) {
        console.error('[addItemToQuote] Fetch error:', fetchError);
        throw fetchError;
      }

      const items = quote.items || [];
      const newItem = { ...item, id: crypto.randomUUID() };
      const updatedItems = [...items, newItem];

      console.log('[addItemToQuote] - Current items from DB:', items);
      console.log('[addItemToQuote] - New item with ID:', newItem);
      console.log('[addItemToQuote] - Updated items array:', updatedItems);

      // Update quote with new items array
      const { error } = await supabase
        .from('quotes')
        .update({ items: updatedItems })
        .eq('id', quoteId);

      if (error) {
        console.error('[addItemToQuote] Update error:', error);
        throw error;
      }

      console.log('[addItemToQuote] ✓ SUCCESS - Item added to database');
      return newItem.id;
    },
    onSuccess: () => {
      console.log('[addItemToQuote] onSuccess - Invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['quotes', user?.id] });
    },
    onError: (error) => {
      console.error('[addItemToQuote] onError - Mutation failed:', error);
    },
  });

  const updateItemInQuote = useMutation({
    mutationFn: async ({ quoteId, itemId, updates }: { quoteId: string; itemId: string; updates: Partial<TravelItem> }) => {
      // Fetch current quote to get items
      const { data: quote, error: fetchError } = await supabase
        .from('quotes')
        .select('items')
        .eq('id', quoteId)
        .single();

      if (fetchError) throw fetchError;

      const items = quote.items || [];
      const updatedItems = items.map((item: TravelItem) =>
        item.id === itemId ? { ...item, ...updates } : item
      );

      // Update quote with modified items array
      const { error } = await supabase
        .from('quotes')
        .update({ items: updatedItems })
        .eq('id', quoteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', user?.id] });
    },
  });

  const removeItemFromQuote = useMutation({
    mutationFn: async ({ quoteId, itemId }: { quoteId: string; itemId: string }) => {
      // Fetch current quote to get items
      const { data: quote, error: fetchError } = await supabase
        .from('quotes')
        .select('items')
        .eq('id', quoteId)
        .single();

      if (fetchError) throw fetchError;

      const items = quote.items || [];
      const updatedItems = items.filter((item: TravelItem) => item.id !== itemId);

      // Update quote with filtered items array
      const { error } = await supabase
        .from('quotes')
        .update({ items: updatedItems })
        .eq('id', quoteId);

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
    addItemToQuote,
    updateItemInQuote,
    removeItemFromQuote,
  };
}

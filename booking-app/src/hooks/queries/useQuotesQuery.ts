import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { TravelQuote } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

function dbRowToQuote(row: any): TravelQuote {
  console.log('[useQuotesQuery] Converting DB row to quote:', row.id);
  console.log('[useQuotesQuery] Raw DB row:', row);
  console.log('[useQuotesQuery] Items from DB:', row.items);
  console.log('[useQuotesQuery] Items type:', typeof row.items, 'Is array:', Array.isArray(row.items));

  const items = row.items || [];
  console.log('[useQuotesQuery] Final items array:', items, 'Length:', items.length);

  const quote = {
    id: row.id,
    contactId: row.contact_id,
    title: row.title,
    status: row.status as TravelQuote['status'],
    totalCost: parseFloat(row.total_amount),
    items: items,
    travelDates: items && items.length > 0
      ? {
          start: new Date(items[0].startDate || row.created_at),
          end: new Date(items[items.length - 1].endDate || row.created_at),
        }
      : {
          start: new Date(),
          end: new Date(),
        },
    createdAt: new Date(row.created_at),
  };

  console.log('[useQuotesQuery] Converted quote:', quote);
  return quote;
}

async function fetchQuotes(): Promise<TravelQuote[]> {
  console.log('[useQuotesQuery] Fetching quotes from Supabase...');
  const supabase = getSupabaseBrowserClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('[useQuotesQuery] User not authenticated');
    throw new Error('Not authenticated');
  }

  console.log('[useQuotesQuery] Fetching quotes for user:', user.id);

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[useQuotesQuery] Error fetching quotes:', error);
    throw error;
  }

  console.log('[useQuotesQuery] Raw data from Supabase:', data);
  console.log('[useQuotesQuery] Number of quotes fetched:', data?.length || 0);

  const quotes = (data || []).map(dbRowToQuote);
  console.log('[useQuotesQuery] Final converted quotes:', quotes);

  return quotes;
}

export function useQuotesQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quotes', user?.id],
    queryFn: fetchQuotes,
    enabled: !!user,
  });
}

export function useQuoteByIdQuery(quoteId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['quotes', user?.id, quoteId],
    queryFn: async () => {
      // Try to get from cache first
      const quotes = queryClient.getQueryData<TravelQuote[]>(['quotes', user?.id]);
      if (quotes) {
        const quote = quotes.find(q => q.id === quoteId);
        if (quote) return quote;
      }

      // Fetch from server if not in cache
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (error) throw error;
      return dbRowToQuote(data);
    },
    enabled: !!user && !!quoteId,
  });
}

export function useQuotesByContactQuery(contactId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quotes', user?.id, 'contact', contactId],
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(dbRowToQuote);
    },
    enabled: !!user && !!contactId,
  });
}

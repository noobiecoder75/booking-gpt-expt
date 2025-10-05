import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { TravelQuote, TravelItem, CalendarEvent } from '@/types';
import { generateClientQuoteLink, generatePreviewLink } from '@/lib/client-links';
import { debounce } from '@/lib/utils';

interface QuoteStats {
  totalQuotes: number;
  draftQuotes: number;
  sentQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  totalRevenue: number;
  averageQuoteValue: number;
}

interface QuoteStore {
  // Local cache
  quotes: TravelQuote[];
  currentQuote: TravelQuote | null;
  calendarEventsCache: {
    data: CalendarEvent[];
    quotesHash: string;
    contactId?: string;
    statusFilters?: TravelQuote['status'][];
  } | null;

  // Sync status
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;

  // Actions
  fetchQuotes: () => Promise<void>;
  addQuote: (quote: Omit<TravelQuote, 'id' | 'createdAt'>) => Promise<string>;
  updateQuote: (id: string, updates: Partial<TravelQuote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  getQuoteById: (id: string) => TravelQuote | undefined;
  getQuotesByContact: (contactId: string) => TravelQuote[];
  setCurrentQuote: (quote: TravelQuote | null) => void;
  addItemToQuote: (quoteId: string, item: Omit<TravelItem, 'id'>) => Promise<void>;
  updateItemInQuote: (quoteId: string, itemId: string, updates: Partial<TravelItem>) => Promise<void>;
  removeItemFromQuote: (quoteId: string, itemId: string) => Promise<void>;
  calculateQuoteTotal: (quoteId: string) => number;
  getCalendarEvents: (contactId?: string, statusFilters?: TravelQuote['status'][]) => CalendarEvent[];
  getQuotesByStatus: (status: TravelQuote['status']) => TravelQuote[];
  getQuotesByDateRange: (startDate: Date, endDate: Date) => TravelQuote[];
  getQuotesStats: () => QuoteStats;
  duplicateQuote: (quoteId: string) => Promise<string | null>;
  updateQuoteStatus: (quoteId: string, status: TravelQuote['status']) => Promise<void>;
  searchQuotes: (query: string) => TravelQuote[];
  generateClientLink: (quoteId: string) => string | null;
  generatePreviewLink: (quoteId: string) => string | null;
  sendQuoteToClient: (quoteId: string) => Promise<boolean>;
  generateInvoiceFromAcceptedQuote: (quoteId: string) => string | null;
  syncQuotes: () => Promise<void>;
  clearLocalCache: () => void;
}

// Helper: Convert database row to TravelQuote
function dbRowToQuote(row: any): TravelQuote {
  return {
    id: row.id,
    contactId: row.contact_id,
    title: row.title,
    status: row.status as TravelQuote['status'],
    totalCost: parseFloat(row.total_amount),
    items: row.items || [],
    travelDates: row.items && row.items.length > 0
      ? {
          start: new Date(row.items[0].startDate || row.created_at),
          end: new Date(row.items[row.items.length - 1].endDate || row.created_at),
        }
      : {
          start: new Date(),
          end: new Date(),
        },
    createdAt: new Date(row.created_at),
  };
}

// Helper: Convert TravelQuote to database insert
function quoteToDbInsert(quote: Omit<TravelQuote, 'id' | 'createdAt'>, userId: string): any {
  return {
    user_id: userId,
    contact_id: quote.contactId,
    quote_number: `Q-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    title: quote.title,
    status: quote.status,
    total_amount: quote.totalCost,
    currency: 'USD',
    items: quote.items,
    notes: null,
  };
}

// Helper: Convert TravelQuote updates to database update
function quoteToDbUpdate(updates: Partial<TravelQuote>): any {
  const dbUpdate: any = {};

  if (updates.title !== undefined) dbUpdate.title = updates.title;
  if (updates.status !== undefined) dbUpdate.status = updates.status;
  if (updates.totalCost !== undefined) dbUpdate.total_amount = updates.totalCost;
  if (updates.items !== undefined) dbUpdate.items = updates.items;
  if (updates.contactId !== undefined) dbUpdate.contact_id = updates.contactId;

  return dbUpdate;
}

const debouncedCalculateTotal = debounce((quoteId: unknown, getState: unknown, updateQuote: unknown) => {
  const getStateFn = getState as () => QuoteStore;
  const updateQuoteFn = updateQuote as (id: string, updates: Partial<TravelQuote>) => Promise<void>;
  const quoteIdStr = quoteId as string;

  const quote = getStateFn().quotes.find((q) => q.id === quoteIdStr);
  if (!quote) return 0;

  const total = quote.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  updateQuoteFn(quoteIdStr, { totalCost: total });
  return total;
}, 300);

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      quotes: [],
      currentQuote: null,
      calendarEventsCache: null,
      syncStatus: 'idle',
      lastSyncTime: null,

      fetchQuotes: async () => {
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
            .from('quotes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const quotes = data.map(dbRowToQuote);

          set({
            quotes,
            syncStatus: 'idle',
            lastSyncTime: new Date(),
            calendarEventsCache: null,
          });
        } catch (error) {
          console.error('Failed to fetch quotes:', error);
          set({ syncStatus: 'error' });
        }
      },

      addQuote: async (quoteData) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No authenticated user');

          const dbInsert = quoteToDbInsert(quoteData, user.id);

          const { data, error } = await supabase
            .from('quotes')
            .insert(dbInsert)
            .select()
            .single();

          if (error) throw error;

          const newQuote = dbRowToQuote(data);

          set((state) => ({
            quotes: [newQuote, ...state.quotes],
            syncStatus: 'idle',
            lastSyncTime: new Date(),
            calendarEventsCache: null,
          }));

          return newQuote.id;
        } catch (error) {
          console.error('Failed to create quote:', error);
          set({ syncStatus: 'error' });

          // Fallback to local
          const localQuote: TravelQuote = {
            ...quoteData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
          };

          set((state) => ({
            quotes: [localQuote, ...state.quotes],
            calendarEventsCache: null,
          }));

          return localQuote.id;
        }
      },

      updateQuote: async (id, updates) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const dbUpdate = quoteToDbUpdate(updates);

          const { data, error } = await supabase
            .from('quotes')
            .update(dbUpdate)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const updatedQuote = dbRowToQuote(data);

          set((state) => ({
            quotes: state.quotes.map((quote) =>
              quote.id === id ? updatedQuote : quote
            ),
            currentQuote: state.currentQuote?.id === id ? updatedQuote : state.currentQuote,
            syncStatus: 'idle',
            lastSyncTime: new Date(),
            calendarEventsCache: null,
          }));
        } catch (error) {
          console.error('Failed to update quote:', error);
          set({ syncStatus: 'error' });

          // Update local cache only
          set((state) => ({
            quotes: state.quotes.map((quote) =>
              quote.id === id ? { ...quote, ...updates } : quote
            ),
            currentQuote: state.currentQuote?.id === id
              ? { ...state.currentQuote, ...updates }
              : state.currentQuote,
            calendarEventsCache: null,
          }));
        }
      },

      deleteQuote: async (id) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { error } = await supabase
            .from('quotes')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            quotes: state.quotes.filter((quote) => quote.id !== id),
            currentQuote: state.currentQuote?.id === id ? null : state.currentQuote,
            syncStatus: 'idle',
            lastSyncTime: new Date(),
            calendarEventsCache: null,
          }));
        } catch (error) {
          console.error('Failed to delete quote:', error);
          set({ syncStatus: 'error' });

          // Delete from local cache only
          set((state) => ({
            quotes: state.quotes.filter((quote) => quote.id !== id),
            currentQuote: state.currentQuote?.id === id ? null : state.currentQuote,
            calendarEventsCache: null,
          }));
        }
      },

      getQuoteById: (id) => {
        return get().quotes.find((quote) => quote.id === id);
      },

      getQuotesByContact: (contactId) => {
        return get().quotes.filter((quote) => quote.contactId === contactId);
      },

      setCurrentQuote: (quote) => {
        set({ currentQuote: quote });
      },

      addItemToQuote: async (quoteId, itemData) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return;

        const newItem: TravelItem = {
          ...itemData,
          id: crypto.randomUUID(),
        };

        const updatedItems = [...quote.items, newItem];
        await get().updateQuote(quoteId, { items: updatedItems });

        debouncedCalculateTotal(quoteId, get, get().updateQuote);
      },

      updateItemInQuote: async (quoteId, itemId, updates) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return;

        const updatedItems = quote.items.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );

        await get().updateQuote(quoteId, { items: updatedItems });

        debouncedCalculateTotal(quoteId, get, get().updateQuote);
      },

      removeItemFromQuote: async (quoteId, itemId) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return;

        const updatedItems = quote.items.filter((item) => item.id !== itemId);

        await get().updateQuote(quoteId, { items: updatedItems });

        debouncedCalculateTotal(quoteId, get, get().updateQuote);
      },

      calculateQuoteTotal: (quoteId) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return 0;

        const total = quote.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        get().updateQuote(quoteId, { totalCost: total });
        return total;
      },

      getCalendarEvents: (contactId, statusFilters) => {
        const { quotes, calendarEventsCache } = get();

        const activeStatusFilters = statusFilters && statusFilters.length > 0
          ? statusFilters
          : ['draft', 'sent', 'accepted', 'rejected'] as TravelQuote['status'][];

        const quotesHash = JSON.stringify(quotes.map(q => ({ id: q.id, items: q.items.length, updated: q.createdAt })));

        if (
          calendarEventsCache &&
          calendarEventsCache.quotesHash === quotesHash &&
          calendarEventsCache.contactId === contactId &&
          JSON.stringify(calendarEventsCache.statusFilters) === JSON.stringify(activeStatusFilters)
        ) {
          return calendarEventsCache.data;
        }

        let filteredQuotes = quotes;

        if (contactId) {
          filteredQuotes = filteredQuotes.filter(quote => quote.contactId === contactId);
        }

        filteredQuotes = filteredQuotes.filter(quote =>
          activeStatusFilters.includes(quote.status)
        );

        const events = filteredQuotes.flatMap(quote =>
          quote.items.map(item => ({
            id: item.id,
            title: item.name,
            start: new Date(item.startDate),
            end: new Date(item.endDate || item.startDate),
            resource: {
              type: item.type,
              contactId: quote.contactId,
              quoteId: quote.id,
              details: item.details,
            },
          }))
        );

        queueMicrotask(() => {
          set({
            calendarEventsCache: {
              data: events,
              quotesHash,
              contactId,
              statusFilters: activeStatusFilters,
            },
          });
        });

        return events;
      },

      getQuotesByStatus: (status) => {
        return get().quotes.filter(quote => quote.status === status);
      },

      getQuotesByDateRange: (startDate, endDate) => {
        return get().quotes.filter(quote => {
          const quoteDate = new Date(quote.createdAt);
          return quoteDate >= startDate && quoteDate <= endDate;
        });
      },

      getQuotesStats: () => {
        const { quotes } = get();
        const stats = quotes.reduce(
          (acc, quote) => {
            acc.totalQuotes++;
            acc[`${quote.status}Quotes`]++;
            if (quote.status === 'accepted') {
              acc.totalRevenue += quote.totalCost;
            }
            return acc;
          },
          {
            totalQuotes: 0,
            draftQuotes: 0,
            sentQuotes: 0,
            acceptedQuotes: 0,
            rejectedQuotes: 0,
            totalRevenue: 0,
          }
        );

        return {
          ...stats,
          averageQuoteValue: stats.totalQuotes > 0
            ? quotes.reduce((sum, quote) => sum + quote.totalCost, 0) / stats.totalQuotes
            : 0,
        };
      },

      duplicateQuote: async (quoteId) => {
        const originalQuote = get().getQuoteById(quoteId);
        if (!originalQuote) return null;

        const duplicatedQuote = {
          ...originalQuote,
          title: `${originalQuote.title} (Copy)`,
          status: 'draft' as const,
        };

        const { id, createdAt, ...quoteData } = duplicatedQuote;
        return await get().addQuote(quoteData);
      },

      updateQuoteStatus: async (quoteId, status) => {
        await get().updateQuote(quoteId, { status });
      },

      searchQuotes: (query) => {
        const { quotes } = get();
        if (!query.trim()) return quotes;

        const lowercaseQuery = query.toLowerCase();
        return quotes.filter(quote =>
          quote.title.toLowerCase().includes(lowercaseQuery) ||
          quote.items.some(item => item.name.toLowerCase().includes(lowercaseQuery))
        );
      },

      generateClientLink: (quoteId) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return null;
        return generateClientQuoteLink(quote);
      },

      generatePreviewLink: (quoteId) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return null;
        return generatePreviewLink(quote);
      },

      sendQuoteToClient: async (quoteId) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return false;

        try {
          await get().updateQuoteStatus(quoteId, 'sent');

          console.log('Quote sent to client:', {
            quoteId,
            clientLink: generateClientQuoteLink(quote)
          });

          return true;
        } catch (error) {
          console.error('Failed to send quote to client:', error);
          return false;
        }
      },

      generateInvoiceFromAcceptedQuote: (quoteId) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) {
          console.error('Cannot generate invoice: Quote not found');
          return null;
        }

        if (quote.status !== 'accepted') {
          console.error('Cannot generate invoice: Quote status is not "accepted"');
          return null;
        }

        console.log('✅ Invoice generation requested for accepted quote:', quoteId);
        return crypto.randomUUID();
      },

      syncQuotes: async () => {
        await get().fetchQuotes();
      },

      clearLocalCache: () => {
        set({
          quotes: [],
          currentQuote: null,
          calendarEventsCache: null,
          syncStatus: 'idle',
          lastSyncTime: null,
        });
      },
    }),
    {
      name: 'quote-store-supabase',
      partialize: (state) => ({
        quotes: state.quotes,
        currentQuote: state.currentQuote,
      }),
    }
  )
);

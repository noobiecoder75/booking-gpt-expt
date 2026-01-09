import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { BookingTask } from '@/types/task';

export function useTasksQuery() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BookingTask[];
    },
    enabled: !!user,
  });
}

export function useBookingTasksQuery(bookingId?: string | null, quoteId?: string | null) {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['tasks', 'booking', bookingId, quoteId],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!bookingId && !quoteId) return [];

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (bookingId) {
        query = query.eq('booking_id', bookingId);
      } else if (quoteId) {
        query = query.eq('quote_id', quoteId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BookingTask[];
    },
    enabled: !!user && (!!bookingId || !!quoteId),
  });
}

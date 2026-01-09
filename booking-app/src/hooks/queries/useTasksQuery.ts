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
      
      // Transform snake_case from DB to camelCase for the UI
      return (data || []).map((task: any) => ({
        ...task,
        quoteId: task.quote_id,
        quoteItemId: task.quote_item_id,
        bookingId: task.booking_id,
        itemType: task.item_type,
        itemName: task.item_name,
        customerName: task.customer_name,
        assignedToName: task.assigned_to_name,
        completedAt: task.completed_at,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      })) as BookingTask[];
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

      if (bookingId && quoteId) {
        query = query.or(`booking_id.eq.${bookingId},quote_id.eq.${quoteId}`);
      } else if (bookingId) {
        query = query.eq('booking_id', bookingId);
      } else if (quoteId) {
        query = query.eq('quote_id', quoteId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform snake_case from DB to camelCase for the UI
      return (data || []).map((task: any) => ({
        ...task,
        quoteId: task.quote_id,
        quoteItemId: task.quote_item_id,
        bookingId: task.booking_id,
        itemType: task.item_type,
        itemName: task.item_name,
        customerName: task.customer_name,
        assignedToName: task.assigned_to_name,
        completedAt: task.completed_at,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      })) as BookingTask[];
    },
    enabled: !!user && (!!bookingId || !!quoteId),
  });
}

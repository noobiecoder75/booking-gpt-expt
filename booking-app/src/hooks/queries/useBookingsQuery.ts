import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Booking, BookingItem } from '@/types/booking';

/**
 * Fetch all bookings for the current user with their items and contact details
 */
export function useBookingsQuery() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Fetch bookings with contact information
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          quote_id,
          contact_id,
          booking_reference,
          status,
          total_amount,
          currency,
          payment_status,
          notes,
          created_at,
          updated_at,
          contacts (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('[useBookingsQuery] Failed to fetch bookings:', bookingsError);
        throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
      }

      if (!bookings || bookings.length === 0) {
        return [];
      }

      // Fetch all booking items for these bookings
      const bookingIds = bookings.map(b => b.id);
      const { data: allItems, error: itemsError } = await supabase
        .from('booking_items')
        .select('*')
        .in('booking_id', bookingIds)
        .order('start_date', { ascending: true });

      if (itemsError) {
        console.error('[useBookingsQuery] Failed to fetch booking items:', itemsError);
        throw new Error(`Failed to fetch booking items: ${itemsError.message}`);
      }

      // Group items by booking_id
      const itemsByBooking = (allItems || []).reduce((acc, item) => {
        if (!acc[item.booking_id]) {
          acc[item.booking_id] = [];
        }
        acc[item.booking_id].push({
          id: item.id,
          bookingId: item.booking_id,
          type: item.type,
          name: item.name,
          startDate: item.start_date,
          endDate: item.end_date,
          price: item.price,
          quantity: item.quantity,
          details: item.details,
          supplier: item.supplier,
          supplierSource: item.supplier_source,
          supplierCost: item.supplier_cost,
          clientPrice: item.client_price,
          platformFee: item.platform_fee,
          agentMarkup: item.agent_markup,
          bookingStatus: item.booking_status,
          confirmationNumber: item.confirmation_number,
          confirmedAt: item.confirmed_at,
          cancellationPolicy: item.cancellation_policy,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        });
        return acc;
      }, {} as Record<string, BookingItem[]>);

      // Combine bookings with their items and contact info
      const bookingsWithItems: Booking[] = bookings.map(booking => ({
        id: booking.id,
        userId: booking.user_id,
        quoteId: booking.quote_id,
        contactId: booking.contact_id,
        bookingReference: booking.booking_reference,
        status: booking.status,
        totalAmount: booking.total_amount,
        currency: booking.currency,
        paymentStatus: booking.payment_status,
        notes: booking.notes,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        items: itemsByBooking[booking.id] || [],
        contact: {
          id: booking.contacts?.id || '',
          name: booking.contacts?.name || 'Unknown',
          email: booking.contacts?.email || '',
          phone: booking.contacts?.phone || null,
        },
      }));

      console.log('[useBookingsQuery] Fetched bookings:', {
        count: bookingsWithItems.length,
        totalItems: allItems?.length || 0
      });

      return bookingsWithItems;
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch a single booking by ID with its items
 */
export function useBookingQuery(bookingId: string | null) {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!bookingId) throw new Error('Booking ID is required');

      // Fetch booking with contact information
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          quote_id,
          contact_id,
          booking_reference,
          status,
          total_amount,
          currency,
          payment_status,
          notes,
          created_at,
          updated_at,
          contacts (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .single();

      if (bookingError) {
        console.error('[useBookingQuery] Failed to fetch booking:', bookingError);
        throw new Error(`Failed to fetch booking: ${bookingError.message}`);
      }

      // Fetch booking items
      const { data: items, error: itemsError } = await supabase
        .from('booking_items')
        .select('*')
        .eq('booking_id', bookingId)
        .order('start_date', { ascending: true });

      if (itemsError) {
        console.error('[useBookingQuery] Failed to fetch booking items:', itemsError);
        throw new Error(`Failed to fetch booking items: ${itemsError.message}`);
      }

      const bookingWithItems: Booking = {
        id: booking.id,
        userId: booking.user_id,
        quoteId: booking.quote_id,
        contactId: booking.contact_id,
        bookingReference: booking.booking_reference,
        status: booking.status,
        totalAmount: booking.total_amount,
        currency: booking.currency,
        paymentStatus: booking.payment_status,
        notes: booking.notes,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        items: (items || []).map(item => ({
          id: item.id,
          bookingId: item.booking_id,
          type: item.type,
          name: item.name,
          startDate: item.start_date,
          endDate: item.end_date,
          price: item.price,
          quantity: item.quantity,
          details: item.details,
          supplier: item.supplier,
          supplierSource: item.supplier_source,
          supplierCost: item.supplier_cost,
          clientPrice: item.client_price,
          platformFee: item.platform_fee,
          agentMarkup: item.agent_markup,
          bookingStatus: item.booking_status,
          confirmationNumber: item.confirmation_number,
          confirmedAt: item.confirmed_at,
          cancellationPolicy: item.cancellation_policy,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })),
        contact: {
          id: booking.contacts?.id || '',
          name: booking.contacts?.name || 'Unknown',
          email: booking.contacts?.email || '',
          phone: booking.contacts?.phone || null,
        },
      };

      return bookingWithItems;
    },
    enabled: !!user?.id && !!bookingId,
  });
}

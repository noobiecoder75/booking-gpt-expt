import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { TravelItem } from '@/types';

export function useBookingMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  /**
   * Create a booking from an accepted quote
   * This creates both the booking record and copies all quote items to booking_items
   */
  const createBookingFromQuote = useMutation({
    mutationFn: async ({
      quoteId,
      contactId,
      items,
      totalAmount,
      status = 'booked'
    }: {
      quoteId: string;
      contactId: string;
      items: TravelItem[];
      totalAmount: number;
      status?: 'pending' | 'booked';
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Validate inputs
      if (!quoteId || !contactId || !items || items.length === 0) {
        throw new Error('Missing required booking data');
      }

      if (!totalAmount || totalAmount <= 0) {
        throw new Error('Invalid booking amount');
      }

      // Generate unique booking reference
      const bookingReference = `BKG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      console.log('[useBookingMutations] Creating booking:', {
        quoteId,
        contactId,
        itemCount: items.length,
        totalAmount,
        bookingReference
      });

      // Step 1: Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          quote_id: quoteId,
          contact_id: contactId,
          booking_reference: bookingReference,
          status: status,
          total_amount: totalAmount,
          currency: 'USD',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (bookingError) {
        console.error('[useBookingMutations] Booking creation failed:', bookingError);
        throw new Error(`Failed to create booking: ${bookingError.message}`);
      }

      console.log('[useBookingMutations] Booking created:', booking.id);

      // Step 2: Create booking items from quote items
      const bookingItems = items.map((item) => ({
        booking_id: booking.id,
        type: item.type,
        name: item.name,
        start_date: item.startDate,
        end_date: item.endDate || item.startDate,
        price: item.price,
        quantity: item.quantity || 1,
        details: item.details || {},
        supplier: item.supplier,
        supplier_source: item.supplierSource,
        supplier_cost: item.supplierCost,
        client_price: item.clientPrice || item.price,
        platform_fee: item.platformFee,
        agent_markup: item.agentMarkup,
        booking_status: 'booked', // Items are booked when booking is created
        confirmation_number: item.confirmationNumber,
        cancellation_policy: item.cancellationPolicy,
      }));

      const { error: itemsError } = await supabase
        .from('booking_items')
        .insert(bookingItems);

      if (itemsError) {
        console.error('[useBookingMutations] Booking items creation failed:', itemsError);

        // Rollback: Delete the booking since items failed
        await supabase.from('bookings').delete().eq('id', booking.id);

        throw new Error(`Failed to create booking items: ${itemsError.message}`);
      }

      console.log('[useBookingMutations] Booking items created:', bookingItems.length);

      return booking.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['quotes', user?.id] });
    },
  });

  /**
   * Update booking status
   */
  const updateBookingStatus = useMutation({
    mutationFn: async ({
      bookingId,
      status,
      notes
    }: {
      bookingId: string;
      status: 'pending' | 'confirmed' | 'booked' | 'cancelled' | 'completed';
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
    },
  });

  /**
   * Update booking payment status
   */
  const updatePaymentStatus = useMutation({
    mutationFn: async ({
      bookingId,
      paymentStatus
    }: {
      bookingId: string;
      paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
    },
  });

  /**
   * Cancel a booking
   */
  const cancelBooking = useMutation({
    mutationFn: async ({
      bookingId,
      reason
    }: {
      bookingId: string;
      reason?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Update booking status to cancelled
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (bookingError) throw bookingError;

      // Update all booking items to cancelled
      const { error: itemsError } = await supabase
        .from('booking_items')
        .update({
          booking_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);

      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
    },
  });

  /**
   * Delete a booking (admin only)
   */
  const deleteBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Booking items will be automatically deleted due to CASCADE
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
    },
  });

  return {
    createBookingFromQuote,
    updateBookingStatus,
    updatePaymentStatus,
    cancelBooking,
    deleteBooking,
  };
}

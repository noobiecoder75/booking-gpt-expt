import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bookAPIItem } from '@/lib/booking/processor';
import { TravelQuote, TravelItem } from '@/types';

// Helper to get Supabase client
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { taskId, action = 'execute' } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. Fetch task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*, quotes(*)')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.error('Task not found:', taskError);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { quoteItemId, executionType, provider } = task.attachments || {};
    const quote = task.quotes;

    if (executionType !== 'api') {
      return NextResponse.json({ error: 'Only API bookings can be executed automatically' }, { status: 400 });
    }

    if (!quote || !quoteItemId) {
      return NextResponse.json({ error: 'Missing quote or item details' }, { status: 400 });
    }

    // 2. Find the item in the quote
    const items = quote.items as TravelItem[];
    const itemIndex = items.findIndex(i => i.id === quoteItemId);
    const item = items[itemIndex];

    if (!item) {
      return NextResponse.json({ error: 'Item not found in quote' }, { status: 404 });
    }

    // PREVIEW ACTION: Just return the payload that would be sent
    if (action === 'preview') {
      console.log(`🔍 [Execute Booking] Previewing ${item.type} payload for item ${item.id}`);
      
      let preparedPayload = {};
      
      if (item.supplierSource === 'api_hotelbeds') {
        preparedPayload = {
          endpoint: '/hotel-api/1.0/bookings',
          method: 'POST',
          payload: {
            booking: {
              rateKey: item.details?.rateKey || 'MOCK_RATE_KEY',
              holder: {
                firstName: quote.customerName.split(' ')[0] || 'Guest',
                lastName: quote.customerName.split(' ')[1] || 'Name',
              },
              rooms: [
                {
                  paxes: [
                    {
                      roomId: 1,
                      type: 'AD',
                      name: quote.customerName.split(' ')[0] || 'Guest',
                      surname: quote.customerName.split(' ')[1] || 'Name',
                    },
                  ],
                },
              ],
              clientReference: `${quote.id}-${item.id}`,
              remark: `Booking for quote ${quote.id}`,
              tolerance: 2.00,
            },
          },
        };
      } else {
        preparedPayload = {
          info: 'Automated payload preparation not fully detailed for this provider in preview mode.',
          itemDetails: item,
          provider: item.supplierSource
        };
      }

      return NextResponse.json({
        success: true,
        action: 'preview',
        payload: preparedPayload
      });
    }

    console.log(`🚀 [Execute Booking] Executing ${item.type} booking for item ${item.id} (${item.name})`);

    // 3. Call the booking API via processor
    const bookingResult = await bookAPIItem(item as any, quote as any);

    if (bookingResult.success) {
      console.log(`✅ [Execute Booking] Successfully booked ${item.name}. Confirmation: ${bookingResult.confirmationNumber}`);

      // 4. Update the item in the quote and separate booking_items table
      const updatedItems = [...items];
      updatedItems[itemIndex] = {
        ...item,
        bookingStatus: 'booked',
        confirmationNumber: bookingResult.confirmationNumber,
        confirmedAt: new Date().toISOString()
      };

      await supabase
        .from('quotes')
        .update({ 
          items: updatedItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', quote.id);

      // Update the separate booking_items record if it exists
      // First get the booking_id associated with this quote
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('id')
        .eq('quote_id', quote.id)
        .single();

      if (bookingData) {
        await supabase
          .from('booking_items')
          .update({ 
            booking_status: 'booked',
            confirmation_number: bookingResult.confirmationNumber,
            confirmed_at: new Date().toISOString()
          })
          .eq('booking_id', bookingData.id)
          .eq('name', item.name);
      }

      // Update corresponding supplier expense to 'booked'
      await supabase
        .from('expenses')
        .update({ status: 'booked' })
        .eq('quote_id', quote.id)
        .eq('subcategory', item.type);

      // 5. Mark task as completed
      await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      // 6. Check if all items in the booking are now booked
      if (bookingData) {
        const { data: allBookingItems } = await supabase
          .from('booking_items')
          .select('booking_status')
          .eq('booking_id', bookingData.id);

        if (allBookingItems && allBookingItems.length > 0 && allBookingItems.every(i => i.booking_status === 'booked')) {
          // Update both bookings and quotes status to 'booked'
          await supabase
            .from('bookings')
            .update({ status: 'booked' })
            .eq('id', bookingData.id);

          await supabase
            .from('quotes')
            .update({ status: 'booked' })
            .eq('id', quote.id);
          
          console.log(`🎊 [Execute Booking] All items booked! Quote ${quote.id} set to 'booked'`);
        }
      }
      
      return NextResponse.json({
        success: true,
        confirmationNumber: bookingResult.confirmationNumber
      });
    } else {
      console.error(`❌ [Execute Booking] Booking failed: ${bookingResult.error}`);
      
      // Update task with error
      await supabase
        .from('tasks')
        .update({ 
          description: `${task.description}\n\nFAILED ATTEMPT (${new Date().toLocaleTimeString()}): ${bookingResult.error}`
        })
        .eq('id', taskId);

      return NextResponse.json({
        success: false,
        error: bookingResult.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Booking execution failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}


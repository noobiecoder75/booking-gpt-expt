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
    const { taskId } = await request.json();

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

    console.log(`🚀 [Execute Booking] Executing ${item.type} booking for item ${item.id} (${item.name})`);

    // 3. Call the booking API via processor
    const bookingResult = await bookAPIItem(item as any, quote as any);

    if (bookingResult.success) {
      console.log(`✅ [Execute Booking] Successfully booked ${item.name}. Confirmation: ${bookingResult.confirmationNumber}`);

      // 4. Update the item in the quote
      const updatedItems = [...items];
      updatedItems[itemIndex] = {
        ...item,
        bookingStatus: 'confirmed',
        confirmationNumber: bookingResult.confirmationNumber,
        confirmedAt: new Date().toISOString()
      };

      await supabase
        .from('quotes')
        .update({ items: updatedItems })
        .eq('id', quote.id);

      // 5. Mark task as completed
      await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      // 6. Record supplier expense if needed (if not already done)
      // Note: In a real system, we'd check if an expense already exists
      
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


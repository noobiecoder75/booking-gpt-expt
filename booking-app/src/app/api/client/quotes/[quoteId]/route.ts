import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { validateClientAccessToken } from '@/lib/client-links';
import { TravelQuote } from '@/types';
import { calculateQuoteTotal } from '@/lib/utils';

function dbRowToQuote(row: any): TravelQuote {
  const items = row.items || [];

  // Calculate total from items if total_amount is null/undefined, otherwise use database value
  const totalCost = row.total_amount != null
    ? parseFloat(row.total_amount)
    : calculateQuoteTotal(items);

  return {
    id: row.id,
    contactId: row.contact_id,
    title: row.title,
    status: row.status as TravelQuote['status'],
    totalCost: totalCost,
    items: items,
    travelDates: row.travel_start_date && row.travel_end_date
      ? {
          start: new Date(row.travel_start_date),
          end: new Date(row.travel_end_date),
        }
      : items && items.length > 0
      ? {
          start: new Date(items[0].startDate || row.created_at),
          end: new Date(items[items.length - 1].endDate || row.created_at),
        }
      : {
          start: new Date(),
          end: new Date(),
        },
    createdAt: new Date(row.created_at),
    paymentStatus: row.payment_status,
    totalPaid: row.total_paid ? parseFloat(row.total_paid) : 0,
    remainingBalance: row.remaining_balance != null ? parseFloat(row.remaining_balance) : totalCost,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { quoteId: string } }
) {
  try {
    const { quoteId } = params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Validate access token
    if (!token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    if (!validateClientAccessToken(token, quoteId)) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 403 }
      );
    }

    // Fetch quote from Supabase using admin client (bypasses RLS)
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    const quote = dbRowToQuote(data);
    return NextResponse.json({ quote });
  } catch (error) {
    console.error('[Client Quote API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

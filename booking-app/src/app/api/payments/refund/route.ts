import { NextRequest, NextResponse } from 'next/server';
import { getStripeInstance, formatAmountForStripe, calculateRefundAmount } from '@/lib/stripe/config';
import { RefundCalculation } from '@/types/payment';
import { createClient } from '@supabase/supabase-js';

// Helper to get Supabase client for API routes
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
    const { paymentId, quoteId, reason } = await request.json();

    if (!paymentId || !quoteId) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId, quoteId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Fetch quote with items
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Calculate refund amount based on cancellation policy
    const refundCalculation = calculateRefundForQuote(quote);

    if (refundCalculation.refundAmount <= 0) {
      return NextResponse.json(
        {
          error: 'No refund available',
          message: 'Cancellation policy does not allow refunds at this time',
          refundPercentage: refundCalculation.refundPercentage,
        },
        { status: 400 }
      );
    }

    const stripe = getStripeInstance();

    // Process refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount: formatAmountForStripe(refundCalculation.refundAmount),
      reason: 'requested_by_customer',
      metadata: {
        quoteId,
        originalAmount: payment.amount.toString(),
        refundPercentage: refundCalculation.refundPercentage.toString(),
        serviceFee: refundCalculation.serviceFee.toString(),
        reason: reason || 'Customer cancellation',
      },
    });

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: 'refunded',
      })
      .eq('id', paymentId);

    // Update quote status
    await supabase
      .from('quotes')
      .update({
        status: 'cancelled',
      })
      .eq('id', quoteId);

    // Clawback agent commission if applicable
    if (refundCalculation.shouldClawbackCommission) {
      await clawbackAgentCommission(quoteId, refundCalculation.commissionClawback);
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      refundAmount: refundCalculation.refundAmount,
      refundPercentage: refundCalculation.refundPercentage,
      serviceFee: refundCalculation.serviceFee,
      clientReceives: refundCalculation.refundAmount - refundCalculation.serviceFee,
      breakdown: refundCalculation.breakdown,
    });
  } catch (error: any) {
    console.error('Refund processing failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate refund based on cancellation policies
 */
function calculateRefundForQuote(quote: any): RefundCalculation {
  const now = new Date();
  let maxRefundPercentage = 0;
  const breakdown: RefundCalculation['breakdown'] = [];

  // Check each item's cancellation policy
  for (const item of quote.items) {
    let itemRefundPercentage = 0;

    if (item.cancellationPolicy) {
      const { freeCancellationUntil, refundRules, nonRefundable } = item.cancellationPolicy;

      // If non-refundable, no refund
      if (nonRefundable) {
        itemRefundPercentage = 0;
      }
      // If within free cancellation window, 100% refund
      else if (freeCancellationUntil && now < new Date(freeCancellationUntil)) {
        itemRefundPercentage = 100;
      }
      // Otherwise, check refund rules based on days until travel
      else if (refundRules && refundRules.length > 0) {
        const travelDate = new Date(item.startDate);
        const daysUntilTravel = Math.floor(
          (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Find applicable refund rule
        // Sort rules by days before travel (descending) and find first match
        const sortedRules = [...refundRules].sort((a, b) => b.daysBeforeTravel - a.daysBeforeTravel);

        for (const rule of sortedRules) {
          if (daysUntilTravel >= rule.daysBeforeTravel) {
            itemRefundPercentage = rule.refundPercentage;
            break;
          }
        }
      }
    } else {
      // No cancellation policy specified - use default (e.g., 50% refund)
      const travelDate = new Date(item.startDate);
      const daysUntilTravel = Math.floor(
        (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilTravel >= 30) {
        itemRefundPercentage = 100;
      } else if (daysUntilTravel >= 14) {
        itemRefundPercentage = 50;
      } else if (daysUntilTravel >= 7) {
        itemRefundPercentage = 25;
      } else {
        itemRefundPercentage = 0;
      }
    }

    // Track maximum refund percentage (use most restrictive policy)
    maxRefundPercentage = Math.max(maxRefundPercentage, itemRefundPercentage);

    // Calculate refund for this item
    const itemPaidAmount = item.clientPrice || item.price;
    const itemRefundAmount = (itemPaidAmount * itemRefundPercentage) / 100;

    breakdown.push({
      itemId: item.id,
      itemName: item.name,
      paidAmount: itemPaidAmount,
      refundAmount: itemRefundAmount,
      refundPercentage: itemRefundPercentage,
    });
  }

  // Calculate total refund
  const totalPaid = quote.totalPaid || quote.totalCost;
  const grossRefundCalc = calculateRefundAmount(totalPaid, maxRefundPercentage);

  // Determine commission clawback
  const shouldClawbackCommission = maxRefundPercentage > 0;
  const commissionClawback = shouldClawbackCommission
    ? totalPaid * 0.10 // Assume 10% average commission
    : 0;

  return {
    refundAmount: grossRefundCalc.clientReceives, // After service fee
    refundPercentage: maxRefundPercentage,
    serviceFee: grossRefundCalc.serviceFee,
    shouldClawbackCommission,
    commissionClawback,
    breakdown,
  };
}

/**
 * Clawback agent commission on refund
 */
async function clawbackAgentCommission(quoteId: string, clawbackAmount: number) {
  const supabase = getSupabaseClient();

  // Find commissions for this quote
  const { data: commissions, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('quote_id', quoteId);

  if (error || !commissions) {
    console.error('Failed to fetch commissions for clawback:', error);
    return;
  }

  for (const commission of commissions) {
    if (commission.status === 'paid') {
      // Mark as clawed back
      await supabase
        .from('commissions')
        .update({ status: 'clawed_back' })
        .eq('id', commission.id);
    } else if (commission.status === 'pending' || commission.status === 'released') {
      // Mark as clawed back if not yet paid
      await supabase
        .from('commissions')
        .update({ status: 'clawed_back' })
        .eq('id', commission.id);
    }
  }

  console.log(`✅ Commission clawback processed for quote: ${quoteId}, amount: $${clawbackAmount}`);
}

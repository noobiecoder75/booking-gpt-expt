import { NextRequest, NextResponse } from 'next/server';
import { getStripeInstance, calculateStripeFee } from '@/lib/stripe/config';
import { PaymentType } from '@/types/payment';
import { processHybridBooking } from '@/lib/booking/processor';
import { TravelQuote, Payment } from '@/types';
import { RateSource } from '@/types/rate';
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
    const { paymentIntentId, quoteId, quote } = await request.json();

    console.log('🔵 [Confirm Payment] Request received:', { paymentIntentId, quoteId });

    if (!paymentIntentId || !quoteId || !quote) {
      console.error('❌ [Confirm Payment] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: paymentIntentId, quoteId, quote' },
        { status: 400 }
      );
    }

    const stripe = getStripeInstance();

    // Retrieve payment intent from Stripe with charges expanded
    console.log('🔍 [Confirm Payment] Retrieving payment intent from Stripe...');
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge']
    });

    console.log('✅ [Confirm Payment] Payment intent retrieved:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      hasLatestCharge: !!paymentIntent.latest_charge,
    });

    if (paymentIntent.status !== 'succeeded') {
      console.error('❌ [Confirm Payment] Payment not completed:', paymentIntent.status);
      return NextResponse.json(
        {
          error: 'Payment not completed',
          status: paymentIntent.status,
          message: 'Payment must be successful before confirmation',
        },
        { status: 400 }
      );
    }

    console.log('✅ [Confirm Payment] Payment succeeded, processing...');

    const paymentType = paymentIntent.metadata.paymentType as PaymentType;
    const paymentAmount = paymentIntent.amount / 100; // Convert from cents

    console.log('💰 [Confirm Payment] Payment details:', {
      type: paymentType,
      amount: paymentAmount,
      currency: paymentIntent.currency
    });

    // Record payment in database
    const supabase = getSupabaseClient();
    const stripeFee = calculateStripeFee(paymentAmount);
    const receiptUrl = typeof paymentIntent.latest_charge === 'object' ? paymentIntent.latest_charge?.receipt_url || undefined : undefined;

    // Fetch user_id from quotes table (security: don't trust client-provided data)
    console.log('🔍 [Confirm Payment] Fetching quote from database...');
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .select('user_id')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quoteData) {
      console.error('❌ [Confirm Payment] Quote not found:', quoteError);
      return NextResponse.json(
        { error: 'Quote not found in database' },
        { status: 404 }
      );
    }

    const userId = quoteData.user_id;
    console.log('✅ [Confirm Payment] Quote found, user_id:', userId);

    // Insert payment record (requires migration 20250107_add_payment_fields.sql to be run first)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        quote_id: quoteId,
        amount: paymentAmount,
        currency: paymentIntent.currency,
        type: paymentType,
        status: 'succeeded',
        stripe_payment_intent_id: paymentIntentId,
        stripe_customer_id: paymentIntent.customer as string | undefined,
        payment_method: 'credit_card',
        payment_date: new Date().toISOString(),
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ [Confirm Payment] Database error:', paymentError);
      throw paymentError;
    }
    const paymentId = payment.id;

    console.log('💾 [Confirm Payment] Payment record created:', paymentId);

    // Record payment received transaction
    // TODO: Refactor to use direct Supabase query instead of store
    // const { useTransactionStore } = await import('@/store/transaction-store');
    // const paymentTransactionId = useTransactionStore.getState().createTransaction({
    //   type: 'payment_received',
    //   status: 'completed',
    //   amount: paymentAmount,
    //   currency: paymentIntent.currency,
    //   quoteId,
    //   paymentId,
    //   customerId: quote.contactId,
    //   description: `Payment received: ${paymentType === 'full' ? 'Full payment' : 'Deposit (30%)'} for quote ${quoteId}`,
    //   metadata: {
    //     paymentType,
    //     stripePaymentIntentId: paymentIntentId,
    //     processingFee: stripeFee,
    //   },
    // });

    const paymentTransactionId = `TXN-${Date.now()}`; // Temporary placeholder
    console.log('📝 [Confirm Payment] Payment transaction recording disabled during migration');

    // Record Stripe processing fee as expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        category: 'technology',
        subcategory: 'payment_processing',
        description: `Stripe processing fee for payment ${paymentId}`,
        amount: stripeFee,
        currency: paymentIntent.currency,
        vendor: 'Stripe',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'auto_deducted',
        receipt_url: receiptUrl,
        status: 'approved',
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Failed to create expense:', expenseError);
    } else {
      console.log('💸 [Confirm Payment] Stripe fee recorded as expense:', expense.id);
    }

    // Record expense transaction
    // TODO: Refactor to use direct Supabase query instead of store
    // const expenseTransactionId = useTransactionStore.getState().createTransaction({
    //   type: 'expense_recorded',
    //   status: 'completed',
    //   amount: stripeFee,
    //   currency: paymentIntent.currency,
    //   quoteId,
    //   paymentId,
    //   expenseId,
    //   description: `Stripe processing fee for payment ${paymentId}`,
    //   relatedTransactions: [paymentTransactionId],
    //   metadata: {
    //     vendor: 'Stripe',
    //     category: 'technology',
    //   },
    // });

    console.log('📝 [Confirm Payment] Expense transaction recording disabled during migration');

    // Generate invoice from quote
    const invoiceId = await generateInvoiceForPayment(quote, quoteId, paymentId, paymentType, paymentTransactionId, userId);

    console.log('📄 [Confirm Payment] Invoice generated:', invoiceId);

    // Calculate payment status and update quote
    const { data: currentQuote } = await supabase
      .from('quotes')
      .select('total_amount, total_paid')
      .eq('id', quoteId)
      .single();

    const newTotalPaid = (currentQuote?.total_paid || 0) + paymentAmount;
    const remainingBalance = quote.totalCost - newTotalPaid;
    
    let newPaymentStatus: 'unpaid' | 'deposit_paid' | 'partially_paid' | 'paid_in_full' = 'unpaid';
    if (newTotalPaid >= quote.totalCost) {
      newPaymentStatus = 'paid_in_full';
    } else if (newTotalPaid > 0) {
      newPaymentStatus = paymentType === 'deposit' ? 'deposit_paid' : 'partially_paid';
    }

    console.log('📊 [Confirm Payment] Updating quote payment status:', {
      newStatus: newPaymentStatus,
      totalPaid: newTotalPaid,
      remaining: remainingBalance
    });

    await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        payment_status: newPaymentStatus,
        total_paid: newTotalPaid,
        remaining_balance: remainingBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    // Update invoice status and balance
    if (invoiceId) {
      await supabase
        .from('invoices')
        .update({
          status: newPaymentStatus === 'paid_in_full' ? 'paid' : 'partially_paid',
          paid_amount: paymentAmount,
          remaining_amount: remainingBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);
    }

    // Generate commission for agent (linked to invoice)
    const commissionId = await generateCommissionForBooking(quote, quoteId, paymentId, invoiceId, paymentTransactionId, userId);

    console.log('💼 [Confirm Payment] Commission generated:', commissionId);

    // Auto-create supplier expenses for items with supplier costs
    if (paymentType === 'full') {
      console.log('💸 [Confirm Payment] Creating supplier expenses for paid booking...');
      await createSupplierExpenses(quote, quoteId, paymentId, paymentTransactionId, userId);
    }

    // Initialize the Booking Workflow (Human in the Loop)
    console.log('🎯 [Confirm Payment] Initializing booking workflow');
    await initializeBookingWorkflow(quoteId, paymentId, quote, userId, paymentType, paymentAmount);

    console.log('✅ [Confirm Payment] Payment confirmed successfully');

    return NextResponse.json({
      success: true,
      paymentId,
      invoiceId,
      commissionId,
      status: 'completed',
      paymentStatus: newPaymentStatus,
      totalPaid: newTotalPaid,
      remainingBalance: remainingBalance,
      receiptUrl,
    });
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Initialize the booking workflow (Human in the Loop)
 * This creates tasks for the agent to verify and execute bookings.
 */
async function initializeBookingWorkflow(
  quoteId: string, 
  paymentId: string, 
  quote: TravelQuote,
  userId: string,
  paymentType: PaymentType,
  amount: number
) {
  console.log(`🚀 [Workflow] Initializing booking workflow for quote: ${quoteId}. Type: ${paymentType}`);

  // 1. Create fund allocation to track money split
  await createFundAllocation(quote, paymentId);

  // 2. Create tasks for Agent to verify and execute booking
  try {
    const supabase = getSupabaseClient();
    
    for (const item of quote.items) {
      const isAPI = ['api_hotelbeds', 'api_amadeus', 'api_sabre'].includes(item.supplierSource || '');
      const isRefundable = item.cancellationPolicy?.nonRefundable === false;
      
      // Determine if this item is "safe" to book with the current funds
      // For deposits, we only allow booking if it's refundable
      const hasSufficientFunds = amount >= item.price;
      const canProceed = hasSufficientFunds || (item.type === 'hotel' && isRefundable);

      const title = `Execute ${item.type} booking: ${item.name}`;
      const description = isAPI 
        ? `Customer has paid ${paymentType.replace('_', ' ')}. ${canProceed ? 'Ready for agent verification and execution.' : 'WARNING: Insufficient funds for non-refundable item. Wait for full payment.'}`
        : `Manual booking required for offline item. Check details and confirm with supplier.`;

      const { error: taskError } = await supabase.from('tasks').insert({
        user_id: userId,
        booking_id: null, // We link to quote instead
        quote_id: quoteId,
        title,
        description,
        status: 'pending',
        priority: canProceed ? 'high' : 'medium',
        attachments: {
          quoteItemId: item.id,
          executionType: isAPI ? 'api' : 'manual',
          provider: item.supplierSource,
          isReady: canProceed,
          paymentType,
          paidAmount: amount,
          refundable: isRefundable
        }
      });

      if (taskError) {
        console.error(`❌ [Workflow] Failed to create task for ${item.name}:`, taskError);
      }
    }
    
    console.log('✅ [Workflow] Booking execution tasks created for agent.');
  } catch (error) {
    console.error('❌ [Workflow] Failed to initialize booking workflow:', error);
  }
}

/**
 * Create fund allocation to track money split
 */
async function createFundAllocation(quote: TravelQuote, paymentId: string) {
  console.log(`💵 [Fund Allocation] Creating allocation for payment: ${paymentId}`);

  // Calculate allocations for each item
  const allocations = quote.items.map((item) => {
    const supplierSource = item.supplierSource || 'offline_agent';
    const supplierCost = item.supplierCost || item.price * 0.85; // Default 85% to supplier
    const platformFeePercentage = getPlatformFeePercentage(supplierSource);
    const platformFee = (item.price * platformFeePercentage) / 100;
    const agentCommission = item.price - supplierCost - platformFee;

    return {
      quoteItemId: item.id,
      itemType: item.type,
      source: supplierSource,
      clientPaid: item.price,
      supplierCost,
      platformFee,
      agentCommission,
      escrowStatus: 'held' as const,
    };
  });

  console.log('✅ [Fund Allocation] Allocation calculated:', {
    totalItems: allocations.length,
    totalAmount: quote.totalCost
  });

  // TODO: Save to database instead of Zustand
  console.log('⚠️ [Fund Allocation] Note: Not persisting to database yet');
}

/**
 * Get platform fee percentage based on source
 */
function getPlatformFeePercentage(source: string): number {
  const fees: Record<string, number> = {
    api_hotelbeds: 5,
    api_amadeus: 5,
    api_sabre: 5,
    offline_platform: 8,
    offline_agent: 0,
  };
  return fees[source] || 0;
}

/**
 * Generate invoice for payment
 */
async function generateInvoiceForPayment(
  quote: TravelQuote,
  quoteId: string,
  paymentId: string,
  paymentType: PaymentType,
  paymentTransactionId: string,
  userId: string
): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();

    // Get customer details from contact
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', quote.contactId)
      .single();

    const subtotal = quote.totalCost;
    const total = subtotal;
    const paidAmount = paymentType === 'full' ? total : total * 0.3;
    const remainingAmount = total - paidAmount;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        quote_id: quoteId,
        user_id: userId,
        amount: total,
        currency: 'USD',
        status: paymentType === 'full' ? 'paid' : 'sent',
        due_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;
    const invoiceId = invoice.id;

    console.log('✅ [Invoice] Invoice created:', invoiceId);

    // Update payment with invoice ID
    await supabase
      .from('payments')
      .update({ invoice_id: invoiceId })
      .eq('id', paymentId);

    console.log('📝 [Invoice] Invoice and payment linked successfully');

    return invoiceId;
  } catch (error) {
    console.error('❌ [Invoice] Generation failed:', error);
    return null;
  }
}

/**
 * Generate commission for booking
 */
async function generateCommissionForBooking(
  quote: TravelQuote,
  quoteId: string,
  paymentId: string,
  invoiceId: string | null,
  paymentTransactionId: string,
  userId: string
): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();

    // Get customer details
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', quote.contactId)
      .single();

    // Calculate commission (default 10% or use quote's custom rate)
    const commissionRate = quote.commissionRate || 10;
    const commissionAmount = (quote.totalCost * commissionRate) / 100;

    // Create commission record
    const { data: commission, error: commissionError } = await supabase
      .from('commissions')
      .insert({
        user_id: userId,
        booking_id: paymentId, // Use paymentId as booking reference
        quote_id: quoteId,
        amount: commissionAmount,
        currency: 'USD',
        status: 'pending',
        type: 'agent_markup',
      })
      .select()
      .single();

    if (commissionError) throw commissionError;

    console.log('✅ [Commission] Generated commission:', commission.id);

    return commission.id;
  } catch (error) {
    console.error('❌ [Commission] Generation failed:', error);
    return null;
  }
}

/**
 * Create supplier expenses for quote items
 * Auto-creates expense records for supplier payments when booking is confirmed
 */
async function createSupplierExpenses(
  quote: TravelQuote,
  quoteId: string,
  paymentId: string,
  paymentTransactionId: string,
  userId: string
) {
  try {
    const supabase = getSupabaseClient();
    let expensesCreated = 0;

    for (const item of quote.items) {
      // Skip items without supplier cost
      if (!item.supplierCost || item.supplierCost <= 0) {
        console.log(`⚠️ [Supplier Expense] Skipping ${item.name} - no supplier cost`);
        continue;
      }

      const supplier = item.supplier || 'Unknown Supplier';
      const supplierSource = item.supplierSource || 'offline_agent';

      // Find or create supplier contact
      const { data: existingSupplier } = await supabase
        .from('contacts')
        .select('*')
        .eq('name', supplier)
        .eq('user_id', userId)
        .single();

      let supplierId = existingSupplier?.id;

      if (!existingSupplier) {
        console.log(`📝 [Supplier Expense] Creating new supplier: ${supplier}`);
        const { data: newSupplier } = await supabase
          .from('contacts')
          .insert({
            user_id: userId,
            name: supplier,
            company: supplier,
            tags: ['supplier'],
          })
          .select()
          .single();

        supplierId = newSupplier?.id;
      }

      // Create expense record
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          category: 'supplier_payment',
          subcategory: item.type,
          description: `Supplier cost for ${item.type}: ${item.name}`,
          amount: item.supplierCost,
          currency: 'USD',
          vendor: supplier,
          supplier_id: supplierId,
          date: item.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: 'pending',
          booking_id: quoteId,
          notes: `Auto-generated from booking ${paymentId}. Source: ${supplierSource}`,
        })
        .select()
        .single();

      if (expenseError) {
        console.error(`Failed to create expense for ${supplier}:`, expenseError);
        continue;
      }

      console.log(`✅ [Supplier Expense] Created expense ${expense.id} for ${supplier}: $${item.supplierCost}`);
      expensesCreated++;
    }

    console.log(`✅ [Supplier Expense] Created ${expensesCreated} supplier expense records`);
  } catch (error) {
    console.error('❌ [Supplier Expense] Failed to create expenses:', error);
    // Don't throw - payment already succeeded
  }
}

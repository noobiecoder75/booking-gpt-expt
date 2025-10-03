'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { TravelQuote } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentModalProps {
  quote: TravelQuote;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData?: PaymentConfirmationData) => void;
}

interface PaymentConfirmationData {
  paymentId: string;
  invoiceId?: string;
  commissionId?: string;
  paymentStatus: 'unpaid' | 'deposit_paid' | 'partially_paid' | 'paid_in_full';
  totalPaid: number;
  remainingBalance: number;
  receiptUrl?: string;
}

interface PriceChangeWarning {
  originalPrice: number;
  newPrice: number;
  priceDifference: number;
  percentageChange: number;
  changes: any[];
}

export function PaymentModal({ quote, isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [priceChangeWarning, setPriceChangeWarning] = useState<PriceChangeWarning | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const depositAmount = (quote.totalCost * 0.30).toFixed(2);

  const initiatePayment = async () => {
    setIsLoading(true);
    setError(null);

    console.log('🔵 [PaymentModal] Initiating payment...', {
      quoteId: quote.id,
      paymentType,
      totalCost: quote.totalCost
    });

    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quote.id,
          paymentType,
          customerId: quote.contactId,
          customerEmail: 'customer@example.com', // TODO: Get from contact
          quote, // Send full quote object
        }),
      });

      const data = await response.json();

      console.log('✅ [PaymentModal] Response received:', {
        status: response.status,
        hasClientSecret: !!data.clientSecret,
        hasError: !!data.error
      });

      if (response.status === 409) {
        // Price changed!
        console.log('⚠️ [PaymentModal] Price changed detected');
        setPriceChangeWarning(data);
        setIsLoading(false);
      } else if (data.clientSecret) {
        console.log('✅ [PaymentModal] Client secret received, showing payment form');
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      } else {
        console.error('❌ [PaymentModal] Error:', data.error);
        setError(data.error || 'Failed to initialize payment');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('❌ [PaymentModal] Network error:', err);
      setError(err.message || 'Network error');
      setIsLoading(false);
    }
  };

  const handleAcceptPriceChange = () => {
    setPriceChangeWarning(null);
    // Update quote with new price (in production)
    initiatePayment();
  };

  if (priceChangeWarning) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              ⚠️ Price Has Changed
            </DialogTitle>
            <DialogDescription>
              The price for this quote has been updated since it was created.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Original Price:</span>
              <span className="text-sm">${priceChangeWarning.originalPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">New Price:</span>
              <span className="text-sm font-bold">${priceChangeWarning.newPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-red-600">
              <span className="text-sm font-medium">Difference:</span>
              <span className="text-sm font-bold">
                +${Math.abs(priceChangeWarning.priceDifference).toFixed(2)} ({priceChangeWarning.percentageChange.toFixed(1)}%)
              </span>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                API rates have changed since this quote was created. You can accept the new price to continue with payment.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAcceptPriceChange} className="flex-1">
              Accept New Price & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!clientSecret) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Option</DialogTitle>
            <DialogDescription>
              Choose how you'd like to pay for {quote.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
              <input
                type="radio"
                value="full"
                checked={paymentType === 'full'}
                onChange={() => setPaymentType('full')}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <div className="font-medium">Pay in Full</div>
                <div className="text-sm text-muted-foreground">
                  ${quote.totalCost.toFixed(2)}
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
              <input
                type="radio"
                value="deposit"
                checked={paymentType === 'deposit'}
                onChange={() => setPaymentType('deposit')}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <div className="font-medium">Pay Deposit (30%)</div>
                <div className="text-sm text-muted-foreground">
                  ${depositAmount} now, ${(quote.totalCost - parseFloat(depositAmount)).toFixed(2)} later
                </div>
              </div>
            </label>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <Button onClick={initiatePayment} disabled={isLoading} className="w-full">
            {isLoading ? 'Initializing...' : 'Continue to Payment'}
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            {paymentType === 'deposit' ? `Deposit: $${depositAmount}` : `Total: $${quote.totalCost.toFixed(2)}`}
          </DialogDescription>
        </DialogHeader>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm quote={quote} quoteId={quote.id} onSuccess={onSuccess} onError={setError} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}

interface PaymentFormProps {
  quote: TravelQuote;
  quoteId: string;
  onSuccess: (paymentData?: PaymentConfirmationData) => void;
  onError: (error: string) => void;
}

function PaymentForm({ quote, quoteId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.warn('⚠️ [PaymentForm] Stripe or Elements not ready');
      return;
    }

    if (!isElementReady) {
      console.warn('⚠️ [PaymentForm] PaymentElement not ready yet');
      onError('Payment form is still loading, please wait...');
      return;
    }

    console.log('🔵 [PaymentForm] Submitting payment...');

    setIsProcessing(true);
    onError('');

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (submitError) {
        console.error('❌ [PaymentForm] Stripe error:', submitError.message);
        onError(submitError.message ?? 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ [PaymentForm] Payment succeeded:', paymentIntent.id);

        // Confirm payment on backend
        const response = await fetch('/api/payments/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            quoteId,
            quote, // Pass quote object
          }),
        });

        const data = await response.json();

        console.log('✅ [PaymentForm] Confirmation response:', data);

        if (data.success) {
          console.log('🎉 [PaymentForm] Payment completed successfully!');
          // Pass payment confirmation data back to parent
          const paymentData: PaymentConfirmationData = {
            paymentId: data.paymentId,
            invoiceId: data.invoiceId,
            commissionId: data.commissionId,
            paymentStatus: data.paymentStatus,
            totalPaid: data.totalPaid,
            remainingBalance: data.remainingBalance,
            receiptUrl: data.receiptUrl,
          };
          onSuccess(paymentData);
        } else {
          console.error('❌ [PaymentForm] Confirmation failed:', data.error);
          onError(data.error || 'Payment confirmation failed');
        }
      }
    } catch (err: any) {
      console.error('❌ [PaymentForm] Processing error:', err);
      onError(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <PaymentElement
        onReady={() => {
          console.log('✅ [PaymentForm] PaymentElement is ready');
          setIsElementReady(true);
        }}
        onLoadError={(error) => {
          console.error('❌ [PaymentForm] PaymentElement load error:', error);
          onError('Failed to load payment form. Please refresh and try again.');
        }}
      />

      {!isElementReady && (
        <div className="text-sm text-gray-500 text-center py-2">
          Loading payment form...
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !isElementReady || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : isElementReady ? 'Pay Now' : 'Loading...'}
      </Button>
    </form>
  );
}

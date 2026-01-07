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

      if (response.status === 409) {
        setPriceChangeWarning(data);
        setIsLoading(false);
      } else if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      } else {
        setError(data.error || 'Failed to initialize payment');
        setIsLoading(false);
      }
    } catch (err: any) {
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
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-strong bg-white dark:bg-clio-gray-950">
          <DialogHeader className="p-8 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30">
            <DialogTitle className="text-xl font-bold text-red-900 dark:text-red-100 uppercase tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-lg">⚠️</span>
              </div>
              Price Has Changed
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black text-red-700/70 dark:text-red-400/70 uppercase tracking-widest mt-1">
              Real-time rate update required
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-clio-gray-100 dark:border-clio-gray-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Original Quote</span>
                <span className="font-bold text-clio-gray-900 dark:text-white">${priceChangeWarning.originalPrice.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-clio-gray-100 dark:border-clio-gray-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Current Market Rate</span>
                <span className="text-lg font-black text-clio-gray-900 dark:text-white">${priceChangeWarning.newPrice.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-4 bg-red-50/50 dark:bg-red-950/10 rounded-xl px-4 border border-red-100 dark:border-red-900/20">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Price Increase</span>
                <span className="font-black text-red-600">
                  +${Math.abs(priceChangeWarning.priceDifference).toFixed(2)} ({priceChangeWarning.percentageChange.toFixed(1)}%)
                </span>
              </div>
            </div>

            <p className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight leading-relaxed italic">
              * Supplier rates have changed since this quote was initially generated. Continue with the updated price to proceed.
            </p>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={handleAcceptPriceChange} 
                className="w-full bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest h-14 rounded-xl shadow-lg shadow-clio-blue/20"
              >
                Accept & Continue
              </Button>
              <button 
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white transition-colors py-2"
              >
                Cancel and Review Quote
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!clientSecret) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-strong bg-white dark:bg-clio-gray-950">
          <DialogHeader className="p-8 bg-clio-gray-50 dark:bg-clio-gray-900/50 border-b border-clio-gray-100 dark:border-clio-gray-800">
            <DialogTitle className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Select Payment</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest mt-1">
              {quote.title}
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <button
                onClick={() => setPaymentType('full')}
                className={`w-full flex items-center gap-4 p-6 rounded-2xl border transition-all duration-200 group ${
                  paymentType === 'full'
                    ? 'border-clio-blue bg-clio-blue/5 shadow-md shadow-clio-blue/5'
                    : 'border-clio-gray-100 dark:border-clio-gray-800 hover:border-clio-gray-300 dark:hover:border-clio-gray-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  paymentType === 'full' ? 'border-clio-blue bg-clio-blue' : 'border-clio-gray-200 dark:border-clio-gray-700'
                }`}>
                  {paymentType === 'full' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="text-left flex-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-1 group-hover:text-clio-gray-600 dark:group-hover:text-clio-gray-300">Option 01</div>
                  <div className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Pay in Full</div>
                  <div className="text-lg font-black text-clio-blue mt-1">
                    ${quote.totalCost.toFixed(2)}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentType('deposit')}
                className={`w-full flex items-center gap-4 p-6 rounded-2xl border transition-all duration-200 group ${
                  paymentType === 'deposit'
                    ? 'border-clio-blue bg-clio-blue/5 shadow-md shadow-clio-blue/5'
                    : 'border-clio-gray-100 dark:border-clio-gray-800 hover:border-clio-gray-300 dark:hover:border-clio-gray-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  paymentType === 'deposit' ? 'border-clio-blue bg-clio-blue' : 'border-clio-gray-200 dark:border-clio-gray-700'
                }`}>
                  {paymentType === 'deposit' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="text-left flex-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-1 group-hover:text-clio-gray-600 dark:group-hover:text-clio-gray-300">Option 02</div>
                  <div className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Pay Deposit (30%)</div>
                  <div className="text-lg font-black text-clio-blue mt-1">
                    ${depositAmount} <span className="text-[10px] font-black uppercase text-clio-gray-400 ml-1">due now</span>
                  </div>
                  <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-1">
                    Balance: ${(quote.totalCost - parseFloat(depositAmount)).toFixed(2)} later
                  </div>
                </div>
              </button>
            </div>

            {error && (
              <div className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            <Button 
              onClick={initiatePayment} 
              disabled={isLoading} 
              className="w-full bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest h-14 rounded-xl shadow-lg shadow-clio-blue/20 mt-4"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  Initializing...
                </div>
              ) : 'Continue to Checkout'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-strong bg-white dark:bg-clio-gray-950">
        <DialogHeader className="p-8 bg-clio-gray-50 dark:bg-clio-gray-900/50 border-b border-clio-gray-100 dark:border-clio-gray-800">
          <DialogTitle className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Complete Payment</DialogTitle>
          <DialogDescription className="text-[10px] font-black text-clio-blue uppercase tracking-widest mt-1">
            {paymentType === 'deposit' ? `Checkout Total: $${depositAmount}` : `Checkout Total: $${quote.totalCost.toFixed(2)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="p-8">
          <Elements stripe={stripePromise} options={{ 
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#3b82f6',
                colorBackground: '#ffffff',
                colorText: '#111827',
                borderRadius: '12px',
              }
            }
          }}>
            <PaymentForm quote={quote} quoteId={quote.id} onSuccess={onSuccess} onError={setError} />
          </Elements>
        </div>
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
      return;
    }

    if (!isElementReady) {
      onError('Payment form is still loading, please wait...');
      return;
    }

    setIsProcessing(true);
    onError('');

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (submitError) {
        onError(submitError.message ?? 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
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

        if (data.success) {
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
          onError(data.error || 'Payment confirmation failed');
        }
      }
    } catch (err: any) {
      onError(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-clio-gray-50 dark:bg-clio-gray-900/50 p-6 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
        <PaymentElement
          onReady={() => setIsElementReady(true)}
          onLoadError={() => onError('Failed to load payment form. Please refresh and try again.')}
        />
      </div>

      {!isElementReady && (
        <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 text-center py-4 flex items-center justify-center gap-3">
          <div className="w-4 h-4 border-2 border-clio-blue/20 border-t-clio-blue rounded-full animate-spin" />
          Securing Checkout...
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !isElementReady || isProcessing}
        className="w-full bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest h-14 rounded-xl shadow-lg shadow-clio-blue/20"
      >
        {isProcessing ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
            Authorizing...
          </div>
        ) : isElementReady ? 'Confirm Payment' : 'Please wait...'}
      </Button>
    </form>
  );
}

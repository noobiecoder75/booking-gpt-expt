'use client';

import { useState } from 'react';
import { TravelQuote, Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Lock, 
  DollarSign, 
  Calendar, 
  User, 
  Mail,
  Shield,
  X,
  Check
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  email: string;
  paymentMethod: 'full' | 'deposit';
  depositAmount?: number;
}

interface ClientPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: (paymentData: PaymentData) => void;
  quote: TravelQuote;
  contact: Contact;
}

export function ClientPaymentModal({ 
  isOpen, 
  onClose, 
  onPayment, 
  quote, 
  contact 
}: ClientPaymentModalProps) {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: `${contact.firstName} ${contact.lastName}`,
    email: contact.email,
    paymentMethod: 'full'
  });
  
  const [step, setStep] = useState<'payment' | 'processing' | 'success'>('payment');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const depositAmount = Math.round(quote.totalCost * 0.25); // 25% deposit
  const paymentAmount = paymentData.paymentMethod === 'deposit' ? depositAmount : quote.totalCost;

  const validateCard = () => {
    const newErrors: Record<string, string> = {};

    // Card number validation (basic)
    const cardNumber = paymentData.cardNumber.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    // Expiry validation
    if (!paymentData.expiryMonth || !paymentData.expiryYear) {
      newErrors.expiry = 'Please enter expiry date';
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const expYear = parseInt(paymentData.expiryYear);
      const expMonth = parseInt(paymentData.expiryMonth);
      
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        newErrors.expiry = 'Card has expired';
      }
    }

    // CVV validation
    if (!paymentData.cvv || paymentData.cvv.length < 3) {
      newErrors.cvv = 'Please enter CVV';
    }

    // Cardholder name
    if (!paymentData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter cardholder name';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!paymentData.email || !emailRegex.test(paymentData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setPaymentData(prev => ({ ...prev, cardNumber: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCard()) {
      return;
    }

    setStep('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onPayment(paymentData);
        handleClose();
      }, 2000);
    }, 3000);
  };

  const handleClose = () => {
    setStep('payment');
    setErrors({});
    onClose();
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear + i);
    }
    return years;
  };

  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1).padStart(2, '0'),
      label: String(i + 1).padStart(2, '0')
    }));
  };

  if (step === 'processing') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-12 bg-white dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-clio-blue/20 border-t-clio-blue rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight mb-2">Processing Payment...</h3>
            <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest">Please wait while we process your payment securely.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-12 bg-white dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight mb-3">Payment Successful!</h3>
            <p className="text-sm font-medium text-clio-gray-600 dark:text-clio-gray-400 uppercase tracking-widest mb-6 leading-relaxed">
              Your {paymentData.paymentMethod === 'deposit' ? 'deposit' : 'payment'} of <span className="text-clio-gray-900 dark:text-white font-bold">{formatCurrency(paymentAmount)}</span> has been processed.
            </p>
            {paymentData.paymentMethod === 'deposit' && (
              <div className="bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-xl p-4 border border-clio-gray-100 dark:border-clio-gray-800">
                <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">
                  Remaining balance: {formatCurrency(quote.totalCost - depositAmount)}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 border-none shadow-strong bg-white dark:bg-clio-gray-900">
        <DialogHeader className="p-8 bg-clio-gray-50 dark:bg-clio-gray-800/50 border-b border-clio-gray-100 dark:border-clio-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm">
              <CreditCard className="w-6 h-6 text-clio-blue" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                Secure Payment
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">
                Complete your travel booking payment securely
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-120px)] p-8 space-y-8">
          {/* Payment Summary */}
          <div className="bg-clio-gray-50 dark:bg-clio-gray-950/50 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800 p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-4 ml-1">Order Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">{quote.title}</span>
                <span className="font-medium text-clio-gray-600 dark:text-clio-gray-400">{formatCurrency(quote.totalCost)}</span>
              </div>
              <div className="border-t border-clio-gray-100 dark:border-clio-gray-800 pt-4 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500">
                    {paymentData.paymentMethod === 'deposit' ? `Deposit (25%)` : 'Full Payment'}
                  </span>
                  <span className="text-xl font-black text-clio-blue">{formatCurrency(paymentAmount)}</span>
                </div>
                {paymentData.paymentMethod === 'deposit' && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-clio-gray-100 dark:border-clio-gray-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Remaining balance due later</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500">{formatCurrency(quote.totalCost - depositAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Payment Option</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'full' }))}
                className={`p-5 rounded-2xl border text-left transition-all duration-200 group ${
                  paymentData.paymentMethod === 'full'
                    ? 'border-clio-blue bg-clio-blue/5 text-clio-blue shadow-sm'
                    : 'border-clio-gray-100 dark:border-clio-gray-800 hover:border-clio-gray-300 dark:hover:border-clio-gray-700'
                }`}
              >
                <DollarSign className={`w-6 h-6 mb-3 ${paymentData.paymentMethod === 'full' ? 'text-clio-blue' : 'text-clio-gray-400 group-hover:text-clio-gray-600'}`} />
                <div className="font-bold uppercase tracking-tight text-sm mb-1">Pay in Full</div>
                <div className="text-[10px] font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest">
                  {formatCurrency(quote.totalCost)}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'deposit' }))}
                className={`p-5 rounded-2xl border text-left transition-all duration-200 group ${
                  paymentData.paymentMethod === 'deposit'
                    ? 'border-clio-blue bg-clio-blue/5 text-clio-blue shadow-sm'
                    : 'border-clio-gray-100 dark:border-clio-gray-800 hover:border-clio-gray-300 dark:hover:border-clio-gray-700'
                }`}
              >
                <Calendar className={`w-6 h-6 mb-3 ${paymentData.paymentMethod === 'deposit' ? 'text-clio-blue' : 'text-clio-gray-400 group-hover:text-clio-gray-600'}`} />
                <div className="font-bold uppercase tracking-tight text-sm mb-1">Pay Deposit</div>
                <div className="text-[10px] font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest">
                  {formatCurrency(depositAmount)} now
                </div>
              </button>
            </div>
          </div>

          {/* Card Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-900 dark:text-white">Card Information</span>
              <Shield className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Card Number</Label>
              <Input
                id="cardNumber"
                type="text"
                value={paymentData.cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className={`h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-950 font-bold tracking-widest ${errors.cardNumber ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1 ml-1">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Expiry Month */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Month</Label>
                <Select
                  value={paymentData.expiryMonth}
                  onValueChange={(value) => setPaymentData(prev => ({ ...prev, expiryMonth: value }))}
                >
                  <SelectTrigger className={`h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-950 font-bold ${errors.expiry ? 'border-red-500 focus:ring-red-500/20' : ''}`}>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateMonths().map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expiry Year */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Year</Label>
                <Select
                  value={paymentData.expiryYear}
                  onValueChange={(value) => setPaymentData(prev => ({ ...prev, expiryYear: value }))}
                >
                  <SelectTrigger className={`h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-950 font-bold ${errors.expiry ? 'border-red-500 focus:ring-red-500/20' : ''}`}>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYears().map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CVV */}
              <div className="space-y-2">
                <Label htmlFor="cvv" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="123"
                  maxLength={4}
                  className={`h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-950 font-bold tracking-widest ${errors.cvv ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                />
              </div>
            </div>

            {errors.expiry && (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1">{errors.expiry}</p>
            )}
            {errors.cvv && !errors.expiry && (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1">{errors.cvv}</p>
            )}
          </div>

          {/* Billing Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-8 h-8 bg-clio-gray-100 dark:bg-clio-gray-800 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-clio-gray-600 dark:text-clio-gray-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-900 dark:text-white">Billing Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cardholderName" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  type="text"
                  value={paymentData.cardholderName}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, cardholderName: e.target.value }))}
                  placeholder="John Doe"
                  className={`h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-950 font-bold ${errors.cardholderName ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                />
                {errors.cardholderName && (
                  <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1 ml-1">{errors.cardholderName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={paymentData.email}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className={`h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-950 font-bold ${errors.email ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1 ml-1">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-8 border-t border-clio-gray-100 dark:border-clio-gray-800">
            <button 
              type="button" 
              onClick={handleClose}
              className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel Payment
            </button>
            <Button 
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest h-14 px-10 rounded-xl shadow-lg shadow-green-600/20 min-w-[200px]"
            >
              <CreditCard className="w-5 h-5 mr-3" />
              Pay {formatCurrency(paymentAmount)}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50/50 dark:bg-green-950/20 rounded-2xl p-5 border border-green-100 dark:border-green-900/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-xs font-medium text-clio-gray-600 dark:text-clio-gray-400 leading-relaxed">
                <strong className="text-green-600 font-bold uppercase tracking-tight">Encrypted Checkout:</strong> Your payment information is processed securely using industry-standard encryption. We never store your full card details on our servers.
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState } from 'react';
import { TravelQuote, TravelItem, Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { 
  Calendar, 
  MapPin, 
  Plane, 
  Hotel, 
  Car, 
  Clock,
  DollarSign,
  MessageSquare,
  CreditCard,
  Check,
  X,
  FileText,
  User,
  Mail,
  Download,
  CalendarPlus,
} from 'lucide-react';
import moment from 'moment';
import { ClientMessageModal } from './ClientMessageModal';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { downloadICSFile, generateGoogleCalendarLink } from '@/lib/calendar-export';

interface ClientQuoteViewProps {
  quote: TravelQuote;
  contact: Contact;
  agentName?: string;
  agentEmail?: string;
  onQuoteAction?: (action: 'accept' | 'reject' | 'message' | 'payment') => void;
}

interface PaymentConfirmationData {
  paymentId: string;
  paymentStatus: 'unpaid' | 'deposit_paid' | 'partially_paid' | 'paid_in_full';
  totalPaid: number;
  remainingBalance: number;
  receiptUrl?: string;
}

export function ClientQuoteView({
  quote,
  contact,
  agentName = 'Your Travel Agent',
  agentEmail,
  onQuoteAction
}: ClientQuoteViewProps) {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState(quote.status);
  const [paymentInfo, setPaymentInfo] = useState<PaymentConfirmationData | null>(null);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5 text-blue-600" />;
      case 'hotel': return <Hotel className="w-5 h-5 text-green-600" />;
      case 'activity': return <MapPin className="w-5 h-5 text-purple-600" />;
      case 'transfer': return <Car className="w-5 h-5 text-orange-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'flight': return 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'hotel': return 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'activity': return 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'transfer': return 'bg-violet-50/50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800';
      default: return 'bg-clio-gray-50/50 dark:bg-clio-gray-800/50 border-clio-gray-200 dark:border-clio-gray-700';
    }
  };

  const formatItemDetails = (item: TravelItem) => {
    const details = [];
    
    if (item.startDate) {
      const startDate = moment(item.startDate);
      const endDate = item.endDate ? moment(item.endDate) : null;
      
      if (endDate && !startDate.isSame(endDate, 'day')) {
        details.push(`${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`);
      } else {
        details.push(startDate.format('MMM D, YYYY [at] h:mm A'));
      }
    }

    // Add specific details based on type
    if (item.details) {
      const itemDetails = item.details as Record<string, unknown>;
      switch (item.type) {
        case 'flight':
          if (itemDetails.departure_airport && itemDetails.arrival_airport) {
            details.push(`${itemDetails.departure_airport} → ${itemDetails.arrival_airport}`);
          }
          if (itemDetails.flight_number) {
            details.push(`Flight ${itemDetails.flight_number}`);
          }
          break;
        case 'hotel':
          if (itemDetails.location) {
            const location = itemDetails.location as unknown;
            if (typeof location === 'string') {
              details.push(location);
            } else if (location && typeof location === 'object' && 'city' in location && 'country' in location) {
              const loc = location as { city: string; country: string };
              details.push(`${loc.city}, ${loc.country}`);
            }
          }
          if (itemDetails.room_type) {
            details.push(itemDetails.room_type);
          }
          if (itemDetails.nights) {
            details.push(`${itemDetails.nights} night${itemDetails.nights > 1 ? 's' : ''}`);
          }
          break;
        case 'activity':
          if (itemDetails.location) {
            const location = itemDetails.location as unknown;
            if (typeof location === 'string') {
              details.push(location);
            } else if (location && typeof location === 'object' && 'city' in location && 'country' in location) {
              const loc = location as { city: string; country: string };
              details.push(`${loc.city}, ${loc.country}`);
            }
          }
          if (itemDetails.duration) {
            details.push(`${itemDetails.duration} hours`);
          }
          break;
        case 'transfer':
          if (itemDetails.from && itemDetails.to) {
            details.push(`${itemDetails.from} → ${itemDetails.to}`);
          }
          break;
      }
    }

    return details;
  };

  const handleAcceptQuote = () => {
    setQuoteStatus('accepted');
    onQuoteAction?.('accept');
  };

  const handleRejectQuote = () => {
    setQuoteStatus('rejected');
    onQuoteAction?.('reject');
  };

  const handleSendMessage = (message: string, requestChanges: boolean) => {
    onQuoteAction?.('message');
    // Here you would typically send the message to the backend
    console.log('Message sent:', { message, requestChanges, quoteId: quote.id });
  };

  const handlePaymentSuccess = (paymentData?: PaymentConfirmationData) => {
    console.log('✅ Payment successful for quote:', quote.id, paymentData);

    if (paymentData) {
      setPaymentInfo(paymentData);
      // Update quote status based on payment status
      if (paymentData.paymentStatus === 'paid_in_full') {
        setQuoteStatus('confirmed');
      } else if (paymentData.paymentStatus === 'deposit_paid') {
        setQuoteStatus('accepted');
      }
    } else {
      setQuoteStatus('accepted');
    }

    onQuoteAction?.('payment');
    setShowPaymentModal(false);
  };

  const handleDownloadCalendar = () => {
    downloadICSFile(quote);
  };

  const handleAddToGoogleCalendar = (item: TravelItem) => {
    const url = generateGoogleCalendarLink(item, quote);
    window.open(url, '_blank');
  };

  const groupedItems = quote.items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, TravelItem[]>);

  const isQuoteFinal = quoteStatus === 'accepted' || quoteStatus === 'rejected';

  return (
    <div className="min-h-screen bg-white dark:bg-clio-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-clio-gray-900 border-b border-clio-gray-100 dark:border-clio-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-clio-blue text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-clio-blue/20">
                  Client Portal
                </div>
                <h1 className="text-sm font-bold text-clio-gray-400 uppercase tracking-widest">
                  Your Travel Quote
                </h1>
              </div>
              <h2 className="text-4xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tighter">
                {quote.title}
              </h2>
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center text-xs font-bold text-clio-gray-600 dark:text-clio-gray-400 uppercase tracking-tight">
                  <Calendar className="w-4 h-4 mr-2 text-clio-blue" />
                  {moment(quote.travelDates.start).format('MMM D')} - {moment(quote.travelDates.end).format('MMM D, YYYY')}
                </div>
                <div className="flex items-center text-xs font-bold text-clio-gray-600 dark:text-clio-gray-400 uppercase tracking-tight">
                  <div className="w-6 h-6 rounded-full bg-clio-gray-100 dark:bg-clio-gray-800 flex items-center justify-center mr-2">
                    <User className="w-3 h-3 text-clio-gray-500" />
                  </div>
                  Prepared by {agentName}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-4 min-w-[200px]">
              <div className="flex flex-col items-end gap-2">
                <Badge
                  className={`${
                    quoteStatus === 'sent' ? 'bg-clio-blue/10 text-clio-blue border-clio-blue/20' :
                    quoteStatus === 'confirmed' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' :
                    quoteStatus === 'accepted' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' :
                    quoteStatus === 'rejected' ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' :
                    'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-600'
                  } border-none shadow-none text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full`}
                >
                  {quoteStatus === 'sent' ? 'Pending Response' :
                   quoteStatus === 'confirmed' ? 'Confirmed' :
                   quoteStatus === 'accepted' ? 'Accepted' :
                   quoteStatus === 'rejected' ? 'Rejected' :
                   quoteStatus.charAt(0).toUpperCase() + quoteStatus.slice(1)}
                </Badge>

                {paymentInfo && (
                  <Badge className="bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                    {paymentInfo.paymentStatus === 'paid_in_full' ? '💰 Paid in Full' :
                     paymentInfo.paymentStatus === 'deposit_paid' ? '💳 Deposit Paid' :
                     '💵 Payment Received'}
                  </Badge>
                )}
              </div>

              <div className="text-right bg-clio-gray-50 dark:bg-clio-gray-800/50 p-4 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800 w-full">
                <div className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest mb-1">Total Quote Value</div>
                <div className="text-3xl font-black text-clio-gray-900 dark:text-white">
                  {formatCurrency(quote.totalCost)}
                </div>
                {paymentInfo && paymentInfo.remainingBalance > 0 && (
                  <div className="text-[10px] font-black text-red-600 dark:text-red-400 mt-2 uppercase tracking-widest">
                    Balance Due: {formatCurrency(paymentInfo.remainingBalance)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Trip Overview */}
        <div className="bg-white dark:bg-clio-gray-900 rounded-3xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm mb-10 overflow-hidden">
          <div className="px-8 py-6 border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/50 dark:bg-clio-gray-800/20">
            <h3 className="text-sm font-black text-clio-gray-900 dark:text-white uppercase tracking-widest">Trip Overview</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-6 bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
              <div className="w-12 h-12 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm mb-4">
                <Calendar className="w-6 h-6 text-clio-blue" />
              </div>
              <div className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest mb-1">Duration</div>
              <div className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                {moment(quote.travelDates.end).diff(moment(quote.travelDates.start), 'days') + 1} days
              </div>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
              <div className="w-12 h-12 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm mb-4">
                <FileText className="w-6 h-6 text-clio-blue" />
              </div>
              <div className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest mb-1">Items Included</div>
              <div className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                {quote.items.length} component{quote.items.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
              <div className="w-12 h-12 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm mb-4">
                <DollarSign className="w-6 h-6 text-clio-blue" />
              </div>
              <div className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest mb-1">Total Value</div>
              <div className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                {formatCurrency(quote.totalCost)}
              </div>
            </div>
          </div>
        </div>

        {/* Travel Items by Category */}
        <div className="space-y-10 mb-12">
          {Object.entries(groupedItems).map(([type, items]) => (
            <div key={type} className="bg-white dark:bg-clio-gray-900 rounded-3xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/50 dark:bg-clio-gray-800/20 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-clio-gray-900 flex items-center justify-center shadow-sm">
                    {getItemIcon(type)}
                  </div>
                  <h3 className="text-sm font-black text-clio-gray-900 dark:text-white uppercase tracking-widest">
                    {type}s ({items.length})
                  </h3>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`rounded-2xl p-6 transition-all duration-300 border hover:shadow-md ${getItemTypeColor(item.type)}`}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight leading-tight">{item.name}</h4>
                          <div className="text-xl font-black text-clio-gray-900 dark:text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-6 flex-1">
                          {formatItemDetails(item).map((detail, index) => (
                            <div key={index} className="flex items-center text-xs font-bold text-clio-gray-600 dark:text-clio-gray-400 uppercase tracking-tight">
                              <Clock className="w-3.5 h-3.5 mr-2 text-clio-blue" />
                              {detail}
                            </div>
                          ))}
                          {item.quantity > 1 && (
                            <div className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest pt-2">
                              Quantity: {item.quantity} • {formatCurrency(item.price)} each
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddToGoogleCalendar(item)}
                          className="text-[10px] font-black uppercase tracking-widest text-clio-blue hover:bg-clio-blue/10 w-full mt-auto bg-clio-gray-50 dark:bg-clio-gray-800"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 mr-2" />
                          Add to Calendar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quote Summary Table */}
        <div className="bg-white dark:bg-clio-gray-900 rounded-3xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm mb-10 overflow-hidden">
          <div className="px-8 py-6 border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/50 dark:bg-clio-gray-800/20">
            <h3 className="text-sm font-black text-clio-gray-900 dark:text-white uppercase tracking-widest">Financial Summary</h3>
          </div>
          <div className="p-8 space-y-4">
            {Object.entries(groupedItems).map(([type, items]) => {
              const typeTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              return (
                <div key={type} className="flex justify-between items-center px-4 py-3 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-800/30">
                  <span className="text-xs font-bold text-clio-gray-600 dark:text-clio-gray-400 uppercase tracking-widest capitalize">
                    {type}s ({items.length} item{items.length !== 1 ? 's' : ''})
                  </span>
                  <span className="text-sm font-black text-clio-gray-900 dark:text-white">{formatCurrency(typeTotal)}</span>
                </div>
              );
            })}
            <div className="mt-6 pt-6 border-t-2 border-dashed border-clio-gray-100 dark:border-clio-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-clio-gray-900 dark:text-white uppercase tracking-widest">Total Trip Investment</span>
                <span className="text-4xl font-black text-clio-blue">{formatCurrency(quote.totalCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isQuoteFinal && quoteStatus === 'sent' && (
          <div className="bg-clio-navy dark:bg-clio-blue rounded-3xl p-10 mb-10 shadow-2xl shadow-clio-blue/30 text-white animate-in zoom-in-95 duration-500">
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 text-center">Ready to book your trip?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="bg-white text-clio-blue hover:bg-clio-gray-50 font-black uppercase tracking-widest h-16 rounded-2xl shadow-xl shadow-black/20"
              >
                <CreditCard className="w-6 h-6 mr-3" />
                Deposit & Confirm
              </Button>
              
              <Button 
                onClick={handleAcceptQuote}
                className="bg-transparent text-white border-2 border-white/20 hover:bg-white/10 font-black uppercase tracking-widest h-16 rounded-2xl"
              >
                <Check className="w-6 h-6 mr-3" />
                Accept Quote
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 mt-10 pt-10 border-t border-white/10">
              <button 
                onClick={() => setShowMessageModal(true)}
                className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors flex items-center"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Request Changes
              </button>
              <button 
                onClick={handleRejectQuote}
                className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-red-400 transition-colors flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Decline Quote
              </button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {isQuoteFinal && (
          <div className="bg-white dark:bg-clio-gray-900 rounded-3xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-xl p-10 mb-10">
            <div className="flex flex-col items-center text-center max-w-xl mx-auto">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg ${
                quoteStatus === 'accepted' || quoteStatus === 'confirmed' 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                  : 'bg-red-500 text-white shadow-red-500/20'
              }`}>
                {quoteStatus === 'accepted' || quoteStatus === 'confirmed' ? (
                  <Check className="w-10 h-10" />
                ) : (
                  <X className="w-10 h-10" />
                )}
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter text-clio-gray-900 dark:text-white mb-4">
                Quote {quoteStatus === 'accepted' || quoteStatus === 'confirmed' ? 'Accepted' : 'Declined'}
              </h3>
              <p className="text-lg font-medium text-clio-gray-600 dark:text-clio-gray-400 mb-8">
                {quoteStatus === 'accepted' || quoteStatus === 'confirmed'
                  ? 'Excellent choice! Your travel agent has been notified and will be in touch shortly with the next steps for your journey.'
                  : 'We understand. This quote has been declined. Please reach out to your agent if you\'d like to explore other options.'
                }
              </p>

              {(quoteStatus === 'accepted' || quoteStatus === 'confirmed') && !paymentInfo && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-clio-blue hover:bg-clio-blue-hover text-white font-black uppercase tracking-widest h-14 px-10 rounded-2xl shadow-xl shadow-clio-blue/20"
                >
                  <CreditCard className="w-5 h-5 mr-3" />
                  Proceed to Secure Payment
                </Button>
              )}
            </div>

            {/* Payment Status Display */}
            {paymentInfo && (
              <div className="mt-10 p-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-3xl">
                <div className="flex items-start space-x-6">
                  <div className="w-14 h-14 bg-white dark:bg-clio-gray-950 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-tight mb-2">
                      {paymentInfo.paymentStatus === 'paid_in_full' ? 'Payment Confirmed' : 'Deposit Received'}
                    </h4>
                    <div className="text-emerald-800 dark:text-emerald-500 font-medium space-y-3">
                      <p className="text-lg">
                        {paymentInfo.paymentStatus === 'paid_in_full'
                          ? `Your full payment of ${formatCurrency(paymentInfo.totalPaid)} has been received and processed successfully.`
                          : `Your deposit of ${formatCurrency(paymentInfo.totalPaid)} has been received. Your booking is now secured.`
                        }
                      </p>
                      {paymentInfo.remainingBalance > 0 && (
                        <div className="inline-block px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-sm font-bold uppercase tracking-tight">
                          Remaining balance: {formatCurrency(paymentInfo.remainingBalance)}
                        </div>
                      )}
                      {paymentInfo.receiptUrl && (
                        <div className="pt-2">
                          <a
                            href={paymentInfo.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline font-black uppercase tracking-widest text-[10px]"
                          >
                            Download Receipt <Download className="w-3 h-3 ml-2" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {paymentInfo.paymentStatus === 'deposit_paid' && paymentInfo.remainingBalance > 0 && (
                  <div className="mt-8 pt-8 border-t border-emerald-200/50 dark:border-emerald-800/50">
                    <Button
                      onClick={() => setShowPaymentModal(true)}
                      className="bg-clio-blue hover:bg-clio-blue-hover text-white font-black uppercase tracking-widest h-14 px-10 rounded-2xl shadow-xl shadow-clio-blue/20"
                    >
                      <CreditCard className="w-5 h-5 mr-3" />
                      Pay Remaining Balance ({formatCurrency(paymentInfo.remainingBalance)})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help & Contact */}
        <div className="bg-white dark:bg-clio-gray-900 rounded-3xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm p-8">
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1">
              <h3 className="text-sm font-black text-clio-gray-900 dark:text-white uppercase tracking-widest mb-6">Your Dedicated Agent</h3>
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 rounded-full bg-clio-gray-100 dark:bg-clio-gray-800 flex items-center justify-center text-clio-gray-400">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight mb-1">{agentName}</div>
                  {agentEmail && (
                    <a href={`mailto:${agentEmail}`} className="text-sm font-bold text-clio-blue hover:underline uppercase tracking-tight flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {agentEmail}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 border-l border-clio-gray-100 dark:border-clio-gray-800 pl-0 md:pl-10">
              <h3 className="text-sm font-black text-clio-gray-900 dark:text-white uppercase tracking-widest mb-6">Need Assistance?</h3>
              <Button 
                variant="outline"
                onClick={() => setShowMessageModal(true)}
                className="w-full h-14 border-2 border-clio-gray-200 dark:border-clio-gray-800 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800 font-black uppercase tracking-widest rounded-2xl"
              >
                <MessageSquare className="w-5 h-5 mr-3 text-clio-blue" />
                Send a Message
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Tools */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={handleDownloadCalendar}
            className="flex items-center justify-center space-x-3 h-14 bg-clio-gray-50 dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 text-[10px] font-black uppercase tracking-widest text-clio-gray-500 hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 transition-all"
          >
            <Download className="w-4 h-4 text-clio-blue" />
            <span>Download Calendar (.ics)</span>
          </button>
          
          <button 
            onClick={() => window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(quote.title)}&dates=${moment(quote.travelDates.start).format('YYYYMMDD')}/${moment(quote.travelDates.end).format('YYYYMMDD')}&details=${encodeURIComponent(`Travel itinerary for ${quote.title}. Total cost: ${formatCurrency(quote.totalCost)}`)}`, '_blank')}
            className="flex items-center justify-center space-x-3 h-14 bg-clio-gray-50 dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 text-[10px] font-black uppercase tracking-widest text-clio-gray-500 hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 transition-all"
          >
            <CalendarPlus className="w-4 h-4 text-clio-blue" />
            <span>Sync to Google Calendar</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <ClientMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        onSend={handleSendMessage}
        agentName={agentName}
      />

      <PaymentModal
        quote={quote}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
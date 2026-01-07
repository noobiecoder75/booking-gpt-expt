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
    <div className="min-h-screen bg-clio-gray-50 dark:bg-clio-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-clio-gray-900 border-b border-clio-gray-200 dark:border-clio-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-clio-gray-900 dark:text-white mb-2">
                Your Travel Quote
              </h1>
              <h2 className="text-xl text-clio-gray-700 dark:text-clio-gray-300 mb-1">
                {quote.title}
              </h2>
              <div className="flex items-center text-sm text-clio-gray-600 dark:text-clio-gray-400 space-x-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {moment(quote.travelDates.start).format('MMM D')} - {moment(quote.travelDates.end).format('MMM D, YYYY')}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Prepared by {agentName}
                </div>
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="flex flex-col items-end space-y-2">
                <Badge
                  className={`${
                    quoteStatus === 'sent' ? 'bg-clio-blue/10 text-clio-blue border-clio-blue/20' :
                    quoteStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                    quoteStatus === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                    quoteStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-clio-gray-100 text-clio-gray-800'
                  }`}
                >
                  {quoteStatus === 'sent' ? 'Pending Response' :
                   quoteStatus === 'confirmed' ? 'Confirmed' :
                   quoteStatus === 'accepted' ? 'Accepted' :
                   quoteStatus === 'rejected' ? 'Rejected' :
                   quoteStatus.charAt(0).toUpperCase() + quoteStatus.slice(1)}
                </Badge>

                {paymentInfo && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                    {paymentInfo.paymentStatus === 'paid_in_full' ? '💰 Paid in Full' :
                     paymentInfo.paymentStatus === 'deposit_paid' ? '💳 Deposit Paid' :
                     '💵 Payment Received'}
                  </Badge>
                )}
              </div>

              <div className="text-right">
                <div className="text-sm text-clio-gray-600 dark:text-clio-gray-400">Total Cost</div>
                <div className="text-2xl font-bold text-clio-gray-900 dark:text-white">
                  {formatCurrency(quote.totalCost)}
                </div>
                {paymentInfo && paymentInfo.remainingBalance > 0 && (
                  <div className="text-xs text-orange-600 mt-1 font-medium">
                    Balance Due: {formatCurrency(paymentInfo.remainingBalance)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Trip Overview */}
        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm mb-6 p-6">
          <h3 className="text-lg font-semibold text-clio-gray-900 dark:text-white mb-4">Trip Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-lg">
              <Calendar className="w-8 h-8 text-clio-gray-600 dark:text-clio-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-clio-gray-900 dark:text-white">Duration</div>
              <div className="text-sm text-clio-gray-600 dark:text-clio-gray-400">
                {moment(quote.travelDates.end).diff(moment(quote.travelDates.start), 'days') + 1} days
              </div>
            </div>
            <div className="text-center p-4 bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-lg">
              <FileText className="w-8 h-8 text-clio-gray-600 dark:text-clio-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-clio-gray-900 dark:text-white">Items Included</div>
              <div className="text-sm text-clio-gray-600 dark:text-clio-gray-400">
                {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="text-center p-4 bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-lg">
              <DollarSign className="w-8 h-8 text-clio-gray-600 dark:text-clio-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-clio-gray-900 dark:text-white">Total Value</div>
              <div className="text-sm text-clio-gray-600 dark:text-clio-gray-400">
                {formatCurrency(quote.totalCost)}
              </div>
            </div>
          </div>
        </div>

        {/* Travel Items by Category */}
        {Object.entries(groupedItems).map(([type, items]) => (
          <div key={type} className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-clio-gray-200 dark:border-clio-gray-800 bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-t-xl">
              <div className="flex items-center space-x-2">
                {getItemIcon(type)}
                <h3 className="text-lg font-semibold text-clio-gray-900 dark:text-white capitalize">
                  {type}s ({items.length})
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg p-4 transition-colors ${getItemTypeColor(item.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-clio-gray-900 dark:text-white mb-2">{item.name}</h4>
                        <div className="space-y-1 text-sm text-clio-gray-600 dark:text-clio-gray-400">
                          {formatItemDetails(item).map((detail, index) => (
                            <div key={index} className="flex items-center">
                              <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                              {detail}
                            </div>
                          ))}
                        </div>
                        {item.quantity > 1 && (
                          <div className="mt-2 text-sm text-clio-gray-600 dark:text-clio-gray-400">
                            Quantity: {item.quantity}
                          </div>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-lg font-bold text-clio-gray-900 dark:text-white">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-sm text-clio-gray-600 dark:text-clio-gray-400">
                            {formatCurrency(item.price)} each
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToGoogleCalendar(item)}
                          className="text-xs bg-white dark:bg-clio-gray-800"
                        >
                          <CalendarPlus className="w-3 h-3 mr-1" />
                          Add to Calendar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Quote Summary */}
        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm mb-6 p-6">
          <h3 className="text-lg font-semibold text-clio-gray-900 dark:text-white mb-4">Quote Summary</h3>
          <div className="space-y-3">
            {Object.entries(groupedItems).map(([type, items]) => {
              const typeTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              return (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-clio-gray-600 dark:text-clio-gray-400 capitalize">
                    {type}s ({items.length} item{items.length !== 1 ? 's' : ''})
                  </span>
                  <span className="font-medium text-clio-gray-900 dark:text-white">{formatCurrency(typeTotal)}</span>
                </div>
              );
            })}
            <div className="border-t border-clio-gray-200 dark:border-clio-gray-800 pt-3">
              <div className="flex justify-between items-center text-lg font-bold text-clio-gray-900 dark:text-white">
                <span>Total</span>
                <span className="text-clio-blue dark:text-clio-blue">{formatCurrency(quote.totalCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Export */}
        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-clio-gray-900 dark:text-white mb-4">Add to Your Calendar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleDownloadCalendar}
              variant="outline"
              className="flex items-center justify-center space-x-2 h-12 bg-white dark:bg-clio-gray-800"
            >
              <Download className="w-5 h-5" />
              <span>Download Calendar (.ics)</span>
            </Button>
            
            <Button 
              onClick={() => window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(quote.title)}&dates=${moment(quote.travelDates.start).format('YYYYMMDD')}/${moment(quote.travelDates.end).format('YYYYMMDD')}&details=${encodeURIComponent(`Travel itinerary for ${quote.title}. Total cost: ${formatCurrency(quote.totalCost)}`)}`, '_blank')}
              variant="outline"
              className="flex items-center justify-center space-x-2 h-12 text-clio-blue border-clio-blue/30 hover:bg-clio-blue/5 dark:bg-clio-gray-800"
            >
              <CalendarPlus className="w-5 h-5" />
              <span>Add Trip to Google Calendar</span>
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        {!isQuoteFinal && quoteStatus === 'sent' && (
          <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold text-clio-gray-900 dark:text-white mb-4 text-center md:text-left">What would you like to do?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={handleAcceptQuote}
                className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white h-12"
              >
                <Check className="w-5 h-5" />
                <span>Accept Quote</span>
              </Button>
              
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center justify-center space-x-2 bg-clio-blue hover:bg-clio-blue-hover text-white h-12"
              >
                <CreditCard className="w-5 h-5" />
                <span>Accept & Pay</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowMessageModal(true)}
                className="flex items-center justify-center space-x-2 h-12 bg-white dark:bg-clio-gray-800"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Request Changes</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleRejectQuote}
                className="flex items-center justify-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 dark:bg-clio-gray-800 h-12"
              >
                <X className="w-5 h-5" />
                <span>Decline Quote</span>
              </Button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {isQuoteFinal && (
          <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm p-6 mt-6">
            <div className={`flex items-center space-x-3 ${
              quoteStatus === 'accepted' || quoteStatus === 'confirmed' ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {quoteStatus === 'accepted' || quoteStatus === 'confirmed' ? (
                <Check className="w-6 h-6" />
              ) : (
                <X className="w-6 h-6" />
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  Quote {quoteStatus === 'accepted' || quoteStatus === 'confirmed' ? 'Accepted' : 'Declined'}
                </h3>
                <p className="text-sm text-clio-gray-600 dark:text-clio-gray-400">
                  {quoteStatus === 'accepted' || quoteStatus === 'confirmed'
                    ? 'Thank you for accepting this quote. Your travel agent will be in touch shortly with next steps.'
                    : 'You have declined this quote. Feel free to reach out if you\'d like to discuss alternatives.'
                  }
                </p>
              </div>
            </div>

            {/* Payment Status Display */}
            {paymentInfo && (
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-emerald-800 dark:text-emerald-400 mb-1">
                      {paymentInfo.paymentStatus === 'paid_in_full' ? 'Payment Complete!' : 'Deposit Received!'}
                    </h4>
                    <div className="text-sm text-emerald-700 dark:text-emerald-500 space-y-1">
                      <p>
                        {paymentInfo.paymentStatus === 'paid_in_full'
                          ? `Your payment of ${formatCurrency(paymentInfo.totalPaid)} has been received and processed.`
                          : `Your deposit of ${formatCurrency(paymentInfo.totalPaid)} has been received.`
                        }
                      </p>
                      {paymentInfo.remainingBalance > 0 && (
                        <p className="font-medium">
                          Remaining balance: {formatCurrency(paymentInfo.remainingBalance)}
                        </p>
                      )}
                      {paymentInfo.receiptUrl && (
                        <a
                          href={paymentInfo.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 underline mt-2"
                        >
                          View Receipt →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(quoteStatus === 'accepted' || quoteStatus === 'confirmed') && !paymentInfo && (
              <div className="mt-4 pt-4 border-t border-clio-gray-200 dark:border-clio-gray-800">
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-clio-blue hover:bg-clio-blue-hover text-white"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceed to Payment
                </Button>
              </div>
            )}

            {/* Show remaining balance payment option if deposit was paid */}
            {paymentInfo && paymentInfo.paymentStatus === 'deposit_paid' && paymentInfo.remainingBalance > 0 && (
              <div className="mt-4 pt-4 border-t border-clio-gray-200 dark:border-clio-gray-800">
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-clio-blue hover:bg-clio-blue-hover text-white"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Remaining Balance ({formatCurrency(paymentInfo.remainingBalance)})
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Contact Information */}
        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-clio-gray-900 dark:text-white mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-clio-gray-900 dark:text-white mb-2">Your Travel Agent</h4>
              <div className="space-y-2 text-sm text-clio-gray-600 dark:text-clio-gray-400">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {agentName}
                </div>
                {agentEmail && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <a href={`mailto:${agentEmail}`} className="text-clio-blue hover:underline">
                      {agentEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-clio-gray-900 dark:text-white mb-2">Have Questions?</h4>
              <Button 
                variant="outline"
                onClick={() => setShowMessageModal(true)}
                className="w-full bg-white dark:bg-clio-gray-800"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <ClientMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        onSend={handleSendMessage}
        agentName={agentName}
      />

      {/* Payment Modal - Real Stripe Integration */}
      <PaymentModal
        quote={quote}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
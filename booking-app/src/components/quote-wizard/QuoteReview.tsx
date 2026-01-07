'use client';

import { useState, useMemo } from 'react';
import { TravelQuote, Contact } from '@/types';
import { useQuoteMutations } from '@/hooks/mutations/useQuoteMutations';
import { Button } from '@/components/ui/button';
import { formatCurrency, getContactDisplayName, formatDate, detectDestinationMismatches, DestinationMismatch, calculateQuoteTotal } from '@/lib/utils';
import { generateClientQuoteLink } from '@/lib/client-links';
import { Plane, Hotel, MapPin, Car, FileText, Send, AlertTriangle, X, Copy, Check } from 'lucide-react';

interface QuoteReviewProps {
  quote: TravelQuote;
  contact: Contact;
  onComplete: () => void;
}

export function QuoteReview({ quote, contact, onComplete }: QuoteReviewProps) {
  const { updateQuote } = useQuoteMutations();
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [detectedMismatches, setDetectedMismatches] = useState<DestinationMismatch[]>([]);
  const [quoteSent, setQuoteSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Calculate total from items as fallback/safety measure
  const displayTotal = calculateQuoteTotal(quote.items) || quote.totalCost;

  // Generate client link only when quote has all required fields
  const clientLink = useMemo(() => {
    if (!quote.id || !quote.contactId) {
      return '';
    }
    return generateClientQuoteLink(quote);
  }, [quote]);

  const handleSendQuote = () => {
    // Check for destination mismatches before sending
    const mismatches = detectDestinationMismatches(quote.items);

    if (mismatches.length > 0) {
      // Show warning modal
      setDetectedMismatches(mismatches);
      setShowMismatchModal(true);
    } else {
      // No mismatches, proceed with send
      proceedWithSend();
    }
  };

  const proceedWithSend = (overridden = false) => {
    // Record override in quote if applicable
    if (overridden) {
      const validationOverride = {
        timestamp: new Date().toISOString(),
        type: 'destination-mismatch' as const,
        overriddenBy: 'agent' as const,
        mismatches: detectedMismatches,
      };

      updateQuote.mutate({
        id: quote.id,
        updates: {
          status: 'sent',
          validationOverrides: [validationOverride],
        },
      });

      console.log('⚠️  Destination mismatch override recorded:', validationOverride);
    } else {
      updateQuote.mutate({
        id: quote.id,
        updates: { status: 'sent' },
      });
    }

    setShowMismatchModal(false);
    setQuoteSent(true);
  };

  const handleCopyClientLink = async () => {
    try {
      await navigator.clipboard.writeText(clientLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy client link');
    }
  };

  const handleSaveDraft = () => {
    updateQuote.mutate(
      {
        id: quote.id,
        updates: { status: 'draft' },
      },
      {
        onSuccess: () => {
          onComplete();
        },
      }
    );
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'hotel': return <Hotel className="w-5 h-5" />;
      case 'activity': return <MapPin className="w-5 h-5" />;
      case 'transfer': return <Car className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">
          Review Quote
        </h2>
        <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium">
          Final check of the itinerary and pricing before sending to client
        </p>
      </div>

      {/* Quote Summary */}
      <div className="bg-clio-navy dark:bg-clio-blue rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black tracking-tight">{quote.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">For</span>
              <span className="text-sm font-bold uppercase tracking-tight">{getContactDisplayName(contact.firstName, contact.lastName)}</span>
            </div>
            <div className="flex items-center gap-2 mt-4 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 w-fit">
              <Calendar className="w-4 h-4 opacity-70" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {formatDate(quote.travelDates.start)} - {formatDate(quote.travelDates.end)}
              </span>
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="flex items-center justify-end space-x-4 text-[10px] font-black uppercase tracking-widest opacity-60">
              <span>Cost: {formatCurrency(quote.items.reduce((sum, item) => sum + (item.supplierCost || item.price * 0.80), 0))}</span>
              <span>Profit: {formatCurrency(quote.items.reduce((sum, item) => {
                const supplierCost = item.supplierCost || item.price * 0.80;
                return sum + (item.price - supplierCost);
              }, 0))}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Client Total</span>
              <div className="text-5xl font-black tracking-tighter leading-none">
                {formatCurrency(displayTotal)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Information */}
        <div className="lg:col-span-1 bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800 p-6">
          <h4 className="text-xs font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400 mb-6">Client Information</h4>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-clio-gray-900 flex items-center justify-center border border-clio-gray-100 dark:border-clio-gray-800">
                <FileText className="w-5 h-5 text-clio-blue" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Name</div>
                <div className="font-bold text-clio-gray-900 dark:text-white">{getContactDisplayName(contact.firstName, contact.lastName)}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-clio-gray-900 flex items-center justify-center border border-clio-gray-100 dark:border-clio-gray-800">
                <Send className="w-5 h-5 text-clio-blue" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Email</div>
                <div className="font-bold text-clio-gray-900 dark:text-white truncate max-w-[180px]">{contact.email}</div>
              </div>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-clio-gray-900 flex items-center justify-center border border-clio-gray-100 dark:border-clio-gray-800">
                  <Car className="w-5 h-5 text-clio-blue" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Phone</div>
                  <div className="font-bold text-clio-gray-900 dark:text-white">{contact.phone}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Travel Items */}
        <div className="lg:col-span-2 bg-white dark:bg-clio-gray-950 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm p-8">
          <h4 className="text-xs font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400 mb-6">Travel Itinerary ({quote.items.length})</h4>

          {quote.items.length > 0 ? (
            <div className="space-y-4">
              {quote.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-clio-gray-50/50 dark:bg-clio-gray-900/50 rounded-xl border border-clio-gray-100 dark:border-clio-gray-800 group hover:border-clio-blue/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-clio-gray-800 flex items-center justify-center text-clio-blue border border-clio-gray-100 dark:border-clio-gray-700 shadow-sm">
                      {getItemIcon(item.type)}
                    </div>
                    <div>
                      <div className="font-bold text-clio-gray-900 dark:text-white leading-tight">{item.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">
                          {formatDate(item.startDate)} {item.endDate && `→ ${formatDate(item.endDate)}`}
                        </div>
                        <span className="w-1 h-1 rounded-full bg-clio-gray-300"></span>
                        <div className="text-[10px] font-black text-clio-blue uppercase tracking-widest">
                          {item.type}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-clio-gray-900 dark:text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                    <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">
                      {item.quantity} × {formatCurrency(item.price)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Total */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t-2 border-dashed border-clio-gray-100 dark:border-clio-gray-800">
                <div className="font-bold text-lg text-clio-gray-900 dark:text-white uppercase tracking-tight">Final Quote Total</div>
                <div className="font-black text-3xl text-clio-blue tracking-tighter">
                  {formatCurrency(displayTotal)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-clio-gray-50 dark:bg-clio-gray-900/50 rounded-xl border-2 border-dashed border-clio-gray-200 dark:border-clio-gray-800">
              <p className="text-clio-gray-400 font-bold uppercase tracking-widest text-xs">No travel items added yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Client Link - Show after sending */}
      {quoteSent && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-8 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-black text-emerald-900 dark:text-emerald-400 tracking-tight">Quote Sent Successfully!</h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-500 font-medium">
                The itinerary is now ready for your client to review and accept.
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-clio-gray-900 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full overflow-hidden">
              <div className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-1">Public Share Link</div>
              <code className="block text-sm text-clio-gray-700 dark:text-clio-gray-300 font-mono break-all bg-clio-gray-50 dark:bg-clio-gray-800 p-2 rounded">
                {clientLink}
              </code>
            </div>
            <Button
              size="lg"
              variant={linkCopied ? "default" : "outline"}
              onClick={handleCopyClientLink}
              className={cn(
                "w-full sm:w-auto font-bold uppercase tracking-tight text-xs h-12 px-6 shadow-sm transition-all",
                linkCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              )}
            >
              {linkCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Link Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Client Link
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!quoteSent && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button variant="outline" onClick={handleSaveDraft} className="w-full sm:w-auto h-14 px-10 border-clio-gray-200 dark:border-clio-gray-800 font-black uppercase tracking-tight text-sm">
            <FileText className="w-5 h-5 mr-2 text-clio-gray-400" />
            Save as Draft
          </Button>
          <Button onClick={handleSendQuote} className="w-full sm:w-auto h-14 px-10 bg-clio-blue hover:bg-clio-blue-hover text-white font-black uppercase tracking-tight text-sm shadow-lg shadow-clio-blue/20">
            <Send className="w-5 h-5 mr-2" />
            Send Quote to Client
          </Button>
        </div>
      )}

      {/* Done Button - Show after sending */}
      {quoteSent && (
        <div className="flex justify-center pt-4">
          <Button onClick={onComplete} className="h-14 px-12 bg-clio-navy dark:bg-clio-blue text-white font-black uppercase tracking-tight text-sm shadow-xl">
            Return to Dashboard
          </Button>
        </div>
      )}

      {/* Destination Mismatch Modal */}
      {showMismatchModal && (
        <DestinationMismatchModal
          mismatches={detectedMismatches}
          onCancel={() => setShowMismatchModal(false)}
          onOverride={() => proceedWithSend(true)}
        />
      )}
    </div>

      {/* Destination Mismatch Modal */}
      {showMismatchModal && (
        <DestinationMismatchModal
          mismatches={detectedMismatches}
          onCancel={() => setShowMismatchModal(false)}
          onOverride={() => proceedWithSend(true)}
        />
      )}
    </div>
  );
}

// Destination Mismatch Warning Modal
interface DestinationMismatchModalProps {
  mismatches: DestinationMismatch[];
  onCancel: () => void;
  onOverride: () => void;
}

function DestinationMismatchModal({ mismatches, onCancel, onOverride }: DestinationMismatchModalProps) {
  return (
    <div className="fixed inset-0 bg-clio-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-clio-gray-900 rounded-2xl w-full max-w-2xl shadow-strong overflow-hidden border border-clio-gray-200 dark:border-clio-gray-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-8 border-b border-clio-gray-100 dark:border-clio-gray-800 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 p-2 bg-white dark:bg-clio-gray-900 rounded-xl shadow-sm">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white tracking-tight leading-none mb-2">
                Destination Mismatch
              </h3>
              <p className="text-sm text-clio-gray-600 dark:text-clio-gray-400 font-medium">
                We noticed potential inconsistencies between flight destinations and hotel locations in this itinerary.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-clio-gray-400 hover:text-clio-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mismatches List */}
        <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          <p className="text-xs font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400 mb-4">
            Please review the following items:
          </p>

          {mismatches.map((mismatch, index) => (
            <div
              key={index}
              className="bg-clio-gray-50 dark:bg-clio-gray-800/50 border border-clio-gray-100 dark:border-clio-gray-800 rounded-xl p-5"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <span className="text-sm font-black text-amber-700 dark:text-amber-400">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-white dark:bg-clio-gray-900 rounded-lg shadow-sm">
                      <Plane className="w-4 h-4 text-clio-blue" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Flight Arrival</div>
                      <div className="text-sm font-black text-clio-gray-900 dark:text-white">{mismatch.flightDestination}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-white dark:bg-clio-gray-900 rounded-lg shadow-sm">
                      <Hotel className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Hotel Location</div>
                      <div className="text-sm font-black text-clio-gray-900 dark:text-white">{mismatch.hotelCity}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Warning Message */}
          <div className="bg-clio-blue/5 border border-clio-blue/10 rounded-xl p-5 mt-6">
            <p className="text-xs text-clio-blue font-bold leading-relaxed">
              <span className="mr-2">💡</span>
              This might be intentional (e.g., multi-city trip, airport transfers). If this itinerary is correct, you can override this warning and send the quote anyway.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-8 border-t border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/50 dark:bg-clio-gray-900/50">
          <Button variant="ghost" onClick={onCancel} className="w-full sm:w-auto font-bold uppercase tracking-tight text-xs h-12 px-8">
            <X className="w-4 h-4 mr-2" />
            Cancel & Fix
          </Button>
          <Button
            onClick={onOverride}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-tight text-xs h-12 px-8 shadow-lg shadow-amber-600/20"
          >
            <Send className="w-4 h-4 mr-2" />
            Override & Send Anyway
          </Button>
        </div>
      </div>
    </div>
  );
}
}
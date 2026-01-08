import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Booking } from '@/types/booking';
import { BookingStatusBadge } from './BookingStatusBadge';
import { BookingItemsList } from './BookingItemsList';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Hash,
  ExternalLink,
  XCircle,
  Edit,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BookingDetailsModalProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: (bookingId: string) => void;
  onEditStatus?: (bookingId: string) => void;
}

export function BookingDetailsModal({
  booking,
  open,
  onOpenChange,
  onCancel,
  onEditStatus
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const paymentStatusConfig = {
    pending: { label: 'Pending', className: 'bg-orange-100 text-orange-800' },
    partial: { label: 'Partially Paid', className: 'bg-blue-100 text-blue-800' },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
    refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-800' }
  };

  const paymentStatus = paymentStatusConfig[booking.paymentStatus];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-clio-gray-900 dark:text-white">Booking Details</DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2 text-sm text-clio-gray-600 dark:text-clio-gray-400">
                  <Hash className="w-4 h-4" />
                  <span className="font-mono font-bold tracking-tight">{booking.bookingReference}</span>
                </div>
                <BookingStatusBadge status={booking.status} />
                <Badge className={cn("text-[10px] uppercase font-bold tracking-tight px-2 py-0.5", paymentStatus.className)}>
                  {paymentStatus.label}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {onEditStatus && booking.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditStatus(booking.id)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Status
                </Button>
              )}
              {onCancel && booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this booking?')) {
                      onCancel(booking.id);
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Workflow Status */}
          <div className="bg-clio-gray-50 dark:bg-clio-gray-900/50 border border-clio-gray-100 dark:border-clio-gray-800 p-8 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-clio-gray-500 dark:text-clio-gray-400 mb-6">Booking Workflow</h3>
            <WorkflowVisualizer
              hasQuote={!!booking.quoteId}
              hasBooking={true}
              hasInvoice={false} // TODO: Check if invoice exists
              hasCommission={false} // TODO: Check if commission exists
              isPaid={booking.paymentStatus === 'paid'}
            />
          </div>

          <Separator className="bg-clio-gray-100 dark:bg-clio-gray-800" />

          {/* Customer Information */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-clio-gray-900 dark:text-white mb-6">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-clio-gray-100 dark:bg-clio-gray-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-clio-gray-500" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-500">Customer</div>
                  <div className="font-bold text-clio-gray-900 dark:text-white">{booking.contact.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-clio-gray-100 dark:bg-clio-gray-800 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-clio-gray-500" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-500">Email</div>
                  <div className="font-bold text-clio-gray-900 dark:text-white">{booking.contact.email}</div>
                </div>
              </div>
              {booking.contact.phone && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-clio-gray-100 dark:bg-clio-gray-800 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-clio-gray-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-500">Phone</div>
                    <div className="font-bold text-clio-gray-900 dark:text-white">{booking.contact.phone}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-clio-gray-100 dark:bg-clio-gray-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-clio-gray-500" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-500">Booked On</div>
                  <div className="font-bold text-clio-gray-900 dark:text-white">
                    {format(new Date(booking.createdAt), 'PPP')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-clio-gray-100 dark:bg-clio-gray-800" />

          {/* Booking Items */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-clio-gray-900 dark:text-white mb-6">
              Booking Items ({booking.items.length})
            </h3>
            <BookingItemsList items={booking.items} showPricing={true} />
          </div>

          <Separator className="bg-clio-gray-100 dark:bg-clio-gray-800" />

          {/* Financial Summary */}
          <div className="bg-clio-navy dark:bg-clio-blue p-8 rounded-2xl text-white shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-80 mb-6">Financial Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium opacity-80">Currency:</span>
                <span className="font-bold uppercase tracking-widest">{booking.currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium opacity-80">Payment Status:</span>
                <Badge className="bg-clio-blue/20 hover:bg-clio-blue/30 text-white border-transparent text-[10px] uppercase font-bold tracking-tight">
                  {paymentStatus.label}
                </Badge>
              </div>
              <Separator className="bg-clio-gray-100/10" />
              <div className="flex justify-between items-end pt-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80 block mb-1">Total Amount</span>
                  <div className="text-4xl font-black tracking-tight leading-none">
                    {formatCurrency(booking.totalAmount)}
                  </div>
                </div>
                <div className="bg-clio-gray-100/10 rounded-xl p-3">
                  <DollarSign className="w-8 h-8 opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <>
              <Separator className="bg-clio-gray-100 dark:bg-clio-gray-800" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-clio-gray-900 dark:text-white mb-4">Notes</h3>
                <p className="text-clio-gray-700 dark:text-clio-gray-300 bg-clio-gray-50 dark:bg-clio-gray-900/50 border border-clio-gray-100 dark:border-clio-gray-800 p-6 rounded-2xl whitespace-pre-wrap font-medium">
                  {booking.notes}
                </p>
              </div>
            </>
          )}

          {/* Related Records */}
          {booking.quoteId && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Related Records</h3>
                <div className="flex flex-wrap gap-2">
                  {booking.quoteId && (
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Quote
                    </Button>
                  )}
                  {/* TODO: Add invoice and commission links when available */}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

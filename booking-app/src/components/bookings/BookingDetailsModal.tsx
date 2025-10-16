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
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

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
              <DialogTitle className="text-2xl">Booking Details</DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Hash className="w-4 h-4" />
                  <span className="font-mono font-semibold">{booking.bookingReference}</span>
                </div>
                <BookingStatusBadge status={booking.status} />
                <Badge className={paymentStatus.className}>
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
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Booking Workflow</h3>
            <WorkflowVisualizer
              hasQuote={!!booking.quoteId}
              hasBooking={true}
              hasInvoice={false} // TODO: Check if invoice exists
              hasCommission={false} // TODO: Check if commission exists
              isPaid={booking.paymentStatus === 'paid'}
            />
          </div>

          <Separator />

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Customer</div>
                  <div className="font-medium">{booking.contact.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{booking.contact.email}</div>
                </div>
              </div>
              {booking.contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <div className="font-medium">{booking.contact.phone}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Booked On</div>
                  <div className="font-medium">
                    {format(new Date(booking.createdAt), 'PPP')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Booking Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Booking Items ({booking.items.length})
            </h3>
            <BookingItemsList items={booking.items} showPricing={true} />
          </div>

          <Separator />

          {/* Financial Summary */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Currency:</span>
                <span className="font-semibold">{booking.currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Payment Status:</span>
                <Badge className={paymentStatus.className}>
                  {paymentStatus.label}
                </Badge>
              </div>
              <Separator className="bg-blue-200" />
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-700">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Notes</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
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

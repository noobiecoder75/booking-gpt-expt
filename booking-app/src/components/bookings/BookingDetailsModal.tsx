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
import { useBookingTasksQuery } from '@/hooks/queries/useTasksQuery';
import { useQueryClient } from '@tanstack/react-query';
import { BookingReviewModal } from '@/components/tasks/BookingReviewModal';
import { BookingTask } from '@/types/task';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Hash,
  ExternalLink,
  XCircle,
  Edit,
  DollarSign,
  CheckCircle2,
  Clock
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
  const queryClient = useQueryClient();
  const { data: tasks = [] } = useBookingTasksQuery(booking?.id, booking?.quoteId);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [reviewTask, setReviewTask] = useState<BookingTask | null>(null);

  if (!booking) return null;

  const handleExecuteTask = async (taskId: string) => {
    try {
      setExecutingTaskId(taskId);
      const response = await fetch('/api/bookings/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully executed booking! Confirmation: ${data.confirmationNumber}`);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      } else {
        alert(`Execution failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Execution failed:', error);
      alert('An unexpected error occurred during execution.');
    } finally {
      setExecutingTaskId(null);
      setReviewTask(null);
    }
  };

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
    booked: { label: 'Booked', className: 'bg-green-100 text-green-800' },
    refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-800' }
  };

  const paymentStatus = paymentStatusConfig[booking.paymentStatus as keyof typeof paymentStatusConfig] || { label: booking.paymentStatus, className: 'bg-clio-gray-100 text-clio-gray-800' };

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
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Booking:</span>
                  <BookingStatusBadge status={booking.status} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Payment:</span>
                  <Badge className={cn("text-[10px] uppercase font-bold tracking-tight px-2 py-0.5", paymentStatus.className)}>
                    {paymentStatus.label}
                  </Badge>
                </div>
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
          {/* Action Tasks (Human in the Loop) */}
          {tasks.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-orange-800 dark:text-orange-400">Human in the Loop: Pending Fulfillment</h3>
                  <p className="text-xs text-orange-700/70 dark:text-orange-500/70 mt-1 uppercase font-bold tracking-tight">
                    {tasks.length} item{tasks.length > 1 ? 's' : ''} require agent verification before execution
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-clio-gray-900 flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5 text-orange-500 animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-white dark:bg-clio-gray-900 rounded-xl border border-orange-100 dark:border-orange-900/20 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">{task.title}</div>
                        <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-widest">{task.itemName || 'Manual fulfillment'}</div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] h-9 px-4 rounded-lg shadow-lg shadow-emerald-600/20 border-none"
                      onClick={() => setReviewTask(task)}
                      disabled={!!executingTaskId}
                    >
                      {executingTaskId === task.id ? (
                        <Clock className="w-3 h-3 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 mr-2" />
                      )}
                      Review & Book
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow Status */}
          <div className="bg-clio-gray-50 dark:bg-clio-gray-900/50 border border-clio-gray-100 dark:border-clio-gray-800 p-8 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-clio-gray-500 dark:text-clio-gray-400 mb-6">Booking Workflow</h3>
            <WorkflowVisualizer
              hasQuote={!!booking.quoteId}
              hasBooking={booking.status === 'confirmed' || booking.status === 'booked' || booking.status === 'completed'}
              hasInvoice={booking.paymentStatus === 'paid' || booking.paymentStatus === 'booked' || booking.paymentStatus === 'partial'}
              hasCommission={false} // TODO: Link to commissions table
              isPaid={booking.paymentStatus === 'paid' || booking.paymentStatus === 'booked'}
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

      {reviewTask && (
        <BookingReviewModal
          isOpen={!!reviewTask}
          onClose={() => setReviewTask(null)}
          task={reviewTask}
          onConfirm={() => handleExecuteTask(reviewTask.id)}
          isExecuting={executingTaskId === reviewTask.id}
        />
      )}
    </Dialog>
  );
}

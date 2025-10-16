import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BookingStatusBadgeProps {
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  className?: string;
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'bg-orange-100 text-orange-800 hover:bg-orange-100'
    },
    confirmed: {
      label: 'Confirmed',
      className: 'bg-green-100 text-green-800 hover:bg-green-100'
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-100 text-red-800 hover:bg-red-100'
    },
    completed: {
      label: 'Completed',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    }
  };

  const config = statusConfig[status];

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

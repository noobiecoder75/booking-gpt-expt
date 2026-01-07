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
      className: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-900/30'
    },
    confirmed: {
      label: 'Confirmed',
      className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30'
    },
    completed: {
      label: 'Completed',
      className: 'bg-clio-blue/10 dark:bg-clio-blue/20 text-clio-blue dark:text-blue-400 border-clio-blue/20 dark:border-blue-900/30'
    }
  };

  const config = statusConfig[status];

  return (
    <Badge className={cn("text-[10px] uppercase font-bold tracking-tight px-2 py-0.5", config.className, className)}>
      {config.label}
    </Badge>
  );
}

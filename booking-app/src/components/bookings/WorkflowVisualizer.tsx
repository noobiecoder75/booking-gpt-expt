import { Check, FileText, CreditCard, Receipt, DollarSign, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'complete' | 'current' | 'pending';
  relatedId?: string;
  onClick?: () => void;
}

interface WorkflowVisualizerProps {
  hasQuote?: boolean;
  hasBooking?: boolean;
  hasInvoice?: boolean;
  hasCommission?: boolean;
  isPaid?: boolean;
  onQuoteClick?: () => void;
  onBookingClick?: () => void;
  onInvoiceClick?: () => void;
  onCommissionClick?: () => void;
  compact?: boolean;
}

export function WorkflowVisualizer({
  hasQuote = false,
  hasBooking = false,
  hasInvoice = false,
  hasCommission = false,
  isPaid = false,
  onQuoteClick,
  onBookingClick,
  onInvoiceClick,
  onCommissionClick,
  compact = false
}: WorkflowVisualizerProps) {
  const steps: WorkflowStep[] = [
    {
      id: 'quote',
      label: 'Quote Accepted',
      icon: FileText,
      status: hasQuote ? 'complete' : 'pending',
      onClick: onQuoteClick
    },
    {
      id: 'booking',
      label: 'Booking Created',
      icon: CreditCard,
      status: hasBooking ? 'complete' : hasQuote ? 'current' : 'pending',
      onClick: onBookingClick
    },
    {
      id: 'invoice',
      label: 'Invoice Generated',
      icon: Receipt,
      status: hasInvoice ? 'complete' : hasBooking ? 'current' : 'pending',
      onClick: onInvoiceClick
    },
    {
      id: 'commission',
      label: 'Commission Created',
      icon: DollarSign,
      status: hasCommission ? 'complete' : hasInvoice ? 'current' : 'pending',
      onClick: onCommissionClick
    },
    {
      id: 'paid',
      label: 'Payment Complete',
      icon: Check,
      status: isPaid ? 'complete' : hasCommission ? 'current' : 'pending'
    }
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isClickable = step.onClick && step.status === 'complete';

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={isClickable ? step.onClick : undefined}
                disabled={!isClickable}
                className={cn(
                  'rounded-full p-1.5',
                  step.status === 'complete' && 'bg-green-100 text-green-700',
                  step.status === 'current' && 'bg-blue-100 text-blue-700',
                  step.status === 'pending' && 'bg-gray-100 text-gray-400',
                  isClickable && 'cursor-pointer hover:opacity-80 transition-opacity'
                )}
                title={step.label}
              >
                <Icon className="w-3 h-3" />
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-gray-300 mx-0.5" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{
            width: `${(steps.filter(s => s.status === 'complete').length / steps.length) * 100}%`
          }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step) => {
          const Icon = step.icon;
          const isClickable = step.onClick && step.status === 'complete';

          return (
            <div key={step.id} className="flex flex-col items-center">
              <button
                onClick={isClickable ? step.onClick : undefined}
                disabled={!isClickable}
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all',
                  step.status === 'complete' && 'bg-green-500 border-green-100 text-white',
                  step.status === 'current' && 'bg-blue-500 border-blue-100 text-white animate-pulse',
                  step.status === 'pending' && 'bg-white border-gray-200 text-gray-400',
                  isClickable && 'cursor-pointer hover:scale-110'
                )}
              >
                {step.status === 'complete' ? (
                  <Check className="w-8 h-8" />
                ) : (
                  <Icon className="w-8 h-8" />
                )}
              </button>
              <div className="mt-3 text-center">
                <div className={cn(
                  'text-sm font-medium',
                  step.status === 'complete' && 'text-green-700',
                  step.status === 'current' && 'text-blue-700',
                  step.status === 'pending' && 'text-gray-500'
                )}>
                  {step.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

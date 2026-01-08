import { BookingItem } from '@/types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plane, Hotel, Sparkles, Car, Calendar, DollarSign, Building2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface BookingItemsListProps {
  items: BookingItem[];
  showPricing?: boolean;
}

export function BookingItemsList({ items, showPricing = true }: BookingItemsListProps) {
  const getItemIcon = (type: BookingItem['type']) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'flight':
        return <Plane className={iconClass} />;
      case 'hotel':
        return <Hotel className={iconClass} />;
      case 'activity':
        return <Sparkles className={iconClass} />;
      case 'transfer':
        return <Car className={iconClass} />;
    }
  };

  const getItemStatusBadge = (status: BookingItem['bookingStatus']) => {
    const config = {
      not_booked: { label: 'Not Booked', className: 'bg-clio-gray-100 text-clio-gray-700 dark:bg-clio-gray-800 dark:text-clio-gray-400 border-clio-gray-200 dark:border-clio-gray-700' },
      pending: { label: 'Pending', className: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-800' },
      confirmed: { label: 'Confirmed', className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' },
      booked: { label: 'Booked', className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' },
      failed: { label: 'Failed', className: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800' }
    };

    const statusConfig = config[status] || { label: status, className: 'bg-clio-gray-100 text-clio-gray-700' };
    const { label, className } = statusConfig;
    return <Badge className={cn("text-[10px] uppercase font-bold tracking-tight px-2 py-0.5", className)}>{label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Group items by type
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, BookingItem[]>);

  const typeLabels = {
    flight: 'Flights',
    hotel: 'Hotels',
    activity: 'Activities',
    transfer: 'Transfers'
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([type, typeItems]) => (
        <div key={type}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400 mb-4 flex items-center gap-2">
            {getItemIcon(type as BookingItem['type'])}
            {typeLabels[type as keyof typeof typeLabels]} ({typeItems.length})
          </h3>

          <div className="space-y-4">
            {typeItems.map((item) => (
              <Card key={item.id} className="border-clio-gray-100 dark:border-clio-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4 bg-clio-gray-50/50 dark:bg-clio-gray-800/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-bold text-clio-gray-900 dark:text-white">{item.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(item.startDate), 'MMM dd, yyyy')}
                        {item.endDate && (
                          <>
                            <span className="text-clio-gray-300 dark:text-clio-gray-600">→</span>
                            {format(new Date(item.endDate), 'MMM dd, yyyy')}
                          </>
                        )}
                      </div>
                    </div>
                    {getItemStatusBadge(item.bookingStatus)}
                  </div>
                </CardHeader>
                <CardContent className="pt-5 pb-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    {/* Pricing Info */}
                    {showPricing && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Price</span>
                          <span className="font-bold text-clio-gray-900 dark:text-white">{formatCurrency(item.price)}</span>
                        </div>
                        {item.quantity > 1 && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Quantity</span>
                            <span className="font-bold text-clio-gray-900 dark:text-white">{item.quantity}</span>
                          </div>
                        )}
                        {item.quantity > 1 && (
                          <div className="flex items-center justify-between pt-1 border-t border-clio-gray-100 dark:border-clio-gray-800">
                            <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Subtotal</span>
                            <span className="font-bold text-clio-blue">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Supplier Info */}
                    {(item.supplier || item.confirmationNumber) && (
                      <div className="space-y-2">
                        {item.supplier && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Supplier</span>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-clio-gray-400" />
                              <span className="font-bold text-clio-gray-900 dark:text-white">{item.supplier}</span>
                            </div>
                          </div>
                        )}
                        {item.confirmationNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">Confirmation</span>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="font-mono text-xs font-bold text-clio-gray-900 dark:text-white tracking-wider">{item.confirmationNumber}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Profit Tracking (if available) */}
                    {showPricing && (item.supplierCost !== null || item.clientPrice !== null) && (
                      <div className="md:col-span-2 pt-4 border-t border-clio-gray-100 dark:border-clio-gray-800">
                        <div className="grid grid-cols-3 gap-4">
                          {item.supplierCost !== null && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400 block mb-1">Supplier Cost</span>
                              <div className="font-bold text-clio-gray-900 dark:text-white">{formatCurrency(item.supplierCost)}</div>
                            </div>
                          )}
                          {item.clientPrice !== null && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400 block mb-1">Client Price</span>
                              <div className="font-bold text-clio-gray-900 dark:text-white">{formatCurrency(item.clientPrice)}</div>
                            </div>
                          )}
                          {item.supplierCost !== null && item.clientPrice !== null && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400 block mb-1">Profit</span>
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(item.clientPrice - item.supplierCost)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Total Summary */}
      {showPricing && items.length > 0 && (
        <div className="border-t border-clio-gray-200 dark:border-clio-gray-800 pt-6 mt-8">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-clio-gray-500 dark:text-clio-gray-400 block mb-1">Grand Total</span>
              <span className="text-3xl font-black text-clio-gray-900 dark:text-white tracking-tight">
                {formatCurrency(items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

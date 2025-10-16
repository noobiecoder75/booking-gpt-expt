import { BookingItem } from '@/types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      not_booked: { label: 'Not Booked', className: 'bg-gray-100 text-gray-800' },
      pending: { label: 'Pending', className: 'bg-orange-100 text-orange-800' },
      confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' }
    };

    const { label, className } = config[status];
    return <Badge className={className}>{label}</Badge>;
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
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {getItemIcon(type as BookingItem['type'])}
            {typeLabels[type as keyof typeof typeLabels]} ({typeItems.length})
          </h3>

          <div className="space-y-3">
            {typeItems.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(item.startDate), 'MMM dd, yyyy')}
                        {item.endDate && (
                          <>
                            <span>→</span>
                            {format(new Date(item.endDate), 'MMM dd, yyyy')}
                          </>
                        )}
                      </div>
                    </div>
                    {getItemStatusBadge(item.bookingStatus)}
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {/* Pricing Info */}
                    {showPricing && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-semibold">{formatCurrency(item.price)}</span>
                        </div>
                        {item.quantity > 1 && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span>{item.quantity}</span>
                          </div>
                        )}
                        {item.quantity > 1 && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Supplier Info */}
                    {(item.supplier || item.confirmationNumber) && (
                      <div className="space-y-1">
                        {item.supplier && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Supplier:</span>
                            <span className="font-medium">{item.supplier}</span>
                          </div>
                        )}
                        {item.confirmationNumber && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-gray-600">Confirmation:</span>
                            <span className="font-mono text-xs font-semibold">{item.confirmationNumber}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Profit Tracking (if available) */}
                    {showPricing && (item.supplierCost || item.clientPrice) && (
                      <div className="md:col-span-2 pt-2 border-t">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {item.supplierCost && (
                            <div>
                              <span className="text-gray-500">Supplier Cost:</span>
                              <div className="font-semibold">{formatCurrency(item.supplierCost)}</div>
                            </div>
                          )}
                          {item.clientPrice && (
                            <div>
                              <span className="text-gray-500">Client Price:</span>
                              <div className="font-semibold">{formatCurrency(item.clientPrice)}</div>
                            </div>
                          )}
                          {item.supplierCost && item.clientPrice && (
                            <div>
                              <span className="text-gray-500">Profit:</span>
                              <div className="font-semibold text-green-600">
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
        <div className="border-t pt-4 mt-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold">
              {formatCurrency(items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

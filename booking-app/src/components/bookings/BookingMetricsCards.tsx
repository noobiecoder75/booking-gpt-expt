import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types/booking';
import { CalendarCheck, CheckCircle2, DollarSign, Clock } from 'lucide-react';

interface BookingMetricsCardsProps {
  bookings: Booking[];
}

export function BookingMetricsCards({ bookings }: BookingMetricsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate metrics
  const totalBookings = bookings.length;

  const activeBookings = bookings.filter(
    b => b.status === 'confirmed' || b.status === 'pending'
  ).length;

  const totalValue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

  const pendingConfirmations = bookings.filter(b => b.status === 'pending').length;

  const metrics = [
    {
      title: 'Total Bookings',
      value: totalBookings.toString(),
      icon: CalendarCheck,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Bookings',
      value: activeBookings.toString(),
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      subtitle: `${bookings.filter(b => b.status === 'confirmed').length} confirmed`
    },
    {
      title: 'Total Value',
      value: formatCurrency(totalValue),
      icon: DollarSign,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Pending',
      value: pendingConfirmations.toString(),
      icon: Clock,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      subtitle: 'Awaiting confirmation'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

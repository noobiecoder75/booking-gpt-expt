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
    b => b.status === 'confirmed' || b.status === 'pending' || b.status === 'booked'
  ).length;

  const totalValue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

  const pendingConfirmations = bookings.filter(b => b.status === 'pending').length;

  const metrics = [
    {
      title: 'Total Bookings',
      value: totalBookings.toString(),
      icon: CalendarCheck,
      iconColor: 'text-clio-blue',
      bgColor: 'bg-clio-blue/10'
    },
    {
      title: 'Active Bookings',
      value: activeBookings.toString(),
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      subtitle: `${bookings.filter(b => b.status === 'confirmed' || b.status === 'booked').length} confirmed/booked`
    },
    {
      title: 'Total Value',
      value: formatCurrency(totalValue),
      icon: DollarSign,
      iconColor: 'text-clio-blue',
      bgColor: 'bg-clio-blue/10'
    },
    {
      title: 'Pending',
      value: pendingConfirmations.toString(),
      icon: Clock,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      subtitle: 'Awaiting confirmation'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-all duration-200 border-clio-gray-100 dark:border-clio-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-clio-gray-500 dark:text-clio-gray-400">{metric.title}</CardTitle>
              <div className={`p-2 rounded-xl ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-clio-gray-900 dark:text-white">{metric.value}</div>
              {metric.subtitle && (
                <p className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400 mt-1">{metric.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

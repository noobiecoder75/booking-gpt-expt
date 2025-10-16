'use client';

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { BookingMetricsCards } from '@/components/bookings/BookingMetricsCards';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { BookingDetailsModal } from '@/components/bookings/BookingDetailsModal';
import { WorkflowVisualizer } from '@/components/bookings/WorkflowVisualizer';
import { useBookingsQuery } from '@/hooks/queries/useBookingsQuery';
import { useBookingMutations } from '@/hooks/mutations/useBookingMutations';
import { Booking } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Search, Calendar, Package, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingsPage() {
  const { data: bookings = [], isLoading } = useBookingsQuery();
  const { cancelBooking } = useBookingMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        searchQuery === '' ||
        booking.bookingReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.contact.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking.mutateAsync({ bookingId });
      setDetailsOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading bookings...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600 mt-2">
              Manage and track all your travel bookings
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <BookingMetricsCards bookings={bookings} />

        {/* Filters and Search */}
        <Card className="p-6 mt-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by reference, customer, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bookings Table */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No bookings found
              </h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first booking from an accepted quote'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow
                      key={booking.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewDetails(booking)}
                    >
                      <TableCell className="font-mono text-sm font-semibold">
                        {booking.bookingReference}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.contact.name}</div>
                          <div className="text-sm text-gray-500">{booking.contact.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell>
                        <WorkflowVisualizer
                          hasQuote={!!booking.quoteId}
                          hasBooking={true}
                          hasInvoice={false}
                          hasCommission={false}
                          isPaid={booking.paymentStatus === 'paid'}
                          compact={true}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                          {booking.items.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(booking.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(booking);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Booking Details Modal */}
        <BookingDetailsModal
          booking={selectedBooking}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onCancel={handleCancelBooking}
        />
      </div>
    </MainLayout>
  );
}

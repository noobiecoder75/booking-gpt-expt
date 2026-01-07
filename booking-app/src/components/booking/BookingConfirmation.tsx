'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Plane,
  Hotel,
  MapPin,
  Car,
  Calendar,
  Clock,
  Mail,
  Phone,
  User,
  Download,
  Share,
  AlertCircle,
} from 'lucide-react';
import { BookingConfirmation } from '@/types/booking';
import { formatCurrency } from '@/lib/utils';

interface BookingConfirmationProps {
  confirmation: BookingConfirmation;
  onClose?: () => void;
}

export function BookingConfirmationComponent({ 
  confirmation, 
  onClose 
}: BookingConfirmationProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30';
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30';
      case 'cancelled':
        return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30';
      default:
        return 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-700 dark:text-clio-gray-300 border-clio-gray-200 dark:border-clio-gray-700';
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane className="w-5 h-5" />;
      case 'hotel':
        return <Hotel className="w-5 h-5" />;
      case 'activity':
        return <MapPin className="w-5 h-5" />;
      case 'transfer':
        return <Car className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const handleDownloadConfirmation = async () => {
    setIsDownloading(true);
    // Simulate PDF generation delay
    setTimeout(() => {
      // In production, this would generate and download a PDF
      console.log('Downloading confirmation PDF...');
      setIsDownloading(false);
    }, 2000);
  };

  const handleShareConfirmation = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Booking Confirmation - ${confirmation.bookingReference}`,
          text: `Your booking is confirmed! Reference: ${confirmation.bookingReference}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `Booking Confirmed!\nReference: ${confirmation.bookingReference}\nTotal: ${formatCurrency(confirmation.totalAmount)}`
      );
      alert('Booking details copied to clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white dark:bg-clio-gray-950">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        
        <div>
          <h1 className="text-3xl font-black text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-clio-gray-600 dark:text-clio-gray-400 font-medium">
            Your trip has been successfully booked
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          <Badge className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest ${getStatusColor(confirmation.status)}`}>
            {confirmation.status}
          </Badge>
          <Badge className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
            confirmation.paymentStatus === 'paid' 
              ? 'bg-clio-blue/10 dark:bg-clio-blue/20 text-clio-blue dark:text-blue-400 border-clio-blue/20 dark:border-blue-900/30'
              : 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-700 dark:text-clio-gray-300 border-clio-gray-200 dark:border-clio-gray-700'
          }`}>
            Payment {confirmation.paymentStatus}
          </Badge>
        </div>
      </div>

      {/* Booking Reference */}
      <div className="bg-clio-blue/5 dark:bg-clio-blue/10 border border-clio-blue/10 dark:border-clio-blue/20 rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-clio-blue mb-2">
              Booking Reference
            </h3>
            <p className="text-3xl font-black text-clio-gray-900 dark:text-white tracking-tighter">
              {confirmation.bookingReference}
            </p>
            <p className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-2">
              Keep this reference for your records
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-2">Booking Date</p>
            <p className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
              {new Date(confirmation.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Items */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight ml-1">Your Booking Details</h2>
        
        {confirmation.items.map((item, index) => (
          <div key={index} className="bg-white dark:bg-clio-gray-900 border border-clio-gray-100 dark:border-clio-gray-800 rounded-2xl p-8 shadow-sm">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-clio-gray-50 dark:bg-clio-gray-800 rounded-xl flex items-center justify-center border border-clio-gray-100 dark:border-clio-gray-700">
                {getItemIcon(item.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                    {item.type}
                  </h3>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-1">Confirmation Number</p>
                    <p className="font-bold text-clio-blue uppercase tracking-tight">{item.confirmationNumber}</p>
                  </div>
                </div>

                {/* Flight Details */}
                {item.type === 'flight' && 'flightType' in item.details && (
                  <div className="space-y-4">
                    {item.details.outboundFlight && (
                      <div className="flex items-center space-x-8">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-clio-blue mb-1">Outbound</p>
                          <p className="text-sm font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                            {item.details.outboundFlight.airline} {item.details.outboundFlight.flightNumber}
                          </p>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-lg font-black text-clio-gray-900 dark:text-white">{new Date(item.details.outboundFlight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">{item.details.outboundFlight.departureAirportCode}</p>
                          </div>
                          <div className="text-clio-gray-300 dark:text-clio-gray-600">→</div>
                          <div className="text-center">
                            <p className="text-lg font-black text-clio-gray-900 dark:text-white">{new Date(item.details.outboundFlight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">{item.details.outboundFlight.arrivalAirportCode}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {item.details.returnFlight && (
                      <div className="flex items-center space-x-8 pt-4 border-t border-clio-gray-100 dark:border-clio-gray-800 border-dashed">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-clio-blue mb-1">Return</p>
                          <p className="text-sm font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                            {item.details.returnFlight.airline} {item.details.returnFlight.flightNumber}
                          </p>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-lg font-black text-clio-gray-900 dark:text-white">{new Date(item.details.returnFlight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">{item.details.returnFlight.departureAirportCode}</p>
                          </div>
                          <div className="text-clio-gray-300 dark:text-clio-gray-600">→</div>
                          <div className="text-center">
                            <p className="text-lg font-black text-clio-gray-900 dark:text-white">{new Date(item.details.returnFlight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">{item.details.returnFlight.arrivalAirportCode}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Hotel Details */}
                {item.type === 'hotel' && 'hotelName' in item.details && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">{item.details.hotelName}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-clio-blue mt-1 flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1.5" />
                          {item.details.location.city}, {item.details.location.country}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">{item.details.nights} night{item.details.nights > 1 ? 's' : ''}</p>
                        <p className="text-xs font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight mt-1">{item.details.roomType}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-clio-gray-100 dark:border-clio-gray-800 border-dashed">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-clio-gray-400" />
                          <div className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">Check-in: <span className="text-clio-gray-900 dark:text-white">{item.details.checkIn.date}</span></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-clio-gray-400" />
                          <div className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight"><span className="text-clio-gray-900 dark:text-white">{item.details.checkIn.time}</span></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 justify-end">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-clio-gray-400" />
                          <div className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">Check-out: <span className="text-clio-gray-900 dark:text-white">{item.details.checkOut.date}</span></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-clio-gray-400" />
                          <div className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight"><span className="text-clio-gray-900 dark:text-white">{item.details.checkOut.time}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Details */}
      <div className="bg-clio-gray-50 dark:bg-clio-gray-900 rounded-2xl p-8 border border-clio-gray-100 dark:border-clio-gray-800">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-6 ml-1">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white dark:bg-clio-gray-800 rounded-xl flex items-center justify-center shadow-sm border border-clio-gray-100 dark:border-clio-gray-700">
              <User className="w-4 h-4 text-clio-blue" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-0.5">Name</p>
              <p className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">{confirmation.customerDetails.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white dark:bg-clio-gray-800 rounded-xl flex items-center justify-center shadow-sm border border-clio-gray-100 dark:border-clio-gray-700">
              <Mail className="w-4 h-4 text-clio-blue" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-0.5">Email</p>
              <p className="font-bold text-clio-gray-900 dark:text-white tracking-tight lowercase">{confirmation.customerDetails.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white dark:bg-clio-gray-800 rounded-xl flex items-center justify-center shadow-sm border border-clio-gray-100 dark:border-clio-gray-700">
              <Phone className="w-4 h-4 text-clio-blue" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-0.5">Phone</p>
              <p className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">{confirmation.customerDetails.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Total Amount */}
      <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">Total Amount</h3>
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-tight">Payment Status: {confirmation.paymentStatus}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-green-800 tracking-tighter">
              {formatCurrency(confirmation.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-8">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-white dark:bg-amber-950/40 rounded-xl flex items-center justify-center shadow-sm border border-amber-100 dark:border-amber-900/30 shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase tracking-tight mb-3">Important Information</h3>
            <ul className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest space-y-2">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> Please arrive at the airport at least 2 hours before domestic flights and 3 hours before international flights</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> Bring a valid ID/passport for check-in</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> Check baggage allowances and restrictions before travel</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> Review hotel check-in policies and amenities</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> Keep this confirmation accessible during your trip</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-8">
        <Button 
          onClick={handleDownloadConfirmation}
          disabled={isDownloading}
          className="flex-1 bg-clio-blue hover:bg-clio-blue-hover text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg shadow-clio-blue/20"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-3" />
              Download Confirmation
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleShareConfirmation}
          className="flex-1 border-clio-gray-200 dark:border-clio-gray-800 text-clio-gray-900 dark:text-white font-black uppercase tracking-widest h-14 rounded-2xl hover:bg-clio-gray-50 dark:hover:bg-clio-gray-900"
        >
          <Share className="w-5 h-5 mr-3" />
          Share Confirmation
        </Button>
        
        {onClose && (
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-clio-gray-200 dark:border-clio-gray-800 text-clio-gray-900 dark:text-white font-black uppercase tracking-widest h-14 rounded-2xl hover:bg-clio-gray-50 dark:hover:bg-clio-gray-900"
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
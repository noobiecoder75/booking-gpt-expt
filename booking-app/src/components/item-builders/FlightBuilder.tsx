'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plane, 
  Calendar, 
  Clock, 
  Loader2, 
  Search,
  ArrowRight,
  ArrowLeftRight,
  X,
  Check
} from 'lucide-react';
import { flightService } from '@/services/flight-api';
import { 
  FlightType, 
  EnhancedFlightDetails, 
  BookingClass
} from '@/types/booking';
import { formatCurrency } from '@/lib/utils';

interface FlightBuilderProps {
  onSubmit: (flightData: {
    type: string;
    name: string;
    startDate: string;
    endDate?: string;
    price: number;
    quantity: number;
    details: EnhancedFlightDetails & { origin: string; destination: string };
  }) => void;
  onCancel: () => void;
  tripStartDate?: Date;
  tripEndDate?: Date;
}

export function FlightBuilder({ onSubmit, onCancel, tripStartDate, tripEndDate }: FlightBuilderProps) {
  const [flightType, setFlightType] = useState<FlightType>('return');
  const [searchResults, setSearchResults] = useState<EnhancedFlightDetails[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<EnhancedFlightDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: tripStartDate ? tripStartDate.toISOString().split('T')[0] : '',
    returnDate: tripEndDate ? tripEndDate.toISOString().split('T')[0] : '',
    departureTime: '',
    returnTime: '',
    adults: 1,
    children: 0,
    infants: 0,
    bookingClass: 'economy' as BookingClass,
  });

  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  // Search airports as user types
  useEffect(() => {
    if (originSearch.length > 2) {
      flightService.getAirports(originSearch).then(() => {
        // Airport suggestions would be shown here
      });
    }
  }, [originSearch]);

  useEffect(() => {
    if (destSearch.length > 2) {
      flightService.getAirports(destSearch).then(() => {
        // Airport suggestions would be shown here
      });
    }
  }, [destSearch]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await flightService.searchFlights({
        type: 'flight',
        origin: formData.origin,
        destination: formData.destination,
        departureDate: formData.departureDate,
        returnDate: flightType === 'return' ? formData.returnDate : undefined,
        passengers: {
          adults: formData.adults,
          children: formData.children,
          infants: formData.infants,
        },
      });

      if (response.success && response.data) {
        setSearchResults(response.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Flight search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFlight = (flight: EnhancedFlightDetails) => {
    setSelectedFlight(flight);
  };

  const handleConfirmBooking = () => {
    if (!selectedFlight) return;

    const flightData = {
      type: 'flight',
      name: flightType === 'return'
        ? `${formData.origin} ⇄ ${formData.destination}`
        : `${formData.origin} → ${formData.destination}`,
      startDate: formData.departureDate,
      endDate: flightType === 'return' ? formData.returnDate : formData.departureDate,
      price: selectedFlight.totalPrice,
      quantity: 1,
      supplierSource: 'offline_platform',
      details: {
        ...selectedFlight,
        origin: formData.origin,
        destination: formData.destination,
      },
    };

    onSubmit(flightData);
  };


  return (
    <div className="fixed inset-0 bg-clio-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-clio-gray-950 rounded-2xl w-full max-w-4xl shadow-strong max-h-[90vh] overflow-hidden flex flex-col border border-clio-gray-200 dark:border-clio-gray-800">
        <div className="sticky top-0 p-8 border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/50 dark:bg-clio-gray-900/50 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm">
                <Plane className="w-6 h-6 text-clio-blue" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Book Flight</h3>
                <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">Search and configure air travel</p>
              </div>
            </div>
            <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 transition-colors text-clio-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto">
          {/* Flight Type Selection */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Trip Type</Label>
            <div className="flex gap-4">
              {(['one-way', 'return', 'multi-city'] as FlightType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFlightType(type)}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-xl border transition-all duration-200 text-[10px] font-black uppercase tracking-widest ${
                    flightType === type
                      ? 'bg-clio-blue text-white border-clio-blue shadow-lg shadow-clio-blue/20'
                      : 'bg-white dark:bg-clio-gray-900 border-clio-gray-100 dark:border-clio-gray-800 text-clio-gray-400 hover:border-clio-gray-300 dark:hover:border-clio-gray-700'
                  }`}
                >
                  {type === 'one-way' && <ArrowRight className="w-3.5 h-3.5" />}
                  {type === 'return' && <ArrowLeftRight className="w-3.5 h-3.5" />}
                  {type === 'multi-city' && <Plane className="w-3.5 h-3.5" />}
                  <span>{type.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Form */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="origin" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">From</Label>
              <div className="relative">
                <Input
                  id="origin"
                  value={originSearch}
                  onChange={(e) => {
                    setOriginSearch(e.target.value);
                    setFormData(prev => ({ ...prev, origin: e.target.value }));
                  }}
                  placeholder="City or Airport"
                  className="pl-12 h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                />
                <Plane className="w-5 h-5 absolute left-4 top-3.5 text-clio-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">To</Label>
              <div className="relative">
                <Input
                  id="destination"
                  value={destSearch}
                  onChange={(e) => {
                    setDestSearch(e.target.value);
                    setFormData(prev => ({ ...prev, destination: e.target.value }));
                  }}
                  placeholder="City or Airport"
                  className="pl-12 h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                />
                <Plane className="w-5 h-5 absolute left-4 top-3.5 text-clio-gray-400 rotate-90" />
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="departureDate" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Departure Date</Label>
              <div className="relative">
                <Input
                  id="departureDate"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                  className="pl-12 h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                />
                <Calendar className="w-5 h-5 absolute left-4 top-3.5 text-clio-gray-400" />
              </div>
            </div>

            {flightType === 'return' && (
              <div className="space-y-2">
                <Label htmlFor="returnDate" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Return Date</Label>
                <div className="relative">
                  <Input
                    id="returnDate"
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                    min={formData.departureDate}
                    className="pl-12 h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                  <Calendar className="w-5 h-5 absolute left-4 top-3.5 text-clio-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="departureTime" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Preferred Departure Time</Label>
              <div className="relative">
                <Input
                  id="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                  className="pl-12 h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                />
                <Clock className="w-5 h-5 absolute left-4 top-3.5 text-clio-gray-400" />
              </div>
            </div>

            {flightType === 'return' && (
              <div className="space-y-2">
                <Label htmlFor="returnTime" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Preferred Return Time</Label>
                <div className="relative">
                  <Input
                    id="returnTime"
                    type="time"
                    value={formData.returnTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, returnTime: e.target.value }))}
                    className="pl-12 h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                  <Clock className="w-5 h-5 absolute left-4 top-3.5 text-clio-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Passengers and Class */}
          <div className="grid grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="adults" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Adults</Label>
              <Input
                id="adults"
                type="number"
                min="1"
                max="9"
                value={formData.adults}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFormData(prev => ({ ...prev, adults: isNaN(value) ? 1 : value }));
                }}
                className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="children" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Children</Label>
              <Input
                id="children"
                type="number"
                min="0"
                max="9"
                value={formData.children}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFormData(prev => ({ ...prev, children: isNaN(value) ? 0 : value }));
                }}
                className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="infants" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Infants</Label>
              <Input
                id="infants"
                type="number"
                min="0"
                max="9"
                value={formData.infants}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFormData(prev => ({ ...prev, infants: isNaN(value) ? 0 : value }));
                }}
                className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Class</Label>
              <Select
                value={formData.bookingClass}
                onValueChange={(value: BookingClass) => 
                  setFormData(prev => ({ ...prev, bookingClass: value }))
                }
              >
                <SelectTrigger className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium-economy">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            className="w-full bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg shadow-clio-blue/20" 
            disabled={isSearching || !formData.origin || !formData.destination || !formData.departureDate}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Searching Flights...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-3" />
                Search Flights
              </>
            )}
          </Button>

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Available Flights</h4>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {searchResults.map((flight, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectFlight(flight)}
                    className={`p-6 border rounded-2xl cursor-pointer transition-all group ${
                      selectedFlight === flight
                        ? 'border-clio-blue bg-clio-blue/5 dark:bg-clio-blue/10 shadow-md'
                        : 'border-clio-gray-100 dark:border-clio-gray-800 bg-white dark:bg-clio-gray-900 hover:border-clio-gray-300 dark:hover:border-clio-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-4 flex-1">
                        {flight.outboundFlight && (
                          <div className="flex items-center gap-8">
                            <div className="min-w-[100px]">
                              <p className="text-[10px] font-black uppercase tracking-widest text-clio-blue mb-1">Outbound</p>
                              <p className="text-xs font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                                {flight.outboundFlight.airline}
                              </p>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-lg font-black text-clio-gray-900 dark:text-white">{new Date(flight.outboundFlight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">{flight.outboundFlight.departureAirportCode}</p>
                              </div>
                              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                                <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">{flightService.formatFlightDuration(flight.outboundFlight.duration)}</div>
                                <div className="h-[2px] w-full bg-clio-gray-100 dark:bg-clio-gray-800 relative">
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                    <ArrowRight className="w-3 h-3 text-clio-blue" />
                                  </div>
                                </div>
                                <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">Direct</div>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-black text-clio-gray-900 dark:text-white">{new Date(flight.outboundFlight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">{flight.outboundFlight.arrivalAirportCode}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {flight.returnFlight && (
                          <div className="flex items-center gap-8 pt-4 border-t border-dashed border-clio-gray-100 dark:border-clio-gray-800">
                            <div className="min-w-[100px]">
                              <p className="text-[10px] font-black uppercase tracking-widest text-clio-blue mb-1">Return</p>
                              <p className="text-xs font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                                {flight.returnFlight.airline}
                              </p>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-lg font-black text-clio-gray-900 dark:text-white">{new Date(flight.returnFlight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">{flight.returnFlight.departureAirportCode}</p>
                              </div>
                              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                                <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">{flightService.formatFlightDuration(flight.returnFlight.duration)}</div>
                                <div className="h-[2px] w-full bg-clio-gray-100 dark:bg-clio-gray-800 relative">
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                    <ArrowRight className="w-3 h-3 text-clio-blue" />
                                  </div>
                                </div>
                                <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">Direct</div>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-black text-clio-gray-900 dark:text-white">{new Date(flight.returnFlight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">{flight.returnFlight.arrivalAirportCode}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-8 flex flex-col items-end">
                        <div className="bg-clio-blue/5 dark:bg-clio-blue/10 px-4 py-2.5 rounded-xl border border-clio-blue/10 group-hover:bg-clio-blue group-hover:text-white transition-all">
                          <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Quote</div>
                          <div className="text-2xl font-black">{formatCurrency(flight.totalPrice)}</div>
                        </div>
                        <p className="mt-2 text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">
                          {flight.passengers.adults} adult{flight.passengers.adults > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Flight Summary */}
          {selectedFlight && (
            <div className="p-6 bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">Flight Selected</h4>
                  <p className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">{formData.origin} ⇄ {formData.destination}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-1">Total Quote</div>
                <div className="text-xl font-black text-green-700">{formatCurrency(selectedFlight.totalPrice)}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-8 border-t border-clio-gray-100 dark:border-clio-gray-800">
            <button 
              type="button" 
              onClick={onCancel}
              className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel Search
            </button>
            <Button 
              onClick={handleConfirmBooking} 
              disabled={!selectedFlight}
              className="bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-green-600/20"
            >
              Add Flight to Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
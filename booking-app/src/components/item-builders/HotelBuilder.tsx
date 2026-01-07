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
  Hotel,
  Calendar,
  Clock,
  Loader2,
  Search,
  Star,
  MapPin,
  Wifi,
  Car,
  Coffee,
  X
} from 'lucide-react';
import { hotelService } from '@/services/hotel-api';
import {
  EnhancedHotelDetails
} from '@/types/booking';
import { formatCurrency } from '@/lib/utils';
import { useRateStore } from '@/store/rate-store';
import { HotelRate } from '@/types/rate';
import { calculateClientPrice, getMarkupPercentage } from '@/lib/pricing/markup-config';
import { findMatchingRate, getSupplierFromMatch, getSupplierSourceFromMatch } from '@/lib/pricing/rate-matcher';
import { TravelItem } from '@/types';

interface HotelBuilderProps {
  onSubmit: (hotelData: {
    type: string;
    name: string;
    startDate: string;
    endDate: string;
    price: number;
    quantity: number;
    details: EnhancedHotelDetails;
  }) => void;
  onCancel: () => void;
  tripStartDate?: Date;
  tripEndDate?: Date;
}

type TabType = 'offline' | 'manual' | 'api';

export function HotelBuilder({ onSubmit, onCancel, tripStartDate, tripEndDate }: HotelBuilderProps) {
  const { getRatesByType, searchRates, getRatesByDateRange, rates } = useRateStore();
  const [activeTab, setActiveTab] = useState<TabType>('offline');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EnhancedHotelDetails[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<EnhancedHotelDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // State for reactive occupancy-based rate calculations
  const [calculatedRates, setCalculatedRates] = useState<Map<string, {
    baseRate: number;
    clientPrice: number;
    markupPercentage: number;
    perNightRate: number;
    totalNights: number;
  }>>(new Map());

  // Offline tab specific search state
  const [offlineSearchDates, setOfflineSearchDates] = useState({
    checkIn: tripStartDate ? tripStartDate.toISOString().split('T')[0] : '',
    checkOut: tripEndDate ? tripEndDate.toISOString().split('T')[0] : '',
  });

  // State for rates to display (synchronized with calculations)
  const [ratesToDisplay, setRatesToDisplay] = useState<HotelRate[]>([]);

  const [formData, setFormData] = useState({
    destination: '',
    checkInDate: tripStartDate ? tripStartDate.toISOString().split('T')[0] : '',
    checkOutDate: tripEndDate ? tripEndDate.toISOString().split('T')[0] : '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    adults: 2,
    children: 0,
    childrenAges: [] as number[],
    roomType: '',
    mealPlan: 'room-only',
    hotelRating: 3,
    priceRange: {
      min: 0,
      max: 1000,
    },
    // Manual entry fields
    hotelName: '',
    location: '',
    price: '',
    quantity: '1',
    supplier: '',
    commissionPercent: '',
  });

  const [nights, setNights] = useState(0);
  const mealPlans = hotelService.getMealPlans();

  // Get hotel rates filtered by trip dates
  const hotelRatesInDateRange = (() => {
    if (!tripStartDate || !tripEndDate) {
      return getRatesByType('hotel') as HotelRate[];
    }

    const startStr = tripStartDate.toISOString().split('T')[0];
    const endStr = tripEndDate.toISOString().split('T')[0];

    return getRatesByDateRange(startStr, endStr)
      .filter(r => r.type === 'hotel') as HotelRate[];
  })();

  // Filter rates based on search (within date range)
  const filteredRates = searchQuery
    ? searchRates(searchQuery).filter(r =>
        r.type === 'hotel' &&
        hotelRatesInDateRange.some(hr => hr.id === r.id)
      ) as HotelRate[]
    : hotelRatesInDateRange;

  // Calculate nights when dates change
  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate) {
      const calculatedNights = hotelService.calculateNights(
        formData.checkInDate,
        formData.checkOutDate
      );
      setNights(calculatedNights);
    }
  }, [formData.checkInDate, formData.checkOutDate]);

  // Recalculate all rates when occupancy or dates change
  useEffect(() => {
    // Only recalculate if we have valid dates
    if (!offlineSearchDates.checkIn || !offlineSearchDates.checkOut) {
      return;
    }

    const newCalculatedRates = new Map();

    // Get fresh rates directly from store (eliminates stale closure)
    let ratesToCalculate = getRatesByType('hotel') as HotelRate[];

    // Filter by trip date range if available
    if (tripStartDate && tripEndDate) {
      const startStr = tripStartDate.toISOString().split('T')[0];
      const endStr = tripEndDate.toISOString().split('T')[0];
      ratesToCalculate = getRatesByDateRange(startStr, endStr).filter(r => r.type === 'hotel') as HotelRate[];
    }

    // Apply search filter if query exists
    if (searchQuery) {
      ratesToCalculate = searchRates(searchQuery).filter(r =>
        r.type === 'hotel' && ratesToCalculate.some(hr => hr.id === r.id)
      ) as HotelRate[];
    }

    ratesToCalculate.forEach(rate => {
      const calculated = calculateRateForOccupancy(
        rate,
        formData.adults,
        formData.children,
        offlineSearchDates.checkIn,
        offlineSearchDates.checkOut
      );
      newCalculatedRates.set(rate.id, calculated);
    });

    setCalculatedRates(newCalculatedRates);
    setRatesToDisplay(ratesToCalculate);
  }, [formData.adults, formData.children, offlineSearchDates.checkIn, offlineSearchDates.checkOut,
      searchQuery, getRatesByType, getRatesByDateRange, searchRates, tripStartDate, tripEndDate]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await hotelService.searchHotels({
        type: 'hotel',
        destination: formData.destination,
        checkIn: formData.checkInDate,
        checkOut: formData.checkOutDate,
        passengers: {
          adults: formData.adults,
          children: formData.children,
          infants: 0,
        },
        rooms: 1, // For now, assume 1 room - can be enhanced later
        filters: {
          hotelRating: formData.hotelRating,
          priceRange: formData.priceRange,
        },
      });

      if (response.success && response.data) {
        setSearchResults(response.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Hotel search failed:', error);

      // Show detailed error message to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      if (errorMessage.includes('Configuration Error')) {
        alert(`🔧 Setup Required:\n\n${errorMessage}\n\nContact your developer to configure the HotelBeds API credentials.`);
      } else if (errorMessage.includes('HotelBeds API Error')) {
        alert(`🔗 API Error:\n\n${errorMessage}\n\nThis might be a temporary issue. Please try again in a few minutes.`);
      } else {
        alert(`❌ Search Failed:\n\n${errorMessage}\n\nPlease check your search criteria and try again.`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Helper: Calculate nights between two dates
  const calculateNightsBetween = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate rate based on occupancy with markup applied
  // Rate in database is ALREADY per-night, just multiply by nights selected
  const calculateRateForOccupancy = (
    rate: HotelRate,
    adults: number,
    children: number,
    userCheckIn: string,
    userCheckOut: string
  ) => {
    const totalGuests = adults + children;

    // Use occupancy-specific PER-NIGHT rate if available (nett/supplier cost per night)
    let perNightRate = rate.rate; // fallback to base rate

    if (totalGuests === 1 && rate.singleRate) perNightRate = rate.singleRate;
    else if (totalGuests === 2 && rate.doubleRate) perNightRate = rate.doubleRate;
    else if (totalGuests === 3 && rate.tripleRate) perNightRate = rate.tripleRate;
    else if (totalGuests >= 4 && rate.quadRate) perNightRate = rate.quadRate;

    // Calculate user's selected nights
    const userNights = calculateNightsBetween(userCheckIn, userCheckOut);

    // Calculate total nett cost for user's stay
    const baseRateTotal = perNightRate * userNights;

    // Apply markup to get client price (nett rates uploaded need markup added)
    const markupPercentage = getMarkupPercentage();
    const clientPrice = calculateClientPrice(baseRateTotal, markupPercentage);

    return {
      baseRate: baseRateTotal,          // supplier/nett cost for entire stay
      clientPrice,                       // what customer pays (with markup) for entire stay
      markupPercentage,
      perNightRate,                      // nett rate per night
      totalNights: userNights
    };
  };

  const handleSelectRate = (rate: HotelRate) => {
    // Use offline search dates for date-aware pricing
    const userCheckIn = offlineSearchDates.checkIn || rate.checkIn;
    const userCheckOut = offlineSearchDates.checkOut || rate.checkOut;

    const checkIn = userCheckIn ? new Date(userCheckIn).toISOString() : new Date(rate.checkIn).toISOString();
    const checkOut = userCheckOut ? new Date(userCheckOut).toISOString() : new Date(rate.checkOut).toISOString();

    // Calculate price based on occupancy AND user's selected dates with markup
    const calculated = calculateRateForOccupancy(
      rate,
      formData.adults,
      formData.children,
      userCheckIn,
      userCheckOut
    );

    // Directly submit the hotel
    onSubmit({
      type: 'hotel',
      name: rate.propertyName,
      startDate: checkIn,
      endDate: checkOut,
      price: calculated.clientPrice, // Client pays marked-up price for selected dates
      quantity: 1,
      details: {
        hotelName: rate.propertyName,
        hotelCode: rate.propertyCode,
        roomType: rate.roomType,
        mealPlan: rate.mealPlan,
        totalPrice: calculated.clientPrice,
        location: {
          city: '',
          country: '',
          address: ''
        },
        hotelRating: 3,
        amenities: [],
        cancellationPolicy: '',
        checkIn: {
          date: userCheckIn,
          time: '15:00'
        },
        checkOut: {
          date: userCheckOut,
          time: '11:00'
        },
        guests: {
          adults: formData.adults,
          children: formData.children,
          childrenAges: formData.childrenAges
        },
        supplierSource: rate.source,
        supplier: rate.supplier,
        commissionPercent: rate.commissionPercent,
        rateKey: '',
        clientPrice: calculated.clientPrice,      // What customer pays (with markup) for selected dates
        supplierCost: calculated.baseRate         // Nett cost from supplier for selected dates
      },
    });
  };

  const handleSelectHotel = (hotel: EnhancedHotelDetails) => {
    // Try to match this hotel to uploaded rates to get accurate supplier cost
    const mockItem: TravelItem = {
      id: 'temp',
      type: 'hotel',
      name: hotel.hotelName,
      startDate: formData.checkInDate,
      endDate: formData.checkOutDate,
      price: hotel.totalPrice,
      quantity: 1,
      details: hotel
    };

    const rateMatch = findMatchingRate(mockItem, rates);

    if (rateMatch.matched && rateMatch.supplierCost) {
      // Use matched rate's supplier cost
      const updatedHotel: EnhancedHotelDetails = {
        ...hotel,
        supplierCost: rateMatch.supplierCost,
        clientPrice: hotel.totalPrice,
        profit: hotel.totalPrice - rateMatch.supplierCost
      };
      setSelectedHotel(updatedHotel);
    } else {
      // Use API price as both supplier cost and client price (no profit margin visible)
      // In reality, HotelBeds API includes their commission
      setSelectedHotel({
        ...hotel,
        supplierCost: hotel.supplierCost || hotel.totalPrice * 0.85, // Estimate 15% margin
        clientPrice: hotel.totalPrice,
        profit: hotel.totalPrice - (hotel.supplierCost || hotel.totalPrice * 0.85)
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      type: 'hotel',
      name: formData.hotelName,
      startDate: `${formData.checkInDate}T${formData.checkInTime}`,
      endDate: `${formData.checkOutDate}T${formData.checkOutTime}`,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      supplierSource: 'offline_platform',
      details: {
        hotelName: formData.hotelName,
        hotelCode: '',
        roomType: formData.roomType,
        mealPlan: formData.mealPlan,
        totalPrice: parseFloat(formData.price),
        location: {
          city: formData.location,
          country: '',
          address: ''
        },
        hotelRating: formData.hotelRating,
        amenities: [],
        cancellationPolicy: '',
        checkIn: {
          date: formData.checkInDate,
          time: formData.checkInTime
        },
        checkOut: {
          date: formData.checkOutDate,
          time: formData.checkOutTime
        },
        guests: {
          adults: formData.adults,
          children: formData.children,
          childrenAges: formData.childrenAges
        },
        supplier: formData.supplier || undefined,
        commissionPercent: formData.commissionPercent ? parseFloat(formData.commissionPercent) : undefined,
        rateKey: '',
        clientPrice: parseFloat(formData.price),
        supplierCost: formData.commissionPercent
          ? parseFloat(formData.price) * (1 - parseFloat(formData.commissionPercent) / 100)
          : parseFloat(formData.price) * 0.9
      },
    });
  };

  const handleConfirmBooking = () => {
    if (!selectedHotel) return;

    const hotelData = {
      type: 'hotel',
      name: selectedHotel.hotelName,
      startDate: `${formData.checkInDate}T${formData.checkInTime}`,
      endDate: `${formData.checkOutDate}T${formData.checkOutTime}`,
      price: selectedHotel.totalPrice,
      quantity: 1,
      source: 'api' as const,
      apiProvider: 'hotelbeds' as const,
      // Add cost tracking fields
      supplierCost: selectedHotel.supplierCost,
      clientPrice: selectedHotel.clientPrice,
      details: {
        ...selectedHotel,
        checkIn: {
          date: formData.checkInDate,
          time: formData.checkInTime,
        },
        checkOut: {
          date: formData.checkOutDate,
          time: formData.checkOutTime,
        },
        guests: {
          adults: formData.adults,
          children: formData.children,
          childrenAges: formData.childrenAges,
        },
      },
    };

    onSubmit(hotelData);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      'Free WiFi': <Wifi className="w-4 h-4" />,
      'Parking': <Car className="w-4 h-4" />,
      'Breakfast': <Coffee className="w-4 h-4" />,
    };
    return iconMap[amenity] || null;
  };

  return (
    <div className="fixed inset-0 bg-clio-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-clio-gray-950 rounded-2xl w-full max-w-4xl shadow-strong max-h-[90vh] overflow-hidden flex flex-col border border-clio-gray-200 dark:border-clio-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/50 dark:bg-clio-gray-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm">
              <Hotel className="w-6 h-6 text-clio-blue" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Add Hotel</h3>
              <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">Configure accommodation details</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 transition-colors text-clio-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-clio-gray-100 dark:border-clio-gray-800 px-8 bg-white dark:bg-clio-gray-950">
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'offline'
                ? 'border-clio-blue text-clio-blue'
                : 'border-transparent text-clio-gray-400 hover:text-clio-gray-600 dark:hover:text-clio-gray-200'
            }`}
          >
            Offline Rates ({hotelRatesInDateRange.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-clio-blue text-clio-blue'
                : 'border-transparent text-clio-gray-400 hover:text-clio-gray-600 dark:hover:text-clio-gray-200'
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'api'
                ? 'border-clio-blue text-clio-blue'
                : 'border-transparent text-clio-gray-400 hover:text-clio-gray-600 dark:hover:text-clio-gray-200'
            }`}
          >
            API Search
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-clio-gray-950">
          {/* Tab 1: Offline Rates */}
          {activeTab === 'offline' && (
            <div className="space-y-8">
              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-6 p-6 bg-clio-gray-50 dark:bg-clio-gray-900/50 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
                <div className="space-y-2">
                  <Label htmlFor="offlineCheckIn" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Check-in Date</Label>
                  <Input
                    id="offlineCheckIn"
                    type="date"
                    value={offlineSearchDates.checkIn}
                    onChange={(e) => setOfflineSearchDates({ ...offlineSearchDates, checkIn: e.target.value })}
                    className="h-12 rounded-xl bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offlineCheckOut" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Check-out Date</Label>
                  <Input
                    id="offlineCheckOut"
                    type="date"
                    value={offlineSearchDates.checkOut}
                    onChange={(e) => setOfflineSearchDates({ ...offlineSearchDates, checkOut: e.target.value })}
                    min={offlineSearchDates.checkIn}
                    className="h-12 rounded-xl bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                {offlineSearchDates.checkIn && offlineSearchDates.checkOut && (
                  <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-clio-blue bg-clio-blue/5 dark:bg-clio-blue/10 px-4 py-3 rounded-xl border border-clio-blue/10 text-center">
                    {calculateNightsBetween(offlineSearchDates.checkIn, offlineSearchDates.checkOut)} nights • {offlineSearchDates.checkIn} to {offlineSearchDates.checkOut}
                  </div>
                )}
              </div>

              {/* Guest Selection */}
              <div className="grid grid-cols-3 gap-6 p-6 bg-clio-gray-50 dark:bg-clio-gray-900/50 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
                <div className="space-y-2">
                  <Label htmlFor="offlineAdults" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Adults</Label>
                  <Input
                    id="offlineAdults"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.adults}
                    onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 1 })}
                    className="h-12 rounded-xl bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offlineChildren" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Children</Label>
                  <Input
                    id="offlineChildren"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.children}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        children: count,
                        childrenAges: Array(count).fill(0)
                      });
                    }}
                    className="h-12 rounded-xl bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-[10px] font-black uppercase tracking-widest text-clio-blue bg-clio-blue/5 dark:bg-clio-blue/10 px-4 py-3 h-12 flex items-center justify-center rounded-xl border border-clio-blue/10 w-full text-center">
                    Total: {formData.adults + formData.children} guests
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-clio-gray-400" />
                <input
                  type="text"
                  placeholder="Search by hotel name, location, or room type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-clio-gray-50 dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all font-bold uppercase tracking-tight text-[10px]"
                />
              </div>

              {/* Results */}
              {filteredRates.length === 0 ? (
                <div className="text-center py-16 bg-clio-gray-50 dark:bg-clio-gray-900/50 rounded-2xl border-2 border-dashed border-clio-gray-200 dark:border-clio-gray-800">
                  <div className="w-16 h-16 bg-white dark:bg-clio-gray-800 rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
                    <Hotel className="w-8 h-8 text-clio-gray-300 dark:text-clio-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight mb-2">No hotels found</h3>
                  <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest max-w-xs mx-auto">
                    Try adjusting your search or switch to Manual Entry
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
                  {ratesToDisplay.map((rate) => (
                    <button
                      key={rate.id}
                      onClick={() => handleSelectRate(rate)}
                      className="text-left p-6 bg-white dark:bg-clio-gray-900 border border-clio-gray-100 dark:border-clio-gray-800 rounded-2xl hover:border-clio-blue hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight text-lg group-hover:text-clio-blue transition-colors">{rate.propertyName}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-clio-blue mt-1">
                            {rate.roomType}
                          </div>
                          {rate.mealPlan && (
                            <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mt-2 bg-clio-gray-50 dark:bg-clio-gray-800 inline-block px-2 py-1 rounded">
                              Meal Plan: {rate.mealPlan}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">
                              <Calendar className="w-3 h-3" />
                              {rate.checkIn} - {rate.checkOut}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">
                              <MapPin className="w-3 h-3" />
                              {rate.supplier}
                            </div>
                          </div>
                        </div>
                        <div className="text-right min-w-[200px] flex flex-col items-end">
                          {(() => {
                            const calculated = calculatedRates.get(rate.id);
                            if (!calculated) return null;

                            return (
                              <>
                                <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-2">
                                  {rate.currency} {calculated.perNightRate.toFixed(2)}/night (nett)
                                </div>
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">
                                    {calculated.totalNights} nights × {rate.currency} {calculated.perNightRate.toFixed(2)}
                                  </div>
                                  <div className="text-[10px] font-bold text-green-600 uppercase tracking-tight">
                                    {rate.commissionPercent}% commission
                                  </div>
                                  <div className="text-[10px] font-bold text-clio-blue uppercase tracking-tight">
                                    +{calculated.markupPercentage}% markup
                                  </div>
                                </div>
                                <div className="mt-4 bg-clio-blue/5 dark:bg-clio-blue/10 px-4 py-2.5 rounded-xl border border-clio-blue/10 group-hover:bg-clio-blue group-hover:text-white transition-all">
                                  <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Quote</div>
                                  <div className="text-xl font-black">{rate.currency} {calculated.clientPrice.toFixed(2)}</div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Manual Entry */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="hotelName" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Hotel Name *</Label>
                  <Input
                    id="hotelName"
                    required
                    value={formData.hotelName}
                    onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                    placeholder="e.g., Hilton Garden Inn"
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Location *</Label>
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Miami, FL"
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="roomType" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Room Type</Label>
                  <Input
                    id="roomType"
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    placeholder="e.g., Standard King"
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mealPlanManual" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Meal Plan</Label>
                  <Select
                    value={formData.mealPlan}
                    onValueChange={(value) => setFormData({ ...formData, mealPlan: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mealPlans.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="checkInDate" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Check-in Date *</Label>
                  <Input
                    id="checkInDate"
                    type="date"
                    required
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkInTime" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Check-in Time</Label>
                  <Input
                    id="checkInTime"
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="checkOutDate" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Check-out Date *</Label>
                  <Input
                    id="checkOutDate"
                    type="date"
                    required
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                    min={formData.checkInDate}
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOutTime" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Check-out Time</Label>
                  <Input
                    id="checkOutTime"
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
              </div>

              {nights > 0 && (
                <div className="p-4 bg-clio-blue/5 dark:bg-clio-blue/10 rounded-xl border border-clio-blue/10 text-[10px] font-black uppercase tracking-widest text-clio-blue text-center">
                  {nights} night{nights > 1 ? 's' : ''} stay
                </div>
              )}

              <div className="grid grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Total Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Rooms *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Commission %</Label>
                  <Input
                    id="commission"
                    type="number"
                    step="0.1"
                    value={formData.commissionPercent}
                    onChange={(e) => setFormData({ ...formData, commissionPercent: e.target.value })}
                    placeholder="10"
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Hotel chain or supplier name"
                  className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                />
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-clio-gray-100 dark:border-clio-gray-800">
                <button 
                  type="button" 
                  onClick={onCancel}
                  className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel Entry
                </button>
                <Button 
                  type="submit" 
                  className="bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-clio-blue/20"
                >
                  Add Hotel
                </Button>
              </div>
            </form>
          )}

          {/* Tab 3: API Search */}
          {activeTab === 'api' && (
            <div className="space-y-8">
              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Destination</Label>
                <div className="relative">
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                    placeholder="City or Hotel Name"
                    className="pl-12 h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                  <MapPin className="w-5 h-5 absolute left-4 top-3.5 text-clio-gray-400" />
                </div>
              </div>

              {/* Check-in/out Dates */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="checkInDate" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Check-in Date</Label>
                  <div className="relative">
                    <Input
                      id="checkInDate"
                      type="date"
                      value={formData.checkInDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkInDate: e.target.value }))}
                      className="pl-12 h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                    />
                    <Calendar className="w-5 h-5 absolute left-4 top-3.5 text-clio-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOutDate" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Check-out Date</Label>
                  <div className="relative">
                    <Input
                      id="checkOutDate"
                      type="date"
                      value={formData.checkOutDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkOutDate: e.target.value }))}
                      min={formData.checkInDate}
                      className="pl-12 h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                    />
                    <Calendar className="w-5 h-5 absolute left-4 top-3.5 text-clio-gray-400" />
                  </div>
                </div>
              </div>

              {/* Check-in/out Times */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="checkInTime" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Check-in Time</Label>
                  <div className="relative">
                    <Input
                      id="checkInTime"
                      type="time"
                      value={formData.checkInTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                      className="pl-12 h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                    />
                    <Clock className="w-5 h-5 absolute left-4 top-3.5 text-clio-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOutTime" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Check-out Time</Label>
                  <div className="relative">
                    <Input
                      id="checkOutTime"
                      type="time"
                      value={formData.checkOutTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                      className="pl-12 h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                    />
                    <Clock className="w-5 h-5 absolute left-4 top-3.5 text-clio-gray-400" />
                  </div>
                </div>
              </div>

              {nights > 0 && (
                <div className="p-4 bg-clio-blue/5 dark:bg-clio-blue/10 rounded-xl border border-clio-blue/10 text-[10px] font-black uppercase tracking-widest text-clio-blue text-center">
                  {nights} night{nights > 1 ? 's' : ''} stay
                </div>
              )}

              {/* Guests */}
              <div className="grid grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="adults" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Adults</Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.adults}
                    onChange={(e) => setFormData(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="children" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Children</Label>
                  <Input
                    id="children"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.children}
                    onChange={(e) => {
                      const count = parseInt(e.target.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        children: count,
                        childrenAges: Array(count).fill(0)
                      }));
                    }}
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mealPlan" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Meal Plan</Label>
                  <Select
                    value={formData.mealPlan}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, mealPlan: value }))
                    }
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mealPlans.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Hotel Preferences */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label htmlFor="rating" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Minimum Rating</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="rating"
                      type="range"
                      min="1"
                      max="5"
                      value={formData.hotelRating}
                      onChange={(e) => setFormData(prev => ({ ...prev, hotelRating: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <div className="flex items-center space-x-1 bg-clio-gray-50 dark:bg-clio-gray-900 px-3 py-2 rounded-lg border border-clio-gray-100 dark:border-clio-gray-800">
                      {renderStars(formData.hotelRating)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Price Range</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      min="0"
                      value={formData.priceRange.min}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFormData(prev => ({ 
                          ...prev, 
                          priceRange: { ...prev.priceRange, min: isNaN(value) ? 0 : value }
                        }));
                      }}
                      placeholder="Min"
                      className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                    />
                    <span className="text-clio-gray-400 font-bold">—</span>
                    <Input
                      type="number"
                      min="0"
                      value={formData.priceRange.max}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFormData(prev => ({ 
                          ...prev, 
                          priceRange: { ...prev.priceRange, max: isNaN(value) ? 1000 : value }
                        }));
                      }}
                      placeholder="Max"
                      className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch} 
                className="w-full bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg shadow-clio-blue/20" 
                disabled={isSearching || !formData.destination || !formData.checkInDate || !formData.checkOutDate}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Searching Hotels...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-3" />
                    Search Hotels
                  </>
                )}
              </Button>

              {/* Search Results */}
              {showResults && searchResults.length > 0 && (
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Available Hotels</h4>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {searchResults.map((hotel, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectHotel(hotel)}
                        className={`p-6 border rounded-2xl cursor-pointer transition-all group ${
                          selectedHotel === hotel
                            ? 'border-clio-blue bg-clio-blue/5 dark:bg-clio-blue/10 shadow-md'
                            : 'border-clio-gray-100 dark:border-clio-gray-800 bg-white dark:bg-clio-gray-900 hover:border-clio-gray-300 dark:hover:border-clio-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight text-lg group-hover:text-clio-blue transition-colors">{hotel.hotelName}</h5>
                              <div className="flex bg-clio-gray-50 dark:bg-clio-gray-800 px-2 py-1 rounded-md border border-clio-gray-100 dark:border-clio-gray-700">{renderStars(hotel.hotelRating)}</div>
                            </div>
                            
                            <p className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight flex items-center mb-4">
                              <MapPin className="w-3.5 h-3.5 mr-2 text-clio-blue" />
                              {hotel.location.city}, {hotel.location.country}
                            </p>
                            
                            <div className="text-[10px] font-black uppercase tracking-widest text-clio-blue mb-4 inline-block bg-clio-blue/5 dark:bg-clio-blue/20 px-3 py-1.5 rounded-lg border border-clio-blue/10">
                              {hotel.roomType}
                            </div>
                            
                            {hotel.amenities && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {hotel.amenities.slice(0, 4).map((amenity, i) => (
                                  <span key={i} className="text-[10px] font-bold uppercase tracking-tight bg-clio-gray-50 dark:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400 px-2.5 py-1.5 rounded-lg border border-clio-gray-100 dark:border-clio-gray-700 flex items-center gap-2">
                                    {getAmenityIcon(amenity)}
                                    <span>{amenity}</span>
                                  </span>
                                ))}
                                {hotel.amenities.length > 4 && (
                                  <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400 py-1.5 px-2">
                                    +{hotel.amenities.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <p className="text-[10px] font-medium text-clio-gray-400 uppercase tracking-widest italic">{hotel.cancellationPolicy}</p>
                          </div>
                          
                          <div className="text-right ml-8 flex flex-col items-end">
                            <div className="bg-clio-blue/5 dark:bg-clio-blue/10 px-4 py-2.5 rounded-xl border border-clio-blue/10 group-hover:bg-clio-blue group-hover:text-white transition-all">
                              <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Quote</div>
                              <div className="text-2xl font-black">{formatCurrency(hotel.totalPrice)}</div>
                            </div>
                            <div className="mt-2 text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">
                              {nights} night{nights > 1 ? 's' : ''} • {formatCurrency(hotel.totalPrice / nights)}/night
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Hotel Summary */}
              {selectedHotel && (
                <div className="p-6 bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">Hotel Selected</h4>
                      <p className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">{selectedHotel.hotelName}</p>
                      <p className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">{selectedHotel.roomType} • {nights} night{nights > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-1">Total Quote</div>
                    <div className="text-xl font-black text-green-700">{formatCurrency(selectedHotel.totalPrice)}</div>
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
                  disabled={!selectedHotel}
                  className="bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-green-600/20"
                >
                  Add Hotel to Quote
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
        </div>
      </div>
    </div>
  );
}
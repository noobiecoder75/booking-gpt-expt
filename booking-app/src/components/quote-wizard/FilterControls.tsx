'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Search,
  Filter,
  X,
  Plane,
  Hotel,
  MapPin,
  Car,
  Calendar,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { TravelItem } from '@/types';

interface FilterState {
  search: string;
  types: Set<string>;
  priceRange: { min: number; max: number };
  dateRange: { start: Date | null; end: Date | null };
}

interface FilterControlsProps {
  items: TravelItem[];
  onFilterChange: (filteredItems: TravelItem[]) => void;
  className?: string;
}

export function FilterControls({ items, onFilterChange, className }: FilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: new Set(['flight', 'hotel', 'activity', 'transfer']),
    priceRange: { min: 0, max: 10000 },
    dateRange: { start: null, end: null },
  });

  // Get item type counts
  const getTypeCounts = () => {
    const counts = {
      flight: items.filter(item => item.type === 'flight').length,
      hotel: items.filter(item => item.type === 'hotel').length,
      activity: items.filter(item => item.type === 'activity').length,
      transfer: items.filter(item => item.type === 'transfer').length,
    };
    return counts;
  };

  const typeCounts = getTypeCounts();

  // Apply all filters
  const applyFilters = (newFilters: FilterState) => {
    let filtered = [...items];

    // Search filter
    if (newFilters.search.trim()) {
      const searchTerm = newFilters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        (item.details && JSON.stringify(item.details).toLowerCase().includes(searchTerm))
      );
    }

    // Type filter
    filtered = filtered.filter(item => newFilters.types.has(item.type));

    // Price filter
    filtered = filtered.filter(item => {
      const itemPrice = item.price * item.quantity;
      return itemPrice >= newFilters.priceRange.min && itemPrice <= newFilters.priceRange.max;
    });

    // Date filter
    if (newFilters.dateRange.start && newFilters.dateRange.end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.startDate);
        return itemDate >= newFilters.dateRange.start! && itemDate <= newFilters.dateRange.end!;
      });
    }

    onFilterChange(filtered);
  };

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const toggleType = (type: string) => {
    const newTypes = new Set(filters.types);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    const newFilters = { ...filters, types: newTypes };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearAllFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      types: new Set(['flight', 'hotel', 'activity', 'transfer']),
      priceRange: { min: 0, max: 10000 },
      dateRange: { start: null, end: null },
    };
    setFilters(defaultFilters);
    applyFilters(defaultFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.types.size < 4) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    return count;
  };

  const activeFilters = getActiveFilterCount();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-4 h-4" />;
      case 'hotel': return <Hotel className="w-4 h-4" />;
      case 'activity': return <MapPin className="w-4 h-4" />;
      case 'transfer': return <Car className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn("bg-white dark:bg-clio-gray-950 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm overflow-hidden", className)}>
      {/* Search Bar */}
      <div className="p-4 border-b border-clio-gray-100 dark:border-clio-gray-800">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-clio-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <Input
              placeholder="Search items by name or details..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-12 h-12 bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 focus:ring-clio-blue/20 focus:border-clio-blue"
            />
            {filters.search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-clio-gray-400 hover:text-clio-gray-600 dark:hover:text-clio-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 h-12 px-6 border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-xs w-full sm:w-auto"
          >
            <Filter className="w-4 h-4 text-clio-blue" />
            <span>Filters</span>
            {activeFilters > 0 && (
              <Badge className="bg-clio-blue text-white ml-1">
                {activeFilters}
              </Badge>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''} text-clio-gray-400`} />
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-6 space-y-8 border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/30 dark:bg-clio-gray-900/30 animate-in slide-in-from-top-2 duration-200">
          {/* Item Type Filters */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 mb-4">Item Types</h4>
            <div className="flex flex-wrap gap-3">
              {([
                { type: 'flight', label: 'Flights' },
                { type: 'hotel', label: 'Hotels' },
                { type: 'activity', label: 'Activities' },
                { type: 'transfer', label: 'Transfers' },
              ] as const).map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    filters.types.has(type)
                      ? 'bg-clio-blue/10 border-clio-blue/30 text-clio-blue shadow-sm'
                      : 'bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400 hover:border-clio-gray-300 dark:hover:border-clio-gray-700'
                  }`}
                >
                  {getTypeIcon(type)}
                  <span className="text-sm font-bold uppercase tracking-tight">{label}</span>
                  <Badge variant="secondary" className="ml-1">
                    {typeCounts[type]}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 mb-4">Quick Filters</h4>
            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl font-bold uppercase tracking-tight text-[10px] h-9"
                onClick={() => {
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(today.getDate() + 1);
                  const newFilters = {
                    ...filters,
                    dateRange: { start: today, end: tomorrow }
                  };
                  setFilters(newFilters);
                  applyFilters(newFilters);
                }}
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-clio-blue" />
                Today
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl font-bold uppercase tracking-tight text-[10px] h-9"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    priceRange: { min: 0, max: 100 }
                  };
                  setFilters(newFilters);
                  applyFilters(newFilters);
                }}
              >
                <DollarSign className="w-3.5 h-3.5 mr-1.5 text-clio-blue" />
                Under $100
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl font-bold uppercase tracking-tight text-[10px] h-9"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    priceRange: { min: 100, max: 500 }
                  };
                  setFilters(newFilters);
                  applyFilters(newFilters);
                }}
              >
                <DollarSign className="w-3.5 h-3.5 mr-1.5 text-clio-blue" />
                $100-500
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl font-bold uppercase tracking-tight text-[10px] h-9"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    priceRange: { min: 500, max: 10000 }
                  };
                  setFilters(newFilters);
                  applyFilters(newFilters);
                }}
              >
                <DollarSign className="w-3.5 h-3.5 mr-1.5 text-clio-blue" />
                $500+
              </Button>
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilters > 0 && (
            <div className="flex justify-end pt-4 border-t border-clio-gray-100 dark:border-clio-gray-800">
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAllFilters}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold uppercase tracking-tight text-[10px]"
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilters > 0 && (
        <div className="px-6 py-2.5 bg-clio-blue/5 dark:bg-clio-blue/10 text-[10px] font-bold text-clio-blue uppercase tracking-widest border-t border-clio-blue/10">
          <span className="opacity-70">Showing filtered results</span> • {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
        </div>
      )}
    </div>
  );
}
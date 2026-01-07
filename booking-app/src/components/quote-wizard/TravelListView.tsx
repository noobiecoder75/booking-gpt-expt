'use client';

import { useState, useMemo } from 'react';
import { TravelQuote, TravelItem } from '@/types';
import { useQuoteMutations } from '@/hooks/mutations/useQuoteMutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getTravelItemColor } from '@/lib/utils';
import { 
  Plane, 
  Hotel, 
  MapPin, 
  Car, 
  ChevronDown, 
  ChevronRight,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  Clock,
  DollarSign,
  GripVertical,
} from 'lucide-react';
import moment from 'moment';

interface TravelListViewProps {
  quote: TravelQuote;
  onEditItem: (item: TravelItem) => void;
  onDeleteItem: (itemId: string) => void;
}

interface GroupedItems {
  [date: string]: TravelItem[];
}

export function TravelListView({ quote, onEditItem, onDeleteItem }: TravelListViewProps) {
  const { addItemToQuote } = useQuoteMutations();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(true);

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: GroupedItems = {};

    quote.items.forEach(item => {
      const dateKey = moment(item.startDate).format('YYYY-MM-DD');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    // Sort items within each day by time
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    });

    return groups;
  }, [quote.items]);

  // Get sorted dates
  const sortedDates = useMemo(() => {
    return Object.keys(groupedItems).sort();
  }, [groupedItems]);

  // Initialize expanded state
  useMemo(() => {
    if (expandAll && expandedDays.size === 0) {
      setExpandedDays(new Set(sortedDates));
    }
  }, [sortedDates, expandAll, expandedDays.size]);

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const toggleAllDays = () => {
    if (expandAll) {
      setExpandedDays(new Set());
      setExpandAll(false);
    } else {
      setExpandedDays(new Set(sortedDates));
      setExpandAll(true);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'hotel': return <Hotel className="w-5 h-5" />;
      case 'activity': return <MapPin className="w-5 h-5" />;
      case 'transfer': return <Car className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const duplicateItem = (item: TravelItem) => {
    const newItem: Omit<TravelItem, 'id'> = {
      ...item,
      name: `${item.name} (Copy)`,
    };
    addItemToQuote.mutate({ quoteId: quote.id, item: newItem });
  };

  const calculateDayTotal = (items: TravelItem[]) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
            Timeline List View
          </h3>
          <Badge className="bg-clio-blue/10 text-clio-blue border-none">
            {quote.items.length} items
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAllDays}
          className="flex items-center space-x-2 border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-[10px]"
        >
          {expandAll ? (
            <>
              <ChevronDown className="w-4 h-4 text-clio-gray-400" />
              <span>Collapse All</span>
            </>
          ) : (
            <>
              <ChevronRight className="w-4 h-4 text-clio-gray-400" />
              <span>Expand All</span>
            </>
          )}
        </Button>
      </div>

      {/* Day Groups */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="text-center py-24 bg-clio-gray-50/50 dark:bg-clio-gray-900/50 rounded-2xl border border-dashed border-clio-gray-200 dark:border-clio-gray-800">
            <div className="w-16 h-16 bg-white dark:bg-clio-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <MapPin className="w-8 h-8 text-clio-gray-300 dark:text-clio-gray-600" />
            </div>
            <p className="text-lg font-bold text-clio-gray-900 dark:text-white mb-1">No items added yet</p>
            <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">
              Add flights, hotels, and activities to build your itinerary
            </p>
          </div>
        ) : (
          sortedDates.map(date => {
            const items = groupedItems[date];
            const isExpanded = expandedDays.has(date);
            const dayTotal = calculateDayTotal(items);
            const dayOfWeek = moment(date).format('dddd');
            const formattedDate = moment(date).format('MMMM D, YYYY');

            return (
              <div key={date} className="bg-white dark:bg-clio-gray-950 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm overflow-hidden">
                {/* Day Header */}
                <button
                  onClick={() => toggleDay(date)}
                  className="w-full px-6 py-5 bg-clio-gray-50/50 dark:bg-clio-gray-900/50 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-900 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-clio-gray-800 border border-clio-gray-200 dark:border-clio-gray-700 flex items-center justify-center group-hover:border-clio-blue transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-clio-blue" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-clio-gray-400" />
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-clio-blue/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-clio-blue" />
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                        {dayOfWeek}
                      </div>
                      <div className="text-xs font-bold text-clio-gray-400 uppercase tracking-widest">
                        {formattedDate}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400 border-none ml-2">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-0.5">Day Total</div>
                    <div className="text-xl font-black text-clio-blue">
                      {formatCurrency(dayTotal)}
                    </div>
                  </div>
                </button>

                {/* Day Items */}
                {isExpanded && (
                  <div className="divide-y divide-clio-gray-100 dark:divide-clio-gray-800">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="px-8 py-6 hover:bg-clio-gray-50/30 dark:hover:bg-clio-gray-900/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-6 flex-1">
                            {/* Drag Handle */}
                            <div className="pt-2.5 cursor-move opacity-20 hover:opacity-50 transition-opacity">
                              <GripVertical className="w-5 h-5 text-clio-gray-400" />
                            </div>

                            {/* Item Icon */}
                            <div 
                              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                              style={{ 
                                backgroundColor: `${getTravelItemColor(item.type)}15`,
                                color: getTravelItemColor(item.type),
                                border: `1px solid ${getTravelItemColor(item.type)}30`
                              }}
                            >
                              {getItemIcon(item.type)}
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3 gap-4">
                                <div className="min-w-0">
                                  <h4 className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight truncate">
                                    {item.name}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-4 mt-1">
                                    <div className="flex items-center space-x-1.5 text-xs font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">
                                      <Clock className="w-3.5 h-3.5 text-clio-blue" />
                                      <span>
                                        {moment(item.startDate).format('h:mm A')}
                                        {item.endDate && item.endDate !== item.startDate && (
                                          <> - {moment(item.endDate).format('h:mm A')}</>
                                        )}
                                      </span>
                                    </div>
                                    {item.quantity > 1 && (
                                      <div className="px-2 py-0.5 bg-clio-gray-100 dark:bg-clio-gray-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-clio-gray-500">
                                        Qty: {item.quantity}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-lg font-black text-clio-gray-900 dark:text-white">
                                    {formatCurrency(item.price * item.quantity)}
                                  </div>
                                  {item.quantity > 1 && (
                                    <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">
                                      {formatCurrency(item.price)} each
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Item Metadata */}
                              {item.details && Object.keys(item.details).length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {Object.entries(item.details).slice(0, 3).map(([key, value]) => (
                                    <Badge
                                      key={key}
                                      variant="outline"
                                      className="text-[10px] font-bold border-clio-gray-200 dark:border-clio-gray-800 text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight bg-clio-gray-50/50 dark:bg-clio-gray-900/50"
                                    >
                                      {key.replace(/_/g, ' ')}: {String(value)}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onEditItem(item)}
                                  className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 hover:text-clio-blue hover:bg-clio-blue/10 h-8 px-3"
                                >
                                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => duplicateItem(item)}
                                  className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 hover:text-clio-blue hover:bg-clio-blue/10 h-8 px-3"
                                >
                                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                                  Duplicate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onDeleteItem(item.id)}
                                  className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-3 ml-auto"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
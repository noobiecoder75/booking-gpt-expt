'use client';

import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { useState, useMemo, useEffect } from 'react';
import { useQuotesQuery } from '@/hooks/queries/useQuotesQuery';
import { CalendarEvent, TravelQuote, TravelItem } from '@/types';
import { getTravelItemColor } from '@/lib/utils';
import { downloadICSFile } from '@/lib/calendar-export';
import { Button } from '@/components/ui/button';
import { Download, CalendarPlus, Filter } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface TimelineCalendarProps {
  contactId?: string | null;
  statusFilters?: TravelQuote['status'][];
  height?: number;
  onEventCountChange?: (count: number) => void;
}

export function TimelineCalendar({
  contactId,
  statusFilters,
  height = 600,
  onEventCountChange
}: TimelineCalendarProps) {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const { data: quotes = [] } = useQuotesQuery();

  // Convert quotes to calendar events
  const events = useMemo(() => {
    console.log('[Calendar] Starting event conversion');
    console.log('[Calendar] Total quotes fetched:', quotes.length);
    console.log('[Calendar] Raw quotes:', quotes);

    let filteredQuotes = quotes;

    if (contactId) {
      filteredQuotes = filteredQuotes.filter(quote => quote.contactId === contactId);
      console.log('[Calendar] Filtered by contactId:', contactId, '- Remaining quotes:', filteredQuotes.length);
    }

    if (statusFilters && statusFilters.length > 0) {
      filteredQuotes = filteredQuotes.filter(quote => statusFilters.includes(quote.status));
      console.log('[Calendar] Filtered by status:', statusFilters, '- Remaining quotes:', filteredQuotes.length);
    }

    console.log('[Calendar] Final filtered quotes:', filteredQuotes);

    const calendarEvents: CalendarEvent[] = [];

    filteredQuotes.forEach((quote, quoteIndex) => {
      console.log(`[Calendar] Processing quote ${quoteIndex + 1}/${filteredQuotes.length}:`, quote.id);
      console.log(`[Calendar] Quote has ${quote.items?.length || 0} items`);

      if (!quote.items || quote.items.length === 0) {
        console.warn(`[Calendar] Quote ${quote.id} has no items!`);
        return;
      }

      quote.items.forEach((item: TravelItem, itemIndex: number) => {
        console.log(`[Calendar]   Item ${itemIndex + 1}/${quote.items.length}:`, item);

        try {
          const start = item.startDate instanceof Date ? item.startDate : new Date(item.startDate);
          const end = item.endDate
            ? (item.endDate instanceof Date ? item.endDate : new Date(item.endDate))
            : start;

          console.log(`[Calendar]   Parsed dates - Start: ${start}, End: ${end}`);

          if (isNaN(start.getTime())) {
            console.error(`[Calendar]   Invalid start date for item ${item.id}:`, item.startDate);
            return;
          }

          if (end && isNaN(end.getTime())) {
            console.error(`[Calendar]   Invalid end date for item ${item.id}:`, item.endDate);
          }

          calendarEvents.push({
            id: `${quote.id}-${item.id}`,
            title: item.name,
            start,
            end,
            resource: item,
          });

          console.log(`[Calendar]   ✓ Event created: ${item.name}`);
        } catch (error) {
          console.error(`[Calendar]   ✗ Error creating event for item ${item.id}:`, error);
        }
      });
    });

    console.log('[Calendar] Total events created:', calendarEvents.length);
    console.log('[Calendar] Events array:', calendarEvents);

    return calendarEvents;
  }, [quotes, contactId, statusFilters]);

  // Notify parent of event count changes
  useEffect(() => {
    if (onEventCountChange) {
      onEventCountChange(events.length);
    }
  }, [events.length, onEventCountChange]);

  const handleExportAll = () => {
    // Create a consolidated quote with all travel items for export
    let filteredQuotes = quotes;

    if (contactId) {
      filteredQuotes = filteredQuotes.filter(quote => quote.contactId === contactId);
    }

    if (statusFilters && statusFilters.length > 0) {
      filteredQuotes = filteredQuotes.filter(quote => statusFilters.includes(quote.status));
    }
    
    if (filteredQuotes.length === 0) return;
    
    // Create a master quote with all items
    const allItems = filteredQuotes.flatMap(quote => quote.items);
    const consolidatedQuote = {
      id: 'consolidated-travel-calendar',
      title: contactId ? 'My Travel Calendar' : 'All Travel Bookings',
      items: allItems,
      totalCost: allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      contactId: contactId || 'all',
      status: 'sent' as const,
      travelDates: {
        start: allItems.length > 0 ? new Date(Math.min(...allItems.map(item => new Date(item.startDate).getTime()))) : new Date(),
        end: allItems.length > 0 ? new Date(Math.max(...allItems.map(item => new Date(item.endDate || item.startDate).getTime()))) : new Date(),
      },
      createdAt: new Date(),
    };
    
    downloadICSFile(consolidatedQuote);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.resource 
      ? getTravelItemColor(event.resource.type)
      : '#6B7280';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 6px',
      },
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const details = event.resource?.details as Record<string, unknown> | undefined;
    const isApiItem = details?.source === 'api';
    const apiProvider = details?.apiProvider;

    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: event.resource
                ? getTravelItemColor(event.resource.type)
                : '#6B7280'
            }}
          />
          {isApiItem && (
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-400"
              title={`API sourced from ${apiProvider || 'external provider'}`}
            />
          )}
        </div>
        <span className="truncate text-xs">{event.title}</span>
        {isApiItem && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded uppercase font-medium">
            API
          </span>
        )}
      </div>
    );
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
      toolbar.onNavigate('TODAY');
    };

    const label = () => {
      const date = moment(toolbar.date);
      return (
        <span className="text-lg font-semibold">
          {date.format('MMMM YYYY')}
        </span>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-clio-gray-50 dark:bg-clio-gray-900 rounded-xl border border-clio-gray-100 dark:border-clio-gray-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToBack}
              className="px-3 py-1 bg-white dark:bg-clio-gray-800 border border-clio-gray-200 dark:border-clio-gray-700 rounded-lg hover:bg-clio-gray-50 dark:hover:bg-clio-gray-700 transition-colors"
            >
              <span className="dark:text-gray-100">←</span>
            </button>
            <button
              onClick={goToCurrent}
              className="px-3 py-1 bg-white dark:bg-clio-gray-800 border border-clio-gray-200 dark:border-clio-gray-700 rounded-lg hover:bg-clio-gray-50 dark:hover:bg-clio-gray-700 text-sm font-bold uppercase tracking-tight dark:text-gray-100 transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNext}
              className="px-3 py-1 bg-white dark:bg-clio-gray-800 border border-clio-gray-200 dark:border-clio-gray-700 rounded-lg hover:bg-clio-gray-50 dark:hover:bg-clio-gray-700 transition-colors"
            >
              <span className="dark:text-gray-100">→</span>
            </button>
          </div>

          <div className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">{label()}</div>

          <div className="flex items-center space-x-1">
            {['month', 'week', 'day', 'agenda'].map((viewName) => (
              <button
                key={viewName}
                onClick={() => toolbar.onView(viewName)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all ${
                  toolbar.view === viewName
                    ? 'bg-clio-blue text-white shadow-sm'
                    : 'bg-white dark:bg-clio-gray-800 border border-clio-gray-200 dark:border-clio-gray-700 text-clio-gray-600 dark:text-clio-gray-300 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-700'
                }`}
              >
                {viewName}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-clio-blue/10 dark:bg-clio-blue/20 rounded-xl border border-clio-blue/20">
          <div className="text-sm font-bold text-clio-blue uppercase tracking-tight">
            Export travel calendar to external apps
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAll}
              className="bg-white dark:bg-clio-gray-900 text-clio-blue border-clio-blue/30 hover:bg-clio-blue/10 font-bold uppercase tracking-tight text-[10px]"
            >
              <Download className="w-3 h-3 mr-1" />
              Export .ics
            </Button>
            <Button
              variant="outline"  
              size="sm"
              onClick={() => window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Travel Schedule')}&details=${encodeURIComponent('Your travel bookings and itinerary')}`, '_blank')}
              className="bg-white dark:bg-clio-gray-900 text-clio-blue border-clio-blue/30 hover:bg-clio-blue/10 font-bold uppercase tracking-tight text-[10px]"
            >
              <CalendarPlus className="w-3 h-3 mr-1" />
              Google Calendar
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Filter className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No items match your filters</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters to see more travel items
          </p>
        </div>
      ) : (
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height }}
          view={view}
          date={date}
          onView={(view) => setView(view)}
          onNavigate={(date) => setDate(date)}
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent,
            toolbar: CustomToolbar,
          }}
          views={['month', 'week', 'day', 'agenda']}
          step={60}
          showMultiDayTimes
          defaultView="week"
          className="bg-white dark:bg-clio-gray-900 rounded-xl shadow-sm border border-clio-gray-100 dark:border-clio-gray-800"
        />
      )}
    </div>
  );
}
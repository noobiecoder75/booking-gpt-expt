'use client';

import { View } from 'react-big-calendar';
import { Calendar, List, Maximize2 } from 'lucide-react';

interface TimelineNavigationProps {
  viewMode: 'calendar' | 'list';
  calendarView: View;
  onViewModeChange: (mode: 'calendar' | 'list') => void;
  onCalendarViewChange: (view: View) => void;
}

export function TimelineNavigation({
  viewMode,
  calendarView,
  onViewModeChange,
  onCalendarViewChange
}: TimelineNavigationProps) {
  return (
    <div className="flex items-center justify-center p-4 bg-clio-gray-50 dark:bg-clio-gray-900 border-b border-clio-gray-100 dark:border-clio-gray-800 rounded-t-2xl">
      {/* View Mode Toggle */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-1 bg-clio-gray-200 dark:bg-clio-gray-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => onViewModeChange('calendar')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-tight transition-all ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-clio-gray-700 text-clio-blue shadow-sm'
                : 'text-clio-gray-500 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-tight transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-clio-gray-700 text-clio-blue shadow-sm'
                : 'text-clio-gray-500 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            <span>List</span>
          </button>
        </div>

        {/* Calendar View Controls (only show when in calendar mode) */}
        {viewMode === 'calendar' && (
          <div className="flex items-center space-x-1 border-l border-clio-gray-200 dark:border-clio-gray-700 pl-6 ml-6">
            {(['month', 'week', 'day', 'agenda'] as View[]).map((view) => (
              <button
                key={view}
                onClick={() => onCalendarViewChange(view)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  calendarView === view
                    ? 'bg-clio-blue text-white shadow-sm'
                    : 'bg-white dark:bg-clio-gray-800 border border-clio-gray-200 dark:border-clio-gray-700 text-clio-gray-500 dark:text-clio-gray-400 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-700'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
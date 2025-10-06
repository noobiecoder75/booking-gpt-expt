'use client';

import { useState, useEffect } from 'react';
import { TimelineCalendar } from '@/components/timeline/Calendar';
import { TimelineFilters } from '@/components/timeline/TimelineFilters';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { ModernCard } from '@/components/ui/modern-card';
import { TravelQuote } from '@/types';

export default function TimelinePage() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<TravelQuote['status'][]>([
    'draft',
    'sent',
    'accepted',
    'rejected',
  ]);
  const [eventCount, setEventCount] = useState<number>(0);

  useEffect(() => {
    console.log('[TimelinePage] Component mounted');
    return () => {
      console.log('[TimelinePage] Component unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('[TimelinePage] Filters changed:', {
      selectedContactId,
      selectedStatuses,
      eventCount
    });
  }, [selectedContactId, selectedStatuses, eventCount]);

  const handleClearFilters = () => {
    console.log('[TimelinePage] Clearing filters');
    setSelectedContactId(null);
    setSelectedStatuses(['draft', 'sent', 'accepted', 'rejected']);
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Travel Timeline</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View all travel bookings and itineraries in calendar format
            </p>
          </div>

          {/* Filters */}
          <TimelineFilters
            selectedContactId={selectedContactId}
            selectedStatuses={selectedStatuses}
            onContactChange={setSelectedContactId}
            onStatusChange={setSelectedStatuses}
            onClearFilters={handleClearFilters}
            itemCount={eventCount}
          />

          {/* Calendar */}
          <ModernCard variant="elevated" className="p-6">
            <TimelineCalendar
              contactId={selectedContactId}
              statusFilters={selectedStatuses}
              height={700}
              onEventCountChange={setEventCount}
            />
          </ModernCard>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
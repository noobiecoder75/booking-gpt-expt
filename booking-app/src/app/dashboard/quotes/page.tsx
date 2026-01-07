'use client';

import { useEffect } from 'react';
import { QuotesDashboard } from '@/components/quotes/QuotesDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';

export default function QuotesPage() {
  useEffect(() => {
    console.log('[QuotesPage] Component mounted');
    return () => {
      console.log('[QuotesPage] Component unmounted');
    };
  }, []);

  console.log('[QuotesPage] Rendering');

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-clio-gray-900 dark:text-white mb-3">
              Quotes Dashboard
            </h1>
            <p className="text-clio-gray-600 dark:text-clio-gray-400">
              View and manage all travel quotes with powerful filtering and insights
            </p>
          </div>
          <QuotesDashboard />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
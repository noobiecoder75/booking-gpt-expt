'use client';

import { QuoteWizard } from '@/components/quote-wizard/QuoteWizard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function QuoteWizardContent() {
  const searchParams = useSearchParams();
  const editQuoteId = searchParams.get('edit');

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-clio-gray-900 dark:text-white mb-3 uppercase tracking-tight">
              {editQuoteId ? 'Edit Travel Quote' : 'Create Travel Quote'}
            </h1>
            <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium">
              {editQuoteId
                ? 'Update your travel quote with the latest details and pricing'
                : 'Step-by-step intelligent wizard to create comprehensive travel quotes'
              }
            </p>
          </div>
          <QuoteWizard editQuoteId={editQuoteId} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

export default function QuoteWizardPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <QuoteWizardContent />
      </Suspense>
    </ErrorBoundary>
  );
}
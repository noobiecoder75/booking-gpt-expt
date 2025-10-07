'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { TravelQuote, Contact } from '@/types';
import { useQuoteByIdQuery } from '@/hooks/queries/useQuotesQuery';
import { useContactByIdQuery } from '@/hooks/queries/useContactsQuery';
import { useQuoteMutations } from '@/hooks/mutations/useQuoteMutations';
import { ClientQuoteView } from '@/components/client/ClientQuoteView';
import { ModernCard } from '@/components/ui/modern-card';
import { Loader2 } from 'lucide-react';
import { validateClientAccessToken } from '@/lib/client-links';

// This would typically come from your backend API or URL params
const getAccessToken = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  }
  return null;
};

export default function ClientQuotePage() {
  const params = useParams();
  const quoteId = params.quoteId as string;
  const [accessDenied, setAccessDenied] = useState(false);
  const { updateQuoteStatus } = useQuoteMutations();

  const { data: quote, isLoading: quoteLoading } = useQuoteByIdQuery(quoteId);
  const { data: contact, isLoading: contactLoading } = useContactByIdQuery(quote?.contactId);

  const loading = quoteLoading || contactLoading;

  useEffect(() => {
    // Check access token
    const token = getAccessToken();
    if (!token || !validateClientAccessToken(token, quoteId)) {
      setAccessDenied(true);
    }
  }, [quoteId]);

  const handleQuoteAction = (action: 'accept' | 'reject' | 'message' | 'payment') => {
    console.log('Quote action:', action, 'for quote:', quoteId);
    // In a real implementation, this would send the action to your backend

    // Update quote status if accepting/rejecting
    if (action === 'accept' || action === 'reject') {
      updateQuoteStatus.mutate({
        id: quoteId,
        status: action === 'accept' ? 'accepted' : 'rejected'
      });
    }

    // Payment action would typically trigger a payment flow
    if (action === 'payment') {
      // TODO: Implement payment integration
      console.log('Payment action triggered for quote:', quoteId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <ModernCard className="text-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading your quote...</p>
        </ModernCard>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <ModernCard className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m2-13a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don&apos;t have permission to view this quote. Please check your link or contact your travel agent.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Missing or invalid access token
          </div>
        </ModernCard>
      </div>
    );
  }

  if (!quote || !contact) {
    notFound();
    return null;
  }

  return (
    <ClientQuoteView
      quote={quote}
      contact={contact}
      agentName="Travel Expert" // This would come from your backend
      agentEmail="agent@travelcompany.com" // This would come from your backend
      onQuoteAction={handleQuoteAction}
    />
  );
}
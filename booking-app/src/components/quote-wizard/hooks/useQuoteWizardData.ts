import { useQuery } from '@tanstack/react-query';
import { useContactByIdQuery } from '@/hooks/queries/useContactsQuery';
import { useQuoteByIdQuery } from '@/hooks/queries/useQuotesQuery';

interface UseQuoteWizardDataOptions {
  editQuoteId?: string | null;
  enabled?: boolean;
}

export function useQuoteWizardData({ editQuoteId, enabled = true }: UseQuoteWizardDataOptions) {
  const isEditMode = !!editQuoteId;

  // Initial quote load - fetch once and cache during edit session
  // Allow refetching when queries are invalidated (e.g., when items are added/updated)
  const {
    data: initialQuote,
    isLoading: isLoadingQuote,
    error: quoteError,
    refetch: refetchQuote,
  } = useQuoteByIdQuery(editQuoteId, {
    enabled: isEditMode && enabled,
    staleTime: 1000, // Allow refetching after 1 second - balances freshness with performance
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  // Contact data - separate query with its own cache strategy
  const {
    data: contact,
    isLoading: isLoadingContact,
    error: contactError,
  } = useContactByIdQuery(initialQuote?.contactId, {
    enabled: !!initialQuote?.contactId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes - contacts rarely change
  });

  // Calculate loading states
  const isInitializing = isEditMode && enabled && (isLoadingQuote || (!!initialQuote && isLoadingContact));
  const error = quoteError || contactError;

  return {
    // Core data
    quote: initialQuote,
    contact,

    // Loading states
    isInitializing,
    isLoadingQuote,
    isLoadingContact,

    // Error states
    error: error ? (error as Error).message : null,

    // Manual controls
    refetchQuote,

    // Mode
    isEditMode,
  };
}

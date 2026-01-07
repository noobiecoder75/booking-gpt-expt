'use client';

import { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { quoteWizardMachine } from './machines/quote-wizard.machine';
import { useQuoteWizardData } from './hooks/useQuoteWizardData';
import { useQuoteMutations } from '@/hooks/mutations/useQuoteMutations';
import { useRouter } from 'next/navigation';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard } from '@/components/ui/modern-card';
import { ContactSelection } from './ContactSelection';
import { QuoteDetails } from './QuoteDetails';
import { TravelItems } from './TravelItems';
import { QuoteReview } from './QuoteReview';
import { ChevronLeft, ChevronRight, Save, X, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { TravelQuote } from '@/types';

interface QuoteWizardProps {
  editQuoteId?: string | null;
}

const steps = [
  { id: 'selectingContact', label: 'Select Contact', description: 'Choose or create a contact' },
  { id: 'enteringDetails', label: 'Quote Details', description: 'Set travel dates and details' },
  { id: 'editingDetails', label: 'Quote Details', description: 'Set travel dates and details' },
  { id: 'addingItems', label: 'Add Items', description: 'Add flights, hotels, and activities' },
  { id: 'reviewing', label: 'Review & Send', description: 'Review and finalize quote' },
];

export function QuoteWizard({ editQuoteId }: QuoteWizardProps) {
  const router = useRouter();

  // Initialize state machine with edit mode if editQuoteId provided
  // Use undefined for optional inputs - the machine will apply defaults
  const [state, send] = useMachine(quoteWizardMachine, {
    input: {
      mode: editQuoteId ? 'edit' : 'create',
      editQuoteId: editQuoteId || undefined,
      selectedContact: undefined,
      quote: undefined,
      error: undefined,
    },
  });

  // Determine which quote ID to fetch - either from props (edit mode) or from state context (newly created)
  const quoteIdToFetch = editQuoteId || state.context.quote?.id;

  // Load data for edit mode OR when we have a newly created quote
  const { quote, contact, isInitializing, error: loadError } = useQuoteWizardData({
    editQuoteId: quoteIdToFetch,
    enabled: !!quoteIdToFetch,
  });

  // Mutations
  const { addQuote, updateQuote } = useQuoteMutations();

  // Load existing quote data when available
  useEffect(() => {
    if (state.matches('loadingExisting') && quote && contact && !loadError) {
      send({ type: 'QUOTE_LOADED', quote, contact });
    }
  }, [state, quote, contact, loadError, send]);

  // Keep wizard context synchronized with latest quote data from Supabase
  useEffect(() => {
    if (!quote || !quote.id) return;
    if (!state.context.quote?.id) return;
    if (quote.id !== state.context.quote.id) return;

    // Don't update during loading/saving states
    if (state.matches('loadingExisting') ||
        state.matches('savingQuote') ||
        state.matches('updatingQuote')) return;

    // Only update if in addingItems state (where listener exists)
    if (!state.matches('addingItems')) return;

    // Only emit update when incoming data differs by reference
    if (state.context.quote === quote) return;

    send({ type: 'QUOTE_UPDATED', quote });
  }, [quote, state, send]);

  // Handle load errors
  useEffect(() => {
    if (state.matches('loadingExisting') && loadError) {
      send({ type: 'LOAD_FAILED', error: loadError });
      toast.error('Failed to load quote', { description: loadError });
    }
  }, [state, loadError, send]);

  // Handle navigation on success - do this AFTER state transition completes
  useEffect(() => {
    if (state.matches('success')) {
      toast.success(
        state.context.mode === 'edit' ? 'Quote updated successfully!' : 'Quote created successfully!'
      );
      // Use setTimeout to defer navigation until after React finishes updating
      setTimeout(() => {
        router.push('/dashboard/quotes');
      }, 0);
    }
  }, [state, router]);

  // Handle save and exit
  const handleSaveAndExit = () => {
    if (state.context.quote?.id) {
      toast.success('Quote saved as draft');
    }
    router.push('/dashboard/quotes');
  };

  // Handle cancel
  const handleCancel = () => {
    send({ type: 'CANCEL' });
    router.push('/dashboard/quotes');
  };

  // Handle quote details submission
  const handleQuoteDetailsSubmit = async (quoteData: any) => {
    send({ type: 'DETAILS_SUBMITTED', quoteData });

    try {
      if (state.context.mode === 'edit' && state.context.quote?.id) {
        // Update existing quote
        await updateQuote.mutateAsync({
          id: state.context.quote.id,
          updates: quoteData,
        });
        send({ type: 'SAVE_SUCCESS', quote: { ...state.context.quote, ...quoteData } });
      } else {
        // Create new quote
        const newQuoteId = await addQuote.mutateAsync({
          contactId: state.context.selectedContact!.id,
          title: quoteData.title || 'New Travel Quote',
          items: [],
          totalCost: 0,
          status: 'draft',
          travelDates: quoteData.travelDates || {
            start: new Date(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        send({
          type: 'SAVE_SUCCESS',
          quote: {
            id: newQuoteId,
            contactId: state.context.selectedContact!.id,
            items: [],
            totalCost: 0,
            status: 'draft',
            ...quoteData,
          },
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      send({ type: 'SAVE_FAILED', error: errorMsg });
      toast.error('Failed to save quote', { description: errorMsg });
    }
  };

  // Get current step index for progress indicator
  const getCurrentStepIndex = () => {
    if (state.matches('selectingContact')) return 0;
    if (state.matches('enteringDetails') || state.matches('editingDetails') || state.matches('savingQuote') || state.matches('updatingQuote')) return 1;
    if (state.matches('addingItems')) return 2;
    if (state.matches('reviewing')) return 3;
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-clio-blue" />
          <p className="text-clio-gray-500 font-bold uppercase tracking-widest text-xs">Loading quote...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (state.matches('error')) {
    return (
      <ModernCard variant="elevated" className="p-12 border-red-100 dark:border-red-900/30">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white">Failed to load quote</h3>
          <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium max-w-md mx-auto">{state.context.error}</p>
          <div className="flex items-center gap-3 justify-center">
            <ModernButton className="bg-clio-blue hover:bg-clio-blue-hover text-white px-8" onClick={() => send({ type: 'RETRY' })}>
              Try Again
            </ModernButton>
            <ModernButton variant="outline" className="border-clio-gray-200 dark:border-clio-gray-800" onClick={handleCancel}>
              Cancel
            </ModernButton>
          </div>
        </div>
      </ModernCard>
    );
  }

  // Render step content
  const renderStepContent = () => {
    if (state.matches('selectingContact')) {
      return (
        <ContactSelection
          onContactSelect={(contact) => send({ type: 'CONTACT_SELECTED', contact })}
        />
      );
    }

    if (state.matches('enteringDetails') || state.matches('editingDetails') || state.matches('savingQuote') || state.matches('updatingQuote')) {
      const isSubmitting = state.matches('savingQuote') || state.matches('updatingQuote');

      // Guard: Ensure selectedContact has valid id
      if (!state.context.selectedContact?.id || state.context.selectedContact.id === '') {
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Error: Contact not selected. Please go back and select a contact.</p>
          </div>
        );
      }

      return (
        <QuoteDetails
          contact={state.context.selectedContact}
          quote={state.context.quote || undefined}
          onComplete={handleQuoteDetailsSubmit}
          isSubmitting={isSubmitting}
        />
      );
    }

    if (state.matches('addingItems')) {
      // Guard: Ensure quote has valid non-empty id and contactId
      if (!state.context.quote?.id || state.context.quote.id === '' ||
          !state.context.quote?.contactId || state.context.quote.contactId === '') {
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Please complete the quote details first.</p>
          </div>
        );
      }

      return (
        <TravelItems
          quote={state.context.quote as TravelQuote}
          onComplete={() => send({ type: 'NEXT' })}
          onQuoteChange={(updatedQuote) => send({ type: 'QUOTE_UPDATED', quote: updatedQuote })}
        />
      );
    }

    if (state.matches('reviewing')) {
      // Guard: Ensure quote and contact have valid non-empty ids
      if (!state.context.quote?.id || state.context.quote.id === '' ||
          !state.context.quote?.contactId || state.context.quote.contactId === '' ||
          !state.context.selectedContact?.id || state.context.selectedContact.id === '') {
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Please complete the previous steps first.</p>
          </div>
        );
      }

      return (
        <QuoteReview
          quote={state.context.quote as TravelQuote}
          contact={state.context.selectedContact}
          onComplete={() => {
            // Validate before final transition
            if (!state.context.quote?.id || !state.context.quote?.contactId) {
              console.error('QuoteWizard: Invalid quote data before final transition', {
                quoteId: state.context.quote?.id,
                contactId: state.context.quote?.contactId
              });
              toast.error('Quote data is invalid. Please try again.');
              return;
            }
            // Only trigger state transition - navigation handled in useEffect
            send({ type: 'NEXT' });
          }}
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <ModernCard variant="elevated" className="p-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < steps.length - 1 ? 'md:flex-1' : ''
              } w-full md:w-auto`}
            >
              <div className="flex flex-col items-center flex-1 md:flex-initial">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black transition-all shadow-sm ${
                    index < currentStepIndex
                      ? 'bg-emerald-500 text-white shadow-emerald-200'
                      : index === currentStepIndex
                      ? 'bg-clio-blue text-white shadow-clio-blue/20 ring-4 ring-clio-blue/10'
                      : 'bg-clio-gray-50 dark:bg-clio-gray-800 text-clio-gray-400 border border-clio-gray-200 dark:border-clio-gray-700'
                  }`}
                >
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                <div className="mt-4 text-center">
                  <div
                    className={`text-xs font-black uppercase tracking-widest ${
                      index <= currentStepIndex ? 'text-clio-gray-900 dark:text-white' : 'text-clio-gray-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className={`text-[10px] font-bold mt-1 hidden md:block ${
                    index <= currentStepIndex ? 'text-clio-gray-500 dark:text-clio-gray-400' : 'text-clio-gray-300'
                  }`}>
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden md:flex flex-1 h-1 mx-6 rounded-full transition-all duration-500 ${
                    index < currentStepIndex ? 'bg-emerald-500' : 'bg-clio-gray-100 dark:bg-clio-gray-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </ModernCard>

      {/* Navigation */}
      <ModernCard variant="default" className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <ModernButton
              variant="outline"
              className="flex-1 sm:flex-none border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-xs h-11"
              onClick={() => send({ type: 'PREVIOUS' })}
              disabled={
                state.matches('selectingContact') ||
                state.matches('loadingExisting') ||
                state.hasTag('loading')
              }
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </ModernButton>

            <ModernButton variant="ghost" className="flex-1 sm:flex-none font-bold uppercase tracking-tight text-xs h-11 text-clio-gray-600 dark:text-clio-gray-400" onClick={handleSaveAndExit}>
              <Save className="w-4 h-4 mr-2" />
              Save & Exit
            </ModernButton>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <ModernButton
              className="flex-1 sm:flex-none bg-clio-blue hover:bg-clio-blue-hover text-white font-bold uppercase tracking-tight text-xs h-11 px-8"
              onClick={() => send({ type: 'NEXT' })}
              disabled={
                state.matches('reviewing') ||
                !state.can({ type: 'NEXT' }) ||
                state.hasTag('loading')
              }
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </ModernButton>

            <ModernButton variant="ghost" className="flex-1 sm:flex-none font-bold uppercase tracking-tight text-xs h-11 text-clio-gray-400 hover:text-red-500" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </ModernButton>
          </div>
        </div>
      </ModernCard>

      {/* Step Content */}
      <div className="bg-white dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800 p-8 shadow-md">
        {renderStepContent()}
      </div>
    </div>
  );
}

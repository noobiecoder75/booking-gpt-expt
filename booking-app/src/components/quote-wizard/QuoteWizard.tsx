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
  const [state, send] = useMachine(quoteWizardMachine, {
    input: {
      mode: editQuoteId ? 'edit' : 'create',
      editQuoteId: editQuoteId || null,
      selectedContact: null,
      quote: null,
      error: null,
    },
  });

  // Load data for edit mode
  const { quote, contact, isInitializing, error: loadError } = useQuoteWizardData({
    editQuoteId,
    enabled: state.context.mode === 'edit',
  });

  // Mutations
  const { addQuote, updateQuote } = useQuoteMutations();

  // Load existing quote data when available
  useEffect(() => {
    if (state.matches('loadingExisting') && quote && contact && !loadError) {
      send({ type: 'QUOTE_LOADED', quote, contact });
    }
  }, [state, quote, contact, loadError, send]);

  // Handle load errors
  useEffect(() => {
    if (state.matches('loadingExisting') && loadError) {
      send({ type: 'LOAD_FAILED', error: loadError });
      toast.error('Failed to load quote', { description: loadError });
    }
  }, [state, loadError, send]);

  // Handle save and exit
  const handleSaveAndExit = () => {
    if (state.context.quote?.id) {
      toast.success('Quote saved as draft');
    }
    router.push('/dashboard/quotes');
  };

  // Handle cancel
  const handleCancel = () => {
    send('CANCEL');
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
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (state.matches('error')) {
    return (
      <ModernCard variant="elevated" className="p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold">Failed to load quote</h3>
          <p className="text-gray-600">{state.context.error}</p>
          <div className="flex gap-3 justify-center">
            <ModernButton onClick={() => send('RETRY')}>
              Try Again
            </ModernButton>
            <ModernButton variant="outline" onClick={handleCancel}>
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
      return (
        <QuoteDetails
          contact={state.context.selectedContact!}
          quote={state.context.quote || undefined}
          onComplete={handleQuoteDetailsSubmit}
          isSubmitting={isSubmitting}
        />
      );
    }

    if (state.matches('addingItems')) {
      if (!state.context.quote?.id) {
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Please complete the quote details first.</p>
          </div>
        );
      }

      return (
        <TravelItems
          quote={state.context.quote as any}
          onComplete={() => send('NEXT')}
        />
      );
    }

    if (state.matches('reviewing')) {
      if (!state.context.quote?.id) {
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Please complete the previous steps first.</p>
          </div>
        );
      }

      return (
        <QuoteReview
          quote={state.context.quote as any}
          contact={state.context.selectedContact!}
          onComplete={() => {
            send('NEXT');
            toast.success(
              state.context.mode === 'edit' ? 'Quote updated successfully!' : 'Quote created successfully!'
            );
            router.push('/dashboard/quotes');
          }}
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <ModernCard variant="elevated" className="p-6 bg-white">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < steps.length - 1 ? 'md:flex-1' : ''
              } w-full md:w-auto`}
            >
              <div className="flex flex-col items-center flex-1 md:flex-initial">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium transition-colors ${
                    index <= currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="mt-3 text-center">
                  <div
                    className={`text-sm font-medium ${
                      index <= currentStepIndex ? 'text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 hidden md:block">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden md:flex flex-1 h-0.5 mx-6 rounded-full transition-colors ${
                    index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </ModernCard>

      {/* Navigation */}
      <ModernCard variant="default" className="p-6 bg-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <ModernButton
              variant="outline"
              onClick={() => send('PREVIOUS')}
              disabled={
                state.matches('selectingContact') ||
                state.matches('loadingExisting') ||
                state.hasTag('loading')
              }
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </ModernButton>

            <ModernButton variant="ghost" onClick={handleSaveAndExit}>
              <Save className="w-4 h-4 mr-2" />
              Save & Exit
            </ModernButton>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <ModernButton
              onClick={() => send('NEXT')}
              disabled={
                state.matches('reviewing') ||
                !state.can({ type: 'NEXT' }) ||
                state.hasTag('loading')
              }
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </ModernButton>

            <ModernButton variant="ghost" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </ModernButton>
          </div>
        </div>
      </ModernCard>

      {/* Step Content */}
      <ModernCard variant="elevated" className="p-8 bg-white">
        {renderStepContent()}
      </ModernCard>
    </div>
  );
}

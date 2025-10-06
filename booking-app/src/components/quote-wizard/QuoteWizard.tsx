'use client';

import { useState, useEffect } from 'react';
import { useContactByIdQuery } from '@/hooks/queries/useContactsQuery';
import { useQuoteByIdQuery } from '@/hooks/queries/useQuotesQuery';
import { useQuoteMutations } from '@/hooks/mutations/useQuoteMutations';
import { Contact, TravelQuote } from '@/types';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard } from '@/components/ui/modern-card';
import { ContactSelection } from './ContactSelection';
import { QuoteDetails } from './QuoteDetails';
import { TravelItems } from './TravelItems';
import { QuoteReview } from './QuoteReview';
import { ChevronLeft, ChevronRight, Home, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type WizardStep = 'contact' | 'details' | 'items' | 'review';

interface QuoteWizardProps {
  editQuoteId?: string | null;
}

export function QuoteWizard({ editQuoteId }: QuoteWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('contact');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [currentQuote, setCurrentQuote] = useState<Partial<TravelQuote> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const { addQuote, updateQuote } = useQuoteMutations();

  // Load existing quote if editing OR after creation (to get live updates)
  // This ensures we always have fresh data from the database after mutations
  const quoteIdToFetch = editQuoteId || currentQuote?.id;
  const { data: existingQuote } = useQuoteByIdQuery(quoteIdToFetch);
  const { data: existingContact } = useContactByIdQuery(existingQuote?.contactId);

  useEffect(() => {
    if (existingQuote && existingContact) {
      setCurrentQuote(existingQuote);
      setSelectedContact(existingContact);
      setIsEditMode(true);
      // Skip contact selection step in edit mode
      setCurrentStep('details');
    }
  }, [existingQuote, existingContact]);

  const steps = [
    { id: 'contact', label: 'Select Contact', description: 'Choose or create a contact' },
    { id: 'details', label: 'Quote Details', description: 'Set travel dates and details' },
    { id: 'items', label: 'Add Items', description: 'Add flights, hotels, and activities' },
    { id: 'review', label: 'Review & Send', description: 'Review and finalize quote' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const handleNext = () => {
    const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
    setCurrentStep(steps[nextIndex].id as WizardStep);
  };

  const handlePrevious = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(steps[prevIndex].id as WizardStep);
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    handleNext();
  };

  const handleQuoteDetailsComplete = async (quoteData: Partial<TravelQuote>) => {
    if (!selectedContact) return;

    if (isEditMode && currentQuote?.id) {
      // Update existing quote
      await updateQuote.mutateAsync({
        id: currentQuote.id,
        updates: {
          title: quoteData.title || currentQuote.title,
          travelDates: quoteData.travelDates || currentQuote.travelDates,
          ...quoteData,
        },
      });

      // Update local state with new data
      setCurrentQuote({
        ...currentQuote,
        ...quoteData,
      });
    } else {
      // Create new quote
      const newQuoteId = await addQuote.mutateAsync({
        contactId: selectedContact.id,
        title: quoteData.title || 'New Travel Quote',
        items: [],
        totalCost: 0,
        status: 'draft',
        travelDates: quoteData.travelDates || {
          start: new Date(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      // Set the new quote in local state
      setCurrentQuote({
        id: newQuoteId,
        contactId: selectedContact.id,
        title: quoteData.title || 'New Travel Quote',
        items: [],
        totalCost: 0,
        status: 'draft',
        travelDates: quoteData.travelDates || {
          start: new Date(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    handleNext();
  };

  const handleItemsComplete = () => {
    handleNext();
  };

  const handleQuoteComplete = () => {
    // Show success message or redirect
    alert(isEditMode ? 'Quote updated successfully!' : 'Quote created successfully!');

    // Redirect to quotes dashboard
    router.push('/dashboard/quotes');
  };

  const handleSaveAndExit = () => {
    if (currentQuote?.id) {
      // Save current state if we have a quote
      alert('Quote saved as draft');
    }
    router.push('/dashboard/quotes');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'contact':
        // Skip contact selection in edit mode
        if (isEditMode && selectedContact) {
          setCurrentStep('details');
          return null;
        }
        return <ContactSelection onContactSelect={handleContactSelect} />;
      case 'details':
        return (
          <QuoteDetails
            contact={selectedContact!}
            quote={isEditMode ? currentQuote : undefined}
            onComplete={handleQuoteDetailsComplete}
          />
        );
      case 'items':
        // Use live quote data from database (auto-refetches after mutations)
        // Fallback to local state for new quotes before first save
        const liveQuote = existingQuote || currentQuote;

        if (!liveQuote?.id) {
          return (
            <div className="text-center py-8">
              <p className="text-gray-600">Please complete the quote details first.</p>
            </div>
          );
        }

        return (
          <TravelItems
            quote={liveQuote as TravelQuote}
            onComplete={handleItemsComplete}
          />
        );
      case 'review':
        // Use live quote data for review to show latest items
        const reviewQuote = existingQuote || currentQuote;

        if (!reviewQuote?.id) {
          return (
            <div className="text-center py-8">
              <p className="text-gray-600">Please complete the previous steps first.</p>
            </div>
          );
        }

        return (
          <QuoteReview
            quote={reviewQuote as TravelQuote}
            contact={selectedContact!}
            onComplete={handleQuoteComplete}
          />
        );
      default:
        return null;
    }
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
                  <div className={`text-sm font-medium ${
                    index <= currentStepIndex ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden md:block">
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
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </ModernButton>

            <ModernButton
              variant="ghost"
              onClick={handleSaveAndExit}
            >
              <Save className="w-4 h-4 mr-2" />
              Save & Exit
            </ModernButton>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <ModernButton
              onClick={handleNext}
              disabled={
                currentStepIndex === steps.length - 1 ||
                (currentStep === 'contact' && !selectedContact) ||
                (currentStep === 'details' && !currentQuote)
              }
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </ModernButton>

            <ModernButton
              variant="ghost"
              onClick={() => router.push('/dashboard/quotes')}
            >
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
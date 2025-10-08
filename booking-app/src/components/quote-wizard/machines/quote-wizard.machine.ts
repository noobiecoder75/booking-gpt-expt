import { setup, assign } from 'xstate';
import { Contact, TravelQuote } from '@/types';

export type QuoteWizardContext = {
  mode: 'create' | 'edit';
  editQuoteId: string | null;
  selectedContact: Contact | null;
  quote: Partial<TravelQuote> | null;
  error: string | null;
};

export type QuoteWizardEvent =
  | { type: 'CONTACT_SELECTED'; contact: Contact }
  | { type: 'DETAILS_SUBMITTED'; quoteData: Partial<TravelQuote> }
  | { type: 'QUOTE_LOADED'; quote: TravelQuote; contact: Contact }
  | { type: 'LOAD_FAILED'; error: string }
  | { type: 'SAVE_SUCCESS'; quote: Partial<TravelQuote> }
  | { type: 'SAVE_FAILED'; error: string }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'RETRY' }
  | { type: 'CANCEL' };

export const quoteWizardMachine = setup({
  types: {
    context: {} as QuoteWizardContext,
    events: {} as QuoteWizardEvent,
  },
  guards: {
    isEditMode: ({ context }) => context.mode === 'edit',
    isCreateMode: ({ context }) => context.mode === 'create',
    hasContact: ({ context }) => context.selectedContact !== null,
    hasQuote: ({ context }) => context.quote !== null && context.quote.id !== undefined,
  },
  actions: {
    setContact: assign({
      selectedContact: ({ event }) =>
        event.type === 'CONTACT_SELECTED' ? event.contact : null,
    }),
    setQuoteData: assign({
      quote: ({ event, context }) => {
        if (event.type === 'DETAILS_SUBMITTED') {
          return { ...(context.quote || {}), ...event.quoteData };
        }
        if (event.type === 'SAVE_SUCCESS') {
          return event.quote;
        }
        return context.quote;
      },
    }),
    loadExisting: assign({
      quote: ({ event }) =>
        event.type === 'QUOTE_LOADED' ? event.quote : null,
      selectedContact: ({ event }) =>
        event.type === 'QUOTE_LOADED' ? event.contact : null,
      mode: 'edit',
    }),
    setError: assign({
      error: ({ event }) =>
        (event.type === 'LOAD_FAILED' || event.type === 'SAVE_FAILED')
          ? event.error
          : null,
    }),
    clearError: assign({ error: null }),
  },
}).createMachine({
  id: 'quoteWizard',
  initial: 'checkingMode',
  context: ({ input }) => ({
    mode: input.mode || 'create',
    editQuoteId: input.editQuoteId || null,
    selectedContact: input.selectedContact || null,
    quote: input.quote || null,
    error: input.error || null,
  }),
  states: {
    checkingMode: {
      always: [
        { target: 'loadingExisting', guard: 'isEditMode' },
        { target: 'selectingContact' },
      ],
    },

    loadingExisting: {
      tags: ['loading'],
      on: {
        QUOTE_LOADED: {
          target: 'addingItems',
          actions: 'loadExisting',
        },
        LOAD_FAILED: {
          target: 'error',
          actions: 'setError',
        },
      },
    },

    selectingContact: {
      on: {
        CONTACT_SELECTED: {
          target: 'enteringDetails',
          actions: 'setContact',
        },
        CANCEL: 'cancelled',
      },
    },

    enteringDetails: {
      on: {
        DETAILS_SUBMITTED: {
          target: 'savingQuote',
          actions: 'setQuoteData',
        },
        PREVIOUS: {
          target: 'selectingContact',
          guard: 'isCreateMode',
        },
        CANCEL: 'cancelled',
      },
    },

    savingQuote: {
      tags: ['loading'],
      on: {
        SAVE_SUCCESS: {
          target: 'addingItems',
          actions: ['setQuoteData', 'clearError'],
        },
        SAVE_FAILED: {
          target: 'enteringDetails',
          actions: 'setError',
        },
      },
    },

    editingDetails: {
      on: {
        DETAILS_SUBMITTED: 'updatingQuote',
        NEXT: {
          target: 'addingItems',
          guard: 'hasQuote',
        },
        CANCEL: 'cancelled',
      },
    },

    updatingQuote: {
      tags: ['loading'],
      on: {
        SAVE_SUCCESS: {
          target: 'addingItems',
          actions: ['setQuoteData', 'clearError'],
        },
        SAVE_FAILED: {
          target: 'editingDetails',
          actions: 'setError',
        },
      },
    },

    addingItems: {
      on: {
        NEXT: 'reviewing',
        PREVIOUS: [
          { target: 'enteringDetails', guard: 'isCreateMode' },
          { target: 'editingDetails', guard: 'isEditMode' },
        ],
        CANCEL: 'cancelled',
      },
    },

    reviewing: {
      on: {
        NEXT: 'success',
        PREVIOUS: 'addingItems',
        CANCEL: 'cancelled',
      },
    },

    success: {
      type: 'final',
    },

    cancelled: {
      type: 'final',
    },

    error: {
      on: {
        RETRY: 'checkingMode',
        CANCEL: 'cancelled',
      },
    },
  },
});

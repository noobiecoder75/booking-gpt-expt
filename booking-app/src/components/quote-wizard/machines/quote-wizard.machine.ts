import { setup, assign } from 'xstate';
import { Contact, TravelQuote } from '@/types';

// Default contact structure to prevent undefined
const defaultContact: Contact = {
  id: '',
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Default quote structure to prevent undefined
const defaultQuote: Partial<TravelQuote> = {
  id: '',
  contactId: '',
  title: '',
  items: [],
  totalCost: 0,
  status: 'draft',
  travelDates: {
    start: new Date().toISOString(),
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export type QuoteWizardContext = {
  mode: 'create' | 'edit';
  editQuoteId: string;
  selectedContact: Contact;
  quote: Partial<TravelQuote>;
  error: string;
};

export type QuoteWizardInput = {
  mode?: 'create' | 'edit';
  editQuoteId?: string | null;
  selectedContact?: Contact | null;
  quote?: Partial<TravelQuote> | null;
  error?: string | null;
};

export type QuoteWizardEvent =
  | { type: 'CONTACT_SELECTED'; contact: Contact }
  | { type: 'DETAILS_SUBMITTED'; quoteData: Partial<TravelQuote> }
  | { type: 'QUOTE_LOADED'; quote: TravelQuote; contact: Contact }
  | { type: 'QUOTE_UPDATED'; quote: TravelQuote }
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
    input: {} as QuoteWizardInput,
  },
  guards: {
    isEditMode: ({ context }) => context.mode === 'edit',
    isCreateMode: ({ context }) => context.mode === 'create',
    hasContact: ({ context }) => !!(context.selectedContact && context.selectedContact.id && context.selectedContact.id.length > 0),
    hasQuote: ({ context }) => {
      // Simplified guard - check for non-empty id and contactId
      return !!(context.quote &&
                context.quote.id &&
                context.quote.id.length > 0 &&
                context.quote.contactId &&
                context.quote.contactId.length > 0);
    },
  },
  actions: {
    setContact: assign({
      selectedContact: ({ event, context }) =>
        event.type === 'CONTACT_SELECTED' ? event.contact : context.selectedContact,
    }),
    setQuoteData: assign({
      quote: ({ event, context }) => {
        if (event.type === 'DETAILS_SUBMITTED') {
          return { ...context.quote, ...event.quoteData };
        }
        if (event.type === 'SAVE_SUCCESS') {
          return { ...context.quote, ...event.quote };
        }
        return context.quote;
      },
    }),
    loadExisting: assign({
      quote: ({ event, context }) =>
        event.type === 'QUOTE_LOADED' ? event.quote : context.quote,
      selectedContact: ({ event, context }) =>
        event.type === 'QUOTE_LOADED' ? event.contact : context.selectedContact,
      mode: 'edit',
    }),
    updateQuote: assign({
      quote: ({ event, context }) =>
        event.type === 'QUOTE_UPDATED' ? event.quote : context.quote,
    }),
    setError: assign({
      error: ({ event }) =>
        (event.type === 'LOAD_FAILED' || event.type === 'SAVE_FAILED')
          ? event.error
          : '',
    }),
    clearError: assign({ error: '' }),
  },
}).createMachine({
  id: 'quoteWizard',
  initial: 'checkingMode',
  context: ({ input }) => ({
    mode: input.mode || 'create',
    editQuoteId: input.editQuoteId || '',
    selectedContact: input.selectedContact || defaultContact,
    quote: input.quote || defaultQuote,
    error: input.error || '',
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
        QUOTE_UPDATED: {
          actions: 'updateQuote',
        },
        NEXT: {
          target: 'reviewing',
          guard: 'hasQuote',
        },
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

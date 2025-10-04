import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/types/database-contacts';
import { Contact, Address, TravelPreferences } from '@/types';

type ContactRow = Database['public']['Tables']['contacts']['Row'];
type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

interface ContactStore {
  // Local cache for offline support
  contacts: Contact[];

  // Sync status
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;

  // Actions
  fetchContacts: () => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'quotes'>) => Promise<string>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
  searchContacts: (query: string) => Contact[];
  findContactByEmail: (email: string) => Contact | undefined;

  // Quote management
  addQuoteToContact: (contactId: string, quoteId: string) => void;
  removeQuoteFromContact: (contactId: string, quoteId: string) => void;

  // Supplier methods
  findSupplierByName: (name: string) => Contact | undefined;

  // Sync
  syncContacts: () => Promise<void>;
  clearLocalCache: () => void;
}

// Helper: Convert database row to frontend Contact type
function dbRowToContact(row: ContactRow): Contact {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    name: `${row.first_name} ${row.last_name}`,
    email: row.email,
    phone: row.phone || undefined,
    type: row.type as 'customer' | 'supplier' | undefined,
    address: row.address as Address | undefined,
    preferences: row.preferences as TravelPreferences | undefined,
    company: row.company || undefined,
    notes: row.notes || undefined,
    tags: row.tags || undefined,
    quotes: [], // Will be populated from quotes table if needed
    createdAt: new Date(row.created_at),
  };
}

// Helper: Convert frontend Contact to database insert
function contactToDbInsert(contact: Omit<Contact, 'id' | 'createdAt' | 'quotes'>, userId: string): ContactInsert {
  return {
    user_id: userId,
    first_name: contact.firstName,
    last_name: contact.lastName,
    email: contact.email,
    phone: contact.phone || null,
    type: contact.type || 'customer',
    company: contact.company || null,
    notes: contact.notes || null,
    tags: contact.tags || null,
    address: contact.address as any || null,
    preferences: contact.preferences as any || null,
  };
}

// Helper: Convert frontend Contact updates to database update
function contactToDbUpdate(updates: Partial<Contact>): ContactUpdate {
  const dbUpdate: ContactUpdate = {};

  if (updates.firstName !== undefined) dbUpdate.first_name = updates.firstName;
  if (updates.lastName !== undefined) dbUpdate.last_name = updates.lastName;
  if (updates.email !== undefined) dbUpdate.email = updates.email;
  if (updates.phone !== undefined) dbUpdate.phone = updates.phone;
  if (updates.type !== undefined) dbUpdate.type = updates.type;
  if (updates.company !== undefined) dbUpdate.company = updates.company;
  if (updates.notes !== undefined) dbUpdate.notes = updates.notes;
  if (updates.tags !== undefined) dbUpdate.tags = updates.tags;
  if (updates.address !== undefined) dbUpdate.address = updates.address as any;
  if (updates.preferences !== undefined) dbUpdate.preferences = updates.preferences as any;

  return dbUpdate;
}

export const useContactStore = create<ContactStore>()(
  persist(
    (set, get) => ({
      contacts: [],
      syncStatus: 'idle',
      lastSyncTime: null,

      fetchContacts: async () => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.warn('No authenticated user, skipping fetch');
            set({ syncStatus: 'idle' });
            return;
          }

          const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const contacts = data.map(dbRowToContact);

          set({
            contacts,
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          });
        } catch (error) {
          console.error('Failed to fetch contacts:', error);
          set({ syncStatus: 'error' });
        }
      },

      addContact: async (contactData) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No authenticated user');

          const dbInsert = contactToDbInsert(contactData, user.id);

          const { data, error } = await supabase
            .from('contacts')
            .insert(dbInsert)
            .select()
            .single();

          if (error) throw error;

          const newContact = dbRowToContact(data);

          // Update local cache
          set((state) => ({
            contacts: [newContact, ...state.contacts],
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));

          return newContact.id;
        } catch (error) {
          console.error('Failed to create contact:', error);
          set({ syncStatus: 'error' });

          // Fallback to local storage
          const localContact: Contact = {
            ...contactData,
            id: crypto.randomUUID(),
            name: `${contactData.firstName} ${contactData.lastName}`,
            quotes: [],
            createdAt: new Date(),
          };

          set((state) => ({
            contacts: [localContact, ...state.contacts],
          }));

          return localContact.id;
        }
      },

      updateContact: async (id, updates) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const dbUpdate = contactToDbUpdate(updates);

          const { data, error } = await supabase
            .from('contacts')
            .update(dbUpdate)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const updatedContact = dbRowToContact(data);

          // Update local cache
          set((state) => ({
            contacts: state.contacts.map((contact) =>
              contact.id === id ? updatedContact : contact
            ),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to update contact:', error);
          set({ syncStatus: 'error' });

          // Update local cache only
          set((state) => ({
            contacts: state.contacts.map((contact) =>
              contact.id === id
                ? {
                    ...contact,
                    ...updates,
                    name: updates.firstName || updates.lastName
                      ? `${updates.firstName || contact.firstName} ${updates.lastName || contact.lastName}`
                      : contact.name
                  }
                : contact
            ),
          }));
        }
      },

      deleteContact: async (id) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Update local cache
          set((state) => ({
            contacts: state.contacts.filter((contact) => contact.id !== id),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to delete contact:', error);
          set({ syncStatus: 'error' });

          // Update local cache only
          set((state) => ({
            contacts: state.contacts.filter((contact) => contact.id !== id),
          }));
        }
      },

      getContactById: (id) => {
        return get().contacts.find((contact) => contact.id === id);
      },

      searchContacts: (query) => {
        const { contacts } = get();
        if (!query.trim()) return contacts;

        const lowercaseQuery = query.toLowerCase();
        return contacts.filter(
          (contact) =>
            contact.firstName.toLowerCase().includes(lowercaseQuery) ||
            contact.lastName.toLowerCase().includes(lowercaseQuery) ||
            contact.email.toLowerCase().includes(lowercaseQuery) ||
            contact.company?.toLowerCase().includes(lowercaseQuery)
        );
      },

      findContactByEmail: (email) => {
        return get().contacts.find(
          (c) => c.email.toLowerCase() === email.toLowerCase()
        );
      },

      addQuoteToContact: (contactId, quoteId) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === contactId
              ? { ...contact, quotes: [...contact.quotes, quoteId] }
              : contact
          ),
        }));
      },

      removeQuoteFromContact: (contactId, quoteId) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === contactId
              ? {
                  ...contact,
                  quotes: contact.quotes.filter((id) => id !== quoteId),
                }
              : contact
          ),
        }));
      },

      findSupplierByName: (name) => {
        const { contacts } = get();
        const normalizedName = name.toLowerCase().trim();

        return contacts.find(
          (contact) =>
            contact.type === 'supplier' &&
            (contact.firstName + ' ' + contact.lastName).toLowerCase().trim() === normalizedName
        );
      },

      syncContacts: async () => {
        await get().fetchContacts();
      },

      clearLocalCache: () => {
        set({
          contacts: [],
          syncStatus: 'idle',
          lastSyncTime: null,
        });
      },
    }),
    {
      name: 'contact-store-supabase',
      // Don't persist syncStatus and lastSyncTime
      partialize: (state) => ({
        contacts: state.contacts,
      }),
    }
  )
);

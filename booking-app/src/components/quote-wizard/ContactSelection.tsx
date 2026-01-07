'use client';

import { useState, useMemo } from 'react';
import { useContactsQuery } from '@/hooks/queries/useContactsQuery';
import { Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContactForm } from '@/components/contacts/ContactForm';
import { getContactDisplayName } from '@/lib/utils';
import { Search, Plus, User, Loader2 } from 'lucide-react';

interface ContactSelectionProps {
  onContactSelect: (contact: Contact) => void;
}

export function ContactSelection({ onContactSelect }: ContactSelectionProps) {
  const { data: contacts = [], isLoading } = useContactsQuery();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.phone?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [contacts, searchQuery]);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContactId(contact.id);
  };

  const handleConfirmSelection = () => {
    const contact = contacts.find(c => c.id === selectedContactId);
    if (contact) {
      onContactSelect(contact);
    }
  };

  const handleNewContactCreated = (contactId: string) => {
    setShowNewContactForm(false);
    // Find the new contact in the list (it should be there now if React Query has updated, 
    // but the mutation handles invalidation)
    const newContact = contacts.find(c => c.id === contactId);
    if (newContact) {
      onContactSelect(newContact);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">
          Select a Contact
        </h2>
        <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium">
          Choose an existing contact or create a new one for this travel quote.
        </p>
      </div>

      {/* Search and Create */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-clio-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowNewContactForm(true)}
          className="flex items-center space-x-2 border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-xs h-12 px-6"
        >
          <Plus className="w-4 h-4" />
          <span>New Contact</span>
        </Button>
      </div>

      {/* Contact List */}
      {isLoading ? (
        <div className="text-center py-16 bg-clio-gray-50 dark:bg-clio-gray-800/20 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-clio-blue mb-4" />
          <p className="text-clio-gray-500 font-bold uppercase tracking-widest text-xs">Loading contacts...</p>
        </div>
      ) : filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                selectedContactId === contact.id
                  ? 'border-clio-blue bg-clio-blue/5 shadow-sm ring-4 ring-clio-blue/5'
                  : 'border-clio-gray-100 dark:border-clio-gray-800 bg-white dark:bg-clio-gray-900/50 hover:border-clio-gray-200 dark:hover:border-clio-gray-700'
              }`}
              onClick={() => handleContactSelect(contact)}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black transition-colors ${
                  selectedContactId === contact.id ? 'bg-clio-blue text-white' : 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-400'
                }`}>
                  {contact.firstName[0]}{contact.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-black text-clio-gray-900 dark:text-white tracking-tight truncate">
                    {getContactDisplayName(contact.firstName, contact.lastName)}
                  </div>
                  <div className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400 truncate">{contact.email}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-clio-blue bg-clio-blue/10 px-2 py-0.5 rounded-full">
                      {contact.quotes.length} {contact.quotes.length === 1 ? 'quote' : 'quotes'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-clio-gray-50 dark:bg-clio-gray-800/20 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
          <User className="w-12 h-12 text-clio-gray-200 dark:text-clio-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-clio-gray-900 dark:text-white mb-2">No contacts found</h3>
          <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium">
            {searchQuery
              ? 'No contacts found matching your search.'
              : 'No contacts available. Create your first contact to get started.'}
          </p>
        </div>
      )}

      {/* Confirm Selection */}
      {selectedContactId && (
        <div className="flex justify-center pt-4">
          <Button onClick={handleConfirmSelection} className="bg-clio-blue hover:bg-clio-blue-hover text-white font-black uppercase tracking-tight text-sm h-14 px-10 shadow-lg shadow-clio-blue/20">
            Continue with Selected Contact
          </Button>
        </div>
      )}

      {/* Help text */}
      {filteredContacts.length > 0 && !selectedContactId && (
        <div className="text-center text-clio-gray-400 font-bold uppercase tracking-widest text-[10px]">
          Select a contact above to continue
        </div>
      )}

      {/* New Contact Form Modal */}
      {showNewContactForm && (
        <ContactForm
          onClose={() => setShowNewContactForm(false)}
          onSuccess={handleNewContactCreated}
        />
      )}
    </div>
  );
}
'use client';

import { useState, useMemo } from 'react';
import { useContactsQuery } from '@/hooks/queries/useContactsQuery';
import { useContactMutations } from '@/hooks/mutations/useContactMutations';
import { Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContactForm } from './ContactForm';
import { ContactCard } from './ContactCard';
import { Plus, Search, Users, TrendingUp } from 'lucide-react';

export function ContactList() {
  const { data: contacts = [] } = useContactsQuery();
  const { deleteContact } = useContactMutations();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDelete = (contactId: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteContact.mutate(contactId);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-clio-gray-500 uppercase tracking-wider mb-1">Total Contacts</p>
              <p className="text-3xl font-bold text-clio-gray-900 dark:text-white">{contacts.length}</p>
            </div>
            <div className="w-12 h-12 bg-clio-blue/10 rounded-lg flex items-center justify-center border border-clio-blue/20">
              <Users className="w-6 h-6 text-clio-blue" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-clio-gray-500 uppercase tracking-wider mb-1">Active Quotes</p>
              <p className="text-3xl font-bold text-clio-gray-900 dark:text-white">
                {contacts.reduce((sum, contact) => sum + contact.quotes.length, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-clio-gray-500 uppercase tracking-wider mb-1">This Month</p>
              <p className="text-3xl font-bold text-clio-gray-900 dark:text-white">
                {contacts.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-clio-blue/10 rounded-lg flex items-center justify-center border border-clio-blue/20">
              <Plus className="w-6 h-6 text-clio-blue" />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Contacts</h2>
          <p className="text-gray-600">Manage your travel clients and build lasting relationships</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 shadow-soft hover-lift"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Contact</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-0 bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm"></div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-clio-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search contacts by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 h-14 bg-transparent border-transparent rounded-xl text-lg placeholder:text-clio-gray-400 focus:ring-2 focus:ring-clio-blue/20 focus:border-transparent dark:text-white"
          />
        </div>
      </div>

      {/* Contact Grid */}
      {filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-12 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 bg-clio-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-clio-blue" />
            </div>
            <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms or add a new contact.' 
                : 'Start building your client base by adding your first contact.'
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-clio-blue hover:bg-clio-blue-hover text-white shadow-sm"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add your first contact
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showForm && (
        <ContactForm
          contact={editingContact}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
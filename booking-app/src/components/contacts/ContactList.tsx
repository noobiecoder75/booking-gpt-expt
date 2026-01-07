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
    <div className="space-y-10">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800 p-8 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">Total Audience</p>
              <p className="text-4xl font-black text-clio-gray-900 dark:text-white tracking-tighter">{contacts.length}</p>
            </div>
            <div className="w-14 h-14 bg-clio-blue/5 dark:bg-clio-blue/10 rounded-2xl flex items-center justify-center border border-clio-blue/10 group-hover:bg-clio-blue group-hover:text-white transition-all">
              <Users className="w-7 h-7 text-clio-blue group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800 p-8 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">Live Engagements</p>
              <p className="text-4xl font-black text-clio-gray-900 dark:text-white tracking-tighter">
                {contacts.reduce((sum, contact) => sum + contact.quotes.length, 0)}
              </p>
            </div>
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <TrendingUp className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800 p-8 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">Growth Velocity</p>
              <p className="text-4xl font-black text-clio-gray-900 dark:text-white tracking-tighter">
                {contacts.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length}
              </p>
            </div>
            <div className="w-14 h-14 bg-clio-blue/5 dark:bg-clio-blue/10 rounded-2xl flex items-center justify-center border border-clio-blue/10 group-hover:bg-clio-blue group-hover:text-white transition-all">
              <Plus className="w-7 h-7 text-clio-blue group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Header and Search */}
      <div className="bg-white dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800 p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tight">Customer Network</h2>
            <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest mt-1">Direct management of your travel portfolio</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-clio-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Find contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-clio-gray-50 dark:bg-clio-gray-950 border-clio-gray-100 dark:border-clio-gray-800 rounded-xl text-lg font-bold placeholder:text-clio-gray-400 focus:ring-clio-blue/20"
              />
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest h-14 px-8 rounded-xl shadow-lg shadow-clio-blue/20"
            >
              <Plus className="w-5 h-5 mr-3" />
              Add Contact
            </Button>
          </div>
        </div>
      </div>

      {/* Contact Grid */}
      {filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
        <div className="text-center py-24 bg-clio-gray-50 dark:bg-clio-gray-900/50 rounded-2xl border-2 border-dashed border-clio-gray-200 dark:border-clio-gray-800">
          <div className="w-20 h-20 bg-white dark:bg-clio-gray-800 rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
            <Users className="w-10 h-10 text-clio-gray-300 dark:text-clio-gray-600" />
          </div>
          <h3 className="text-2xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tight mb-2">
            {searchQuery ? 'Zero results found' : 'Network is empty'}
          </h3>
          <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest max-w-sm mx-auto mb-10">
            {searchQuery 
              ? 'We couldn\'t find any contact matching your search criteria.' 
              : 'Start scaling your business by indexing your first client in the system.'
            }
          </p>
          {!searchQuery && (
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest h-14 px-10 rounded-xl shadow-lg shadow-clio-blue/20"
            >
              <Plus className="w-5 h-5 mr-3" />
              Initialize First Contact
            </Button>
          )}
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
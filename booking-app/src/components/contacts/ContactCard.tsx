'use client';

import { Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { getContactDisplayName, formatDate } from '@/lib/utils';
import { Mail, Phone, Edit, Trash2, Calendar } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const displayName = getContactDisplayName(contact.firstName, contact.lastName);
  const quotesCount = contact.quotes.length;

  return (
    <div className="bg-white dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-clio-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white group-hover:text-clio-blue transition-colors">
                {displayName}
              </h3>
              <p className="text-sm text-clio-gray-500 dark:text-clio-gray-400">
                Member since {formatDate(contact.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(contact)}
            className="hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(contact.id)}
            className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3 text-sm">
          <div className="w-8 h-8 bg-clio-gray-50 dark:bg-clio-gray-800 rounded flex items-center justify-center border border-clio-gray-100 dark:border-clio-gray-700">
            <Mail className="w-4 h-4 text-clio-gray-500 dark:text-clio-gray-400" />
          </div>
          <span className="text-clio-gray-700 dark:text-clio-gray-300 truncate font-medium">{contact.email}</span>
        </div>
        {contact.phone && (
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-8 h-8 bg-clio-gray-50 dark:bg-clio-gray-800 rounded flex items-center justify-center border border-clio-gray-100 dark:border-clio-gray-700">
              <Phone className="w-4 h-4 text-clio-gray-500 dark:text-clio-gray-400" />
            </div>
            <span className="text-clio-gray-700 dark:text-clio-gray-300 font-medium">{contact.phone}</span>
          </div>
        )}
      </div>

      {/* Stats & Action */}
      <div className="flex items-center justify-between pt-4 border-t border-clio-gray-100 dark:border-clio-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-clio-blue/10 rounded flex items-center justify-center border border-clio-blue/20">
            <Calendar className="w-4 h-4 text-clio-blue" />
          </div>
          <div>
            <div className="text-lg font-bold text-clio-gray-900 dark:text-white leading-none">{quotesCount}</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-clio-gray-400 mt-1">
              {quotesCount === 1 ? 'Quote' : 'Quotes'}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            console.log('View quotes for:', contact.id);
          }}
          className="bg-white dark:bg-clio-gray-800 border-clio-gray-200 dark:border-clio-gray-700 hover:border-clio-blue hover:text-clio-blue dark:hover:text-clio-blue transition-all"
        >
          View Quotes
        </Button>
      </div>
    </div>
  );
}
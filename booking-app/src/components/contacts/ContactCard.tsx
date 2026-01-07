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
    <div className="bg-white dark:bg-clio-gray-950 border border-clio-gray-100 dark:border-clio-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 group relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-clio-blue rounded-xl flex items-center justify-center shadow-lg shadow-clio-blue/20">
              <span className="text-white font-black text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white group-hover:text-clio-blue transition-colors uppercase tracking-tight">
                {displayName}
              </h3>
              <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest mt-1">
                Indexed {formatDate(contact.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <button
            onClick={() => onEdit(contact)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-clio-gray-50 dark:bg-clio-gray-900 text-clio-gray-400 hover:text-clio-blue hover:bg-clio-blue/5 transition-all"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-clio-gray-50 dark:bg-clio-gray-900 text-clio-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-4 group/item">
          <div className="w-10 h-10 bg-clio-gray-50 dark:bg-clio-gray-900 rounded-xl flex items-center justify-center border border-clio-gray-100 dark:border-clio-gray-800 transition-colors group-hover/item:border-clio-blue/30">
            <Mail className="w-4 h-4 text-clio-gray-400 group-hover/item:text-clio-blue" />
          </div>
          <span className="text-sm font-bold text-clio-gray-600 dark:text-clio-gray-300 truncate tracking-tight">{contact.email}</span>
        </div>
        {contact.phone && (
          <div className="flex items-center gap-4 group/item">
            <div className="w-10 h-10 bg-clio-gray-50 dark:bg-clio-gray-900 rounded-xl flex items-center justify-center border border-clio-gray-100 dark:border-clio-gray-800 transition-colors group-hover/item:border-clio-blue/30">
              <Phone className="w-4 h-4 text-clio-gray-400 group-hover/item:text-clio-blue" />
            </div>
            <span className="text-sm font-bold text-clio-gray-600 dark:text-clio-gray-300 tracking-tight">{contact.phone}</span>
          </div>
        )}
      </div>

      {/* Stats & Action */}
      <div className="flex items-center justify-between pt-6 border-t border-clio-gray-100 dark:border-clio-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-clio-blue/5 dark:bg-clio-blue/10 rounded-xl flex items-center justify-center border border-clio-blue/10">
            <Calendar className="w-5 h-5 text-clio-blue" />
          </div>
          <div>
            <div className="text-xl font-black text-clio-gray-900 dark:text-white leading-none tracking-tighter">{quotesCount}</div>
            <div className="text-[10px] uppercase tracking-widest font-black text-clio-gray-400 mt-1">
              {quotesCount === 1 ? 'Record' : 'Records'}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            console.log('View quotes for:', contact.id);
          }}
          className="h-10 px-5 bg-white dark:bg-clio-gray-900 text-clio-blue border-clio-blue/30 font-black uppercase tracking-widest text-[10px] hover:bg-clio-blue hover:text-white hover:border-clio-blue transition-all"
        >
          View Profile
        </Button>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useContactsQuery } from '@/hooks/queries/useContactsQuery';
import { TravelQuote } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Filter } from 'lucide-react';
import { getContactDisplayName, cn } from '@/lib/utils';

interface TimelineFiltersProps {
  selectedContactId: string | null;
  selectedStatuses: TravelQuote['status'][];
  onContactChange: (contactId: string | null) => void;
  onStatusChange: (statuses: TravelQuote['status'][]) => void;
  onClearFilters: () => void;
  itemCount?: number;
}

const QUOTE_STATUSES: Array<{ value: TravelQuote['status']; label: string; color: string }> = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
];

export function TimelineFilters({
  selectedContactId,
  selectedStatuses,
  onContactChange,
  onStatusChange,
  onClearFilters,
  itemCount,
}: TimelineFiltersProps) {
  const { data: contacts = [] } = useContactsQuery();
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const hasActiveFilters = selectedContactId !== null || selectedStatuses.length < 4;

  const handleStatusToggle = (status: TravelQuote['status']) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const handleSelectAllStatuses = () => {
    if (selectedStatuses.length === 4) {
      onStatusChange([]);
    } else {
      onStatusChange(['draft', 'sent', 'accepted', 'rejected']);
    }
  };

  return (
    <div className="bg-white dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-md mb-8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/50 dark:bg-clio-gray-800/20">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-clio-blue/10 rounded-lg">
            <Filter className="w-5 h-5 text-clio-blue" />
          </div>
          <h3 className="text-xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tight">Timeline Filters</h3>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <span className="px-3 py-1 bg-clio-blue text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm shadow-clio-blue/20">
                {[selectedContactId ? 1 : 0, 4 - selectedStatuses.length].filter(n => n > 0).reduce((a, b) => a + b, 0)} active
              </span>
            )}
            {itemCount !== undefined && (
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} showing
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs font-bold uppercase tracking-tight text-clio-gray-500 hover:text-red-500 h-9"
            >
              Reset All
            </Button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-clio-gray-800 border border-clio-gray-100 dark:border-clio-gray-700 text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white transition-all shadow-sm"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Client Filter */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-clio-gray-500">Client Account</Label>
                {selectedContactId && (
                  <button onClick={() => onContactChange(null)} className="text-[10px] font-bold text-clio-blue hover:underline uppercase tracking-tight">Clear selection</button>
                )}
              </div>
              <Select
                value={selectedContactId || 'all'}
                onValueChange={(value) => onContactChange(value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-full h-12 bg-clio-gray-50 dark:bg-clio-gray-950 font-bold border-clio-gray-200 dark:border-clio-gray-800">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800">
                  <SelectItem value="all">
                    <span className="font-bold">All Clients</span>
                  </SelectItem>
                  {contacts
                    .sort((a, b) =>
                      getContactDisplayName(a.firstName, a.lastName)
                        .localeCompare(getContactDisplayName(b.firstName, b.lastName))
                    )
                    .map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        <div className="flex flex-col py-1">
                          <span className="font-bold text-clio-gray-900 dark:text-white">
                            {getContactDisplayName(contact.firstName, contact.lastName)}
                          </span>
                          <span className="text-[10px] font-medium text-clio-gray-400">{contact.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-clio-gray-500">Filter by Status</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllStatuses}
                  className="text-[10px] font-black uppercase tracking-widest text-clio-blue hover:bg-clio-blue/10 h-7 px-3 rounded-full"
                >
                  {selectedStatuses.length === 4 ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {QUOTE_STATUSES.map((status) => (
                  <div
                    key={status.value}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-xl cursor-pointer border transition-all duration-200",
                      selectedStatuses.includes(status.value)
                        ? "bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 shadow-sm"
                        : "bg-clio-gray-50 dark:bg-clio-gray-900/50 border-transparent opacity-60 hover:opacity-100"
                    )}
                    onClick={() => handleStatusToggle(status.value)}
                  >
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                      className="border-clio-gray-300 dark:border-clio-gray-700 data-[state=checked]:bg-clio-blue"
                    />
                    <Label
                      htmlFor={`status-${status.value}`}
                      className="flex-1 cursor-pointer font-bold uppercase tracking-widest text-[10px]"
                    >
                      <span className={cn(
                        "px-2 py-1 rounded-lg",
                        status.value === 'draft' && "bg-clio-gray-100 text-clio-gray-600 dark:bg-clio-gray-800 dark:text-clio-gray-400",
                        status.value === 'sent' && "bg-clio-blue/10 text-clio-blue",
                        status.value === 'accepted' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
                        status.value === 'rejected' && "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                      )}>
                        {status.label}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

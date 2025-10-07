'use client';

import { TravelQuote, Contact } from '@/types';
import { useContactByIdQuery } from '@/hooks/queries/useContactsQuery';
import { useQuoteMutations } from '@/hooks/mutations/useQuoteMutations';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getContactDisplayName } from '@/lib/utils';
import { generatePreviewLink } from '@/lib/client-links';
import { 
  Calendar, 
  User, 
  DollarSign, 
  FileText,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Plane,
  Hotel,
  MapPin,
  Car,
  Send,
  ExternalLink,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import moment from 'moment';
import Link from 'next/link';

interface QuoteCardProps {
  quote: TravelQuote;
  onDelete?: (quoteId: string) => void;
  onDuplicate?: (quoteId: string) => void;
  onStatusChange?: (quoteId: string, status: TravelQuote['status']) => void;
}

export function QuoteCard({ quote, onDelete, onDuplicate, onStatusChange }: QuoteCardProps) {
  const { data: contact } = useContactByIdQuery(quote.contactId);
  const { updateQuoteStatus, deleteQuote: deleteQuoteMutation } = useQuoteMutations();
  
  const getStatusColor = (status: TravelQuote['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
      case 'sent': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30';
      case 'accepted': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-3 h-3" />;
      case 'hotel': return <Hotel className="w-3 h-3" />;
      case 'activity': return <MapPin className="w-3 h-3" />;
      case 'transfer': return <Car className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const itemTypeCounts = quote.items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleStatusChange = (newStatus: TravelQuote['status']) => {
    updateQuoteStatus.mutate({ id: quote.id, status: newStatus });
    onStatusChange?.(quote.id, newStatus);
  };

  const handleDuplicate = () => {
    // TODO: Implement duplicate quote mutation
    console.log('Duplicate quote:', quote.id);
    onDuplicate?.(quote.id);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      deleteQuoteMutation.mutate(quote.id);
      onDelete?.(quote.id);
    }
  };

  const handleSendToClient = async () => {
    // TODO: Implement send quote mutation
    console.log('Send quote to client:', quote.id);
    updateQuoteStatus.mutate({ id: quote.id, status: 'sent' });
  };

  const handlePreview = () => {
    const previewLink = generatePreviewLink(quote);
    window.open(previewLink, '_blank');
  };

  const handleCopyLink = async () => {
    const previewLink = generatePreviewLink(quote);
    try {
      await navigator.clipboard.writeText(previewLink);
      console.log('Client link copied to clipboard:', previewLink);
      // TODO: Add toast notification
      alert('Client link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link');
    }
  };

  return (
    <ModernCard variant="elevated" className="p-6 hover-lift group transition-smooth">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {quote.title}
              </h3>
              {contact && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mr-2">
                    <User className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="truncate font-medium">
                    {getContactDisplayName(contact.firstName, contact.lastName)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={`${getStatusColor(quote.status)} rounded-full px-3 py-1 text-xs font-medium`}>
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ModernButton variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </ModernButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/quote-wizard?edit=${quote.id}`} className="flex items-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Quote
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSendToClient}>
                <Send className="w-4 h-4 mr-2" />
                Send to Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview Client View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Copy Client Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Travel Dates */}
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {moment(quote.travelDates.start).format('MMM D')} - {moment(quote.travelDates.end).format('MMM D, YYYY')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {moment(quote.travelDates.end).diff(moment(quote.travelDates.start), 'days')} days
          </div>
        </div>
      </div>

      {/* Items Summary */}
      {quote.items.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {Object.entries(itemTypeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 text-xs">
              <div className="mr-2">
                {getItemIcon(type)}
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{count} {type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mr-3">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(quote.totalCost)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Cost
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={quote.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-auto h-9 text-sm rounded-lg border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Created {moment(quote.createdAt).format('MMM D, YYYY')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
        </div>
      </div>
    </ModernCard>
  );
}
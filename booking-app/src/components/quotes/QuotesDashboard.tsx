'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuotesQuery } from '@/hooks/queries/useQuotesQuery';
import { TravelQuote } from '@/types';
import { QuoteCard } from './QuoteCard';
import { QuoteFilters, QuoteFilterOptions } from './QuoteFilters';
import { QuoteStats } from './QuoteStats';
import { Button } from '@/components/ui/button';
import { Plus, FileText, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import moment from 'moment';

export function QuotesDashboard() {
  const { data: quotes = [], isLoading, error } = useQuotesQuery();
  const [filters, setFilters] = useState<QuoteFilterOptions>({
    searchQuery: '',
    status: 'all',
    dateRange: 'all',
    sortBy: 'created-desc',
  });
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Filter and sort quotes
  const filteredQuotes = useMemo(() => {
    if (!isHydrated) return [];

    let result = [...quotes];

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(quote =>
        quote.title.toLowerCase().includes(query) ||
        quote.id.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(quote => quote.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = moment();
      let startDate: moment.Moment;
      
      switch (filters.dateRange) {
        case 'last-week':
          startDate = now.clone().subtract(1, 'week');
          break;
        case 'last-month':
          startDate = now.clone().subtract(1, 'month');
          break;
        case 'last-3-months':
          startDate = now.clone().subtract(3, 'months');
          break;
        default:
          startDate = moment(0); // Beginning of time
      }
      
      result = result.filter(quote => 
        moment(quote.createdAt).isAfter(startDate)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'created-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'created-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'amount-asc':
          return a.totalCost - b.totalCost;
        case 'amount-desc':
          return b.totalCost - a.totalCost;
        case 'travel-date-asc':
          return new Date(a.travelDates.start).getTime() - new Date(b.travelDates.start).getTime();
        case 'travel-date-desc':
          return new Date(b.travelDates.start).getTime() - new Date(a.travelDates.start).getTime();
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [quotes, filters, isHydrated]);

  const handleFilterChange = (newFilters: QuoteFilterOptions) => {
    setFilters(newFilters);
  };

  const handleQuoteAction = (action: string, quoteId: string) => {
    // Handle quote actions like delete, duplicate, etc.
    console.log(`${action} quote:`, quoteId);
  };

  if (!isHydrated) {
    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-8 text-center shadow-sm">
          <div className="animate-pulse">
            <div className="h-6 bg-clio-gray-100 dark:bg-clio-gray-800 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-8 bg-clio-gray-100 dark:bg-clio-gray-800 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate dashboard stats
  const totalQuoteValue = quotes.reduce((sum, quote) => sum + quote.totalCost, 0);
  const activeQuotes = quotes.filter(q => q.status !== 'rejected').length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  const conversionRate = quotes.length > 0 ? (acceptedQuotes / quotes.length) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-clio-gray-500 uppercase tracking-wider mb-1">Total Quotes</p>
              <p className="text-3xl font-bold text-clio-gray-900 dark:text-white">{quotes.length}</p>
            </div>
            <div className="w-12 h-12 bg-clio-blue/10 rounded-lg flex items-center justify-center border border-clio-blue/20">
              <FileText className="w-6 h-6 text-clio-blue" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-clio-gray-500 uppercase tracking-wider mb-1">Total Value</p>
              <p className="text-3xl font-bold text-clio-gray-900 dark:text-white">${totalQuoteValue.toLocaleString()}</p>
              <p className="text-[10px] text-clio-gray-400 mt-1 uppercase font-bold tracking-tight">All quotes combined</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-clio-gray-500 uppercase tracking-wider mb-1">Active Quotes</p>
              <p className="text-3xl font-bold text-clio-gray-900 dark:text-white">{activeQuotes}</p>
            </div>
            <div className="w-12 h-12 bg-clio-navy/10 rounded-lg flex items-center justify-center border border-clio-navy/20">
              <TrendingUp className="w-6 h-6 text-clio-navy dark:text-clio-gray-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-clio-gray-500 uppercase tracking-wider mb-1">Conversion</p>
              <p className="text-3xl font-bold text-clio-gray-900 dark:text-white">{conversionRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center border border-amber-100 dark:border-amber-800">
              <BarChart3 className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-clio-gray-900 dark:text-white mb-2">All Quotes</h2>
          <p className="text-clio-gray-600 dark:text-clio-gray-400">Manage and track your travel quotes with advanced filtering</p>
        </div>
        <Link href="/dashboard/quote-wizard">
          <Button size="lg" className="bg-clio-blue hover:bg-clio-blue-hover text-white shadow-sm transition-all active:scale-[0.98]">
            <Plus className="w-5 h-5 mr-2" />
            Create New Quote
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <QuoteStats />

      {/* Filters */}
      <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-6 shadow-sm">
        <QuoteFilters
          onFilterChange={handleFilterChange}
          totalCount={quotes.length}
          filteredCount={filteredQuotes.length}
        />
      </div>

      {/* Quotes Grid */}
      {filteredQuotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredQuotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onDelete={(id) => handleQuoteAction('delete', id)}
              onDuplicate={(id) => handleQuoteAction('duplicate', id)}
              onStatusChange={(id, status) => handleQuoteAction('status-change', id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-12 max-w-lg mx-auto shadow-sm">
            {error ? (
              // Error state
              <div>
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-2">
                  Failed to load quotes
                </h3>
                <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-6 max-w-md mx-auto">
                  There was an error loading your quotes. Please try refreshing the page or contact support if the problem persists.
                </p>
                <Button
                  size="lg"
                  className="bg-clio-blue hover:bg-clio-blue-hover text-white shadow-sm"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            ) : quotes.length === 0 ? (
              // No quotes at all
              <div>
                <div className="w-16 h-16 bg-clio-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-clio-blue" />
                </div>
                <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-2">
                  No quotes yet
                </h3>
                <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-6 max-w-md mx-auto">
                  Start creating travel quotes for your clients. Use the quote wizard to build detailed itineraries with flights, hotels, and activities.
                </p>
                <Link href="/dashboard/quote-wizard">
                  <Button size="lg" className="bg-clio-blue hover:bg-clio-blue-hover text-white shadow-sm">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Quote
                  </Button>
                </Link>
              </div>
            ) : (
              // No quotes match current filters
              <div>
                <div className="w-16 h-16 bg-clio-gray-50 dark:bg-clio-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-clio-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-2">
                  No quotes match your filters
                </h3>
                <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-6">
                  Try adjusting your search criteria or clearing the active filters to see more quotes.
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-clio-gray-200 dark:border-clio-gray-700 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800 shadow-sm"
                  onClick={() => setFilters({
                    searchQuery: '',
                    status: 'all',
                    dateRange: 'all',
                    sortBy: 'created-desc',
                  })}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Load More Button (for future pagination) */}
      {filteredQuotes.length > 0 && filteredQuotes.length >= 12 && (
        <div className="text-center">
          <Button variant="outline" disabled>
            Load More Quotes
          </Button>
        </div>
      )}
    </div>
  );
}
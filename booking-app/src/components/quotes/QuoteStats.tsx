'use client';

import { useMemo } from 'react';
import { useQuotesQuery } from '@/hooks/queries/useQuotesQuery';
import { useInvoicesQuery } from '@/hooks/queries/useInvoicesQuery';
import { formatCurrency } from '@/lib/utils';
import { FileText, Send, CheckCircle, XCircle, DollarSign, TrendingUp, Briefcase } from 'lucide-react';

export function QuoteStats() {
  const { data: quotes = [] } = useQuotesQuery();
  const { data: invoices = [] } = useInvoicesQuery();

  const stats = useMemo(() => {
    const totalQuotes = quotes.length;
    const draftQuotes = quotes.filter(q => q.status === 'draft').length;
    const sentQuotes = quotes.filter(q => q.status === 'sent').length;
    const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
    const rejectedQuotes = quotes.filter(q => q.status === 'rejected').length;
    const totalRevenue = quotes
      .filter(q => q.status === 'accepted')
      .reduce((sum, q) => sum + q.totalCost, 0);
    const averageQuoteValue = totalQuotes > 0
      ? quotes.reduce((sum, q) => sum + q.totalCost, 0) / totalQuotes
      : 0;

    return {
      totalQuotes,
      draftQuotes,
      sentQuotes,
      acceptedQuotes,
      rejectedQuotes,
      totalRevenue,
      averageQuoteValue,
    };
  }, [quotes]);

  // Get actual revenue from paid invoices instead of accepted quotes
  const actualRevenue = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [invoices]);

  // Quote status cards (row 1)
  const quoteStatusCards = [
    {
      title: 'Total Quotes',
      value: stats.totalQuotes.toLocaleString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'All quotes created',
    },
    {
      title: 'Sent Quotes',
      value: stats.sentQuotes.toLocaleString(),
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Awaiting response',
    },
    {
      title: 'Accepted Quotes',
      value: stats.acceptedQuotes.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Confirmed bookings',
    },
    {
      title: 'Rejected Quotes',
      value: stats.rejectedQuotes.toLocaleString(),
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Declined proposals',
    },
  ];

  // Financial metrics cards (row 2)
  const financialCards = [
    {
      title: 'Actual Revenue',
      value: formatCurrency(actualRevenue),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-green-600',
      description: 'From paid invoices',
      isFinancial: true,
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(stats.totalRevenue),
      icon: Briefcase,
      gradient: 'from-purple-500 to-indigo-600',
      description: 'From accepted quotes',
      isFinancial: true,
    },
    {
      title: 'Average Quote Value',
      value: formatCurrency(stats.averageQuoteValue),
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-600',
      description: 'Across all quotes',
      isFinancial: true,
    },
    {
      title: 'Draft Quotes',
      value: stats.draftQuotes.toLocaleString(),
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-clio-gray-50 dark:bg-clio-gray-900',
      borderColor: 'border-gray-200',
      description: 'Work in progress',
    },
  ];

  // Calculate conversion rate
  const conversionRate = stats.totalQuotes > 0 
    ? ((stats.acceptedQuotes / (stats.sentQuotes + stats.acceptedQuotes + stats.rejectedQuotes)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Quote Status Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quoteStatusCards.map((stat) => (
          <div
            key={stat.title}
            className={`bg-white dark:bg-clio-gray-900 rounded-xl p-6 border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${stat.bgColor.replace('bg-', 'bg-').replace('50', '100').replace('blue-100', 'clio-blue/10')}`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('text-blue-600', 'text-clio-blue')}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-clio-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm font-bold text-clio-gray-500 uppercase tracking-wider mt-1">{stat.title}</p>
              <p className="text-xs text-clio-gray-400 mt-1 uppercase font-bold tracking-tight">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Metrics Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialCards.map((stat) => (
          <div
            key={stat.title}
            className={`${
              stat.isFinancial
                ? `bg-clio-navy dark:bg-clio-blue text-white`
                : `bg-white dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800`
            } rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${
                stat.isFinancial ? 'bg-clio-blue/20' : 'bg-clio-gray-50 dark:bg-clio-gray-800'
              }`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.isFinancial ? 'text-white' : 'text-clio-gray-600 dark:text-clio-gray-300'
                }`} />
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-3xl font-bold ${
                stat.isFinancial ? 'text-white' : 'text-clio-gray-900 dark:text-white'
              }`}>{stat.value}</p>
              <p className={`text-sm font-bold uppercase tracking-wider mt-1 ${
                stat.isFinancial ? 'text-white/90' : 'text-clio-gray-500'
              }`}>{stat.title}</p>
              <p className={`text-xs uppercase font-bold tracking-tight mt-1 ${
                stat.isFinancial ? 'text-white/60' : 'text-clio-gray-400'
              }`}>{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Insights */}
      {stats.totalQuotes > 0 && (
        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-clio-gray-900 dark:text-white mb-4">Quick Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Conversion Rate */}
            <div className="bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-lg p-4 border border-clio-gray-100 dark:border-clio-gray-800">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-clio-blue" />
                <span className="font-bold text-clio-gray-900 dark:text-white">Conversion Rate</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-clio-blue">
                  {conversionRate.toFixed(1)}%
                </span>
                <p className="text-xs font-bold text-clio-gray-500 uppercase tracking-tight mt-1">
                  {stats.acceptedQuotes} of {stats.sentQuotes + stats.acceptedQuotes + stats.rejectedQuotes} sent quotes
                </p>
              </div>
            </div>

            {/* Pipeline Status */}
            <div className="bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-lg p-4 border border-clio-gray-100 dark:border-clio-gray-800">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-clio-gray-900 dark:text-white">Pipeline</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-amber-600">
                  {stats.draftQuotes + stats.sentQuotes}
                </span>
                <p className="text-xs font-bold text-clio-gray-500 uppercase tracking-tight mt-1">
                  Active quotes in pipeline
                </p>
              </div>
            </div>

            {/* Success Ratio */}
            <div className="bg-clio-gray-50 dark:bg-clio-gray-800/50 rounded-lg p-4 border border-clio-gray-100 dark:border-clio-gray-800">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-clio-gray-900 dark:text-white">Success Rate</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {stats.totalQuotes > 0 ? ((stats.acceptedQuotes / stats.totalQuotes) * 100).toFixed(1) : 0}%
                </span>
                <p className="text-xs font-bold text-clio-gray-500 uppercase tracking-tight mt-1">
                  Overall acceptance rate
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalQuotes === 0 && (
        <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-12 text-center shadow-sm">
          <FileText className="w-12 h-12 text-clio-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-2">No quotes yet</h3>
          <p className="text-clio-gray-600 dark:text-clio-gray-400 max-w-sm mx-auto">
            Create your first quote to start tracking your business metrics and insights.
          </p>
        </div>
      )}
    </div>
  );
}
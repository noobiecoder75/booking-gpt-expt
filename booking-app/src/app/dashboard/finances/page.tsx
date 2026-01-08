'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoicesQuery } from '@/hooks/queries/useInvoicesQuery';
import { useInvoiceMutations } from '@/hooks/mutations/useInvoiceMutations';
import { useCommissionsQuery } from '@/hooks/queries/useCommissionsQuery';
import { useCommissionMutations } from '@/hooks/mutations/useCommissionMutations';
import { useExpensesQuery } from '@/hooks/queries/useExpensesQuery';
import { useQuotesQuery } from '@/hooks/queries/useQuotesQuery';
import { useQuoteMutations } from '@/hooks/mutations/useQuoteMutations';
import { useContactsQuery } from '@/hooks/queries/useContactsQuery';
import { useBookingMutations } from '@/hooks/mutations/useBookingMutations';
import { useAuth } from '@/components/auth/AuthProvider';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatItemDetails } from '@/lib/travel-item-formatter';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  CreditCard,
  PieChart,
  Calendar,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

export default function FinancesPage() {
  const { user } = useAuth();
  const { data: invoices = [] } = useInvoicesQuery();
  const { markInvoiceAsPaid, generateInvoiceFromQuote } = useInvoiceMutations();
  const { data: commissions = [] } = useCommissionsQuery();
  const { bulkMarkAsPaid, generateCommissionFromBooking } = useCommissionMutations();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: quotes = [] } = useQuotesQuery();
  const { data: contacts = [] } = useContactsQuery();
  const { createBookingFromQuote } = useBookingMutations();
  const { updateQuoteStatus } = useQuoteMutations();

  const [dateRange, setDateRange] = useState('30'); // days
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewResults, setReviewResults] = useState<{success: number, errors: string[]}>({ success: 0, errors: [] });
  
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const days = parseInt(dateRange);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    setSelectedPeriod({ startDate, endDate });
  }, [dateRange]);

  // Financial calculations
  const totalRevenue = useMemo(() => {
    return invoices
      .filter(invoice => {
        if (invoice.status !== 'paid' && invoice.status !== 'partially_paid') return false;
        // Handle both snake_case and camelCase for dates
        const paidAtStr = invoice.paid_at || invoice.paidAt || invoice.created_at || invoice.createdAt;
        if (!paidAtStr) return false;
        
        const paidAt = new Date(paidAtStr);
        // Extend the end date to include the entire day to handle different timezones (Stripe vs Local)
        const end = new Date(selectedPeriod.endDate);
        end.setHours(23, 59, 59, 999);
        
        return paidAt >= new Date(selectedPeriod.startDate) && paidAt <= end;
      })
      .reduce((sum, invoice) => sum + (invoice.paid_amount || invoice.paidAmount || 0), 0);
  }, [invoices, selectedPeriod]);

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter(invoice => invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'void')
      .reduce((sum, invoice) => sum + (invoice.remaining_amount ?? invoice.remainingAmount ?? invoice.total), 0);
  }, [invoices]);

  const overdueAmount = useMemo(() => {
    const now = new Date();
    return invoices
      .filter(invoice => {
        if (invoice.status === 'paid' || invoice.status === 'cancelled' || invoice.status === 'void') return false;
        const dueDateStr = invoice.due_date || invoice.dueDate;
        if (!dueDateStr) return false;
        return new Date(dueDateStr) < now;
      })
      .reduce((sum, invoice) => sum + (invoice.remaining_amount ?? invoice.remainingAmount ?? invoice.total), 0);
  }, [invoices]);

  // Calculate total expenses from TanStack Query data
  const totalExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(selectedPeriod.startDate) &&
             expenseDate <= new Date(selectedPeriod.endDate);
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalCommissionsEarned = useMemo(() => {
    return commissions
      .filter(commission => {
        const createdAtStr = commission.createdAt || commission.created_at;
        if (!createdAtStr) return false;
        const createdAt = new Date(createdAtStr);
        const end = new Date(selectedPeriod.endDate);
        end.setHours(23, 59, 59, 999);
        return createdAt >= new Date(selectedPeriod.startDate) &&
               createdAt <= end;
      })
      .reduce((sum, commission) => sum + (commission.commissionAmount || commission.commission_amount || 0), 0);
  }, [commissions, selectedPeriod]);

  const totalCommissionsPaid = useMemo(() => {
    return commissions
      .filter(commission => {
        if (commission.status !== 'paid') return false;
        const paidAtStr = commission.paidAt || commission.paid_at || commission.createdAt || commission.created_at;
        if (!paidAtStr) return false;
        const paidAt = new Date(paidAtStr);
        const end = new Date(selectedPeriod.endDate);
        end.setHours(23, 59, 59, 999);
        return paidAt >= new Date(selectedPeriod.startDate) &&
               paidAt <= end;
      })
      .reduce((sum, commission) => sum + (commission.commissionAmount || commission.commission_amount || 0), 0);
  }, [commissions, selectedPeriod]);

  const totalCommissionsPending = useMemo(() => {
    return commissions
      .filter(commission => commission.status === 'pending')
      .reduce((sum, commission) => sum + (commission.commissionAmount || commission.commission_amount || 0), 0);
  }, [commissions]);

  const netProfit = totalRevenue - totalExpenses - totalCommissionsPaid;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Calculate expenses by category from TanStack Query data
  const expensesByCategory = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(selectedPeriod.startDate) &&
             expenseDate <= new Date(selectedPeriod.endDate);
    })
    .reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

  // Get real data for quick actions
  const acceptedQuotes = quotes.filter(quote => quote.status === 'accepted');
  const unpaidCommissions = useMemo(() => {
    return commissions.filter(commission => commission.status === 'pending');
  }, [commissions]);
  const unpaidInvoices = useMemo(() => {
    return invoices.filter(invoice =>
      invoice.status === 'sent' || invoice.status === 'partial'
    );
  }, [invoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Quick action handlers
  const handleCreateInvoice = async () => {
    if (acceptedQuotes.length === 0) {
      alert('No accepted quotes available to generate invoices from.');
      return;
    }
    setIsQueueOpen(true);
  };

  const processQuoteInQueue = async (quote: any) => {
    setProcessingId(quote.id);
    try {
      // Get customer data from contacts
      const customer = contacts.find(c => c.id === quote.contactId);

      if (!customer) {
        throw new Error(`Customer not found for quote ${quote.id}`);
      }

      const customerData = {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        customerAddress: customer.address
      };

      // Validate quote total
      if (!quote.totalCost || typeof quote.totalCost !== 'number' || isNaN(quote.totalCost) || quote.totalCost <= 0) {
        throw new Error(`Invalid quote total: ${quote.totalCost}`);
      }

      // STEP 1: Create booking from quote
      const bookingId = await new Promise<string>((resolve, reject) => {
        createBookingFromQuote.mutate(
          {
            quoteId: quote.id,
            contactId: quote.contactId,
            items: quote.items,
            totalAmount: quote.totalCost,
            status: 'confirmed'
          },
          {
            onSuccess: (id) => resolve(id),
            onError: (error) => reject(error)
          }
        );
      });

      // STEP 2: Generate invoice from quote
      const invoiceId = await new Promise<string>((resolve, reject) => {
        generateInvoiceFromQuote.mutate(
          {
            quoteId: quote.id,
            customerData,
            terms: 'Net 30',
            dueDays: 30
          },
          {
            onSuccess: (id) => resolve(id),
            onError: (error) => reject(error)
          }
        );
      });

      // STEP 3: Generate commission record
      await new Promise<void>((resolve, reject) => {
        generateCommissionFromBooking.mutate(
          {
            agentId: user?.id || 'default-agent',
            agentName: user?.email || 'Travel Agent',
            bookingId: bookingId,
            quoteId: quote.id,
            invoiceId: invoiceId,
            customerId: customer.id,
            customerName: customerData.customerName,
            bookingAmount: quote.totalCost,
            bookingType: 'package',
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error)
          }
        );
      });

      setReviewResults(prev => ({ ...prev, success: prev.success + 1 }));
    } catch (error) {
      console.error('[FinancesPage] Queue error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setReviewResults(prev => ({ ...prev, errors: [...prev.errors, errorMessage] }));
    } finally {
      setProcessingId(null);
    }
  };

  const deleteQuoteFromQueue = async (quoteId: string) => {
    if (window.confirm('Are you sure you want to reject this quote? It will no longer appear in the invoice queue.')) {
      setProcessingId(quoteId);
      try {
        await new Promise<void>((resolve, reject) => {
          updateQuoteStatus.mutate(
            { id: quoteId, status: 'rejected' },
            {
              onSuccess: () => resolve(),
              onError: (error) => reject(error)
            }
          );
        });
      } catch (error) {
        alert('Failed to update quote status');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handlePayCommissions = () => {
    if (unpaidCommissions.length === 0) {
      alert('No pending commissions to pay.');
      return;
    }

    // Mark all unpaid commissions as paid
    const commissionIds = unpaidCommissions.map(c => c.id);
    bulkMarkAsPaid.mutate({
      ids: commissionIds,
      paymentMethod: 'bank_transfer'
    });

    alert(`Successfully paid ${commissionIds.length} commission(s)!`);
  };

  const handleMarkInvoicesAsPaid = () => {
    if (unpaidInvoices.length === 0) {
      alert('No unpaid invoices to mark as paid.');
      return;
    }

    // Mark all unpaid invoices as paid
    unpaidInvoices.forEach(invoice => {
      markInvoiceAsPaid.mutate({
        id: invoice.id,
        paymentMethod: 'bank_transfer',
        transactionId: `TXN-${Date.now()}`
      });
    });

    alert(`Successfully marked ${unpaidInvoices.length} invoice(s) as paid!`);
  };

  if (!user) {
    return <div>Please log in to view finances.</div>;
  }

  return (
    <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tight">Financial Dashboard</h1>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 mt-2 font-medium">
                Comprehensive overview of your business financial health and performance
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-clio-gray-900 font-bold border-clio-gray-200 dark:border-clio-gray-800">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800">
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-xs h-10 px-6">
                <Download className="w-4 h-4 mr-2 text-clio-blue" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Total Revenue</CardTitle>
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalRevenue)}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold text-emerald-600">+12%</span>
                  <span className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">from last period</span>
                </div>
              </CardContent>
            </Card>

            {/* Outstanding Amount */}
            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Outstanding</CardTitle>
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Receipt className="h-3.5 w-3.5 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {formatCurrency(totalOutstanding)}
                </div>
                <div className="mt-1 min-h-[15px]">
                  {overdueAmount > 0 && (
                    <span className="text-[10px] font-black text-red-600 dark:text-red-400 flex items-center uppercase tracking-tight">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {formatCurrency(overdueAmount)} overdue
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Total Expenses</CardTitle>
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <CreditCard className="h-3.5 w-3.5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-black text-red-600 dark:text-red-400">
                  {formatCurrency(totalExpenses)}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold text-red-600">+5%</span>
                  <span className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">from last period</span>
                </div>
              </CardContent>
            </Card>

            {/* Net Profit */}
            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Net Profit</CardTitle>
                <div className={cn("p-1.5 rounded-lg", netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20")}>
                  <TrendingUp className={cn("h-3.5 w-3.5", netProfit >= 0 ? "text-emerald-600" : "text-red-600")} />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className={cn("text-2xl font-black", netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                  {formatCurrency(netProfit)}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-clio-blue/10 text-clio-blue")}>{profitMargin}% margin</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission & Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Commission Summary */}
            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-clio-gray-50/50 dark:bg-clio-gray-800/20 border-b border-clio-gray-100 dark:border-clio-gray-800">
                <CardTitle className="flex items-center text-xs font-black uppercase tracking-widest text-clio-gray-500">
                  <div className="p-1.5 bg-clio-blue/10 rounded-lg mr-3">
                    <DollarSign className="w-4 h-4 text-clio-blue" />
                  </div>
                  Commission Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold uppercase tracking-tight text-clio-gray-500">Earned</span>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-clio-gray-900 dark:text-white">{formatCurrency(totalCommissionsEarned)}</span>
                      <div className="w-full h-1 bg-clio-gray-100 dark:bg-clio-gray-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-clio-blue rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold uppercase tracking-tight text-clio-gray-500">Paid</span>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCommissionsPaid)}</span>
                      <div className="w-full h-1 bg-clio-gray-100 dark:bg-clio-gray-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalCommissionsEarned > 0 ? (totalCommissionsPaid / totalCommissionsEarned) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold uppercase tracking-tight text-clio-gray-500">Pending</span>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-orange-600 dark:text-orange-400">{formatCurrency(totalCommissionsPending)}</span>
                      <div className="w-full h-1 bg-clio-gray-100 dark:bg-clio-gray-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${totalCommissionsEarned > 0 ? (totalCommissionsPending / totalCommissionsEarned) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-clio-gray-50/50 dark:bg-clio-gray-800/20 border-b border-clio-gray-100 dark:border-clio-gray-800">
                <CardTitle className="flex items-center text-xs font-black uppercase tracking-widest text-clio-gray-500">
                  <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg mr-3">
                    <PieChart className="w-4 h-4 text-red-600" />
                  </div>
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {Object.entries(expensesByCategory).length > 0 ? (
                    Object.entries(expensesByCategory).map(([category, amount]) => {
                      if (amount === 0) return null;
                      const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0';
                      return (
                        <div key={category} className="flex justify-between items-center p-3 rounded-xl bg-clio-gray-50 dark:bg-clio-gray-900/50 border border-transparent hover:border-clio-gray-100 dark:hover:border-clio-gray-800 transition-all">
                          <div className="flex items-center">
                            <span className="text-xs font-bold text-clio-gray-700 dark:text-clio-gray-300 capitalize">
                              {category.replace('_', ' ')}
                            </span>
                            <Badge className="ml-3 bg-clio-gray-200 dark:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400 border-none text-[10px] font-black uppercase tracking-widest">
                              {percentage}%
                            </Badge>
                          </div>
                          <span className="font-black text-clio-gray-900 dark:text-white">{formatCurrency(amount)}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">No expenses recorded for this period</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity / Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Dialog open={isQueueOpen} onOpenChange={(open) => {
              setIsQueueOpen(open);
              if (!open) setReviewResults({ success: 0, errors: [] });
            }}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white dark:bg-clio-gray-900 border-none shadow-2xl rounded-2xl p-0">
                <DialogHeader className="p-8 border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/50 dark:bg-clio-gray-900/50">
                  <DialogTitle className="flex items-center text-xl font-black uppercase tracking-tight">
                    <Receipt className="w-6 h-6 mr-3 text-clio-blue" />
                    Invoice Review Queue
                  </DialogTitle>
                  <DialogDescription className="font-medium text-clio-gray-500 mt-1 uppercase tracking-widest text-[10px]">
                    Review and approve invoices for accepted quotes. Rejected items will be removed from this queue.
                  </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-4">
                  {acceptedQuotes.length === 0 ? (
                    <div className="text-center py-16 bg-clio-gray-50 dark:bg-clio-gray-950/50 rounded-2xl border-2 border-dashed border-clio-gray-200 dark:border-clio-gray-800">
                      <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="text-lg font-black text-clio-gray-900 dark:text-white uppercase tracking-tight">All caught up!</p>
                      <p className="text-sm font-medium text-clio-gray-500 uppercase tracking-widest text-[10px] mt-1">No pending quotes need invoicing.</p>
                    </div>
                  ) : (
                    acceptedQuotes.map(quote => {
                      const customer = contacts.find(c => c.id === quote.contactId);
                      const isDuplicate = invoices.some(inv => 
                        inv.quote_id === quote.id || 
                        (inv.customer_id === quote.contactId && 
                         Math.abs(inv.total - quote.totalCost) < 0.01 &&
                         new Date().getTime() - new Date(inv.created_at || inv.createdAt).getTime() < 24 * 60 * 60 * 1000)
                      );

                      return (
                        <div key={quote.id} className={cn(
                          "group p-6 rounded-2xl border transition-all duration-200",
                          isDuplicate ? "border-amber-200 bg-amber-50/30 dark:border-amber-900/20" : "border-clio-gray-100 bg-white dark:bg-clio-gray-950 dark:border-clio-gray-800"
                        )}>
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-black text-clio-gray-900 dark:text-white uppercase tracking-tight truncate text-lg">
                                  {quote.title}
                                </h4>
                                {isDuplicate && (
                                  <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] font-black uppercase tracking-widest px-2 py-1">
                                    <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                                    Potential Duplicate
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center text-[10px] font-black text-clio-gray-400 gap-4 uppercase tracking-widest">
                                <span className="flex items-center bg-clio-gray-50 dark:bg-clio-gray-900 px-2 py-1 rounded-lg border border-clio-gray-100 dark:border-clio-gray-800">
                                  <DollarSign className="w-3 h-3 mr-1.5 text-clio-blue" />
                                  <span className="text-clio-gray-900 dark:text-white">{formatCurrency(quote.totalCost)}</span>
                                </span>
                                <span className="flex items-center">
                                  <Receipt className="w-3 h-3 mr-1.5" />
                                  {customer?.firstName} {customer?.lastName}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1.5" />
                                  {new Date(quote.createdAt || quote.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-12 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 font-black uppercase tracking-widest text-[10px] rounded-xl"
                                onClick={() => deleteQuoteFromQueue(quote.id)}
                                disabled={!!processingId}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] px-6 rounded-xl shadow-lg shadow-emerald-600/20 border-none"
                                onClick={() => processQuoteInQueue(quote)}
                                disabled={!!processingId}
                              >
                                {processingId === quote.id ? (
                                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                Approve & Create
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {(reviewResults.success > 0 || reviewResults.errors.length > 0) && (
                  <div className="mx-8 mb-8 p-6 rounded-2xl bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-100 dark:border-clio-gray-800 shadow-inner">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-clio-gray-400">Processing Summary</p>
                    <div className="space-y-2">
                      {reviewResults.success > 0 && (
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-tight flex items-center bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 mr-3" />
                          Successfully processed {reviewResults.success} invoice(s)
                        </p>
                      )}
                      {reviewResults.errors.map((err, i) => (
                        <p key={i} className="text-xs font-bold text-red-600 uppercase tracking-tight flex items-center bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">
                          <XCircle className="w-4 h-4 mr-3" />
                          Error: {err}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <DialogFooter className="p-8 border-t border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/30 dark:bg-clio-gray-900/30">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsQueueOpen(false)}
                    className="font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl border-clio-gray-200 dark:border-clio-gray-800 bg-white dark:bg-clio-gray-900"
                  >
                    Close Queue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Quick Actions */}
            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-clio-gray-50/50 dark:bg-clio-gray-800/20 border-b border-clio-gray-100 dark:border-clio-gray-800">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    className="w-full justify-between h-12 bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 hover:bg-clio-blue/5 hover:border-clio-blue text-clio-gray-700 dark:text-clio-gray-300 font-bold uppercase tracking-tight text-xs shadow-sm"
                    variant="outline"
                    onClick={handleCreateInvoice}
                    disabled={acceptedQuotes.length === 0}
                  >
                    <div className="flex items-center">
                      <Receipt className="w-4 h-4 mr-3 text-clio-blue" />
                      Create Invoice
                    </div>
                    <Badge className="bg-clio-blue/10 text-clio-blue shadow-none border-none">{acceptedQuotes.length}</Badge>
                  </Button>
                  <Button
                    className="w-full justify-between h-12 bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 hover:bg-clio-blue/5 hover:border-clio-blue text-clio-gray-700 dark:text-clio-gray-300 font-bold uppercase tracking-tight text-xs shadow-sm"
                    variant="outline"
                    onClick={handleMarkInvoicesAsPaid}
                    disabled={unpaidInvoices.length === 0}
                  >
                    <div className="flex items-center">
                      <Receipt className="w-4 h-4 mr-3 text-clio-blue" />
                      Mark Paid
                    </div>
                    <Badge className="bg-clio-blue/10 text-clio-blue shadow-none border-none">{unpaidInvoices.length}</Badge>
                  </Button>
                  <Button
                    className="w-full justify-between h-12 bg-white dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 hover:bg-clio-blue/5 hover:border-clio-blue text-clio-gray-700 dark:text-clio-gray-300 font-bold uppercase tracking-tight text-xs shadow-sm"
                    variant="outline"
                    onClick={handlePayCommissions}
                    disabled={unpaidCommissions.length === 0}
                  >
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-3 text-clio-blue" />
                      Pay Commissions
                    </div>
                    <Badge className="bg-clio-blue/10 text-clio-blue shadow-none border-none">{unpaidCommissions.length}</Badge>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Overview */}
            <Card className="lg:col-span-2 border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-clio-gray-50/50 dark:bg-clio-gray-800/20 border-b border-clio-gray-100 dark:border-clio-gray-800">
                <CardTitle className="flex items-center text-[10px] font-black uppercase tracking-widest text-clio-gray-500">
                  <div className="p-1.5 bg-clio-blue/10 rounded-lg mr-3">
                    <TrendingUp className="w-4 h-4 text-clio-blue" />
                  </div>
                  Cash Flow Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center space-y-2 group">
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200">
                      {formatCurrency(totalRevenue)}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Total Inflow</div>
                    <div className="w-full h-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-full mt-2">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div className="text-center space-y-2 group">
                    <div className="text-3xl font-black text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-200">
                      {formatCurrency(totalExpenses + totalCommissionsPaid)}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Total Outflow</div>
                    <div className="w-full h-1 bg-red-50 dark:bg-red-950/30 rounded-full mt-2">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${totalRevenue > 0 ? ((totalExpenses + totalCommissionsPaid) / totalRevenue) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div className="text-center space-y-2 group">
                    <div className={cn("text-3xl font-black group-hover:scale-110 transition-transform duration-200", netProfit >= 0 ? 'text-clio-blue' : 'text-red-600')}>
                      {formatCurrency(netProfit)}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Net Cash Flow</div>
                    <div className="w-full h-1 bg-clio-blue/10 rounded-full mt-2">
                      <div className={cn("h-full rounded-full", netProfit >= 0 ? 'bg-clio-blue' : 'bg-red-500')} style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </MainLayout>
  );
}
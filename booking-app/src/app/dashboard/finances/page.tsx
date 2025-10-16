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
import { useAuth } from '@/components/auth/AuthProvider';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatItemDetails } from '@/lib/travel-item-formatter';
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
  AlertTriangle
} from 'lucide-react';

export default function FinancesPage() {
  const { user } = useAuth();
  const { data: invoices = [] } = useInvoicesQuery();
  const { markInvoiceAsPaid, generateInvoiceFromQuote } = useInvoiceMutations();
  const { data: commissions = [] } = useCommissionsQuery();
  const { bulkMarkAsPaid, generateCommissionFromBooking } = useCommissionMutations();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: quotes = [] } = useQuotesQuery();
  const { data: contacts = [] } = useContactsQuery();

  const [dateRange, setDateRange] = useState('30'); // days
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
        if (invoice.status !== 'paid') return false;
        const paidAt = new Date(invoice.paidAt || invoice.createdAt);
        return paidAt >= new Date(selectedPeriod.startDate) &&
               paidAt <= new Date(selectedPeriod.endDate);
      })
      .reduce((sum, invoice) => sum + invoice.total, 0);
  }, [invoices, selectedPeriod]);

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter(invoice => invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'void')
      .reduce((sum, invoice) => sum + (invoice.remainingAmount || invoice.total), 0);
  }, [invoices]);

  const overdueAmount = useMemo(() => {
    const now = new Date();
    return invoices
      .filter(invoice => {
        if (invoice.status === 'paid' || invoice.status === 'cancelled' || invoice.status === 'void') return false;
        return new Date(invoice.dueDate) < now;
      })
      .reduce((sum, invoice) => sum + (invoice.remainingAmount || invoice.total), 0);
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
        const createdAt = new Date(commission.createdAt);
        return createdAt >= new Date(selectedPeriod.startDate) &&
               createdAt <= new Date(selectedPeriod.endDate);
      })
      .reduce((sum, commission) => sum + commission.commissionAmount, 0);
  }, [commissions, selectedPeriod]);

  const totalCommissionsPaid = useMemo(() => {
    return commissions
      .filter(commission => {
        if (commission.status !== 'paid') return false;
        const paidAt = new Date(commission.paidAt || commission.createdAt);
        return paidAt >= new Date(selectedPeriod.startDate) &&
               paidAt <= new Date(selectedPeriod.endDate);
      })
      .reduce((sum, commission) => sum + commission.commissionAmount, 0);
  }, [commissions, selectedPeriod]);

  const totalCommissionsPending = useMemo(() => {
    return commissions
      .filter(commission => commission.status === 'pending')
      .reduce((sum, commission) => sum + commission.commissionAmount, 0);
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

    let invoicesCreated = 0;
    let commissionsCreated = 0;
    const errors: string[] = [];

    for (const quote of acceptedQuotes) {
      try {
        // Get customer data from contacts
        const customer = contacts.find(c => c.id === quote.contactId);

        if (!customer) {
          errors.push(`Customer not found for quote ${quote.id}`);
          continue;
        }

        const customerData = {
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          customerEmail: customer.email,
          customerAddress: customer.address
        };

        // Generate invoice from quote
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

        if (invoiceId) {
          invoicesCreated++;

          // Generate commission record - with validation
          try {
            // Validate quote total before attempting commission creation
            if (!quote.totalCost || typeof quote.totalCost !== 'number' || isNaN(quote.totalCost) || quote.totalCost <= 0) {
              throw new Error(`Invalid quote total: ${quote.totalCost}. Cannot calculate commission.`);
            }

            await new Promise<void>((resolve, reject) => {
              generateCommissionFromBooking.mutate(
                {
                  agentId: user?.id || 'default-agent',
                  agentName: user?.email || 'Travel Agent',
                  bookingId: invoiceId,
                  quoteId: quote.id,
                  invoiceId: invoiceId,
                  customerId: customer.id,
                  customerName: customerData.customerName,
                  bookingAmount: quote.totalCost,
                  bookingType: 'hotel',
                },
                {
                  onSuccess: () => resolve(),
                  onError: (error) => reject(error)
                }
              );
            });
            commissionsCreated++;
          } catch (commError) {
            console.error('Failed to create commission for invoice:', invoiceId, commError);
            const errorMessage = commError instanceof Error ? commError.message : 'Unknown error';
            errors.push(`Commission generation failed for invoice ${invoiceId}: ${errorMessage}`);
          }
        }
      } catch (error) {
        console.error('Failed to create invoice for quote:', quote.id, error);
        errors.push(`Failed to create invoice for quote ${quote.id}`);
      }
    }

    // Show results
    if (invoicesCreated > 0) {
      const message = `Successfully created ${invoicesCreated} invoice(s) and ${commissionsCreated} commission record(s)!`;
      alert(errors.length > 0 ? `${message}\n\nWarnings:\n${errors.join('\n')}` : message);
    } else {
      alert(`Failed to create invoices.\n${errors.join('\n')}`);
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
              <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Overview of your business financial performance
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-xs text-gray-500">
                  +12% from last period
                </p>
              </CardContent>
            </Card>

            {/* Outstanding Amount */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <Receipt className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalOutstanding)}
                </div>
                <p className="text-xs text-gray-500">
                  {overdueAmount > 0 && (
                    <span className="text-red-600 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {formatCurrency(overdueAmount)} overdue
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <CreditCard className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpenses)}
                </div>
                <p className="text-xs text-gray-500">
                  +5% from last period
                </p>
              </CardContent>
            </Card>

            {/* Net Profit */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </div>
                <p className="text-xs text-gray-500">
                  {profitMargin}% margin
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commission & Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Commission Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Commission Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Earned</span>
                    <span className="font-semibold">{formatCurrency(totalCommissionsEarned)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Paid</span>
                    <span className="font-semibold text-green-600">{formatCurrency(totalCommissionsPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(totalCommissionsPending)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(expensesByCategory).map(([category, amount]) => {
                    if (amount === 0) return null;
                    const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0';
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 capitalize">
                            {category.replace('_', ' ')}
                          </span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {percentage}%
                          </Badge>
                        </div>
                        <span className="font-semibold">{formatCurrency(amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity / Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleCreateInvoice}
                    disabled={acceptedQuotes.length === 0}
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Create Invoice ({acceptedQuotes.length})
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleMarkInvoicesAsPaid}
                    disabled={unpaidInvoices.length === 0}
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Mark Invoices Paid ({unpaidInvoices.length})
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handlePayCommissions}
                    disabled={unpaidCommissions.length === 0}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay Commissions ({unpaidCommissions.length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Cash Flow Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-600">Cash Inflow</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(totalExpenses + totalCommissionsPaid)}
                    </div>
                    <div className="text-sm text-gray-600">Cash Outflow</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netProfit)}
                    </div>
                    <div className="text-sm text-gray-600">Net Cash Flow</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </MainLayout>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExpensesQuery } from '@/hooks/queries/useExpensesQuery';
import { useExpenseMutations } from '@/hooks/mutations/useExpenseMutations';
import { useAuthStore } from '@/store/auth-store';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  Calendar,
  TrendingDown,
  FileText,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Download,
  Receipt,
  Building,
  Tag
} from 'lucide-react';
import { Expense, ExpenseCategory } from '@/types/financial';

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const { data: expenses = [] } = useExpensesQuery();
  const { updateExpense, deleteExpense, approveExpense } = useExpenseMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [dateRange, setDateRange] = useState('30');
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
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

  useEffect(() => {
    let filtered = expenses;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(query) ||
        expense.vendor?.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query) ||
        expense.subcategory?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    // Filter by date range
    filtered = filtered.filter(expense => {
      return expense.date >= selectedPeriod.startDate && expense.date <= selectedPeriod.endDate;
    });

    setFilteredExpenses(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [expenses, searchQuery, categoryFilter, selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case 'supplier_payment':
        return <Building className="w-4 h-4" />;
      case 'marketing':
        return <Tag className="w-4 h-4" />;
      case 'operational':
        return <CreditCard className="w-4 h-4" />;
      case 'commission':
        return <Receipt className="w-4 h-4" />;
      case 'office':
        return <Building className="w-4 h-4" />;
      case 'travel':
        return <Calendar className="w-4 h-4" />;
      case 'technology':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: ExpenseCategory) => {
    const colors = {
      supplier_payment: 'bg-blue-100 text-blue-800',
      marketing: 'bg-purple-100 text-purple-800',
      operational: 'bg-orange-100 text-orange-800',
      commission: 'bg-green-100 text-green-800',
      office: 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-700 dark:text-clio-gray-300',
      travel: 'bg-indigo-100 text-indigo-800',
      technology: 'bg-cyan-100 text-cyan-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[category];
  };

  // Calculate statistics
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  const unapprovedExpenses = filteredExpenses.filter(expense => !expense.approvedBy).length;
  const totalVendors = new Set(expenses.filter(e => e.vendor).map(e => e.vendor)).size;

  const categories: Array<{ value: ExpenseCategory; label: string }> = [
    { value: 'supplier_payment', label: 'Supplier Payments' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operational', label: 'Operational' },
    { value: 'commission', label: 'Commission' },
    { value: 'office', label: 'Office' },
    { value: 'travel', label: 'Travel' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' },
  ];

  if (!user) {
    return <div>Please log in to view expenses.</div>;
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-clio-gray-900 dark:text-white">Expenses</h1>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 mt-2">
                Track and manage business expenses
              </p>
            </div>

            <div className="flex gap-2 mt-4 md:mt-0">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-clio-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalExpenses)}
                </div>
                <p className="text-xs text-clio-gray-400">
                  Last {dateRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Transactions</CardTitle>
                <FileText className="h-4 w-4 text-clio-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-clio-gray-900 dark:text-white">
                  {filteredExpenses.length}
                </div>
                <p className="text-xs text-clio-gray-400">
                  {unapprovedExpenses} pending approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Vendors</CardTitle>
                <Building className="h-4 w-4 text-clio-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-clio-gray-900 dark:text-white">
                  {totalVendors}
                </div>
                <p className="text-xs text-clio-gray-400">
                  Active suppliers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Avg per Day</CardTitle>
                <Calendar className="h-4 w-4 text-clio-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-clio-gray-900 dark:text-white">
                  {formatCurrency(totalExpenses / parseInt(dateRange))}
                </div>
                <p className="text-xs text-clio-gray-400">
                  Daily average
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Expense Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map(({ value, label }) => {
                  const amount = expensesByCategory[value] || 0;
                  const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0';

                  if (amount === 0) return null;

                  return (
                    <div key={value} className="flex items-center justify-between p-4 border border-clio-gray-100 dark:border-clio-gray-800 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-clio-gray-800 text-clio-blue">
                          {getCategoryIcon(value)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-clio-gray-900 dark:text-white">{label}</div>
                          <div className="text-xs text-clio-gray-500 dark:text-clio-gray-400">{percentage}%</div>
                        </div>
                      </div>
                      <div className="font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-clio-gray-400 w-4 h-4" />
              <Input
                placeholder="Search expenses by description, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as ExpenseCategory | 'all')}>
              <SelectTrigger className="w-[200px]">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-clio-blue" />
                  <SelectValue placeholder="Filter by category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-clio-blue" />
                  <SelectValue placeholder="Date range" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expenses Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Expenses ({filteredExpenses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-clio-gray-50 dark:bg-clio-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-clio-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-clio-gray-900 dark:text-white mb-2">No expenses found</h3>
                  <p className="text-clio-gray-500 dark:text-clio-gray-400">
                    {searchQuery ? 'Try adjusting your search criteria.' : 'Start tracking expenses to see them here.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-clio-gray-100 dark:border-clio-gray-800">
                        <th className="text-left py-4 px-4 font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight text-[10px]">Date</th>
                        <th className="text-left py-4 px-4 font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight text-[10px]">Description</th>
                        <th className="text-left py-4 px-4 font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight text-[10px]">Category</th>
                        <th className="text-left py-4 px-4 font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight text-[10px]">Vendor</th>
                        <th className="text-left py-4 px-4 font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight text-[10px]">Amount</th>
                        <th className="text-left py-4 px-4 font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight text-[10px]">Status</th>
                        <th className="text-left py-4 px-4 font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight text-[10px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-clio-gray-100 dark:divide-clio-gray-800">
                      {filteredExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-clio-gray-50 dark:hover:bg-clio-gray-900/50 transition-colors">
                          <td className="py-4 px-4 text-sm font-medium text-clio-gray-600 dark:text-clio-gray-400">
                            {formatDate(expense.date)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-clio-gray-900 dark:text-white">{expense.description}</div>
                            {expense.subcategory && (
                              <div className="text-xs text-clio-gray-500 dark:text-clio-gray-400">{expense.subcategory}</div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={`${getCategoryColor(expense.category)} flex items-center gap-1 w-fit border-none shadow-none`}>
                              {getCategoryIcon(expense.category)}
                              {expense.category.replace('_', ' ').charAt(0).toUpperCase() + expense.category.replace('_', ' ').slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm font-medium text-clio-gray-600 dark:text-clio-gray-400">
                              {expense.vendor || 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-red-600 dark:text-red-400">
                              {formatCurrency(expense.amount)}
                            </div>
                            <div className="text-[10px] font-bold text-clio-gray-400 uppercase">
                              {expense.currency}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {expense.approvedBy ? (
                              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 flex items-center gap-1 w-fit border-none shadow-none">
                                <CheckCircle className="w-3 h-3" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 flex items-center gap-1 w-fit border-none shadow-none">
                                <Clock className="w-3 h-3" />
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {!expense.approvedBy && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  onClick={() => approveExpense.mutate({ id: expense.id, approvedBy: user?.id || '' })}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {expense.receiptUrl && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-clio-blue hover:bg-clio-blue/10">
                                  <Receipt className="w-4 h-4" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-clio-gray-400 hover:text-clio-gray-600 dark:hover:text-clio-gray-200">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
'use client';

import { useState, useMemo } from 'react';
import { useExpensesQuery } from '@/hooks/queries/useExpensesQuery';
import { useContactsQuery } from '@/hooks/queries/useContactsQuery';
import { useContactByIdQuery } from '@/hooks/queries/useContactsQuery';
import { useQuoteByIdQuery } from '@/hooks/queries/useQuotesQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExpenseCategory, Expense } from '@/types/financial';
import { Plus, Search, Receipt } from 'lucide-react';
import { AddExpense } from './AddExpense';

// Helper component to render expense row with async data
function ExpenseRow({ expense, supplierMap }: { expense: Expense; supplierMap: Map<string, any> }) {
  const { data: quote } = useQuoteByIdQuery(expense.bookingId);
  const { data: customer } = useContactByIdQuery(quote?.contactId);
  const supplier = expense.supplierId ? supplierMap.get(expense.supplierId) : null;

  const getCategoryBadge = (category: ExpenseCategory) => {
    const colors: Record<ExpenseCategory, string> = {
      supplier_payment: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
      marketing: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400',
      operational: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
      commission: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      office: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      travel: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
      technology: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400',
      other: 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400',
    };

    return (
      <Badge className={`${colors[category]} border-none shadow-none text-[10px] font-bold uppercase tracking-tight`}>
        {category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  return (
    <TableRow className="hover:bg-clio-gray-50 dark:hover:bg-clio-gray-900/50 transition-colors border-b border-clio-gray-100 dark:border-clio-gray-800 last:border-0">
      <TableCell className="font-medium text-clio-gray-600 dark:text-clio-gray-400">{new Date(expense.date).toLocaleDateString()}</TableCell>
      <TableCell>{getCategoryBadge(expense.category)}</TableCell>
      <TableCell>
        <div className="max-w-xs">
          <div className="font-bold text-clio-gray-900 dark:text-white truncate">{expense.description}</div>
          {expense.subcategory && (
            <div className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400">{expense.subcategory}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {supplier ? (
          <div>
            <div className="font-bold text-clio-gray-900 dark:text-white">{supplier.firstName} {supplier.lastName}</div>
            <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">Linked Supplier</div>
          </div>
        ) : (
          <div className="font-medium text-clio-gray-600 dark:text-clio-gray-400">{expense.vendor || '-'}</div>
        )}
      </TableCell>
      <TableCell>
        {quote && customer ? (
          <div>
            <div className="font-bold text-clio-gray-900 dark:text-white">{customer.firstName} {customer.lastName}</div>
            <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">Booking #{quote.id.slice(0, 8)}</div>
          </div>
        ) : (
          <span className="text-clio-gray-400">-</span>
        )}
      </TableCell>
      <TableCell className="text-right font-bold text-clio-gray-900 dark:text-white">
        ${expense.amount.toFixed(2)}
      </TableCell>
      <TableCell>
        {expense.status === 'paid' ? (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-none shadow-none text-[10px] font-bold uppercase tracking-tight">Paid</Badge>
        ) : expense.status === 'pending' ? (
          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-none shadow-none text-[10px] font-bold uppercase tracking-tight">Pending</Badge>
        ) : expense.approvedBy ? (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-none shadow-none text-[10px] font-bold uppercase tracking-tight">Approved</Badge>
        ) : (
          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-none shadow-none text-[10px] font-bold uppercase tracking-tight">Pending Approval</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

export function ExpenseList() {
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: allExpenses = [] } = useExpensesQuery();
  const { data: contacts = [] } = useContactsQuery();

  // Create supplier lookup map
  const supplierMap = useMemo(() => {
    const map = new Map();
    contacts.filter(c => c.type === 'supplier').forEach(s => map.set(s.id, s));
    return map;
  }, [contacts]);

  // Filter expenses
  let filteredExpenses = useMemo(() => {
    let expenses = allExpenses;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      expenses = expenses.filter(expense =>
        expense.description.toLowerCase().includes(query) ||
        expense.vendor?.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query) ||
        expense.subcategory?.toLowerCase().includes(query)
      );
    }

    return expenses;
  }, [allExpenses, searchQuery]);

  if (categoryFilter !== 'all') {
    filteredExpenses = filteredExpenses.filter((exp) => exp.category === categoryFilter);
  }

  // Sort by date (newest first)
  filteredExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses by description, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="supplier_payment">Supplier Payment</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="commission">Commission</SelectItem>
            <SelectItem value="office">Office</SelectItem>
            <SelectItem value="travel">Travel</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <AddExpense onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-clio-gray-50 dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl p-6">
        <div className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight mb-1">Total Expenses</div>
        <div className="text-3xl font-bold text-clio-gray-900 dark:text-white">${totalAmount.toFixed(2)}</div>
        <div className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400 mt-1">{filteredExpenses.length} expenses</div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-clio-gray-50 dark:bg-clio-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-8 w-8 text-clio-gray-400" />
          </div>
          <p className="text-lg font-bold text-clio-gray-900 dark:text-white">No expenses found</p>
          <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl overflow-hidden bg-white dark:bg-clio-gray-950">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-clio-gray-200 dark:border-clio-gray-800">
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Date</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Category</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Description</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Supplier/Vendor</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Booking</TableHead>
                <TableHead className="text-right text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Amount</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  supplierMap={supplierMap}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

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
      supplier_payment: 'bg-purple-100 text-purple-800',
      marketing: 'bg-pink-100 text-pink-800',
      operational: 'bg-blue-100 text-blue-800',
      commission: 'bg-green-100 text-green-800',
      office: 'bg-yellow-100 text-yellow-800',
      travel: 'bg-orange-100 text-orange-800',
      technology: 'bg-cyan-100 text-cyan-800',
      other: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={colors[category]}>
        {category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  return (
    <TableRow>
      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
      <TableCell>{getCategoryBadge(expense.category)}</TableCell>
      <TableCell>
        <div className="max-w-xs">
          <div className="font-medium truncate">{expense.description}</div>
          {expense.subcategory && (
            <div className="text-sm text-muted-foreground">{expense.subcategory}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {supplier ? (
          <div>
            <div className="font-medium">{supplier.firstName} {supplier.lastName}</div>
            <div className="text-xs text-muted-foreground">Linked Supplier</div>
          </div>
        ) : (
          <div>{expense.vendor || '-'}</div>
        )}
      </TableCell>
      <TableCell>
        {quote && customer ? (
          <div>
            <div className="font-medium text-sm">{customer.firstName} {customer.lastName}</div>
            <div className="text-xs text-muted-foreground">Booking #{quote.id.slice(0, 8)}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-right font-medium">
        ${expense.amount.toFixed(2)}
      </TableCell>
      <TableCell>
        {expense.status === 'paid' ? (
          <Badge className="bg-green-100 text-green-800">Paid</Badge>
        ) : expense.status === 'pending' ? (
          <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
        ) : expense.approvedBy ? (
          <Badge className="bg-green-100 text-green-800">Approved</Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
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

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="text-sm font-medium text-muted-foreground">Total Expenses</div>
        <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
        <div className="text-sm text-muted-foreground">{filteredExpenses.length} expenses</div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No expenses found</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Supplier/Vendor</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
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

'use client';

import { useExpensesQuery } from '@/hooks/queries/useExpensesQuery';
import { useExpenseMutations } from '@/hooks/mutations/useExpenseMutations';
import { useContactByIdQuery } from '@/hooks/queries/useContactsQuery';
import { useQuoteByIdQuery } from '@/hooks/queries/useQuotesQuery';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Calendar, User, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Expense } from '@/types/financial';

// Helper component to handle individual supplier payment group
function SupplierPaymentGroup({
  supplier,
  supplierId,
  expenses,
  total,
  onMarkAsPaid,
}: {
  supplier: string;
  supplierId?: string;
  expenses: Expense[];
  total: number;
  onMarkAsPaid: (id: string) => void;
}) {
  const { data: contact } = useContactByIdQuery(supplierId);

  return (
    <div className="border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl p-4 hover:border-clio-blue dark:hover:border-clio-blue/50 transition-colors bg-white dark:bg-clio-gray-900/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-clio-gray-100 dark:bg-clio-gray-800 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-clio-gray-600 dark:text-clio-gray-400" />
          </div>
          <div>
            <h3 className="font-bold text-clio-gray-900 dark:text-white">{supplier}</h3>
            <p className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400">
              {expenses.length} payment{expenses.length > 1 ? 's' : ''} pending
            </p>
            {contact?.email && (
              <p className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-0.5">{contact.email}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-clio-blue">
            {formatCurrency(total)}
          </div>
        </div>
      </div>

      {/* Expense items */}
      <div className="space-y-3">
        {expenses.map((expense) => (
          <ExpenseItem key={expense.id} expense={expense} onMarkAsPaid={onMarkAsPaid} />
        ))}
      </div>
    </div>
  );
}

// Helper component to handle individual expense item
function ExpenseItem({
  expense,
  onMarkAsPaid,
}: {
  expense: Expense;
  onMarkAsPaid: (id: string) => void;
}) {
  const { data: quote } = useQuoteByIdQuery(expense.bookingId);
  const { data: customerContact } = useContactByIdQuery(quote?.contactId);

  return (
    <div className="flex items-center justify-between bg-clio-gray-50 dark:bg-clio-gray-800/50 p-3 rounded-lg border border-clio-gray-100 dark:border-clio-gray-800">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-clio-gray-400" />
          <span className="text-sm font-bold text-clio-gray-900 dark:text-white">
            {expense.description}
          </span>
        </div>
        {quote && customerContact && (
          <div className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400 mt-1 ml-6">
            Booking for: {customerContact.firstName} {customerContact.lastName}
          </div>
        )}
        <div className="flex items-center gap-3 text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-1 ml-6">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Due: {expense.date}
          </span>
          {expense.subcategory && (
            <span className="px-2 py-0.5 bg-clio-blue/10 dark:bg-clio-blue/20 text-clio-blue rounded">
              {expense.subcategory}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-clio-gray-900 dark:text-white">
          {formatCurrency(expense.amount)}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onMarkAsPaid(expense.id)}
          className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50 hover:bg-green-50 dark:hover:bg-green-900/20 font-bold"
        >
          Mark Paid
        </Button>
      </div>
    </div>
  );
}

export function SupplierPaymentsDue() {
  const { data: expenses = [] } = useExpensesQuery();
  const { updateExpense } = useExpenseMutations();

  // Filter pending supplier payments
  const pendingPayments = expenses.filter(
    (expense) =>
      expense.category === 'supplier_payment' &&
      expense.status === 'pending'
  );

  // Group by supplier
  const paymentsBySupplier = pendingPayments.reduce((acc, expense) => {
    const supplier = expense.vendor || 'Unknown Supplier';
    if (!acc[supplier]) {
      acc[supplier] = {
        supplierId: expense.supplierId,
        expenses: [],
        total: 0,
      };
    }
    acc[supplier].expenses.push(expense);
    acc[supplier].total += expense.amount;
    return acc;
  }, {} as Record<string, { supplierId?: string; expenses: typeof expenses; total: number }>);

  const totalDue = pendingPayments.reduce((sum, exp) => sum + exp.amount, 0);
  const supplierCount = Object.keys(paymentsBySupplier).length;

  const markAsPaid = (expenseId: string) => {
    updateExpense.mutate({
      id: expenseId,
      updates: {
        status: 'paid',
        paymentMethod: 'bank_transfer',
      },
    });
  };

  if (pendingPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
            <DollarSign className="w-5 h-5 text-clio-blue" />
            Supplier Payments Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-clio-gray-50 dark:bg-clio-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-clio-gray-400" />
            </div>
            <p className="text-lg font-bold text-clio-gray-900 dark:text-white">No pending supplier payments</p>
            <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400 mt-1">
              Supplier expenses will appear here when bookings are confirmed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
            <AlertCircle className="w-5 h-5 text-clio-blue" />
            Supplier Payments Due
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">
              {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} to {supplierCount} supplier{supplierCount > 1 ? 's' : ''}
            </div>
            <div className="text-2xl font-bold text-clio-blue">
              {formatCurrency(totalDue)}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(paymentsBySupplier).map(([supplier, { supplierId, expenses, total }]) => (
            <SupplierPaymentGroup
              key={supplier}
              supplier={supplier}
              supplierId={supplierId}
              expenses={expenses}
              total={total}
              onMarkAsPaid={markAsPaid}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

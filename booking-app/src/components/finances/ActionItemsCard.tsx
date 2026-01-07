'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';

interface ActionItemsCardProps {
  invoices: any[];
  expenses: any[];
  commissions: any[];
}

export function ActionItemsCard({ invoices, expenses, commissions }: ActionItemsCardProps) {
  const actionItems = useMemo(() => {
    const now = new Date();

    // Count overdue invoices
    const overdueInvoices = invoices.filter((inv) => {
      const dueDate = new Date(inv.dueDate);
      return dueDate < now && inv.status !== 'paid' && inv.status !== 'cancelled';
    });

    // Count pending expenses (not approved)
    const pendingExpenses = expenses.filter((exp) => !exp.approvedBy);

    // Count unpaid commissions
    const unpaidCommissions = commissions.filter(
      (comm) => comm.status === 'pending' || comm.status === 'approved'
    );

    // Calculate total unpaid commission amount
    const unpaidCommissionAmount = unpaidCommissions.reduce(
      (sum, comm) => sum + comm.commissionAmount,
      0
    );

    return {
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0),
      pendingExpensesCount: pendingExpenses.length,
      unpaidCommissionsCount: unpaidCommissions.length,
      unpaidCommissionAmount,
    };
  }, [invoices, expenses, commissions]);

  const hasActionItems =
    actionItems.overdueCount > 0 ||
    actionItems.pendingExpensesCount > 0 ||
    actionItems.unpaidCommissionsCount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Action Items</CardTitle>
        <CardDescription className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">Items requiring your attention</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasActionItems ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-green-50 dark:bg-green-900/20 p-4 mb-4">
              <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-bold text-clio-gray-900 dark:text-white">All caught up!</p>
            <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">No pending action items</p>
          </div>
        ) : (
          <div className="space-y-4">
            {actionItems.overdueCount > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/20">
                <div className="p-2.5 rounded-lg bg-white dark:bg-clio-gray-900 text-red-600 dark:text-red-400 shadow-sm">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-red-900 dark:text-red-400">
                    {actionItems.overdueCount} Overdue Invoice{actionItems.overdueCount !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm font-medium text-red-700 dark:text-red-400/80 mt-0.5">
                    Total: ${actionItems.overdueAmount.toFixed(2)} outstanding
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400" asChild>
                  <Link href="/admin/finances?tab=invoices">View</Link>
                </Button>
              </div>
            )}

            {actionItems.pendingExpensesCount > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-900/20">
                <div className="p-2.5 rounded-lg bg-white dark:bg-clio-gray-900 text-yellow-600 dark:text-yellow-400 shadow-sm">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-yellow-900 dark:text-yellow-400">
                    {actionItems.pendingExpensesCount} Pending Approval{actionItems.pendingExpensesCount !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400/80 mt-0.5">
                    Expense{actionItems.pendingExpensesCount !== 1 ? 's' : ''} awaiting review
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-yellow-200 dark:border-yellow-900/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" asChild>
                  <Link href="/admin/finances?tab=expenses">Review</Link>
                </Button>
              </div>
            )}

            {actionItems.unpaidCommissionsCount > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-clio-blue/10 dark:border-clio-blue/30 bg-clio-blue/5 dark:bg-clio-blue/10">
                <div className="p-2.5 rounded-lg bg-white dark:bg-clio-gray-900 text-clio-blue shadow-sm">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-clio-gray-900 dark:text-clio-blue">
                    ${actionItems.unpaidCommissionAmount.toFixed(2)} in Unpaid Commissions
                  </div>
                  <div className="text-sm font-medium text-clio-gray-600 dark:text-clio-gray-400 mt-0.5">
                    {actionItems.unpaidCommissionsCount} commission{actionItems.unpaidCommissionsCount !== 1 ? 's' : ''} pending payment
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-clio-blue/20 dark:border-clio-blue/40 hover:bg-clio-blue/10 text-clio-blue" asChild>
                  <Link href="/admin/finances?tab=commissions">Process</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

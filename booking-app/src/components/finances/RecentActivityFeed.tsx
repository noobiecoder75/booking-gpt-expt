'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, FileText, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { FinancialTransaction } from '@/types/transaction';

interface RecentActivityFeedProps {
  transactions: FinancialTransaction[];
  limit?: number;
}

export function RecentActivityFeed({ transactions, limit = 10 }: RecentActivityFeedProps) {
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }, [transactions, limit]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_received':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'invoice_created':
      case 'invoice_paid':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'expense_recorded':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      case 'commission_created':
      case 'commission_paid':
        return <Users className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      payment_received: 'Payment Received',
      invoice_created: 'Invoice Created',
      invoice_paid: 'Invoice Paid',
      expense_recorded: 'Expense Recorded',
      commission_created: 'Commission Created',
      commission_paid: 'Commission Paid',
      refund_issued: 'Refund Issued',
      fund_allocated: 'Funds Allocated',
      supplier_payment: 'Supplier Payment',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400';
    }
  };

  if (recentTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Recent Activity</CardTitle>
          <CardDescription className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">Latest financial transactions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-clio-gray-400">
          No recent activity
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Recent Activity</CardTitle>
        <CardDescription className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">Latest {recentTransactions.length} transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-start gap-3 pb-3 border-b border-clio-gray-100 dark:border-clio-gray-800 last:border-0 last:pb-0"
            >
              <div className="p-2 rounded-lg bg-clio-gray-50 dark:bg-clio-gray-800">
                {getIcon(transaction.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-clio-gray-900 dark:text-white truncate">
                    {getTypeLabel(transaction.type)}
                  </span>
                  <Badge className={`text-[10px] font-bold uppercase tracking-tight border-none shadow-none ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400 truncate">
                  {transaction.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-clio-gray-400 uppercase">
                    {new Date(transaction.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${
                  transaction.type === 'payment_received' ? 'text-green-600 dark:text-green-400' :
                  transaction.type.includes('expense') || transaction.type.includes('payment') ? 'text-red-600 dark:text-red-400' :
                  'text-clio-gray-900 dark:text-white'
                }`}>
                  {transaction.type === 'payment_received' ? '+' :
                   transaction.type.includes('expense') || transaction.type === 'supplier_payment' ? '-' : ''}
                  ${transaction.amount.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

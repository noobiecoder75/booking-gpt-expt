'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseCategory } from '@/types/financial';

interface ExpenseCategoryChartProps {
  expenses: any[];
}

const COLORS: Record<ExpenseCategory, string> = {
  supplier_payment: '#8b5cf6',
  marketing: '#ec4899',
  operational: '#3b82f6',
  commission: '#10b981',
  office: '#eab308',
  travel: '#f97316',
  technology: '#06b6d4',
  other: '#6b7280',
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  supplier_payment: 'Supplier Payments',
  marketing: 'Marketing',
  operational: 'Operational',
  commission: 'Commissions',
  office: 'Office',
  travel: 'Travel',
  technology: 'Technology',
  other: 'Other',
};

export function ExpenseCategoryChart({ expenses }: ExpenseCategoryChartProps) {
  const chartData = useMemo(() => {
    // Group expenses by category
    const categoryTotals: Record<ExpenseCategory, number> = {
      supplier_payment: 0,
      marketing: 0,
      operational: 0,
      commission: 0,
      office: 0,
      travel: 0,
      technology: 0,
      other: 0,
    };

    expenses.forEach((expense) => {
      categoryTotals[expense.category] += expense.amount;
    });

    // Convert to chart format (only include categories with expenses)
    return Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0)
      .map(([category, value]) => ({
        name: CATEGORY_LABELS[category as ExpenseCategory],
        value: Math.round(value * 100) / 100,
        color: COLORS[category as ExpenseCategory],
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Expense Breakdown</CardTitle>
          <CardDescription className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">By category</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-clio-gray-400 font-medium">
          No expense data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Expense Breakdown</CardTitle>
        <CardDescription className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">Total: ${totalExpenses.toFixed(2)}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(2)}`}
              contentStyle={{ 
                backgroundColor: 'rgb(var(--clio-gray-950))', 
                borderColor: 'rgb(var(--clio-gray-800))',
                borderRadius: '8px',
                borderWidth: '1px',
                color: '#fff'
              }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-xs font-bold text-clio-gray-600 dark:text-clio-gray-400 uppercase tracking-tight">
                  {value} (${entry.payload.value.toFixed(2)})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

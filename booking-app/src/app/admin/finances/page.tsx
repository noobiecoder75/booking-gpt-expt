'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancialOverview } from '@/components/finances/FinancialOverview';
import { InvoiceList } from '@/components/finances/InvoiceList';
import { ExpenseList } from '@/components/finances/ExpenseList';
import { CommissionDashboard } from '@/components/finances/CommissionDashboard';
import { SupplierPaymentsDue } from '@/components/finances/SupplierPaymentsDue';

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    console.log('[FinancesPage] Component mounted, activeTab:', activeTab);
    return () => {
      console.log('[FinancesPage] Component unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('[FinancesPage] Tab changed to:', activeTab);
  }, [activeTab]);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Financial Management</h1>
          <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium mt-2">
            Manage invoices, expenses, commissions, and financial reporting
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-clio-gray-100/50 dark:bg-clio-gray-900 p-1 rounded-xl border border-clio-gray-200/50 dark:border-clio-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-clio-gray-800 data-[state=active]:shadow-sm rounded-lg font-bold uppercase tracking-tight text-xs">Overview</TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-white dark:data-[state=active]:bg-clio-gray-800 data-[state=active]:shadow-sm rounded-lg font-bold uppercase tracking-tight text-xs">Invoices</TabsTrigger>
          <TabsTrigger value="expenses" className="data-[state=active]:bg-white dark:data-[state=active]:bg-clio-gray-800 data-[state=active]:shadow-sm rounded-lg font-bold uppercase tracking-tight text-xs">Expenses</TabsTrigger>
          <TabsTrigger value="commissions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-clio-gray-800 data-[state=active]:shadow-sm rounded-lg font-bold uppercase tracking-tight text-xs">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
          <FinancialOverview />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6 animate-in fade-in duration-300">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Invoices</CardTitle>
              <CardDescription className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">
                View and manage all invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6 animate-in fade-in duration-300">
          {/* Supplier Payments Due Widget */}
          <SupplierPaymentsDue />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Expenses</CardTitle>
              <CardDescription className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">
                Track and manage business expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6 animate-in fade-in duration-300">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Commissions</CardTitle>
              <CardDescription className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">
                Monitor agent commissions and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommissionDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

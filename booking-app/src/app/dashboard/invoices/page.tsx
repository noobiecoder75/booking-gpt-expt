'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoicesQuery } from '@/hooks/queries/useInvoicesQuery';
import { useInvoiceMutations } from '@/hooks/mutations/useInvoiceMutations';
import { useAuthStore } from '@/store/auth-store';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { InvoiceModal } from '@/components/invoices/InvoiceModal';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Send,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '@/types/financial';

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const { data: invoices = [] } = useInvoicesQuery();
  const {
    markInvoiceAsSent,
    markInvoiceAsPaid,
    updateInvoice,
    voidInvoice
  } = useInvoiceMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    let filtered = invoices;

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.customerName.toLowerCase().includes(query) ||
        invoice.customerEmail.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchQuery, statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Action handlers
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    // Navigate to edit page or show edit modal
    alert(`Edit functionality for invoice ${invoice.invoiceNumber} - Coming soon!`);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      await generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleInvoiceMenu = (invoice: Invoice) => {
    const actions = [];

    if (invoice.status === 'draft') {
      actions.push('Send Invoice');
    }
    if (invoice.status === 'sent' || invoice.status === 'partial') {
      actions.push('Mark as Paid');
    }
    if (invoice.status !== 'cancelled') {
      actions.push('Cancel Invoice');
    }
    actions.push('Duplicate Invoice', 'Delete Invoice');

    const choice = prompt(`Choose action for ${invoice.invoiceNumber}:\n${actions.map((action, i) => `${i + 1}. ${action}`).join('\n')}`);

    if (choice) {
      const actionIndex = parseInt(choice) - 1;
      const selectedAction = actions[actionIndex];

      switch (selectedAction) {
        case 'Send Invoice':
          markInvoiceAsSent.mutate(invoice.id);
          alert('Invoice marked as sent!');
          break;
        case 'Mark as Paid':
          markInvoiceAsPaid.mutate({
            id: invoice.id,
            paymentMethod: 'bank_transfer',
            transactionId: `TXN-${Date.now()}`
          });
          alert('Invoice marked as paid!');
          break;
        case 'Cancel Invoice':
          voidInvoice.mutate({ id: invoice.id, reason: 'Cancelled by user' });
          alert('Invoice cancelled!');
          break;
        case 'Duplicate Invoice':
          alert('Duplicate functionality - Coming soon!');
          break;
        case 'Delete Invoice':
          if (confirm('Are you sure you want to delete this invoice?')) {
            alert('Delete functionality - Coming soon!');
          }
          break;
      }
    }
  };

  const handleCreateInvoice = () => {
    alert('Create Invoice functionality - Coming soon!\n\nFor now, you can create invoices from accepted quotes in the Finances page.');
  };

  const handleCloseInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setSelectedInvoice(null);
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'partial':
        return <Clock className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-700 dark:text-clio-gray-300';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-700 dark:text-clio-gray-300';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-700 dark:text-clio-gray-300';
    }
  };

  const isOverdue = (invoice: Invoice) => {
    return new Date(invoice.dueDate) < new Date() &&
           invoice.status !== 'paid' &&
           invoice.status !== 'cancelled';
  };

  // Summary statistics
  const totalInvoices = invoices.length;
  const draftInvoices = invoices.filter(inv => inv.status === 'draft').length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const overdueInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter(inv => {
      if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'void') return false;
      return new Date(inv.dueDate) < now;
    }).length;
  }, [invoices]);

  const totalRevenue = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'void')
      .reduce((sum, inv) => sum + (inv.remainingAmount || inv.total), 0);
  }, [invoices]);

  const overdueAmount = useMemo(() => {
    const now = new Date();
    return invoices
      .filter(inv => {
        if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'void') return false;
        return new Date(inv.dueDate) < now;
      })
      .reduce((sum, inv) => sum + (inv.remainingAmount || inv.total), 0);
  }, [invoices]);

  if (!user) {
    return <div>Please log in to view invoices.</div>;
  }

  return (
    <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tight">Invoices</h1>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 mt-2 font-medium">
                Manage your billing cycles and track real-time payment statuses
              </p>
            </div>

            <Button className="mt-4 md:mt-0 bg-clio-blue hover:bg-clio-blue-hover text-white font-bold uppercase tracking-tight text-xs h-11 px-8 shadow-lg shadow-clio-blue/20" onClick={handleCreateInvoice}>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Total Invoices</CardTitle>
                <div className="p-1.5 rounded-lg bg-clio-blue/10">
                  <Receipt className="h-3.5 w-3.5 text-clio-blue" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-black text-clio-gray-900 dark:text-white">{totalInvoices}</div>
                <p className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-1">
                  {draftInvoices} drafts, {paidInvoices} paid
                </p>
              </CardContent>
            </Card>

            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Total Revenue</CardTitle>
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-1">
                  From paid invoices
                </p>
              </CardContent>
            </Card>

            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Outstanding</CardTitle>
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {formatCurrency(totalOutstanding)}
                </div>
                <p className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-1">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>

            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Overdue</CardTitle>
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-black text-red-600 dark:text-red-400">
                  {formatCurrency(overdueAmount)}
                </div>
                <p className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-1">
                  {overdueInvoices} invoices overdue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-clio-gray-400 w-4 h-4" />
              <Input
                placeholder="Search invoices by customer, invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus | 'all')}>
              <SelectTrigger className="w-[200px] bg-white dark:bg-clio-gray-900 font-bold border-clio-gray-200 dark:border-clio-gray-800">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-clio-gray-400" />
                  <SelectValue placeholder="Status Filter" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Table */}
          <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-clio-gray-50/50 dark:bg-clio-gray-800/20 border-b border-clio-gray-100 dark:border-clio-gray-800 px-8 py-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-clio-gray-500">Invoice Ledger ({filteredInvoices.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-clio-gray-950">
                  <Receipt className="w-16 h-16 text-clio-gray-200 dark:text-clio-gray-800 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">No invoices found</h3>
                  <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium max-w-sm mx-auto">
                    {searchQuery ? 'Try adjusting your search criteria or clearing filters.' : 'Your invoice list is empty. Generate your first invoice from an accepted quote.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/30 dark:bg-clio-gray-900/50">
                        <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Invoice #</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Customer</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Dates</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Amount</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Status</th>
                        <th className="text-right py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-clio-gray-50 dark:divide-clio-gray-800/50">
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-clio-gray-50/50 dark:hover:bg-clio-gray-900/50 transition-colors group">
                          <td className="py-5 px-8">
                            <div className="font-black text-clio-gray-900 dark:text-white group-hover:text-clio-blue transition-colors">#{invoice.invoiceNumber}</div>
                          </td>
                          <td className="py-5 px-8">
                            <div className="font-bold text-clio-gray-900 dark:text-white">{invoice.customerName}</div>
                            <div className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400">{invoice.customerEmail}</div>
                          </td>
                          <td className="py-5 px-8">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-clio-gray-400 w-10">Issued</span>
                                <span className="text-xs font-bold text-clio-gray-700 dark:text-clio-gray-300">{formatDate(invoice.issueDate)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-clio-gray-400 w-10">Due</span>
                                <span className={cn("text-xs font-bold", isOverdue(invoice) ? 'text-red-600' : 'text-clio-gray-700 dark:text-clio-gray-300')}>
                                  {formatDate(invoice.dueDate)}
                                  {isOverdue(invoice) && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[8px] font-black uppercase tracking-widest">Overdue</span>}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-8">
                            <div className="font-black text-clio-gray-900 dark:text-white">{formatCurrency(invoice.total)}</div>
                            {invoice.paidAmount > 0 && (
                              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-tight mt-1">
                                {formatCurrency(invoice.paidAmount)} paid
                              </div>
                            )}
                          </td>
                          <td className="py-5 px-8">
                            <Badge className={cn(
                              "shadow-none text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-none flex items-center gap-1.5 w-fit",
                              invoice.status === 'draft' && "bg-clio-gray-100 text-clio-gray-600 dark:bg-clio-gray-800 dark:text-clio-gray-400",
                              invoice.status === 'sent' && "bg-clio-blue/10 text-clio-blue",
                              invoice.status === 'paid' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
                              invoice.status === 'overdue' && "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
                              invoice.status === 'partial' && "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                            )}>
                              {getStatusIcon(invoice.status)}
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="py-5 px-8 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-clio-gray-400 hover:text-clio-blue hover:bg-clio-blue/5"
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-clio-gray-400 hover:text-clio-blue hover:bg-clio-blue/5"
                                onClick={() => handleEditInvoice(invoice)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-clio-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                                onClick={() => handleDownloadInvoice(invoice)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white"
                                onClick={() => handleInvoiceMenu(invoice)}
                              >
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

        {/* Invoice Modal */}
        <InvoiceModal
          invoice={selectedInvoice}
          isOpen={isInvoiceModalOpen}
          onClose={handleCloseInvoiceModal}
        />
    </MainLayout>
  );
}
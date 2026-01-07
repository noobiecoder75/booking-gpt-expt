'use client';

import { useState, useMemo } from 'react';
import { useInvoicesQuery } from '@/hooks/queries/useInvoicesQuery';
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
import { InvoiceStatus } from '@/types/financial';
import { Download, Eye, Mail, Search, FileText } from 'lucide-react';

export function InvoiceList() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allInvoices = [] } = useInvoicesQuery();

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = allInvoices;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((inv) =>
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.customerName.toLowerCase().includes(query) ||
        inv.customerEmail.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    // Sort by date (newest first)
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allInvoices, searchQuery, statusFilter]);

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants: Record<InvoiceStatus, string> = {
      draft: 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400',
      sent: 'bg-clio-blue/10 dark:bg-clio-blue/20 text-clio-blue',
      paid: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      overdue: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
      cancelled: 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400',
      partial: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    };

    return (
      <Badge className={`${variants[status]} border-none shadow-none text-[10px] font-bold uppercase tracking-tight`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-clio-gray-400" />
          <Input
            placeholder="Search invoices by number, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-clio-gray-50 dark:bg-clio-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-clio-gray-400" />
          </div>
          <p className="text-lg font-bold text-clio-gray-900 dark:text-white">No invoices found</p>
          <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl overflow-hidden bg-white dark:bg-clio-gray-950">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-clio-gray-200 dark:border-clio-gray-800">
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Invoice #</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Customer</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Issue Date</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Due Date</TableHead>
                <TableHead className="text-right text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Amount</TableHead>
                <TableHead className="text-right text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Paid</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Status</TableHead>
                <TableHead className="text-right text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-clio-gray-50 dark:hover:bg-clio-gray-900/50 transition-colors border-b border-clio-gray-100 dark:border-clio-gray-800 last:border-0">
                  <TableCell className="font-bold text-clio-gray-900 dark:text-white">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-bold text-clio-gray-900 dark:text-white">{invoice.customerName}</div>
                      <div className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400">{invoice.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-clio-gray-600 dark:text-clio-gray-400">{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-clio-gray-600 dark:text-clio-gray-400">{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-bold text-clio-gray-900 dark:text-white">
                    ${invoice.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-clio-gray-600 dark:text-clio-gray-400">
                    ${invoice.paidAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-clio-gray-400 hover:text-clio-blue hover:bg-clio-blue/10" title="View Invoice">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-clio-gray-400 hover:text-clio-blue hover:bg-clio-blue/10" title="Download PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-clio-gray-400 hover:text-clio-blue hover:bg-clio-blue/10" title="Send Email">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

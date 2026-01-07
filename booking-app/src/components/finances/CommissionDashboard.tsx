'use client';

import { useState, useMemo } from 'react';
import { useCommissionsQuery } from '@/hooks/queries/useCommissionsQuery';
import { useCommissionMutations } from '@/hooks/mutations/useCommissionMutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CommissionStatus } from '@/types/financial';
import { CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react';

export function CommissionDashboard() {
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | 'all'>('all');

  const { data: allCommissions = [] } = useCommissionsQuery();
  const { approve, markAsPaid } = useCommissionMutations();

  const totalEarned = useMemo(() => {
    return allCommissions.reduce((sum, com) => sum + com.commissionAmount, 0);
  }, [allCommissions]);

  const totalPaid = useMemo(() => {
    return allCommissions
      .filter(com => com.status === 'paid')
      .reduce((sum, com) => sum + com.commissionAmount, 0);
  }, [allCommissions]);

  const totalPending = useMemo(() => {
    return allCommissions
      .filter(com => com.status === 'pending')
      .reduce((sum, com) => sum + com.commissionAmount, 0);
  }, [allCommissions]);

  // Filter commissions
  const filteredCommissions = useMemo(() => {
    let filtered = statusFilter === 'all'
      ? allCommissions
      : allCommissions.filter((com) => com.status === statusFilter);

    // Sort by date (newest first)
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allCommissions, statusFilter]);

  const getStatusBadge = (status: CommissionStatus) => {
    const variants: Record<CommissionStatus, string> = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      approved: 'bg-clio-blue/10 dark:bg-clio-blue/20 text-clio-blue',
      paid: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      disputed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    };

    return (
      <Badge className={`${variants[status]} border-none shadow-none text-[10px] font-bold uppercase tracking-tight`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleApprove = (commissionId: string) => {
    approve.mutate(commissionId);
  };

  const handleMarkAsPaid = (commissionId: string) => {
    markAsPaid.mutate({
      id: commissionId,
      paymentMethod: 'bank_transfer'
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-clio-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-clio-gray-900 dark:text-white">${totalEarned.toFixed(2)}</div>
            <p className="text-xs text-clio-gray-500 dark:text-clio-gray-400">All time commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-clio-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-clio-gray-900 dark:text-white">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-clio-gray-500 dark:text-clio-gray-400">Paid to agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Pending</CardTitle>
            <Clock className="h-4 w-4 text-clio-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-clio-gray-900 dark:text-white">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-clio-gray-500 dark:text-clio-gray-400">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Commission List */}
      {filteredCommissions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-clio-gray-50 dark:bg-clio-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-clio-gray-400" />
          </div>
          <p className="text-lg font-bold text-clio-gray-900 dark:text-white">No commissions found</p>
          <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl overflow-hidden bg-white dark:bg-clio-gray-950">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-clio-gray-200 dark:border-clio-gray-800">
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Agent</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Customer</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Booking Amount</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Rate</TableHead>
                <TableHead className="text-right text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Commission</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Earned Date</TableHead>
                <TableHead className="text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Status</TableHead>
                <TableHead className="text-right text-[10px] font-bold text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-tight">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommissions.map((commission) => (
                <TableRow key={commission.id} className="hover:bg-clio-gray-50 dark:hover:bg-clio-gray-900/50 transition-colors border-b border-clio-gray-100 dark:border-clio-gray-800 last:border-0">
                  <TableCell className="font-bold text-clio-gray-900 dark:text-white">{commission.agentName}</TableCell>
                  <TableCell className="font-medium text-clio-gray-600 dark:text-clio-gray-400">{commission.customerName}</TableCell>
                  <TableCell className="font-medium text-clio-gray-600 dark:text-clio-gray-400">${commission.bookingAmount.toFixed(2)}</TableCell>
                  <TableCell className="font-medium text-clio-gray-600 dark:text-clio-gray-400">{commission.commissionRate.toFixed(1)}%</TableCell>
                  <TableCell className="text-right font-bold text-clio-gray-900 dark:text-white">
                    ${commission.commissionAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-medium text-clio-gray-600 dark:text-clio-gray-400">{new Date(commission.earnedDate).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(commission.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {commission.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(commission.id)}
                          className="font-bold text-clio-blue border-clio-blue/20 hover:bg-clio-blue/10"
                        >
                          Approve
                        </Button>
                      )}
                      {commission.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(commission.id)}
                          className="font-bold text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          Mark as Paid
                        </Button>
                      )}
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

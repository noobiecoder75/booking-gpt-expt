'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCommissionsQuery } from '@/hooks/queries/useCommissionsQuery';
import { useCommissionMutations } from '@/hooks/mutations/useCommissionMutations';
import { useAuthStore } from '@/store/auth-store';
import { MainLayout } from '@/components/layout/MainLayout';
import { CommissionModal } from '@/components/commissions/CommissionModal';
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  User,
  Calendar,
  Award,
  MoreHorizontal,
  Download,
  Eye
} from 'lucide-react';
import { Commission, CommissionStatus } from '@/types/financial';

export default function CommissionsPage() {
  const { user } = useAuthStore();
  const { data: commissions = [] } = useCommissionsQuery();
  const { approve, bulkApprove, markAsPaid, bulkMarkAsPaid } = useCommissionMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | 'all'>('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [filteredCommissions, setFilteredCommissions] = useState<Commission[]>([]);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);

  useEffect(() => {
    let filtered = commissions;

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(commission =>
        commission.agentName.toLowerCase().includes(query) ||
        commission.customerName.toLowerCase().includes(query) ||
        commission.bookingId.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(commission => commission.status === statusFilter);
    }

    if (agentFilter !== 'all') {
      filtered = filtered.filter(commission => commission.agentId === agentFilter);
    }

    setFilteredCommissions(filtered);
  }, [commissions, searchQuery, statusFilter, agentFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: CommissionStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'paid':
        return <DollarSign className="w-4 h-4" />;
      case 'disputed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: CommissionStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCommissionSelect = (commissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedCommissions([...selectedCommissions, commissionId]);
    } else {
      setSelectedCommissions(selectedCommissions.filter(id => id !== commissionId));
    }
  };

  const handleBulkApprove = () => {
    bulkApprove.mutate(selectedCommissions);
    setSelectedCommissions([]);
  };

  const handleBulkPay = () => {
    bulkMarkAsPaid.mutate({
      ids: selectedCommissions,
      paymentMethod: 'bank_transfer'
    });
    setSelectedCommissions([]);
  };

  const handleViewCommission = (commission: Commission) => {
    setSelectedCommission(commission);
    setIsCommissionModalOpen(true);
  };

  const handleCloseCommissionModal = () => {
    setIsCommissionModalOpen(false);
    setSelectedCommission(null);
  };

  // Get unique agents for filter
  const agents = useMemo(() => {
    return Array.from(new Set(commissions.map(c => c.agentId)))
      .map(agentId => {
        const commission = commissions.find(c => c.agentId === agentId);
        return { id: agentId, name: commission?.agentName || 'Unknown' };
      });
  }, [commissions]);

  // Summary statistics
  const totalEarned = useMemo(() => {
    return commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  }, [commissions]);

  const totalPaid = useMemo(() => {
    return commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
  }, [commissions]);

  const totalPending = useMemo(() => {
    return commissions
      .filter(c => c.status === 'pending' || c.status === 'approved')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
  }, [commissions]);

  const pendingCommissions = useMemo(() => {
    return commissions.filter(c => c.status === 'pending').length;
  }, [commissions]);

  const approvedCommissions = useMemo(() => {
    return commissions.filter(c => c.status === 'approved').length;
  }, [commissions]);

  // Commission analytics
  const commissionAnalytics = useMemo(() => {
    const agentMap = new Map<string, {
      agentId: string;
      agentName: string;
      totalCommissions: number;
      totalBookings: number;
      commissionRate: number;
      averageCommission: number;
    }>();

    commissions.forEach(commission => {
      const existing = agentMap.get(commission.agentId) || {
        agentId: commission.agentId,
        agentName: commission.agentName,
        totalCommissions: 0,
        totalBookings: 0,
        commissionRate: commission.commissionRate,
        averageCommission: 0,
      };

      existing.totalCommissions += commission.commissionAmount;
      existing.totalBookings += 1;
      agentMap.set(commission.agentId, existing);
    });

    return Array.from(agentMap.values())
      .map(agent => ({
        ...agent,
        averageCommission: agent.totalCommissions / agent.totalBookings,
      }))
      .sort((a, b) => b.totalCommissions - a.totalCommissions);
  }, [commissions]);

  if (!user) {
    return <div>Please log in to view commissions.</div>;
  }

  return (
    <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tight">Commissions</h1>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 mt-2 font-medium">
                Track and manage agent revenue and performance metrics
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              {selectedCommissions.length > 0 && (
                <>
                  <Button variant="outline" className="border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-xs h-11" onClick={handleBulkApprove}>
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                    Approve ({selectedCommissions.length})
                  </Button>
                  <Button className="bg-clio-blue hover:bg-clio-blue-hover text-white font-bold uppercase tracking-tight text-xs h-11 shadow-lg shadow-clio-blue/20" onClick={handleBulkPay}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay ({selectedCommissions.length})
                  </Button>
                </>
              )}
              <Button variant="outline" className="border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-xs h-11 px-6">
                <Download className="w-4 h-4 mr-2 text-clio-blue" />
                Export Data
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Total Earned</CardTitle>
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalEarned)}
                </div>
                <p className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-1">
                  Lifetime revenue
                </p>
              </CardContent>
            </Card>

            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Total Paid</CardTitle>
                <div className="p-1.5 rounded-lg bg-clio-blue/10">
                  <DollarSign className="h-3.5 w-3.5 text-clio-blue" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-black text-clio-blue">
                  {formatCurrency(totalPaid)}
                </div>
                <p className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-1">
                  Settled with agents
                </p>
              </CardContent>
            </Card>

            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Pending</CardTitle>
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {formatCurrency(totalPending)}
                </div>
                <p className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-1">
                  {pendingCommissions + approvedCommissions} items awaiting payout
                </p>
              </CardContent>
            </Card>

            <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Active Agents</CardTitle>
                <div className="p-1.5 rounded-lg bg-clio-navy/10">
                  <User className="h-3.5 w-3.5 text-clio-navy dark:text-clio-gray-300" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-black text-clio-gray-900 dark:text-white">
                  {agents.length}
                </div>
                <p className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight mt-1">
                  Earning commissions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Agent Performance Cards */}
          {commissionAnalytics.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xs font-black uppercase tracking-widest text-clio-gray-500 mb-6 flex items-center">
                <Award className="w-4 h-4 mr-2 text-amber-500" />
                Top Performing Agents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {commissionAnalytics.slice(0, 6).map((analytics) => (
                  <Card key={analytics.agentId} className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-shadow group">
                    <CardHeader className="pb-4 bg-clio-gray-50/30 dark:bg-clio-gray-800/10 border-b border-clio-gray-50 dark:border-clio-gray-800/50">
                      <CardTitle className="text-sm font-black flex items-center text-clio-gray-900 dark:text-white group-hover:text-clio-blue transition-colors uppercase tracking-tight">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-clio-gray-900 flex items-center justify-center mr-3 border border-clio-gray-100 dark:border-clio-gray-800 shadow-sm">
                          <User className="w-4 h-4 text-clio-gray-400" />
                        </div>
                        {analytics.agentName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-clio-gray-400 uppercase">Total Earned</span>
                            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{formatCurrency(analytics.totalCommissions)}</div>
                          </div>
                          <div className="space-y-1 text-right">
                            <span className="text-[10px] font-bold text-clio-gray-400 uppercase">Rate</span>
                            <div>
                              <Badge className="bg-clio-blue/10 text-clio-blue text-[10px] font-black border-none shadow-none px-2 py-0.5">
                                {analytics.commissionRate.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-clio-gray-50 dark:border-clio-gray-800/50 grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-clio-gray-400 uppercase">Bookings</span>
                            <div className="text-sm font-bold text-clio-gray-700 dark:text-clio-gray-300">{analytics.totalBookings}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-clio-gray-400 uppercase">Average</span>
                            <div className="text-sm font-bold text-clio-gray-700 dark:text-clio-gray-300">{formatCurrency(analytics.averageCommission)}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-clio-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by agent, customer, or booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CommissionStatus | 'all')}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-clio-gray-900 font-bold border-clio-gray-200 dark:border-clio-gray-800">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-clio-gray-400" />
                  <SelectValue placeholder="Status Filter" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-clio-gray-900 font-bold border-clio-gray-200 dark:border-clio-gray-800">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-clio-gray-400" />
                  <SelectValue placeholder="Agent Filter" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800">
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Commissions Table */}
          <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-clio-gray-50/50 dark:bg-clio-gray-800/20 border-b border-clio-gray-100 dark:border-clio-gray-800 px-8 py-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-clio-gray-500">Commission Ledger ({filteredCommissions.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredCommissions.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-clio-gray-950">
                  <DollarSign className="w-16 h-16 text-clio-gray-200 dark:text-clio-gray-800 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">No commissions found</h3>
                  <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium max-w-sm mx-auto">
                    {searchQuery ? 'Try adjusting your search criteria or clearing filters.' : 'Commissions will appear here automatically as bookings are confirmed.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/30 dark:bg-clio-gray-900/50">
                        <th className="py-4 px-8 text-left w-10">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-clio-gray-300 text-clio-blue focus:ring-clio-blue"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCommissions(filteredCommissions.map(c => c.id));
                              } else {
                                setSelectedCommissions([]);
                              }
                            }}
                            checked={selectedCommissions.length === filteredCommissions.length && filteredCommissions.length > 0}
                          />
                        </th>
                        <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Agent</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Customer</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400 text-right">Booking</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400 text-right">Commission</th>
                        <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Status</th>
                        <th className="text-right py-4 px-8 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-clio-gray-50 dark:divide-clio-gray-800/50">
                      {filteredCommissions.map((commission) => (
                        <tr key={commission.id} className="hover:bg-clio-gray-50/50 dark:hover:bg-clio-gray-900/50 transition-colors group">
                          <td className="py-5 px-8">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-clio-gray-300 text-clio-blue focus:ring-clio-blue"
                              checked={selectedCommissions.includes(commission.id)}
                              onChange={(e) => handleCommissionSelect(commission.id, e.target.checked)}
                            />
                          </td>
                          <td className="py-5 px-8">
                            <div className="font-bold text-clio-gray-900 dark:text-white">{commission.agentName}</div>
                            <div className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest mt-0.5">{formatDate(commission.earnedDate)}</div>
                          </td>
                          <td className="py-5 px-8">
                            <div className="font-bold text-clio-gray-900 dark:text-white">{commission.customerName}</div>
                            <div className="text-[10px] font-medium text-clio-gray-500 dark:text-clio-gray-400">#{commission.bookingId.slice(0, 8)}...</div>
                          </td>
                          <td className="py-5 px-8 text-right">
                            <div className="font-bold text-clio-gray-900 dark:text-white">{formatCurrency(commission.bookingAmount)}</div>
                          </td>
                          <td className="py-5 px-8 text-right">
                            <div className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(commission.commissionAmount)}</div>
                            <div className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">{commission.commissionRate.toFixed(1)}%</div>
                          </td>
                          <td className="py-5 px-8">
                            <Badge className={cn(
                              "shadow-none text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-none flex items-center gap-1.5 w-fit",
                              commission.status === 'pending' && "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
                              commission.status === 'approved' && "bg-clio-blue/10 text-clio-blue",
                              commission.status === 'paid' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
                              commission.status === 'disputed' && "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                            )}>
                              {getStatusIcon(commission.status)}
                              {commission.status}
                            </Badge>
                          </td>
                          <td className="py-5 px-8 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-clio-gray-400 hover:text-clio-blue hover:bg-clio-blue/5"
                                onClick={() => handleViewCommission(commission)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {commission.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-clio-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => approve.mutate(commission.id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {commission.status === 'approved' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-clio-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => markAsPaid.mutate({
                                    id: commission.id,
                                    paymentMethod: 'bank_transfer'
                                  })}
                                >
                                  <DollarSign className="w-4 h-4" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white">
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

        {/* Commission Modal */}
        <CommissionModal
          commission={selectedCommission}
          isOpen={isCommissionModalOpen}
          onClose={handleCloseCommissionModal}
        />
    </MainLayout>
  );
}
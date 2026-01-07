'use client';

import React from 'react';
import { Commission } from '@/types/financial';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DollarSign, User, Calendar, Award, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface CommissionTemplateProps {
  commission: Commission;
}

export const CommissionTemplate: React.FC<CommissionTemplateProps> = ({ commission }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = () => {
    const statusConfig: Record<string, { className: string; icon: React.ReactNode }> = {
      pending: { className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30', icon: <Clock className="w-3 h-3" /> },
      approved: { className: 'bg-clio-blue/10 dark:bg-clio-blue/20 text-clio-blue border-clio-blue/20', icon: <CheckCircle className="w-3 h-3" /> },
      paid: { className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30', icon: <DollarSign className="w-3 h-3" /> },
      disputed: { className: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30', icon: <AlertCircle className="w-3 h-3" /> },
    };

    const config = statusConfig[commission.status] || statusConfig.pending;

    return (
      <Badge className={`${config.className} flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest border`}>
        {config.icon}
        {commission.status}
      </Badge>
    );
  };

  return (
    <div className="bg-white dark:bg-clio-gray-950 p-12 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800 shadow-sm print:shadow-none">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tight mb-2">Commission Statement</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 bg-clio-gray-50 dark:bg-clio-gray-900 px-3 py-1 rounded-lg border border-clio-gray-100 dark:border-clio-gray-800 inline-block">ID: {commission.id.substring(0, 8).toUpperCase()}</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-2">Statement Status</div>
          {getStatusBadge()}
        </div>
      </div>

      <Separator className="my-8 bg-clio-gray-100 dark:bg-clio-gray-800" />

      {/* Agent & Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-clio-gray-50 dark:bg-clio-gray-900/50 p-6 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white dark:bg-clio-gray-950 rounded-xl flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-clio-blue" />
            </div>
            <h3 className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Agent Information</h3>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Name</span>
              <div className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">{commission.agentName}</div>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Agent ID</span>
              <div className="font-medium text-clio-gray-600 dark:text-clio-gray-400 text-xs tracking-wider">{commission.agentId}</div>
            </div>
          </div>
        </div>

        <div className="bg-clio-gray-50 dark:bg-clio-gray-900/50 p-6 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white dark:bg-clio-gray-950 rounded-xl flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Customer Information</h3>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Name</span>
              <div className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">{commission.customerName}</div>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Customer ID</span>
              <div className="font-medium text-clio-gray-600 dark:text-clio-gray-400 text-xs tracking-wider">{commission.customerId}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="mb-8 bg-white dark:bg-clio-gray-950 p-6 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-6 ml-1">Booking Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Booking ID</span>
            <div className="font-medium text-clio-gray-900 dark:text-white text-xs truncate">{commission.bookingId}</div>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Quote ID</span>
            <div className="font-medium text-clio-gray-900 dark:text-white text-xs truncate">{commission.quoteId}</div>
          </div>
          {commission.invoiceId && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Invoice ID</span>
              <div className="font-medium text-clio-gray-900 dark:text-white text-xs truncate">{commission.invoiceId}</div>
            </div>
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Booking Type</span>
            <div className="font-bold text-clio-blue uppercase tracking-tight text-xs">{commission.bookingType || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div className="mb-8 bg-clio-blue/5 dark:bg-clio-blue/10 p-8 rounded-2xl border border-clio-blue/10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm">
            <Award className="w-6 h-6 text-clio-blue" />
          </div>
          <h3 className="font-black text-clio-gray-900 dark:text-white uppercase tracking-tight text-xl">Commission Breakdown</h3>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-clio-blue/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500">Booking Amount</span>
            <span className="text-xl font-black text-clio-gray-900 dark:text-white">{formatCurrency(commission.bookingAmount)}</span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-clio-blue/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500">Commission Rate</span>
            <span className="text-xl font-black text-clio-blue">{commission.commissionRate.toFixed(2)}%</span>
          </div>

          <div className="flex justify-between items-center py-6 bg-white dark:bg-clio-gray-900 rounded-xl px-6 border border-clio-blue/20 shadow-sm">
            <span className="text-xs font-black uppercase tracking-widest text-clio-gray-900 dark:text-white">Total Commission Due</span>
            <span className="text-3xl font-black text-green-600">
              {formatCurrency(commission.commissionAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="mb-8 bg-white dark:bg-clio-gray-950 p-6 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-clio-gray-50 dark:bg-clio-gray-900 rounded-xl flex items-center justify-center border border-clio-gray-100 dark:border-clio-gray-800">
            <Calendar className="w-5 h-5 text-clio-gray-400" />
          </div>
          <h3 className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Payment Details</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Earned Date</span>
            <div className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight text-xs">{formatDate(commission.earnedDate)}</div>
          </div>
          {commission.paidDate && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Paid Date</span>
              <div className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight text-xs">{formatDate(commission.paidDate)}</div>
            </div>
          )}
          {commission.paymentMethod && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Method</span>
              <div className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight text-xs">{commission.paymentMethod.replace('_', ' ')}</div>
            </div>
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 block mb-1">Currency</span>
            <div className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight text-xs">USD</div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {commission.notes && (
        <div className="mb-8 bg-clio-gray-50 dark:bg-clio-gray-900/50 p-6 rounded-2xl border border-clio-gray-100 dark:border-clio-gray-800">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-3">Auditor Notes</h3>
          <p className="text-sm font-medium text-clio-gray-600 dark:text-clio-gray-400 leading-relaxed italic whitespace-pre-wrap">"{commission.notes}"</p>
        </div>
      )}

      {/* Footer */}
      <Separator className="my-10 bg-clio-gray-100 dark:bg-clio-gray-800" />
      <div className="text-center">
        <p className="text-[8px] font-black uppercase tracking-widest text-clio-gray-400">Statement generated on {formatDate(new Date().toISOString())} • Internal Record Only</p>
        <p className="mt-2 text-[10px] font-bold text-clio-blue uppercase tracking-tight">For questions, contact accounting@bookinggpt.com</p>
      </div>
    </div>
  );
};

export default CommissionTemplate;

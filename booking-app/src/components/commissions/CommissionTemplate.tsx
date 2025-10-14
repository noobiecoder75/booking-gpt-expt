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
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
      approved: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-3 h-3" /> },
      paid: { color: 'bg-green-100 text-green-800', icon: <DollarSign className="w-3 h-3" /> },
      disputed: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-3 h-3" /> },
    };

    const config = statusConfig[commission.status] || statusConfig.pending;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm print:shadow-none">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Commission Statement</h1>
          <p className="text-gray-600">ID: {commission.id.substring(0, 8).toUpperCase()}</p>
        </div>
        <div className="text-right">
          <div className="text-gray-600 mb-2">Status</div>
          {getStatusBadge()}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Agent & Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg">Agent Information</h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">Name:</span>
                <div className="font-medium">{commission.agentName}</div>
              </div>
              <div>
                <span className="text-gray-600">Agent ID:</span>
                <div className="font-medium text-sm">{commission.agentId}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-lg">Customer Information</h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">Name:</span>
                <div className="font-medium">{commission.customerName}</div>
              </div>
              <div>
                <span className="text-gray-600">Customer ID:</span>
                <div className="font-medium text-sm">{commission.customerId}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Details */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">Booking Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Booking ID:</span>
              <div className="font-medium">{commission.bookingId}</div>
            </div>
            <div>
              <span className="text-gray-600">Quote ID:</span>
              <div className="font-medium">{commission.quoteId}</div>
            </div>
            {commission.invoiceId && (
              <div>
                <span className="text-gray-600">Invoice ID:</span>
                <div className="font-medium">{commission.invoiceId}</div>
              </div>
            )}
            <div>
              <span className="text-gray-600">Booking Type:</span>
              <div className="font-medium capitalize">{commission.bookingType || 'N/A'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Breakdown */}
      <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-xl">Commission Breakdown</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-blue-100">
              <span className="text-gray-700 font-medium">Booking Amount:</span>
              <span className="text-xl font-bold">{formatCurrency(commission.bookingAmount)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-blue-100">
              <span className="text-gray-700 font-medium">Commission Rate:</span>
              <span className="text-xl font-bold text-blue-600">{commission.commissionRate.toFixed(2)}%</span>
            </div>

            <div className="flex justify-between items-center py-4 bg-white rounded-lg px-4">
              <span className="text-gray-900 font-bold text-lg">Total Commission:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(commission.commissionAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-lg">Payment Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Earned Date:</span>
              <div className="font-medium">{formatDate(commission.earnedDate)}</div>
            </div>
            {commission.paidDate && (
              <div>
                <span className="text-gray-600">Paid Date:</span>
                <div className="font-medium">{formatDate(commission.paidDate)}</div>
              </div>
            )}
            {commission.paymentMethod && (
              <div>
                <span className="text-gray-600">Payment Method:</span>
                <div className="font-medium capitalize">{commission.paymentMethod.replace('_', ' ')}</div>
              </div>
            )}
            <div>
              <span className="text-gray-600">Currency:</span>
              <div className="font-medium">USD</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {commission.notes && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-2">Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{commission.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <Separator className="my-6" />
      <div className="text-center text-sm text-gray-500">
        <p>Commission statement generated on {formatDate(new Date().toISOString())}</p>
        <p className="mt-1">For questions, please contact accounting@bookinggpt.com</p>
      </div>
    </div>
  );
};

export default CommissionTemplate;

'use client';

import React from 'react';
import { Invoice } from '@/types/financial';

interface InvoiceTemplateProps {
  invoice: Invoice;
  companyInfo?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    website?: string;
    taxId?: string;
  };
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  companyInfo = {
    name: 'Your Travel Company',
    address: '123 Business St',
    city: 'Business City',
    state: 'BC',
    zip: '12345',
    phone: '(555) 123-4567',
    email: 'invoices@travelcompany.com',
    website: 'www.travelcompany.com',
    taxId: '12-3456789'
  }
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-clio-gray-950 p-12 border border-clio-gray-100 dark:border-clio-gray-800 shadow-sm rounded-2xl" id="invoice-template">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tight">{companyInfo.name}</h1>
          <div className="text-clio-gray-500 dark:text-clio-gray-400 mt-4 space-y-1 text-sm font-medium uppercase tracking-widest">
            <p>{companyInfo.address}</p>
            <p>{companyInfo.city}, {companyInfo.state} {companyInfo.zip}</p>
            <p>Phone: {companyInfo.phone}</p>
            <p>Email: {companyInfo.email}</p>
            {companyInfo.website && <p>Web: {companyInfo.website}</p>}
            {companyInfo.taxId && <p>Tax ID: {companyInfo.taxId}</p>}
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-4xl font-black text-clio-blue mb-6 tracking-tighter">INVOICE</h2>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400"><span className="text-clio-gray-900 dark:text-white">Invoice #:</span> {invoice.invoiceNumber}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400"><span className="text-clio-gray-900 dark:text-white">Issue Date:</span> {formatDate(invoice.issueDate)}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400"><span className="text-clio-gray-900 dark:text-white">Due Date:</span> {formatDate(invoice.dueDate)}</p>
            <div className="mt-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                invoice.status === 'paid' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30' :
                invoice.status === 'sent' ? 'bg-clio-blue/10 dark:bg-clio-blue/20 text-clio-blue border border-clio-blue/20' :
                invoice.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30' :
                'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400'
              }`}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-12 bg-clio-gray-50 dark:bg-clio-gray-900/50 p-6 rounded-xl border border-clio-gray-100 dark:border-clio-gray-800">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-4">Bill To:</h3>
        <div className="text-clio-gray-900 dark:text-white space-y-1">
          <p className="text-lg font-bold uppercase tracking-tight">{invoice.customerName}</p>
          <p className="text-sm font-medium text-clio-gray-500 uppercase tracking-tight">{invoice.customerEmail}</p>
          {invoice.customerAddress && (
            <div className="text-sm font-medium text-clio-gray-500 uppercase tracking-tight mt-2">
              <p>{invoice.customerAddress.street}</p>
              <p>{invoice.customerAddress.city}, {invoice.customerAddress.state} {invoice.customerAddress.zip}</p>
              {invoice.customerAddress.country && <p>{invoice.customerAddress.country}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="mb-12 overflow-hidden rounded-xl border border-clio-gray-100 dark:border-clio-gray-800">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-clio-gray-50 dark:bg-clio-gray-900 border-b border-clio-gray-100 dark:border-clio-gray-800">
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Description</th>
              <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Qty</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Unit Price</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clio-gray-100 dark:divide-clio-gray-800">
            {invoice.items.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-clio-gray-50 dark:hover:bg-clio-gray-900/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight text-sm">{item.description}</div>
                </td>
                <td className="px-6 py-5 text-center text-sm font-bold text-clio-gray-600 dark:text-clio-gray-400">{item.quantity}</td>
                <td className="px-6 py-5 text-right text-sm font-medium text-clio-gray-600 dark:text-clio-gray-400">{formatCurrency(item.unitPrice)}</td>
                <td className="px-6 py-5 text-right font-black text-clio-gray-900 dark:text-white text-sm">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-80 space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Subtotal</span>
            <span className="font-bold text-clio-gray-900 dark:text-white">{formatCurrency(invoice.subtotal)}</span>
          </div>

          {invoice.discountAmount && invoice.discountAmount > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Discount</span>
              <span className="font-bold text-green-600">-{formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}

          {invoice.taxRate > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Tax ({invoice.taxRate}%)</span>
              <span className="font-bold text-clio-gray-900 dark:text-white">{formatCurrency(invoice.taxAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-4 border-t-2 border-clio-gray-900 dark:border-white">
            <span className="text-xs font-black uppercase tracking-widest text-clio-gray-900 dark:text-white">Total Amount</span>
            <span className="text-2xl font-black text-clio-blue">{formatCurrency(invoice.total)}</span>
          </div>

          {invoice.paidAmount > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Amount Paid</span>
                <span className="font-bold text-green-600">-{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-clio-gray-50 dark:bg-clio-gray-900 px-4 rounded-xl border border-clio-gray-100 dark:border-clio-gray-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-900 dark:text-white">Balance Due</span>
                <span className={`text-xl font-black ${invoice.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(invoice.remainingAmount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Information */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="mb-12">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-4 ml-1">Payment History</h3>
          <div className="overflow-hidden rounded-xl border border-clio-gray-100 dark:border-clio-gray-800">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-clio-gray-50 dark:bg-clio-gray-900">
                  <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Date</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Method</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Reference</th>
                  <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clio-gray-100 dark:divide-clio-gray-800">
                {invoice.payments.map((payment, index) => (
                  <tr key={payment.id || index}>
                    <td className="px-6 py-4 text-sm font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                      {new Date(payment.processedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest">
                      {payment.method.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-clio-gray-400">{payment.transactionId || 'N/A'}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-green-600">{formatCurrency(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Terms and Notes */}
      <div className="border-t border-clio-gray-100 dark:border-clio-gray-800 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {invoice.terms && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-900 dark:text-white mb-3">Payment Terms</h3>
              <p className="text-sm font-medium text-clio-gray-500 uppercase tracking-tight leading-relaxed">{invoice.terms}</p>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-900 dark:text-white mb-3">Notes</h3>
            <p className="text-sm font-medium text-clio-gray-500 uppercase tracking-tight leading-relaxed">
              Thank you for your business! Please remit payment by the due date to avoid late fees.
              For questions about this invoice, please contact us at {companyInfo.email} or {companyInfo.phone}.
            </p>
          </div>
        </div>
      </div>

      {/* Footer - GAAP Compliance */}
      <div className="mt-12 pt-8 border-t border-clio-gray-100 dark:border-clio-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-clio-gray-400"><strong className="text-clio-gray-600 dark:text-clio-gray-300">Accounting Basis:</strong> Accrual Method</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-clio-gray-400"><strong className="text-clio-gray-600 dark:text-clio-gray-300">Revenue Recognition:</strong> GAAP ASC 606</p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-clio-gray-400"><strong className="text-clio-gray-600 dark:text-clio-gray-300">Document Type:</strong> Commercial Invoice</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-clio-gray-400"><strong className="text-clio-gray-600 dark:text-clio-gray-300">Currency:</strong> USD</p>
          </div>
          <div className="space-y-1 md:text-right">
            <p className="text-[8px] font-black uppercase tracking-widest text-clio-gray-400"><strong className="text-clio-gray-600 dark:text-clio-gray-300">Generated:</strong> {new Date().toLocaleDateString()}</p>
            {companyInfo.taxId && <p className="text-[8px] font-black uppercase tracking-widest text-clio-gray-400"><strong className="text-clio-gray-600 dark:text-clio-gray-300">Tax ID:</strong> {companyInfo.taxId}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
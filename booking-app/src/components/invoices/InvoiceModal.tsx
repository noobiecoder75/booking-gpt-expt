'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types/financial';
import { InvoiceTemplate } from './InvoiceTemplate';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { X, Download, Mail, Printer } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!invoice) return null;

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // In a real app, this would integrate with email service
    alert(`Email functionality would send invoice ${invoice.invoiceNumber} to ${invoice.customerEmail}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 border-none shadow-strong bg-white dark:bg-clio-gray-900">
        <DialogHeader className="flex flex-row items-center justify-between p-8 border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/50 dark:bg-clio-gray-900/50">
          <div>
            <DialogTitle className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
              Invoice {invoice.invoiceNumber}
            </DialogTitle>
            <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest mt-1">Review and manage client invoice</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmail}
              className="h-10 px-4 bg-white dark:bg-clio-gray-900 text-clio-gray-600 dark:text-clio-gray-300 border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-[10px] hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800"
            >
              <Mail className="w-3.5 h-3.5 mr-2" />
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-10 px-4 bg-white dark:bg-clio-gray-900 text-clio-gray-600 dark:text-clio-gray-300 border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-[10px] hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800"
            >
              <Printer className="w-3.5 h-3.5 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="h-10 px-4 bg-white dark:bg-clio-gray-900 text-clio-blue border-clio-blue/30 font-bold uppercase tracking-tight text-[10px] hover:bg-clio-blue/10"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 transition-colors text-clio-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-8">
          <InvoiceTemplate invoice={invoice} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceModal;
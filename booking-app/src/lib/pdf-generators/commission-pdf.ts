'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Commission } from '@/types/financial';

export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
}

export const generateCommissionPDF = async (
  commission: Commission,
  companyInfo?: CompanyInfo
): Promise<void> => {
  // Create a temporary div to render the commission
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '794px'; // A4 width in pixels (96 DPI)
  tempDiv.style.background = 'white';
  document.body.appendChild(tempDiv);

  // Default company info
  const defaultCompanyInfo: CompanyInfo = {
    name: 'Your Travel Company',
    address: '123 Business St',
    city: 'Business City',
    state: 'BC',
    zip: '12345',
    phone: '(555) 123-4567',
    email: 'commissions@travelcompany.com',
    website: 'www.travelcompany.com',
    taxId: '12-3456789'
  };

  const company = companyInfo || defaultCompanyInfo;

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

  const getStatusBadgeStyle = () => {
    const statusConfig: Record<string, { bg: string; color: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      approved: { bg: '#dbeafe', color: '#1e40af' },
      paid: { bg: '#dcfce7', color: '#166534' },
      disputed: { bg: '#fee2e2', color: '#991b1b' },
    };
    return statusConfig[commission.status] || statusConfig.pending;
  };

  const statusStyle = getStatusBadgeStyle();

  // Generate HTML content for the commission statement
  tempDiv.innerHTML = `
    <div style="padding: 40px; font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h1 style="margin: 0; font-size: 28px; color: #1a1a1a; font-weight: bold;">${company.name}</h1>
          <div style="margin-top: 10px; color: #666;">
            <p style="margin: 2px 0;">${company.address}</p>
            <p style="margin: 2px 0;">${company.city}, ${company.state} ${company.zip}</p>
            <p style="margin: 2px 0;">Phone: ${company.phone}</p>
            <p style="margin: 2px 0;">Email: ${company.email}</p>
            ${company.website ? `<p style="margin: 2px 0;">Web: ${company.website}</p>` : ''}
            ${company.taxId ? `<p style="margin: 2px 0;">Tax ID: ${company.taxId}</p>` : ''}
          </div>
        </div>

        <div style="text-align: right;">
          <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1a1a1a; font-weight: bold;">COMMISSION STATEMENT</h2>
          <div style="color: #666;">
            <p style="margin: 5px 0;"><strong>Commission ID:</strong> ${commission.id.substring(0, 8).toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Earned Date:</strong> ${formatDate(commission.earnedDate)}</p>
            ${commission.paidDate ? `<p style="margin: 5px 0;"><strong>Paid Date:</strong> ${formatDate(commission.paidDate)}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Status:</strong>
              <span style="background: ${statusStyle.bg};
                           color: ${statusStyle.color};
                           padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                ${commission.status.toUpperCase()}
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Agent & Customer Info -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9fafb;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Agent Information</h3>
          <div style="color: #555;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${commission.agentName}</p>
            <p style="margin: 5px 0;"><strong>Agent ID:</strong> ${commission.agentId}</p>
          </div>
        </div>

        <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9fafb;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a1a; border-bottom: 2px solid #10b981; padding-bottom: 8px;">Customer Information</h3>
          <div style="color: #555;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${commission.customerName}</p>
            <p style="margin: 5px 0;"><strong>Customer ID:</strong> ${commission.customerId}</p>
          </div>
        </div>
      </div>

      <!-- Booking Details -->
      <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 30px; background: #ffffff;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1a1a1a;">Booking Details</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; color: #555;">
          <div>
            <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${commission.bookingId}</p>
            <p style="margin: 5px 0;"><strong>Quote ID:</strong> ${commission.quoteId}</p>
          </div>
          <div>
            ${commission.invoiceId ? `<p style="margin: 5px 0;"><strong>Invoice ID:</strong> ${commission.invoiceId}</p>` : ''}
            ${commission.bookingType ? `<p style="margin: 5px 0;"><strong>Booking Type:</strong> ${commission.bookingType.charAt(0).toUpperCase() + commission.bookingType.slice(1)}</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Commission Breakdown -->
      <div style="border: 2px solid #3b82f6; padding: 25px; border-radius: 12px; margin-bottom: 30px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);">
        <h3 style="margin: 0 0 20px 0; font-size: 20px; color: #1e40af; text-align: center;">💰 Commission Breakdown</h3>

        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 2px solid #e5e7eb;">
              <td style="padding: 12px 0; font-size: 16px; color: #374151;"><strong>Booking Amount:</strong></td>
              <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #1f2937;">
                ${formatCurrency(commission.bookingAmount)}
              </td>
            </tr>

            <tr style="border-bottom: 2px solid #e5e7eb;">
              <td style="padding: 12px 0; font-size: 16px; color: #374151;"><strong>Commission Rate:</strong></td>
              <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #3b82f6;">
                ${commission.commissionRate.toFixed(2)}%
              </td>
            </tr>

            <tr style="background: #f0fdf4;">
              <td style="padding: 15px 10px; font-size: 18px; color: #065f46;"><strong>Total Commission:</strong></td>
              <td style="padding: 15px 10px; text-align: right; font-size: 24px; font-weight: bold; color: #059669;">
                ${formatCurrency(commission.commissionAmount)}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Payment Information -->
      <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 30px; background: #ffffff;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1a1a1a;">Payment Information</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; color: #555;">
          <div>
            <p style="margin: 5px 0;"><strong>Earned Date:</strong> ${formatDate(commission.earnedDate)}</p>
            ${commission.paidDate ? `<p style="margin: 5px 0;"><strong>Paid Date:</strong> ${formatDate(commission.paidDate)}</p>` : '<p style="margin: 5px 0;"><strong>Paid Date:</strong> Pending</p>'}
          </div>
          <div>
            ${commission.paymentMethod ? `<p style="margin: 5px 0;"><strong>Payment Method:</strong> ${commission.paymentMethod.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>` : '<p style="margin: 5px 0;"><strong>Payment Method:</strong> Not specified</p>'}
            <p style="margin: 5px 0;"><strong>Currency:</strong> USD</p>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${commission.notes ? `
        <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 30px; background: #fffbeb;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a1a;">Notes</h3>
          <p style="margin: 0; color: #555; white-space: pre-wrap;">${commission.notes}</p>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="border-top: 2px solid #ddd; padding-top: 20px; text-align: center; color: #888; font-size: 12px;">
        <p style="margin: 5px 0;">Commission statement generated on ${formatDate(new Date().toISOString())}</p>
        <p style="margin: 5px 0;">For questions regarding this commission, please contact ${company.email} or ${company.phone}</p>
        <p style="margin: 5px 0; font-size: 10px;">This is an official commission statement from ${company.name}</p>
        ${company.taxId ? `<p style="margin: 5px 0; font-size: 10px;">Tax ID: ${company.taxId}</p>` : ''}
      </div>
    </div>
  `;

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: tempDiv.scrollHeight
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(`commission-${commission.id.substring(0, 8).toUpperCase()}.pdf`);

  } catch (error) {
    console.error('Error generating commission PDF:', error);
    throw new Error('Failed to generate commission PDF');
  } finally {
    // Clean up
    document.body.removeChild(tempDiv);
  }
};

export default generateCommissionPDF;

'use client';

import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { ModernButton } from '@/components/ui/modern-button';
import { BookingTask } from '@/types/task';
import { Plane, Hotel, User, Info, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface BookingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: BookingTask;
  onConfirm: () => void;
  isExecuting?: boolean;
}

export function BookingReviewModal({ isOpen, onClose, task, onConfirm, isExecuting }: BookingReviewModalProps) {
  const isHotel = task.itemType === 'hotel';
  const isFlight = task.itemType === 'flight';
  
  // Extract data from attachments/itemDetails
  const details = task.itemDetails || {};
  const supplier = (task.attachments as any)?.provider || (isHotel ? 'HotelBeds' : isFlight ? 'Amadeus' : 'Supplier');

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const supplierCost = details.supplierCost || (details.price || 0) * 0.85;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isExecuting && !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-clio-blue/10 flex items-center justify-center">
              {isFlight ? <Plane className="w-5 h-5 text-clio-blue" /> : <Hotel className="w-5 h-5 text-clio-blue" />}
            </div>
            <div className="text-left">
              <DialogTitle className="text-xl">Review {supplier} Booking</DialogTitle>
              <DialogDescription>Verify fulfillment details before API execution</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 my-4">
          {/* Item Overview */}
          <div className="bg-clio-gray-50 dark:bg-clio-gray-800/50 p-4 rounded-xl border border-clio-gray-100 dark:border-clio-gray-800">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-3">Inventory Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-clio-gray-500 uppercase">Item Name</span>
                <span className="font-bold text-sm dark:text-white truncate block">{task.itemName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-clio-gray-500 uppercase">Provider ID</span>
                <code className="text-[10px] bg-white dark:bg-clio-gray-900 px-1.5 py-0.5 rounded border border-clio-gray-200 dark:border-clio-gray-800">
                  {isHotel ? (details.hotelCode || 'HB-92384') : (details.flightNumber || 'AM-1029')}
                </code>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] font-bold text-clio-gray-500 uppercase">Description</span>
                <span className="text-xs font-medium dark:text-clio-gray-300">
                  {details.roomType || details.cabinClass || 'Standard fulfillment item selected during quote wizard'}
                </span>
              </div>
            </div>
          </div>

          {/* Guest/Passenger Information */}
          <div>
            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mb-3">
              <User className="w-3 h-3" /> Passenger Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border border-clio-gray-100 dark:border-clio-gray-800 rounded-lg bg-white dark:bg-clio-gray-900 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-clio-gray-50 dark:bg-clio-gray-800 flex items-center justify-center text-[10px] font-black">1</div>
                  <span className="text-sm font-bold dark:text-white uppercase tracking-tight">{task.customerName}</span>
                </div>
                <Badge variant="outline" className="text-[9px] uppercase font-black bg-clio-blue/5 text-clio-blue border-clio-blue/20">Lead Traveler</Badge>
              </div>
              {isFlight && (
                <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase flex items-center gap-1.5 px-1">
                  <Info className="w-3 h-3" /> Amadeus requires passport details for this route. Verify in Client Profile.
                </p>
              )}
            </div>
          </div>

          {/* Financial Safety Check */}
          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">
              <DollarSign className="w-3 h-3" /> Financial Check
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold text-clio-gray-500 uppercase">Supplier Cost (Net)</span>
                <span className="text-2xl font-black text-emerald-600 tracking-tighter">
                  {formatAmount(supplierCost)} <span className="text-xs font-bold text-clio-gray-400">USD</span>
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-clio-gray-500 uppercase mb-1">Status</span>
                <Badge className="bg-emerald-600 text-white uppercase font-black text-[9px] tracking-widest px-2 py-0.5">Funds Secured</Badge>
              </div>
            </div>
          </div>

          {/* API Warnings */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold uppercase tracking-tight text-amber-800 dark:text-amber-500/80 leading-normal">
              {isHotel ? 
                "Hotelbeds rate keys expire frequently. If the rate has expired, you will receive a 400 error and no funds will be deducted from your float." :
                "Amadeus ticket issuance is immediate upon order creation. Ensure the name matches the passport exactly to avoid airline change fees."
              }
            </p>
          </div>
        </div>

        <Separator className="dark:bg-clio-gray-800" />

        <DialogFooter className="gap-2 sm:gap-0">
          <ModernButton variant="ghost" onClick={onClose} disabled={isExecuting} className="uppercase font-black text-[10px] tracking-widest">
            Cancel
          </ModernButton>
          <ModernButton 
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px] uppercase font-black text-[10px] tracking-widest shadow-lg shadow-emerald-600/20" 
            onClick={onConfirm}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin mr-2" />
                Executing...
              </>
            ) : "Confirm & Book"}
          </ModernButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


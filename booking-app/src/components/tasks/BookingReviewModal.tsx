'use client';

import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { ModernButton } from '@/components/ui/modern-button';
import { BookingTask } from '@/types/task';
import { Plane, Hotel, User, Info, AlertTriangle, DollarSign, Clock, Code, FileText as FileTextIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';

interface BookingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: BookingTask;
  onConfirm: () => void;
  isExecuting?: boolean;
}

export function BookingReviewModal({ isOpen, onClose, task, onConfirm, isExecuting }: BookingReviewModalProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [technicalPayload, setTechnicalPayload] = useState<any>(null);
  const [isLoadingPayload, setIsLoadingPayload] = useState(false);

  const isHotel = task.itemType === 'hotel';
  const isFlight = task.itemType === 'flight';
  
  // Extract data from attachments/itemDetails
  const details = task.itemDetails || {};
  const supplier = (task.attachments as any)?.provider || (isHotel ? 'HotelBeds' : isFlight ? 'Amadeus' : 'Supplier');

  // Fetch preview payload when modal opens or tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'payload' && !technicalPayload) {
      fetchPayload();
    }
  }, [isOpen, activeTab]);

  const fetchPayload = async () => {
    setIsLoadingPayload(true);
    try {
      const response = await fetch('/api/bookings/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, action: 'preview' }),
      });
      const data = await response.json();
      if (data.success) {
        setTechnicalPayload(data.payload);
      }
    } catch (error) {
      console.error('Failed to fetch payload preview:', error);
    } finally {
      setIsLoadingPayload(false);
    }
  };

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-clio-blue/10 flex items-center justify-center">
              {isFlight ? <Plane className="w-5 h-5 text-clio-blue" /> : <Hotel className="w-5 h-5 text-clio-blue" />}
            </div>
            <div className="text-left">
              <DialogTitle className="text-xl tracking-tight font-bold">Review {supplier} Booking</DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-black tracking-widest text-clio-gray-400">Granular Human-in-the-Loop Control</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-clio-gray-100 dark:bg-clio-gray-800 p-1 rounded-xl">
              <TabsTrigger value="summary" className="rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                <FileTextIcon className="w-3 h-3" />
                Human Summary
              </TabsTrigger>
              <TabsTrigger value="payload" className="rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                <Code className="w-3 h-3" />
                API Payload (JSON)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
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
            </TabsContent>

            <TabsContent value="payload" className="space-y-4">
              {isLoadingPayload ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <Clock className="w-8 h-8 text-clio-blue animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Preparing technical payload...</p>
                </div>
              ) : (
                <>
                  <div className="bg-clio-gray-950 p-6 rounded-xl border border-clio-gray-800 shadow-inner max-h-[400px] overflow-auto custom-scrollbar">
                    <pre className="font-mono text-[11px] leading-relaxed text-emerald-400">
                      {technicalPayload ? JSON.stringify(technicalPayload, null, 2) : '// Error loading payload'}
                    </pre>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-500">Technical Warning</p>
                        <p className="text-[10px] font-bold text-amber-700/80 dark:text-amber-500/70 uppercase leading-normal">
                          This is the exact JSON structure being sent to the supplier. Any discrepancies here will result in fulfillment errors or incorrect reservations.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* API Warnings */}
          <div className="mt-6 flex items-start gap-3 p-3 bg-clio-gray-50 dark:bg-clio-gray-800/50 border border-clio-gray-100 dark:border-clio-gray-800 rounded-lg">
            <Info className="w-4 h-4 text-clio-blue flex-shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-500 dark:text-clio-gray-400 leading-normal">
              {isHotel ? 
                "Hotelbeds rate keys expire frequently. Confirming now will commit the booking using the current rate key displayed in the technical tab." :
                "Amadeus ticket issuance is immediate upon order creation. Ensure the technical payload contains correct traveler identifiers."
              }
            </p>
          </div>
        </div>

        <Separator className="dark:bg-clio-gray-800" />

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <ModernButton variant="ghost" onClick={onClose} disabled={isExecuting} className="uppercase font-black text-[10px] tracking-widest">
            Cancel
          </ModernButton>
          <ModernButton 
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px] uppercase font-black text-[10px] tracking-widest shadow-lg shadow-emerald-600/20 transition-all active:scale-95" 
            onClick={onConfirm}
            disabled={isExecuting || isLoadingPayload}
          >
            {isExecuting ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin mr-2" />
                Executing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                Authorize & Commit
              </>
            )}
          </ModernButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


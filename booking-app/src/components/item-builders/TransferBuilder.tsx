'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Search, X, ArrowRight } from 'lucide-react';
import { useRateStore } from '@/store/rate-store';
import { TransferRate } from '@/types/rate';
import { formatCurrency } from '@/lib/utils';
import { calculateClientPrice, getMarkupPercentage } from '@/lib/pricing/markup-config';

interface TransferBuilderProps {
  onSubmit: (transferData: {
    type: string;
    name: string;
    startDate: string;
    endDate?: string;
    price: number;
    quantity: number;
    details: {
      from: string;
      to: string;
      transferType: 'airport' | 'hotel' | 'point-to-point' | 'hourly';
      vehicleType: string;
      supplier?: string;
      commissionPercent?: number;
      duration?: number;
    };
  }) => void;
  onCancel: () => void;
  tripStartDate?: Date;
  tripEndDate?: Date;
}

type TabType = 'offline' | 'manual' | 'api';

export function TransferBuilder({ onSubmit, onCancel, tripStartDate, tripEndDate }: TransferBuilderProps) {
  const { getRatesByType, searchRates, getRatesByDateRange } = useRateStore();
  const [activeTab, setActiveTab] = useState<TabType>('offline');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    transferType: 'airport' as 'airport' | 'hotel' | 'point-to-point' | 'hourly',
    vehicleType: '',
    startDate: tripStartDate ? tripStartDate.toISOString().split('T')[0] : '',
    endDate: tripEndDate ? tripEndDate.toISOString().split('T')[0] : '',
    price: '',
    quantity: '1',
    supplier: '',
    commissionPercent: '',
    duration: '',
  });

  // Get transfer rates filtered by trip dates
  const transferRatesInDateRange = (() => {
    if (!tripStartDate || !tripEndDate) {
      return getRatesByType('transfer') as TransferRate[];
    }

    const startStr = tripStartDate.toISOString().split('T')[0];
    const endStr = tripEndDate.toISOString().split('T')[0];

    return getRatesByDateRange(startStr, endStr)
      .filter(r => r.type === 'transfer') as TransferRate[];
  })();

  // Filter rates based on search (within date range)
  const filteredRates = searchQuery
    ? searchRates(searchQuery).filter(r =>
        r.type === 'transfer' &&
        transferRatesInDateRange.some(tr => tr.id === r.id)
      ) as TransferRate[]
    : transferRatesInDateRange;

  const handleSelectRate = (rate: TransferRate) => {
    // Use trip dates if available, otherwise use rate dates
    const startDate = tripStartDate
      ? tripStartDate.toISOString()
      : new Date(rate.startDate).toISOString();

    const endDate = tripEndDate
      ? tripEndDate.toISOString()
      : new Date(rate.endDate).toISOString();

    const name = `${rate.from} → ${rate.to} (${rate.vehicleType})`;

    // Calculate client price with markup
    const markupPercentage = getMarkupPercentage();
    const clientPrice = calculateClientPrice(rate.rate, markupPercentage);

    // Directly submit the transfer
    onSubmit({
      type: 'transfer',
      name,
      startDate,
      endDate,
      price: clientPrice, // Client pays marked-up price
      quantity: 1,
      details: {
        from: rate.from,
        to: rate.to,
        transferType: rate.transferType,
        vehicleType: rate.vehicleType,
        supplier: rate.supplier,
        supplierCost: rate.rate, // Nett cost from supplier
        commissionPercent: rate.commissionPercent,
        supplierSource: rate.source,
        duration: rate.duration,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = `${formData.from} → ${formData.to} (${formData.vehicleType})`;

    onSubmit({
      type: 'transfer',
      name,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      supplierSource: 'offline_platform',
      details: {
        from: formData.from,
        to: formData.to,
        transferType: formData.transferType,
        vehicleType: formData.vehicleType,
        supplier: formData.supplier || undefined,
        commissionPercent: formData.commissionPercent ? parseFloat(formData.commissionPercent) : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-clio-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-clio-gray-950 rounded-2xl w-full max-w-4xl shadow-strong max-h-[90vh] overflow-hidden flex flex-col border border-clio-gray-200 dark:border-clio-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50/50 dark:bg-clio-gray-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm">
              <Car className="w-6 h-6 text-clio-blue" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Add Transfer</h3>
              <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">Configure ground transportation details</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 transition-colors text-clio-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-clio-gray-100 dark:border-clio-gray-800 px-8 bg-white dark:bg-clio-gray-950">
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'offline'
                ? 'border-clio-blue text-clio-blue'
                : 'border-transparent text-clio-gray-400 hover:text-clio-gray-600 dark:hover:text-clio-gray-200'
            }`}
          >
            Offline Rates ({transferRatesInDateRange.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-clio-blue text-clio-blue'
                : 'border-transparent text-clio-gray-400 hover:text-clio-gray-600 dark:hover:text-clio-gray-200'
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'api'
                ? 'border-clio-blue text-clio-blue'
                : 'border-transparent text-clio-gray-400 hover:text-clio-gray-600 dark:hover:text-clio-gray-200'
            }`}
          >
            API Search
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-clio-gray-950">
          {/* Tab 1: Offline Rates */}
          {activeTab === 'offline' && (
            <div className="space-y-8">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-clio-gray-400" />
                <input
                  type="text"
                  placeholder="Search by location, vehicle type, or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-clio-gray-50 dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all font-bold uppercase tracking-tight text-[10px]"
                />
              </div>

              {/* Results */}
              {filteredRates.length === 0 ? (
                <div className="text-center py-16 bg-clio-gray-50 dark:bg-clio-gray-900/50 rounded-2xl border-2 border-dashed border-clio-gray-200 dark:border-clio-gray-800">
                  <div className="w-16 h-16 bg-white dark:bg-clio-gray-800 rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
                    <Car className="w-8 h-8 text-clio-gray-300 dark:text-clio-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight mb-2">No transfers found</h3>
                  <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest max-w-xs mx-auto">
                    Try adjusting your search or switch to Manual Entry
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
                  {filteredRates.map((rate) => (
                    <button
                      key={rate.id}
                      onClick={() => handleSelectRate(rate)}
                      className="text-left p-6 bg-white dark:bg-clio-gray-900 border border-clio-gray-100 dark:border-clio-gray-800 rounded-2xl hover:border-clio-blue hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight text-lg group-hover:text-clio-blue transition-colors">
                            <span>{rate.from}</span>
                            <ArrowRight className="w-4 h-4 text-clio-blue" />
                            <span>{rate.to}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-clio-blue mt-1">
                            {rate.vehicleType} • <span className="capitalize">{rate.transferType}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-4">
                            {rate.duration && (
                              <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 bg-clio-gray-50 dark:bg-clio-gray-800 px-2 py-1 rounded">
                                Duration: {rate.duration} minutes
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight mt-4">
                            Supplier: {rate.supplier}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="bg-clio-blue/5 dark:bg-clio-blue/10 px-4 py-2.5 rounded-xl border border-clio-blue/10 group-hover:bg-clio-blue group-hover:text-white transition-all">
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Quote Price</div>
                            <div className="text-2xl font-black">{rate.currency} {rate.rate.toFixed(2)}</div>
                          </div>
                          <div className="mt-2 text-[10px] font-bold text-green-600 uppercase tracking-tight">
                            {rate.commissionPercent}% commission
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Manual Entry */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="from" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">From *</Label>
                  <Input
                    id="from"
                    required
                    value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                    placeholder="e.g., JFK Airport"
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">To *</Label>
                  <Input
                    id="to"
                    required
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    placeholder="e.g., Manhattan Hotel"
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Vehicle Type *</Label>
                  <Input
                    id="vehicleType"
                    required
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    placeholder="e.g., Sedan, Van, Bus"
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferType" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Transfer Type *</Label>
                  <select
                    id="transferType"
                    required
                    value={formData.transferType}
                    onChange={(e) => setFormData({ ...formData, transferType: e.target.value as any })}
                    className="w-full h-12 px-4 bg-clio-gray-50 dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 transition-all font-bold uppercase tracking-tight text-[10px]"
                  >
                    <option value="airport">Airport Transfer</option>
                    <option value="hotel">Hotel Transfer</option>
                    <option value="point-to-point">Point to Point</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 45"
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Commission %</Label>
                  <Input
                    id="commission"
                    type="number"
                    step="0.1"
                    value={formData.commissionPercent}
                    onChange={(e) => setFormData({ ...formData, commissionPercent: e.target.value })}
                    placeholder="10"
                    className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Transfer company name"
                  className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                />
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-clio-gray-100 dark:border-clio-gray-800">
                <button 
                  type="button" 
                  onClick={onCancel}
                  className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel Entry
                </button>
                <Button 
                  type="submit" 
                  className="bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-clio-blue/20"
                >
                  Add Transfer
                </Button>
              </div>
            </form>
          )}

          {/* Tab 3: API Search */}
          {activeTab === 'api' && (
            <div className="text-center py-24 bg-clio-gray-50 dark:bg-clio-gray-900/50 rounded-2xl border-2 border-dashed border-clio-gray-200 dark:border-clio-gray-800">
              <div className="w-20 h-20 bg-white dark:bg-clio-gray-800 rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
                <Search className="w-10 h-10 text-clio-gray-300 dark:text-clio-gray-600" />
              </div>
              <h4 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight mb-2">API Search Coming Soon</h4>
              <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest max-w-md mx-auto mb-8">
                Search external transfer APIs to find and book ground transportation in real-time.
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveTab('manual')}
                className="border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-xs h-11 px-8"
              >
                Use Manual Entry Instead
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

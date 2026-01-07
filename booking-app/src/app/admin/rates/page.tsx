'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { useRateStore } from '@/store/rate-store';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Sparkles, Eye, Search, Trash2, Database, Hotel, MapPin, Car, Edit2, X } from 'lucide-react';

export default function RatesPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <RatesContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function RatesContent() {
  const { rates, addRates, deleteRate, deleteRates, updateRate, clearAllRates, searchRates } = useRateStore();
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRate, setEditingRate] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRates, setSelectedRates] = useState<Set<string>>(new Set());
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
    rates?: any[];
    warnings?: string[];
    metadata?: any;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    console.log('[RatesPage] Component mounted, rates loaded:', rates.length);
    return () => {
      console.log('[RatesPage] Component unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('[RatesPage] State updated:', {
      totalRates: rates.length,
      uploading,
      searchQuery,
      showEditModal,
      showPreview,
      selectedRatesCount: selectedRates.size
    });
  }, [rates, uploading, searchQuery, showEditModal, showPreview, selectedRates]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    setShowPreview(false);

    try {
      console.log('🚀 [Upload] Starting GPT processing for:', file.name);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Call GPT processing API
      const response = await fetch('/api/rates/gpt-process', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : (data.error || 'Upload failed');
        throw new Error(errorMsg);
      }

      console.log('✅ [Upload] GPT processing complete:', data);

      // Store result for preview
      setUploadResult({
        success: true,
        message: `GPT extracted ${data.rates.length} rates with ${data.metadata.confidence} confidence`,
        count: data.rates.length,
        rates: data.rates,
        warnings: data.metadata.warnings,
        metadata: data.metadata,
      });

      setShowPreview(true);
    } catch (error: any) {
      console.error('❌ [Upload] Failed:', error);
      setUploadResult({
        success: false,
        message: error.message || 'Upload failed. Please check file format.',
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmAndSaveRates = () => {
    if (!uploadResult?.rates) return;

    // Save all rates to store
    const ids = addRates(uploadResult.rates);

    console.log('💾 [Upload] Saved rates:', ids.length);

    // Update result message
    setUploadResult({
      ...uploadResult,
      message: `Successfully saved ${ids.length} rates to the system`,
    });

    setShowPreview(false);
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = `Supplier,Property Name,Property Code,Room Type,Check-in Date,Check-out Date,Rate,Currency,Commission %,Source
Hilton Hotels,Hilton Garden Inn Miami,HILGMI001,Standard King,2025-01-15,2025-01-18,150.00,USD,10,offline_platform
Marriott,Marriott Marquis NYC,MARNYC002,Deluxe Queen,2025-02-01,2025-02-05,220.00,USD,12,offline_platform
Local Supplier,Beach Resort Cancun,BRCMX003,Ocean View Suite,2025-03-10,2025-03-14,180.00,USD,8,offline_agent`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rates_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditRate = (rate: any) => {
    setEditingRate({ ...rate });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingRate) return;

    updateRate(editingRate.id, editingRate);
    setShowEditModal(false);
    setEditingRate(null);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingRate(null);
  };

  const displayedRates = searchQuery ? searchRates(searchQuery) : rates;

  const toggleSelectRate = (rateId: string) => {
    const newSelected = new Set(selectedRates);
    if (newSelected.has(rateId)) {
      newSelected.delete(rateId);
    } else {
      newSelected.add(rateId);
    }
    setSelectedRates(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRates.size === displayedRates.length) {
      // Deselect all
      setSelectedRates(new Set());
    } else {
      // Select all displayed rates
      setSelectedRates(new Set(displayedRates.map(r => r.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedRates.size === 0) return;

    const confirmMsg = `Are you sure you want to delete ${selectedRates.size} rate${selectedRates.size > 1 ? 's' : ''}?`;
    if (confirm(confirmMsg)) {
      deleteRates(Array.from(selectedRates));
      setSelectedRates(new Set());
    }
  };

  const clearSelection = () => {
    setSelectedRates(new Set());
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-clio-gray-900 dark:text-white">Rate Management</h1>
          <p className="text-clio-gray-600 dark:text-clio-gray-400 mt-2 font-medium">
            Upload and manage offline negotiated rates for hotels, flights, and activities
          </p>
        </div>

        {/* GPT Info Banner */}
        <div className="bg-clio-blue/10 dark:bg-clio-blue/20 border border-clio-blue/20 rounded-xl p-6 mb-6 flex items-start gap-4 shadow-sm">
          <Sparkles className="w-6 h-6 text-clio-blue flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-clio-blue uppercase tracking-tight mb-2">✨ AI-Powered Rate Extraction</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-clio-gray-600 dark:text-clio-gray-300 font-medium">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-clio-blue rounded-full"></div>
                Upload CSV, Excel, PDF, or screenshots
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-clio-blue rounded-full"></div>
                GPT-4 automatically extracts rates
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-clio-blue rounded-full"></div>
                Preview extracted rates before saving
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-clio-blue rounded-full"></div>
                Handles unstructured emails and quotes
              </li>
            </ul>
          </div>
        </div>

        {/* Download Template */}
        <div className="bg-white dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight mb-1">
                Download CSV Template
              </h2>
              <p className="text-sm text-clio-gray-600 dark:text-clio-gray-400 font-medium">
                Use this template to format your rates correctly before uploading
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-700 dark:text-clio-gray-300 rounded-lg hover:bg-clio-gray-200 dark:hover:bg-clio-gray-700 flex items-center gap-2 transition-colors font-bold uppercase tracking-tight text-[10px]"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight mb-4">Upload Rates</h2>

          {uploading ? (
            // Full-screen loading overlay
            <div className="border-2 border-purple-300 dark:border-purple-900/50 rounded-xl p-12 text-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-indigo-950/30">
              <div className="max-w-md mx-auto">
                {/* Animated icon */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse opacity-20"></div>
                  <div className="absolute inset-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-spin opacity-30" style={{ animationDuration: '3s' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-pulse" />
                  </div>
                </div>

                {/* Status text */}
                <h3 className="text-2xl font-bold text-clio-gray-900 dark:text-white mb-3">
                  Processing with AI
                </h3>

                <div className="space-y-2 mb-6">
                  <p className="text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center gap-2 uppercase tracking-tight text-xs">
                    <span className="inline-block w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse"></span>
                    Analyzing your file...
                  </p>
                  <p className="text-sm text-clio-gray-600 dark:text-clio-gray-400 font-medium">
                    GPT-4 is extracting and structuring rate information
                  </p>
                </div>

                {/* Progress steps */}
                <div className="bg-clio-gray-50 dark:bg-clio-gray-900 rounded-xl p-4 text-left space-y-2 text-sm border border-clio-gray-100 dark:border-clio-gray-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold uppercase tracking-tight text-[10px]">
                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                    <span>File uploaded</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold uppercase tracking-tight text-[10px]">
                    <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                    <span>Extracting data with AI...</span>
                  </div>
                  <div className="flex items-center gap-2 text-clio-gray-400 dark:text-clio-gray-600 font-bold uppercase tracking-tight text-[10px]">
                    <div className="w-5 h-5 bg-clio-gray-100 dark:bg-clio-gray-800 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-clio-gray-300 dark:bg-clio-gray-700 rounded-full"></div>
                    </div>
                    <span>Preview results</span>
                  </div>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 dark:text-clio-gray-500 mt-6">
                  This usually takes 5-15 seconds
                </p>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-clio-gray-200 dark:border-clio-gray-800 rounded-xl p-12 text-center hover:border-clio-blue dark:hover:border-clio-blue transition-colors group">
              <FileSpreadsheet className="w-16 h-16 text-clio-gray-300 dark:text-clio-gray-700 mx-auto mb-4 group-hover:text-clio-blue transition-colors" />

              <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                Upload Rate File
              </h3>

              <p className="text-sm text-clio-gray-600 dark:text-clio-gray-400 mb-8 font-medium">
                Upload CSV or Excel file with negotiated rates
              </p>

              <label className="inline-block">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <span className="px-8 py-3 bg-clio-blue text-white rounded-xl hover:bg-clio-blue-hover cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold uppercase tracking-tight shadow-md active:scale-95">
                  <Sparkles className="w-5 h-5" />
                  Upload & Process
                </span>
              </label>

              <p className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 dark:text-clio-gray-500 mt-6">
                Supported: CSV, Excel, PDF, Text, Images (Max 10MB)
              </p>
            </div>
          )}

            {/* Upload Result */}
          {uploadResult && (
            <div
              className={`mt-6 p-6 rounded-xl border shadow-sm ${
                uploadResult.success
                  ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50'
                  : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
              }`}
            >
              <div className="flex items-start gap-4">
                {uploadResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-bold uppercase tracking-tight ${
                      uploadResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                    }`}
                  >
                    {uploadResult.message}
                  </p>

                  {uploadResult.metadata && (
                    <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400 flex flex-wrap gap-x-6 gap-y-2">
                      <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-clio-blue rounded-full"></span> Tokens: {uploadResult.metadata.tokensUsed}</p>
                      <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-clio-blue rounded-full"></span> Time: {uploadResult.metadata.processingTime}ms</p>
                      <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-clio-blue rounded-full"></span> Cost: {uploadResult.metadata.estimatedCost}</p>
                    </div>
                  )}

                  {uploadResult.warnings && uploadResult.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                      <p className="font-bold uppercase tracking-tight mb-1">Warnings:</p>
                      <ul className="list-disc list-inside space-y-0.5 font-medium">
                        {uploadResult.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {showPreview && uploadResult.rates && (
                <div className="mt-6 pt-6 border-t border-green-200 dark:border-green-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-green-900 dark:text-green-300 uppercase tracking-tight flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Preview ({uploadResult.rates.length})
                    </h3>
                    <button
                      onClick={confirmAndSaveRates}
                      className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold uppercase tracking-tight text-xs shadow-md active:scale-95"
                    >
                      ✓ Confirm & Save All
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-green-200 dark:scrollbar-thumb-green-900">
                    {uploadResult.rates.slice(0, 10).map((rate, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-clio-gray-950 p-4 rounded-xl border border-clio-gray-100 dark:border-clio-gray-800 text-sm shadow-sm"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-bold text-clio-gray-900 dark:text-white">{rate.supplier}</span>
                            <div className="text-xs text-clio-gray-500 dark:text-clio-gray-400 font-medium mt-0.5">{rate.propertyName}</div>
                          </div>
                          <div className="text-right text-clio-gray-600 dark:text-clio-gray-400 font-bold uppercase tracking-tight text-[10px]">
                            {rate.roomType}
                          </div>
                          <div className="text-clio-gray-500 dark:text-clio-gray-400 font-bold uppercase tracking-tight text-[10px] flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {rate.checkIn} → {rate.checkOut}
                          </div>
                          <div className="text-right font-bold text-clio-blue">
                            {rate.currency} {rate.rate} <span className="text-[10px] text-clio-gray-400 ml-1">({rate.commissionPercent}% comm)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {uploadResult.rates.length > 10 && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 dark:text-clio-gray-500 text-center py-4">
                        ... and {uploadResult.rates.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rate Format Guide */}
        <div className="bg-white dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl p-6 mt-6 shadow-sm">
          <h2 className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight mb-4">
            CSV Format Guide
          </h2>

          <div className="space-y-4 text-sm font-medium">
            <div className="flex items-center gap-3">
              <span className="w-32 text-[10px] font-bold uppercase tracking-widest text-clio-gray-400">Supplier</span>
              <span className="text-clio-gray-600 dark:text-clio-gray-300">
                Name of the supplier (e.g., "Hilton Hotels")
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-32 text-[10px] font-bold uppercase tracking-widest text-clio-gray-400">Property Name</span>
              <span className="text-clio-gray-600 dark:text-clio-gray-300">
                Full name of hotel/property
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-32 text-[10px] font-bold uppercase tracking-widest text-clio-gray-400">Property Code</span>
              <span className="text-clio-gray-600 dark:text-clio-gray-300">
                Unique code for the property
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-32 text-[10px] font-bold uppercase tracking-widest text-clio-gray-400">Source</span>
              <div className="flex items-center gap-2">
                <code className="bg-clio-gray-100 dark:bg-clio-gray-800 px-2 py-0.5 rounded text-[10px] font-bold">offline_platform</code>
                <span className="text-clio-gray-400">or</span>
                <code className="bg-clio-gray-100 dark:bg-clio-gray-800 px-2 py-0.5 rounded text-[10px] font-bold">offline_agent</code>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-32 text-[10px] font-bold uppercase tracking-widest text-clio-gray-400">Commission %</span>
              <span className="text-clio-gray-600 dark:text-clio-gray-300">
                Your commission percentage (e.g., 10 for 10%)
              </span>
            </div>
          </div>
        </div>

        {/* Saved Rates Section */}
        <div className="bg-white dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl p-6 mt-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-clio-blue rounded-xl flex items-center justify-center shadow-md">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                  Saved Rates ({rates.length})
                </h2>
                <p className="text-sm text-clio-gray-600 dark:text-clio-gray-400 font-medium mt-0.5">
                  All uploaded negotiated rates
                </p>
              </div>
            </div>
            {rates.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete all rates?')) {
                    clearAllRates();
                  }
                }}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 flex items-center gap-2 transition-colors border border-red-100 dark:border-red-900/50"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {/* Bulk Action Bar */}
          {selectedRates.size > 0 && (
            <div className="mb-6 p-4 bg-clio-blue dark:bg-clio-blue/20 border border-clio-blue/20 rounded-xl flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold text-white dark:text-clio-blue uppercase tracking-tight">
                  {selectedRates.size} item{selectedRates.size > 1 ? 's' : ''} selected
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/80 dark:text-clio-blue/80 hover:text-white dark:hover:text-clio-blue transition-colors"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-clio-blue text-clio-blue dark:text-white rounded-lg hover:bg-clio-gray-50 dark:hover:bg-clio-blue-hover flex items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          {rates.length > 0 && (
            <div className="mb-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clio-gray-400 group-focus-within:text-clio-blue transition-colors" />
                <input
                  type="text"
                  placeholder="Search by supplier, property, room type, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white placeholder:text-clio-gray-400 dark:placeholder:text-clio-gray-600"
                />
              </div>
            </div>
          )}

          {/* Rates Table */}
          {rates.length === 0 ? (
            <div className="text-center py-20 bg-clio-gray-50 dark:bg-clio-gray-950/50 rounded-xl border border-dashed border-clio-gray-200 dark:border-clio-gray-800">
              <Database className="w-16 h-16 text-clio-gray-300 dark:text-clio-gray-700 mx-auto mb-4" />
              <p className="text-clio-gray-900 dark:text-white font-bold uppercase tracking-tight">No rates uploaded yet</p>
              <p className="text-sm text-clio-gray-500 dark:text-clio-gray-400 mt-1 font-medium">
                Upload a file above to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-clio-gray-50 dark:bg-clio-gray-950/50 border-y border-clio-gray-100 dark:border-clio-gray-800">
                    <th className="px-6 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRates.size === displayedRates.length && displayedRates.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-clio-blue border-clio-gray-300 dark:border-clio-gray-700 rounded focus:ring-clio-blue transition-colors bg-white dark:bg-clio-gray-900"
                      />
                    </th>
                    <th className="px-4 py-4 text-center font-bold text-clio-gray-400 uppercase tracking-widest text-[10px]">Type</th>
                    <th className="px-4 py-4 text-left font-bold text-clio-gray-400 uppercase tracking-widest text-[10px]">Supplier</th>
                    <th className="px-4 py-4 text-left font-bold text-clio-gray-400 uppercase tracking-widest text-[10px]">Details</th>
                    <th className="px-4 py-4 text-left font-bold text-clio-gray-400 uppercase tracking-widest text-[10px]">Dates</th>
                    <th className="px-4 py-4 text-right font-bold text-clio-gray-400 uppercase tracking-widest text-[10px]">Rate</th>
                    <th className="px-4 py-4 text-right font-bold text-clio-gray-400 uppercase tracking-widest text-[10px]">Commission</th>
                    <th className="px-4 py-4 text-center font-bold text-clio-gray-400 uppercase tracking-widest text-[10px]">Source</th>
                    <th className="px-6 py-4 text-center font-bold text-clio-gray-400 uppercase tracking-widest text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clio-gray-100 dark:divide-clio-gray-800">
                  {displayedRates.map((rate) => (
                    <tr key={rate.id} className={`hover:bg-clio-gray-50/50 dark:hover:bg-clio-gray-800/30 transition-colors ${selectedRates.has(rate.id) ? 'bg-clio-blue/5 dark:bg-clio-blue/10' : ''}`}>
                      {/* Checkbox */}
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRates.has(rate.id)}
                          onChange={() => toggleSelectRate(rate.id)}
                          className="w-4 h-4 text-clio-blue border-clio-gray-300 dark:border-clio-gray-700 rounded focus:ring-clio-blue transition-colors bg-white dark:bg-clio-gray-900"
                        />
                      </td>

                      {/* Type Icon */}
                      <td className="px-4 py-4 text-center">
                        {rate.type === 'hotel' && <Hotel className="w-5 h-5 text-clio-blue mx-auto" />}
                        {rate.type === 'activity' && <MapPin className="w-5 h-5 text-amber-600 mx-auto" />}
                        {rate.type === 'transfer' && <Car className="w-5 h-5 text-clio-navy dark:text-clio-gray-300 mx-auto" />}
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-4 text-clio-gray-900 dark:text-white font-bold">{rate.supplier}</td>

                      {/* Type-specific Details */}
                      <td className="px-4 py-4">
                        {rate.type === 'hotel' && (
                          <>
                            <div className="text-clio-gray-900 dark:text-white font-medium">{rate.propertyName}</div>
                            <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-500 dark:text-clio-gray-400 mt-0.5">{rate.roomType}</div>
                            {rate.propertyCode && (
                              <div className="text-[10px] font-medium text-clio-gray-400 mt-0.5">{rate.propertyCode}</div>
                            )}
                          </>
                        )}
                        {rate.type === 'activity' && (
                          <>
                            <div className="text-clio-gray-900 dark:text-white font-medium">{rate.activityName}</div>
                            <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-500 dark:text-clio-gray-400 mt-0.5">{rate.location}</div>
                            {rate.category && (
                              <div className="text-[10px] font-medium text-clio-gray-400 mt-0.5">{rate.category}</div>
                            )}
                          </>
                        )}
                        {rate.type === 'transfer' && (
                          <>
                            <div className="text-clio-gray-900 dark:text-white font-medium">{rate.vehicleType}</div>
                            <div className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-500 dark:text-clio-gray-400 mt-0.5">
                              {rate.from} → {rate.to}
                            </div>
                            <div className="text-[10px] font-medium text-clio-gray-400 mt-0.5 capitalize">{rate.transferType}</div>
                          </>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-4 text-clio-gray-600 dark:text-clio-gray-400 font-bold uppercase tracking-tight text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-clio-blue rounded-full"></span>
                          {rate.type === 'hotel' ? rate.checkIn : rate.startDate}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-1 h-1 bg-clio-gray-300 dark:bg-clio-gray-700 rounded-full"></span>
                          {rate.type === 'hotel' ? rate.checkOut : rate.endDate}
                        </div>
                      </td>

                      {/* Rate */}
                      <td className="px-4 py-4 text-right font-bold text-clio-gray-900 dark:text-white">
                        {rate.currency} {rate.rate.toFixed(2)}
                      </td>

                      {/* Commission */}
                      <td className="px-4 py-4 text-right text-green-600 dark:text-green-400 font-bold">
                        {rate.commissionPercent}%
                      </td>

                      {/* Source */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-clio-blue/10 text-clio-blue border border-clio-blue/20">
                          {rate.source.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditRate(rate)}
                            className="p-2 text-clio-gray-400 hover:text-clio-blue dark:hover:text-clio-blue transition-colors rounded-lg hover:bg-clio-blue/10"
                            title="Edit rate"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this rate?')) {
                                deleteRate(rate.id);
                              }
                            }}
                            className="p-2 text-clio-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Delete rate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Rate Modal */}
        {showEditModal && editingRate && (
          <EditRateModal
            rate={editingRate}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
            onChange={setEditingRate}
          />
        )}
      </div>
    </div>
  );
}

// Edit Rate Modal Component
interface EditRateModalProps {
  rate: any;
  onSave: () => void;
  onCancel: () => void;
  onChange: (rate: any) => void;
}

function EditRateModal({ rate, onSave, onCancel, onChange }: EditRateModalProps) {
  const updateField = (field: string, value: any) => {
    onChange({ ...rate, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-clio-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-clio-gray-900 rounded-2xl w-full max-w-2xl shadow-strong max-h-[90vh] overflow-y-auto border border-clio-gray-200 dark:border-clio-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-clio-gray-100 dark:border-clio-gray-800 sticky top-0 bg-white dark:bg-clio-gray-900 z-10">
          <div className="flex items-center gap-3">
            {rate.type === 'hotel' && <Hotel className="w-6 h-6 text-clio-blue" />}
            {rate.type === 'activity' && <MapPin className="w-6 h-6 text-amber-600" />}
            {rate.type === 'transfer' && <Car className="w-6 h-6 text-clio-navy dark:text-clio-gray-300" />}
            <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
              Edit {rate.type.charAt(0).toUpperCase() + rate.type.slice(1)} Rate
            </h3>
          </div>
          <button onClick={onCancel} className="text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                Supplier
              </label>
              <input
                type="text"
                value={rate.supplier}
                onChange={(e) => updateField('supplier', e.target.value)}
                className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                Source
              </label>
              <select
                value={rate.source}
                onChange={(e) => updateField('source', e.target.value)}
                className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
              >
                <option value="offline_platform">Offline Platform</option>
                <option value="offline_agent">Offline Agent</option>
              </select>
            </div>
          </div>

          {/* Hotel-specific Fields */}
          {rate.type === 'hotel' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    Property Name
                  </label>
                  <input
                    type="text"
                    value={rate.propertyName}
                    onChange={(e) => updateField('propertyName', e.target.value)}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    Property Code
                  </label>
                  <input
                    type="text"
                    value={rate.propertyCode || ''}
                    onChange={(e) => updateField('propertyCode', e.target.value)}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    Room Type
                  </label>
                  <input
                    type="text"
                    value={rate.roomType}
                    onChange={(e) => updateField('roomType', e.target.value)}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    Meal Plan
                  </label>
                  <input
                    type="text"
                    value={rate.mealPlan || ''}
                    onChange={(e) => updateField('mealPlan', e.target.value)}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Activity-specific Fields */}
          {rate.type === 'activity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    value={rate.activityName}
                    onChange={(e) => updateField('activityName', e.target.value)}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={rate.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={rate.category || ''}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={rate.duration || ''}
                    onChange={(e) => updateField('duration', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Transfer-specific Fields */}
          {rate.type === 'transfer' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    From
                  </label>
                  <input
                    type="text"
                    value={rate.from}
                    onChange={(e) => updateField('from', e.target.value)}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    To
                  </label>
                  <input
                    type="text"
                    value={rate.to}
                    onChange={(e) => updateField('to', e.target.value)}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    Vehicle Type
                  </label>
                  <input
                    type="text"
                    value={rate.vehicleType}
                    onChange={(e) => updateField('vehicleType', e.target.value)}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                    Transfer Type
                  </label>
                  <select
                    value={rate.transferType}
                    onChange={(e) => updateField('transferType', e.target.value)}
                    className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
                  >
                    <option value="airport">Airport</option>
                    <option value="hotel">Hotel</option>
                    <option value="point-to-point">Point to Point</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                {rate.type === 'hotel' ? 'Check-in' : 'Start Date'}
              </label>
              <input
                type="date"
                value={rate.type === 'hotel' ? rate.checkIn : rate.startDate}
                onChange={(e) => {
                  if (rate.type === 'hotel') {
                    updateField('checkIn', e.target.value);
                    updateField('startDate', e.target.value);
                  } else {
                    updateField('startDate', e.target.value);
                  }
                }}
                className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                {rate.type === 'hotel' ? 'Check-out' : 'End Date'}
              </label>
              <input
                type="date"
                value={rate.type === 'hotel' ? rate.checkOut : rate.endDate}
                onChange={(e) => {
                  if (rate.type === 'hotel') {
                    updateField('checkOut', e.target.value);
                    updateField('endDate', e.target.value);
                  } else {
                    updateField('endDate', e.target.value);
                  }
                }}
                className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                Rate
              </label>
              <input
                type="number"
                step="0.01"
                value={rate.rate}
                onChange={(e) => updateField('rate', parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                Currency
              </label>
              <input
                type="text"
                value={rate.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
                Commission %
              </label>
              <input
                type="number"
                step="0.1"
                value={rate.commissionPercent}
                onChange={(e) => updateField('commissionPercent', parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-clio-gray-400 mb-2">
              Notes
            </label>
            <textarea
              value={rate.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all outline-none font-medium dark:text-white"
              placeholder="Additional notes or comments..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-clio-gray-100 dark:border-clio-gray-800 bg-clio-gray-50 dark:bg-clio-gray-950/50 sticky bottom-0">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-8 py-2.5 bg-clio-blue text-white rounded-xl hover:bg-clio-blue-hover transition-all font-bold uppercase tracking-tight shadow-md active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quoteDetailsSchema, QuoteDetailsFormData } from './schemas/quote.schema';
import { Contact, TravelQuote } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { getContactDisplayName } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings-store';
import { Percent, ChevronDown, ChevronUp, Settings, Info, Loader2 } from 'lucide-react';

interface QuoteDetailsProps {
  contact: Contact;
  quote?: Partial<TravelQuote>;
  onComplete: (quoteData: Partial<TravelQuote>) => void;
  isSubmitting?: boolean;
}

export function QuoteDetails({ contact, quote, onComplete, isSubmitting = false }: QuoteDetailsProps) {
  const { settings, isValidCommissionRate } = useSettingsStore();
  const [useCustomCommission, setUseCustomCommission] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Initialize form with react-hook-form + Zod validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuoteDetailsFormData>({
    resolver: zodResolver(quoteDetailsSchema),
    defaultValues: {
      title: quote?.title || '',
      startDate: quote?.travelDates?.start
        ? new Date(quote.travelDates.start).toISOString().split('T')[0]
        : '',
      endDate: quote?.travelDates?.end
        ? new Date(quote.travelDates.end).toISOString().split('T')[0]
        : '',
      commissionRate: quote?.commissionRate ?? settings.defaultCommissionRate,
    },
  });

  // Watch form values for real-time updates
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Calculate minimum end date (start date + 1 day)
  const getMinEndDate = () => {
    if (!startDate) return today;
    const start = new Date(startDate);
    const nextDay = new Date(start);
    nextDay.setDate(start.getDate() + 1);
    return nextDay.toISOString().split('T')[0];
  };

  // Clear end date if it's before start date
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        setValue('endDate', '');
      }
    }
  }, [startDate, endDate, setValue]);

  // Check if custom commission is being used
  useEffect(() => {
    if (quote) {
      const hasCustomCommission = quote.commissionRate !== undefined && quote.commissionRate !== settings.defaultCommissionRate;
      setUseCustomCommission(hasCustomCommission);
      setShowAdvancedSettings(hasCustomCommission);
    }
  }, [quote, settings.defaultCommissionRate]);

  const onSubmit = (data: QuoteDetailsFormData) => {
    onComplete({
      title: data.title,
      travelDates: {
        start: new Date(data.startDate),
        end: new Date(data.endDate),
      },
      commissionRate: useCustomCommission ? data.commissionRate : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Quote Details
        </h2>
        <p className="text-gray-600">
          Creating quote for {getContactDisplayName(contact.firstName, contact.lastName)}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          {...register('title')}
          label="Quote Title"
          type="text"
          placeholder="e.g., European Vacation 2024"
          error={errors.title?.message}
        />

        {/* Travel Dates */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            {...register('startDate')}
            label="Travel Start Date"
            type="date"
            min={today}
            error={errors.startDate?.message}
          />

          <FormField
            {...register('endDate')}
            label="Travel End Date"
            type="date"
            min={getMinEndDate()}
            disabled={!startDate}
            error={errors.endDate?.message}
          />
        </div>

        {/* Advanced Settings */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Advanced Settings</span>
            </div>
            {showAdvancedSettings ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showAdvancedSettings && (
            <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="useCustomCommission"
                    type="checkbox"
                    checked={useCustomCommission}
                    onChange={(e) => {
                      setUseCustomCommission(e.target.checked);
                      if (!e.target.checked) {
                        setValue('commissionRate', settings.defaultCommissionRate);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="useCustomCommission" className="text-sm">
                    Use custom commission rate for this quote
                  </Label>
                  <div className="group relative">
                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                      Override the default commission rate for special clients, complex itineraries, or promotional deals. Leave unchecked to use automatic rates based on travel items.
                    </div>
                  </div>
                </div>

                {useCustomCommission && (
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate" className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-blue-600" />
                      Commission Rate (%)
                    </Label>
                    <div className="relative">
                      <Input
                        {...register('commissionRate', { valueAsNumber: true })}
                        id="commissionRate"
                        type="number"
                        min={settings.minCommissionRate}
                        max={settings.maxCommissionRate}
                        step="0.1"
                        className={errors.commissionRate ? 'border-red-500' : ''}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                    {errors.commissionRate && (
                      <p className="text-sm text-red-600">{errors.commissionRate.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Range: {settings.minCommissionRate}% - {settings.maxCommissionRate}%
                    </p>
                  </div>
                )}

                {!useCustomCommission && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Automatic commission rates will be used:</strong>
                    </p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1">
                      <li>• Flights: {settings.flightCommissionRate}%</li>
                      <li>• Hotels: {settings.hotelCommissionRate}%</li>
                      <li>• Activities: {settings.activityCommissionRate}%</li>
                      <li>• Transfers: {settings.transferCommissionRate}%</li>
                      <li>• Default: {settings.defaultCommissionRate}%</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Quote...
              </>
            ) : (
              'Continue to Add Travel Items'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

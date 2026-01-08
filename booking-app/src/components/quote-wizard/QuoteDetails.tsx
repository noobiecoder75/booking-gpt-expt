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
import { cn, getContactDisplayName } from '@/lib/utils';
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">
          Quote Details
        </h2>
        <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium">
          Creating quote for <span className="text-clio-blue font-bold">{getContactDisplayName(contact.firstName, contact.lastName)}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Title */}
          <FormField
            {...register('title')}
            label="Quote Title"
            type="text"
            placeholder="e.g., European Vacation 2024"
            error={errors.title?.message}
            className="text-lg font-bold"
          />

          {/* Travel Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        {/* Advanced Settings */}
        <div className="border border-clio-gray-200 dark:border-clio-gray-800 rounded-2xl p-6 bg-clio-gray-50/50 dark:bg-clio-gray-900/50">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-clio-gray-100 dark:bg-clio-gray-800 rounded-lg">
                <Settings className="w-4 h-4 text-clio-gray-600 dark:text-clio-gray-400" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-clio-gray-700 dark:text-clio-gray-300">Advanced Settings</span>
            </div>
            {showAdvancedSettings ? (
              <ChevronUp className="w-4 h-4 text-clio-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-clio-gray-400" />
            )}
          </button>

          {showAdvancedSettings && (
            <div className="mt-6 space-y-6 border-t border-clio-gray-200 dark:border-clio-gray-800 pt-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center h-5">
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
                      className="w-4 h-4 rounded border-clio-gray-300 text-clio-blue focus:ring-clio-blue"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="useCustomCommission" className="text-sm font-bold text-clio-gray-900 dark:text-white leading-none">
                      Use custom commission rate for this quote
                    </Label>
                    <p className="text-xs text-clio-gray-500 dark:text-clio-gray-400 mt-1 font-medium">
                      Override the default commission rate for special clients or complex itineraries.
                    </p>
                  </div>
                </div>

                {useCustomCommission && (
                  <div className="space-y-3 pl-7">
                    <Label htmlFor="commissionRate" className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight text-clio-gray-500">
                      <Percent className="w-3 h-3 text-clio-blue" />
                      Commission Rate (%)
                    </Label>
                    <div className="relative max-w-[200px]">
                      <Input
                        {...register('commissionRate', { valueAsNumber: true })}
                        id="commissionRate"
                        type="number"
                        min={settings.minCommissionRate}
                        max={settings.maxCommissionRate}
                        step="0.1"
                        className={cn("font-bold text-lg", errors.commissionRate ? 'border-red-500 ring-red-500/10' : '')}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-clio-gray-400 font-bold">%</span>
                      </div>
                    </div>
                    {errors.commissionRate && (
                      <p className="text-xs text-red-600 font-bold">{errors.commissionRate.message}</p>
                    )}
                    <p className="text-[10px] text-clio-gray-400 font-bold uppercase tracking-tight">
                      Valid range: {settings.minCommissionRate}% - {settings.maxCommissionRate}%
                    </p>
                  </div>
                )}

                {!useCustomCommission && (
                  <div className="p-4 bg-clio-blue/5 border border-clio-blue/10 rounded-xl pl-7">
                    <p className="text-xs font-bold uppercase tracking-widest text-clio-blue mb-2">
                      Automatic Rates
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-clio-gray-400 uppercase">Flights</span>
                        <div className="text-sm font-black text-clio-gray-900 dark:text-white">{settings.flightCommissionRate}%</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-clio-gray-400 uppercase">Hotels</span>
                        <div className="text-sm font-black text-clio-gray-900 dark:text-white">{settings.hotelCommissionRate}%</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-clio-gray-400 uppercase">Activities</span>
                        <div className="text-sm font-black text-clio-gray-900 dark:text-white">{settings.activityCommissionRate}%</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-clio-gray-400 uppercase">Transfers</span>
                        <div className="text-sm font-black text-clio-gray-900 dark:text-white">{settings.transferCommissionRate}%</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-clio-gray-400 uppercase">Default</span>
                        <div className="text-sm font-black text-clio-blue">{settings.defaultCommissionRate}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-4">
          <Button type="submit" size="lg" className="bg-clio-blue hover:bg-clio-blue-hover text-white font-black uppercase tracking-tight text-sm h-14 px-10 shadow-lg shadow-clio-blue/20" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
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

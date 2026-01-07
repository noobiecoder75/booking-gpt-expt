'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId} className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">{label}</Label>
        <Input
          id={fieldId}
          ref={ref}
          className={cn(
            "h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 font-bold",
            error ? 'border-red-500 focus-visible:ring-red-500/20' : '',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 ml-1">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[10px] font-medium uppercase tracking-widest text-clio-gray-400 ml-1 italic">{hint}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

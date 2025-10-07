import { z } from 'zod';

export const quoteDetailsSchema = z.object({
  title: z
    .string()
    .min(1, 'Quote title is required')
    .max(200, 'Title must be less than 200 characters'),

  startDate: z
    .string()
    .or(z.date())
    .refine((val) => {
      const date = typeof val === 'string' ? new Date(val) : val;
      return date >= new Date(new Date().setHours(0, 0, 0, 0));
    }, 'Start date cannot be in the past'),

  endDate: z
    .string()
    .or(z.date()),

  commissionRate: z
    .number()
    .min(0, 'Commission rate must be positive')
    .max(100, 'Commission rate cannot exceed 100%')
    .optional(),
}).refine(
  (data) => {
    const start = typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate;
    const end = typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate;
    return end > start;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export type QuoteDetailsFormData = z.infer<typeof quoteDetailsSchema>;

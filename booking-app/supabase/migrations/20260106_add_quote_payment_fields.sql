-- Migration: Add payment tracking fields to quotes table
-- Date: 2026-01-06

BEGIN;

-- Add payment tracking columns to public.quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' 
    CHECK (payment_status IN ('unpaid', 'deposit_paid', 'partially_paid', 'paid_in_full', 'refunded')),
  ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(12, 2);

-- Backfill remaining_balance for existing quotes
UPDATE public.quotes
SET remaining_balance = total_amount
WHERE remaining_balance IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_quotes_payment_status ON public.quotes(payment_status);

COMMENT ON COLUMN public.quotes.payment_status IS 'Current payment status of the quote';
COMMENT ON COLUMN public.quotes.total_paid IS 'Total amount paid towards this quote';
COMMENT ON COLUMN public.quotes.remaining_balance IS 'Remaining amount to be paid';

COMMIT;


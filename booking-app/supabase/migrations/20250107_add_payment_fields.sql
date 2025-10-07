-- Migration: Add missing payment fields for quote-based payments
-- Safe to run in production (backward compatible)
--
-- This migration adds columns needed for the payment system to work with quotes
-- instead of just bookings. All columns are nullable for backward compatibility.

BEGIN;

-- Add new columns (nullable for backward compatibility with existing data)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add constraint for payment type (allows NULL for backward compatibility)
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_type_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_type_check
    CHECK (type IS NULL OR type IN ('full', 'deposit', 'balance'));

-- Backfill paid_at from payment_date for existing records
UPDATE public.payments
  SET paid_at = payment_date
  WHERE paid_at IS NULL AND payment_date IS NOT NULL;

-- Add indexes for query performance
CREATE INDEX IF NOT EXISTS idx_payments_quote_id
  ON public.payments(quote_id);

CREATE INDEX IF NOT EXISTS idx_payments_type
  ON public.payments(type);

CREATE INDEX IF NOT EXISTS idx_payments_stripe_customer
  ON public.payments(stripe_customer_id);

-- Add comment for documentation
COMMENT ON COLUMN public.payments.quote_id IS 'Reference to quote (supports quote-based payments)';
COMMENT ON COLUMN public.payments.type IS 'Payment type: full, deposit, or balance';
COMMENT ON COLUMN public.payments.paid_at IS 'Timestamp when payment was completed (from Stripe)';
COMMENT ON COLUMN public.payments.stripe_customer_id IS 'Stripe customer ID for this payment';

COMMIT;

-- Rollback script (if needed):
-- BEGIN;
-- ALTER TABLE public.payments
--   DROP COLUMN IF EXISTS quote_id,
--   DROP COLUMN IF EXISTS type,
--   DROP COLUMN IF EXISTS paid_at,
--   DROP COLUMN IF EXISTS stripe_customer_id;
-- COMMIT;

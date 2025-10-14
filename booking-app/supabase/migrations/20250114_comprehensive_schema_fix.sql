-- =====================================================
-- COMPREHENSIVE SCHEMA FIX MIGRATION
-- Date: 2025-01-14
-- Description: Consolidates all schema fixes for expenses, invoices, and commissions
--              Resolves PGRST204 errors by ensuring all columns match application code
-- =====================================================
-- SAFE TO RUN MULTIPLE TIMES (Idempotent)
-- Apply via: Supabase Dashboard SQL Editor OR npx supabase db push
-- After running: Execute NOTIFY pgrst, 'reload schema'; to refresh PostgREST cache
-- =====================================================

BEGIN;

-- =====================================================
-- 1. FIX EXPENSES TABLE
-- =====================================================

-- Add status column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'expenses'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.expenses
    ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Update constraint for status
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_status_check;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_status_check
    CHECK (status IN ('pending', 'paid', 'cancelled'));

-- Add payment_method column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'expenses'
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.expenses
    ADD COLUMN payment_method TEXT;
  END IF;
END $$;

-- Add constraint for payment_method
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_payment_method_check;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_payment_method_check
    CHECK (payment_method IS NULL OR payment_method IN (
      'credit_card',
      'bank_transfer',
      'cash',
      'check',
      'paypal',
      'stripe',
      'auto_deducted'
    ));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);

-- =====================================================
-- 2. FIX INVOICES TABLE
-- =====================================================

-- Add customer_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN customer_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add customer_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN customer_name TEXT;
  END IF;
END $$;

-- Add customer_email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN customer_email TEXT;
  END IF;
END $$;

-- Add customer_address
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'customer_address'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN customer_address TEXT;
  END IF;
END $$;

-- Fix amount column - MUST be GENERATED ALWAYS AS (total) STORED
-- The API should NEVER send 'amount' in INSERT/UPDATE, only 'total'
DO $$
BEGIN
  -- Drop if exists as regular column or generated differently
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'amount'
  ) THEN
    -- Check if it's already correctly generated
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'amount'
      AND is_generated = 'ALWAYS'
      AND generation_expression = 'total'
    ) THEN
      -- Drop and recreate as generated column
      ALTER TABLE public.invoices DROP COLUMN amount;
      ALTER TABLE public.invoices ADD COLUMN amount DECIMAL(12, 2) GENERATED ALWAYS AS (total) STORED;
    END IF;
  ELSE
    -- Column doesn't exist, create it as generated
    ALTER TABLE public.invoices ADD COLUMN amount DECIMAL(12, 2) GENERATED ALWAYS AS (total) STORED;
  END IF;
END $$;

-- Add items column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'items'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add subtotal column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN subtotal DECIMAL(12, 2);
  END IF;
END $$;

-- Add tax_rate column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN tax_rate DECIMAL(5, 2) DEFAULT 0;
  END IF;
END $$;

-- Add tax_amount column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN tax_amount DECIMAL(12, 2) DEFAULT 0;
  END IF;
END $$;

-- Add discount_amount column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN discount_amount DECIMAL(12, 2) DEFAULT 0;
  END IF;
END $$;

-- Add notes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Add terms column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'terms'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN terms TEXT DEFAULT 'Net 30';
  END IF;
END $$;

-- Add payments column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'payments'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN payments JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add sent_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add viewed_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'viewed_at'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN viewed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add overdue_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'overdue_at'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN overdue_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_email ON public.invoices(customer_email);

-- =====================================================
-- 3. FIX COMMISSIONS TABLE
-- =====================================================

-- Add quote_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'quote_id'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add invoice_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add agent_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add agent_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'agent_name'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN agent_name TEXT;
  END IF;
END $$;

-- Add customer_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN customer_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add customer_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN customer_name TEXT;
  END IF;
END $$;

-- Add booking_amount column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'booking_amount'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN booking_amount DECIMAL(12, 2);
  END IF;
END $$;

-- Rename rate to commission_rate if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'rate'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE public.commissions
    RENAME COLUMN rate TO commission_rate;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 10;
  END IF;
END $$;

-- Rename amount to commission_amount if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'amount'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'commission_amount'
  ) THEN
    ALTER TABLE public.commissions
    RENAME COLUMN amount TO commission_amount;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'commission_amount'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN commission_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add payment_method column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN payment_method TEXT;
  END IF;
END $$;

-- Add transaction_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN transaction_id TEXT;
  END IF;
END $$;

-- Add booking_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'commissions'
    AND column_name = 'booking_type'
  ) THEN
    ALTER TABLE public.commissions
    ADD COLUMN booking_type TEXT;
  END IF;
END $$;

-- Add indexes for commissions
CREATE INDEX IF NOT EXISTS idx_commissions_quote_id ON public.commissions(quote_id);
CREATE INDEX IF NOT EXISTS idx_commissions_invoice_id ON public.commissions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agent_id ON public.commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_customer_id ON public.commissions(customer_id);

-- =====================================================
-- 4. UPDATE EXISTING DATA (if needed)
-- =====================================================

-- Set default values for new invoice columns where null
UPDATE public.invoices
SET
  subtotal = COALESCE(subtotal, total),
  items = COALESCE(items, '[]'::jsonb),
  payments = COALESCE(payments, '[]'::jsonb)
WHERE subtotal IS NULL OR items IS NULL OR payments IS NULL;

-- =====================================================
-- 5. ADD DOCUMENTATION COMMENTS
-- =====================================================

COMMENT ON COLUMN public.expenses.status IS 'Status of the expense: pending, paid, cancelled';
COMMENT ON COLUMN public.expenses.payment_method IS 'Method used for payment';

COMMENT ON COLUMN public.invoices.amount IS 'Generated column: always equals total (backward compatibility)';
COMMENT ON COLUMN public.invoices.customer_id IS 'Reference to contacts table for customer information';

COMMENT ON COLUMN public.commissions.commission_amount IS 'Commission amount in base currency (renamed from amount)';
COMMENT ON COLUMN public.commissions.commission_rate IS 'Commission rate percentage (renamed from rate)';

COMMIT;

-- =====================================================
-- POST-MIGRATION INSTRUCTIONS
-- =====================================================
-- 1. After running this migration, execute the following to refresh PostgREST cache:
--    NOTIFY pgrst, 'reload schema';
--
-- 2. Verify the migration with:
--    SELECT column_name, data_type, is_generated, generation_expression
--    FROM information_schema.columns
--    WHERE table_schema = 'public'
--    AND table_name IN ('expenses', 'invoices', 'commissions')
--    ORDER BY table_name, ordinal_position;
--
-- 3. IMPORTANT API NOTES:
--    - For invoices: NEVER send 'amount' in INSERT/UPDATE payloads, only 'total'
--    - For commissions: Use 'commission_amount' and 'commission_rate', NOT 'amount'/'rate'
--    - For expenses: Always include 'status' and optionally 'payment_method'
-- =====================================================

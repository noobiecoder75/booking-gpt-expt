-- =====================================================
-- ADD TITLE FIELD TO EXPENSES TABLE
-- Date: 2026-01-07
-- Description: Adds title field to expenses table (required by application)
--              Backfills existing records with generated titles
-- =====================================================
-- SAFE TO RUN MULTIPLE TIMES (Idempotent)
-- Apply via: Supabase Dashboard SQL Editor OR npx supabase db push
-- After running: Execute NOTIFY pgrst, 'reload schema'; to refresh PostgREST cache
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ADD TITLE COLUMN TO EXPENSES
-- =====================================================

-- Add title column if missing (NOT NULL with default for existing rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'expenses'
    AND column_name = 'title'
  ) THEN
    -- First add as nullable
    ALTER TABLE public.expenses
    ADD COLUMN title TEXT;
    
    -- Backfill existing records with title based on description
    UPDATE public.expenses
    SET title = CASE
      WHEN vendor IS NOT NULL AND category IS NOT NULL THEN 
        vendor || ' - ' || REPLACE(INITCAP(category), '_', ' ')
      WHEN category IS NOT NULL THEN 
        REPLACE(INITCAP(category), '_', ' ')
      ELSE 
        LEFT(description, 50)
    END
    WHERE title IS NULL;
    
    -- Now make it NOT NULL
    ALTER TABLE public.expenses
    ALTER COLUMN title SET NOT NULL;
  END IF;
END $$;

-- =====================================================
-- 2. ADD DOCUMENTATION COMMENT
-- =====================================================

COMMENT ON COLUMN public.expenses.title IS 'Short title/summary of the expense (required)';

COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================
-- After running this migration:
-- 1. Execute: NOTIFY pgrst, 'reload schema';
-- 2. All new expense records MUST include a 'title' field
-- 3. Existing records have been backfilled with auto-generated titles
-- =====================================================


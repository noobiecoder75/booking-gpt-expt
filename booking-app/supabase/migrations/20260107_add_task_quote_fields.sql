-- Migration: Add quote and item references to tasks table
-- Date: 2026-01-07

-- 1. Add quote_id column
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL;

-- 2. Add quote_item_id column
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS quote_item_id UUID;

-- 3. Add item details metadata columns (to support faster lookups)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS item_type TEXT,
ADD COLUMN IF NOT EXISTS item_name TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_quote_id ON public.tasks(quote_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);


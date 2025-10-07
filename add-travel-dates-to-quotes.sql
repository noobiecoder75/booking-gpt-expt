-- =====================================================
-- Add Travel Dates to Quotes Table
-- =====================================================
-- Run this in Supabase SQL Editor
-- Adds travel_start_date and travel_end_date columns
-- =====================================================

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS travel_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS travel_end_date TIMESTAMPTZ;

-- Optional: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotes_travel_start_date ON quotes(travel_start_date);
CREATE INDEX IF NOT EXISTS idx_quotes_travel_end_date ON quotes(travel_end_date);

-- Optional: Add check constraint to ensure end date is after start date
ALTER TABLE quotes
ADD CONSTRAINT check_travel_dates
CHECK (travel_end_date IS NULL OR travel_start_date IS NULL OR travel_end_date >= travel_start_date);

-- Migration: Standardize "booked" and "cancelled" statuses across tables
-- Date: 2026-01-07

BEGIN;

-- 1. Update quotes table status constraint
ALTER TABLE public.quotes
  DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_status_check
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'booked', 'cancelled'));

-- 2. Update expenses table status constraint
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_status_check;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_status_check
    CHECK (status IN ('pending', 'paid', 'booked', 'cancelled'));

-- 3. Update bookings table status constraint
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('pending', 'confirmed', 'booked', 'cancelled', 'completed'));

-- 4. Update booking_items table status constraint
ALTER TABLE public.booking_items
  DROP CONSTRAINT IF EXISTS booking_items_booking_status_check;

ALTER TABLE public.booking_items
  ADD CONSTRAINT booking_items_booking_status_check
    CHECK (booking_status IN ('not_booked', 'pending', 'confirmed', 'booked', 'failed', 'cancelled'));

-- 5. Update payments table status constraint (consistency)
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'booked'));

COMMIT;

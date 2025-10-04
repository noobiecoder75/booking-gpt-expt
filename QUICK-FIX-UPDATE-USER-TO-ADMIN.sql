-- =====================================================
-- QUICK FIX: Update Current User to Admin Role
-- =====================================================
-- Run this SQL in Supabase SQL Editor to fix RLS error
-- This will update YOUR current user to admin role
-- =====================================================

-- Update the currently authenticated user to admin
UPDATE public.users
SET role = 'admin'
WHERE id = auth.uid();

-- Verify the update
SELECT id, email, role FROM public.users WHERE id = auth.uid();

-- =====================================================
-- Expected Output:
-- You should see your user with role = 'admin'
-- =====================================================

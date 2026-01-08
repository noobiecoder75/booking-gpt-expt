-- =====================================================
-- FIX COMMISSIONS RLS POLICIES
-- Date: 2026-01-07
-- Description: Adds missing INSERT and UPDATE policies for commissions table
--              to allow agents to manage their own commissions.
-- =====================================================

BEGIN;

-- Drop existing restricted policies if they exist (to ensure we don't have duplicates)
DROP POLICY IF EXISTS "Users can insert their own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users can update their own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins and owners can create commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins and owners can update commissions" ON public.commissions;

-- Add INSERT policy for commissions
-- Allows admins or the owner (user_id) to create commission records
CREATE POLICY "Admins and owners can create commissions" ON public.commissions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

-- Add UPDATE policy for commissions
-- Allows admins or the owner (user_id) to update commission records
CREATE POLICY "Admins and owners can update commissions" ON public.commissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

-- Ensure DELETE policy exists for admins
DROP POLICY IF EXISTS "Admins can delete commissions" ON public.commissions;
CREATE POLICY "Admins can delete commissions" ON public.commissions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Note: "Users can view their own commissions" and "Admins can manage all commissions" 
-- already exist from the initial schema, but "manage all" uses FOR ALL which includes
-- SELECT, INSERT, UPDATE, DELETE. We've added specific owner-based policies for 
-- INSERT and UPDATE.

COMMIT;


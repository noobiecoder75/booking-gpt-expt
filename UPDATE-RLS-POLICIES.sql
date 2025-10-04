-- =====================================================
-- UPDATE RLS POLICIES FOR ROLE-BASED ACCESS
-- =====================================================
-- Run this AFTER running contacts-schema-production.sql
-- This updates ONLY the RLS policies without recreating tables
-- =====================================================

-- Drop old contacts policies
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

-- New role-based policies for contacts
CREATE POLICY "Admins can view all contacts" ON public.contacts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Agents can view their own contacts" ON public.contacts
  FOR SELECT USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'agent')
  );

CREATE POLICY "Admins can create any contact" ON public.contacts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Agents can create their own contacts" ON public.contacts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'agent')
  );

CREATE POLICY "Admins can update any contact" ON public.contacts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Agents can update their own contacts" ON public.contacts
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'agent')
  );

CREATE POLICY "Admins can delete any contact" ON public.contacts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Agents can delete their own contacts" ON public.contacts
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'agent')
  );

-- Update the handle_new_user trigger to make first user admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if this is the first user signing up (workspace owner)
  SELECT COUNT(*) INTO user_count FROM public.users;

  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN user_count = 0 THEN 'admin' ELSE 'agent' END
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, ignore
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check your current role
SELECT id, email, role FROM public.users WHERE id = auth.uid();

-- List all policies on contacts table
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'contacts';

-- =====================================================
-- Expected Output:
-- 1. Your role should be 'admin'
-- 2. You should see 8 policies on contacts table
-- =====================================================

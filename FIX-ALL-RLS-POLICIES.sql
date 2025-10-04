-- =====================================================
-- COMPREHENSIVE RLS FIX - ALL TABLES
-- Single file to fix all role-based access issues
-- =====================================================
-- Run this ONCE in Supabase SQL Editor
-- This updates ALL table policies + trigger function
-- Keeps all existing users and data intact
-- =====================================================

-- =====================================================
-- PART 1: UPDATE TRIGGER FOR FIRST USER = ADMIN
-- =====================================================

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
-- PART 2: CONTACTS POLICIES (Role-Based)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Agents can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can create any contact" ON public.contacts;
DROP POLICY IF EXISTS "Agents can create their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can update any contact" ON public.contacts;
DROP POLICY IF EXISTS "Agents can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can delete any contact" ON public.contacts;
DROP POLICY IF EXISTS "Agents can delete their own contacts" ON public.contacts;

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

-- =====================================================
-- PART 3: QUOTES POLICIES (Role-Based)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can create their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins and owners can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins and owners can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins and owners can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins and owners can delete quotes" ON public.quotes;

CREATE POLICY "Admins and owners can view quotes" ON public.quotes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can create quotes" ON public.quotes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can update quotes" ON public.quotes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can delete quotes" ON public.quotes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

-- =====================================================
-- PART 4: INVOICES POLICIES (Role-Based)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins and owners can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins and owners can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins and owners can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins and owners can delete invoices" ON public.invoices;

CREATE POLICY "Admins and owners can view invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can create invoices" ON public.invoices
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can update invoices" ON public.invoices
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can delete invoices" ON public.invoices
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

-- =====================================================
-- PART 5: BOOKINGS POLICIES (Role-Based)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins and owners can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins and owners can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins and owners can update bookings" ON public.bookings;

CREATE POLICY "Admins and owners can view bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can update bookings" ON public.bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

-- =====================================================
-- PART 6: PAYMENTS POLICIES (Role-Based)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins and owners can view payments" ON public.payments;
DROP POLICY IF EXISTS "Admins and owners can create payments" ON public.payments;

CREATE POLICY "Admins and owners can view payments" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can create payments" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

-- =====================================================
-- PART 7: TASKS POLICIES (Role-Based)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and owners can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and owners can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and owners can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and owners can delete tasks" ON public.tasks;

CREATE POLICY "Admins and owners can view tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can update tasks" ON public.tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can delete tasks" ON public.tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all policies are created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('contacts', 'quotes', 'invoices', 'bookings', 'payments', 'tasks')
ORDER BY tablename, cmd;

-- Check your user role
SELECT id, email, role, created_at
FROM public.users
WHERE id = auth.uid();

-- =====================================================
-- COMPLETE!
-- =====================================================
-- ✅ All tables now have role-based policies
-- ✅ Admins can access everything
-- ✅ Agents can access only their own data
-- ✅ Trigger updated for first user = admin
-- ✅ All existing data preserved
-- =====================================================

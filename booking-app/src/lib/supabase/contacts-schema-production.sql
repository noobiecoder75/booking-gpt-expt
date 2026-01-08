-- =====================================================
-- BOOKINGGPT PRODUCTION DATABASE SCHEMA
-- Complete & Aligned with Frontend Types
-- =====================================================
-- Version: 2.0
-- Created: October 2025
-- Purpose: Production-ready schema with ALL relationships fixed
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE (Extends Supabase Auth)
-- =====================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  role TEXT CHECK (role IN ('admin', 'agent', 'client')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 2. CONTACTS TABLE (FIXED - Matches Frontend)
-- =====================================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Name fields (FIXED: split firstName/lastName matching frontend)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Contact type (ADDED: missing from integration.md)
  type TEXT DEFAULT 'customer' CHECK (type IN ('customer', 'supplier')),

  -- Additional fields
  company TEXT,
  notes TEXT,
  tags TEXT[], -- Array of tags for categorization

  -- Complex fields as JSONB (ADDED: missing from integration.md)
  address JSONB, -- { street, city, state, zipCode, country }
  preferences JSONB, -- { preferredAirlines[], seatPreference, hotelPreference[], budgetRange }

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for contacts
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_type ON public.contacts(type);
CREATE INDEX idx_contacts_first_name ON public.contacts(first_name);
CREATE INDEX idx_contacts_last_name ON public.contacts(last_name);

-- =====================================================
-- 3. QUOTES TABLE (FIXED - Uses contact_id not client_id)
-- =====================================================
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL, -- FIXED: was client_id

  quote_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  total_amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  items JSONB NOT NULL,
  valid_until DATE,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for quotes
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_contact_id ON public.quotes(contact_id); -- FIXED
CREATE INDEX idx_quotes_status ON public.quotes(status);

-- =====================================================
-- 4. INVOICES TABLE (ADDED - Was missing from schema.sql!)
-- =====================================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL, -- ADDED
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,

  invoice_number TEXT UNIQUE NOT NULL,

  -- Financial details
  total DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  remaining_amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled')),

  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,

  -- Line items as JSONB array
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Payment tracking
  payments JSONB DEFAULT '[]'::jsonb, -- Array of payment records

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for invoices
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_contact_id ON public.invoices(contact_id);
CREATE INDEX idx_invoices_quote_id ON public.invoices(quote_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

-- =====================================================
-- 5. BOOKINGS TABLE (FIXED - Proper relationships)
-- =====================================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL, -- ADDED

  booking_reference TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

  total_amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  booking_data JSONB NOT NULL,

  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for bookings
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_contact_id ON public.bookings(contact_id);
CREATE INDEX idx_bookings_quote_id ON public.bookings(quote_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- =====================================================
-- 6. PAYMENTS TABLE (FIXED - Links to contacts)
-- =====================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL, -- ADDED
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL, -- ADDED
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,

  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Stripe integration
  stripe_payment_intent_id TEXT,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for payments
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_contact_id ON public.payments(contact_id);
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_stripe_pi ON public.payments(stripe_payment_intent_id);

-- =====================================================
-- 7. HOTELS TABLE (API Caching)
-- =====================================================
CREATE TABLE public.hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location JSONB NOT NULL,
  rating DECIMAL(2, 1),
  amenities JSONB,
  images JSONB,
  description TEXT,
  cached_rates JSONB,
  last_fetched TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 8. FLIGHTS TABLE (API Caching)
-- =====================================================
CREATE TABLE public.flights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_number TEXT NOT NULL,
  airline TEXT NOT NULL,
  departure_airport TEXT NOT NULL,
  arrival_airport TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
  price_data JSONB,
  cached_availability JSONB,
  last_fetched TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 9. COMMISSIONS TABLE
-- =====================================================
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,

  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  rate DECIMAL(5, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),

  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for commissions
CREATE INDEX idx_commissions_user_id ON public.commissions(user_id);
CREATE INDEX idx_commissions_booking_id ON public.commissions(booking_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);

-- =====================================================
-- 10. TASKS TABLE
-- =====================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL, -- ADDED
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL, -- ADDED

  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for tasks
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_contact_id ON public.tasks(contact_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Contacts policies (Role-Based Access Control)
-- Admins can view all contacts in their workspace
CREATE POLICY "Admins can view all contacts" ON public.contacts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Agents can only view their own contacts
CREATE POLICY "Agents can view their own contacts" ON public.contacts
  FOR SELECT USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'agent')
  );

-- Admins can create contacts (will be owned by them or assigned user)
CREATE POLICY "Admins can create any contact" ON public.contacts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Agents can create their own contacts only
CREATE POLICY "Agents can create their own contacts" ON public.contacts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'agent')
  );

-- Admins can update any contact
CREATE POLICY "Admins can update any contact" ON public.contacts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Agents can update their own contacts only
CREATE POLICY "Agents can update their own contacts" ON public.contacts
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'agent')
  );

-- Admins can delete any contact
CREATE POLICY "Admins can delete any contact" ON public.contacts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Agents can delete their own contacts only
CREATE POLICY "Agents can delete their own contacts" ON public.contacts
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'agent')
  );

-- Quotes policies (Role-Based Access Control)
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

-- Invoices policies (Role-Based Access Control)
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

-- Bookings policies (Role-Based Access Control)
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

-- Hotels policies (public read, authenticated write)
CREATE POLICY "Anyone can view hotels" ON public.hotels
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert hotels" ON public.hotels
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update hotels" ON public.hotels
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Flights policies (public read, authenticated write)
CREATE POLICY "Anyone can view flights" ON public.flights
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert flights" ON public.flights
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update flights" ON public.flights
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Payments policies (Role-Based Access Control)
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

-- Commissions policies
CREATE POLICY "Users can view their own commissions" ON public.commissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and owners can create commissions" ON public.commissions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can update commissions" ON public.commissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins can manage all commissions" ON public.commissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tasks policies (Role-Based Access Control)
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
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flights_updated_at BEFORE UPDATE ON public.flights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
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

-- Trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- All tables created with proper relationships
-- contacts ← quotes ← invoices ← payments
-- contacts ← bookings ← payments
-- contacts ← tasks
-- RLS policies enforced on all tables
-- Auto-updating timestamps configured
-- =====================================================

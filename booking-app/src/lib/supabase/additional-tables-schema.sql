-- =====================================================
-- BOOKINGGPT - ADDITIONAL TABLES SCHEMA
-- Missing: expenses, rates, transactions, settings
-- =====================================================
-- Run this AFTER contacts-schema-production.sql
-- =====================================================

-- =====================================================
-- 1. EXPENSES TABLE
-- =====================================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL,
  subcategory TEXT,

  -- Supplier information
  vendor TEXT,
  supplier_id TEXT,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,

  date DATE NOT NULL,
  receipt_url TEXT, -- Supabase Storage URL

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for expenses
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_booking_id ON public.expenses(booking_id);

-- =====================================================
-- 2. RATES TABLE (Pricing Configuration)
-- =====================================================
CREATE TABLE public.rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL for platform rates

  type TEXT NOT NULL CHECK (type IN ('hotel', 'flight', 'transfer', 'activity', 'package')),
  provider TEXT, -- 'hotelbeds', 'amadeus', 'sabre', 'platform', 'custom'

  name TEXT NOT NULL,
  description TEXT,

  base_price DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Markup configuration
  markup_type TEXT DEFAULT 'percentage' CHECK (markup_type IN ('percentage', 'fixed')),
  markup_value DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Validity
  valid_from DATE,
  valid_until DATE,

  -- Rate details (hotel names, room types, flight routes, etc.)
  metadata JSONB,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for rates
CREATE INDEX idx_rates_type ON public.rates(type);
CREATE INDEX idx_rates_user_id ON public.rates(user_id);
CREATE INDEX idx_rates_validity ON public.rates(valid_from, valid_until);
CREATE INDEX idx_rates_active ON public.rates(is_active);

-- =====================================================
-- 3. TRANSACTIONS TABLE (Financial Ledger)
-- =====================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'commission', 'refund')),
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  description TEXT,

  -- Links to related records
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  commission_id UUID REFERENCES public.commissions(id) ON DELETE SET NULL,

  date DATE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for transactions
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_quote_id ON public.transactions(quote_id);
CREATE INDEX idx_transactions_payment_id ON public.transactions(payment_id);

-- =====================================================
-- 4. SETTINGS TABLE (User Preferences)
-- =====================================================
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Business settings
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_logo_url TEXT,
  business_address JSONB, -- { street, city, state, zip, country }

  -- Default markup
  default_markup_percentage DECIMAL(5, 2) DEFAULT 10.00,

  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  booking_notifications BOOLEAN DEFAULT true,

  -- Preferences
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  date_format TEXT DEFAULT 'MM/DD/YYYY',

  -- Stripe Connect (for commission payouts)
  stripe_connect_account_id TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  UNIQUE(user_id)
);

-- Indexes for settings
CREATE INDEX idx_settings_user_id ON public.settings(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Expenses policies (Own data only)
CREATE POLICY "Users can view their own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Rates policies (Own + Platform)
CREATE POLICY "Users can view their own rates" ON public.rates
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own rates" ON public.rates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rates" ON public.rates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rates" ON public.rates
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage platform rates" ON public.rates
  FOR ALL USING (
    user_id IS NULL AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Transactions policies (Own data only)
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Settings policies (Own data only)
CREATE POLICY "Users can view their own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rates_updated_at BEFORE UPDATE ON public.rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-CREATE DEFAULT SETTINGS FOR NEW USERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.settings (user_id, currency, timezone)
  VALUES (NEW.id, 'USD', 'UTC')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default settings when user is created
CREATE TRIGGER on_user_created_settings
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- =====================================================
-- SCHEMA COMPLETE - ADDITIONAL TABLES
-- =====================================================
-- expenses: Track supplier payments and business expenses
-- rates: Pricing and markup configuration
-- transactions: Financial ledger (all money in/out)
-- settings: User preferences and business config
-- =====================================================

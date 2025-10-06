-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  category TEXT NOT NULL CHECK (category IN (
    'supplier_payment',
    'marketing',
    'operational',
    'commission',
    'office',
    'travel',
    'technology',
    'other'
  )),
  subcategory TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,

  description TEXT NOT NULL,
  date DATE NOT NULL,
  vendor TEXT,
  supplier_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  receipt_url TEXT,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_date TIMESTAMP WITH TIME ZONE,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN (
    'credit_card',
    'bank_transfer',
    'cash',
    'check',
    'paypal',
    'stripe',
    'auto_deducted'
  )),

  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')),

  booking_id TEXT,
  agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  tags TEXT[],
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for better query performance
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX idx_expenses_supplier_id ON public.expenses(supplier_id);
CREATE INDEX idx_expenses_booking_id ON public.expenses(booking_id);
CREATE INDEX idx_expenses_agent_id ON public.expenses(agent_id);

-- RLS Policies
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Users can view their own expenses
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own expenses
CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own expenses
CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own expenses
CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

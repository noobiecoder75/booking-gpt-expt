#!/bin/bash

# Apply database migrations to Supabase
# This script applies the pending migrations to fix database schema issues

echo "🚀 Applying database migrations to Supabase..."
echo ""

# Change to the booking-app directory
cd /Users/tej/Documents/VSCode/booking-gpt-expt/booking-app

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "Run: brew install supabase/tap/supabase"
    exit 1
fi

echo "📋 Migrations to apply:"
echo "1. 20250107_add_payment_fields.sql - Add payment fields"
echo "2. 20250113_fix_missing_columns.sql - Fix missing columns in expenses, commissions, invoices"
echo ""

# Apply migrations to the remote database
echo "🔄 Applying migrations to remote database..."
echo "This will apply the migrations directly to your production Supabase database."
echo ""

# Push migrations to remote database
npx supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations applied successfully!"
    echo ""
    echo "The following fixes have been applied:"
    echo "- Added missing 'status' column to expenses table"
    echo "- Added missing 'amount' column to commissions table"
    echo "- Fixed 'amount' column in invoices table"
    echo "- Added payment fields to payments table"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Restart your development server: npm run dev"
    echo "2. Test the authentication flow by:"
    echo "   - Logging out completely"
    echo "   - Clearing browser cookies/cache"
    echo "   - Logging in again"
    echo "   - Refreshing the page to test auth persistence"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    echo "Alternative: You can manually apply the migrations via Supabase Dashboard:"
    echo "1. Go to your Supabase Dashboard > SQL Editor"
    echo "2. Copy the contents of supabase/migrations/20250107_add_payment_fields.sql"
    echo "3. Run the SQL"
    echo "4. Copy the contents of supabase/migrations/20250113_fix_missing_columns.sql"
    echo "5. Run the SQL"
fi
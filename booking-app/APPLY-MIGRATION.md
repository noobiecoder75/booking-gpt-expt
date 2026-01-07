# Quick Migration Guide

## Apply the Expenses Title Field Migration

### Option 1: Supabase Dashboard (Recommended for Production)

1. Log into your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of:
   ```
   supabase/migrations/20260107_add_expenses_title_field.sql
   ```
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for success message
8. Run this to refresh the API cache:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

### Option 2: Supabase CLI (Local/Development)

```bash
cd booking-app
npx supabase db push
```

### Verification

Check that the migration was successful:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'expenses'
  AND column_name = 'title';
```

Expected result:
```
column_name | data_type | is_nullable
------------|-----------|------------
title       | text      | NO
```

### After Migration

1. **Deploy the code changes** to Vercel (they will be auto-deployed on push to main)
2. **Test the payment flow** to ensure expenses are created successfully
3. **Check Vercel logs** to confirm no more 23502 errors

---

## Troubleshooting

### If migration fails with "column already exists"
The migration is idempotent - it's safe to run multiple times.

### If you get "permission denied"
Make sure you're using the Service Role key or have admin access in Supabase Dashboard.

### If existing expenses have NULL titles
The migration includes a backfill step that should handle this automatically.
If you see NULL titles after migration, run:
```sql
UPDATE public.expenses
SET title = CASE
  WHEN vendor IS NOT NULL AND category IS NOT NULL THEN 
    vendor || ' - ' || REPLACE(INITCAP(category), '_', ' ')
  WHEN category IS NOT NULL THEN 
    REPLACE(INITCAP(category), '_', ' ')
  ELSE 
    LEFT(description, 50)
END
WHERE title IS NULL;
```

---

## Need Help?

Check the full documentation in: `/FIXES-2026-01-07.md`


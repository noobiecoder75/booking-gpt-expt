# AI Mistakes Log

This document tracks recurring errors made during development to prevent them from happening again.

---

## Error #1: Missing `cn` Import (January 7, 2026)

### Error Description
```
ReferenceError: cn is not defined
    at eR (page-9f6541353f926a44.js:1:140727)
```

### Root Cause
Components were using the `cn()` utility function for className merging without importing it from `@/lib/utils`.

### Affected Files
- `booking-app/src/components/quote-wizard/FilterControls.tsx` - Line 140
- `booking-app/src/components/quote-wizard/QuoteDetails.tsx` - Line 202
- `booking-app/src/components/bookings/BookingDetailsModal.tsx` - Line 72
- `booking-app/src/components/bookings/BookingItemsList.tsx` - Line 37

### Why This Happened
When adding conditional className logic, the `cn()` function was used directly without ensuring the import statement was present. This is a common oversight when:
1. Copying code from other components
2. Adding dynamic styling to existing components
3. Not running TypeScript checks before committing

### The Fix
Added the missing import statement to both files:
```typescript
import { cn } from '@/lib/utils';
```

### Prevention Strategy
1. **Always check imports** when using utility functions like `cn`, `formatCurrency`, etc.
2. **Run TypeScript checks** before testing in browser: `npm run type-check` or ensure your IDE shows type errors
3. **Use ESLint** to catch undefined references
4. **Pattern to follow**: When using `cn()`, always verify the import exists:
   ```typescript
   import { cn } from '@/lib/utils';
   ```

### How to Detect This Error
- Browser console shows: `ReferenceError: cn is not defined`
- TypeScript compiler error: `Cannot find name 'cn'`
- The error typically occurs when navigating to pages that render the affected components

### Related Utilities
Other commonly used utilities from `@/lib/utils` that require imports:
- `cn()` - className merging
- `formatCurrency()` - currency formatting
- `formatDate()` - date formatting
- `formatDateTime()` - date/time formatting
- `getContactDisplayName()` - contact name formatting
- `calculateQuoteTotal()` - quote calculations

---

## Best Practices Checklist

When adding or modifying components:
- [ ] Check all utility function imports
- [ ] Run TypeScript type checking
- [ ] Test the component in the browser
- [ ] Check browser console for errors
- [ ] Verify ESLint shows no warnings


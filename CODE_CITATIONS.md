# Code Citations & Error Tracking

A comprehensive guide to all errors encountered, solved, and pending in the PayMe UI project, with solutions and prevention strategies.

---

## 📊 Error Summary Dashboard

| #   | Error                                 | Type        | Status       | Date   | File                    | Fix                                    |
| --- | ------------------------------------- | ----------- | ------------ | ------ | ----------------------- | -------------------------------------- |
| 1   | CSS `tw-animate-css` import not found | Build       | ✅ RESOLVED  | Feb 17 | globals.css             | Removed unused import                  |
| 2   | CSS @import rule ordering violation   | Build       | ✅ RESOLVED  | Feb 17 | globals.css             | Removed redundant Google Fonts @import |
| 3   | TypeScript implicit 'any' types       | Type Safety | ✅ MITIGATED | Feb 17 | lib/api.ts              | Added explicit `any` types (temporary) |
| 4   | React NaN value in input field        | Runtime     | ✅ RESOLVED  | Feb 17 | admin/invoices/page.tsx | Added empty value handling             |

---

## ✅ RESOLVED ERRORS

### Error #1: CSS tw-animate-css Import Not Found

**Status:** ✅ RESOLVED  
**Severity:** Medium  
**Date Reported:** February 17, 2026

#### Problem

```css
/* ❌ ERROR: Cannot resolve 'tw-animate-css' */
@import "tw-animate-css";
```

#### Root Cause

The `tw-animate-css` package was not installed, and Tailwind CSS v4 with built-in animation utilities makes this import unnecessary.

#### Solution

```css
/* ✅ REMOVED: No longer needed */
/* Tailwind CSS v4 provides @keyframes and animation utilities natively */
```

#### Files Changed

- `app/globals.css` — Removed line: `@import "tw-animate-css";`

#### Prevention

- Don't import CSS packages that aren't in `package.json`
- Use Tailwind's native utilities for animations (e.g., `animate-spin`, `animate-pulse`)

---

### Error #2: CSS @import Rule Ordering Violation

**Status:** ✅ RESOLVED  
**Severity:** High (Compilation Blocker)  
**Date Reported:** February 17, 2026

#### Problem

```
Parsing CSS source code failed
@import rules must precede all rules aside from @charset and @layer statements
```

#### Root Cause

Tailwind CSS v4 expands `@import "tailwindcss"` into thousands of CSS rules at compile time. A subsequent `@import url(...)` for Google Fonts violated CSS spec order requirements.

#### Solution

1. Removed `@import url(...)` from globals.css
2. Kept font loading via `next/font/google` in layout.tsx (self-hosted, faster)
3. Updated Tailwind `--font-sans` to reference `var(--font-inter)`

#### Files Changed

- `app/globals.css` — Removed `@import url(...)` line, updated font variable
- `app/layout.tsx` — Verified `next/font/google` import exists

#### Prevention Checklist

- ✅ Always place `@import` rules at the top of CSS files
- ✅ In Next.js, use `next/font` instead of Google Fonts CSS imports
- ✅ Test CSS compilation after modifying import order
- ✅ Clear `.next` cache when changing font loading methods

---

### Error #4: React NaN Value in Input Field

**Status:** ✅ RESOLVED  
**Severity:** High (Runtime Error)  
**Date Reported:** February 17, 2026

#### Problem

```
Received NaN for the `value` attribute. If this is expected, cast the value to a string.
  at Input (components/ui/input.tsx:7:5)
  at render (app/admin/invoices/page.tsx:146:27)
```

#### Root Cause

Number input field was calling `parseFloat(e.target.value)` on empty strings:

```typescript
// ❌ BROKEN: parseFloat("") returns NaN
onChange={(e) => field.onChange(parseFloat(e.target.value))}
```

#### Solution

Implemented proper empty value handling:

```typescript
// ✅ FIXED
value={field.value === 0 ? "" : field.value}
onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
```

#### Files Changed

- `app/admin/invoices/page.tsx` — Updated amount FormField (lines 139-153)

#### Prevention Checklist

- ✅ Always handle empty input cases with `parseFloat()`
- ✅ Use conditional checks before type conversion
- ✅ Test inputs by clearing values while typing
- ✅ Monitor browser console for React warnings

---

## 🟡 MITIGATED ERRORS (Temporary Fix)

### Error #3: TypeScript Implicit 'any' Types

**Status:** 🟡 MITIGATED (Temporary)  
**Severity:** Medium  
**Date Reported:** February 17, 2026

#### Problem

Multiple TypeScript errors in `lib/api.ts`:

```typescript
// ❌ Implicit 'any' type
createMilestone(milestoneData) { /* ... */ }
```

#### Current Solution (Temporary)

Added explicit `any` types to allow build:

```typescript
// 🟡 MITIGATED: Explicit any (temporary fix)
createMilestone(milestoneData: any) { /* ... */ }
```

#### Proper Long-term Solution

Define interfaces for all API entities:

```typescript
// ✅ PROPER: Type-safe with interfaces
interface MilestoneData {
  contract_id: string;
  description: string;
  amount: number;
  due_date: string;
  completed_at?: string | null;
}

createMilestone(milestoneData: MilestoneData): Promise<Milestone> {
  // Implementation
}
```

#### Recommended Action Plan

**Phase 1 (URGENT):**

- Define interfaces for: Client, Contract, Invoice, Tier, Template, Milestone
- Update API methods with proper typing
- Enable `strict: true` in tsconfig.json

**Phase 2 (1-2 weeks):**

- Add Zod or similar for runtime type validation
- Implement type guards for API responses
- Add unit tests for API type safety

**Phase 3 (Ongoing):**

- Maintain strict typing as new features are added
- Review type coverage in CI/CD pipeline
- Document API type contracts

---

## 🔴 PENDING ERRORS

### Potential Issues to Monitor

#### 1. XSS Risk in Public Contract Viewer

**File:** `app/public/[...slug]/page.tsx` (line 159)  
**Risk:** `dangerouslySetInnerHTML` renders user content without sanitization

```typescript
// ⚠️ POTENTIAL RISK
<div dangerouslySetInnerHTML={{ __html: data.contract.current_version.content }} />
```

**Solution:** Implement HTML sanitization:

```typescript
import DOMPurify from 'isomorphic-dompurify';

// ✅ SAFE
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(data.contract.current_version.content)
}} />
```

**Prevention:** Add DOMPurify to package dependencies

---

#### 2. Missing Type Safety in Form Handlers

**Files:** All admin pages with forms  
**Risk:** Form data not validated before API calls

**Solution:** Implement Zod validation:

```typescript
import { z } from "zod";

const InvoiceSchema = z.object({
  client: z.string().min(1, "Client is required"),
  amount: z.number().min(0.01, "Amount must be positive"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

// In form submission
const validData = InvoiceSchema.parse(formData);
await api.createInvoice(validData);
```

---

#### 3. Error Boundary Missing

**File:** `app/layout.tsx`  
**Risk:** Runtime errors in child components crash entire app

**Solution:** Add Error Boundary component

---

## 📋 Error Prevention Checklist

### Before Committing Code

- [ ] Run `pnpm build` to catch compilation errors
- [ ] Check browser console for warnings/errors
- [ ] Test form inputs with edge cases (empty, invalid, overflow)
- [ ] Verify TypeScript compilation with `pnpm tsc --noEmit`
- [ ] Run `pnpm lint` to catch style issues

### CSS Best Practices

- [ ] Verify all `@import` statements are at file start
- [ ] Use Tailwind utilities instead of custom CSS where possible
- [ ] Test in multiple browsers for compatibility

### React Best Practices

- [ ] Never pass NaN, undefined, or null to `value` attributes without handling
- [ ] Use TypeScript strict mode to catch type errors early
- [ ] Test form fields with rapid user input
- [ ] Avoid `dangerouslySetInnerHTML` without sanitization

### API & TypeScript

- [ ] Define interfaces for all API data structures
- [ ] Validate API responses before using
- [ ] Use explicit types instead of `any`
- [ ] Add error boundaries around async operations

---

## 🔧 Tools & Resources

### Error Detection

- **TypeScript Compiler:** `pnpm tsc --noEmit`
- **ESLint:** `pnpm lint`
- **Next.js Build:** `pnpm build`
- **Browser DevTools:** F12 to check console

### Debugging Techniques

1. **Console Logging:** Add `console.log()` to track variable values
2. **React DevTools:** Install React extension to inspect component state
3. **Network Tab:** Check API responses and timing
4. **Performance Tab:** Identify slow operations
5. **Source Map:** Use browser debugger with source maps

### Useful Dependencies

- `isomorphic-dompurify` — HTML sanitization
- `zod` — Runtime type validation
- `react-hook-form` — Form state management
- `@tanstack/react-query` — Data fetching with caching

---

## 📚 Documentation Links

- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Tailwind CSS v4 Migration](https://tailwindcss.com/docs/upgrade-guide)
- [React Form Best Practices](https://react-hook-form.com/)
- [Zod Schema Validation](https://zod.dev/)
- [OWASP XSS Prevention](https://owasp.org/www-community/attacks/xss/)

---

**Last Updated:** February 17, 2026  
**Maintained By:** GitHub Copilot  
**Next Review:** Weekly

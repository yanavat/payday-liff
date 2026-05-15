# Phase 9.5 Completion — Design Spec

**Date:** 2026-05-15  
**Scope:** Complete remaining LIFF employee screen API integration tasks

---

## Tasks Covered

1. Replace PIN confirmation with backend-issued one-time confirmation code flow
2. Update E-5 Profile screen to use real API for employee profile and settings
3. Replace LINE profile picture with backend employee data if LINE profile unavailable
4. Implement real-time balance updates via polling (30s interval)

---

## Approach

Approach A — Minimal wire-up: connect existing hooks directly in each screen, add a realistic mock OTP service, and add 30s polling via `setInterval`. Mirrors the HR screen migration pattern already proven in Phase 9.6. No new abstraction layers.

---

## 1. OTP Confirmation Flow

**File:** `lib/api/services/otp.ts` (new)

Mock-only implementation that matches the expected backend contract:

- `sendCode(employeeId: string): Promise<{ codeId: string; expiresAt: string }>` — always succeeds, stores a random 6-digit code keyed by `codeId` in a module-level Map
- `verifyCode(codeId: string, code: string): Promise<{ valid: boolean }>` — validates code from the Map, removes on success, returns `{ valid: false }` on mismatch or expiry

**Update:** `components/liff-request-page.tsx`

- On entering step 2 (review): call `sendCode(employeeId)`, store returned `codeId` in state
- On OTP submit: call `verifyCode(codeId, enteredCode)` instead of hardcoded `=== '000000'` check
- Show loading state during verify call
- Clear `codeId` on success; on failure show existing `otpError` message

No change to UX — same 6-digit input, same error messaging.

---

## 2. E-5 Profile — Real API

**File:** `components/liff-profile-page.tsx`

Replace `currentEmployee` mock import with `useEmployee(employeeId)`:

- Employee ID comes from LIFF linking context (already stored after link flow; read from `localStorage` key `linked_employee_id`)
- Show skeleton loader while fetching
- Display `employee.name`, `employee.employeeCode`, `employee.department`, `employee.payCycle`, `employee.bankAccountMasked`, `employee.bankName` from API response
- EWA limit / progress bar: wire to `useEmployeeCurrentPeriod(employeeId)` for `maxWithdrawable` and `previousEWAThisPeriod`

**Notification toggles:**

- On toggle change: call `settingsService.updateNotifications({ approvalAlerts, paydayReminders, lineNotifications })` 
- Optimistic local state update; revert on API error

**Bank account:** read-only display from `employee.bankAccountMasked` + `employee.bankName`; the edit sheet remains local state only (no backend write endpoint yet — same as current behavior).

---

## 3. LINE Profile Picture Fallback

**Files:** `components/liff-profile-page.tsx`, `components/liff-home-page.tsx`

Current: `liffProfile.pictureUrl` used directly.  
Change: if `pictureUrl` is falsy, render a fallback avatar showing the employee's initials (first letter of first name + first letter of last name, derived from `employee.name`).

Implementation: small `<EmployeeAvatar>` component (inline, not a new file) that renders `<img>` when URL is present, or a `<div>` with initials + background color otherwise.

---

## 4. Balance Polling — E-2 Home

**File:** `components/liff-home-page.tsx`

Replace hardcoded balance constants with API data:

- `useEmployeeCurrentPeriod(employeeId)` → `earnedToDate`, `previousEWAThisPeriod`, `maxWithdrawable`, `periodEnd`, `cutoffDate`, `daysElapsed`, `totalDays`
- `useEWARequests({ employeeId, limit: 3 })` → recent requests list

**Polling:**

```ts
useEffect(() => {
  const id = setInterval(refetchPeriod, 30_000)
  return () => clearInterval(id)
}, [refetchPeriod])
```

Same pattern for `refetchRequests`. Show loading shimmer only on initial load; subsequent polls are silent (no loading flicker).

---

## 5. Error Handling

All screens follow the HR screen pattern already established:

- Initial load error: show inline error message with retry button
- Poll error: silent (don't disrupt UI); log to console
- OTP verify error: show existing `otpError` message
- Notification toggle error: revert optimistic state, show toast

---

## 6. Tests

New unit tests in `__tests__/` or co-located `.test.ts` files:

| Test file | What's tested |
|-----------|---------------|
| `lib/api/services/otp.test.ts` | sendCode returns codeId, verifyCode accepts correct code, rejects wrong code, rejects after expiry |
| `components/liff-profile-page.test.tsx` | renders employee data from hook, calls updateNotifications on toggle, falls back to initials when no picture URL |
| `components/liff-home-page.test.tsx` | renders balance from currentPeriod hook, poll interval set up and cleared on unmount |
| `components/liff-request-page.test.tsx` | OTP flow calls sendCode on step 2 enter, verifyCode on submit, shows error on wrong code |

Test runner: vitest. Mock fetch via `vi.mock`.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/api/services/otp.ts` | New — mock OTP service |
| `components/liff-request-page.tsx` | Wire OTP service |
| `components/liff-profile-page.tsx` | Wire employee + settings API, avatar fallback |
| `components/liff-home-page.tsx` | Wire currentPeriod + requests API, add polling, avatar fallback |
| `lib/api/services/otp.test.ts` | New — OTP service tests |
| `components/liff-profile-page.test.tsx` | New — profile screen tests |
| `components/liff-home-page.test.tsx` | New — home screen tests |
| `components/liff-request-page.test.tsx` | New or update — request OTP tests |

---

## Out of Scope

- Backend OTP endpoint (not yet built)
- Bank account write API
- WebSocket real-time updates
- E2E tests

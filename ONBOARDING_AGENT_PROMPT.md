# Agent Prompt: Multi-Company Employee Onboarding

## Objective

Implement multi-company employee onboarding for a LINE LIFF app. Workers scan a factory QR code (or open from Rich Menu), enter their Company Code + Employee ID, verify via SMS OTP, and link their LINE account to their employee record.

## Architecture Summary

This is a **Next.js 14 App Router** project using `next-intl` for i18n. The employee-facing LIFF app lives under `app/(liff)/` and `app/[locale]/(liff)/`. Auth is handled client-side by `LIFFAuthGate` in the layout — it gates all child pages. The onboarding flow is **not a new route** — it renders inside the existing auth gate when `authState === "linking"`.

## Important: Backend is a separate repo

The backend lives at `../payday-backend/` (NestJS + TypeORM + SQLite). **This prompt is for the frontend only.** The three API endpoints this feature calls (`POST /employees/verify`, `POST /auth/otp/send`, `POST /auth/otp/verify`) do not exist yet on the backend. The frontend should call them via the existing `ApiClient` — they will return real responses once the backend is deployed. Do NOT create mock API route handlers in `app/api/`. Do NOT stub these endpoints in Next.js. The frontend should handle API errors gracefully (loading states, error messages) and work against the real backend URL configured in `NEXT_PUBLIC_API_BASE_URL`.

## Critical: Files you MUST NOT create or modify (to avoid conflicts)

- `app/(liff)/layout.tsx` — do not touch
- `app/[locale]/(liff)/layout.tsx` — do not touch
- `app/(liff)/page.tsx` — do not touch
- `app/[locale]/(liff)/page.tsx` — do not touch
- `app/api/line/notify/route.ts` — imports `getLineUserIdByEmployeeId` from employee-links; keep that function's return type compatible (see backward compatibility note below)
- `components/liff-shell.tsx` — do not touch
- `components/liff-home-page.tsx` — do not touch
- `components/liff-deep-link-handler.tsx` — do not touch

## Implementation Steps (execute in this exact order)

### Step 1: Add onboarding types to `types/index.ts`

Append these types at the end of the file. Do NOT modify existing types.

```typescript
// ── Onboarding ──────────────────────────────────────────────

export type OnboardingStep = 'company_verify' | 'otp_verify' | 'complete'

export interface OnboardingState {
  step: OnboardingStep
  companyCode: string
  employeeCode: string
  employeeId?: string
  employeeName?: string
  phoneMasked?: string
  companyName?: string
  companyId?: string
  lineUserId: string
}

export interface VerifyEmployeeRequest {
  companyCode: string
  employeeCode: string
}

export interface VerifyEmployeeResponse {
  employeeId: string
  nameTh: string
  phoneMasked: string
  companyName: string
  companyId: string
}

export interface SendOtpRequest {
  employeeId: string
}

export interface SendOtpResponse {
  sent: boolean
  expiresInSeconds: number
}

export interface VerifyOtpRequest {
  employeeId: string
  otp: string
  lineUserId: string
}

export interface VerifyOtpResponse {
  success: boolean
  authToken: string
  companyId: string
}
```

### Step 2: Update `lib/api/client.ts`

Make two changes to the existing file:

**2a.** Add `setCompanyId` and `getCompanyId` methods to the `ApiClient` class:

```typescript
setCompanyId(companyId: string) {
  this.config.companyId = companyId;
}

getCompanyId(): string | undefined {
  return this.config.companyId;
}
```

**2b.** In `getApiClient()`, change the `companyId` initialization to read from localStorage first:

```typescript
// BEFORE:
const companyId = process.env.NEXT_PUBLIC_COMPANY_ID;

// AFTER:
const companyId =
  (typeof window !== "undefined"
    ? localStorage.getItem("payday-company-id")
    : null) ?? process.env.NEXT_PUBLIC_COMPANY_ID;
```

### Step 3: Update `lib/line/employee-links.ts`

**BACKWARD COMPATIBILITY IS CRITICAL.** The file `app/api/line/notify/route.ts` calls `getLineUserIdByEmployeeId(employeeId)` and expects it to return `string | null`. The file `lib/line/employee-links.test.ts` tests `getEmployeeIdByLineUserId` returning a plain string. You must keep both functions working with their existing signatures.

Change the internal data structure but keep the public API compatible:

```typescript
interface EmployeeLink {
  employeeId: string;
  companyId: string;
}

// Internal storage changes to EmployeeLink objects
const serverLinks: Record<string, EmployeeLink> = {
  'mock-line-user': { employeeId: 'EMP-0001', companyId: 'company-smpc' },
  // ... keep all existing entries, wrapping each in { employeeId, companyId }
};

// Keep existing return type — returns just the employeeId string
export function getEmployeeIdByLineUserId(lineUserId: string): string | null {
  return serverLinks[lineUserId]?.employeeId ?? null;
}

// Keep existing return type
export function getLineUserIdByEmployeeId(employeeId: string): string | null {
  for (const [lineUserId, link] of Object.entries(serverLinks)) {
    if (link.employeeId === employeeId) return lineUserId;
  }
  return null;
}

// Updated signature — add companyId param
export function linkEmployee(lineUserId: string, employeeId: string, companyId: string): void {
  serverLinks[lineUserId] = { employeeId, companyId };
}

// These stay the same
export function unlinkEmployee(lineUserId: string): void { ... }
export function isLinked(lineUserId: string): boolean { ... }
```

### Step 4: Update `lib/line/employee-links.test.ts`

Update the `linkEmployee` call in the existing test to include `companyId`:

```typescript
// BEFORE:
linkEmployee('new-line-user', 'EMP-0002')

// AFTER:
linkEmployee('new-line-user', 'EMP-0002', 'company-test')
```

All other assertions stay the same since `getEmployeeIdByLineUserId` still returns `string | null`.

### Step 5: Create `components/liff-onboarding-page.tsx` (NEW FILE)

Create this as a `"use client"` component. Props:

```typescript
interface LiffOnboardingPageProps {
  lineProfile: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  };
  onComplete: (companyId: string, employeeId: string) => void;
}
```

Key behaviors:
- Use `useState<OnboardingStep>` to manage the current step
- Read `useSearchParams().get('company')` for QR code auto-fill (auto-fill the company code input and disable it, show a badge "กรอกอัตโนมัติจากป้ายโรงงาน")
- Use `useTranslations('onboarding')` for all display strings
- Step 1: POST `/employees/verify` with `{ companyCode, employeeCode }`. On 404, show error. On 200, save response data to state, auto-send OTP, move to step 2.
- Step 2: POST `/auth/otp/send` with `{ employeeId }`. Display masked phone. User enters 6-digit OTP. POST `/auth/otp/verify` with `{ employeeId, otp, lineUserId }`. On 401, show error. On 200, save authToken via `setAuthToken()` from `lib/api/client.ts`, move to step 3.
- Step 3: Show summary (company name, employee code, employee name, pay cycle). Save `companyId` to localStorage key `"payday-company-id"`. Call `onComplete(companyId, employeeId)`.
- Include a back button on Step 2 that returns to Step 1 (clears OTP state).
- Include OTP resend button with countdown timer (300s).
- Show loading spinners on buttons during API calls.
- OTP input should be numeric-only, maxLength 6.

### Step 6: Update `components/liff-auth-gate.tsx`

**6a.** Add imports at top:

```typescript
import { LiffOnboardingPage } from "@/components/liff-onboarding-page";
```

**6b.** Add storage key constant:

```typescript
const COMPANY_ID_STORAGE_KEY = "payday-company-id";
```

**6c.** Replace the `if (authState === "linking")` block. The current code renders a simple form with one input. Replace the entire block:

```typescript
// REPLACE THIS ENTIRE BLOCK:
if (authState === "linking") {
  return (
    <main className="employee-screen p-5">
      <h1 ...>{t("linkTitle")}</h1>
      ...
    </main>
  );
}

// WITH:
if (authState === "linking") {
  return (
    <LiffOnboardingPage
      lineProfile={profile!}
      onComplete={(companyId, employeeId) => {
        saveLinkedEmployee(lineUserId, employeeId, companyId);
        setAuthState("ready");
      }}
    />
  );
}
```

**6d.** Replace the `saveLinkedEmployeeId` function:

```typescript
// BEFORE:
function saveLinkedEmployeeId(lineUserId: string, employeeId: string) {
  const links = readEmployeeLinks();
  links[lineUserId] = employeeId;
  localStorage.setItem(EMPLOYEE_LINKS_STORAGE_KEY, JSON.stringify(links));
}

// AFTER:
function saveLinkedEmployee(lineUserId: string, employeeId: string, companyId: string) {
  const links = readEmployeeLinks();
  links[lineUserId] = employeeId;
  localStorage.setItem(EMPLOYEE_LINKS_STORAGE_KEY, JSON.stringify(links));
  localStorage.setItem(COMPANY_ID_STORAGE_KEY, companyId);
}
```

**6e.** Remove the `handleLinkEmployee` function and the `employeeId` useState — they're no longer needed.

**6f.** Keep `useLiffProfile()` and `useLinkedEmployeeId()` exports unchanged — other components import them.

### Step 7: Add i18n translations

Add an `"onboarding"` namespace to all three message files.

**`messages/th.json`** — add:
```json
"onboarding": {
  "stepIndicator": "ขั้นตอนที่ {current} จาก {total}",
  "step1Title": "เชื่อมต่อบัญชีพนักงาน",
  "step1Description": "ยืนยันรหัสพนักงานเพื่อผูกบัญชี LINE กับสิทธิ์เบิกเงินของบริษัท",
  "companyCodeLabel": "รหัสบริษัท (Company Code)",
  "companyCodePlaceholder": "เช่น SMPC, CPALL",
  "companyCodeAutoFilled": "กรอกอัตโนมัติจากป้ายโรงงาน",
  "employeeCodeLabel": "รหัสพนักงาน (Employee ID)",
  "employeeCodePlaceholder": "เช่น EMP-0001",
  "verifyButton": "เชื่อมต่อบัญชีพนักงาน",
  "verifyError": "ไม่พบบัญชีพนักงานในรหัสบริษัทและรหัสพนักงานดังกล่าว",
  "step2Title": "ยืนยันรหัสความปลอดภัย (OTP)",
  "step2Description": "กรอกรหัสยืนยัน 6 หลักที่เราส่งไปยังเบอร์โทรศัพท์ {phone}",
  "otpLabel": "รหัส OTP 6 หลัก",
  "otpPlaceholder": "000000",
  "otpButton": "ยืนยันรหัสความปลอดภัย",
  "otpError": "รหัส OTP ไม่ถูกต้องหรือหมดอายุ กรุณาลองอีกครั้ง",
  "otpResend": "ส่งรหัสอีกครั้ง",
  "step3Title": "เชื่อมต่อสำเร็จ!",
  "step3Description": "บัญชี LINE ของคุณผูกเข้ากับระบบสิทธิ์เบิกเงิน PayDay+ เรียบร้อยแล้ว",
  "summaryCompany": "บริษัท",
  "summaryEmployeeId": "รหัสพนักงาน",
  "summaryName": "ชื่อพนักงาน",
  "summaryPayCycle": "รอบการจ่ายเงิน",
  "enterAppButton": "เข้าสู่หน้าหลักแอป",
  "lineConnected": "LINE Connected"
}
```

**`messages/en.json`** — add:
```json
"onboarding": {
  "stepIndicator": "Step {current} of {total}",
  "step1Title": "Connect Employee Account",
  "step1Description": "Verify your employee ID to link your LINE account with the company.",
  "companyCodeLabel": "Company Code",
  "companyCodePlaceholder": "e.g. SMPC, CPALL",
  "companyCodeAutoFilled": "Auto-filled from factory sign",
  "employeeCodeLabel": "Employee ID",
  "employeeCodePlaceholder": "e.g. EMP-0001",
  "verifyButton": "Connect Employee Account",
  "verifyError": "Employee not found with the provided company code and employee ID.",
  "step2Title": "Verify Security Code (OTP)",
  "step2Description": "Enter the 6-digit code sent to {phone}.",
  "otpLabel": "6-digit OTP",
  "otpPlaceholder": "000000",
  "otpButton": "Verify Security Code",
  "otpError": "Invalid or expired OTP. Please try again.",
  "otpResend": "Resend Code",
  "step3Title": "Connection Successful!",
  "step3Description": "Your LINE account has been linked to PayDay+ successfully.",
  "summaryCompany": "Company",
  "summaryEmployeeId": "Employee ID",
  "summaryName": "Employee Name",
  "summaryPayCycle": "Pay Cycle",
  "enterAppButton": "Enter App",
  "lineConnected": "LINE Connected"
}
```

**`messages/my.json`** — add the same keys with Myanmar translations (or use English as placeholder if unsure).

### Step 8: Create test file `components/liff-onboarding-page.test.tsx` (NEW FILE)

Write tests for these cases:
1. Renders step 1 form with company code and employee ID inputs
2. Auto-fills company code from URL `?company=SMPC`
3. Shows auto-fill tag when company comes from QR
4. Disables submit button when inputs are empty
5. Shows error when employee not found (mock API 404)
6. Transitions to step 2 on successful verify (mock API 200)
7. Displays masked phone number in step 2
8. Validates OTP length is exactly 6 digits
9. Shows error on invalid OTP (mock API 401)
10. Transitions to step 3 and shows summary on success
11. Calls onComplete with companyId and employeeId
12. Saves companyId to localStorage after completion

### Step 9: Update `components/liff-auth-gate.test.tsx`

Add two test cases:
1. Renders `LiffOnboardingPage` when authState is linking
2. Passes lineProfile to onboarding component

### Step 10: Verify

Run the following commands and ensure they all pass:

```bash
npx vitest run components/liff-onboarding-page.test.tsx
npx vitest run components/liff-auth-gate.test.tsx
npx vitest run lib/line/employee-links.test.ts
npx tsc --noEmit
```

## Dependency Graph (what imports what)

```
components/liff-onboarding-page.tsx
  ← imports from: types/index.ts, lib/api/client.ts
  ← used by: components/liff-auth-gate.tsx

components/liff-auth-gate.tsx
  ← imports from: components/liff-onboarding-page.tsx, lib/liff-client.ts
  ← used by: app/(liff)/layout.tsx, app/[locale]/(liff)/layout.tsx
  ← exports used by: liff-home-page.tsx, liff-profile-page.tsx, liff-request-page.tsx

lib/line/employee-links.ts
  ← used by: app/api/line/notify/route.ts (calls getLineUserIdByEmployeeId)
  ← tested by: lib/line/employee-links.test.ts
```

## Files touched summary

| Action | File |
|--------|------|
| APPEND | `types/index.ts` |
| MODIFY | `lib/api/client.ts` |
| MODIFY | `lib/line/employee-links.ts` |
| MODIFY | `lib/line/employee-links.test.ts` |
| CREATE | `components/liff-onboarding-page.tsx` |
| MODIFY | `components/liff-auth-gate.tsx` |
| MODIFY | `messages/th.json` |
| MODIFY | `messages/en.json` |
| MODIFY | `messages/my.json` |
| CREATE | `components/liff-onboarding-page.test.tsx` |
| MODIFY | `components/liff-auth-gate.test.tsx` |

## Do NOT

- Create any new routes or pages
- Add middleware
- Modify layout files
- Change the `useLiffProfile` or `useLinkedEmployeeId` export signatures
- Break `getLineUserIdByEmployeeId` or `getEmployeeIdByLineUserId` return types
- Install new npm packages (everything needed is already available)

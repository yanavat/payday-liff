# Agent Prompt — Implement Frontend Auth for PayDay+

You are implementing authentication and LINE linking for the PayDay+ LIFF and Browser applications.
Read `docs/auth-plan.md` for the full spec and decisions. This prompt gives you the execution order, architectural guidance, and code patterns.

---

## Project Context

- **Stack**: Next.js 14 App Router + TailwindCSS + `next-intl` (i18n) + Vitest
- **Frontend root**: `payday-liff/`
- **Backend API URL**: `http://localhost:4000` (or `NEXT_PUBLIC_API_BASE_URL`)
- **Main employee LIFF route**: `app/[locale]/(liff)/`
- **HR Dashboard route**: `app/[locale]/hr/`
- **Existing Onboarding Flow**: Currently exists as a client-side SMS OTP flow in `components/liff-onboarding-page.tsx` and `components/liff-auth-gate.tsx`. We are replacing this with the new invitation-code and PIN-based activation flow, backend LINE linking, and HttpOnly cookies.

---

## Architectural Guide: HttpOnly Cookie Proxy

Because the backend and frontend run on different ports in local dev (and possibly different domains/subdomains in production), and the JWT is stored in an `HttpOnly` cookie (`payday_token`), we must route all auth requests through Next.js API routes at `app/api/auth/[...path]/route.ts`.

This proxy performs two main functions:
1. **Request forwarding**: Passes requests from Next.js client to NestJS backend (`http://localhost:4000`), forwarding any `Cookie` headers received from the browser.
2. **Response forwarding**: Forwards responses from NestJS back to the Next.js client, copying any `Set-Cookie` headers so the browser stores the `payday_token` cookie on the Next.js domain.

---

## Execution Order — Do tasks in this EXACT sequence

After each task, ensure the Next.js dev server compiles without errors, tests pass, and commits are made using the format `feat(frontend): FE-{N} — {short description}`.

### Task FE-10: Next.js API Route Proxy for Auth Endpoints

**File**: Create `app/api/auth/[...path]/route.ts`

Implement a catch-all route handler to proxy auth requests. It should:
1. Target backend base URL: `process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'`
2. Proxy paths starting with `/api/auth/` to the backend `/auth/` routes.
3. Forward `x-company-id` and `Cookie` headers from the request.
4. Forward the status code, body, and **`Set-Cookie`** headers from the backend response back to the client.

Example structure:
```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const backendUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/auth/${path}`;
  
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  
  const companyId = req.headers.get("x-company-id");
  if (companyId) headers.set("x-company-id", companyId);
  
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  try {
    const body = await req.json();
    const response = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Copy set-cookie headers from backend response
    const setCookieHeaders = response.headers.getSetCookie();
    setCookieHeaders.forEach((cookieVal) => {
      nextResponse.headers.append("Set-Cookie", cookieVal);
    });

    return nextResponse;
  } catch (error) {
    return NextResponse.json({ message: "Proxy error" }, { status: 500 });
  }
}

// Add GET handler for `/api/auth/me` and GET/POST for `/api/auth/logout` etc.
```

**Verify**: Make a mock POST request to `/api/auth/hr/login` via Postman/curl → verify it forwards to NestJS and returns `set-cookie`.

---

### Task FE-1: Create Unified Auth Context and AuthGate

We need to support:
1. **LINE Webview (LIFF)**: Auto-login if linked, fallback to Linking (Phone + PIN) or Activation (Phone + Invitation Code).
2. **Standard Browser**: Display Phone/Email + PIN login, fallback to Activation.

**File**: Update `components/liff-auth-gate.tsx`

Create a global `AuthContext` with:
```ts
export interface AuthContextType {
  employee: any | null;       // Current authenticated employee info
  hrUser: any | null;         // Current authenticated HR user info
  isInLiff: boolean;          // True if running inside LINE LIFF
  isAuthenticated: boolean;   // True if active session exists
  login: (identifier: string, pin: string) => Promise<void>;
  hrLogin: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
}
```

**Gate Flow on Mount**:
1. Call `GET /api/auth/me`.
   - **If 200 (authenticated)**:
     - Populate context with actor info.
     - Set `authState = 'ready'`.
   - **If 401 (unauthenticated)**:
     - **If inside LIFF** (detect using LINE WebView UA or `liff.isInClient()`):
       - Initialize LIFF SDK. Get `lineUserId`.
       - Call `POST /api/auth/line-login` with `{ lineUserId }`.
         - If response is `authenticated` (200 + cookie): Fetch `GET /api/auth/me`, set `authState = 'ready'`.
         - If response is `needs_activation`: Set `authState = 'activation'`, save `lineUserId`.
         - If response is `needs_linking`: Set `authState = 'linking'`, save `lineUserId`.
     - **If standard Browser**:
       - Set `authState = 'login'`.

**Verify**: Run app in browser → redirects to Login screen. Run inside LIFF mock → initiates LINE flow.

---

### Task FE-2: Browser Login Screen

**File**: Create `app/[locale]/(liff)/login/page.tsx` (or show inside `AuthGate` when state is `'login'`)

Implement a beautiful login screen conforming to design specs:
- LINE green login button at top ("เข้าสู่ระบบด้วย LINE") -> redirects to LINE OAuth (or triggers LIFF login).
- Divider "หรือ" in the middle.
- Form fields:
  - Phone or Email input.
  - PIN code input (6 boxes or masked numeric input).
- Actions:
  - Submit -> calls `POST /api/auth/login`. On success, calls `/api/auth/me` to refresh state.
  - Link/Text: "เปิดใช้งานบัญชีครั้งแรก (First-time Activation)" -> switches to Activation page.
- Beautiful error messages for 401 (Invalid PIN/Credentials) and 429 (Too many attempts, show cooldown timer).

---

### Task FE-3: Activation Screen (First-time Onboarding)

**File**: Create/Update Activation Screen.

Required when a new employee needs to activate their account using an invitation code:
- Inputs:
  - Phone number (pre-filled if coming from LIFF query params).
  - 6-digit Invitation Code (from HR).
  - Enter New PIN (6 digits, numeric-only).
  - Confirm New PIN (must match).
- Actions:
  - Submit -> calls `POST /api/auth/activate` with `{ phone, invitationCode, pin }`.
  - Back to Login.
- Error handling:
  - 410 Gone: "รหัสคำเชิญหมดอายุแล้ว กรุณาติดต่อฝ่ายบุคคล (Invitation code expired. Please contact HR)".
  - 401 Unauthorized: "รหัสคำเชิญไม่ถูกต้อง (Invalid invitation code)".
  - 400 Bad Request: "บัญชีนี้เปิดใช้งานไปแล้ว (Already activated)".

On success: JWT cookie is set. Fetch `GET /api/auth/me` and redirect to home.

---

### Task FE-5: Link LINE Screen (LIFF Needs Linking)

**File**: Create Link LINE Screen.

Shown only inside LINE LIFF when `line-login` returns `{ status: 'needs_linking' }`.
- Display: LINE Avatar and Display Name ("สวัสดีคุณ [Name]! เชื่อมต่อบัญชีผู้ใช้เพื่อความปลอดภัย").
- Inputs:
  - Phone number.
  - 6-digit PIN.
- Actions:
  - Submit -> calls `POST /api/auth/link-line` with `{ phone, pin, lineUserId }`.
- On success: Links the account, sets JWT cookie, redirects to home.

---

### Task FE-6: Refactor LIFF Pages to use JWT Auth

Remove all occurrences of reading/writing local storage for user mapping (`payday-liff-employee-links`).
All pages must consume user context from the new `useAuth()` hook.

**Files to modify**:
- `components/liff-home-page.tsx`
- `app/[locale]/(liff)/request/page.tsx`
- `app/[locale]/(liff)/profile/page.tsx`

Ensure employee data (name, salary, available limit) is loaded using the JWT cookie session.

---

### Task FE-7: PIN Step-Up Confirmation for EWA Request

**File**: `app/[locale]/(liff)/request/page.tsx`

When the worker clicks "ยืนยันการเบิกเงิน" (Submit EWA Request):
1. Intercept the submission and open a slide-up drawer or modal requesting their 6-digit PIN.
2. User enters the PIN.
3. Call `POST /api/auth/verify-pin` with `{ pin }`.
4. If verified (200): Proceed to submit the EWA request.
5. If invalid PIN (401): Show error inline in the modal, clear PIN inputs, shake animation.
6. Support rate limit lockout (429 handling).

---

### Task FE-8: Conditionally Hide LINE-only Features

**Files**: Throughout LIFF screens.

Using `isInLiff` from the auth context:
- If `isInLiff` is **false**:
  - Hide the "แชร์ให้เพื่อน" (shareTargetPicker) buttons.
  - Hide "ปิดหน้าต่าง" (closeWindow) buttons.
  - Replace LINE profile pictures with a sleek avatar fallback.
- If `isInLiff` is **true**: Show full LINE ecosystem features.

---

### Task FE-9: HR Login Screen + Dashboard Guard

**File**: `app/[locale]/hr/login/page.tsx`

Create a premium login screen for HR administrators:
- Clean minimal design (dark mode / glassmorphism card).
- Inputs: Email + Password.
- Submit -> calls `POST /api/auth/hr/login`.
- Forwards to `/hr/` dashboard upon success.

**Dashboard Sidebar**:
- Add "ออกจากระบบ" (Logout) button that calls `POST /api/auth/logout`, clears the context, and redirects to `/hr/login`.

---

### Task FE-11: E2E Smoke and Integration Testing

Write/update Vitest integration tests for key UI flows:
1. `AuthGate` correctly switches states based on `/api/auth/me` status.
2. Activation screen shows error on expired/invalid invitation code.
3. PIN step-up modal opens on request page and calls `verify-pin`.
4. HR login successfully stores cookie and routes to HR dashboard.

Run `npm run test` and `npm run build` to verify the build output.

---

## Constraints

- Never store the JWT in `localStorage` or `sessionStorage`. All auth headers must rely on the HttpOnly `payday_token` cookie.
- Use Next.js client-side translations namespace `"auth"` for all labels and error states.
- Support responsive layout (highly polished mobile views for employee LIFF screens, desktop-optimized layouts for HR screens).

# PayDay+ Employee Mini App Migration Plan

**LINE LIFF Integration · Same-Repo Workspace · Push Notifications**

> Version 1.0 — May 8, 2026
> Figma Reference: [EWA-Project](https://www.figma.com/design/mmEkmsppCk5Dx2hynYhxwX/EWA-Project?node-id=0-1&p=f&t=DnJmrWvrh9WSGTpA-0)

---

## 1. Executive summary

This document outlines the plan to migrate the PayDay+ employee-facing mobile view (5 screens at 390px) from the current Next.js monolith into a LINE LIFF Mini App package inside this same repository. The HR dashboard remains in the existing app while LIFF and shared code are added as workspace packages.

The migration targets LINE's Front-end Framework (LIFF) to give factory workers a native-feeling experience inside the LINE messenger app they already use daily. Key benefits include seamless LINE Login (replacing the current Employee ID + PIN flow), push notifications for request status updates and payday reminders, and the ability to open the app directly from LINE's rich menu without needing to install a separate application.

---

## 2. Current state analysis

### 2.1 Project structure

The current `wow-payday+` project is a Next.js 15 monolith containing both the HR desktop dashboard (1440px, 7 screens) and the employee mobile view (390px, 5 screens). The tech stack is Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui + next-intl for i18n (TH, EN, MM).

### 2.2 Employee screens to migrate

| Screen | Route | Key components | Complexity |
|--------|-------|----------------|------------|
| E-1: Login | `/employee/login` | PINPad, LocaleSwitcher, BrandLogo | Medium |
| E-2: Home dashboard | `/employee/home` | BalanceHeroCard, ProgressBar, StatusBadge | High |
| E-3: Request form (3 steps) | `/employee/request` | StepIndicator, QuickAmountButton, PINPad | High |
| E-4: Request history | `/employee/history` | TabBar, accordion cards, StatusBadge | Medium |
| E-5: Profile & settings | `/employee/profile` | Avatar, toggles, language select | Low |

### 2.3 Shared dependencies

- **Types:** Employee, EWARequest, PayCycleInfo, FinancialBreakdown, etc. (`types/index.ts`)
- **Utils:** formatTHB, fee calculations, cn() helper, dayjs config
- **i18n messages:** en.json, th.json, my.json (partial overlap with HR keys)
- **UI components:** StatusBadge, ProgressBar, PINPad, Avatar, Toast, StepIndicator, QuickAmountButton
- **Mock data:** currentUser, requests, payrollCycles (will be replaced by real API)
- **Design tokens:** CSS custom properties for colors, spacing, typography (Tailwind config)

---

## 3. Target architecture

### 3.1 Same-repo workspace structure

The migration stays in this repository. Phase 1 converts the repo to npm workspaces and adds new packages without moving the current HR app first. A later cleanup can move the HR app into `apps/hr` if needed, but that is not required to start LIFF work.

| Workspace | Purpose | Tech stack | Deployment |
|-----------|---------|------------|------------|
| root app (`wow-payday+`) | HR dashboard only after migration | Next.js 15, desktop 1440px | Vercel |
| `packages/payday-liff` | Employee LINE mini app | Next.js 15 + LIFF SDK, mobile 390px | Vercel project from the same repo |
| `packages/shared` (`@payday/shared`) | Shared types, utils, i18n, tokens | TypeScript library | Local workspace package |
| `packages/payday-api` | LIFF auth/linking, LINE webhooks, notification dispatch adapters | TypeScript server module or Next route-handler helpers | Consumed by deployed apps/API routes |

### 3.2 Backend/API ownership

The current product is a frontend-only MVP, but LIFF login, employee linking, push notifications, and channel-token handling require server-owned behavior. The migration owns that boundary in this repo through `packages/payday-api`.

| Capability | Owner | Notes |
|------------|-------|-------|
| LINE userId to employee mapping | `packages/payday-api` | Starts with mock/in-memory fixtures for demo, then swaps to a real datastore. |
| Employee linking | `packages/payday-api` + LIFF app route handlers | One-time Employee ID verification, link creation, unlink flow, and audit event. |
| LIFF session exchange | `packages/payday-api` | Verifies LIFF identity token server-side before creating an app session. |
| Messaging API push | `packages/payday-api` | Keeps channel access tokens server-side only; exposes typed notification commands. |
| Webhooks | `packages/payday-api` | Validates LINE signatures and routes follow/unfollow/postback events. |
| HR status events | root HR app + `packages/payday-api` | HR approval/rejection/disbursement actions enqueue notification events. |

### 3.3 LINE LIFF integration points

- **LIFF Login:** Replace Employee ID + PIN with LINE Login. Users tap the LIFF app inside LINE and are automatically authenticated via their LINE profile. The LIFF SDK provides `liff.getProfile()` for user identity. A mapping table links LINE User IDs to employee records.
- **Push notifications:** Use LINE Messaging API to send Flex Messages when request status changes (approved/rejected/disbursed) and payday reminders. Requires a LINE Official Account and channel access token.
- **Rich menu:** Configure a LINE rich menu with quick-access buttons: Home, Request EWA, History, Profile. This replaces the current BottomTabBar for navigation from outside the LIFF app.
- **LIFF Share Target Picker:** Enable sharing EWA request receipts (success screen) as LINE messages to colleagues or self.

### 3.4 Authentication flow change

| Aspect | Current (monolith) | After migration (LIFF) |
|--------|-------------------|----------------------|
| Auth method | Employee ID + 4-digit PIN | LINE Login (automatic via LIFF) |
| Session | localStorage token | Server-issued app session after LIFF identity-token verification |
| Identity mapping | Direct employee lookup | LINE userId → employee record mapping |
| Lock mechanism | 5 wrong PINs → 30min lock | Login lock not needed; request submission uses step-up confirmation |
| QR login | Camera-based badge scan | Not needed (LINE identity is automatic) |

---

## 4. Screen-by-screen migration plan

### 4.1 E-1: Login → LIFF auto-login

The current login page (`EmployeeLoginPage`) with Employee ID input, PINPad, and QR scan becomes unnecessary. In the LIFF app, authentication happens automatically when the user opens the mini app inside LINE.

- **Replace with:** A splash/loading screen that calls `liff.init()` and `liff.login()`, then redirects to home
- **New component:** `AuthGate` — wraps the app, handles `liff.init()`, checks if user is linked to an employee record
- **Fallback:** If opened outside LINE (external browser), show an "Open in LINE" button that links to `https://liff.line.me/{liffId}`. Do not auto-redirect with a custom scheme; keep the fallback explicit so users are not trapped in a redirect loop.
- **First-time linking:** If LINE userId has no employee mapping, show a one-time Employee ID verification form
- **Components to remove:** PINPad (from login), QR code button, lock mechanism, attempt counter

### 4.2 E-2: Home dashboard → LIFF home

The `EmployeeHomePage` transfers almost directly. The hero balance card, pay period progress, and recent requests sections remain identical in design and functionality.

- **Keep as-is:** BalanceHeroCard, PayPeriodWidget, RecentRequests list, all Figma design tokens
- **Modify:** Replace Avatar tap → `/employee/profile` with LINE profile image from `liff.getProfile()`
- **Modify:** NotificationBell can link to LINE's notification center or be removed (push handles it)
- **Add:** OfflineBanner adapted for LIFF context (check `navigator.onLine` + `liff.isInClient()`)

### 4.3 E-3: Request form → LIFF request

The 3-step request wizard (`EmployeeRequestPage`) is the core flow. Steps 1 (amount selection) and 3 (success) transfer directly. Step 2 (PIN confirmation) changes significantly.

- **Step 1 (amount):** Unchanged — QuickAmountButtons, custom input, reason chips, fee display
- **Step 2 (confirm):** Remove PINPad, then require step-up confirmation before submission. Preferred path is WebAuthn/device biometric when available, with a server-issued one-time confirmation code fallback for unsupported devices. LINE Login identifies the user, but request submission still needs transaction-level confirmation.
- **Step 3 (success):** Replace "Share receipt" Web Share API with `liff.shareTargetPicker()` to share as LINE Flex Message

### 4.4 E-4: Request history → LIFF history

The `EmployeeHistoryPage` transfers directly with minimal changes. The summary strip, tab filter, and accordion card list all remain.

- **Keep as-is:** HistorySummaryStrip, StatusTabFilter, RequestCardList with accordion expand
- **Enhancement:** Deep-link support — push notifications can link directly to a specific request via LIFF URL parameters

### 4.5 E-5: Profile → LIFF profile

The `EmployeeProfilePage` simplifies since LINE handles identity.

- **Replace:** Avatar with LINE profile picture (from `liff.getProfile().pictureUrl`)
- **Keep:** Bank account display, EWA quota info, notification toggles, language selector
- **Modify:** Sign-out becomes "Unlink account" (severs LINE userId → employee mapping)
- **Remove:** Current session-based logout (LIFF session is managed by LINE)

---

## 5. Navigation changes

| Navigation | Current | LIFF app |
|------------|---------|----------|
| Primary nav | BottomTabBar (4 tabs) | BottomTabBar (4 tabs) — same design |
| Entry point | URL → `/employee/login` | LINE rich menu → LIFF URL → auto-auth → home |
| Deep links | Not supported | LIFF URL params (e.g., `?page=history&id=EWA-001`) |
| Back navigation | Browser back button | LIFF close button + browser back |
| External browser | Full experience | Show explicit "Open in LINE" fallback linking to `https://liff.line.me/{liffId}` |

The current BottomTabBar (Home, Request, History, Profile) remains as the primary in-app navigation. Additionally, the LINE rich menu provides entry points from outside the app.

---

## 6. Shared package (`@payday/shared`)

To avoid code duplication, shared code is extracted into a local workspace package that both the HR dashboard and the LIFF app consume.

| Module | Contents | Used by |
|--------|----------|---------|
| `types/` | Employee, EWARequest, PayCycleInfo, etc. | HR + LIFF |
| `utils/format.ts` | formatTHB, date formatting | HR + LIFF |
| `utils/fees.ts` | Transfer fee calculation | HR + LIFF |
| `utils/cn.ts` | Tailwind class merger | HR + LIFF |
| `i18n/` | Shared translation keys (th, en, my) | HR + LIFF |
| `constants/` | Reasons, status labels, limits | HR + LIFF |
| `dayjs/` | Thai locale/date configuration | HR + LIFF |
| `tokens/` | CSS variable contract and Tailwind token mapping source | HR + LIFF |

Shared UI primitives remain in the app that owns their rendering context until they are needed in both places. When a component is shared by HR and LIFF, move it into `packages/shared-ui` or a clearly named `packages/shared/components` module as part of the same change that introduces the second consumer. Employee-only components are ported into `packages/payday-liff`.

---

## 7. Push notification design

Push notifications use the LINE Messaging API to send Flex Messages to employees. This requires a LINE Official Account, a Messaging API channel, and the employee's LINE userId stored through the `packages/payday-api` mapping layer. Channel access tokens and webhook secrets must never be exposed to client packages.

| Event | Trigger | Message content | Priority |
|-------|---------|-----------------|----------|
| Request approved | HR approves EWA request | Amount + reference + expected transfer date | P0 |
| Request rejected | HR rejects EWA request | Amount + reference + rejection reason | P0 |
| Disbursement complete | Bank transfer settles | Amount + bank account + reference | P0 |
| Payday reminder | 1 day before payday | Upcoming payday date + total deductions | P1 |
| Cutoff warning | 2 days before EWA cutoff | Remaining balance + cutoff date | P1 |
| Monthly summary | 1st of each month | Last month's EWA usage summary | P2 |

---

## 8. Migration phases & timeline

### Phase 1: Foundation (Week 1–2)

- Convert the repo to npm workspaces and add `packages/payday-liff`
- Extract `packages/shared` (`@payday/shared`) from the monolith (types, utils, i18n, constants, date config, token contract)
- Add `packages/payday-api` with mock-backed interfaces for LIFF identity verification, employee linking, and notification dispatch
- Set up LINE Developer Console: create LIFF app, Messaging API channel
- Implement `AuthGate` with LINE Login and employee linking flow
- Port Tailwind config and design tokens (CSS variables) to new project
- Deploy the LIFF workspace as a separate Vercel project from this same repository, then register the LIFF endpoint URL

### Phase 2: Screen migration (Week 3–4)

- Migrate E-2 (Home) — port EmployeeHomePage with LINE profile integration
- Migrate E-3 (Request form) — port 3-step wizard, replace PIN with transaction-level step-up confirmation
- Migrate E-4 (History) — port with deep-link param support
- Migrate E-5 (Profile) — port with LINE profile and unlink flow
- Port all shared UI components (StatusBadge, ProgressBar, etc.)
- Implement BottomTabBar and EmployeeShell for LIFF context

### Phase 3: LINE features (Week 5–6)

- Implement push notification backend adapters in `packages/payday-api` (Messaging API integration)
- Design and deploy Flex Message templates for each notification type
- Configure LINE rich menu with app entry points
- Implement `liff.shareTargetPicker()` for receipt sharing
- Add deep-link routing from push notifications to specific screens

### Phase 4: Testing & launch (Week 7–8)

- End-to-end testing in LINE app (iOS + Android)
- Test all 3 languages (TH, EN, MM) across all screens
- Push notification delivery testing across all event types
- Performance audit (LIFF load time target: under 3 seconds)
- Remove employee routes from the monolith (`/employee/*` pages)
- Staged rollout: pilot with one department, then company-wide

---

## 9. Risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LIFF SDK load time | Slow first open (2–4s cold start) | Preload LIFF SDK, use skeleton screens, minimize bundle size |
| LINE userId mapping | Users can't access if not linked | Provide one-time linking wizard + HR bulk-import tool; own mapping API in `packages/payday-api` |
| External browser access | Users open outside LINE | Detect with `liff.isInClient()`, show explicit "Open in LINE" button to `https://liff.line.me/{liffId}` |
| Transaction authorization | Shared/unlocked device could submit wage request | Require WebAuthn/device biometric or one-time confirmation code before request submission |
| Push notification opt-out | Users block LINE messages | Critical notifications also shown in-app on next visit |
| i18n parity | Missing translations in new project | Shared i18n package ensures single source of truth |
| Figma design drift | LIFF app diverges from design | Use Figma design reference (`mmEkmsppCk5Dx2hynYhxwX`) as source of truth |

---

## 10. LINE Developer Console setup checklist

- [ ] Create LINE Login channel in LINE Developer Console
- [ ] Create Messaging API channel for push notifications
- [ ] Register LIFF app (size: Full, endpoint URL from the same-repo LIFF Vercel project, e.g. `https://payday-liff.vercel.app`)
- [ ] Enable "Use LINE Login in LIFF" and configure scopes: `profile`, `openid`
- [ ] Create LINE Official Account for the company
- [ ] Design rich menu with 4 cells: Home, Request, History, Profile
- [ ] Set up webhook URL for receiving LINE events
- [ ] Configure channel access token (long-lived) for Messaging API

---

## 11. Success metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| LIFF load time | Under 3 seconds | Lighthouse + real user monitoring |
| Employee adoption | 80% within 4 weeks | Unique LINE userIds linked to employees |
| Push notification delivery | 95% delivery rate | LINE Messaging API delivery receipts |
| EWA request completion | 90% start-to-success rate | Analytics funnel tracking |
| App rating | 4.0+ star equivalent | In-app feedback widget |

---

*This plan is aligned with the Figma design reference (EWA-Project) and preserves 1:1 visual fidelity with the current employee screens while adding LINE-native capabilities. The shared package approach ensures that future design changes in Figma only need to be implemented once and propagated to both projects.*

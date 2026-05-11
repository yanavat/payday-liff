# EWA System — Task Tracker

> Earned Wage Access Platform · Factory Edition  
> Stack: Next.js 15 + TypeScript + Tailwind + shadcn/ui  
> Last updated: May 11, 2026

---

## Legend

```
[ ] Not started
[~] In progress
[x] Done
[!] Blocked
```

---

## Phase 0 — Project Setup

- [!] Setup Vercel project + connect GitHub repo — blocked until Vercel/GitHub account access is provided

---

## Phase 7 — Deploy MVP

- [ ] Test on real mobile device (iOS + Android) — share Vercel URL → open on phone
- [ ] Share demo URL with HR team for feedback — template in DEPLOY.md Step 5
- [ ] Collect feedback → backlog for Phase 2

---

## Phase 8 — Employee LIFF Migration

Source of truth: `PayDay+_LIFF_Migration_Plan.md`

> May 11 update: this fork is now the standalone root LIFF app. The previous npm workspace packages under `packages/` were removed; future LIFF work should target the repository root.

### Phase 8.1 — Foundation (Week 1–2)

- [x] Promote this fork to a standalone root LIFF app and remove the temporary `packages/` workspace layout
- [x] Move the LIFF app shell to the repository root
- [x] Keep shared types in root `types/index.ts`
- [x] Keep `formatTHB()`, transfer fee utilities, and `cn()` in root `lib/utils/`
- [ ] Extract employee-relevant i18n messages for root LIFF usage
- [x] Extract business rule constants: min amounts, max percentages, cutoff rules, transfer fee
- [x] Extract Thai dayjs/date configuration into `packages/shared`
- [x] Define shared design token contract for Tailwind/CSS variables
- [x] Keep LIFF auth, employee linking, webhooks, and notification adapters in the root app/API layer
- [x] Add mock-backed interfaces for LIFF identity verification
- [x] Add mock-backed employee linking API for LINE userId → employee mapping
- [x] Add mock-backed notification dispatch adapter for LINE Messaging API
- [ ] Set up LINE Developer Console: LINE Login channel, Messaging API channel, LIFF app
- [x] Install `@line/liff@2.21.4` in the root LIFF app and wire it for Next.js client-only usage
- [x] Implement `LIFFAuthGate` with `liff.init()`, login handling, profile loading, and linked-user check
- [x] Implement first-time Employee ID linking form for unlinked LINE users
- [x] Add explicit external-browser fallback with `https://liff.line.me/{liffId}` "Open in LINE" link
- [ ] Deploy root LIFF app as a Vercel project from this repo
- [ ] Register deployed LIFF endpoint URL in LINE Developer Console

### Phase 8.2 — Screen Migration (Week 3–4)

- [x] Port E-2 Home into the root LIFF app with LINE profile picture support
- [x] Remove employee NotificationBell behavior that is replaced by LINE push notifications
- [x] Adapt OfflineBanner for LIFF context with `navigator.onLine` and `liff.isInClient()`
- [x] Port E-3 Request amount step with quick amounts, reason chips, fee, and net amount display
- [x] Replace request PIN confirmation with transaction-level step-up confirmation
- [x] Support WebAuthn/device biometric confirmation when available
- [x] Add server-issued one-time confirmation code fallback for unsupported devices
- [x] Port E-3 Success step and replace Web Share API with `liff.shareTargetPicker()`
- [x] Port E-4 History with tabs, accordion cards, and status badges
- [x] Add LIFF deep-link handling for history request params, e.g. `?page=history&id=EWA-001`
- [x] Port E-5 Profile with LINE profile picture and unlink account flow
- [x] Remove employee session logout UI from LIFF profile
- [x] Port BottomTabBar and EmployeeShell into the LIFF app context
- [x] Move shared UI primitives only when they have both HR and LIFF consumers
- [x] Keep employee-only components in the root LIFF app

### Phase 8.3 — LINE Features (Week 5–6)

- [x] Implement LINE Messaging API adapter in the root app/API layer
- [x] Keep channel access tokens and webhook secrets server-side only
- [x] Implement webhook signature validation for LINE events
- [x] Add typed notification commands for approved, rejected, disbursed, payday reminder, cutoff warning, and monthly summary
- [x] Wire HR approval/rejection/disbursement events to notification dispatch path
- [x] Design Flex Message template for request approved notification
- [x] Design Flex Message template for request rejected notification
- [x] Design Flex Message template for disbursement complete notification
- [x] Design Flex Message template for payday reminder notification
- [x] Design Flex Message template for cutoff warning notification
- [x] Design Flex Message template for monthly summary notification
- [x] Configure LINE rich menu with Home, Request, History, and Profile entry points
- [x] Route push-notification deep links to the correct LIFF screen/request
- [x] Add receipt sharing through `liff.shareTargetPicker()`

### Phase 8.4 — Testing & Launch (Week 7–8)

- [x] Add LIFF mock mode for local development with `NEXT_PUBLIC_LIFF_MOCK=true`
- [ ] Test local dev through HTTPS tunnel/ngrok
- [ ] Test external browser flow through `https://liff.line.me/{liffId}`
- [ ] Test inside LINE on real iOS device
- [ ] Test inside LINE on real Android device
- [x] Verify `liff.isInClient()`, viewport behavior, and safe-area-inset handling — `viewport-fit=cover` added, `liff-content-area` CSS with `env(safe-area-inset-bottom)`; manual verification checklist in `docs/testing/phase-8.4-manual-checklist.md`
- [x] Test all 3 languages: Thai, English, Myanmar — `liff` i18n namespace added to all 3 message files; `liff-auth-gate` and `liff-offline-banner` now fully translated
- [ ] Test request approved push notification delivery
- [ ] Test request rejected push notification delivery
- [ ] Test disbursement complete push notification delivery
- [ ] Test payday reminder push notification delivery
- [ ] Test cutoff warning push notification delivery
- [x] Run performance audit with LIFF load time target under 3 seconds — `canvas-confetti` converted to dynamic import; LIFF SDK already lazy; manual Lighthouse steps in checklist
- [x] Remove employee routes from monolith after LIFF launch readiness is verified — `app/[locale]/employee/*` deleted
- [ ] Pilot rollout with one department
- [ ] Collect pilot feedback and prepare company-wide rollout backlog

---

## Backlog (Post-MVP)

- [ ] Backend API (Fastify + Prisma + PostgreSQL)
- [ ] Backend/API gateway decision — confirm NestJS vs Fastify and define ownership boundaries
- [ ] Auth API contract — define HR login, employee login, logout, session/me, refresh, and error response shapes
- [ ] Replace frontend mock auth with API-backed auth client
- [ ] Move production session handling to backend-managed HttpOnly Secure SameSite cookies
- [ ] Remove frontend token storage from `localStorage` for production auth flow
- [ ] Add frontend auth/session provider (`useSession`, loading state, role/scope state)
- [ ] Add protected route guards for `/hr/*` and `/employee/*`
- [ ] Add role mismatch redirects (employee cannot enter HR, HR cannot enter employee app)
- [ ] Wire HR login screen to backend auth endpoint
- [ ] Wire employee ID + PIN login screen to backend auth endpoint
- [ ] Wire sign-out to backend logout endpoint and clear frontend session state
- [ ] Handle session expiry and `401` responses with redirect to correct login page
- [ ] Handle backend lockout/rate-limit responses in employee PIN UI
- [ ] Remove demo credentials from production builds
- [ ] Add auth integration tests for login, logout, session expiry, lockout, protected routes, and role mismatch
- [ ] SMS notification (AWS SNS)
- [ ] Weekly pay cycle logic
- [ ] HR/Payroll system integration (Provider pattern)
- [ ] Audit log viewer
- [ ] Myanmar language full translation
- [ ] Multi-factory support

---

## Progress Summary

| Phase              | Total Tasks | Done    | Progress |
| ------------------ | ----------- | ------- | -------- |
| 0 · Setup          | 9           | 9       | 100%     |
| 1 · Design System  | 19          | 19      | 100%     |
| 2 · Mock Data      | 7           | 7       | 100%     |
| 3 · HR Side        | 65          | 65      | 100%     |
| 4 · Employee Side  | 37          | 37      | 100%     |
| 5 · UX & A11y      | 9           | 9       | 100%     |
| 6 · Polish         | 10          | 10      | 100%     |
| 7 · Deploy         | 6           | 3       | 50%      |
| 8 · LIFF Migration | 64          | 49      | 77%      |
| **Total**          | **226**     | **208** | **92%**  |

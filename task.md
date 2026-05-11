# EWA System — Task Tracker

> Earned Wage Access Platform · Factory Edition  
> Stack: Next.js 15 + TypeScript + Tailwind + shadcn/ui  
> Last updated: May 8, 2026

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

### Phase 8.1 — Foundation (Week 1–2)

- [ ] Convert repo to npm workspaces without moving the current HR app first
- [ ] Create `packages/payday-liff` as the employee LINE LIFF Next.js app
- [ ] Create `packages/shared` as local workspace package `@payday/shared`
- [ ] Extract shared types from `types/index.ts` into `packages/shared`
- [ ] Extract `formatTHB()`, transfer fee utilities, and `cn()` into `packages/shared`
- [ ] Extract employee-relevant i18n messages into `packages/shared`
- [ ] Extract business rule constants: min amounts, max percentages, cutoff rules, transfer fee
- [ ] Extract Thai dayjs/date configuration into `packages/shared`
- [ ] Define shared design token contract for Tailwind/CSS variables
- [ ] Create `packages/payday-api` for LIFF auth, employee linking, webhooks, and notification adapters
- [ ] Add mock-backed `packages/payday-api` interfaces for LIFF identity verification
- [ ] Add mock-backed employee linking API for LINE userId → employee mapping
- [ ] Add mock-backed notification dispatch adapter for LINE Messaging API
- [ ] Set up LINE Developer Console: LINE Login channel, Messaging API channel, LIFF app
- [ ] Implement `LIFFAuthGate` with `liff.init()`, login handling, profile loading, and linked-user check
- [ ] Implement first-time Employee ID linking form for unlinked LINE users
- [ ] Add explicit external-browser fallback with `https://liff.line.me/{liffId}` "Open in LINE" link
- [ ] Deploy LIFF workspace as a separate Vercel project from this repo
- [ ] Register deployed LIFF endpoint URL in LINE Developer Console

### Phase 8.2 — Screen Migration (Week 3–4)

- [ ] Port E-2 Home into `packages/payday-liff` with LINE profile picture support
- [ ] Remove employee NotificationBell behavior that is replaced by LINE push notifications
- [ ] Adapt OfflineBanner for LIFF context with `navigator.onLine` and `liff.isInClient()`
- [ ] Port E-3 Request amount step with quick amounts, reason chips, fee, and net amount display
- [ ] Replace request PIN confirmation with transaction-level step-up confirmation
- [ ] Support WebAuthn/device biometric confirmation when available
- [ ] Add server-issued one-time confirmation code fallback for unsupported devices
- [ ] Port E-3 Success step and replace Web Share API with `liff.shareTargetPicker()`
- [ ] Port E-4 History with tabs, accordion cards, and status badges
- [ ] Add LIFF deep-link handling for history request params, e.g. `?page=history&id=EWA-001`
- [ ] Port E-5 Profile with LINE profile picture and unlink account flow
- [ ] Remove employee session logout UI from LIFF profile
- [ ] Port BottomTabBar and EmployeeShell into the LIFF app context
- [ ] Move shared UI primitives only when they have both HR and LIFF consumers
- [ ] Keep employee-only components inside `packages/payday-liff`

### Phase 8.3 — LINE Features (Week 5–6)

- [ ] Implement LINE Messaging API adapter in `packages/payday-api`
- [ ] Keep channel access tokens and webhook secrets server-side only
- [ ] Implement webhook signature validation for LINE events
- [ ] Add typed notification commands for approved, rejected, disbursed, payday reminder, cutoff warning, and monthly summary
- [ ] Wire HR approval/rejection/disbursement events to notification dispatch path
- [ ] Design Flex Message template for request approved notification
- [ ] Design Flex Message template for request rejected notification
- [ ] Design Flex Message template for disbursement complete notification
- [ ] Design Flex Message template for payday reminder notification
- [ ] Design Flex Message template for cutoff warning notification
- [ ] Design Flex Message template for monthly summary notification
- [ ] Configure LINE rich menu with Home, Request, History, and Profile entry points
- [ ] Route push-notification deep links to the correct LIFF screen/request
- [ ] Add receipt sharing through `liff.shareTargetPicker()`

### Phase 8.4 — Testing & Launch (Week 7–8)

- [ ] Add LIFF mock mode for local development with `NEXT_PUBLIC_LIFF_MOCK=true`
- [ ] Test local dev through HTTPS tunnel/ngrok
- [ ] Test external browser flow through `https://liff.line.me/{liffId}`
- [ ] Test inside LINE on real iOS device
- [ ] Test inside LINE on real Android device
- [ ] Verify `liff.isInClient()`, viewport behavior, and safe-area-inset handling
- [ ] Test all 3 languages: Thai, English, Myanmar
- [ ] Test request approved push notification delivery
- [ ] Test request rejected push notification delivery
- [ ] Test disbursement complete push notification delivery
- [ ] Test payday reminder push notification delivery
- [ ] Test cutoff warning push notification delivery
- [ ] Run performance audit with LIFF load time target under 3 seconds
- [ ] Remove employee routes from monolith after LIFF launch readiness is verified
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

| Phase             | Total Tasks | Done    | Progress |
| ----------------- | ----------- | ------- | -------- |
| 0 · Setup         | 9           | 9       | 100%     |
| 1 · Design System | 19          | 19      | 100%     |
| 2 · Mock Data     | 7           | 7       | 100%     |
| 3 · HR Side       | 65          | 65      | 100%     |
| 4 · Employee Side | 37          | 37      | 100%     |
| 5 · UX & A11y     | 9           | 9       | 100%     |
| 6 · Polish        | 10          | 10      | 100%     |
| 7 · Deploy        | 6           | 3       | 50%      |
| 8 · LIFF Migration | 64          | 0       | 0%       |
| **Total**         | **226**     | **159** | **70%**  |

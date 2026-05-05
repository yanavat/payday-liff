# EWA System — Task Tracker

> Earned Wage Access Platform · Factory Edition  
> Stack: Next.js 14 + TypeScript + Tailwind + shadcn/ui  
> Last updated: May 2025

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
- [ ] LINE Notify integration
- [ ] SMS notification (AWS SNS)
- [ ] Request withdrawal with LINE (login with LINE account)
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
| **Total**         | **162**     | **159** | **98%**  |

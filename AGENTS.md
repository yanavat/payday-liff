# AGENTS.md — PayDay+ EWA System

> Last updated: May 8, 2026
> Read this file before making any changes to the codebase.

---

## Project overview

PayDay+ is an Earned Wage Access (EWA) platform for factory workers. Employees can withdraw earned wages before payday; HR/Accountants manage approvals and disbursements. This is a frontend-only MVP with mock data, deployed on Vercel for demo and stakeholder review.

**Figma design reference:** https://www.figma.com/design/mmEkmsppCk5Dx2hynYhxwX/EWA-Project?node-id=0-1&p=f&t=DnJmrWvrh9WSGTpA-0

**Backend:** the NestJS backend POC for this product lives in a sibling repo at `../payday-backend/` (created 2026-05-12). Its design spec, implementation plan, and task tracker are owned over there — do not regenerate them in this repo.

---

## Tech stack

- **Framework:** Next.js 15 (App Router) with TypeScript
- **Styling:** Tailwind CSS with CSS custom properties (design tokens in `globals.css`)
- **UI primitives:** Radix UI + custom components (shadcn/ui pattern)
- **Icons:** Lucide React (outline style, stroke-width 1.5–1.8)
- **i18n:** next-intl with 3 locales — Thai (primary), English, Myanmar
- **Date:** dayjs with Thai locale
- **Testing:** Vitest + React Testing Library
- **Fonts:** Inter (Latin/numbers) + Noto Sans Thai (Thai text)

---

## Project structure

```
app/[locale]/
├── layout.tsx              Root layout (fonts, dark mode, i18n provider)
├── page.tsx                Redirect to /employee/home or /hr/dashboard
├── employee/layout.tsx     Employee shell (BottomTabBar + OfflineBanner)
└── hr/layout.tsx           HR shell (Sidebar + Topbar)

components/
├── ui/                     Shared primitives (both HR + Employee)
│   ├── avatar.tsx          StatusBadge, ProgressBar, PINPad, Toast,
│   ├── status-badge.tsx    StepIndicator, QuickAmountButton, TabBar,
│   ├── progress-bar.tsx    EmptyState, DataTable, MetricCard, etc.
│   └── ...
├── employee/               Employee mobile screens (390px)
│   ├── employee-shell.tsx       App shell with BottomTabBar
│   ├── employee-login-page.tsx  E-1: ID + PIN login
│   ├── employee-home-page.tsx   E-2: Balance hero + recent requests
│   ├── employee-request-page.tsx E-3: 3-step EWA request wizard
│   ├── employee-history-page.tsx E-4: Request history with accordion
│   ├── employee-profile-page.tsx E-5: Profile & settings
│   ├── bottom-tab-bar.tsx       4-tab navigation
│   └── offline-banner.tsx       Connectivity warning
├── hr/                     HR desktop screens (1440px)
│   ├── dashboard-page.tsx       HR-1: Metrics + recent requests
│   ├── request-list-page.tsx    HR-2: Filterable request table
│   ├── request-detail-drawer.tsx HR-3: Slide-in detail panel
│   ├── reports-page.tsx         HR-4: Charts + department breakdown
│   ├── settings-page.tsx        HR-5: EWA policy config
│   ├── employees-page.tsx       HR-6: Employee list
│   └── on-behalf-request-page.tsx HR-7: HR submits for employee
├── layouts/                HR layout components
│   ├── hr-layout.tsx       3-column: sidebar + main + right panel
│   ├── hr-sidebar.tsx      200px fixed sidebar navigation
│   └── hr-topbar.tsx       Search + breadcrumb + user chip
└── shared/                 Cross-cutting components
    ├── brand-logo.tsx      PayDay+ logo
    └── locale-switcher.tsx TH/EN/MM language toggle

lib/
├── auth/                   Mock authentication (PIN + session)
├── mock/                   Mock data (employees, requests, payroll cycles)
├── utils/
│   ├── cn.ts               Tailwind class merger (clsx + tailwind-merge)
│   ├── format.ts           formatTHB currency formatter
│   └── fees.ts             Transfer fee calculation (฿15/tx)
├── context/                Dark mode context provider
└── dayjs/                  dayjs with Thai locale config

types/index.ts              All TypeScript interfaces (Employee, EWARequest, etc.)
messages/                   i18n JSON files (en.json, th.json, my.json)
```

---

## Design system

All colors use CSS custom properties defined in `app/globals.css`. Never hardcode hex values in components — always reference the token.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#2DBD8F` | Buttons, links, active nav, progress bars |
| `--color-primary-dark` | `#1E9E74` | Hover states, hero card gradient end |
| `--color-primary-bg` | `#E8F5F0` | Soft backgrounds, hero areas |
| `--color-text-primary` | `#1A1D1B` | Headings, primary labels |
| `--color-text-secondary` | `#6B7280` | Sub-labels, meta text |
| `--color-text-muted` | `#9CA3AF` | Timestamps, breadcrumbs |
| `--color-bg-page` | `#E4EDEA` | Page background |
| `--color-bg-canvas` | `#FFFFFF` | Cards, main content |
| `--color-border` | `#E5E7EB` | Card borders, table dividers |

**Typography rules:**
- Thai text minimum 14px on desktop, 16px on employee mobile screens
- Numbers always use `font-sans` (Inter) with `font-variant-numeric: tabular-nums`
- Thai line-height is +0.2 higher than Latin (e.g., body 1.6 → 1.8)
- See `design.md` for the full type scale and component specs

**Tailwind config:** Extended in `tailwind.config.ts` with custom colors (via CSS var), shadows (`card`, `hover`, `modal`), border-radius (`sm`=6, `md`=8, `lg`=12, `xl`=16), and animation keyframes.

---

## Business rules (critical)

These are enforced in the UI and must be preserved in all changes. See `rules.md` for full details.

1. **Earned wage calculation:** `earnedToDate = (monthlySalary / totalWorkDays) × workedDays`
2. **Max withdrawable:** `(earnedToDate × maxPercent%) - previousEWAThisPeriod`
3. **Request limits:** Monthly max 2/month, Weekly max 1/week
4. **Amount validation:** min ฿500 (monthly) / ฿200 (weekly), must be whole number
5. **Transfer fee:** ฿15 per transaction, paid by employee. Always show fee and net amount.
6. **Cutoff rules:** Monthly no requests after 25th; Weekly no requests after Thursday 18:00
7. **Auto-approval:** If enabled and amount < threshold (default ฿3,000), auto-approve
8. **Status flow:** `pending → approved → disbursed` or `pending → rejected` (terminal)

---

## Coding conventions

### General
- All components are functional, using React hooks
- `"use client"` directive on any component using hooks, state, or browser APIs
- File naming: kebab-case (`employee-home-page.tsx`)
- One exported component per file, named export (not default) for page components
- Import order: React → external libs → `@/components` → `@/lib` → `@/types` → relative

### Styling
- Use Tailwind utility classes. Custom CSS only in `globals.css` for tokens/base styles
- Use the `cn()` helper from `@/lib/utils` for conditional classes
- Employee screens: max-width 390px, use `employee-screen` CSS class on shell
- HR screens: fluid layout with 200px sidebar, designed for 1440px

### i18n
- All user-facing strings go through `useTranslations()` from next-intl
- Translation keys organized by namespace: `login`, `nav`, `home`, `requestWizard`, `common`, etc.
- Date formatting uses `Intl.DateTimeFormat("th-TH", ...)` or dayjs with Thai locale
- Currency formatting via `formatTHB()` from `@/lib/utils/format`

### Testing
- Test files co-located: `component-name.test.tsx` next to the component
- Use Vitest + React Testing Library
- Mock data from `@/lib/mock/` — never create inline test fixtures
- Run: `npm test` (single run), `npm run test:watch` (watch mode)

---

## Screen map

### HR side (Desktop 1440px) — 7 screens
| ID | Route | Component | Description |
|----|-------|-----------|-------------|
| HR-0 | `/hr/login` | `hr-login-page.tsx` | Email + password login |
| HR-1 | `/hr/dashboard` | `dashboard-page.tsx` | 4 metric cards + request table + payroll widget |
| HR-2 | `/hr/requests` | `request-list-page.tsx` | Filterable data table with bulk actions |
| HR-3 | `/hr/requests/[id]` | `request-detail-drawer.tsx` | 480px slide-in drawer overlay |
| HR-4 | `/hr/reports` | `reports-page.tsx` | Bar charts + department table + reconciliation |
| HR-5 | `/hr/settings` | `settings-page.tsx` | EWA policy, notifications, user management |
| HR-6 | `/hr/employees` | `employees-page.tsx` | Employee list with EWA status |
| HR-7 | `/hr/employees/[id]/request` | `on-behalf-request-page.tsx` | HR submits EWA on behalf of employee |

### Employee side (Mobile 390px) — 5 screens
| ID | Route | Component | Description |
|----|-------|-----------|-------------|
| E-1 | `/employee/login` | `employee-login-page.tsx` | Employee ID + 4-digit PIN |
| E-2 | `/employee/home` | `employee-home-page.tsx` | Balance hero card + pay period + recent requests |
| E-3 | `/employee/request` | `employee-request-page.tsx` | 3-step wizard (amount → confirm → success) |
| E-4 | `/employee/history` | `employee-history-page.tsx` | Summary strip + status tabs + accordion cards |
| E-5 | `/employee/profile` | `employee-profile-page.tsx` | Bank account, EWA quota, notifications, language |

See `screens.md` for pixel-level anatomy of every screen.

---

## Active migration task: Employee view → LINE LIFF Mini App

### Context
The employee mobile view (5 screens) is being migrated to a LINE LIFF (LINE Front-end Framework) mini app package inside this same repository. The HR dashboard stays in the current app. The canonical migration plan is `PayDay+_LIFF_Migration_Plan.md`; `PayDay+_LIFF_Migration_Plan.docx` is an export/reference copy only.

### Architecture after migration

```
wow-payday+ root app         → HR dashboard only after migration (Next.js 15, desktop)
packages/payday-liff         → Employee LINE mini app (Next.js 15 + LIFF SDK)
packages/shared              → @payday/shared local workspace package
packages/payday-api          → LIFF auth/linking, webhooks, notification adapters
```

### What changes per screen

| Screen | Change | Details |
|--------|--------|---------|
| E-1: Login | **Replace entirely** | LINE Login replaces Employee ID + PIN. New `LIFFAuthGate` component handles `liff.init()` + `liff.login()`. Remove PINPad from login. First-time users get a one-time employee ID linking form. |
| E-2: Home | **Minor changes** | Avatar uses LINE profile picture via `liff.getProfile().pictureUrl`. NotificationBell removed (push notifications handle it). Everything else stays. |
| E-3: Request | **Step 2 changes** | Step 1 (amount) and Step 3 (success) are identical. Step 2 removes PINPad, replaces it with transaction-level step-up confirmation, and supports WebAuthn/device biometric or one-time confirmation code fallback. Receipt sharing uses `liff.shareTargetPicker()` instead of Web Share API. |
| E-4: History | **Direct port** | Add deep-link support via LIFF URL params (`?page=history&id=EWA-001`). |
| E-5: Profile | **Simplify** | LINE profile picture, "Unlink account" replaces logout, remove session management. |
| Navigation | **Keep + add** | BottomTabBar stays as in-app nav. LINE rich menu adds entry points from outside the app. |

### Shared code to extract to packages/shared (`@payday/shared`)

When working on the LIFF migration, these must be extracted into the shared package:

- `types/index.ts` — all TypeScript interfaces
- `lib/utils/format.ts` — `formatTHB()` currency formatter
- `lib/utils/fees.ts` — transfer fee constants and calculation
- `lib/utils/cn.ts` — Tailwind class merger
- `messages/*.json` — i18n translation files (extract employee-relevant keys)
- Business rule constants (min amounts, max percentages, cutoff rules)
- `lib/dayjs/` — Thai locale/date configuration
- Design token contract used by Tailwind/CSS variables

### LINE LIFF SDK integration points

1. **`liff.init({ liffId })`** — Call on app mount. Required before any LIFF API.
2. **`liff.login()`** — Triggers LINE Login. Automatic if opened inside LINE.
3. **`liff.getProfile()`** — Returns `{ userId, displayName, pictureUrl }`. Map `userId` to employee record.
4. **`liff.isInClient()`** — `true` if running inside LINE app, `false` in external browser.
5. **`liff.shareTargetPicker()`** — Share Flex Messages (receipt) to LINE contacts.
6. **`liff.closeWindow()`** — Close the LIFF window (only works inside LINE).

### LINE Messaging API for push notifications

| Event | When | Priority |
|-------|------|----------|
| Request approved | HR approves | P0 |
| Request rejected | HR rejects | P0 |
| Disbursement complete | Bank transfer settles | P0 |
| Payday reminder | 1 day before payday | P1 |
| Cutoff warning | 2 days before EWA cutoff | P1 |

### Testing the LIFF app

1. **Local dev:** `next dev` + ngrok for HTTPS tunnel. Mock LIFF SDK with `NEXT_PUBLIC_LIFF_MOCK=true`.
2. **External browser:** Open `https://liff.line.me/{liffId}` in Chrome — tests real LINE Login OAuth.
3. **Inside LINE:** Open LIFF URL in LINE on real iOS + Android devices. Test `isInClient()`, viewport, safe-area-inset.
4. **Push notifications:** Use Messaging API push endpoint with test LINE userId.

### Migration phases

| Phase | Weeks | Deliverables |
|-------|-------|-------------|
| 1: Foundation | 1–2 | Same-repo LIFF workspace package, LIFF SDK setup, shared package extraction, auth gate |
| 2: Screens | 3–4 | Port all 5 employee screens, adapt for LIFF context |
| 3: LINE features | 5–6 | Push notifications, rich menu, Flex Messages, deep links |
| 4: Testing & launch | 7–8 | E2E testing, i18n verification, remove employee routes from monolith |

---

## Files you should read

| File | What it tells you |
|------|-------------------|
| `product.md` | One-page product brief — users, core flow, scope |
| `screens.md` | Pixel-level screen specs for all 12 screens |
| `design.md` | Full design system — colors, typography, components, spacing |
| `rules.md` | Business rules (earned wage calc, limits, cutoffs, fees) |
| `data-model.md` | TypeScript types + mock data shapes + business logic utils |
| `components.md` | Component inventory with props, variants, and usage |
| `types/index.ts` | All shared TypeScript interfaces |
| `tailwind.config.ts` | Design token mappings to Tailwind |
| `app/globals.css` | CSS custom properties (the source of truth for tokens) |
| `PayDay+_LIFF_Migration_Plan.md` | Canonical LIFF migration plan |
| `PayDay+_LIFF_Migration_Plan.docx` | Export/reference copy of the migration plan |

---

## Common tasks

### Add a new employee screen component
1. Create `components/employee/new-page.tsx` with `"use client"` directive
2. Add route in `app/[locale]/employee/new-page/page.tsx`
3. Add translations to all 3 locale files in `messages/`
4. Follow 390px mobile viewport, min 16px Thai font size
5. Use existing UI primitives from `components/ui/`

### Add a new HR screen component
1. Create `components/hr/new-page.tsx`
2. Add route in `app/[locale]/hr/new-page/page.tsx`
3. The HR layout (sidebar + topbar) is automatic via `app/[locale]/hr/layout.tsx`
4. Follow 1440px desktop layout with sidebar (200px) + main (fluid) + optional right panel (280px)

### Modify business rules
1. Update the rule in `rules.md` first
2. Update validation logic in `lib/utils/fees.ts` or the relevant component
3. Update mock data in `lib/mock/` if affected
4. Verify all affected screens still render correctly
5. Run `npm test` to check for regressions

### Work with the Figma design
- Use the Figma MCP tools to fetch design context: `get_design_context` with `fileKey: "mmEkmsppCk5Dx2hynYhxwX"`
- Map Figma components to code using the table in `design.md` (section: Figma ↔ Code Mapping)
- Extract colors and spacing from Figma's Inspect panel, match to CSS custom properties

---

## Do not

- Hardcode colors — always use CSS custom properties via Tailwind tokens
- Use `px` values that don't match the design system spacing scale
- Add new npm dependencies without checking if an existing one covers the need
- Modify mock data shapes without updating `types/index.ts` and `data-model.md`
- Skip i18n — every user-facing string must go through `useTranslations()`
- Use default exports for page components — use named exports
- Forget the transfer fee (฿15) when displaying EWA amounts to employees
- Break the status flow: `pending → approved → disbursed` or `pending → rejected`

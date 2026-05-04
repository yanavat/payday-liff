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

- [x] Create Next.js 14 project (TypeScript + Tailwind + App Router)
- [x] Init shadcn/ui
- [x] Install dependencies (lucide-react, recharts, tanstack-table, react-hook-form, zod, dayjs, zustand)
- [x] Setup folder structure (hr / employee routes)
- [x] Add CSS tokens from design.md to globals.css
- [x] Setup mock data folder structure
- [x] Configure dayjs with Buddhist Era plugin (+543)
- [!] Setup Vercel project + connect GitHub repo — blocked until Vercel/GitHub account access is provided
- [x] Configure i18n (next-intl) — TH / EN / Myanmar

---

## Phase 1 — Design System & Shared Components

### Tokens & Base

- [x] Color tokens (primary, text, surface, border, semantic)
- [x] Typography scale
- [x] Spacing scale
- [x] Border radius & shadows

### Shared Components

- [x] `<Avatar />` — xs / sm / md / lg with initials fallback
- [x] `<StatusBadge />` — pending / approved / rejected / disbursed
- [x] `<WorkTypeBadge />` — remote / on-site / hybrid
- [x] `<PayCycleBadge />` — monthly / weekly
- [x] `<TrendBadge />` — positive / negative with % and arrow
- [x] `<MetricCard />` — icon + label + value + trend
- [x] `<SectionHeader />` — title + optional action (··· or button)
- [x] `<FilterButton />` — with funnel icon + dropdown
- [x] `<TabBar />` — filter tabs with active state
- [x] `<ProgressBar />` — with label + percentage
- [x] `<DataTable />` — sortable headers + checkbox + pagination
- [x] `<SlideDrawer />` — right-anchored 480px with overlay
- [x] `<ConfirmModal />` — approve / reject confirmation
- [x] `<Toast />` — success / error / info variants (auto-dismiss 4s)
- [x] `<EmptyState />` — illustration + message
- [x] `<SkeletonRow />` — loading placeholder for tables
- [x] `<PINPad />` — 4-dot PIN input (ATM style)
- [x] `<QuickAmountButton />` — preset amount selector
- [x] `<StepIndicator />` — 3-step wizard progress

---

## Phase 2 — Mock Data

- [x] `employees.ts` — 20 sample employees (mixed monthly/weekly)
- [x] `requests.ts` — 30 EWA requests (mixed status)
- [x] `departments.ts` — department list
- [x] `payrollCycles.ts` — current cycle data (monthly + weekly)
- [x] `reports.ts` — monthly/weekly aggregated data
- [x] `notifications.ts` — sample notification items
- [x] `currentUser.ts` — HR user + Employee user mock sessions

---

## Phase 3 — HR Side (Desktop)

### Layout

- [ ] HR root layout — sidebar + topbar shell
- [ ] `<HRSidebar />` — nav items + active state + CTA card
- [ ] `<HRTopbar />` — title + breadcrumb + search + bell + avatar
- [ ] `<HRLayout />` — 3-column wrapper (sidebar + main + right panel)

### Screen 1 — Dashboard

- [ ] 4 metric cards row (pending / approved / disbursed / enrolled)
- [ ] Recent EWA requests table (5 rows preview)
- [ ] Payroll cycle progress widget (monthly + weekly dual bar)
- [ ] Donut chart — request status breakdown
- [ ] Right panel — upcoming dates list

### Screen 2 — EWA Request List

- [ ] Search input
- [ ] Department dropdown filter
- [ ] Pay cycle filter (All / Monthly / Weekly)
- [ ] Status tab filter (ทั้งหมด / รออนุมัติ / อนุมัติแล้ว / ปฏิเสธ)
- [ ] Date range picker
- [ ] Bulk select + "Approve Selected" button
- [ ] Full data table (8 columns)
- [ ] Row click → open Request Detail Drawer
- [ ] Pagination (20 rows/page)

### Screen 3 — Request Detail Drawer

- [ ] Employee header (avatar + name + ID + department)
- [ ] Pay period progress bar (monthly: X/31 days, weekly: X/5 days)
- [ ] Financial breakdown card (earned / previous / max / requested / remaining)
- [ ] Request history timeline (last 3 months or weeks)
- [ ] Employee note display
- [ ] HR internal note textarea
- [ ] Approve / Reject action buttons
- [ ] Confirmation modal on action
- [ ] Success toast after approve/reject

### Screen 4 — Accountant Report

- [ ] Date range selector (This Month / Last Month / Custom)
- [ ] Monthly / Weekly view toggle
- [ ] 5 metric cards
- [ ] Bar chart — daily disbursement (30 bars)
- [ ] Bar chart — weekly view (52 weeks)
- [ ] Department breakdown table
- [ ] Reconciliation section (Processing / Settled / Failed)
- [ ] Retry button for failed transfers
- [ ] Export CSV / PDF buttons

### Screen 5 — Settings

- [ ] Tabs (ทั่วไป / นโยบาย EWA / การแจ้งเตือน / จัดการผู้ใช้)
- [ ] EWA Policy sub-tabs (รายเดือน / รายสัปดาห์)
- [ ] Max % slider (0–70%, default 50%)
- [ ] Max requests/period number input
- [ ] Minimum amount input (฿ prefix)
- [ ] Auto-approval toggle + threshold input
- [ ] Approval chain radio (single / two-step)
- [ ] Weekly payday selector (Mon–Fri dropdown)
- [ ] EWA cutoff days input
- [ ] Blackout dates multi-picker + chips
- [ ] Notification toggles (email / LINE per event)
- [ ] Save button with success toast

### Screen 6 — Employee List (HR View)

- [ ] Search by name or ID
- [ ] Department dropdown filter
- [ ] Pay type filter (Monthly / Weekly)
- [ ] Employee table (7 columns)
- [ ] Status badge per employee (มีสิทธิ์ / ใช้ครบ / ถูกระงับ)
- [ ] "ยื่นคำขอแทน" button per row → navigate to Screen 7

### Screen 7 — HR Request Form (On Behalf)

- [ ] Amber banner "HR กำลังยื่นคำขอแทน [ชื่อพนักงาน]"
- [ ] Employee info card (read-only)
- [ ] Available balance highlight card
- [ ] Quick amount buttons (฿1,000 / ฿2,000 / ฿3,000)
- [ ] Custom amount input with real-time validation
- [ ] Employee reason chips
- [ ] HR note textarea (required)
- [ ] Bank account confirmation (read-only, masked)
- [ ] Submit button (no PIN — uses HR session)
- [ ] Success screen + audit log reference
- [ ] Cancel link → back to employee list

---

## Phase 4 — Employee Side (Mobile 390px)

### Layout

- [ ] Employee root layout — bottom tab bar
- [ ] `<BottomTabBar />` — 4 tabs (หน้าหลัก / ยื่นคำขอ / ประวัติ / โปรไฟล์)
- [ ] Active tab: teal icon + label, others gray

### E-Screen 1 — Login

- [ ] Logo + app name
- [ ] Employee ID numeric input (large)
- [ ] 4-dot PIN pad (ATM style)
- [ ] "เข้าสู่ระบบ" button (52px height, full width)
- [ ] "ลืม PIN?" link
- [ ] QR Code scan button (kiosk option)
- [ ] Language toggle (TH / EN / MM)
- [ ] Error state: wrong PIN with attempt counter
- [ ] Lockout state: locked 30 min after 5 wrong attempts

### E-Screen 2 — Home

- [ ] Greeting header "สวัสดี, [ชื่อ] 👋"
- [ ] Hero balance card (teal bg, large amount, breakdown)
- [ ] "ยื่นคำขอเบิก" CTA button
- [ ] Pay period progress bar
- [ ] EWA cutoff warning badge (amber)
- [ ] Payday countdown
- [ ] Recent requests card list (last 3)
- [ ] "ดูประวัติทั้งหมด →" link

### E-Screen 3 — Request Form (3-Step Wizard)

- [ ] Step indicator (1 / 2 / 3)
- **Step 1 — เลือกจำนวน**
  - [ ] Available balance display (read-only)
  - [ ] Quick amount buttons (฿1,000 / ฿2,000 / ฿3,000)
  - [ ] Custom amount input with ฿ prefix
  - [ ] Real-time validation (red if over limit)
  - [ ] Reason chips (5 options)
  - [ ] "ถัดไป →" button (disabled if no amount)
- **Step 2 — ยืนยัน**
  - [ ] Summary card (name / ID / amount / reason / bank / date)
  - [ ] Amber warning banner "จะถูกหักวันที่ XX"
  - [ ] 4-dot PIN confirmation pad
  - [ ] "ยืนยัน" button
  - [ ] "← แก้ไข" link
- **Step 3 — สำเร็จ**
  - [ ] Animated checkmark (teal circle)
  - [ ] Reference number card
  - [ ] "กลับหน้าหลัก" button
  - [ ] "แชร์ใบรับคำขอ" outlined button

### E-Screen 4 — History

- [ ] Summary strip (horizontal scroll — this month / last month / total)
- [ ] Status tab filter
- [ ] Request card list (date / amount / status / reference)
- [ ] Accordion expand on tap — full detail inline
- [ ] Expanded detail (requested / approved / transferred dates + approver)
- [ ] Pagination or infinite scroll

### E-Screen 5 — Profile

- [ ] Avatar + name + ID + department + pay type badge
- [ ] Bank account card (masked, read-only)
- [ ] EWA limit card (max % / quota used / remaining) with progress bar
- [ ] Notification toggles (approved / payday / LINE)
- [ ] Language selector
- [ ] "ออกจากระบบ" button (red text)

---

## Phase 5 — UX & Accessibility

- [ ] Minimum font size 16px on all employee screens
- [ ] Touch targets minimum 48px height on all buttons
- [ ] Error messages in plain Thai (no technical terms)
- [ ] Offline state — banner when no internet
- [ ] Loading skeleton screens (not spinners)
- [ ] Empty states for all list screens
- [ ] Form validation messages (friendly Thai)
- [ ] Focus rings on all interactive elements (WCAG AA)
- [ ] ARIA labels on icon-only buttons

---

## Phase 6 — Polish & Demo Prep

- [ ] Smooth page transitions (fade / slide)
- [ ] Sidebar expand/collapse animation (200ms)
- [ ] Drawer slide-in animation (250ms)
- [ ] Pending badge pulse animation
- [ ] Toast slide-in from top-right
- [ ] Hover states on all interactive elements
- [ ] Responsive — tablet view (1024px sidebar icon-only)
- [ ] Dark mode (stretch goal)
- [ ] Prototype flow: Login → Dashboard → Request → Approve → Toast
- [ ] Demo script for stakeholder walkthrough

---

## Phase 7 — Deploy MVP

- [ ] Push to GitHub
- [ ] Connect Vercel project
- [ ] Set environment variables
- [ ] Test on real mobile device (iOS + Android)
- [ ] Share demo URL with HR team for feedback
- [ ] Collect feedback → backlog for Phase 2

---

## Backlog (Post-MVP)

- [ ] Real authentication (JWT + bcrypt PIN)
- [ ] Backend API (Fastify + Prisma + PostgreSQL)
- [ ] LINE Notify integration
- [ ] SMS notification (AWS SNS)
- [ ] Kiosk mode (QR scan login on tablet)
- [ ] Weekly pay cycle logic
- [ ] HR/Payroll system integration (Provider pattern)
- [ ] Audit log viewer
- [ ] PDF export (pay slips, reports)
- [ ] Myanmar language full translation
- [ ] Multi-factory support

---

## Progress Summary

| Phase             | Total Tasks | Done  | Progress |
| ----------------- | ----------- | ----- | -------- |
| 0 · Setup         | 9           | 0     | 0%       |
| 1 · Design System | 19          | 0     | 0%       |
| 2 · Mock Data     | 7           | 0     | 0%       |
| 3 · HR Side       | 58          | 0     | 0%       |
| 4 · Employee Side | 37          | 0     | 0%       |
| 5 · UX & A11y     | 9           | 0     | 0%       |
| 6 · Polish        | 10          | 0     | 0%       |
| 7 · Deploy        | 7           | 0     | 0%       |
| **Total**         | **156**     | **0** | **0%**   |

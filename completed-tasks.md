# Completed Tasks

> Archived from `task.md` to keep the active backlog focused.

## Phase 0 — Project Setup

- [x] Create Next.js 14 project (TypeScript + Tailwind + App Router)
- [x] Init shadcn/ui
- [x] Install dependencies (lucide-react, recharts, tanstack-table, react-hook-form, zod, dayjs, zustand)
- [x] Setup folder structure (hr / employee routes)
- [x] Add CSS tokens from design.md to globals.css
- [x] Setup mock data folder structure
- [x] Configure dayjs with Buddhist Era plugin (+543)
- [x] Configure i18n (next-intl) — TH / EN / Myanmar

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

## Phase 2 — Mock Data

- [x] `employees.ts` — 20 sample employees (mixed monthly/weekly)
- [x] `requests.ts` — 30 EWA requests (mixed status)
- [x] `departments.ts` — department list
- [x] `payrollCycles.ts` — current cycle data (monthly + weekly)
- [x] `reports.ts` — monthly/weekly aggregated data
- [x] `notifications.ts` — sample notification items
- [x] `currentUser.ts` — HR user + Employee user mock sessions

## Phase 3 — HR Side (Desktop)

### Screen 0 — HR Login

- [x] Full-screen centered card
- [x] Email input
- [x] Password input
- [x] "ลืมรหัสผ่าน?" link
- [x] Primary full-width login button
- [x] Loading state
- [x] Invalid credentials error state

### Layout

- [x] HR root layout — sidebar + topbar shell
- [x] `<HRSidebar />` — nav items + active state + CTA card
- [x] `<HRTopbar />` — title + breadcrumb + search + bell + avatar
- [x] `<HRLayout />` — 3-column wrapper (sidebar + main + right panel)

### Screen 1 — Dashboard

- [x] 4 metric cards row (pending / approved / disbursed / enrolled)
- [x] Recent EWA requests table (5 rows preview)
- [x] Payroll cycle progress widget (monthly + weekly dual bar)
- [x] Donut chart — request status breakdown
- [x] Right panel — upcoming dates list

### Screen 2 — EWA Request List

- [x] Search input
- [x] Department dropdown filter
- [x] Pay cycle filter (All / Monthly / Weekly)
- [x] Status tab filter (ทั้งหมด / รออนุมัติ / อนุมัติแล้ว / ปฏิเสธ)
- [x] Date range picker
- [x] Bulk select + "Approve Selected" button
- [x] Full data table (8 columns)
- [x] Row click → open Request Detail Drawer
- [x] Pagination (20 rows/page)

### Screen 3 — Request Detail Drawer

- [x] Employee header (avatar + name + ID + department)
- [x] Pay period progress bar (monthly: X/31 days, weekly: X/5 days)
- [x] Financial breakdown card (earned / previous / max / requested / remaining)
- [x] Request history timeline (last 3 months or weeks)
- [x] Employee note display
- [x] HR internal note textarea
- [x] Approve / Reject action buttons
- [x] Confirmation modal on action
- [x] Success toast after approve/reject

### Screen 4 — Accountant Report

- [x] Date range selector (This Month / Last Month / Custom)
- [x] Monthly / Weekly view toggle
- [x] 5 metric cards
- [x] Bar chart — daily disbursement (30 bars)
- [x] Bar chart — weekly view (52 weeks)
- [x] Department breakdown table
- [x] Reconciliation section (Processing / Settled / Failed)
- [x] Retry button for failed transfers
- [x] Export CSV / PDF buttons

### Screen 5 — Settings

- [x] Tabs (ทั่วไป / นโยบาย EWA / การแจ้งเตือน / จัดการผู้ใช้)
- [x] EWA Policy sub-tabs (รายเดือน / รายสัปดาห์)
- [x] Max % slider (0–70%, default 50%)
- [x] Max requests/period number input
- [x] Minimum amount input (฿ prefix)
- [x] Auto-approval toggle + threshold input
- [x] Approval chain radio (single / two-step)
- [x] Weekly payday selector (Mon–Fri dropdown)
- [x] EWA cutoff days input
- [x] Blackout dates multi-picker + chips
- [x] Notification toggles (email / LINE per event)
- [x] Save button with success toast

### Screen 6 — Employee List (HR View)

- [x] Search by name or ID
- [x] Department dropdown filter
- [x] Pay type filter (Monthly / Weekly)
- [x] Employee table (7 columns)
- [x] Status badge per employee (มีสิทธิ์ / ใช้ครบ / ถูกระงับ)
- [x] "ยื่นคำขอแทน" button per row → navigate to Screen 7

### Screen 7 — HR Request Form (On Behalf)

- [x] Amber banner "HR กำลังยื่นคำขอแทน [ชื่อพนักงาน]"
- [x] Employee info card (read-only)
- [x] Available balance highlight card
- [x] Quick amount buttons (฿1,000 / ฿2,000 / ฿3,000)
- [x] Custom amount input with real-time validation
- [x] Employee reason chips
- [x] HR note textarea (required)
- [x] Bank account confirmation (read-only, masked)
- [x] Submit button (no PIN — uses HR session)
- [x] Success screen + audit log reference
- [x] Cancel link → back to employee list

## Phase 4 — Employee Side (Mobile 390px)

### Layout

- [x] Employee root layout — bottom tab bar
- [x] `<BottomTabBar />` — 4 tabs (หน้าหลัก / ยื่นคำขอ / ประวัติ / โปรไฟล์)
- [x] Active tab: teal icon + label, others gray

### E-Screen 1 — Login

- [x] Logo + app name
- [x] Employee ID numeric input (large)
- [x] 4-dot PIN pad (ATM style)
- [x] "เข้าสู่ระบบ" button (52px height, full width)
- [x] "ลืม PIN?" link
- [x] QR Code scan button (kiosk option)
- [x] Language toggle (TH / EN / MM)
- [x] Error state: wrong PIN with attempt counter
- [x] Lockout state: locked 30 min after 5 wrong attempts

### E-Screen 2 — Home

- [x] Greeting header "สวัสดี, [ชื่อ] 👋"
- [x] Hero balance card (teal bg, large amount, breakdown)
- [x] "ยื่นคำขอเบิก" CTA button
- [x] Pay period progress bar
- [x] EWA cutoff warning badge (amber)
- [x] Payday countdown
- [x] Recent requests card list (last 3)
- [x] "ดูประวัติทั้งหมด →" link

### E-Screen 3 — Request Form (3-Step Wizard)

- [x] Step indicator (1 / 2 / 3)
- **Step 1 — เลือกจำนวน**
  - [x] Available balance display (read-only)
  - [x] Quick amount buttons (฿1,000 / ฿2,000 / ฿3,000)
  - [x] Custom amount input with ฿ prefix
  - [x] Real-time validation (red if over limit)
  - [x] Reason chips (5 options)
  - [x] "ถัดไป →" button (disabled if no amount)
- **Step 2 — ยืนยัน**
  - [x] Summary card (name / ID / amount / reason / bank / date)
  - [x] Amber warning banner "จะถูกหักวันที่ XX"
  - [x] 4-dot PIN confirmation pad
  - [x] "ยืนยัน" button
  - [x] "← แก้ไข" link
- **Step 3 — สำเร็จ**
  - [x] Animated checkmark (teal circle)
  - [x] Reference number card
  - [x] "กลับหน้าหลัก" button
  - [x] "แชร์ใบรับคำขอ" outlined button

### E-Screen 4 — History

- [x] Summary strip (horizontal scroll — this month / last month / total)
- [x] Status tab filter
- [x] Request card list (date / amount / status / reference)
- [x] Accordion expand on tap — full detail inline
- [x] Expanded detail (requested / approved / transferred dates + approver)
- [x] Pagination or infinite scroll

### E-Screen 5 — Profile

- [x] Avatar + name + ID + department + pay type badge
- [x] Bank account card (masked, read-only)
- [x] EWA limit card (max % / quota used / remaining) with progress bar
- [x] Notification toggles (approved / payday / LINE)
- [x] Language selector
- [x] "ออกจากระบบ" button (red text)

## Phase 5 — UX & Accessibility

- [x] Minimum font size 16px on all employee screens
- [x] Touch targets minimum 48px height on all buttons
- [x] Error messages in plain Thai (no technical terms)
- [x] Offline state — banner when no internet
- [x] Loading skeleton screens (not spinners)
- [x] Empty states for all list screens
- [x] Form validation messages (friendly Thai)
- [x] Focus rings on all interactive elements (WCAG AA)
- [x] ARIA labels on icon-only buttons

## Phase 6 — Polish & Demo Prep

- [x] Smooth page transitions (fade / slide)
- [x] Sidebar expand/collapse animation (200ms)
- [x] Drawer slide-in animation (250ms) + exit animation
- [x] Pending badge pulse animation
- [x] Toast slide-in from top-right + exit animation
- [x] Hover states on all interactive elements
- [x] Responsive — tablet view (1024px sidebar icon-only)
- [x] Responsive — HR content pages (dashboard/report/settings/employee/request grids)
- [x] Dark mode (HR side only — teal-tinted dark slate palette)
- [x] Prototype flow: Login → Dashboard → Request → Approve → Toast
- [x] Demo script for stakeholder walkthrough

## Phase 7 — Deploy MVP

- [x] Push to GitHub — repo: github.com/yanavat/paydayplus_poc (1 manual commit needed — see DEPLOY.md Step 1)
- [x] Connect Vercel project — vercel.json added; ready for `vercel --prod` or dashboard import
- [x] Set environment variables — .env.example created; no vars required for mock-data demo

## Post-MVP

- [x] Real authentication (JWT + bcrypt PIN) — completed 2026-05-05
- [x] PDF export (pay slips, reports) — completed 2026-05-05

## Language Switching (i18n) — Completed

- [x] Audit all components for hardcoded Thai strings (20 files, ~400 matches)
- [x] Add missing translation keys to `my.json` (dashboard, requests, requestDetail, employees, hrRequest, reports, settings)
- [x] Update all Employee components to use `useTranslations()`
- [x] Update all HR components to use `useTranslations()`
- [x] Update shared/UI components (StatusBadge, ConfirmModal, BottomTabBar, HRSidebar, HRTopbar)
- [x] Build and verify zero errors

**Files modified:**

- `/messages/my.json` — added all missing Burmese translation sections
- `/components/employee/employee-login-page.tsx`
- `/components/employee/employee-home-page.tsx`
- `/components/employee/employee-request-page.tsx`
- `/components/employee/employee-history-page.tsx`
- `/components/employee/employee-profile-page.tsx`
- `/components/employee/bottom-tab-bar.tsx`
- `/components/hr/hr-login-page.tsx`
- `/components/hr/dashboard-page.tsx`
- `/components/hr/request-list-page.tsx`
- `/components/hr/request-detail-drawer.tsx`
- `/components/hr/employees-page.tsx`
- `/components/hr/reports-page.tsx`
- `/components/hr/settings-page.tsx`
- `/components/hr/on-behalf-request-page.tsx`
- `/components/layouts/hr-sidebar.tsx`
- `/components/layouts/hr-topbar.tsx`
- `/components/ui/status-badge.tsx`
- `/components/ui/confirm-modal.tsx`
- `/components/ui/dark-mode-toggle.tsx`
- `/components/ui/data-table.tsx`

---

# PayDay+ — Stakeholder Demo Script

> **Goal**: Walk HR leadership and factory management through the Earned Wage Access prototype in 10–12 minutes.
> **Date**: May 2025  
> **Presenter**: Product / Design lead  

---

## 1. Opening (30 sec)

> *“PayDay+ คือแพลตฟอร์มเบิกเงินเดือนล่วงหน้าสำหรับโรงงาน — พนักงานสามารถเบิกเงินที่หามาแล้ว (Earned Wage Access) ผ่านมือถือได้ทันที โดยไม่ต้องรอวันจ่ายเงิน”*

- Show landing / login screen on mobile viewport (390 px)
- Mention: zero integration on day-one demo; all data is mocked for visual validation

---

## 2. Employee Flow — Mobile (4 min)

### Login
- Enter **EMP-0001** + PIN **1234**
- Wrong PIN shows friendly Thai error with attempt counter
- After 5 wrong attempts → lockout screen (30 min countdown)

### Home Screen
- Greeting + available balance card (hero teal gradient)
- Tap **“ยื่นคำขอเบิกเงิน”**
- Highlight: pay-period progress bar + EWA cutoff warning badge

### Request Wizard (3 steps)
1. **เลือกจำนวน** — tap quick amount ฿2,000 or type custom
   - Over-limit shows real-time red validation
   - Select reason chip (e.g., ค่ารักษาพยาบาล)
2. **ยืนยัน** — review summary card
   - Enter 4-dot PIN **1234**
   - Amber warning: “จะถูกหักจากเงินเดือนวันที่ 31 พ.ค.”
3. **เสร็จสิ้น** — animated teal checkmark
   - Reference number card (e.g., EWA-20250504-001)
   - Tap **“กลับหน้าหลัก”**

### History
- Summary strip: this month / last month / total
- Status tabs: ทั้งหมด / รออนุมัติ / อนุมัติแล้ว / ปฏิเสธ
- Tap card to expand inline details (requested → approved → transferred dates)

### Profile
- Avatar, bank account (masked), EWA limit progress bar
- Toggle notifications + language switch (TH / EN / Myanmar)
- Logout button

---

## 3. HR Dashboard — Desktop (4 min)

### Dashboard
- 4 metric cards: pending / approved / disbursed / enrolled
- Recent requests table (5-row preview) → click row opens detail drawer
- Payroll cycle progress widget (monthly + weekly)
- Donut chart: status breakdown
- Right panel: upcoming dates (cutoff + payday countdown)

### EWA Request List
- Search by name / ID / department
- Department dropdown + pay cycle filter + date range
- Status tabs: ทั้งหมด / รออนุมัติ / อนุมัติแล้ว / ปฏิเสธ
- Bulk select → **“อนุมัติที่เลือก”** → success toast slides in top-right
- Row click → open **Request Detail Drawer** (slide-in 250 ms)

### Request Detail Drawer
- Employee header (avatar + name + department)
- Pay period progress bar
- Financial breakdown: earned / previous / max / requested / remaining
- Request history timeline (last 3 months)
- HR internal note textarea
- **Approve** → confirmation modal → success toast
- **Reject** → reason input required → success toast

### Accountant Report
- Toggle: This Month / Last Month / Custom
- Monthly / Weekly view
- 5 metric cards + bar charts
- Department breakdown table
- Reconciliation: Processing / Settled / Failed
- Export CSV / PDF buttons

### Settings
- Max % slider (0–70%)
- Auto-approval toggle + threshold
- Approval chain (single / two-step)
- Weekly payday selector + blackout dates
- Notification toggles (email / LINE per event)
- Save → success toast

### Employee List (HR View)
- Search + department + pay type filters
- “ยื่นคำขอแทน” button per row
- Navigate to **On-Behalf Request Form**
  - Amber banner: “HR กำลังยื่นคำขอแทน [ชื่อพนักงาน]”
  - No PIN required — uses HR session
  - Submit → success screen with audit log reference

---

## 4. UX & Accessibility Highlights (1 min)

> *“เราออกแบบให้พนักงานใช้งานได้ทันที แม้ไม่เคยใช้แอปมาก่อน”*

- **Minimum font size 16 px** on all mobile screens (prevents iOS zoom)
- **Touch targets ≥ 48 px** on every button
- **Skeleton loaders** (not spinners) — perceived performance
- **Empty states** on every list screen
- **Focus rings** (WCAG AA) on all interactive elements
- **ARIA labels** on icon-only buttons
- **Error messages in plain Thai** — no technical jargon
- **Offline banner** when connection drops

---

## 5. Responsive & Polish (1 min)

- **Sidebar collapse** at < 1024 px → icon-only mode with tooltips
- **Smooth page transitions** (fade + slide) on every route change
- **Drawer slide-in / slide-out** (250 ms) with backdrop fade
- **Toast slide-in from top-right** with exit animation
- **Pending badge pulse** animation draws attention
- **Hover lift shadows** on cards and table rows

---

## 6. Closing & Next Steps (1 min)

> *“นี่คือ MVP ที่พร้อมสำหรับการทดสอบกับ HR และกลุ่มพนักงานตัวอย่าง หลังจากนี้เราจะ…”*

1. Deploy to Vercel → share demo URL with HR team
2. Collect feedback → Phase 2 backlog
3. Real auth (JWT + bcrypt PIN)
4. Backend API (Fastify + Prisma + PostgreSQL)
5. LINE Notify + SMS integration
6. Kiosk mode (QR scan on tablet)

---

## Demo Quick Reference

| Screen | Route | Key Interaction |
|--------|-------|-----------------|
| Employee Login | `/th/employee/login` | EMP-0001 + 1234 |
| Employee Home | `/th/employee/home` | Tap “ยื่นคำขอเบิกเงิน” |
| Request Form | `/th/employee/request` | 3-step wizard |
| History | `/th/employee/history` | Expand card |
| HR Dashboard | `/th/hr/dashboard` | Click table row |
| Request List | `/th/hr/requests` | Bulk approve |
| Reports | `/th/hr/reports` | Toggle monthly/weekly |
| Settings | `/th/hr/settings` | Save policy |
| On Behalf | `/th/hr/employees` → row button | HR submit without PIN |

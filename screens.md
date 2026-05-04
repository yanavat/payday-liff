# Screen Specifications — PayDay+ EWA System

> Version 1.0 · May 2025  
> HR Side: 7 screens (Desktop 1440px)  
> Employee Side: 5 screens (Mobile 390px)

---

## Navigation Map

```
/
├── /hr/
│   ├── /hr/dashboard          HR-1  Dashboard
│   ├── /hr/requests           HR-2  EWA Request List
│   ├── /hr/requests/[id]      HR-3  Request Detail (Drawer overlay on HR-2)
│   ├── /hr/reports            HR-4  Accountant Report
│   ├── /hr/settings           HR-5  Settings
│   ├── /hr/employees          HR-6  Employee List
│   └── /hr/employees/[id]/request  HR-7  HR Request Form (On Behalf)
│
└── /employee/
    ├── /employee/login        E-1   Login
    ├── /employee/home         E-2   Home Dashboard
    ├── /employee/request      E-3   New Request Form (3-step)
    ├── /employee/request/confirm  E-3.1   Request Confirmation
    ├── /employee/request/success  E-3.2   Request succeeded
    ├── /employee/history      E-4   Request History
    └── /employee/profile      E-5   Profile & Settings
```

---

## Screen Spec Format

Each screen documents:

1. **Meta** — route, layout, viewport
2. **Anatomy** — every section and its components
3. **Interactions** — click, hover, navigate, open/close
4. **States** — loading, empty, error, success
5. **Mobile notes** — if desktop screen has mobile adaptation

---

---

# HR SIDE — Desktop (1440px)

---

## HR-1: Dashboard

```
Route:    /hr/dashboard
Layout:   HRLayout (Sidebar 200px + Main fluid + Right Panel 280px)
Viewport: 1440px desktop
Auth:     HR Manager / Accountant role
```

### Anatomy

#### Topbar

```
Component: <HRTopbar />
Left:
  - Page title: "Dashboard" (--text-page-title, --color-text-primary)
  - Breadcrumb: "หน้าหลัก / Dashboard" (12px, --color-text-muted)
Center:
  - <SearchBar /> placeholder="ค้นหาพนักงาน รหัส หรือแผนก..."
Right:
  - Pay period label: "รอบ: 1–31 พ.ค. 2568" (11px, --color-text-muted)
  - <NotificationBell /> with unread count badge
  - <UserChip /> name="สมศรี ใจดี" role="HR Manager"
```

#### Metric Cards Row

```
Component: 4× <MetricCard />
Layout: grid-cols-4, gap-3
Order and props:

1. Pending Requests
   label="คำขอรออนุมัติ"
   value="12"
   trend="+3"
   trendLabel="จากเมื่อวาน"
   trendType="warning"
   icon=<ClockIcon />

2. Approved Today
   label="อนุมัติแล้ววันนี้"
   value="8"
   sub="฿42,500 รวม"
   trendType="positive"
   icon=<CheckCircleIcon />

3. Total Disbursed This Month
   label="เบิกจ่ายเดือนนี้"
   value="฿287,000"
   sub="จาก ฿500,000 วงเงิน"
   trendType="info"
   icon=<BanknoteIcon />

4. Enrolled Employees
   label="พนักงานลงทะเบียน"
   value="348"
   sub="จาก 412 ทั้งหมด"
   trendType="neutral"
   icon=<UsersIcon />
```

#### Main Content Row (below cards)

```
Layout: grid grid-cols-[1fr_280px] gap-3
```

**Left — Recent Requests Table**

```
Component: <RecentRequestsTable />
Title: "คำขอ EWA ล่าสุด"
Action: <Button variant="ghost" size="sm">ดูทั้งหมด →</Button>
  → navigates to /hr/requests

Columns:
  ชื่อพนักงาน (avatar + name + ID)
  แผนก
  จำนวนเงิน (฿)
  วันที่ขอ
  สถานะ

Rows: 5 most recent requests
Row click: opens <RequestDetailDrawer id={request.id} />
Show skeleton: 5 rows while loading
```

**Right — Payroll Cycle Widget**

```
Component: <PayrollCycleWidget />
Title: "รอบปัจจุบัน"

Monthly progress:
  Label row: "รายเดือน · พ.ค. 2568"
  <ProgressBar value={18} max={31} color="primary" />
  Sub: "วันที่ 18 / 31"

Weekly progress:
  Label row: "รายสัปดาห์ · สัปดาห์ที่ 19"
  <ProgressBar value={4} max={5} color="primary" />
  Sub: "วันที่ 4 / 5"

Upcoming dates:
  วันตัดรอบ EWA (รายสัปดาห์): พรุ่งนี้ (amber badge)
  วันจ่ายเงิน (รายสัปดาห์): ศุกร์นี้
  วันตัดรอบ EWA (รายเดือน): 25 พ.ค.
  วันจ่ายเงิน (รายเดือน): 31 พ.ค.

Donut chart:
  Component: <StatusDonutChart />
  Title: "สถานะคำขอเดือนนี้"
  Data:
    อนุมัติ: 62 (60%)  color: --color-primary
    รออนุมัติ: 31 (30%) color: amber
    ปฏิเสธ: 10 (10%)  color: red
  Center label: total count "103"
  Legend: below chart
```

### Interactions

```
RecentRequestsTable row click  → open RequestDetailDrawer (HR-3)
"ดูทั้งหมด →" click           → navigate /hr/requests (HR-2)
NotificationBell click         → dropdown notification list (max 5 items)
UserChip click                 → dropdown (โปรไฟล์ / ออกจากระบบ)
Sidebar nav items              → navigate to respective routes
```

### States

```
Loading:
  MetricCards → 4× <MetricCardSkeleton />
  Table → 5× <TableRowSkeleton />
  Charts → <ChartSkeleton />

Empty (no requests today):
  Table → <EmptyState icon=<InboxIcon /> message="ยังไม่มีคำขอในวันนี้" />

Error:
  <Toast variant="error" message="ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่" />
```

---

## HR-2: EWA Request List

```
Route:    /hr/requests
Layout:   HRLayout (full main content width)
Viewport: 1440px desktop
Auth:     HR Manager / Accountant role
```

### Anatomy

#### Page Header

```
Title: "คำขอ EWA"
Breadcrumb: "หน้าหลัก / คำขอ EWA"
Right action: <Button variant="primary">+ ยื่นคำขอแทนพนักงาน</Button>
  → navigates to /hr/employees (HR-6)
```

#### Filter Bar

```
Component: <RequestFilterBar />
Layout: flex row, gap-2, align-center

Elements (left to right):
1. <SearchInput />
   placeholder="ค้นหาชื่อ รหัสพนักงาน..."
   width: 240px

2. <DepartmentSelect />
   options: ทั้งหมด | ผลิต A | ผลิต B | คลังสินค้า | QC | ซ่อมบำรุง
   width: 160px

3. <PayCycleSelect />
   options: ทั้งหมด | รายเดือน | รายสัปดาห์
   width: 140px

4. <DateRangePicker />
   placeholder: "เลือกช่วงวันที่"
   width: 200px

5. Spacer (flex-1)

6. Bulk action (show when rows selected):
   <Button variant="primary" size="sm">อนุมัติที่เลือก (N)</Button>
   <Button variant="danger-outline" size="sm">ปฏิเสธที่เลือก (N)</Button>

Status tabs (below filter bar):
  <TabBar tabs={["ทั้งหมด", "รออนุมัติ", "อนุมัติแล้ว", "ปฏิเสธ", "โอนแล้ว"]} />
  Show count badge on each tab
```

#### Data Table

```
Component: <RequestsDataTable />
Row count: 20 per page

Columns:
┌────┬──────────────────┬─────────┬────────────┬──────────────┬──────────────┬───────────┬────────────┬────────────┐
│ ☐  │ ชื่อ-รหัสพนักงาน │ แผนก    │ ประเภทจ่าย │ จำนวนที่ขอ  │ รายได้สะสม  │ วันที่ขอ  │ สถานะ     │ การดำเนินการ│
└────┴──────────────────┴─────────┴────────────┴──────────────┴──────────────┴───────────┴────────────┴────────────┘

Column specs:
  ☐              checkbox (select-all in header)
  ชื่อ-รหัส      <EmployeeCell /> — avatar + name (bold) + ID (muted, below)
  แผนก           string
  ประเภทจ่าย     <PayCycleBadge /> — รายเดือน / รายสัปดาห์
  จำนวนที่ขอ    "฿X,XXX" (font-number, bold)
  รายได้สะสม    "฿XX,XXX" (font-number, muted)
  % ของรายได้   "XX%" pill (color based on %)
  วันที่ขอ       "DD/MM/YY" (--color-text-muted)
  สถานะ         <StatusBadge />
  การดำเนินการ   [อนุมัติ] [ดูรายละเอียด] — show on hover or always

Sortable columns: ชื่อ, จำนวน, วันที่ขอ (click header to sort)
Row click: anywhere on row → open RequestDetailDrawer (HR-3)
```

#### Pagination

```
Component: <Pagination />
Position: bottom-right
Info: "แสดง 1–20 จาก 103 รายการ"
Controls: ← Previous [1] [2] [3] ... [6] Next →
```

### Interactions

```
Search input (debounce 300ms)       → filter table rows
Department/PayCycle select change   → filter table rows
Date range change                   → filter table rows
Tab click                           → filter by status
Checkbox (row)                      → select row, show bulk actions
Checkbox (header)                   → select/deselect all visible rows
Row click                           → open RequestDetailDrawer
"อนุมัติ" button click              → open ConfirmModal (approve)
"ดูรายละเอียด" click               → open RequestDetailDrawer
"อนุมัติที่เลือก" click            → open ConfirmModal (bulk approve)
"ปฏิเสธที่เลือก" click             → open ConfirmModal (bulk reject)
Column header click (sortable)      → toggle asc/desc sort
Pagination click                    → load next/prev page
```

### States

```
Loading:        10× <TableRowSkeleton />
Empty search:   <EmptyState message="ไม่พบคำขอที่ตรงกับเงื่อนไข" action="ล้างตัวกรอง" />
Empty tab:      <EmptyState message="ไม่มีคำขอในสถานะนี้" />
Bulk selecting: amber banner top "เลือกแล้ว N รายการ — [อนุมัติ] [ปฏิเสธ] [ยกเลิก]"
```

---

## HR-3: Request Detail Drawer

```
Route:     overlay on /hr/requests (no route change) or /hr/requests?drawer={id}
Component: <RequestDetailDrawer />
Type:      Slide-in from right, width 480px, full viewport height
Backdrop:  semi-transparent overlay (rgba 0,0,0,0.3) on main content
Auth:      HR Manager / Accountant role
```

### Anatomy

#### Drawer Header

```
Close button: × top-right (32px, --color-text-secondary)
Title: "รายละเอียดคำขอ EWA" (--text-section-title)
Reference: "EWA-20250501-041" (12px, --color-text-muted)

On-behalf banner (conditional — show if isOnBehalf = true):
  Background: amber-50
  Icon: <AlertTriangleIcon /> amber
  Text: "ยื่นโดย HR: สมศรี ใจดี"
```

#### Employee Profile Header

```
<Avatar size="lg" initials="สม" />
name: "สมชาย วงศ์ดี" (16px, weight 600)
ID: "EMP-0041" (12px, --color-text-muted)
Dept + Position: "ผลิต A · พนักงานสายการผลิต" (12px, --color-text-muted)
<PayCycleBadge type="monthly" /> right-aligned
```

#### Pay Period Progress

```
Component: <PayPeriodProgress payCycle={employee.payCycle} />

Monthly variant:
  Label: "รอบเดือน พ.ค. 2568"
  <ProgressBar value={18} max={31} />
  Sub: "ทำงาน 18 / 31 วัน"
  Right: "จ่ายเงิน 31 พ.ค."

Weekly variant:
  Label: "สัปดาห์ที่ 19 (5–9 พ.ค. 2568)"
  <ProgressBar value={4} max={5} />
  Sub: "ทำงาน 4 / 5 วัน"
  Right: "จ่ายเงิน ศุกร์นี้"
```

#### Financial Summary Card

```
Component: <FinancialSummaryCard />
Background: --color-bg-secondary
Border: 1px solid --color-border
Border-radius: --radius-lg
Padding: 16px

Rows:
  รายได้สะสม (โดยประมาณ):    ฿14,727    [right]
  เบิก EWA ไปแล้วรอบนี้:     ฿0         [right]
  เบิกได้สูงสุด (50%):        ฿7,363     [right]
  ─────────────────────────────────────
  จำนวนที่ขอ:                 ฿3,000     [right, teal, large, bold]
  ─────────────────────────────────────
  คงเหลือรับวันจ่ายเงิน:      ฿11,727    [right]

Label style: 13px, --color-text-secondary
Value style: 14px, --color-text-primary, font-number
Requested row: 16px, --color-primary, weight 700
```

#### Request Info

```
วันที่ขอ:    01/05/2568 · 09:32 น.
เหตุผล:     ค่ารักษาพยาบาล
หมายเหตุ:   "ลูกป่วยฉุกเฉิน ต้องการค่ายา"
            (shown in read-only textarea if exists)
บัญชีรับ:   ธ.กสิกรไทย xxx-x-x1234-x
```

#### Request History Timeline

```
Component: <RequestTimeline />
Title: "ประวัติการเบิก (3 เดือนล่าสุด)"
Max height: 200px, scrollable

Each entry:
  Dot (color = status color) + vertical line
  Date: "15 เม.ย. 2568"
  Amount: "฿2,000"
  Status: <StatusBadge />
  Approver: "อนุมัติโดย สมศรี HR" (if approved)
```

#### HR Internal Note

```
Label: "บันทึกภายในสำหรับ HR (ไม่แสดงต่อพนักงาน)"
<Textarea
  placeholder="เพิ่มบันทึก เหตุผล หรือข้อสังเกต..."
  rows={3}
/>
```

#### Action Buttons

```
Layout: grid grid-cols-2 gap-3, sticky bottom of drawer

Left:  <Button variant="danger-outline" fullWidth>ปฏิเสธ</Button>
Right: <Button variant="primary" fullWidth>อนุมัติ</Button>

Below: <Button variant="ghost" fullWidth size="sm">ขอข้อมูลเพิ่มเติม</Button>

Disabled state: both buttons disabled while submitting
Approved/Rejected state: show status badge instead of buttons
                         + "อนุมัติโดย [name] เมื่อ [datetime]"
```

### Interactions

```
Approve click    → <ConfirmModal title="ยืนยันการอนุมัติ"
                    message="อนุมัติคำขอ ฿3,000 ของ สมชาย วงศ์ดี ใช่หรือไม่?"
                    confirmLabel="ยืนยันอนุมัติ" variant="primary" />
                  → on confirm: PATCH request status, show success toast, close drawer

Reject click     → <ConfirmModal title="ยืนยันการปฏิเสธ"
                    message="กรุณาระบุเหตุผลในการปฏิเสธ"
                    hasReasonInput={true}
                    confirmLabel="ยืนยันปฏิเสธ" variant="danger" />
                  → on confirm: PATCH request status, show error-style toast, close drawer

Close (×) click  → close drawer, return focus to table
Backdrop click   → close drawer
ESC key          → close drawer
```

### States

```
Loading:   Skeleton layout (avatar circle, 4 skeleton lines, progress bar skeleton)
Submitted: Buttons replace with <StatusBadge /> + approver name + datetime
Error:     <Toast variant="error" message="เกิดข้อผิดพลาด กรุณาลองใหม่" />
```

---

## HR-4: Accountant Report

```
Route:    /hr/reports
Layout:   HRLayout (full main content)
Viewport: 1440px desktop
Auth:     Accountant / HR Manager role
```

### Anatomy

#### Page Header

```
Title: "รายงาน EWA"
Breadcrumb: "หน้าหลัก / รายงาน"
Right actions:
  <DateRangePicker /> presets: [เดือนนี้] [เดือนที่แล้ว] [กำหนดเอง]
  <Button variant="outline" icon=<DownloadIcon />>Export CSV</Button>
  <Button variant="outline" icon=<FileTextIcon />>Export PDF</Button>
```

#### View Toggle

```
Component: <ViewToggle />
Options: [รายเดือน] [รายสัปดาห์]
Position: top-right of content area
Affects: chart, metric cards sub-labels, table grouping
```

#### Metric Cards Row

```
5× <MetricCard /> grid-cols-5

1. ยอดเบิกจ่ายทั้งหมด:  ฿287,000
2. จำนวนคำขอ:           103 รายการ
3. เฉลี่ยต่อคำขอ:       ฿2,786
4. อัตราอนุมัติ:         60%
5. ค่าธรรมเนียม:         ฿1,545
```

#### Disbursement Chart

```
Component: <DisbursementBarChart />
Title: "ยอดเบิกจ่าย"

Monthly view:
  X-axis: วัน 1–31 (daily bars)
  Y-axis: ฿ amount
  30 bars, teal color
  Highlighted bar: today

Weekly view:
  X-axis: Week 1–52 (สัปดาห์ที่ 1–52)
  Current week highlighted

Hover tooltip:
  Date/Week label
  ยอดเบิกจ่าย: ฿X,XXX
  จำนวนคำขอ: N รายการ
```

#### Department Breakdown Table

```
Component: <DepartmentBreakdownTable />
Title: "แยกตามแผนก"

Columns:
  แผนก | พนักงาน EWA | จำนวนคำขอ | ยอดรวม (฿) | เฉลี่ยต่อคำขอ (฿)

Rows per department with totals row at bottom
Sortable by any column
```

#### Reconciliation Section

```
Component: <ReconciliationTable />
Title: "สถานะการโอนเงิน"

Columns:
  รอบที่ | วันที่โอน | จำนวนรายการ | ยอดรวม (฿) | ธนาคาร | สถานะ | การดำเนินการ

Status variants:
  กำลังดำเนินการ: amber badge
  โอนสำเร็จ:      green badge
  โอนไม่สำเร็จ:   red badge + <Button size="xs" variant="danger-outline">ลองใหม่</Button>

Failed rows: highlighted with red-50 background
```

### Interactions

```
Date range change     → reload all metrics + charts + tables
View toggle change    → switch chart + table grouping
Chart bar hover       → show tooltip
Column header click   → sort department table
"ลองใหม่" click       → retry failed bank transfer + optimistic status update
Export CSV click      → download ewa-report-{date}.csv
Export PDF click      → download ewa-report-{date}.pdf
```

### States

```
Loading:  Skeleton cards + chart placeholder + skeleton table
Empty:    <EmptyState message="ไม่มีข้อมูลในช่วงเวลาที่เลือก" />
Error:    <Toast variant="error" />
```

---

## HR-5: Settings

```
Route:    /hr/settings
Layout:   HRLayout (main content, no right panel)
Viewport: 1440px desktop
Auth:     HR Manager (admin) role only
```

### Anatomy

#### Page Header

```
Title: "ตั้งค่า"
Breadcrumb: "หน้าหลัก / ตั้งค่า"
```

#### Main Tabs

```
Component: <SettingsTabs />
Tabs: [ทั่วไป] [นโยบาย EWA] [การแจ้งเตือน] [จัดการผู้ใช้]
Default active: นโยบาย EWA
```

#### Tab: นโยบาย EWA

```
Sub-tabs: <PolicySubTabs tabs={["รายเดือน", "รายสัปดาห์"]} />

Section: "กฎการเบิกเงิน"
  % สูงสุดของรายได้:
    <Slider min={0} max={70} step={5} defaultValue={50} />
    Display: "50% ของรายได้สะสม"

  จำนวนครั้งสูงสุดต่อรอบ:
    <NumberInput min={1} max={5} defaultValue={2} suffix="ครั้ง/รอบ" />

  ยอดขั้นต่ำต่อคำขอ:
    <NumberInput prefix="฿" min={100} step={100} defaultValue={500} />

  ยอดสูงสุดต่อคำขอ:
    <NumberInput prefix="฿" defaultValue={10000} />

Section: "การอนุมัติ"
  อนุมัติอัตโนมัติ:
    <Toggle defaultChecked={true} />
    Conditional (show if toggle ON):
      <NumberInput label="อนุมัติอัตโนมัติถ้าน้อยกว่า" prefix="฿" defaultValue={3000} />

  ขั้นตอนการอนุมัติ:
    <RadioGroup options={["ผู้อนุมัติเดียว", "2 ขั้นตอน"]} defaultValue="ผู้อนุมัติเดียว" />

Section: "กฎรายสัปดาห์" (แสดงเฉพาะ sub-tab รายสัปดาห์)
  วันจ่ายเงิน:
    <Select options={["จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์"]} defaultValue="ศุกร์" />
  วันตัดรอบ EWA:
    <Select options={["จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์"]} defaultValue="พฤหัส" />
  เวลาตัดรอบ:
    <TimePicker defaultValue="18:00" />

Section: "วันที่ไม่อนุญาต EWA"
  <BlackoutDatePicker />
  Show selected dates as removable chips
  "+ เพิ่มวัน" button

Save button: <Button variant="primary">บันทึกการตั้งค่า</Button> (bottom-right, sticky)
```

#### Tab: การแจ้งเตือน

```
Section: "แจ้งเตือนสำหรับ HR"
  เมื่อมีคำขอใหม่:       [Email toggle] [LINE toggle]
  เมื่อคำขอรอนาน > 2 ชม: [Email toggle] [LINE toggle]

Section: "แจ้งเตือนสำหรับพนักงาน"
  เมื่อคำขออนุมัติ:    [LINE toggle] [SMS toggle]
  เมื่อคำขอถูกปฏิเสธ: [LINE toggle] [SMS toggle]
  วันจ่ายเงินเดือน:    [LINE toggle] [SMS toggle]

Section: "LINE Integration"
  LINE Notify Token: <Input type="password" placeholder="ใส่ token..." />
  <Button variant="outline" size="sm">ทดสอบการเชื่อมต่อ</Button>
  Status: <Badge variant="success">เชื่อมต่อแล้ว</Badge>
```

#### Tab: จัดการผู้ใช้

```
Table: HR Users
Columns: ชื่อ | อีเมล | บทบาท | สถานะ | การดำเนินการ
Roles: HR Manager / Accountant / Viewer

Actions per row: [แก้ไขบทบาท] [ระงับ]
Top-right: <Button variant="primary">+ เพิ่มผู้ใช้ HR</Button>
```

### Interactions

```
Tab click            → switch tab content (no page reload)
Sub-tab click        → switch policy content (monthly/weekly)
Slider drag          → update % display in real-time
Toggle change        → show/hide dependent fields
Blackout date add    → append chip, update calendar display
Blackout chip × click → remove date
"บันทึก" click       → validate → save → <Toast variant="success" message="บันทึกแล้ว" />
LINE test click      → POST to LINE test → show success/fail toast
```

### States

```
Loading:   Skeleton form fields
Saving:    Button loading spinner, fields disabled
Saved:     <Toast variant="success" message="บันทึกการตั้งค่าแล้ว" />
Error:     <Toast variant="error" message="ไม่สามารถบันทึกได้" />
Unsaved:   Show "มีการเปลี่ยนแปลงที่ยังไม่บันทึก" amber banner
```

---

## HR-6: Employee List (for EWA)

```
Route:    /hr/employees
Layout:   HRLayout (full main content)
Viewport: 1440px desktop
Auth:     HR Manager role
```

### Anatomy

#### Page Header

```
Title: "พนักงาน"
Breadcrumb: "หน้าหลัก / พนักงาน"
Sub-title: "348 คน ลงทะเบียน EWA · 64 คน ไม่ได้ลงทะเบียน"
```

#### Filter Bar

```
<SearchInput placeholder="ค้นหาชื่อ หรือรหัสพนักงาน..." width="280px" />
<DepartmentSelect />
<PayCycleSelect />
<EWAStatusSelect options={["ทั้งหมด","มีสิทธิ์","ใช้ครบแล้ว","ถูกระงับ"]} />
```

#### Employee Data Table

```
Component: <EmployeeDataTable />

Columns:
┌──────────────────┬─────────┬────────────┬──────────────┬──────────────┬────────────┬───────────┬────────────┐
│ ชื่อ-รหัสพนักงาน  │ แผนก    │ ประเภทจ่าย │ เบิกได้สูงสุด │ เบิกไปแล้ว  │ ครั้งที่เหลือ│ สถานะ EWA │ การดำเนินการ │
└──────────────────┴─────────┴────────────┴──────────────┴──────────────┴────────────┴───────────┴────────────┘

EWA Status badge variants:
  มีสิทธิ์     → green
  ใช้ครบแล้ว  → gray
  ถูกระงับ    → red

"ครั้งที่เหลือ" column:
  Show as: "1 / 2" with mini progress dots

Action column:
  <Button variant="outline" size="sm"
          disabled={employee.ewaStatus !== 'eligible'}>
    ยื่นคำขอแทน
  </Button>
  Tooltip if disabled: "พนักงานไม่มีสิทธิ์เบิกในขณะนี้"
```

#### Pagination

```
Same as HR-2 — 20 rows/page
```

### Interactions

```
Search / filter change                    → filter table (debounce 300ms)
"ยื่นคำขอแทน" click (eligible employee)  → navigate /hr/employees/{id}/request (HR-7)
"ยื่นคำขอแทน" click (ineligible)         → show tooltip, no action
Row click (anywhere else)                 → show employee detail side panel (future)
```

### States

```
Loading:  10× <TableRowSkeleton />
Empty:    <EmptyState message="ไม่พบพนักงานที่ตรงกับเงื่อนไข" />
```

---

## HR-7: HR Request Form (On Behalf of Employee)

```
Route:    /hr/employees/[id]/request
Layout:   HRLayout (centered form, max-width 640px)
Viewport: 1440px desktop
Auth:     HR Manager role
```

### Anatomy

#### On-Behalf Banner

```
Component: <OnBehalfBanner />
Background: amber-50
Border: 1px solid amber-200
Border-radius: --radius-md
Padding: 12px 16px
Icon: <AlertTriangleIcon color="amber" />
Text: "HR กำลังยื่นคำขอแทนพนักงาน — รายการนี้จะบันทึกชื่อ HR ใน Audit Log"
```

#### Employee Summary Card (Read-only)

```
Component: <EmployeeSummaryCard />
<Avatar size="md" initials="สม" />
name: "สมชาย วงศ์ดี"
ID + Dept: "EMP-0041 · ผลิต A"
<PayCycleBadge />

Available balance card (teal bg):
  Label: "เบิกได้สูงสุดวันนี้"
  Value: "฿3,500" (large, white text)
  Sub: "50% ของ ฿7,000 รายได้สะสม"
```

#### Request Form

```
Section: "จำนวนเงินที่ขอเบิก"

Quick amount buttons:
  <QuickAmountButton amount={1000} max={3500} />
  <QuickAmountButton amount={2000} max={3500} />
  <QuickAmountButton amount={3000} max={3500} />

Custom amount:
  Label: "หรือระบุจำนวนเอง"
  <NumberInput prefix="฿" min={500} max={3500} step={100} />
  Real-time validation: "เกินวงเงินที่เบิกได้" (red)
  Real-time remaining: "คงเหลือ: ฿500" (muted, below input)

Section: "เหตุผลของพนักงาน"
  <ChipSelect options={[
    "ค่าใช้จ่ายฉุกเฉิน",
    "ค่ารักษาพยาบาล",
    "ค่าเล่าเรียนบุตร",
    "ค่าใช้จ่ายในบ้าน",
    "อื่นๆ"
  ]} />

Section: "เหตุผลที่ HR ยื่นแทน (จำเป็น)"
  <Textarea
    label="เหตุผลที่ HR ยื่นคำขอแทนพนักงาน"
    placeholder="เช่น พนักงานไม่มีโทรศัพท์ / ขอด้วยวาจา / อื่นๆ"
    required
    rows={3}
  />
```

#### Bank Account Confirmation

```
Component: <BankAccountDisplay />
Background: --color-bg-secondary
Content:
  Icon: <BuildingIcon />
  "โอนเงินเข้า: ธ.กสิกรไทย · xxx-x-x1234-x"
  Note: "แจ้ง HR ฝ่ายบุคคลหากต้องการเปลี่ยนบัญชี"
```

#### Action Buttons

```
<Button variant="primary" fullWidth size="lg">
  ยืนยันและส่งคำขอ (ไม่ต้องใช้ PIN พนักงาน)
</Button>
<Button variant="ghost" fullWidth>← ยกเลิก กลับรายชื่อพนักงาน</Button>
```

#### Success State (replaces form)

```
Component: <SuccessScreen />
Icon: <CheckCircleIcon color="teal" size={64} /> with pulse animation
Title: "ส่งคำขอสำเร็จ"
Sub: "HR จะตรวจสอบและดำเนินการอนุมัติต่อไป"

Reference card:
  เลขอ้างอิง: EWA-20250501-041
  จำนวน: ฿3,000
  พนักงาน: สมชาย วงศ์ดี
  ยื่นโดย HR: สมศรี ใจดี
  Audit Log #: 5821

Buttons:
  <Button variant="primary">กลับรายชื่อพนักงาน</Button>
  <Button variant="outline">ยื่นคำขอสำหรับพนักงานคนอื่น</Button>
```

### Interactions

```
Quick amount button click  → select amount, fill custom input
Custom input change        → deselect quick buttons, validate in real-time
Employee reason chip click → toggle select (single select)
HR reason textarea         → required, validate on submit
"ยืนยัน" click             → validate all fields → submit → show success state
"ยกเลิก" click             → navigate back to /hr/employees
```

### States

```
Form invalid:   Submit button disabled, red validation messages
Submitting:     Button spinner, form disabled
Success:        Replace form with <SuccessScreen />
Error:          <Toast variant="error" message="เกิดข้อผิดพลาด กรุณาลองใหม่" />
Employee ineligible: Show warning banner, disable amount inputs
```

---

---

# EMPLOYEE SIDE — Mobile (390px)

---

## E-1: Employee Login

```
Route:    /employee/login
Layout:   Full screen centered (no sidebar)
Viewport: 390px mobile
Auth:     Public (pre-auth)
```

### Anatomy

#### Background

```
Full-screen soft teal background (#E8F5F0)
Subtle geometric pattern overlay (opacity 0.05)
```

#### Logo Area

```
<AppLogo /> centered, top 20% of screen
App name: "PayDay+" (24px, weight 700, --color-primary)
Tagline: "เบิกเงินเดือนล่วงหน้า ง่าย รวดเร็ว" (13px, --color-text-muted)
```

#### Login Card

```
Background: white
Border-radius: --radius-xl
Padding: 24px
Shadow: --shadow-modal
Margin: 0 20px

Method 1 — Employee ID + PIN (default visible):
  Label: "รหัสพนักงาน"
  <Input
    type="text"
    inputMode="numeric"
    placeholder="กรอกรหัสพนักงาน เช่น EMP-0041"
    size="lg"
    autoFocus
  />

  Label: "PIN 4 หลัก"
  <PINPad length={4} onComplete={handlePINComplete} />
  (4 dot inputs, numeric pad below)

  <Button variant="primary" fullWidth size="xl">
    เข้าสู่ระบบ
  </Button>

  "ลืม PIN?" link → show instruction modal
  "ติดต่อ HR ชั้น 1 โทร. 02-xxx-xxxx"

Method 2 — QR Code button:
  <Button variant="outline" fullWidth icon=<QrCodeIcon />>
    สแกน QR บัตรพนักงาน (สำหรับ Kiosk)
  </Button>
```

#### Language Toggle

```
Position: top-right corner
<LanguageToggle options={["TH","EN","MM"]} />
```

#### Lock State

```
Show after 5 wrong PINs:
  Red banner: "บัญชีถูกล็อก — กรุณาลองใหม่ใน 30 นาที"
  Countdown timer: "29:45"
  Disable all inputs and buttons
```

### Interactions

```
Employee ID input enter  → focus PIN pad
PIN pad 4th digit filled → auto-submit
"เข้าสู่ระบบ" click      → validate → navigate /employee/home
Wrong PIN (< 5 times)    → shake animation, "PIN ไม่ถูกต้อง เหลือ N ครั้ง"
Wrong PIN (5th time)     → lock account 30 min, show countdown
QR scan click            → open camera scanner
Language toggle          → switch all UI language
```

### States

```
Default:   Clean empty form
Loading:   Button spinner "กำลังเข้าสู่ระบบ..."
Error:     Shake PIN dots + red error message
Locked:    Red banner + countdown + disabled form
```

---

## E-2: Employee Home

```
Route:    /employee/home
Layout:   MobileLayout (top bar + scrollable content + BottomTabBar)
Viewport: 390px mobile
Auth:     Employee session required
```

### Anatomy

#### Top Bar

```
Left:  "สวัสดี, สมชาย 👋" (18px, weight 600)
       "วันจันทร์ที่ 5 พ.ค. 2568" (12px, --color-text-muted)
Right: <Avatar size="sm" initials="สม" /> with tap → profile
       <NotificationBell unread={2} />
```

#### Hero Balance Card

```
Component: <BalanceHeroCard />
Background: linear-gradient(135deg, #2DBD8F, #1E9E74)
Border-radius: --radius-xl
Padding: 20px
Margin: 0 16px
Shadow: --shadow-hover

Content:
  Label: "เบิกได้วันนี้" (13px, rgba(255,255,255,0.8))
  Value: "฿3,500" (36px, weight 700, white)

  Divider line

  Grid 2×2 small stats:
    รายได้สะสม   ฿9,200  |  เบิกสูงสุด 50%  ฿4,600
    เบิกไปแล้ว  ฿1,100  |  คงเหลือเบิกได้  ฿3,500

  <Button variant="white" fullWidth size="lg" mt={16}>
    💰 ยื่นคำขอเบิกเงิน
  </Button>
  (white bg, --color-primary text)
```

#### Pay Period Progress

```
Component: <PayPeriodWidget />
Background: white card
Margin: 16px
Padding: 16px

Label: "รอบเงินเดือน พ.ค. 2568"
<ProgressBar value={18} max={31} color="primary" height="8px" />
Sub row:
  Left: "วันที่ 18 / 31"
  Right: "จ่ายเงิน 31 พ.ค." (--color-primary)

Warning chip (if cutoff within 3 days):
  Background: amber-50
  Icon: <AlertIcon /> amber
  Text: "ตัดรอบ EWA: 25 พ.ค. (อีก 7 วัน)"
```

#### Recent Requests Section

```
Title row:
  "คำขอล่าสุด" (14px, weight 600)
  "ดูทั้งหมด →" (12px, --color-primary) → navigate /employee/history

List: last 3 requests as cards
Each card:
  Left: Date (day number large teal, month small muted)
  Middle: "คำขอ EWA" + ref number (muted)
  Right: Amount (bold) + <StatusBadge />

Empty (no requests yet):
  "ยังไม่เคยยื่นคำขอ" + "เริ่มยื่นคำขอแรกได้เลย" link
```

#### Bottom Tab Bar

```
Component: <BottomTabBar />
Position: fixed bottom 0, full width
Background: white
Border-top: 1px solid --color-border
Height: 60px (+ safe-area-inset-bottom)

Tabs:
  🏠  หน้าหลัก   /employee/home
  💰  ยื่นคำขอ  /employee/request
  📋  ประวัติ    /employee/history
  👤  โปรไฟล์   /employee/profile

Active: --color-primary icon + label
Inactive: --color-text-muted icon + label
```

### Interactions

```
Hero CTA button click    → navigate /employee/request
"ดูทั้งหมด →" click     → navigate /employee/history
Request card tap        → navigate /employee/history (expand that item)
Avatar tap              → navigate /employee/profile
NotificationBell tap    → bottom sheet notification list
Bottom tab tap          → navigate to tab route
```

### States

```
Loading:        Skeleton hero card + skeleton list items
Cutoff passed:  Hero CTA disabled, "หมดเขตยื่นคำขอรอบนี้" message
Quota used:     Hero CTA disabled, "ใช้สิทธิ์ครบแล้วรอบนี้"
Suspended:      Red banner "EWA ถูกระงับ กรุณาติดต่อ HR"
Offline:        Yellow banner "ไม่มีการเชื่อมต่ออินเทอร์เน็ต"
```

---

## E-3: New EWA Request Form

```
Route:    /employee/request
Layout:   MobileLayout (top bar + full scroll content + BottomTabBar)
Viewport: 390px mobile
Auth:     Employee session required
Guard:    Redirect to /employee/home if not eligible
```

### Anatomy

#### Step Indicator

```
Component: <StepIndicator currentStep={step} totalSteps={3}
           labels={["เลือกจำนวน","ยืนยัน","เสร็จสิ้น"]} />
Position: below top bar, full width
Style:
  Active step: teal circle + teal label
  Completed step: teal check icon
  Future step: gray circle + gray label
  Connector line between steps
```

---

#### Step 1: เลือกจำนวนเงิน

```
Available Balance (read-only card):
  Background: --color-primary-bg
  Label: "เบิกได้สูงสุดวันนี้"
  Value: "฿3,500" (24px, weight 700, --color-primary)

Quick Amount Buttons:
  Label: "เลือกจำนวนด่วน"
  Layout: grid-cols-3, gap-8px

  <QuickAmountButton amount={1000} max={3500} />
  <QuickAmountButton amount={2000} max={3500} />
  <QuickAmountButton amount={3000} max={3500} />

  Button style (unselected): white bg, --color-primary border, --color-primary text
  Button style (selected): --color-primary bg, white text
  Button style (disabled — over max): gray bg, gray text, not clickable

Custom Amount Input:
  Label: "หรือพิมพ์จำนวนเอง"
  <Input
    type="number"
    inputMode="numeric"
    prefix="฿"
    placeholder="0"
    size="lg"
  />
  Helper (valid): "คงเหลือเบิกได้: ฿500" (muted, below)
  Helper (invalid): "เกินวงเงิน กรุณาใส่ไม่เกิน ฿3,500" (red, below)

Reason Chips:
  Label: "เหตุผล (ไม่บังคับ)"
  Chips (tap to select, single select):
    [ค่าใช้จ่ายฉุกเฉิน]
    [ค่ารักษาพยาบาล]
    [ค่าเล่าเรียนบุตร]
    [ค่าใช้จ่ายในบ้าน]
    [อื่นๆ]

Next Button:
  <Button variant="primary" fullWidth size="xl"
          disabled={!isAmountValid}>
    ถัดไป →
  </Button>
```

---

#### Step 2: ยืนยันรายการ

```
Summary Card:
  Background: white
  Border: 1px solid --color-border
  Border-radius: --radius-lg

  Header: "📋 สรุปคำขอเบิก EWA"
  Divider

  Rows:
    ชื่อพนักงาน:  สมชาย วงศ์ดี
    รหัสพนักงาน: EMP-0041
    จำนวนที่ขอ:  ฿3,000  (--color-primary, bold)
    เหตุผล:       ค่ารักษาพยาบาล
    บัญชีรับเงิน: ธ.กสิกร xxx-x-x1234-x
    ประมาณวันโอน: ภายใน 1 วันทำการ

Warning Banner:
  Background: amber-50
  Border-left: 3px solid amber
  Icon: ⚠️
  Text: "จำนวน ฿3,000 จะถูกหักออกจากเงินเดือนวันที่ 31 พ.ค. 2568"

PIN Confirmation:
  Label: "ยืนยันตัวตนด้วย PIN 4 หลัก"
  <PINPad length={4} onComplete={handlePINComplete} error={pinError} />

Buttons:
  <Button variant="primary" fullWidth size="xl"
          disabled={!isPINComplete}>
    ยืนยันการขอเบิก
  </Button>
  <Button variant="ghost" fullWidth>← แก้ไข</Button>
```

---

#### Step 3: สำเร็จ

```
Component: <SuccessScreen />
Layout: centered, full screen (no scrolling)

Animation: <CheckCircleAnimation />
  Teal circle draws in → white checkmark appears (600ms total)

Title: "ส่งคำขอสำเร็จ! 🎉" (20px, weight 700)
Sub: "HR จะตรวจสอบและแจ้งผลภายใน 2 ชั่วโมง" (14px, muted, centered)

Reference Card:
  Background: --color-primary-bg
  Border-radius: --radius-lg

  เลขที่อ้างอิง: EWA-20250501-041 (monospace, bold)
  จำนวน:         ฿3,000
  สถานะ:         <StatusBadge status="pending" />
  วันที่:         01/05/2568 · 09:32 น.

Buttons:
  <Button variant="primary" fullWidth>กลับหน้าหลัก</Button>
  <Button variant="outline" fullWidth icon=<ShareIcon />>แชร์ใบรับคำขอ</Button>
```

### Interactions

```
Quick amount tap      → select amount, fill input field
Custom input change   → deselect quick buttons, validate live
Reason chip tap       → toggle select
"ถัดไป" click         → validate amount → advance to Step 2
"แก้ไข" click         → back to Step 1 (keep values)
PIN 4th digit         → auto-enable confirm button
"ยืนยัน" click        → validate PIN → submit → Step 3
"กลับหน้าหลัก" click  → navigate /employee/home
"แชร์" click          → Web Share API with receipt data
```

### States

```
Step 1 — amount invalid:     "ถัดไป" button disabled
Step 1 — quota used:         redirect to home with toast
Step 2 — wrong PIN:          shake + "PIN ไม่ถูกต้อง" + clear dots
Step 2 — submitting:         button spinner, inputs disabled
Step 3 — (terminal state):   no back navigation
Offline:                     toast "ไม่มีอินเทอร์เน็ต ไม่สามารถส่งได้"
```

---

## E-4: Request History

```
Route:    /employee/history
Layout:   MobileLayout
Viewport: 390px mobile
Auth:     Employee session required
```

### Anatomy

#### Summary Strip

```
Component: <HistorySummaryStrip />
Layout: horizontal scroll row, no-scrollbar
Cards (3):

  1. รอบนี้
     ฿3,000 · 1 รายการ

  2. เดือนที่แล้ว
     ฿5,500 · 2 รายการ

  3. รวมทั้งหมด
     ฿24,000 · 9 รายการ

Each card: white bg, bordered, --radius-lg, padding 12px, min-width 120px
```

#### Status Tab Filter

```
<TabBar tabs={["ทั้งหมด","รออนุมัติ","อนุมัติแล้ว","โอนแล้ว","ปฏิเสธ"]} />
Scroll horizontally if overflow
```

#### Request Card List

```
Component: <RequestCardList />
Layout: vertical stack, gap-8px, padding 16px

Each Card:
  Background: white
  Border: 1px solid --color-border
  Border-radius: --radius-lg
  Padding: 14px 16px

  Layout: flex row
    Left:   Date column
              Day: "01" (20px, weight 700, --color-primary)
              Month: "พ.ค." (11px, --color-text-muted)

    Middle: Content column
              "คำขอ EWA" (14px, weight 500)
              Ref: "EWA-20250501-041" (11px, --color-text-muted, monospace)
              Reason: "ค่ารักษาพยาบาล" (12px, --color-text-muted)

    Right:  Amount + status
              "฿3,000" (16px, weight 700, font-number)
              <StatusBadge />

  Tap: expand/collapse accordion

Accordion (expanded):
  Background: --color-bg-secondary
  Border-top: 1px solid --color-border-light

  Detail rows:
    วันที่ขอ:        01/05/2568 · 09:32 น.
    วันที่อนุมัติ:   01/05/2568 · 11:15 น.
    อนุมัติโดย:     สมศรี ใจดี (HR)
    วันที่โอน:       02/05/2568
    บัญชีที่รับ:     ธ.กสิกร xxx1234
    หมายเหตุ HR:    (if any)
```

#### Empty State

```
<EmptyState
  icon=<ClipboardListIcon />
  message="ยังไม่มีประวัติการเบิก EWA"
  sub="เริ่มยื่นคำขอแรกได้เลย"
  action=<Button variant="primary">ยื่นคำขอเลย</Button>
/>
```

### Interactions

```
Tab tap          → filter list by status
Card tap         → expand accordion (collapse others)
Scroll down      → load more (infinite scroll, 10 at a time)
```

### States

```
Loading:     3× <CardSkeleton />
Empty:       <EmptyState />
Empty tab:   "ไม่มีคำขอในสถานะนี้"
```

---

## E-5: Employee Profile

```
Route:    /employee/profile
Layout:   MobileLayout
Viewport: 390px mobile
Auth:     Employee session required
```

### Anatomy

#### Profile Header

```
Background: --color-primary-bg
Padding: 24px 16px
Center-aligned

<Avatar size="xl" initials="สม" /> (64px)
name: "สมชาย วงศ์ดี" (20px, weight 700)
EmpID + Dept: "EMP-0041 · ผลิต A" (13px, --color-text-muted)
<PayCycleBadge type="monthly" />
```

#### Info Cards

```
Section 1: บัญชีรับเงิน
  Icon: <CreditCardIcon />
  Bank: "ธนาคารกสิกรไทย"
  Account: "xxx-x-x1234-x" (monospace)
  Note: "ติดต่อ HR เพื่อเปลี่ยนแปลงบัญชี" (muted, 11px)

Section 2: วงเงิน EWA ของฉัน
  Max %: "เบิกได้สูงสุด 50% ของรายได้"
  Quota: "ใช้ไปแล้ว 1 / 2 ครั้งรอบนี้"
  <ProgressBar value={1} max={2} color="primary" />
  Remaining: "เหลือสิทธิ์ 1 ครั้ง" (--color-primary)

Section 3: การแจ้งเตือน
  Row: "แจ้งเตือนเมื่ออนุมัติ"
    <Toggle defaultChecked={true} />
  Row: "แจ้งเตือนวันจ่ายเงินเดือน"
    <Toggle defaultChecked={true} />
  Row: "แจ้งเตือนผ่าน LINE"
    <Toggle defaultChecked={true} />

Section 4: ภาษา
  <Select options={["ภาษาไทย","English","ဘာသာမြန်မာ"]} />
```

#### Sign Out

```
<Button variant="ghost" fullWidth color="danger">
  ออกจากระบบ
</Button>
(red text, no background)
Tap → <ConfirmModal message="ต้องการออกจากระบบใช่หรือไม่?" />
     → on confirm: clear session, navigate /employee/login
```

### Interactions

```
Toggle change          → save preference immediately, show micro toast
Language change        → switch UI language, reload page
"ออกจากระบบ" tap      → show confirm modal → clear session → login
```

### States

```
Loading:   Skeleton avatar + skeleton cards
Saved:     Brief toast "บันทึกแล้ว" (1.5s, auto-dismiss)
```

---

## Shared Navigation Rules

```
HR Side:
  Sidebar active item = current route
  Topbar breadcrumb = reflects current route

Employee Side:
  Bottom tab active = current route
  Back button: show on all non-tab pages (← in top-left)
  Tab badge: show pending count on "ยื่นคำขอ" if has pending request

Auth Guards:
  /hr/* routes  → redirect to /hr/login if no HR session
  /employee/*   → redirect to /employee/login if no employee session
  /hr/login     → redirect to /hr/dashboard if already authenticated
  /employee/login → redirect to /employee/home if already authenticated
```

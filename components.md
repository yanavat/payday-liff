# Component Inventory — PayDay+ EWA System
> Version 1.0 · May 2025  
> Stack: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + Lucide React

---

## Structure

```
src/components/
├── ui/               Shared/primitive components (both HR + Employee)
├── hr/               HR-specific composite components
├── employee/         Employee-specific composite components
└── layouts/          Layout shell components
```

---

## Component Spec Format

Each component documents:
- **File path** and import
- **Props** with types and defaults
- **Variants** / states
- **Usage** — which screens use it
- **Notes** — Thai font, accessibility, behavior rules

---

---

# UI — Shared Primitive Components

---

## Avatar

```
File: src/components/ui/avatar.tsx
Import: import { Avatar } from '@/components/ui/avatar'

Props:
  Name         Type                          Default   Description
  ──────────────────────────────────────────────────────────────
  initials     string                        required  1–2 chars, shown if no src
  src          string?                       —         photo URL
  size         'xs'|'sm'|'md'|'lg'|'xl'     'md'      controls px size
  color        'teal'|'navy'|'amber'|'auto'  'auto'    bg color when no photo
                                                        auto = hash from initials

Size map:
  xs:  24px  — inline/table compact
  sm:  28px  — table rows
  md:  32px  — topbar, card headers
  lg:  40px  — drawer headers
  xl:  64px  — profile page

Style:
  Shape: circle (border-radius: 9999px)
  Photo: object-fit: cover
  Initials: font-family var(--font-thai), uppercase, weight 600
            font-size = 38% of avatar size

Used in: HR-1, HR-2, HR-3, HR-6, E-2, E-5
```

---

## StatusBadge

```
File: src/components/ui/status-badge.tsx
Import: import { StatusBadge } from '@/components/ui/status-badge'

Props:
  Name    Type                                           Default   Description
  ────────────────────────────────────────────────────────────────────────────
  status  'pending'|'approved'|'rejected'|'disbursed'   required
  size    'sm'|'md'                                      'md'

Style map:
  pending:   bg amber-100  · text amber-800  · "รออนุมัติ"
  approved:  bg green-100  · text green-800  · "อนุมัติแล้ว"
  rejected:  bg red-100    · text red-800    · "ไม่อนุมัติ"
  disbursed: bg teal-100   · text teal-800   · "โอนแล้ว"

Base style:
  padding: 2px 8px
  border-radius: var(--radius-full)
  font-size: 11px (badge scale — exception to Thai 14px min)
  font-weight: 500

Animation:
  pending status only: pulse animation 2s infinite
    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.6 } }

Used in: HR-1, HR-2, HR-3, HR-4, E-2, E-4
```

---

## PayCycleBadge

```
File: src/components/ui/pay-cycle-badge.tsx
Import: import { PayCycleBadge } from '@/components/ui/pay-cycle-badge'

Props:
  Name   Type                  Default   Description
  ──────────────────────────────────────────────────
  type   'monthly'|'weekly'    required

Style map:
  monthly: bg blue-50  · border blue-200 · text blue-700 · "รายเดือน"
  weekly:  bg violet-50 · border violet-200 · text violet-700 · "รายสัปดาห์"

Base style:
  padding: 2px 8px
  border: 1px solid
  border-radius: var(--radius-full)
  font-size: 11px, weight 500

Used in: HR-2, HR-3, HR-6, HR-7, E-2, E-5
```

---

## EWAStatusBadge (Employee eligibility)

```
File: src/components/ui/ewa-status-badge.tsx
Import: import { EWAStatusBadge } from '@/components/ui/ewa-status-badge'

Props:
  Name    Type                               Default
  ──────────────────────────────────────────────────
  status  'eligible'|'quota_used'|'suspended'  required

Style map:
  eligible:    bg green-100 · text green-800 · "มีสิทธิ์"
  quota_used:  bg gray-100  · text gray-600  · "ใช้ครบแล้ว"
  suspended:   bg red-100   · text red-800   · "ถูกระงับ"

Used in: HR-6
```

---

## TrendBadge

```
File: src/components/ui/trend-badge.tsx
Import: import { TrendBadge } from '@/components/ui/trend-badge'

Props:
  Name       Type                         Default   Description
  ───────────────────────────────────────────────────────────────
  value      number                       required  e.g. 8.2 or -3
  label      string?                      —         "จากเมื่อวาน"
  showArrow  boolean                      true

Style:
  Positive (value > 0): bg green-100 · text green-700 · "↑ +8.2%"
  Negative (value < 0): bg red-100   · text red-700   · "↓ -3%"
  Neutral  (value = 0): bg gray-100  · text gray-600  · "— 0%"

Used in: HR-1 MetricCard
```

---

## MetricCard

```
File: src/components/ui/metric-card.tsx
Import: import { MetricCard } from '@/components/ui/metric-card'

Props:
  Name        Type                          Default     Description
  ──────────────────────────────────────────────────────────────────────
  label       string                        required    "คำขอรออนุมัติ"
  value       string                        required    "12" or "฿287K"
  sub         string?                       —           secondary info
  trend       number?                       —           shows TrendBadge
  trendLabel  string?                       —           "จากเมื่อวาน"
  trendType   'positive'|'warning'|'info'|'neutral'  'neutral'
  icon        React.ReactNode?             —           Lucide icon
  variant     'default'|'hero'             'default'

Variant styles:
  default:
    background: white
    border: 1px solid var(--color-border)
    border-radius: var(--radius-lg)
    padding: 16px 20px

  hero:
    background: var(--color-primary-bg)
    border: none
    border-radius: var(--radius-xl)
    padding: 20px 24px
    watermark icon: 80px, opacity 0.08, bottom-right absolute

Typography:
  label: 12px, weight 500, --color-text-muted (Thai: 13px)
  value: 28px, weight 700, --color-text-primary, font-number
  sub:   12px, weight 400, --color-text-muted (Thai: 13px)

Icon:
  Wrapper: 36px × 36px, background --color-primary, border-radius --radius-md
  Icon: 18px, color white

Used in: HR-1, HR-4
```

---

## ProgressBar

```
File: src/components/ui/progress-bar.tsx
Import: import { ProgressBar } from '@/components/ui/progress-bar'

Props:
  Name     Type                   Default    Description
  ──────────────────────────────────────────────────────────
  value    number                 required   current value
  max      number                 required   max value
  color    'primary'|'amber'|'red'  'primary'
  height   '4px'|'6px'|'8px'|'10px'  '6px'
  showLabel  boolean              false      shows "X / Y" label
  label    string?                —          override label text
  animated  boolean               true       width transition 400ms

Fill color map:
  primary: var(--color-primary)    #2DBD8F
  amber:   #F59E0B
  red:     #EF4444

Track: background var(--color-border), border-radius var(--radius-full)
Fill:  border-radius var(--radius-full), transition width 400ms ease

Used in: HR-1, HR-3, HR-6, HR-7, E-2, E-3, E-5
```

---

## Button

```
File: src/components/ui/button.tsx
Import: import { Button } from '@/components/ui/button'
(extends shadcn/ui Button)

Props:
  Name       Type                                                     Default
  ─────────────────────────────────────────────────────────────────────────────
  variant    'primary'|'outline'|'ghost'|'danger'|'danger-outline'|'white'  'primary'
  size       'xs'|'sm'|'md'|'lg'|'xl'                                'md'
  fullWidth  boolean                                                  false
  loading    boolean                                                  false  (shows spinner)
  icon       React.ReactNode?                                         —      left icon
  iconRight  React.ReactNode?                                         —      right icon
  disabled   boolean                                                  false

Variant styles:
  primary:        bg --color-primary, text white
                  hover: bg --color-primary-dark
                  disabled: opacity 0.5

  outline:        bg white, border 1px --color-border, text --color-text-primary
                  hover: bg --color-bg-secondary

  ghost:          bg transparent, text --color-text-secondary
                  hover: bg --color-bg-secondary

  danger:         bg red-600, text white
                  hover: bg red-700

  danger-outline: bg white, border 1px red-300, text red-700
                  hover: bg red-50

  white:          bg white, text --color-primary, shadow --shadow-card
                  (used on colored backgrounds)

Size map:
  xs:  height 28px, padding 0 8px,  font 11px
  sm:  height 32px, padding 0 12px, font 12px
  md:  height 36px, padding 0 16px, font 13px  (Thai: 14px)
  lg:  height 44px, padding 0 20px, font 14px  (Thai: 15px)
  xl:  height 52px, padding 0 24px, font 16px  (Thai: 16px)

All variants:
  border-radius: var(--radius-md)
  font-weight: 500
  font-family: var(--font-body)
  transition: all 150ms ease
  hover: transform scale(1.01)

Loading state:
  Shows <Spinner /> left of label text
  Cursor: not-allowed, pointer-events: none

Used in: All screens
```

---

## Input

```
File: src/components/ui/input.tsx
Import: import { Input } from '@/components/ui/input'

Props:
  Name         Type              Default   Description
  ──────────────────────────────────────────────────────────────
  label        string?           —
  placeholder  string?           —
  prefix       string?           —         "฿" shown inside left
  suffix       string?           —         "ครั้ง" shown inside right
  size         'md'|'lg'         'md'
  error        string?           —         red border + error message below
  helper       string?           —         muted text below input
  disabled     boolean           false
  type         HTMLInputTypeAttribute  'text'
  inputMode    string?           —         'numeric' for number inputs

Size map:
  md: height 36px, font 13px  (Thai: 14px)
  lg: height 48px, font 16px  (Thai: 16px — for employee mobile)

Style:
  background: var(--color-bg-secondary)
  border: 1px solid var(--color-border)
  border-radius: var(--radius-md)
  padding: 0 12px
  focus: border-color var(--color-primary), outline none, ring 2px primary/20

  Error state:
    border-color: red-500
    helper text color: red-600

  Disabled:
    opacity: 0.5, cursor: not-allowed

Prefix/Suffix:
  position: absolute inside input
  color: --color-text-muted
  font: var(--font-sans) (numbers always in Inter)

Used in: HR-2 (search), HR-5 (settings), HR-7, E-3
```

---

## Textarea

```
File: src/components/ui/textarea.tsx

Props:
  Name         Type      Default
  ──────────────────────────────
  label        string?   —
  placeholder  string?   —
  rows         number    3
  required     boolean   false
  error        string?   —
  helper       string?   —
  maxLength    number?   —        shows counter bottom-right if set

Style: same as Input, resize: vertical only
Font: var(--font-body) — Thai reads better in textarea

Used in: HR-3, HR-5, HR-7
```

---

## Select

```
File: src/components/ui/select.tsx
Import: import { Select } from '@/components/ui/select'

Props:
  Name        Type             Default
  ─────────────────────────────────────────────
  label       string?          —
  options     { value: string; label: string }[]  required
  value       string           required
  onChange    (value: string) => void  required
  placeholder string?          "เลือก..."
  disabled    boolean          false
  size        'sm'|'md'        'md'

Style:
  Same visual as Input
  Caret: ChevronDownIcon right-side
  Dropdown: white card, --shadow-hover, --radius-md
  Options: 40px height, 14px Thai font, hover --color-primary-subtle

Used in: HR-2, HR-5, HR-6, E-5
```

---

## Toggle

```
File: src/components/ui/toggle.tsx
Import: import { Toggle } from '@/components/ui/toggle'

Props:
  Name          Type                  Default
  ──────────────────────────────────────────────
  checked       boolean               required
  onChange      (v: boolean) => void  required
  label         string?               —
  description   string?               —         muted sub-text
  disabled      boolean               false

Style:
  Track: 40px × 22px, border-radius 99px
    OFF: bg gray-200
    ON:  bg --color-primary
  Thumb: 18px circle, white, shadow, transition 200ms
  Label: 14px, var(--font-body)
  Description: 12px, --color-text-muted

Used in: HR-5, E-5
```

---

## TabBar

```
File: src/components/ui/tab-bar.tsx
Import: import { TabBar } from '@/components/ui/tab-bar'

Props:
  Name       Type                              Default
  ──────────────────────────────────────────────────────────────
  tabs       { value: string; label: string; count?: number }[]  required
  value      string                            required
  onChange   (value: string) => void           required
  variant    'underline'|'pill'                'pill'

Variants:
  pill:
    Container: flex row, bg --color-bg-secondary, p-1, border-radius --radius-md
    Active tab: bg white, border 1px --color-border, border-radius --radius-sm
    Inactive: transparent bg, --color-text-muted
    Font: 12px, weight 500 (Thai: 13px)

  underline:
    Container: flex row, border-bottom 1px --color-border
    Active: --color-primary text, border-bottom 2px --color-primary
    Inactive: --color-text-muted

Count badge: amber pill, shown if count > 0

Used in: HR-2, HR-4, HR-5, E-4
```

---

## DataTable

```
File: src/components/ui/data-table.tsx
Import: import { DataTable } from '@/components/ui/data-table'
Dependency: @tanstack/react-table

Props:
  Name          Type                    Default   Description
  ─────────────────────────────────────────────────────────────────────
  columns       ColumnDef<T>[]          required  TanStack column defs
  data          T[]                     required
  isLoading     boolean                 false     shows skeleton rows
  onRowClick    (row: T) => void?       —         makes row clickable
  selectable    boolean                 false     adds checkbox column
  onSelectChange (rows: T[]) => void?   —
  pageSize      number                  20
  totalCount    number?                 —         for server-side pagination
  onPageChange  (page: number) => void? —

Table style:
  Container: white bg, border 1px --color-border, border-radius --radius-lg, overflow hidden
  
  Header row:
    background: var(--color-bg-secondary)
    height: 40px
    font: 11px, weight 500, --color-text-muted
    padding: 0 16px
    border-bottom: 1px solid var(--color-border)
    Sortable column: shows ↑↓ icon, click toggles asc/desc

  Data row:
    height: 52px
    padding: 0 16px
    border-bottom: 1px solid var(--color-border-light)
    hover: background var(--color-primary-subtle) [transition 120ms]
    clickable cursor: pointer (if onRowClick provided)
    last row: no border-bottom

  Checkbox column:
    width: 40px
    Uses shadcn Checkbox component

  Skeleton loading:
    Replaces data rows with N× <TableRowSkeleton />
    Each skeleton: 3 animated gray bars per row

Pagination:
  Position: bottom, flex space-between
  Left info: "แสดง 1–20 จาก 103 รายการ" (12px, --color-text-muted)
  Right: ← [page numbers] → (max 5 page numbers shown)

Used in: HR-1 (simplified), HR-2, HR-4, HR-6
```

---

## ConfirmModal

```
File: src/components/ui/confirm-modal.tsx
Import: import { ConfirmModal } from '@/components/ui/confirm-modal'

Props:
  Name            Type                     Default
  ──────────────────────────────────────────────────────
  open            boolean                  required
  onClose         () => void               required
  onConfirm       () => void               required
  title           string                   required
  message         string                   required
  confirmLabel    string                   "ยืนยัน"
  cancelLabel     string                   "ยกเลิก"
  variant         'primary'|'danger'       'primary'
  hasReasonInput  boolean                  false
  reasonLabel     string?                  —
  isLoading       boolean                  false

Layout:
  Overlay: fixed, full screen, rgba(0,0,0,0.4), z-50
  Modal card: white, --radius-lg, --shadow-modal
              width: 400px (desktop) / 90vw (mobile)
              padding: 24px

  Title: 16px, weight 600
  Message: 14px, --color-text-secondary (Thai lineheight 1.8)

  Optional reason textarea (if hasReasonInput):
    Required, min 10 chars

  Buttons row:
    [Cancel — outline] [Confirm — primary or danger]
    Loading: confirm button shows spinner

Keyboard: ESC to close
Focus trap inside modal

Used in: HR-2, HR-3, HR-7, E-5 (sign out)
```

---

## Toast

```
File: src/components/ui/toast.tsx
Import: import { useToast } from '@/components/ui/toast'
        import { Toaster } from '@/components/ui/toast'

API:
  const { toast } = useToast()
  toast({ variant: 'success', message: 'บันทึกแล้ว' })
  toast({ variant: 'error', message: 'เกิดข้อผิดพลาด' })
  toast({ variant: 'info', message: 'กำลังดำเนินการ' })

Props (individual toast):
  variant:    'success'|'error'|'info'|'warning'
  message:    string
  duration:   number (ms)  default 4000
  action:     { label: string; onClick: () => void }?

Position: fixed top-right (desktop) / top-center (mobile)
Z-index: 9999

Variants:
  success: bg green-50, border-left 3px green-500, icon CheckIcon green
  error:   bg red-50,   border-left 3px red-500,   icon XCircleIcon red
  info:    bg blue-50,  border-left 3px blue-500,   icon InfoIcon blue
  warning: bg amber-50, border-left 3px amber-500,  icon AlertIcon amber

Animation:
  Enter: slide in from right + fade (250ms)
  Exit:  slide out to right + fade (200ms)
  Auto-dismiss after `duration` ms

Used in: All screens (mounted once in root layout)
```

---

## EmptyState

```
File: src/components/ui/empty-state.tsx
Import: import { EmptyState } from '@/components/ui/empty-state'

Props:
  Name     Type               Default
  ──────────────────────────────────────────────────
  icon     React.ReactNode?   <InboxIcon />
  message  string             required
  sub      string?            —
  action   React.ReactNode?   —    (usually a Button)

Layout: flex column, center-aligned, gap-12px
  Icon wrapper: 56px, bg --color-bg-secondary, border-radius --radius-full
  Icon: 24px, --color-text-muted
  Message: 15px, weight 500, --color-text-primary (Thai lineheight 1.8)
  Sub: 13px, --color-text-muted

Used in: HR-2, HR-6, E-4
```

---

## SkeletonRow (TableRowSkeleton)

```
File: src/components/ui/skeleton.tsx
Export: TableRowSkeleton, CardSkeleton, MetricCardSkeleton, ChartSkeleton

TableRowSkeleton:
  height: 52px
  3 gray bars at widths: 140px, 80px, 60px (randomized per column)
  animation: pulse 1.5s infinite

CardSkeleton:
  height: 120px, border-radius --radius-lg, full width

MetricCardSkeleton:
  matches MetricCard layout: icon circle + 2 bars

ChartSkeleton:
  height: 200px, border-radius --radius-lg

Used in: HR-1, HR-2, HR-4, HR-6, E-2, E-4
```

---

## SearchBar / SearchInput

```
File: src/components/ui/search-input.tsx
Import: import { SearchInput } from '@/components/ui/search-input'

Props:
  Name         Type                   Default
  ────────────────────────────────────────────────────
  placeholder  string                 "ค้นหา..."
  value        string                 required
  onChange     (value: string) => void  required
  debounce     number                 300    (ms)
  width        string?                'full'
  size         'sm'|'md'              'md'

Style:
  left icon: SearchIcon 14px, --color-text-muted, inset left 10px
  padding-left: 36px
  Same base style as Input

Clear button: shows × when value.length > 0, clears on click

Used in: HR-2, HR-6, HRTopbar
```

---

## DateRangePicker

```
File: src/components/ui/date-range-picker.tsx
Import: import { DateRangePicker } from '@/components/ui/date-range-picker'
Dependency: dayjs

Props:
  Name      Type                             Default
  ──────────────────────────────────────────────────────────
  value     { from: Date; to: Date } | null  required
  onChange  (range: { from: Date; to: Date } | null) => void  required
  presets   boolean                          true    shows preset buttons
  placeholder  string                        "เลือกช่วงวันที่"

Presets (shown above calendar):
  [เดือนนี้] [เดือนที่แล้ว] [7 วันล่าสุด] [30 วันล่าสุด]

Calendar:
  2-month view side by side
  Selected range highlighted in --color-primary-bg
  Start/end dates in solid --color-primary
  Thai month names, Buddhist Era year

Format display: "1 พ.ค. 68 — 31 พ.ค. 68"

Used in: HR-2, HR-4
```

---

## SlideDrawer

```
File: src/components/ui/slide-drawer.tsx
Import: import { SlideDrawer } from '@/components/ui/slide-drawer'

Props:
  Name       Type               Default
  ──────────────────────────────────────────────────────
  open       boolean            required
  onClose    () => void         required
  width      number             480
  title      string?            —
  children   React.ReactNode    required

Animation:
  Backdrop: fade in rgba(0,0,0,0.3), 200ms
  Panel: translate X from 100% to 0, 250ms cubic-bezier(0.4, 0, 0.2, 1)
  Close: reverse

Backdrop click: calls onClose
ESC key: calls onClose

Panel style:
  position: fixed, right 0, top 0, height 100vh
  background: white
  box-shadow: -4px 0 24px rgba(0,0,0,0.1)
  overflow-y: auto
  padding: 0 (children control internal padding)
  z-index: 50

Used in: HR-3 (Request Detail)
```

---

## Pagination

```
File: src/components/ui/pagination.tsx
Import: import { Pagination } from '@/components/ui/pagination'

Props:
  Name         Type                   Default
  ──────────────────────────────────────────────
  currentPage  number                 required
  totalPages   number                 required
  totalCount   number                 required
  pageSize     number                 20
  onChange     (page: number) => void  required

Displays:
  Left: "แสดง 1–20 จาก 103 รายการ"
  Right: ← [1] [2] [3] ... [6] →

Active page: --color-primary bg, white text
Other pages: hover --color-primary-subtle
Ellipsis: shows when > 5 pages

Used in: HR-2, HR-6, E-4
```

---

---

# UI — Charts

---

## StatusDonutChart

```
File: src/components/ui/charts/donut-chart.tsx
Library: recharts

Props:
  Name    Type                                    Default
  ──────────────────────────────────────────────────────────────
  data    { label: string; value: number; color: string }[]  required
  size    number                                  120   (px)
  center  string?                                 —     center label

Default colors:
  approved:  #2DBD8F
  pending:   #F59E0B
  rejected:  #EF4444
  disbursed: #A8E6CF

Tooltip: custom styled — white card, label + count + %
Legend: below chart, flex-wrap, dot + label

Used in: HR-1
```

---

## DisbursementBarChart

```
File: src/components/ui/charts/bar-chart.tsx
Library: recharts

Props:
  Name    Type          Default
  ─────────────────────────────────────────────
  data    { date: string; amount: number; count: number }[]  required
  view    'daily'|'weekly'  'daily'

Bar style:
  fill: --color-primary-light (#A8E6CF)
  highlighted (today/current week): --color-primary-dark (#1E9E74)
  border-radius: 4px top corners only
  width: 32px with auto-gap

Axes:
  X: date labels, 11px, --color-text-muted
  Y: ฿ formatted, 11px, --color-text-muted
  Grid: horizontal dashed lines, --color-border

Tooltip (custom):
  White card, --shadow-card, --radius-md
  Shows: date label + "฿X,XXX" + "N รายการ"

Used in: HR-4
```

---

---

# HR — Composite Components

---

## HRLayout

```
File: src/components/layouts/hr-layout.tsx
Import: import { HRLayout } from '@/components/layouts/hr-layout'

Props:
  Name         Type              Default
  ────────────────────────────────────────
  children     React.ReactNode   required
  rightPanel   React.ReactNode?  —          mounts in right 280px column
  fullWidth    boolean           false       removes right panel, main takes full width

Layout:
  flex row, h-screen, overflow hidden
  ├── <HRSidebar />        200px, fixed height
  └── flex-1 flex column
      ├── <HRTopbar />     56px, sticky top
      └── main             flex-1, overflow-y auto
          ├── content area   flex-1
          └── rightPanel     280px (if provided)
```

---

## HRSidebar

```
File: src/components/hr/hr-sidebar.tsx

Nav items (in order):
  Dashboard       /hr/dashboard   HomeIcon
  พนักงาน         /hr/employees   UsersIcon
  คำขอ EWA        /hr/requests    WalletIcon      (shows pending badge)
  ปฏิทินเงินเดือน /hr/calendar    CalendarIcon
  รายงาน          /hr/reports     BarChart2Icon
  ตั้งค่า         /hr/settings    SettingsIcon

Pending badge:
  Fetched from mock store
  Shows on "คำขอ EWA" nav item
  Style: 16px amber pill

Bottom section:
  <SidebarCTACard /> — upgrade prompt

Active detection: usePathname() from next/navigation

Collapse behavior (< 1280px):
  Width shrinks to 48px
  Shows only icons (no labels)
  Tooltip on hover shows label
```

---

## HRTopbar

```
File: src/components/hr/hr-topbar.tsx

Props:
  Name        Type     Default
  ──────────────────────────────
  title       string   required
  breadcrumb  string?  —

Contains:
  Left:  title + breadcrumb
  Center: <SearchInput /> (search employees)
  Right:  period label + <NotificationBell /> + <UserChip />

NotificationBell:
  Dropdown with last 5 notifications
  "ดูทั้งหมด" link at bottom
  Mark as read on open
```

---

## RequestDetailDrawer

```
File: src/components/hr/request-detail-drawer.tsx

Props:
  Name       Type     Default
  ────────────────────────────────────────
  requestId  string   required
  open       boolean  required
  onClose    () => void  required
  onApprove  (id: string, note: string) => void  required
  onReject   (id: string, reason: string) => void  required

Composes:
  <SlideDrawer />
  <Avatar />
  <PayCycleBadge />
  <PayPeriodProgress />
  <FinancialSummaryCard />
  <RequestTimeline />
  <Textarea /> (HR note)
  <Button /> (approve/reject)
  <ConfirmModal />

Data: reads from mock store using requestId
```

---

## PayPeriodProgress

```
File: src/components/hr/pay-period-progress.tsx

Props:
  Name       Type                  Default
  ──────────────────────────────────────────────
  payCycle   'monthly'|'weekly'    required
  workedDays  number               required
  totalDays   number               required
  payDate     string               required  (display only)
  period      string               required  "พ.ค. 2568" or "สัปดาห์ที่ 19"

Renders: period label + <ProgressBar /> + sub text + payDate
```

---

## FinancialSummaryCard

```
File: src/components/hr/financial-summary-card.tsx

Props:
  Name               Type     Default
  ──────────────────────────────────────────
  earnedToDate       number   required
  previousEWA        number   required
  maxWithdrawable    number   required
  requestedAmount    number   required
  remainingAtPayday  number   required

Renders labeled rows with formatted ฿ values
Requested amount row: larger font + --color-primary
Uses font-number class on all ฿ values
```

---

## RequestTimeline

```
File: src/components/hr/request-timeline.tsx

Props:
  Name     Type          Default
  ──────────────────────────────────
  history  EWARequest[]  required    (sorted desc by date)
  maxShow  number        3

Each entry: dot + line + date + amount + <StatusBadge /> + approver name
Dot color matches status color
Overflow: scroll y if > maxShow items
```

---

## OnBehalfBanner

```
File: src/components/hr/on-behalf-banner.tsx

Props:
  Name     Type     Default
  ──────────────────────────────────────
  hrName   string   required
  variant  'warning'|'info'  'warning'

Renders: amber banner with warning icon + message
```

---

## SidebarCTACard

```
File: src/components/hr/sidebar-cta-card.tsx

No props — static content
Shows: "PayDay+ Pro" upgrade prompt
Background: --color-primary
Position: bottom of sidebar
```

---

---

# Employee — Composite Components

---

## MobileLayout

```
File: src/components/layouts/mobile-layout.tsx

Props:
  Name        Type              Default
  ────────────────────────────────────────────────
  children    React.ReactNode   required
  title       string?           —           top bar title
  showBack    boolean           false       ← back button
  onBack      () => void?       —           defaults to router.back()
  noPadding   boolean           false

Layout:
  flex column, h-dvh
  ├── TopBar (44px, sticky)
  ├── main (flex-1, overflow-y auto, pb-[76px])
  └── <BottomTabBar /> (60px + safe area, fixed bottom)

TopBar:
  If showBack: ← icon button left (router.back or onBack)
  Center: title (16px, weight 600, Thai font)
  Right: slot for actions
```

---

## BottomTabBar

```
File: src/components/employee/bottom-tab-bar.tsx

Tabs:
  Label       Route                    Icon
  ────────────────────────────────────────────────
  หน้าหลัก   /employee/home           HomeIcon
  ยื่นคำขอ   /employee/request        WalletIcon
  ประวัติ     /employee/history        ClipboardListIcon
  โปรไฟล์    /employee/profile        UserIcon

Active: --color-primary icon (filled variant) + label
Inactive: --color-text-muted icon (outline) + label

Style:
  background: white
  border-top: 1px solid --color-border
  height: 60px
  padding-bottom: env(safe-area-inset-bottom)
  Each tab: flex-1, flex col center, gap-2px
  Icon: 22px
  Label: 10px, weight 500

Active detection: usePathname()
"ยื่นคำขอ" tab: shows pending dot if has pending request
```

---

## BalanceHeroCard

```
File: src/components/employee/balance-hero-card.tsx

Props:
  Name             Type                  Default
  ──────────────────────────────────────────────────────────
  availableAmount  number                required
  earnedToDate     number                required
  maxWithdrawable  number                required
  previousEWA      number                required
  onRequestPress   () => void            required
  disabled         boolean               false
  disabledReason   string?               —

Background: teal gradient
Shows: 4-stat mini grid + CTA button

Disabled state:
  Button: grayed out + disabledReason text shown
  "หมดเขตยื่นคำขอ" / "ใช้สิทธิ์ครบแล้ว" / "EWA ถูกระงับ"
```

---

## PINPad

```
File: src/components/employee/pin-pad.tsx
Import: import { PINPad } from '@/components/employee/pin-pad'

Props:
  Name        Type                      Default
  ──────────────────────────────────────────────────────────
  length      number                    4
  onComplete  (pin: string) => void     required
  error       string?                   —           shows below dots
  disabled    boolean                   false
  autoFocus   boolean                   true

UI:
  Dots row (4 dots):
    Empty:  16px circle, border 2px --color-border
    Filled: 16px circle, bg --color-primary (solid)
    Error:  border red-500

  Numeric keypad (3×4 grid):
    Digits 1–9, 0, ⌫ (backspace)
    Button: 64px × 56px, border-radius --radius-md
    Font: 20px, weight 500, font-number
    Tap: fill next dot + haptic (if available)
    Background: --color-bg-secondary, hover: white

  Error animation:
    Dots: horizontal shake 400ms, then clear all dots
    Error message: 13px red below dots

  Backspace:
    Clears last filled dot
    Shows BackspaceIcon in bottom-right cell

Auto-submit:
  When 4th dot fills → calls onComplete(pin) after 80ms delay
    (brief delay so user sees filled state before submit)

Accessibility:
  aria-label on each keypad button: "กด N"
  Screen reader: announces "กรอก PIN หลักที่ N"

Used in: E-1, E-3 (step 2)
```

---

## QuickAmountButton

```
File: src/components/employee/quick-amount-button.tsx

Props:
  Name      Type      Default
  ──────────────────────────────────────────
  amount    number    required
  max       number    required
  selected  boolean   false
  onSelect  () => void  required

Display: "฿1,000" (font-number, 16px, weight 600)

States:
  default:   white bg, --color-primary border + text
  selected:  --color-primary bg, white text
  disabled:  gray bg, gray border + text, cursor not-allowed
             (disabled when amount > max)

Used in: E-3, HR-7
```

---

## StepIndicator

```
File: src/components/employee/step-indicator.tsx

Props:
  Name          Type       Default
  ──────────────────────────────────────────
  currentStep   number     required  (1-based)
  totalSteps    number     required
  labels        string[]   required

Layout: flex row, centered, full width, padding 12px 0

Each step:
  Circle (28px):
    Future:    gray border + gray number inside
    Active:    --color-primary bg + white number
    Completed: --color-primary bg + white CheckIcon

  Label (below circle):
    11px, Thai font
    Active: --color-primary, weight 600
    Others: --color-text-muted

Connector line between steps:
  2px line
  Completed section: --color-primary
  Future section: --color-border

Used in: E-3
```

---

## ChipSelect

```
File: src/components/employee/chip-select.tsx

Props:
  Name        Type        Default
  ────────────────────────────────────────────────────
  options     string[]    required
  value       string?     —         selected value
  onChange    (v: string | null) => void  required
  multiSelect boolean     false

Chip style (unselected):
  bg: --color-bg-secondary
  border: 1px solid --color-border
  border-radius: --radius-full
  padding: 6px 14px
  font: 13px (Thai: 14px)

Chip style (selected):
  bg: --color-primary-bg
  border: 1px solid --color-primary
  color: --color-primary
  font-weight: 500

Layout: flex row, flex-wrap, gap-8px

Used in: E-3, HR-7
```

---

## RequestCard (Employee History)

```
File: src/components/employee/request-card.tsx

Props:
  Name       Type        Default
  ─────────────────────────────────────────────────
  request    EWARequest  required
  expanded   boolean     false
  onToggle   () => void  required

Collapsed view (3-column layout):
  Left:   Date column (day + month)
  Middle: Title + reference + reason
  Right:  Amount + <StatusBadge />

Expanded section (accordion):
  Additional rows: approved date, approver, disbursed date, bank, HR note
  Background: --color-bg-secondary

Animation:
  Height 0 → auto, 200ms ease (use max-height trick)
  Chevron rotates 180° when expanded

Used in: E-4
```

---

## HistorySummaryStrip

```
File: src/components/employee/history-summary-strip.tsx

Props:
  Name          Type     Default
  ────────────────────────────────────────────────────────
  currentPeriod { amount: number; count: number }  required
  lastPeriod    { amount: number; count: number }  required
  allTime       { amount: number; count: number }  required

Layout: horizontal scroll row, no-scrollbar, gap-10px, padding 16px
Each summary card: white bg, bordered, min-width 120px, flex-shrink 0

Used in: E-4
```

---

## PayPeriodWidget (Employee Home)

```
File: src/components/employee/pay-period-widget.tsx

Props:
  Name       Type                  Default
  ──────────────────────────────────────────────
  payCycle   'monthly'|'weekly'    required
  workedDays  number               required
  totalDays   number               required
  payDate     string               required
  cutoffDate  string               required
  daysUntilCutoff  number          required

Renders:
  Period label + <ProgressBar /> + dates
  If daysUntilCutoff <= 3: amber warning chip
```

---

## LanguageToggle

```
File: src/components/ui/language-toggle.tsx

Props:
  options  ('TH'|'EN'|'MM')[]   default: ['TH','EN','MM']
  value    string               required
  onChange (lang: string) => void  required

Style:
  Pill group, 3 options
  Active: --color-primary bg, white text
  Inactive: transparent, --color-text-muted

Used in: E-1
```

---

---

# Layout Components Summary

```
Component             File                                    Used by
─────────────────────────────────────────────────────────────────────────────
HRLayout              layouts/hr-layout.tsx                   All HR screens
MobileLayout          layouts/mobile-layout.tsx               All Employee screens
HRSidebar             hr/hr-sidebar.tsx                       HRLayout
HRTopbar              hr/hr-topbar.tsx                        HRLayout
BottomTabBar          employee/bottom-tab-bar.tsx             MobileLayout
```

---

# Full Component Index

```
ui/
  avatar.tsx
  status-badge.tsx
  pay-cycle-badge.tsx
  ewa-status-badge.tsx
  trend-badge.tsx
  metric-card.tsx
  progress-bar.tsx
  button.tsx
  input.tsx
  textarea.tsx
  select.tsx
  toggle.tsx
  tab-bar.tsx
  data-table.tsx
  confirm-modal.tsx
  toast.tsx
  empty-state.tsx
  skeleton.tsx
  search-input.tsx
  date-range-picker.tsx
  slide-drawer.tsx
  pagination.tsx
  language-toggle.tsx
  charts/
    donut-chart.tsx
    bar-chart.tsx

hr/
  hr-layout.tsx (in layouts/)
  hr-sidebar.tsx
  hr-topbar.tsx
  request-detail-drawer.tsx
  pay-period-progress.tsx
  financial-summary-card.tsx
  request-timeline.tsx
  on-behalf-banner.tsx
  sidebar-cta-card.tsx

employee/
  mobile-layout.tsx (in layouts/)
  bottom-tab-bar.tsx
  balance-hero-card.tsx
  pin-pad.tsx
  quick-amount-button.tsx
  step-indicator.tsx
  chip-select.tsx
  request-card.tsx
  history-summary-strip.tsx
  pay-period-widget.tsx
```

Total: **38 components**

Design System — TeamHub HR Dashboard

> Extracted from UI reference (Recruitment Dashboard screen)  
> Version 1.1 · May 2025 · Updated: Noto Sans Thai font support
> ***1. Color Palette
> Primary Colors
> Token Hex Usage
> `--color-primary` `#2DBD8F` Active nav, buttons, progress bars, links
> `--color-primary-dark` `#1E9E74` Hover states, highlighted bar charts
> `--color-primary-light` `#A8E6CF` Soft accents, chart area fills
> `--color-primary-bg` `#E8F5F0` Hero card bg, schedule card bg, tag bg
> `--color-primary-subtle` `#F2FAF6` Hover row bg, light section fills
> Neutral / Text
> Token Hex Usage
> `--color-text-primary` `#1A1D1B` Headings, primary labels, table values
> `--color-text-secondary` `#6B7280` Sub-labels, meta text, placeholders
> `--color-text-muted` `#9CA3AF` Timestamps, breadcrumb separators
> `--color-text-link` `#2DBD8F` Breadcrumb active, inline links
> Background / Surface
> Token Hex Usage
> `--color-bg-page` `#E4EDEA` Outer page background
> `--color-bg-canvas` `#FFFFFF` Main content area, all cards
> `--color-bg-sidebar` `#FFFFFF` Sidebar surface
> `--color-bg-secondary` `#F9FAFB` Table header bg, input fills
> `--color-bg-tag` `#E8F5F0` Light green pill backgrounds
> Border
> Token Hex Usage
> `--color-border` `#E5E7EB` Card borders, table dividers
> `--color-border-light` `#F3F4F6` Subtle inner dividers
> Status / Semantic
> Token Hex Usage
> `--color-badge-positive-bg` `#D1FAE5` Positive % badge bg
> `--color-badge-positive-text` `#065F46` Positive % badge text
> `--color-badge-neutral-bg` `#F3F4F6` Neutral badge bg
> `--color-badge-neutral-text` `#374151` Neutral badge text
> `--color-tag-remote-bg` `#CCFBF1` Remote tag bg
> `--color-tag-remote-text` `#115E59` Remote tag text
> `--color-tag-onsite-bg` `#1A1D1B` On-Site tag bg
> `--color-tag-onsite-text` `#FFFFFF` On-Site tag text
> `--color-tag-hybrid-bg` `#2DBD8F` Hybrid tag bg
> `--color-tag-hybrid-text` `#FFFFFF` Hybrid tag text
> ***2. Typography
> Font Family
> /_ Latin (numbers, English labels) _/
> font-family: 'Inter', 'DM Sans', system-ui, sans-serif;
> /_ Thai — applied via :lang(th) or html[lang="th"] _/
> font-family: 'Noto Sans Thai', 'Inter', system-ui, sans-serif;
> Font Loading (Next.js)
> // app/layout.tsx
> import { Inter } from 'next/font/google'
> import { Noto_Sans_Thai } from 'next/font/google'
> const inter = Inter({
> subsets: ['latin'],
> variable: '--font-sans',
> display: 'swap',
> })
> const notoSansThai = Noto_Sans_Thai({
> subsets: ['thai'],
> variable: '--font-thai',
> weight: ['300', '400', '500', '600', '700'],
> display: 'swap',
> })
> // <body className={`${inter.variable} ${notoSansThai.variable}`}>
> Thai Font Rules

- All Thai text uses "Noto Sans Thai" as primary font
- Numbers and English text still render in "Inter"
- Thai line-height needs +0.2 bump vs Latin (e.g. body 1.6 → 1.8)
- Thai weight mapping:
  Latin 400 (regular) → Thai 400
  Latin 500 (medium) → Thai 500
  Latin 600 (semibold) → Thai 600
  Latin 700 (bold) → Thai 700
- Minimum font size for Thai: 14px (12px Thai is hard to read)
- Employee mobile screens: minimum 16px for Thai
  Type Scale
  Token Size Weight LH (Latin) LH (Thai) Usage
  `--text-page-title` `22px` `600` `1.3` `1.5` Page heading
  `--text-section-title` `14px` `600` `1.4` `1.6` Card/panel titles
  `--text-stat-hero` `36px` `700` `1.1` `1.2` Large metric numbers
  `--text-stat-value` `24px` `600` `1.2` `1.3` Secondary metric numbers
  `--text-body` `14px` `400` `1.6` `1.8` Table rows, card body (Thai min 14px)
  `--text-label` `12px` `500` `1.4` `1.6` Column headers (EN only, Thai use 14px)
  `--text-caption` `12px` `400` `1.5` `1.7` Timestamps, sub-labels (Thai min 12px)
  `--text-badge` `11px` `500` `1` `1.2` Badges, pills, tags
  > Note: Thai glyphs are taller than Latin due to upper vowels (สระบน) and tone marks (วรรณยุกต์). Always use the Thai line-height column when rendering Thai text. Body text bumped from 13px → 14px to ensure Thai readability.
  > Breadcrumb
  > Parent page → Current page
  > Color: --color-text-muted / --color-text-link (active)
  > Size: 12px, weight 400
  > ***3. Spacing & Layout
  > Grid System
  > Layout: 3-column fixed sidebar + fluid main + fixed right panel
  > Sidebar width: 200px (fixed)
  > Right panel: 280px (fixed)
  > Main content: fluid (flex: 1)
  > Page padding: 20px all sides
  > Spacing Scale (rem-based)
  > --space-1: 4px
  > --space-2: 8px
  > --space-3: 12px
  > --space-4: 16px
  > --space-5: 20px
  > --space-6: 24px
  > --space-8: 32px
  > --space-10: 40px
  > Card Internal Padding
  > Default card: 16px 20px
  > Compact card: 12px 16px
  > Hero stat card: 20px 24px
  > Gap
  > Card grid gap: 12px
  > Stat row gap: 12px
  > Table row height: 52px
  > Nav item gap: 4px vertical
  > ***4. Border Radius
  > --radius-sm: 6px /_ badges, tags, small pills _/
  > --radius-md: 8px /_ buttons, inputs, nav active state _/
  > --radius-lg: 12px /_ cards, modals, panels _/
  > --radius-xl: 16px /_ hero card, sidebar CTA card _/
  > --radius-full: 9999px /_ avatar circles, round pills _/
  > ***5. Shadows
  > --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  > --shadow-hover: 0 4px 12px rgba(0,0,0,0.08);
  > --shadow-modal: 0 8px 32px rgba(0,0,0,0.12);
  > /* Cards have very subtle shadows + 1px border */
  > ***6. Components
  > Thai Font Rule: Anywhere a component spec below says 13px, use 14px when
  > rendering Thai text. English-only labels (e.g. "EWA", "EMP-0041") can stay at 13px.
  > All components use var(--font-body) which resolves to the Noto Sans Thai stack.
  > 6.1 Sidebar Navigation
  > Width: 200px
  > Background: #FFFFFF
  > Border-right: 1px solid --color-border
  > Padding: 16px 12px
  > Logo area:
  > Height: 56px
  > Icon + wordmark, left-aligned
  > Nav Item:
  > Height: 40px
  > Padding: 0 12px
  > Gap: 10px (icon + label)
  > Icon size: 16px (stroke-width: 1.5)
  > Font: 13px, weight 400
  > Color: --color-text-secondary
  > Radius: --radius-md
  > Nav Item — Active:
  > Background: --color-primary
  > Color: #FFFFFF
  > Font: 13px, weight 500
  > Nav Item — Hover:
  > Background: --color-bg-tag
  > Color: --color-primary
  > Sidebar CTA Card (bottom):
  > Background: --color-primary
  > Radius: --radius-xl
  > Padding: 16px
  > Title: 16px, weight 700, white
  > Body: 12px, weight 400, rgba(255,255,255,0.8)
  > Button: white bg, primary text, --radius-md
  > 6.2 Top Navigation Bar
  > Height: 56px
  > Background: #FFFFFF
  > Border-bottom: 1px solid --color-border
  > Padding: 0 20px
  > Layout: space-between flex row
  > Left: Page title + breadcrumb (stacked)
  > Center: Search bar (see 6.3)
  > Right: [Settings icon] [Bell icon] [Avatar + Name]
  > Icon buttons (settings, bell):
  > Size: 32px × 32px
  > Background: --color-bg-secondary
  > Radius: --radius-md
  > Icon: 16px, stroke color: --color-text-secondary
  > User chip:
  > Avatar: 32px circle with photo
  > Name: 13px, weight 600
  > Role: 11px, color: --color-text-muted
  > Gap: 10px
  > 6.3 Search Bar
  > Width: 320px
  > Height: 36px
  > Background: --color-bg-secondary
  > Border: 1px solid --color-border
  > Radius: --radius-md
  > Padding: 0 12px 0 36px
  > Icon: search, 14px, left-inset 10px
  > Placeholder: "Search anything", --color-text-muted
  > Font: 13px
  > 6.4 Stat Cards
  > Hero Stat Card
  > Background: --color-bg-tag (#E8F5F0)
  > Radius: --radius-xl
  > Padding: 20px 24px
  > Min-height: 120px
  > Icon circle:
  > Size: 40px × 40px
  > Background: --color-primary
  > Radius: --radius-md
  > Icon color: #FFFFFF
  > Icon size: 18px
  > Metric:
  > Number: 36px, weight 700, --color-text-primary
  > Trend badge: see Badge component
  > Label: 13px, --color-text-muted, margin-top 4px
  > Background watermark icon: 80px, opacity 0.08, bottom-right
  > Mini Stat Card
  > Background: #FFFFFF
  > Border: 1px solid --color-border
  > Radius: --radius-lg
  > Padding: 16px 20px
  > Layout: flex row, space-between
  > Left:
  > Icon: 20px outline, --color-text-secondary
  > Label: 12px, --color-text-muted, above number
  > Number: 24px, weight 600, --color-text-primary
  > Right:
  > Percentage badge (see Badge component)
  > Sub-label: "of applicants", 11px, --color-text-muted
  > 6.5 Badges & Pills
  > Trend Badge (positive)
  > Background: --color-badge-positive-bg
  > Color: --color-badge-positive-text
  > Padding: 2px 8px
  > Radius: --radius-full
  > Font: 11px, weight 600
  > Prefix: +/- symbol
  > Work Type Tag (location)
  > Remote:
  > bg: --color-tag-remote-bg
  > color: --color-tag-remote-text
  > On-Site:
  > bg: --color-tag-onsite-bg (#1A1D1B)
  > color: #FFFFFF
  > Hybrid:
  > bg: --color-tag-hybrid-bg (#2DBD8F)
  > color: #FFFFFF
  > All tags:
  > Padding: 3px 10px
  > Radius: --radius-full
  > Font: 11px, weight 500
  > Filter Button (with icon)
  > Background: #FFFFFF
  > Border: 1px solid --color-border
  > Padding: 6px 14px
  > Radius: --radius-md
  > Font: 12px, weight 500
  > Icon: funnel, 12px, left of label
  > Hover: bg --color-bg-secondary
  > 6.6 Tab Filter Bar
  > Layout: flex row, gap 4px
  > Active tab: #FFFFFF bg, 1px border --color-border, radius --radius-md, weight 600
  > Inactive tab: transparent bg, color --color-text-secondary
  > Padding: 6px 14px
  > Font: 12px
  > Transition: background 150ms ease
  > 6.7 Data Table
  > Container:
  > Background: #FFFFFF
  > Border: 1px solid --color-border
  > Radius: --radius-lg
  > Overflow: hidden
  > Header row:
  > Background: --color-bg-secondary (#F9FAFB)
  > Height: 40px
  > Font: 11px, weight 500, --color-text-muted
  > Padding: 0 16px
  > Border-bottom: 1px solid --color-border
  > Sort icon: ↑↓ arrows, 10px, appended to sortable headers
  > Data row:
  > Height: 52px
  > Padding: 0 16px
  > Border-bottom: 1px solid --color-border-light
  > Font: 13px, weight 400
  > Hover bg: --color-primary-subtle (#F2FAF6)
  > Last row: no border-bottom
  > Name cell:
  > Avatar: 28px circle, left-aligned
  > Name: 13px, weight 500 (above)
  > Email: 11px, --color-text-muted (below)
  > Gap: 10px from avatar
  > Job cell:
  > Title: 13px, weight 500 (above)
  > Dept: 11px, --color-text-muted (below)
  > Status cell (Stage progress):
  > Label: 12px, weight 500 (above)
  > Dots: 5 dots, 8px circles
               Active: --color-primary
               Inactive: --color-border
  Gap: 4px between dots
  6.8 Vacancy Cards
  Container: 2×2 grid, gap 10px
  Each card:
  Background: #FFFFFF
  Border: 1px solid --color-border
  Radius: --radius-lg
  Padding: 14px 16px
  Title: 14px, weight 600, --color-text-primary
  Meta row: flex, gap 12px, margin-top 8px
  Icon: 12px, --color-text-muted
  Text: 12px, --color-text-muted (type, location, count)
  Hover: shadow --shadow-hover, border-color --color-primary-light
  6.9 Progress Bar (Applicant Resources)
  Track:
  Height: 6px
  Background: --color-border
  Radius: --radius-full
  Fill:
  Background: --color-primary
  Radius: --radius-full
  Transition: width 400ms ease
  Label row (above bar):
  Source name: 13px, weight 400, --color-text-primary (left)
  Percentage: 12px, weight 500, --color-text-secondary (center-right)
  Count: 12px, weight 600, --color-text-primary (right)
  6.10 Line Chart
  Area:
  Stroke: --color-primary, stroke-width 2
  Fill: linear-gradient(180deg, rgba(45,189,143,0.15) 0%, rgba(45,189,143,0) 100%)
  Dot: 4px circle, --color-primary fill, white stroke 2px (on hover)
  Axis:
  X/Y labels: 11px, --color-text-muted
  Grid lines: 1px dashed, --color-border (horizontal only)
  Period selector:
  Dropdown button: see Filter Button style
  Position: top-right of card header
  6.11 Bar Chart
  Bars:
  Default: --color-primary-light (#A8E6CF), radius 4px top only
  Highlighted: --color-primary-dark (#1E9E74)
  Width: 32px, gap 16px
  Value labels: 11px, weight 500, --color-text-primary (above bar)
  X labels: 11px, --color-text-muted (below bar)
  6.12 Mini Calendar
  Header:
  Month/Year: 14px, weight 600, --color-text-primary
  Nav arrows: 16px, --color-text-secondary, hover --color-primary
  Day labels (S M T W T F S): 11px, --color-text-muted, center-aligned
  Day cells: 28px × 28px, center text 13px
  Default: transparent bg, --color-text-primary
  Today: --color-primary bg, #FFFFFF text, radius --radius-full
  Other month: --color-text-muted, opacity 0.4
  6.13 Schedule Event Card
  Background: --color-bg-tag (#E8F5F0)
  Radius: --radius-md
  Padding: 10px 12px
  Left dot: 8px circle, --color-primary, connected by vertical line
  Time: 11px, weight 400, --color-text-muted (top)
  Title: 13px, weight 600, --color-text-primary
  Person: 11px, --color-text-muted (Name · Role format)
  6.14 Avatar
  Sizes:
  xs: 24px — inline table
  sm: 28px — table rows
  md: 32px — topbar
  lg: 40px — profile header
  Shape: circle (border-radius: 50%)
  Photo: object-fit cover
  Fallback initials:
  Background: --color-primary-bg
  Text: --color-primary, weight 600, uppercase
  Font size: 40% of avatar size
  6.15 Section Header (Card Title Row)
  Layout: flex, space-between, align-center
  Title: 14px, weight 600, --color-text-primary
  Action: ··· icon (3 dots), 20px, --color-text-muted
  or Filter button / Period selector dropdown
  Border-bottom: 1px solid --color-border
  Padding: 14px 20px
  ***7. Icons
  Library: Lucide Icons (recommended) or Heroicons
  Style: Line / Outline only (no filled icons)
  Stroke: 1.5px
  Sizes: 12px (micro), 14px (inline), 16px (nav), 18px (card icons), 20px (action buttons)
  Color: Inherits from context (see color tokens above)
  ***8. Layout Structure
  ┌─────────────────────────────────────────────────────────┐
  │ SIDEBAR (200px fixed) │ TOP NAV BAR (full width) │
  │ ├───────────────────────────────│
  │ [Logo] │ MAIN CONTENT AREA │
  │ [Nav Items] │ ┌──────────┬──────┬────────┐ │
  │ │ │ Hero │ Mini │ Mini │ │
  │ │ │ Stat │ Stat │ Stat │ │
  │ [Active: Recruitment] │ ├──────────┴──────┴────────┤ │
  │ │ │ Vacancies Grid │ Chart │ │
  │ │ ├───────────────────┴───────│ │
  │ [Sidebar CTA] │ │ Applicants Table │ │
  │ │ └───────────────────────────┘ │
  │ │ │
  └─────────────────────────┴───────────────────────────────┘
  │ RIGHT PANEL │
  │ (280px fixed)│
  │ Resources │
  │ Calendar │
  │ Schedules │
  └──────────────┘
  ***9. Motion & Transitions
  /* Standard transition — all interactive elements */
  transition: all 150ms ease;
  /* Card hover */
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
  transition: transform 200ms ease, box-shadow 200ms ease;
  /* Nav item */
  transition: background 150ms ease, color 150ms ease;
  /* Progress bar fill */
  transition: width 400ms cubic-bezier(0.4, 0, 0.2, 1);
  /* Modal / drawer entrance */
  animation: slideUp 250ms cubic-bezier(0.4, 0, 0.2, 1);
  /* Badge pulse (pending status only) */
  animation: pulse 2s infinite;
  ***10. Responsive Breakpoints
  --bp-mobile: 768px /_ Sidebar → bottom drawer, cards stack 1-col _/
  --bp-tablet: 1024px /_ Sidebar → icon-only (48px), right panel collapses _/
  --bp-desktop: 1280px /_ Full 3-column layout _/
  --bp-wide: 1440px /_ Design reference width _/
  ***11. CSS Custom Properties (Full Reference)
  Tailwind Config (Font Setup)
  // tailwind.config.ts
  module.exports = {
  theme: {
  extend: {
  fontFamily: {
  sans: ['var(--font-thai)', 'Inter', 'system-ui', 'sans-serif'],
  inter: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  thai: ['var(--font-thai)', 'system-ui', 'sans-serif'],
  },
  },
  },
  }
  Global CSS (Font Application)
  /* globals.css */
  body {
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  }
  /* Force Thai font on all Thai content */
  :lang(th) {
  font-family: var(--font-thai);
  line-height: 1.8;
  }
  /* Numbers always in Inter for tabular alignment */
  .font-number,
  [data-number] {
  font-family: var(--font-sans);
  font-variant-numeric: tabular-nums;
  }
  All CSS Variables
  :root {
  /* Brand */
  --color-primary: #2DBD8F;
  --color-primary-dark: #1E9E74;
  --color-primary-light: #A8E6CF;
  --color-primary-bg: #E8F5F0;
  --color-primary-subtle: #F2FAF6;
  /* Text */
  --color-text-primary: #1A1D1B;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;
  --color-text-link: #2DBD8F;
  /* Surfaces */
  --color-bg-page: #E4EDEA;
  --color-bg-canvas: #FFFFFF;
  --color-bg-sidebar: #FFFFFF;
  --color-bg-secondary: #F9FAFB;
  --color-bg-tag: #E8F5F0;
  /* Borders */
  --color-border: #E5E7EB;
  --color-border-light: #F3F4F6;
  /* Semantic */
  --color-badge-pos-bg: #D1FAE5;
  --color-badge-pos-text: #065F46;
  --color-tag-remote-bg: #CCFBF1;
  --color-tag-remote-text: #115E59;
  --color-tag-onsite-bg: #1A1D1B;
  --color-tag-onsite-text: #FFFFFF;
  --color-tag-hybrid-bg: #2DBD8F;
  --color-tag-hybrid-text: #FFFFFF;
  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-hover: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-modal: 0 8px 32px rgba(0,0,0,0.12);
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  /* Typography */
  --font-sans: 'Inter', 'DM Sans', system-ui, sans-serif;
  --font-thai: 'Noto Sans Thai', 'Inter', system-ui, sans-serif;
  --font-body: var(--font-thai); /* default to Thai-safe stack */
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 14px; /* bumped from 13px for Thai readability */
  --text-md: 14px;
  --text-lg: 16px;
  --text-xl: 22px;
  --text-2xl: 24px;
  --text-4xl: 36px;
  }
  ***12. Component Checklist (for EWA system adaptation)
  Component Status
  Sidebar navigation ✅ Defined
  Top navigation bar ✅ Defined
  Search bar ✅ Defined
  Hero stat card ✅ Defined
  Mini stat cards ✅ Defined
  Trend/status badges ✅ Defined
  Work type tags (Remote/On-Site/Hybrid) ✅ Defined
  Filter button ✅ Defined
  Tab filter bar ✅ Defined
  Data table (sortable, with avatar) ✅ Defined
  Vacancy / info cards (2×2 grid) ✅ Defined
  Progress bars ✅ Defined
  Line chart ✅ Defined
  Bar chart ✅ Defined
  Mini calendar ✅ Defined
  Schedule event cards ✅ Defined
  Avatar (xs/sm/md/lg) ✅ Defined
  Section header row (title + action) ✅ Defined
  Sidebar CTA card ✅ Defined
  Responsive breakpoints ✅ Defined
  Motion / transitions ✅ Defined
  CSS custom properties ✅ Full reference

## Figma Reference

Source file: https://www.figma.com/design/mmEkmsppCk5Dx2hynYhxwX/EWA-Project?node-id=0-1&p=f&t=DnJmrWvrh9WSGTpA-0

### How to extract from Figma

- Colors → Inspect panel → copy hex
- Spacing → measure with ruler tool
- Typography → Inspect → font-family, size, weight
- Components → export as SVG or copy CSS

### Figma ↔ Code Mapping

| Figma Component Name | Code Component                     | File             |
| -------------------- | ---------------------------------- | ---------------- |
| Card/Stat/Hero       | `<MetricCard variant="hero" />`    | metric-card.tsx  |
| Badge/Status/Pending | `<StatusBadge status="pending" />` | status-badge.tsx |
| Table/DataRow        | `<DataTable />`                    | data-table.tsx   |
| Nav/Sidebar/Item     | `<SidebarNav />`                   | sidebar-nav.tsx  |
| Input/PIN            | `<PINPad />`                       | pin-pad.tsx      |

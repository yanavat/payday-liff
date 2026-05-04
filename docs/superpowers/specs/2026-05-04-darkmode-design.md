# Dark Mode — Design Spec

**Date:** 2026-05-04
**Scope:** HR side only (employee screens always light)
**Phase:** Phase 6 — Polish & Demo Prep

---

## Summary

Add dark mode to the HR desktop interface using CSS custom property overrides scoped to the HR layout wrapper. A sun/moon toggle button in the HR topbar switches the theme. Preference is persisted to `localStorage`.

---

## Decisions

| Question | Decision |
|---|---|
| Palette | Dark Slate — teal-tinted charcoal |
| Toggle placement | HR topbar, icon button (sun/moon) next to bell |
| Persistence | `localStorage` only |
| Scope | HR layout only — employee screens always light |
| Implementation method | CSS variable override in `.dark {}` block |

---

## Architecture

### How it works

1. The HR layout wrapper div receives the `dark` CSS class when dark mode is active.
2. A `.dark { }` block in `globals.css` redefines all `--color-*` tokens with dark values.
3. CSS custom properties cascade down through the HR layout tree — employee screens (separate route) are unaffected.
4. A `useDarkMode` hook manages state, reads/writes `localStorage`, and returns `[isDark, toggle]`.
5. The HR layout reads the hook and applies the `dark` class to its wrapper div.

No flash-prevention script needed (dark class is applied at the HR layout level, not `<html>`).

### Files changed

| File | Change |
|---|---|
| `app/globals.css` | Add `.dark { }` block with all dark token overrides |
| `lib/hooks/use-dark-mode.ts` | New — manages isDark state + localStorage + class toggle |
| `components/ui/dark-mode-toggle.tsx` | New — sun/moon icon button using the hook |
| `components/layouts/hr-topbar.tsx` | Add `<DarkModeToggle />` next to bell icon |
| `app/[locale]/hr/layout.tsx` | Apply `dark` class to root wrapper div via hook |

---

## Dark Token Palette (Dark Slate)

The primary color `#2DBD8F` and all status badge colors are unchanged — they work on dark backgrounds without adjustment.

| Token | Light | Dark |
|---|---|---|
| `--color-bg-page` | `#E4EDEA` | `#0F1A16` |
| `--color-bg-canvas` | `#FFFFFF` | `#1A2820` |
| `--color-bg-sidebar` | `#FFFFFF` | `#141F1A` |
| `--color-bg-secondary` | `#F9FAFB` | `#162218` |
| `--color-bg-tag` | `#E8F5F0` | `#1A2820` |
| `--color-text-primary` | `#1A1D1B` | `#F0FDF4` |
| `--color-text-secondary` | `#6B7280` | `#9CA3AF` |
| `--color-text-muted` | `#9CA3AF` | `#6B7280` |
| `--color-text-link` | `#2DBD8F` | `#2DBD8F` |
| `--color-border` | `#E5E7EB` | `#2A3D34` |
| `--color-border-light` | `#F3F4F6` | `#1E2E26` |
| `--color-primary-bg` | `#E8F5F0` | `#1A2820` |
| `--color-primary-subtle` | `#F2FAF6` | `#141F1A` |
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.06)...` | `0 1px 3px rgba(0,0,0,0.30)...` |
| `--shadow-hover` | `0 4px 12px rgba(0,0,0,0.08)` | `0 4px 12px rgba(0,0,0,0.40)` |
| `--shadow-modal` | `0 8px 32px rgba(0,0,0,0.12)` | `0 8px 32px rgba(0,0,0,0.50)` |

### shadcn/ui bridge variables (dark overrides)

| Variable | Dark |
|---|---|
| `--background` | `23 26% 10%` |
| `--foreground` | `140 60% 97%` |
| `--card` | `150 22% 15%` |
| `--card-foreground` | `140 60% 97%` |
| `--popover` | `150 22% 15%` |
| `--popover-foreground` | `140 60% 97%` |
| `--secondary` | `150 15% 18%` |
| `--secondary-foreground` | `140 60% 97%` |
| `--muted` | `150 15% 18%` |
| `--muted-foreground` | `150 10% 60%` |
| `--border` | `150 20% 22%` |
| `--input` | `150 20% 22%` |

---

## Component Details

### `useDarkMode` hook

```ts
// Returns [isDark, toggle]
// On mount: reads 'payday-dark-mode' from localStorage
// On toggle: flips state, saves to localStorage
```

### `DarkModeToggle` button

- 32×32px icon button, teal ring on hover
- Sun icon when dark mode is off, moon icon when on
- ARIA label: "เปิด/ปิดโหมดสีเข้ม"
- Placed in HR topbar between bell and avatar

### HR Layout integration

```tsx
// app/[locale]/hr/layout.tsx
const [isDark] = useDarkMode()
<div className={cn('hr-layout', isDark && 'dark')}>
```

---

## Out of scope

- Employee screens (always light)
- System preference (`prefers-color-scheme`) — not used, localStorage only
- Per-user backend persistence
- Dark mode for charts (recharts uses inline styles — acceptable for stretch goal)

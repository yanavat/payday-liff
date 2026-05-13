# Phase 9.6 + 9.7 — HR Screen API Integration & UX Hardening

**Date:** 2026-05-13  
**Scope:** Replace all mock data in HR screens with real API calls; establish shared UX infrastructure for loading, error, and resilience patterns.

---

## Approach

Infrastructure first, then screens sequentially. The UX components (`ApiErrorBoundary`, skeletons, `getApiErrorMessage`) are built once and applied to every HR screen as it is wired. Actions use confirmed-then-refresh (no optimistic UI).

---

## Section 1 — UX Infrastructure (Phase 9.7 foundation)

### `ApiErrorBoundary` component

A React class component at `components/ui/api-error-boundary.tsx`.

- Wraps each HR page at the route level
- On any uncaught error or API failure, renders a centered card with the error message, a "Try again" button (resets boundary state), and a secondary "Back to Dashboard" link
- Accepts an optional `fallback` prop to override the default card per page
- Used in 8 HR page wrappers

### Skeleton components (`components/ui/`)

Two new components, both using Tailwind `animate-pulse`:

- **`MetricCardSkeleton`** — pulsing placeholder matching dashboard stat card dimensions; used 4× on Dashboard and wherever summary stats appear
- **`TableRowSkeleton`** — pulsing 5-column row; rendered 5× while list data is loading (Request List, Employee List)

### Hook upgrades

All hooks in `lib/api/hooks/` receive two additions:

1. **`AbortController` cleanup** — each hook's `useEffect` creates a controller and cancels the in-flight fetch on unmount, preventing state updates on unmounted components
2. **`retry()` function** — re-runs the fetch manually; returned from each hook alongside `data`, `loading`, `error`; used by the "Try again" button in `ApiErrorBoundary`

### `getApiErrorMessage(error, t)` utility

Added to `lib/api/client.ts` (or a small `lib/api/errors.ts`). Maps status codes to localized strings via the existing `t()` i18n function:

| Status | Message key |
|--------|-------------|
| 401 | `api.error.sessionExpired` |
| 403 | `api.error.noPermission` |
| 422 | `error.details` from API response body |
| 5xx | `api.error.serverError` |
| network | `api.error.networkError` |

### Single-retry in `ApiClient`

`getApiClient()` wraps network errors and 5xx responses with one automatic retry after 1 second. 4xx responses are not retried. Implemented inside `ApiClient.handleResponse()`.

### `useOnlineStatus()` hook

`lib/api/hooks/use-online-status.ts` — returns `{ isOnline: boolean }` using `navigator.onLine` + `window` `online`/`offline` event listeners. The existing `OfflineBanner` in the employee shell is already wired; the HR shell gets the same banner connected to this hook.

---

## Section 2 — HR Screen Wiring (Phase 9.6)

Each screen: wrapped in `ApiErrorBoundary`, mock imports removed, skeleton shown while loading, errors rendered via `getApiErrorMessage`.

### Implementation order

#### 1. Dashboard (`components/hr/dashboard-page.tsx`)
- Replace 4 mock metric cards with aggregated data from `useEWARequests` + `useEmployees`
- Recent requests table: `useEWARequests({ limit: 5, sort: 'desc' })`
- Loading: `MetricCardSkeleton` × 4 + `TableRowSkeleton` × 5

#### 2. Request List (`components/hr/request-list-page.tsx`)
- Replace `seedRequests` with `useEWARequests({ status, employeeId, dateFrom, dateTo, page, limit })`
- Filter UI state drives hook params directly (no separate fetch trigger)
- Pagination: update `page` param, hook re-fetches
- Loading: `TableRowSkeleton` × 5

#### 3. Request Detail drawer + actions (`components/hr/request-detail-drawer.tsx`)
- Drawer already receives `EWARequest` data as props from the Request List (no separate fetch needed)
- Approve / Reject / Disburse: each calls `useEWARequestActions()` mutation
  - Button shows spinner while in-flight
  - On success: close drawer + call `refetch()` on the Request List (passed as `onActionSuccess` prop)
  - On error: inline toast below the action button via `getApiErrorMessage`

#### 4. Employees (`components/hr/employees-page.tsx`)
- Replace `employees` mock with `useEmployees({ search, departmentId, page })`
- Search input drives `search` param with debounce (300ms)
- Loading: `TableRowSkeleton` × 5

#### 5. Settings (`components/hr/settings-page.tsx`)
- Replace mock policy values with `useSettings()` + `useEwaPolicy()`
- Save: patch mutation, spinner on save button, refetch on success
- Loading: input skeleton (inline pulse on each field)

#### 6. Reports (`components/hr/reports-page.tsx`)
- Replace mock chart data with `useEWARequests` aggregated by department/month
- Stat summary cards: `MetricCardSkeleton` while loading
- Charts: rendered only when data resolves (no skeleton for charts — empty chart placeholder instead)

#### 7. On-Behalf Request (`components/hr/on-behalf-request-page.tsx`)
- Employee lookup: replace `employees` mock with `useEmployees({ search })` live search (300ms debounce)
- Submission: `useEWARequestActions().createOnBehalf()`
- Loading/error: same confirmed-then-refresh pattern as Request Detail actions

---

## Section 3 — Remaining Phase 9.7 Items

| Task | Approach |
|------|----------|
| Loading states | Skeletons for tables/cards, spinners for action buttons |
| Error boundary | `ApiErrorBoundary` per HR page |
| User-friendly errors | `getApiErrorMessage(error, t)` utility |
| Retry logic | Single auto-retry (1s) for network + 5xx in `ApiClient` |
| Optimistic UI | **Not implementing** — confirmed-then-refresh chosen |
| Request cancellation | `AbortController` cleanup in all hooks |
| Offline detection | `useOnlineStatus()` + `OfflineBanner` in HR shell |

---

## Out of Scope

- Phase 9.5 remaining (employee Profile screen, PIN confirmation code flow, real-time balance) — separate session
- Phase 9.8 (validation, integration tests, E2E) — separate session
- Employee LIFF screens — already in progress separately

---

## File Inventory

**New files:**
- `components/ui/api-error-boundary.tsx`
- `components/ui/metric-card-skeleton.tsx`
- `components/ui/table-row-skeleton.tsx`
- `lib/api/hooks/use-online-status.ts`
- `lib/api/errors.ts`

**Modified files:**
- `lib/api/client.ts` — single retry logic
- `lib/api/hooks/*.ts` — AbortController + retry() on all hooks
- `components/hr/dashboard-page.tsx`
- `components/hr/request-list-page.tsx`
- `components/hr/request-detail-drawer.tsx`
- `components/hr/employees-page.tsx`
- `components/hr/settings-page.tsx`
- `components/hr/reports-page.tsx`
- `components/hr/on-behalf-request-page.tsx`
- `components/layouts/hr-layout.tsx` (`HRLayoutShell`) — add `OfflineBanner`

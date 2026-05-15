# Phase 9.5 Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the four remaining Phase 9.5 tasks: mock OTP confirmation flow, E-5 Profile real API, LINE picture fallback, and 30-second balance polling on E-2 Home.

**Architecture:** Approach A — minimal wire-up. Add a `useLinkedEmployeeId()` hook to `liff-auth-gate.tsx` so any LIFF screen can resolve the current employee ID from localStorage. Wire that ID into three screens using existing hooks (`useEmployee`, `useEmployeeCurrentPeriod`, `useEWARequests`, `useSettingsActions`). OTP service is a pure TS module (no class) with a module-level Map for in-memory code state.

**Tech Stack:** Next.js 15, TypeScript, React hooks, vitest + @testing-library/react, existing API hook layer.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `components/liff-auth-gate.tsx` | Modify | Export `useLinkedEmployeeId()` hook |
| `lib/api/services/otp.ts` | Create | Mock OTP service: `sendCode`, `verifyCode` |
| `lib/api/services/otp.test.ts` | Create | Unit tests for OTP service |
| `components/liff-request-page.tsx` | Modify | Replace hardcoded `000000` with OTP service |
| `components/liff-request-page.test.tsx` | Modify | Mock OTP service, async assertions |
| `components/liff-profile-page.tsx` | Modify | Wire `useEmployee`, `useSettingsActions`, initials fallback |
| `components/liff-profile-page.test.tsx` | Modify | Mock employee/settings hooks |
| `components/liff-home-page.tsx` | Modify | Wire `useEmployeeCurrentPeriod`, `useEWARequests`, polling |
| `components/liff-home-page.test.tsx` | Modify | Mock API hooks, test polling |

---

## Task 1: Export `useLinkedEmployeeId` from liff-auth-gate

**Files:**
- Modify: `components/liff-auth-gate.tsx`

- [ ] **Step 1: Add the exported hook at the bottom of the public API section (after `useLiffProfile`)**

In `components/liff-auth-gate.tsx`, after the `useLiffProfile` function (line 28), add:

```tsx
export function useLinkedEmployeeId(): string {
  const profile = useLiffProfile()
  if (!profile?.userId) return ''
  try {
    const links = JSON.parse(
      localStorage.getItem(EMPLOYEE_LINKS_STORAGE_KEY) ?? '{}'
    ) as Record<string, string>
    return links[profile.userId] ?? ''
  } catch {
    return ''
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
rtk tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add components/liff-auth-gate.tsx
rtk git commit -m "feat: export useLinkedEmployeeId hook from liff-auth-gate"
```

---

## Task 2: Create OTP Service

**Files:**
- Create: `lib/api/services/otp.ts`
- Create: `lib/api/services/otp.test.ts`

The mock code is `123456`. The service stores pending codes in a module-level Map keyed by `codeId`. Each entry expires after 5 minutes.

- [ ] **Step 1: Write the failing test first**

Create `lib/api/services/otp.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { sendCode, verifyCode } from './otp'

afterEach(() => {
  vi.useRealTimers()
})

describe('OTP service — sendCode', () => {
  it('returns a codeId containing the employeeId and a future expiresAt', async () => {
    const result = await sendCode('EMP-001')
    expect(result.codeId).toContain('EMP-001')
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })
})

describe('OTP service — verifyCode', () => {
  it('returns valid: true for the correct code 123456', async () => {
    const { codeId } = await sendCode('EMP-001')
    expect((await verifyCode(codeId, '123456')).valid).toBe(true)
  })

  it('returns valid: false for a wrong code', async () => {
    const { codeId } = await sendCode('EMP-001')
    expect((await verifyCode(codeId, '999999')).valid).toBe(false)
  })

  it('returns valid: false for an unknown codeId', async () => {
    expect((await verifyCode('no-such-id', '123456')).valid).toBe(false)
  })

  it('returns valid: false after 5 minutes (expiry)', async () => {
    vi.useFakeTimers()
    const { codeId } = await sendCode('EMP-001')
    vi.advanceTimersByTime(5 * 60 * 1000 + 1)
    expect((await verifyCode(codeId, '123456')).valid).toBe(false)
  })

  it('code is single-use: valid: false on second verify', async () => {
    const { codeId } = await sendCode('EMP-001')
    await verifyCode(codeId, '123456')
    expect((await verifyCode(codeId, '123456')).valid).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```bash
rtk vitest run lib/api/services/otp.test.ts
```

Expected: fails with "Cannot find module './otp'".

- [ ] **Step 3: Implement the OTP service**

Create `lib/api/services/otp.ts`:

```ts
export interface SendCodeResponse {
  codeId: string
  expiresAt: string
}

export interface VerifyCodeResponse {
  valid: boolean
}

const MOCK_CODE = '123456'
const TTL_MS = 5 * 60 * 1000

const pendingCodes = new Map<string, { code: string; expiresAt: number }>()

export async function sendCode(employeeId: string): Promise<SendCodeResponse> {
  const codeId = `${employeeId}-${Date.now()}`
  const expiresAt = Date.now() + TTL_MS
  pendingCodes.set(codeId, { code: MOCK_CODE, expiresAt })
  return { codeId, expiresAt: new Date(expiresAt).toISOString() }
}

export async function verifyCode(codeId: string, code: string): Promise<VerifyCodeResponse> {
  const pending = pendingCodes.get(codeId)
  if (!pending || Date.now() > pending.expiresAt) return { valid: false }
  if (pending.code !== code) return { valid: false }
  pendingCodes.delete(codeId)
  return { valid: true }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
rtk vitest run lib/api/services/otp.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
rtk git add lib/api/services/otp.ts lib/api/services/otp.test.ts
rtk git commit -m "feat: add mock OTP service with sendCode/verifyCode"
```

---

## Task 3: Wire OTP Service into liff-request-page

**Files:**
- Modify: `components/liff-request-page.tsx`
- Modify: `components/liff-request-page.test.tsx`

The correct OTP is now `123456` (from the mock service). The `confirmRequest` function becomes async. A `useEffect` calls `sendCode` when the user reaches step 2.

- [ ] **Step 1: Update the test file first**

Replace the contents of `components/liff-request-page.test.tsx` with the following (preserves all existing tests, adds OTP service mock, converts affected assertions to async):

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'
import { loadLiffClient } from '@/lib/liff-client'

const { confettiMock } = vi.hoisted(() => ({ confettiMock: vi.fn() }))
vi.mock('canvas-confetti', () => ({ default: confettiMock }))

vi.mock('@/lib/liff-client', () => ({
  loadLiffClient: vi.fn(() => Promise.resolve({ isInClient: () => false, shareTargetPicker: vi.fn() })),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className, style }: { href: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <a href={href} className={className} style={style}>{children}</a>
  ),
}))

vi.mock('@/lib/api/services/otp', () => ({
  sendCode: vi.fn().mockResolvedValue({ codeId: 'test-code-id', expiresAt: new Date(Date.now() + 300_000).toISOString() }),
  verifyCode: vi.fn().mockImplementation(async (_codeId: string, code: string) => ({
    valid: code === '123456',
  })),
}))

vi.mock('@/components/liff-auth-gate', () => ({
  useLiffProfile: () => null,
  useLinkedEmployeeId: () => 'EMP-001',
}))

import { sendCode, verifyCode } from '@/lib/api/services/otp'
import { LiffRequestPage } from './liff-request-page'

const messages = {
  ...defaultMessages,
  common: {
    ...defaultMessages.common,
    next: 'Next',
    error: 'An error occurred',
    confirm: 'Confirm',
    employeeName: 'Employee Name',
    employeeId: 'Employee ID',
    requestDate: 'Request Date',
    status: 'Status',
    success: 'Your request has been submitted',
  },
  requestWizard: {
    step1: 'Select Amount',
    step2: 'Confirm',
    step3: 'Done',
    availableBalance: 'Available Balance',
    customAmount: 'Custom Amount',
    amountError: 'Amount exceeds your limit',
    remainingBalance: 'Remaining balance',
    reason: 'Reason',
    reasons: {
      emergency: 'Emergency',
      medical: 'Medical expenses',
      education: 'Education',
      utility: 'Utilities',
      other: 'Other',
    },
    summaryCard: 'Summary',
    requestedAmount: 'Requested Amount',
    transferFee: 'Transfer Fee',
    netTransferAmount: 'Net Transfer Amount',
    bankAccount: 'Bank Account',
    deductionWarning: 'Will be deducted on {date}',
    enterPin: 'Confirm with PIN',
    editBack: 'Edit',
    successTitle: 'Request Submitted!',
    referenceNumber: 'Reference Number',
    backToHome: 'Back to Home',
    shareReceipt: 'Share Receipt',
    shareReceiptText: 'Advance request submitted\nAmount: {amount}\nReference: {reference}',
    withdrawAll: 'Withdraw All',
    otpLabel: 'Confirmation code (OTP)',
    otpHint: 'Enter the code sent to you',
    invalidOtp: 'Invalid code',
  },
}

function goToStep2() {
  fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
}

describe('LiffRequestPage — step 1', () => {
  beforeEach(() => renderWithIntl(<LiffRequestPage />, { messages }))

  it('shows available balance', () => {
    expect(screen.getByText('Available Balance')).toBeInTheDocument()
    expect(screen.getByText('฿3,500')).toBeInTheDocument()
  })

  it('renders quick amount buttons', () => {
    expect(screen.getByRole('button', { name: '฿1,000' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '฿2,000' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '฿3,000' })).toBeInTheDocument()
  })

  it('disables Next button when amount is invalid', () => {
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '9999' } })
    expect(screen.getByRole('button', { name: /Next →/i })).toBeDisabled()
  })

  it('advances to step 2 with valid amount', () => {
    goToStep2()
    expect(screen.getByText('Summary')).toBeInTheDocument()
  })
})

describe('LiffRequestPage — step 2 OTP', () => {
  beforeEach(() => {
    vi.mocked(sendCode).mockClear()
    vi.mocked(verifyCode).mockClear()
    renderWithIntl(<LiffRequestPage />, { messages })
    goToStep2()
  })

  it('calls sendCode with the employee ID when entering step 2', async () => {
    await waitFor(() => expect(sendCode).toHaveBeenCalledWith('EMP-001'))
  })

  it('shows OTP input', () => {
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument()
  })

  it('shows OTP label', () => {
    expect(screen.getByText('Confirmation code (OTP)')).toBeInTheDocument()
  })

  it('Confirm button is disabled until 6 digits are entered', () => {
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } })
    expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeDisabled()
  })

  it('shows error and stays on step 2 when wrong OTP is entered', async () => {
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '111111' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await screen.findByText('Invalid code')
    expect(screen.getByText('Summary')).toBeInTheDocument()
  })

  it('advances to step 3 with correct OTP 123456', async () => {
    await waitFor(() => expect(sendCode).toHaveBeenCalled())
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await screen.findByText('Request Submitted!')
  })

  it('back button returns to step 1', () => {
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }))
    expect(screen.getByText('Available Balance')).toBeInTheDocument()
  })
})

describe('LiffRequestPage — step 3 success', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    renderWithIntl(<LiffRequestPage />, { messages })
    goToStep2()
    vi.useRealTimers()
    await waitFor(() => expect(sendCode).toHaveBeenCalled())
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await screen.findByText('Request Submitted!')
  })

  afterEach(() => {
    vi.useRealTimers()
    confettiMock.mockClear()
  })

  it('shows success title and receipt', () => {
    expect(screen.getByText('Request Submitted!')).toBeInTheDocument()
    expect(screen.getByText('Reference Number')).toBeInTheDocument()
  })

  it('back-to-home link points to LIFF root', () => {
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/')
  })

  it('hides share button when not in LINE client', () => {
    expect(screen.queryByRole('button', { name: /Share Receipt/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run updated tests to confirm they fail (OTP service not yet wired)**

```bash
rtk vitest run components/liff-request-page.test.tsx
```

Expected: "calls sendCode" and "advances to step 3 with correct OTP 123456" fail; "advances to step 3 with correct OTP 000000" no longer exists.

- [ ] **Step 3: Update liff-request-page.tsx**

Replace the import block at the top:

```tsx
'use client'

import { useMemo, useState, useEffect } from 'react'
import { Check, Share2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { QuickAmountButton } from '@/components/ui/quick-amount-button'
import { StatusBadge } from '@/components/ui/status-badge'
import { StepIndicator } from '@/components/ui/step-indicator'
import { currentEmployee } from '@/lib/mock/currentUser'
import { formatTHB } from '@/lib/utils/format'
import { DEFAULT_TRANSFER_FEE_THB, getNetTransferAmount } from '@/lib/utils/fees'
import { loadLiffClient } from '@/lib/liff-client'
import { withLiffLocale } from '@/lib/liff-routes'
import { sendCode, verifyCode } from '@/lib/api/services/otp'
import { useLinkedEmployeeId } from '@/components/liff-auth-gate'
```

Inside `LiffRequestPage`, after the existing state declarations, add:

```tsx
const [codeId, setCodeId] = useState('')
const [otpLoading, setOtpLoading] = useState(false)
const employeeId = useLinkedEmployeeId()
```

Add a `useEffect` after the confetti `useEffect` (around line 84):

```tsx
useEffect(() => {
  if (step !== 2 || !employeeId) return
  let cancelled = false
  sendCode(employeeId).then(({ codeId: id }) => {
    if (!cancelled) setCodeId(id)
  })
  return () => { cancelled = true }
}, [step, employeeId])
```

Replace the `confirmRequest` function:

```tsx
async function confirmRequest() {
  if (!codeId) return
  setOtpLoading(true)
  try {
    const result = await verifyCode(codeId, otp)
    if (!result.valid) {
      setOtp('')
      setOtpError(t('invalidOtp'))
      return
    }
    setStep(3)
  } finally {
    setOtpLoading(false)
  }
}
```

Update the Confirm button's `onClick` and `disabled`:

```tsx
<button
  type="button"
  disabled={otp.length < 6 || otpLoading || !codeId}
  onClick={() => { void confirmRequest() }}
  className="flex h-[52px] w-full items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white shadow-card transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
>
  {tc('confirm')}
</button>
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
rtk vitest run components/liff-request-page.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: TypeScript check**

```bash
rtk tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
rtk git add components/liff-request-page.tsx components/liff-request-page.test.tsx
rtk git commit -m "feat: wire OTP service into LIFF request confirmation flow"
```

---

## Task 4: Update E-5 Profile Screen with Real API

**Files:**
- Modify: `components/liff-profile-page.tsx`
- Modify: `components/liff-profile-page.test.tsx`

Wire `useEmployee` for bank/name data. Notification toggles call `updateNotifications` optimistically. Avatar fallback uses `employee.nameTh` instead of mock.

- [ ] **Step 1: Add new tests for API behavior**

Open `components/liff-profile-page.test.tsx` and add these mocks and test cases.

At the top of the file, add these mocks (after the existing mocks):

```tsx
vi.mock('@/lib/api/hooks/use-employees', () => ({
  useEmployee: vi.fn(() => ({
    data: {
      id: 'EMP-001',
      name: 'Somchai Smith',
      nameTh: 'สมชาย สมิธ',
      employeeCode: 'E001',
      department: 'Production',
      position: 'Operator',
      payCycle: 'monthly' as const,
      workType: 'onsite' as const,
      baseSalary: 18000,
      bankAccountMasked: 'xxx-x-xx123-4',
      bankName: 'KBANK',
      ewaStatus: 'eligible' as const,
      enrolledAt: '2024-01-01',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

const updateNotificationsMock = vi.fn().mockResolvedValue({})
vi.mock('@/lib/api/hooks/use-settings', () => ({
  useSettingsActions: vi.fn(() => ({
    updateNotifications: updateNotificationsMock,
    updateSettings: vi.fn(),
    updatePolicy: vi.fn(),
    loading: false,
    error: null,
  })),
}))

vi.mock('@/components/liff-auth-gate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/liff-auth-gate')>()
  return {
    ...actual,
    useLiffProfile: vi.fn(() => ({
      userId: 'U1234567890',
      displayName: 'Mock LINE User',
      pictureUrl: 'https://profile.line.example/avatar.jpg',
    })),
    useLinkedEmployeeId: vi.fn(() => 'EMP-001'),
  }
})
```

Add new `it` blocks inside the existing `describe('LiffProfilePage')`:

```tsx
it('shows employee bank account from API', () => {
  renderWithIntl(<LiffProfilePage />, { messages })
  expect(screen.getByText('xxx-x-xx123-4')).toBeInTheDocument()
})

it('calls updateNotifications when approval toggle changes', async () => {
  renderWithIntl(<LiffProfilePage />, { messages })
  const approvalToggle = screen.getByRole('button', { name: /Notify on approval/i })
  fireEvent.click(approvalToggle)
  await waitFor(() => expect(updateNotificationsMock).toHaveBeenCalledOnce())
})

it('uses employee nameTh for Avatar initials when pictureUrl is absent', () => {
  const { useLiffProfile } = require('@/components/liff-auth-gate')
  vi.mocked(useLiffProfile).mockReturnValueOnce({
    userId: 'U9999',
    displayName: 'No Picture',
    pictureUrl: undefined,
  })
  renderWithIntl(<LiffProfilePage />, { messages })
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})
```

Also add `import { waitFor } from '@testing-library/react'` to the test file imports.

- [ ] **Step 2: Run updated tests to confirm new tests fail**

```bash
rtk vitest run components/liff-profile-page.test.tsx
```

Expected: the 3 new tests fail; existing 5 tests pass.

- [ ] **Step 3: Update liff-profile-page.tsx imports**

Add to the import block:

```tsx
import { useEmployee } from '@/lib/api/hooks/use-employees'
import { useSettingsActions } from '@/lib/api/hooks/use-settings'
import { useLinkedEmployeeId } from '@/components/liff-auth-gate'
```

Remove:

```tsx
import { currentEmployee } from '@/lib/mock/currentUser'
```

- [ ] **Step 4: Update LiffProfilePage component body**

Replace the current state and mock data initialization at the start of `LiffProfilePage`:

```tsx
export function LiffProfilePage() {
  const t = useTranslations()
  const locale = useLocale()
  const profile = useLiffProfile()
  const employeeId = useLinkedEmployeeId()
  const { data: employee } = useEmployee(employeeId)
  const { updateNotifications } = useSettingsActions()

  const [approval, setApproval] = useState(true)
  const [payday, setPayday] = useState(true)
  const [line, setLine] = useState(true)
  const [showEditBank, setShowEditBank] = useState(false)

  const [bankCode, setBankCode] = useState('')
  const [accountMasked, setAccountMasked] = useState('')
  const [holderName, setHolderName] = useState('')

  useEffect(() => {
    if (!employee) return
    setBankCode(employee.bankName)
    setAccountMasked(employee.bankAccountMasked)
    setHolderName(employee.nameTh)
  }, [employee])
```

- [ ] **Step 5: Update Avatar initials in the profile header section**

Find this block in the JSX:

```tsx
) : (
  <Avatar
    initials={currentEmployee.nameTh}
    size="xl"
    color="teal"
    className="mx-auto shadow-lg ring-4 ring-white/50"
  />
)}
```

Replace with:

```tsx
) : (
  <Avatar
    initials={employee?.nameTh ?? profile?.displayName ?? ''}
    size="xl"
    color="teal"
    className="mx-auto shadow-lg ring-4 ring-white/50"
  />
)}
```

- [ ] **Step 6: Update profile header name/id/department**

Find:

```tsx
<h1 className="mt-3 text-[22px] font-bold leading-tight text-white">
  {profile?.displayName || currentEmployee.nameTh}
</h1>
...
<p className="mt-1 text-[15px] text-white/80">
  {currentEmployee.id} · {currentEmployee.department}
</p>
```

Replace with:

```tsx
<h1 className="mt-3 text-[22px] font-bold leading-tight text-white">
  {profile?.displayName || employee?.nameTh || ''}
</h1>
...
<p className="mt-1 text-[15px] text-white/80">
  {employee?.employeeCode ?? ''} · {employee?.department ?? ''}
</p>
```

- [ ] **Step 7: Update PayCycleBadge**

Find:

```tsx
<PayCycleBadge
  type={currentEmployee.payCycle}
  className="border-white/30 bg-white/20 text-white"
/>
```

Replace with:

```tsx
{employee && (
  <PayCycleBadge
    type={employee.payCycle}
    className="border-white/30 bg-white/20 text-white"
  />
)}
```

- [ ] **Step 8: Wire notification toggles to updateNotifications**

Replace the three `ToggleRow` elements in the notifications section:

```tsx
<ToggleRow
  icon={<Bell className="h-5 w-5" />}
  label={t('profile.notifyApproved')}
  checked={approval}
  onChange={(v) => {
    setApproval(v)
    void updateNotifications({ onApproval: { line: v }, onRejection: { line: v } })
      .catch(() => setApproval(!v))
  }}
/>
<ToggleRow
  icon={<Bell className="h-5 w-5" />}
  label={t('profile.notifyPayday')}
  checked={payday}
  onChange={(v) => {
    setPayday(v)
    void updateNotifications({ onPaydayReminder: { line: v }, onCutoffWarning: { line: v } })
      .catch(() => setPayday(!v))
  }}
/>
<ToggleRow
  icon={<MessageCircle className="h-5 w-5" />}
  label={t('profile.notifyLine')}
  checked={line}
  onChange={(v) => {
    setLine(v)
    void updateNotifications({
      onApproval: { line: v },
      onRejection: { line: v },
      onDisbursement: { line: v },
      onPaydayReminder: { line: v },
      onCutoffWarning: { line: v },
    }).catch(() => setLine(!v))
  }}
/>
```

- [ ] **Step 9: Run all profile tests**

```bash
rtk vitest run components/liff-profile-page.test.tsx
```

Expected: all 8 tests pass.

- [ ] **Step 10: TypeScript check**

```bash
rtk tsc --noEmit
```

Expected: no errors.

- [ ] **Step 11: Commit**

```bash
rtk git add components/liff-profile-page.tsx components/liff-profile-page.test.tsx
rtk git commit -m "feat: wire E-5 Profile to real employee API and notification settings"
```

---

## Task 5: Wire Balance API + Polling into E-2 Home Screen

**Files:**
- Modify: `components/liff-home-page.tsx`
- Modify: `components/liff-home-page.test.tsx`

Replace all hardcoded balance constants and mock data with `useEmployeeCurrentPeriod` and `useEWARequests`. Add 30-second polling. Show skeleton shimmer only on initial load (when `loading && !data`).

- [ ] **Step 1: Update home page tests**

Replace the entire contents of `components/liff-home-page.test.tsx`:

```tsx
import { screen, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'

const refetchPeriodMock = vi.fn()
const refetchRequestsMock = vi.fn()

vi.mock('@/components/liff-auth-gate', () => ({
  useLiffProfile: vi.fn(() => ({
    userId: 'U1234567890',
    displayName: 'Mock LINE User',
    pictureUrl: 'https://profile.line.example/avatar.jpg',
  })),
  useLinkedEmployeeId: vi.fn(() => 'EMP-001'),
}))

vi.mock('@/lib/api/hooks/use-employees', () => ({
  useEmployeeCurrentPeriod: vi.fn(() => ({
    data: {
      type: 'monthly',
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
      paydayDate: '2026-05-31',
      cutoffDate: '2026-05-25',
      daysElapsed: 14,
      totalDays: 31,
      earnedToDate: 9200,
      workedDays: 14,
      totalWorkDays: 31,
      previousEWAThisPeriod: 1100,
      maxWithdrawable: 4600,
    },
    loading: false,
    error: null,
    refetch: refetchPeriodMock,
  })),
}))

vi.mock('@/lib/api/hooks/use-ewa-requests', () => ({
  useEWARequests: vi.fn(() => ({
    data: { data: [], total: 0, limit: 3, offset: 0 },
    loading: false,
    error: null,
    refetch: refetchRequestsMock,
  })),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { LiffHomePage } from './liff-home-page'

const messages = {
  ...defaultMessages,
  common: {
    ...defaultMessages.common,
    viewAll: 'View all',
  },
  home: {
    greeting: 'Hello, {name}',
    heroTitle: 'Available Balance',
    requestCta: 'Request Advance',
    payPeriod: 'Pay Period',
    cutoffWarning: 'Cutoff in {days} days',
    paydayCountdown: 'Payday in {days} days',
    recentRequests: 'Recent Requests',
    viewAllHistory: 'View all history',
    earnedWage: 'Earned wage',
    maxAllowed: 'Max allowed',
    previousAdvance: 'Withdrawn',
    remaining: 'Remaining',
    dayProgress: 'Day {elapsed} / {total}',
    requestItemTitle: 'Advance request',
    loading: 'Loading...',
  },
  status: {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    disbursed: 'Disbursed',
  },
  nav: {
    profile: 'Profile',
  },
}

describe('LiffHomePage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    refetchPeriodMock.mockClear()
    refetchRequestsMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the employee home screen with the LINE profile picture', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })

    expect(screen.getByRole('heading', { name: 'Hello, Mock LINE User' })).toBeInTheDocument()
    expect(screen.getByAltText('Mock LINE User')).toHaveAttribute('src', 'https://profile.line.example/avatar.jpg')
    expect(screen.getByText('Available Balance')).toBeInTheDocument()
    expect(screen.getByText('Recent Requests')).toBeInTheDocument()
  })

  it('renders the available balance from currentPeriod API data', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    // available = maxWithdrawable (4600) - previousEWAThisPeriod (1100) = 3500
    expect(screen.getAllByText('฿3,500').length).toBeGreaterThan(0)
  })

  it('renders pay period progress from currentPeriod data', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    expect(screen.getByText('Day 14 / 31')).toBeInTheDocument()
  })

  it('sets up a 30-second polling interval on mount', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    act(() => { vi.advanceTimersByTime(30_000) })
    expect(refetchPeriodMock).toHaveBeenCalledTimes(1)
    expect(refetchRequestsMock).toHaveBeenCalledTimes(1)
  })

  it('clears polling interval on unmount', () => {
    const { unmount } = renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    unmount()
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(refetchPeriodMock).toHaveBeenCalledTimes(0)
    expect(refetchRequestsMock).toHaveBeenCalledTimes(0)
  })

  it('does not render hardcoded Thai copy when locale is English', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    expect(screen.queryByText('วงเงินที่เบิกได้')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run updated tests to confirm new tests fail**

```bash
rtk vitest run components/liff-home-page.test.tsx
```

Expected: "renders the available balance from currentPeriod API data", "renders pay period progress", "sets up a 30-second polling interval", and "clears polling interval" fail.

- [ ] **Step 3: Update liff-home-page.tsx imports**

Replace the current import block with:

```tsx
"use client";

import { useEffect } from "react";
import { AlertTriangle, WalletCards } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { useLiffProfile, useLinkedEmployeeId } from "@/components/liff-auth-gate";
import { ProgressBar } from "@/components/ui/progress-bar";
import { withLiffLocale } from "@/lib/liff-routes";
import { formatTHB } from "@/lib/utils/format";
import { useEmployeeCurrentPeriod } from "@/lib/api/hooks/use-employees";
import { useEWARequests } from "@/lib/api/hooks/use-ewa-requests";
import type { EWAStatus } from "@/types";
```

- [ ] **Step 4: Replace LiffHomePage component body**

Replace the entire `LiffHomePage` function with:

```tsx
const dateLocales: Record<string, string> = {
  th: "th-TH",
  en: "en-US",
  my: "my-MM",
};

function formatRequestDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(dateLocales[locale] ?? "en-US", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function daysUntil(dateStr: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
}

const statusClasses: Record<EWAStatus, string> = {
  pending: "bg-status-pending-bg text-status-pending-text",
  approved: "bg-status-approved-bg text-status-approved-text",
  rejected: "bg-status-rejected-bg text-status-rejected-text",
  disbursed: "bg-status-disbursed-bg text-status-disbursed-text",
};

export function LiffHomePage() {
  const profile = useLiffProfile();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("home");
  const nav = useTranslations("nav");
  const status = useTranslations("status");

  const employeeId = useLinkedEmployeeId();
  const { data: currentPeriod, loading: periodLoading, refetch: refetchPeriod } =
    useEmployeeCurrentPeriod(employeeId);
  const { data: requestsData, loading: requestsLoading, refetch: refetchRequests } =
    useEWARequests({ employeeId, limit: 3 });

  useEffect(() => {
    if (!employeeId) return;
    const id = setInterval(() => {
      void refetchPeriod();
      void refetchRequests();
    }, 30_000);
    return () => clearInterval(id);
  }, [employeeId, refetchPeriod, refetchRequests]);

  const available = currentPeriod
    ? currentPeriod.maxWithdrawable - currentPeriod.previousEWAThisPeriod
    : 0;
  const earnedWage = currentPeriod?.earnedToDate ?? 0;
  const maxAllowed = currentPeriod?.maxWithdrawable ?? 0;
  const previousAdvance = currentPeriod?.previousEWAThisPeriod ?? 0;
  const daysElapsed = currentPeriod?.daysElapsed ?? 0;
  const totalDays = currentPeriod?.totalDays ?? 1;
  const daysToPayday = currentPeriod ? daysUntil(currentPeriod.paydayDate) : 0;
  const daysToCutoff = currentPeriod ? daysUntil(currentPeriod.cutoffDate) : 0;

  const recentRequests = requestsData?.data?.slice(0, 3) ?? [];
  const showBalanceSkeleton = periodLoading && !currentPeriod;
  const showRequestsSkeleton = requestsLoading && !requestsData;

  return (
    <div className="bg-bg-page pb-5">
      <header className="flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-[18px] font-semibold leading-tight text-text-primary">
            {t("greeting", { name: profile?.displayName ?? '' })}
          </h1>
          <p className="mt-1 text-[16px] text-text-muted">
            {new Intl.DateTimeFormat(dateLocales[locale] ?? "en-US", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </p>
        </div>
        <Link
          aria-label={nav("profile")}
          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-bg transition focus:outline-none focus:ring-2 focus:ring-primary/30"
          href={withLiffLocale(pathname, "/profile")}
        >
          {profile?.pictureUrl ? (
            <Image
              alt={profile.displayName}
              className="h-full w-full object-cover"
              height={48}
              src={profile.pictureUrl}
              unoptimized
              width={48}
            />
          ) : (
            <span className="text-sm font-semibold text-primary-dark">
              {(profile?.displayName ?? '').slice(0, 2)}
            </span>
          )}
        </Link>
      </header>

      <section className="mx-4 rounded-xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-hover">
        <p className="text-[16px] text-white/80">{t("heroTitle")}</p>
        {showBalanceSkeleton ? (
          <div className="mt-1 h-10 w-32 animate-pulse rounded bg-white/20" />
        ) : (
          <div className="mt-1 font-sans text-[36px] font-bold leading-tight">
            {formatTHB(available)}
          </div>
        )}
        <div className="my-4 h-px bg-white/20" />
        <div className="grid grid-cols-2 gap-3 text-[16px]">
          <div>
            <p className="text-white/70">{t("earnedWage")}</p>
            <p className="font-semibold">{formatTHB(earnedWage)}</p>
          </div>
          <div>
            <p className="text-white/70">{t("maxAllowed")}</p>
            <p className="font-semibold">{formatTHB(maxAllowed)}</p>
          </div>
          <div>
            <p className="text-white/70">{t("previousAdvance")}</p>
            <p className="font-semibold">{formatTHB(previousAdvance)}</p>
          </div>
          <div>
            <p className="text-white/70">{t("remaining")}</p>
            <p className="font-semibold">{formatTHB(available)}</p>
          </div>
        </div>
        <Link
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-white text-[16px] font-semibold text-primary"
          href={withLiffLocale(pathname, "/request")}
        >
          <WalletCards className="h-5 w-5" aria-hidden />
          {t("requestCta")}
        </Link>
      </section>

      <section className="mx-4 mt-4 rounded-lg border border-border bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-text-primary">
            {t("payPeriod")}
          </h2>
          <span className="text-[16px] font-medium text-primary">
            {t("paydayCountdown", { days: daysToPayday })}
          </span>
        </div>
        <ProgressBar value={daysElapsed} max={totalDays} height="8px" />
        <div className="mt-2 flex items-center justify-between text-[16px] text-text-muted">
          <span>{t("dayProgress", { elapsed: daysElapsed, total: totalDays })}</span>
          <span>{t("cutoffWarning", { days: daysToCutoff })}</span>
        </div>
        {daysToCutoff <= 3 && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[16px] text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>{t("cutoffWarning", { days: daysToCutoff })}</span>
          </div>
        )}
      </section>

      <section className="mx-4 mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-text-primary">
            {t("recentRequests")}
          </h2>
          <Link
            className="flex items-center text-[16px] font-medium text-primary"
            href={withLiffLocale(pathname, "/history")}
          >
            {t("viewAllHistory")}
          </Link>
        </div>
        {showRequestsSkeleton ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-bg-secondary" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {recentRequests.map((request) => {
              const [day, month] = formatRequestDate(request.requestedAt, locale).split(" ");
              return (
                <Link
                  className="flex items-center gap-3 rounded-lg border border-border bg-white p-3 shadow-card transition-shadow duration-200 hover:shadow-hover"
                  href={withLiffLocale(pathname, `/history?id=${request.id}`)}
                  key={request.id}
                >
                  <div className="w-11 text-center">
                    <div className="font-sans text-[20px] font-bold leading-none text-primary">{day}</div>
                    <div className="mt-1 text-[16px] text-text-muted">{month}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-medium text-text-primary">{t("requestItemTitle")}</p>
                    <p className="truncate font-mono text-[14px] text-text-muted">{request.referenceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-[16px] font-bold text-text-primary">{formatTHB(request.amount)}</p>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${statusClasses[request.status]}`}>
                      {status(request.status)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
rtk vitest run components/liff-home-page.test.tsx
```

Expected: all 6 tests pass.

- [ ] **Step 6: TypeScript check**

```bash
rtk tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
rtk git add components/liff-home-page.tsx components/liff-home-page.test.tsx
rtk git commit -m "feat: wire E-2 Home to real balance API with 30s polling"
```

---

## Task 6: Run Full Test Suite + Update task.md

**Files:**
- Modify: `task.md`

- [ ] **Step 1: Run the full vitest suite**

```bash
rtk vitest run
```

Expected: all tests pass with no regressions.

- [ ] **Step 2: Update task.md Phase 9.5 checkboxes**

In `task.md`, change these four lines from `[ ]` to `[x]`:

```
- [x] Replace PIN confirmation with backend-issued one-time confirmation code flow
- [x] Update E-5 Profile screen to use real API for employee profile and settings
- [x] Replace LINE profile picture with backend employee data if LINE profile unavailable
- [x] Implement real-time balance updates via polling or WebSocket
```

Update the Phase 9 progress row in the summary table:

```
| 9 · Backend API    | 52          | 47      | 90%      |
```

Update the Total row:

```
| **Total**          | **278**     | **255** | **92%**  |
```

- [ ] **Step 3: Commit all final changes**

```bash
rtk git add task.md
rtk git commit -m "chore: mark Phase 9.5 tasks complete, update progress to 47/52"
```

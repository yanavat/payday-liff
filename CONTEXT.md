# PayDay+ EWA

A multi-tenant Earned Wage Access platform. Employees of a registered company can request early withdrawal of wages they have already earned. HR users manage requests, policies, and transfers.

## Language

### Actors

**Employee**:
A worker employed by a Company who uses the LINE LIFF app to submit EWA requests.
_Avoid_: User, worker, member

**HRUser**:
A staff member of a Company who manages EWA operations via the HR portal. Has one of three roles: `hr_manager`, `accountant`, or `viewer`.
_Avoid_: Admin, operator, manager

**hr_manager**:
An HRUser with full access — can approve, reject, configure settings, import employees, and export transfers.
_Avoid_: Admin

**accountant**:
An HRUser who can view requests and perform the Export action, but cannot approve/reject or change settings.
_Avoid_: Finance, finance user

**viewer**:
An HRUser with read-only access across all pages. Cannot take any action.
_Avoid_: Read-only user

**Company**:
An employer organisation registered on the platform. All data is scoped to a Company.
_Avoid_: Client, tenant, organisation

### EWA Request Lifecycle

**EWARequest**:
A single wage withdrawal request submitted by an Employee for a specific pay period.
_Avoid_: Withdrawal, transaction, advance

**pending**:
An EWARequest that has been submitted but not yet reviewed by HR.

**approved**:
An EWARequest that an hr_manager has reviewed and accepted. Approved requests are eligible for Export.

**disbursed**:
An EWARequest whose funds have been included in an Export batch. In the HR portal this is the terminal success state. From the employee's perspective it means the transfer has been sent.
_Avoid_: settled, transferred, completed
_Note_: "disbursed" does NOT imply the bank has confirmed receipt — see ADR 0001.

**Transfer Failure**:
A disbursed EWARequest where HR has learned (via the bank portal) that the bank rejected the transfer. HR manually marks it as failed, which resets the request to `approved` so it re-enters the Export queue.
_Avoid_: Failed transfer, retry

### Finance Operations

**Export**:
The batch action where an hr_manager or accountant selects approved EWARequests, generates a CSV for bank upload, and triggers disbursement. Export is the event that sets request status to `disbursed`.
_Avoid_: Disburse (as an HR action), transfer, payout

**BankTransfer**:
A record created per EWARequest when it is Exported. Tracks the amount, bank details, and export metadata for audit purposes.
_Avoid_: Payment, transaction

**exported flag**:
A boolean field on EWARequest (`exported: true`) set at Export time. Used to prevent duplicate exports and show export history. Distinct from `status`.

### Policy

**EffectivePolicy**:
The resolved EWA rules that apply to a specific Employee — merging company-level settings with any employee-level overrides. Employee overrides take precedence.
_Avoid_: Active policy, computed policy

**EWA Override**:
Employee-specific limits (maxPercent, maxRequests, minAmount, maxAmount, ewaEnabled) that supersede the company-level EffectivePolicy for that employee only.
_Avoid_: Custom limit, employee setting

**approvalChain**:
A company policy setting controlling whether EWA requests require one approver (`single`) or two (`two_step`). Currently only `single` is implemented — the `two_step` option is hidden in settings UI until F7 is built.

## Flagged ambiguities

**"Disburse" vs "Export"**: Historically the codebase has a `disburse()` method that created a BankTransfer. After the EWA feature plan revision, "Export" is the canonical HR action. "Disbursed" remains as the EWARequest terminal status name but is triggered by Export, not by a separate Disburse button.

## Example dialogue

> Dev: "Should we let HR mark a request as disbursed directly, or does it have to go through export?"
>
> Domain expert: "It has to go through Export — that's what creates the CSV file for the bank. Disbursed just means it was included in an export batch."
>
> Dev: "What if the bank rejects it?"
>
> Domain expert: "HR sees it in the bank portal, comes back here, marks it as a Transfer Failure, and it goes back to approved so it gets picked up in the next export."
>
> Dev: "So we never auto-detect failures?"
>
> Domain expert: "Correct — there's no bank API. It's always manual."

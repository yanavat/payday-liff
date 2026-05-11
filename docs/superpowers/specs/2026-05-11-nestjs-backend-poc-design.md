# NestJS Backend POC — Design Spec

**Date:** 2026-05-11
**Status:** Approved (brainstorming → ready for implementation plan)
**Owner:** yanavat
**Scope:** Full backend POC for the PayDay+ EWA system, replacing the Next.js mock store with a real NestJS service exposed entirely via Swagger.

---

## 1. Goal

Stand up a NestJS backend that covers every domain entity in the existing PayDay+ data model so the team can drive the full Earned Wage Access workflow (employee submits → HR approves/rejects → disbursement) through Swagger UI without any frontend changes. Two new product capabilities are part of this POC:

1. **Multi-company support with hard isolation.** A user picks a company before signing in. Every resource is scoped to a `companyId`. HR users and employees belong to exactly one company.
2. **Layered EWA rules.** Each company has its own EWA policy per pay cycle. Individual employees can override any subset of policy values; nulls fall through to the company default.

Non-goals: real authentication, automated tests, production hosting, replacing the Next.js LINE routes (the backend mirrors them but the existing routes stay until cutover).

---

## 2. Decisions locked in brainstorming

| # | Decision |
|---|---|
| 1 | Cover all 9 domain modules from `data-model.md` |
| 2 | SQLite (`better-sqlite3` driver) |
| 3 | TypeORM 0.3 |
| 4 | New `backend/` folder at repo root, independent `package.json` (no workspace conversion) |
| 5 | Hybrid auth — endpoints open; required `x-company-id` header, optional `x-actor-id` |
| 6 | LINE module: real Messaging API when `LINE_CHANNEL_ACCESS_TOKEN` set, console-log stub otherwise |
| 7 | Two seeders — `seed:demo` (port the 20-employee / 30-request mocks across two companies) + `seed:bulk` (faker-driven volume) |
| 8 | No automated tests; Swagger UI is the test surface |
| 9 | Architecture C — module-per-entity with an extracted `EwaRulesService` and `RequestStateMachine` |
| 10 | Multi-company hard isolation (HR/employee belongs to exactly one company); per-employee EWA overrides on top of company policy |

---

## 3. Stack & runtime

- **NestJS 10** + TypeScript 5
- **TypeORM 0.3** with `better-sqlite3`
- `@nestjs/swagger` (with the CLI plugin so DTOs auto-generate schemas)
- `class-validator` + `class-transformer`
- `@line/bot-sdk` (used only when `LINE_CHANNEL_ACCESS_TOKEN` is set)
- `@faker-js/faker` (devDependency, seeders only)
- `dayjs` with the same Thai locale config as the frontend
- Node 20

**Ports:**
- Backend: `:3001`
- Frontend stays on `:3000`

**URLs:**
- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs-json`

**Database:**
- File: `backend/data/payday.db` (gitignored)
- Migrations live in `backend/src/db/migrations/`, run on boot in dev (`synchronize: false`, `migrationsRun: true`)
- Schema is always shipped via real migrations — never relying on `synchronize: true`

---

## 4. Folder layout

```
backend/
  src/
    main.ts                  app bootstrap, swagger setup, global pipes/filters
    app.module.ts            wires every module
    common/
      auth/                  ActorContext decorator, header DTOs
      audit/                 @Audited decorator, AuditInterceptor, helpers
      filters/               HttpExceptionFilter (consistent error shape)
      pipes/                 (reserved — class-validator default ValidationPipe)
      tenant/                TenantInterceptor, CompanyScopedRepository base
    ewa/
      rules/                 EwaRulesService, EffectivePolicyService
      state/                 RequestStateMachine
      ids/                   ID generators (generateEWAId, generateTransferId, ...)
    modules/
      companies/             Company CRUD + GET /companies (public)
      employees/             Employee CRUD + ewa-overrides + effective-policy
      hr-users/              HR user CRUD
      departments/           Department CRUD
      requests/              EWA request lifecycle
      payroll-cycles/        PayrollCycle CRUD
      notifications/         Notification CRUD + read-state
      bank-transfers/        BankTransfer CRUD + retry/settle/batch
      audit-logs/            AuditLog read-only
      settings/              per-company AppSettings (policy editor)
      line/                  push, webhook, richmenu (real/stub switch)
    db/
      data-source.ts         TypeORM DataSource for CLI + app
      migrations/            timestamped migration files
      seed/
        seed-demo.ts         mirrors data-model.md mocks across 2 companies
        seed-bulk.ts         faker-based volume seeder
        seed.service.ts      shared seeding logic (uses real services)
  test/                      empty placeholder (no automated tests this POC)
  data/
    payday.db                SQLite file (gitignored)
  .env.example               PORT, DATABASE_PATH, LINE_*, SEED_*
  .gitignore                 data/, dist/, node_modules/
  package.json
  tsconfig.json
  nest-cli.json
  README.md
```

---

## 5. Data model

### 5.1 ID strategy

Keep the existing string IDs from `data-model.md` so the demo seed lines up 1:1 with the LIFF mock store: `EMP-0041`, `HR-001`, `EWA-20250501-041`, `TRF-20250430-001`, `AUD-5821`, `dept-prod-a`. Companies use `COMP-001`, `COMP-002`. New entities created at runtime use the same generator helpers (`generateEWAId(employeeId)`, `generateTransferId()`, etc.) ported into `src/ewa/ids/`.

### 5.2 Entities

All timestamps are stored as ISO-8601 UTC `datetime` columns and serialized as ISO strings on the wire. SQLite type notes:
- No native enums → stored as `text` with `CHECK` constraints in migrations
- No native `jsonb` → TypeORM `simple-json` columns
- No `timestamptz` → `datetime` (UTC convention enforced at the boundary)

| Entity | Key fields | Notes |
|---|---|---|
| `Company` (new) | id, name, nameEn, code, active, createdAt | Public via `GET /companies` for the pre-login selector |
| `Department` | id, **companyId**, name, nameEn, headCount, ewaEnrolled, managerId | unique(companyId, id) |
| `HRUser` | id, **companyId**, name, nameEn, email, role, avatarInitials, department, isActive, lastLoginAt | unique(companyId, email) |
| `Employee` | all fields from `data-model.md` + **companyId** + EWA override columns (see §5.3) | unique(companyId, id) |
| `EWARequest` | all fields from `data-model.md` + **companyId** + FKs (employeeId, reviewedById, bankTransferId) | indexed on (companyId, status, requestedAt) |
| `PayrollCycle` | id, **companyId**, type, monthlyPayDay, monthlyEWACutoffDay, weeklyPayDayOfWeek, weeklyEWACutoffDayOfWeek, weeklyEWACutoffHour, blackoutDates(json) | one row per cycle type per company |
| `Notification` | id, **companyId**, type, recipientId, recipientType, title, body, requestId, isRead, channel(json), createdAt | recipient polymorphic via `recipientType` + `recipientId` |
| `BankTransfer` | id, **companyId**, requestIds(json), totalAmount, recipientBank, recipientAccountMasked, status, processingBank, referenceNumber, initiatedAt, settledAt, failureReason, retryCount, batchLabel | |
| `AuditLog` | id, **companyId**, action, actorId, actorName, actorRole, targetId, targetType, description, metadata(json), ipAddress, createdAt | Append-only, written by `AuditInterceptor` |
| `AppSettings` | id, **companyId** (unique), companyName, companyLogoUrl, ewaMonthlyPolicy(json), ewaWeeklyPolicy(json), notificationSettings(json), updatedAt, updatedBy | One row per company |

### 5.3 Per-employee EWA override columns

The current `Employee.ewaMaxPercent` etc. fields from `data-model.md` are renamed and made nullable so the schema is honest about override semantics:

```
Employee:
  ewaEnabledOverride       boolean | null
  ewaEligibilityOverride   'eligible' | 'quota_used' | 'suspended' | null
  ewaMaxPercentOverride    number | null
  ewaMaxRequestsOverride   number | null
  ewaMinAmountOverride     number | null
  ewaMaxAmountOverride     number | null
```

`null` = inherit from the company's EWA policy for the employee's pay cycle. Any non-null value wins.

### 5.4 Effective policy resolution

`EffectivePolicyService.resolve(employee)` returns:

```ts
{
  effective: {
    enabled: boolean,
    eligibility: 'eligible' | 'quota_used' | 'suspended',
    maxPercent: number,
    maxRequests: number,
    minAmount: number,
    maxAmount: number,
    autoApprovalEnabled: boolean,
    autoApprovalThreshold: number,
    approvalChain: 'single' | 'two_step',
    blackoutDates: string[],
    // weekly-only fields when payCycle === 'weekly'
    weeklyPayDayOfWeek?: number,
    weeklyCutoffDayOfWeek?: number,
    weeklyCutoffHour?: number,
  },
  source: {
    enabled: 'employee' | 'company',
    eligibility: 'employee' | 'company',
    maxPercent: 'employee' | 'company',
    maxRequests: 'employee' | 'company',
    minAmount: 'employee' | 'company',
    maxAmount: 'employee' | 'company',
    // policy-only fields are always 'company' (no employee override surface)
  }
}
```

The `source` map powers `GET /employees/:id/effective-policy` so demos show exactly which layer each value came from.

---

## 6. Modules & Swagger endpoints

Every endpoint requires `x-company-id` except entries marked **Public**. Optional `x-actor-id` populates `reviewedBy`/`updatedBy`/`AuditLog.actorId` when present. Standard list endpoints accept `?limit=`, `?offset=`, `?sort=` plus module-specific filters. List responses are wrapped as `{ data, total, limit, offset }`; single-item responses are the entity directly.

### 6.1 Health & meta

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | **Public** — liveness check |
| GET | `/docs` | **Public** — Swagger UI |
| GET | `/docs-json` | **Public** — OpenAPI 3 JSON |

### 6.2 Companies (`/companies`)

| Method | Path | Notes |
|---|---|---|
| GET | `/companies` | **Public** — selector for pre-login screen |
| GET | `/companies/:id` | **Public** |
| POST | `/companies` | **Public** — create (no `x-company-id` required; also bootstraps default `PayrollCycle` rows + `AppSettings` for the new company) |
| PATCH | `/companies/:id` | Update name/active (requires matching `x-company-id`) |

### 6.3 HR Users (`/hr-users`)

| Method | Path | Notes |
|---|---|---|
| GET | `/hr-users` | filter by `?role=`, `?isActive=` |
| GET | `/hr-users/:id` | |
| POST | `/hr-users` | |
| PATCH | `/hr-users/:id` | |
| DELETE | `/hr-users/:id` | soft-delete (sets `isActive=false`) |

### 6.4 Departments (`/departments`)

| Method | Path | Notes |
|---|---|---|
| GET | `/departments` | |
| GET | `/departments/:id` | |
| POST | `/departments` | |
| PATCH | `/departments/:id` | |
| DELETE | `/departments/:id` | |

### 6.5 Employees (`/employees`)

| Method | Path | Notes |
|---|---|---|
| GET | `/employees` | filter by `?department=`, `?payCycle=`, `?ewaEligibility=`, `?q=` (name/id search) |
| GET | `/employees/:id` | |
| POST | `/employees` | |
| PATCH | `/employees/:id` | non-EWA fields |
| DELETE | `/employees/:id` | soft-delete |
| GET | `/employees/:id/ewa-overrides` | returns just the 6 override fields |
| PATCH | `/employees/:id/ewa-overrides` | partial — set/clear individual overrides; null = inherit |
| GET | `/employees/:id/effective-policy` | resolved policy + `source` map (employee vs company) |
| GET | `/employees/:id/current-period` | recomputed `currentPeriod` snapshot |

### 6.6 EWA Requests (`/requests`)

| Method | Path | Notes |
|---|---|---|
| GET | `/requests` | filter by `?status=`, `?employeeId=`, `?periodStart=`, `?periodEnd=`, `?reviewedById=`, `?isOnBehalf=` |
| GET | `/requests/:id` | |
| POST | `/requests` | Employee submit; runs `EwaRulesService.validate` against effective policy → if passes, persists `pending`; if `autoApprovalEnabled && amount < threshold` → goes straight to `approved` with audit row |
| POST | `/requests/on-behalf` | HR submits for an employee; requires `x-actor-id` (HR), records `isOnBehalf=true`, `onBehalfReason` |
| POST | `/requests/:id/approve` | body: `{ note? }`; state machine: `pending → approved`; writes audit; dispatches notification |
| POST | `/requests/:id/reject` | body: `{ rejectionReason, note? }`; `pending → rejected`; audit + notification |
| POST | `/requests/:id/disburse` | body: `{ bankTransferId? }`; `approved → disbursed`; if no transfer id, creates a single-request `BankTransfer` row |
| POST | `/requests/preview` | dry-run — body: `{ employeeId, requestedAmount }`; validates against effective policy without persisting; returns `{ valid, errorCode?, errorMessage?, transferFee, netTransferAmount, percentOfEarned, maxWithdrawable }` |

### 6.7 Payroll Cycles (`/payroll-cycles`)

| Method | Path | Notes |
|---|---|---|
| GET | `/payroll-cycles` | usually 2 rows per company (monthly + weekly) |
| GET | `/payroll-cycles/:id` | |
| PATCH | `/payroll-cycles/:id` | adjust pay days, cutoffs, blackout dates |

### 6.8 Notifications (`/notifications`)

| Method | Path | Notes |
|---|---|---|
| GET | `/notifications` | filter `?recipientId=`, `?recipientType=`, `?isRead=` |
| GET | `/notifications/:id` | |
| POST | `/notifications/:id/read` | mark single read |
| POST | `/notifications/read-all` | body: `{ recipientId, recipientType }` |
| POST | `/notifications` | manual create (POC/test) |

### 6.9 Bank Transfers (`/bank-transfers`)

| Method | Path | Notes |
|---|---|---|
| GET | `/bank-transfers` | filter `?status=`, `?batchLabel=` |
| GET | `/bank-transfers/:id` | includes joined requests |
| POST | `/bank-transfers/batch` | body: `{ requestIds[] }` — batches approved requests into one transfer |
| POST | `/bank-transfers/:id/settle` | `processing → settled` |
| POST | `/bank-transfers/:id/retry` | `failed → processing` (increments `retryCount`) |

### 6.10 Audit Logs (`/audit-logs`)

| Method | Path | Notes |
|---|---|---|
| GET | `/audit-logs` | read-only; filter `?actorId=`, `?targetId=`, `?action=`, date range |
| GET | `/audit-logs/:id` | |

### 6.11 Settings (`/settings`)

| Method | Path | Notes |
|---|---|---|
| GET | `/settings` | the company's `AppSettings` row |
| PATCH | `/settings` | partial update (top-level fields) |
| GET | `/settings/policy/:cycle` | `cycle` = `monthly` or `weekly` — just the EWA policy slice |
| PATCH | `/settings/policy/:cycle` | adjust company-wide EWA policy (the **company-level** rule editor) |
| PATCH | `/settings/notifications` | `notificationSettings` sub-doc |

### 6.12 LINE (`/line`)

| Method | Path | Notes |
|---|---|---|
| POST | `/line/push` | body: `{ to, messages[] }` — calls Messaging API or console-logs |
| POST | `/line/notify/request-status` | typed convenience: `{ requestId }` → loads request → renders Flex → pushes to linked LINE userId |
| POST | `/line/webhook` | **Public** — verifies LINE signature, routes follow/unfollow/postback events |
| GET | `/line/richmenu` | current rich menu config |
| PUT | `/line/richmenu` | update rich menu config |

**Total: ~55 endpoints across 11 modules.** Swagger groups by tag (one tag per module).

---

## 7. Cross-cutting concerns

### 7.1 Tenant & actor model

- `TenantInterceptor` reads `x-company-id`, loads the `Company` row (404 if unknown or `active=false`), attaches it to `request.company`.
- `ActorInterceptor` reads optional `x-actor-id`, resolves it as either an `HRUser` or `Employee` belonging to the same company (403 on company mismatch — this is the hard-isolation guarantee). Attaches to `request.actor`.
- `@CurrentCompany()` and `@CurrentActor()` parameter decorators expose them in controllers without manual `@Req()` access.
- `CompanyScopedRepository<T>` base extends TypeORM `Repository<T>` and auto-injects `where: { companyId }` on every `find`, `findOne`, `findAndCount`, `update`, `delete`. One central place enforces isolation; controllers can't accidentally leak across companies.
- Endpoints exempt from the company guard: `GET /companies`, `GET /companies/:id`, `POST /companies`, `GET /health`, `GET /docs*`, `POST /line/webhook`.

### 7.2 Validation

- Global `ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })` registered in `main.ts`.
- DTOs are `class-validator`-decorated classes; the `@nestjs/swagger` CLI plugin (configured in `nest-cli.json`) auto-derives Swagger schemas — no manual `@ApiProperty` on every field.
- Required headers (`x-company-id`, optional `x-actor-id`) are documented globally via `DocumentBuilder.addGlobalParameters(...)` so Swagger's "Authorize" button sets them once for the session.

### 7.3 Error format

Single `HttpExceptionFilter` produces:

```json
{
  "statusCode": 422,
  "error": "EWA_OVER_LIMIT",
  "message": "เกินวงเงิน กรุณาใส่ไม่เกิน ฿7,363",
  "details": { "field": "requestedAmount", "max": 7363 },
  "timestamp": "2026-05-11T08:32:00.000Z",
  "path": "/requests"
}
```

Business-rule errors throw a typed `EwaRuleError` that maps to HTTP `422` with one of the stable codes:

| Code | Meaning |
|---|---|
| `EWA_OVER_LIMIT` | Requested amount exceeds maxWithdrawable |
| `EWA_BELOW_MIN` | Requested amount below `minAmount` |
| `EWA_OUTSIDE_CUTOFF` | After EWA cutoff for current period |
| `EWA_QUOTA_EXHAUSTED` | `usedRequests >= maxRequestsPerPeriod` |
| `EWA_BLACKOUT_DATE` | Today is in `blackoutDates` |
| `EWA_EMPLOYEE_SUSPENDED` | Effective `eligibility` is `suspended` |
| `EWA_EWA_DISABLED` | Effective `enabled` is false |
| `EWA_INVALID_AMOUNT` | Non-integer baht / negative |
| `EWA_INVALID_TRANSITION` | State machine rejects (e.g. approve a `disbursed` request) |

Codes are documented in the Swagger description block.

### 7.4 Audit interceptor

`@Audited({ action, targetType, target: (req, res) => req.params.id })` controller decorator captures the action and writes an `AuditLog` row after the handler succeeds (skipped on error). When `x-actor-id` is absent, falls back to `actorId='system'`, `actorName='system'`, `actorRole=null`. To support this, `AuditLog.actorRole` is stored as a nullable `text` column (not constrained to the `HRRole` union) so seeded/system writes don't have to lie about role. Decorated endpoints:

- All `/requests/:id/{approve,reject,disburse}` and `/requests/on-behalf`
- `/employees/:id/ewa-overrides` PATCH
- `/settings/policy/:cycle` PATCH
- `/employees/:id` DELETE
- `/bank-transfers/:id/{settle,retry}` and `/bank-transfers/batch`

### 7.5 Swagger setup (`main.ts`)

- Title "PayDay+ Backend POC", version from `package.json`
- Description includes the auth-header convention, the `EWA_*` error code list, and example header values
- Tags grouped by module (one tag per module)
- `swaggerOptions.persistAuthorization: true` so refreshing doesn't lose `x-company-id`/`x-actor-id`
- A "Download OpenAPI JSON" link to `/docs-json` for importing into Postman/Insomnia

### 7.6 LINE module — real/stub switch

- `LineMessagingClient` provider checks `process.env.LINE_CHANNEL_ACCESS_TOKEN` once at boot
- Token present → `RealLineClient` wraps `@line/bot-sdk`'s `Client` with the real Messaging API
- Token absent → `ConsoleLineClient` logs `[LINE STUB] push to=Uxxx text="..."` and still writes a `Notification` row so the rest of the system behaves identically
- Webhook signature verifier is real when `LINE_CHANNEL_SECRET` is set; in stub mode it accepts any signature but logs a warning at startup so it's obvious in demos
- All other modules depend on the abstract `LineMessagingClient` interface — they don't know which implementation is bound

---

## 8. EWA rules engine

### 8.1 `EwaRulesService` (pure functions, ported from `lib/utils/ewa-calculations.ts`)

- `calculateEarnedToDate(payCycle, monthlySalary?, dailyRate?, workedDays)`
- `calculateMaxWithdrawable(earnedToDate, maxPercent, previousEWAThisPeriod)`
- `calculateNetTransferAmount(requestedAmount, transferFee = 15)`
- `validateRequestAmount(amount, maxWithdrawable, minAmount)` → throws `EwaRuleError` with appropriate code
- `isWithinCutoff(payCycle, effectivePolicy, currentPeriod, now)` — checks blackouts AND cutoff day/hour
- `shouldAutoApprove(amount, effectivePolicy)`

All take values from the **effective policy** — they never read `Employee` or `Settings` directly, so they're testable in isolation later if we want.

### 8.2 `RequestStateMachine`

```
pending  → approved | rejected
approved → disbursed
rejected → (terminal)
disbursed → (terminal)
```

Any other transition throws `EwaRuleError({ code: 'EWA_INVALID_TRANSITION' })`.

### 8.3 Request creation flow (`POST /requests`)

```
1. Load Employee (CompanyScopedRepository auto-filters by companyId)
2. Resolve EffectivePolicy
3. Compute currentPeriod snapshot (workedDays, earnedToDate, previousEWAThisPeriod, maxWithdrawable, usedRequests)
4. Run rule checks (eligibility, enabled, blackout, cutoff, quota, amount range)
5. If autoApprove → status='approved', reviewedBy='system', dispatch notification
   Else → status='pending'
6. Persist EWARequest with snapshot fields locked in (earnedToDate, maxWithdrawable, percentOfEarned, transferFee, netTransferAmount, periodLabel, periodStart, periodEnd, bankAccountMasked, bankName)
7. Audit row
8. Notification row + LINE push (stub or real)
9. Return the persisted request
```

---

## 9. Seed strategy

### 9.1 `seed:demo` (default, idempotent)

Two companies seeded simultaneously:

- **`COMP-001` "โรงงานไทยดี จำกัด"** — mirrors `data-model.md` exactly: 6 departments, 3 HR users, 20 employees (14 monthly + 6 weekly), 30 requests in mixed statuses, full app settings with the same monthly + weekly policies, blackout dates as documented.
- **`COMP-002` "Acme Manufacturing"** — smaller English-name dataset (3 departments, 2 HR users, 8 employees, 12 requests) so the company switcher demos meaningfully and we can verify isolation works.

Implementation: truncate-then-insert via `SeedService` which goes through real services so business rules apply to seeded requests too (e.g. autoApproval runs on seeded requests in the threshold range).

### 9.2 `seed:bulk` (faker-driven)

Env-driven for testing pagination/reports:

```
SEED_COMPANIES=3
SEED_EMPLOYEES_PER_COMPANY=200
SEED_MONTHS=12
SEED_REQUESTS_PER_EMPLOYEE_PER_MONTH=2
```

Realistic distributions: 60% approved, 20% disbursed, 12% pending, 8% rejected. Random department/cycle assignment. All requests respect company policy bounds.

Both seeders share `seed.service.ts`. Both run inside a `NestFactory.createApplicationContext()` standalone Nest app, not raw TypeORM, so they exercise the real DI graph.

---

## 10. Local dev workflow

`backend/package.json` scripts:

```
start:dev    nest start --watch
start:prod   node dist/main.js
build        nest build
db:reset     rm -f data/payday.db
db:migrate   typeorm migration:run -d src/db/data-source.ts
db:revert    typeorm migration:revert -d src/db/data-source.ts
db:gen       typeorm migration:generate -d src/db/data-source.ts
seed:demo    ts-node src/db/seed/seed-demo.ts
seed:bulk    ts-node src/db/seed/seed-bulk.ts
fresh        npm run db:reset && npm run db:migrate && npm run seed:demo
```

**One-liner from a clean checkout:**

```bash
cd backend && cp .env.example .env && npm install && npm run fresh && npm run start:dev
```

Then open `http://localhost:3001/docs`, click **Authorize**, paste:

```
x-company-id: COMP-001
x-actor-id:   HR-001     (optional)
```

Exercise any endpoint. To switch companies, change the header in **Authorize** and re-fire.

`.env.example`:

```
PORT=3001
DATABASE_PATH=./data/payday.db
NODE_ENV=development

# LINE — leave blank for console-stub mode
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=

# seed:bulk knobs (only read by seed:bulk)
SEED_COMPANIES=3
SEED_EMPLOYEES_PER_COMPANY=200
SEED_MONTHS=12
SEED_REQUESTS_PER_EMPLOYEE_PER_MONTH=2
```

---

## 11. Out of scope (explicit non-goals)

- Real authentication (JWT, LIFF identity-token verification, password handling, sessions)
- Automated tests (unit, integration, e2e) — Swagger is the test surface for this POC
- Frontend changes — the LIFF app keeps its mock store; nothing in `app/`, `components/`, `lib/` is touched
- Replacing the existing Next.js LINE routes (`app/api/line/*`) — the backend mirrors them so you can compare behavior, but cutover is a separate task
- Production deployment, CI, Docker, observability
- Workspace conversion (no `apps/`, no `packages/payday-api` move)
- Bulk import tools (CSV employee uploads, bank statement parsing)
- Reporting endpoints from `data-model.md` `ReportSummary` types — deferred unless a follow-up question raises them

---

## 12. Open questions for implementation phase

These are not blockers for the spec; the implementation plan should resolve them.

- Migration generation order — generate one initial migration covering all entities, or one migration per module? (Suggest: one initial migration to keep the POC simple; modules added later get incremental migrations.)
- Soft-delete approach — TypeORM's `@DeleteDateColumn` vs explicit `isActive` boolean? (Lean: `@DeleteDateColumn` for `Employee` and `HRUser`; `isActive` for `Company` since selectors need to filter it.)
- Currency handling — store baht as `integer` (no satang) since the existing `validateRequestAmount` rejects non-integers. (Suggest: confirm in plan.)
- Whether `POST /companies` should also seed default `PayrollCycle` and `AppSettings` rows for the new company. (Strong yes; without this a freshly created company can't accept requests.)

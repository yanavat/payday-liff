# Auth Plan — Employee Multi-Channel Login + HR Email/Password

> Decided in grilling session (May 26, 2026)
> Priority: Backend first → Frontend integration after

---

## Decisions (locked)

| Decision | Choice |
|---|---|
| Database | TypeORM + PostgreSQL (production), SQLite (local dev/demo) |
| Deployment | AWS (separate infra team), Vercel for frontend |
| HR auth | Email + password (JWT) |
| Employee auth | Phone/email + PIN 6 digits |
| LIFF auth | LINE optional — auto-login if linked, fallback to phone + PIN |
| Browser login screen | Single page: LINE OAuth button + divider "หรือ" + phone/email + PIN form |
| First-time activation | HR creates employee → invitation code 6 digits → employee enters phone + code → sets PIN |
| Identity linking | Backend owns lineUserId, phone, email, pinHash on Employee entity |
| LIFF first-time | Same invitation code flow + sends lineUserId to backend for linking |
| Already has PIN, opens LINE first time | Phone + PIN to verify → backend links lineUserId automatically |
| Linked LINE user opens LINE app | Auto-login, no PIN required (LINE app is device-level auth) |
| Transaction confirmation | PIN required when submitting EWA request (step-up) |
| JWT storage | HttpOnly cookie, proxied through Next.js API routes (same domain) |

---

## Existing Infrastructure (what we already have)

- `JwtStrategy` — extracts Bearer token, validates, returns `{ employeeId, companyId }`
- `JwtAuthGuard` — global guard, skips `@Public()` routes, soft-fails (no 401 if no token)
- `ActorInterceptor` — resolves actor from `x-actor-id` header OR JWT payload
- `ActorModule` — wires Passport + JwtModule + guard + interceptor
- `OnboardingService` — has OTP send/verify, `completeLineLink()`, manual `signJwt()`
- `Employee` entity — already has `phoneNumber`, `lineUserId`, `employeeCode` columns
- `OtpVerification` entity — OTP table with attempts + expiry

---

## Phase 1 — Employee Entity + Migration

### 1.1 Add auth columns to Employee entity

File: `src/modules/employees/entities/employee.entity.ts`

```
+ @Column({ type: 'text', nullable: true }) email!: string | null;
+ @Column({ type: 'text', nullable: true }) pinHash!: string | null;
+ @Column({ type: 'text', nullable: true }) invitationCode!: string | null;
+ @Column({ type: 'integer', default: 0 })  activated!: number;
```

Indexes to add:
- `UNIQUE INDEX (companyId, email) WHERE email IS NOT NULL`
- `UNIQUE INDEX (companyId, phoneNumber) WHERE phoneNumber IS NOT NULL`
- `UNIQUE INDEX (lineUserId) WHERE lineUserId IS NOT NULL`

### 1.2 Migration

File: `src/db/migrations/1715473100000-add-employee-auth-fields.ts`

```sql
ALTER TABLE "employees" ADD COLUMN "email" text;
ALTER TABLE "employees" ADD COLUMN "pinHash" text;
ALTER TABLE "employees" ADD COLUMN "invitationCode" text;
ALTER TABLE "employees" ADD COLUMN "activated" integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "uniq_employees_company_email" ON "employees" ("companyId", "email") WHERE "email" IS NOT NULL;
CREATE UNIQUE INDEX "uniq_employees_company_phone" ON "employees" ("companyId", "phoneNumber") WHERE "phoneNumber" IS NOT NULL;
CREATE UNIQUE INDEX "uniq_employees_line_user_id" ON "employees" ("lineUserId") WHERE "lineUserId" IS NOT NULL;
```

### 1.3 Auto-generate invitation code on employee creation

File: `src/modules/employees/employees.service.ts`

In `create()` method — generate a 6-digit random code:
```ts
employee.invitationCode = randomInt(100000, 999999).toString();
employee.activated = 0;
```

### 1.4 Return invitation code in HR-facing employee response

Update `EmployeeDto` and `CreateEmployeeDto` so HR can see the code after creation.
Add `POST /employees/:id/reset-invitation` endpoint for HR to regenerate the code.

**Checkpoint:** `npm run fresh` works, employee records have invitation code, HR can see codes in Swagger.

---

## Phase 2 — Auth Module (Employee)

### 2.1 Create `src/modules/employee-auth/` module

New files:
```
src/modules/employee-auth/
  employee-auth.module.ts
  employee-auth.controller.ts
  employee-auth.service.ts
  dto/
    activate.dto.ts      — { phone, invitationCode, pin }
    login-pin.dto.ts     — { phone | email, pin }
    login-line.dto.ts    — { lineUserId }
    link-line.dto.ts     — { phone, pin, lineUserId }
```

### 2.2 `POST /auth/employee/activate` (Public)

Flow:
1. Find employee by `phoneNumber` matching `dto.phone`
2. Validate `invitationCode` matches
3. Validate employee not yet `activated`
4. Hash PIN (bcrypt) → save to `pinHash`
5. Set `activated = 1`, clear `invitationCode`
6. Return JWT in HttpOnly cookie + `{ success: true, employeeId, companyId }`

### 2.3 `POST /auth/employee/login` (Public)

Flow:
1. Find employee by `phoneNumber` or `email` matching `dto.identifier`
2. Validate `activated === 1`
3. Compare `dto.pin` with `pinHash` (bcrypt)
4. On success → return JWT in HttpOnly cookie
5. On failure → increment attempt counter, lockout after 5 attempts (15min cooldown)

Rate limiting: 5 attempts per identifier per 15 minutes (in-memory or via table).

### 2.4 `POST /auth/employee/line-login` (Public)

Flow:
1. Find employee by `lineUserId` matching `dto.lineUserId`
2. If found + activated → return JWT in HttpOnly cookie
3. If found but not activated → return `{ status: 'needs_activation' }`
4. If not found → return `{ status: 'needs_linking' }`

### 2.5 `POST /auth/employee/link-line` (Public)

Flow:
1. Find employee by `phoneNumber` matching `dto.phone`
2. Validate `activated === 1`
3. Compare `dto.pin` with `pinHash`
4. Set `lineUserId = dto.lineUserId`
5. Return JWT in HttpOnly cookie

### 2.6 `POST /auth/employee/verify-pin` (Authenticated)

For transaction-level step-up confirmation:
1. Get employeeId from JWT
2. Compare `dto.pin` with `pinHash`
3. Return `{ verified: true }` or 401

### 2.7 JWT Cookie helper

Create `setAuthCookie(res, token)` utility:
```ts
res.cookie('payday_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24h
  path: '/',
});
```

### 2.8 Update JwtStrategy to also extract from cookie

Currently: `ExtractJwt.fromAuthHeaderAsBearerToken()`
Change to: `ExtractJwt.fromExtractors([fromCookie('payday_token'), fromAuthHeaderAsBearerToken()])`

**Checkpoint:** All 5 auth endpoints work in Swagger. Activate → login → verify-pin → full lifecycle.

---

## Phase 3 — HR Auth Module

### 3.1 Create `src/modules/hr-auth/` module

New files:
```
src/modules/hr-auth/
  hr-auth.module.ts
  hr-auth.controller.ts
  hr-auth.service.ts
  dto/
    hr-login.dto.ts      — { email, password }
    hr-register.dto.ts   — { email, password, name } (admin only)
```

### 3.2 Add `passwordHash` column to HRUser entity

File: `src/modules/hr-users/entities/hr-user.entity.ts`
```
+ @Column({ type: 'text', nullable: true }) passwordHash!: string | null;
```

Migration: `1715473200000-add-hr-password.ts`

### 3.3 `POST /auth/hr/login` (Public)

Flow:
1. Find HR user by `email`
2. Compare `password` with `passwordHash` (bcrypt)
3. Return JWT in HttpOnly cookie with `{ hrUserId, companyId, role }`

### 3.4 Update JwtPayload type

Extend to support both actor types:
```ts
interface JwtPayload {
  employeeId?: string;
  hrUserId?: string;
  companyId: string;
  kind: 'employee' | 'hr';
  iat: number;
  exp: number;
}
```

### 3.5 Update ActorInterceptor

Currently resolves from `x-actor-id` header or `jwtPayload.employeeId`.
Add: if `jwtPayload.kind === 'hr'` → resolve HR actor from `jwtPayload.hrUserId`.

### 3.6 Seed demo HR passwords

In `seed:demo`: set password `demo1234` for all HR users (hashed with bcrypt).

**Checkpoint:** HR can login via Swagger with email + password, gets JWT cookie, subsequent requests resolve HR actor correctly.

---

## Phase 4 — Existing Code Cleanup

### 4.1 Refactor OnboardingService

The existing `OnboardingService` has overlapping concerns with the new auth module:
- Keep `verifyEmployee` endpoint (used by LIFF onboarding flow to look up employee by company code + employee code)
- Move `signJwt()` → use NestJS `JwtService` from `@nestjs/jwt` instead of manual implementation
- Deprecate OTP flow for now (replaced by invitation code), keep table for future OTP enhancement
- Remove `completeLineLink()` → replaced by `EmployeeAuthService.linkLine()`

### 4.2 Update seed data

In `seed:demo`:
- All demo employees get `invitationCode`, `activated = 1`, and a demo `pinHash` (PIN: `123456`)
- Some employees left with `activated = 0` + invitation code for testing activation flow

### 4.3 Swagger organization

Group auth endpoints under `auth` tag in Swagger:
- `POST /auth/employee/activate`
- `POST /auth/employee/login`
- `POST /auth/employee/line-login`
- `POST /auth/employee/link-line`
- `POST /auth/employee/verify-pin`
- `POST /auth/hr/login`

**Checkpoint:** `npm run fresh` works, demo walk covers activate → login → request with PIN verify → HR login → approve.

---

## Phase 5 — Security Hardening

### 5.1 PIN attempt rate limiting

- Track failed attempts per employee (in-memory Map or table column)
- After 5 failed attempts → lock for 15 minutes
- Return `429 Too Many Requests` with `retryAfterSeconds`
- Reset counter on successful login

### 5.2 Invitation code expiry

- Add `invitationExpiresAt` column (nullable datetime)
- Set to 7 days from creation by default
- Expired codes return `410 Gone` with message to contact HR
- HR can regenerate via `POST /employees/:id/reset-invitation`

### 5.3 `POST /auth/employee/logout`

- Clear HttpOnly cookie
- Optionally: add token to blacklist (simple in-memory set with TTL)

### 5.4 `GET /auth/me` (Authenticated)

- Return current actor info (employeeId/hrUserId, companyId, kind, name)
- Frontend uses this to check session validity on page load

**Checkpoint:** Rate limiting verified in Swagger (6th attempt returns 429). Expired invitation code returns 410.

---

## File Change Summary

| File | Action |
|---|---|
| `src/modules/employees/entities/employee.entity.ts` | Add email, pinHash, invitationCode, activated |
| `src/modules/hr-users/entities/hr-user.entity.ts` | Add passwordHash |
| `src/db/migrations/1715473100000-add-employee-auth-fields.ts` | New migration |
| `src/db/migrations/1715473200000-add-hr-password.ts` | New migration |
| `src/modules/employee-auth/*` | New module (6 files) |
| `src/modules/hr-auth/*` | New module (5 files) |
| `src/common/auth/jwt.strategy.ts` | Add cookie extraction + update JwtPayload |
| `src/common/auth/actor.interceptor.ts` | Handle HR JWT kind |
| `src/common/auth/cookie.util.ts` | New — setAuthCookie helper |
| `src/onboarding/onboarding.service.ts` | Refactor: use JwtService, remove duplicate signJwt |
| `src/modules/employees/employees.service.ts` | Auto-generate invitation code in create() |
| `src/seed/seed-demo.ts` | Add demo PINs + passwords |

---

## Estimated Effort

| Phase | Effort |
|---|---|
| 1 · Entity + Migration | 0.5 day |
| 2 · Employee Auth Module | 1 day |
| 3 · HR Auth Module | 0.5 day |
| 4 · Cleanup + Seed | 0.5 day |
| 5 · Security Hardening | 0.5 day |
| **Total** | **~3 days** |

---

## Out of Scope (deferred)

- OTP via SMS (future enhancement, table already exists)
- Password reset flow for HR
- PIN reset flow for Employee (HR can regenerate invitation code → re-activate)
- OAuth2 provider for LINE Login on browser (frontend phase)
- Frontend auth screens (separate plan)
- Session refresh / sliding expiry

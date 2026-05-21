# Agent Prompt: Multi-Company Onboarding — Backend (NestJS)

## Objective

Add three API endpoints to the existing NestJS backend that power the multi-company employee onboarding flow in the LIFF frontend. A worker enters their Company Code + Employee ID, receives an SMS OTP, and links their LINE account.

## Tech Stack

- **NestJS** (existing project)
- **TypeORM** with **SQLite** (for now)
- Existing entities: `Company`, `Employee` (confirm by checking `src/` for entity files)

## What the frontend expects

The LIFF frontend (separate repo at `../payday-liff/`) calls these three endpoints via `NEXT_PUBLIC_API_BASE_URL`. All requests include an `x-company-id` header on authenticated routes, but the onboarding endpoints are **unauthenticated** (the user isn't linked yet).

---

## Endpoints to implement

### 1. POST `/employees/verify`

Lookup an employee by company code + employee code. This is the first step of onboarding — no auth required.

**Request body:**
```json
{
  "companyCode": "SMPC",
  "employeeCode": "EMP-0001"
}
```

**Response 200:**
```json
{
  "employeeId": "uuid-...",
  "nameTh": "นายสมชาย ดีใจ",
  "phoneMasked": "08x-xxx-1234",
  "companyName": "SMPC Factory Ltd.",
  "companyId": "company-uuid-..."
}
```

**Response 404:**
```json
{
  "message": "Employee not found",
  "statusCode": 404
}
```

**Implementation notes:**
- Join `Employee` with `Company` where `company.code = companyCode` AND `employee.employeeCode = employeeCode`
- The `Company` entity needs a `code` field (short alphanumeric like `SMPC`) if it doesn't already have one. Add a migration if needed.
- `phoneMasked`: mask the employee's phone number — show last 4 digits only (e.g. `081-234-5678` → `08x-xxx-5678`). The masking must happen server-side, never expose the full number.
- Do NOT require auth for this endpoint.

---

### 2. POST `/auth/otp/send`

Generate a 6-digit OTP and send it to the employee's phone number via SMS.

**Request body:**
```json
{
  "employeeId": "uuid-..."
}
```

**Response 200:**
```json
{
  "sent": true,
  "expiresInSeconds": 300
}
```

**Response 404:**
```json
{
  "message": "Employee not found",
  "statusCode": 404
}
```

**Implementation notes:**
- Generate a random 6-digit numeric OTP.
- Store it with: `employeeId`, `otp` (hashed), `expiresAt` (now + 5 minutes), `attempts` (0).
- For now, **log the OTP to console** instead of sending a real SMS. Add a comment `// TODO: integrate SMS provider (e.g. Twilio, ThaiBulkSMS)`.
- If an unexpired OTP already exists for this employee, invalidate it and create a new one.
- Create an `OtpVerification` entity/table for this:

```typescript
@Entity()
export class OtpVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @Column()
  otpHash: string;

  @Column()
  expiresAt: Date;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### 3. POST `/auth/otp/verify`

Verify the OTP and link the LINE User ID to the employee record. Returns a JWT auth token.

**Request body:**
```json
{
  "employeeId": "uuid-...",
  "otp": "123456",
  "lineUserId": "U102938..."
}
```

**Response 200:**
```json
{
  "success": true,
  "authToken": "jwt-token-...",
  "companyId": "company-uuid-..."
}
```

**Response 401 (wrong OTP):**
```json
{
  "message": "Invalid or expired OTP",
  "statusCode": 401
}
```

**Response 429 (too many attempts):**
```json
{
  "message": "Too many attempts. Please request a new OTP.",
  "statusCode": 429
}
```

**Implementation notes:**
- Find the latest non-used, non-expired `OtpVerification` for this `employeeId`.
- Increment `attempts`. If `attempts > 5`, return 429.
- Compare OTP hash. If wrong, return 401.
- If correct:
  1. Mark the OTP record as `used = true`.
  2. Update the `Employee` record: set `lineUserId = request.lineUserId`.
  3. Generate a JWT containing `{ employeeId, companyId }` and return it.
- The `Employee` entity should already have an optional `lineUserId` column. If not, add it.

---

## Module / File Structure

Create a new NestJS module for the onboarding flow. Suggested structure:

```
src/
  onboarding/
    onboarding.module.ts          # Module declaration
    onboarding.controller.ts      # 3 endpoints
    onboarding.service.ts         # Business logic
    dto/
      verify-employee.dto.ts      # VerifyEmployeeDto (validation)
      send-otp.dto.ts             # SendOtpDto
      verify-otp.dto.ts           # VerifyOtpDto
    entities/
      otp-verification.entity.ts  # OtpVerification entity
```

Register `OnboardingModule` in the root `AppModule`. Register `OtpVerification` entity in TypeORM.

---

## Validation (class-validator)

Use `class-validator` decorators on all DTOs:

```typescript
// verify-employee.dto.ts
export class VerifyEmployeeDto {
  @IsString()
  @IsNotEmpty()
  companyCode: string;

  @IsString()
  @IsNotEmpty()
  employeeCode: string;
}

// send-otp.dto.ts
export class SendOtpDto {
  @IsUUID()
  employeeId: string;
}

// verify-otp.dto.ts
export class VerifyOtpDto {
  @IsUUID()
  employeeId: string;

  @IsString()
  @Length(6, 6)
  otp: string;

  @IsString()
  @IsNotEmpty()
  lineUserId: string;
}
```

---

## Company Code field

The `Company` entity likely doesn't have a `code` field yet. Check if it exists. If not:

1. Add `code: string` column (unique, uppercase, 2–10 chars).
2. Create a migration to add it.
3. Seed existing companies with codes (e.g. company name abbreviation).

---

## Security considerations

- **Hash OTPs** before storing (use bcrypt or crypto.createHash — even a simple SHA-256 is fine for OTP since they're short-lived).
- **Rate limit**: max 5 verification attempts per OTP. After 5 failures, the OTP is locked — user must request a new one.
- **OTP expiry**: 5 minutes (300 seconds).
- **No auth required** on these endpoints (user is unauthenticated during onboarding), but consider adding basic request throttling (e.g. `@nestjs/throttler`) to prevent brute force on the verify endpoint.
- **Phone masking** must happen server-side in the `/employees/verify` response.

---

## Tests

Write unit tests for `OnboardingService`:

| Test | Description |
|------|-------------|
| `verifyEmployee — returns employee data for valid codes` | Match company code + employee code → return VerifyEmployeeResponse |
| `verifyEmployee — throws 404 for invalid company code` | Unknown company code → NotFoundException |
| `verifyEmployee — throws 404 for invalid employee code` | Valid company, wrong employee → NotFoundException |
| `verifyEmployee — masks phone number correctly` | `081-234-5678` → `08x-xxx-5678` |
| `sendOtp — creates OTP record` | Valid employeeId → OTP record created, `sent: true` |
| `sendOtp — invalidates previous OTP` | Second call → old OTP marked used, new one created |
| `sendOtp — throws 404 for unknown employee` | Bad employeeId → NotFoundException |
| `verifyOtp — succeeds with correct OTP` | Correct OTP → `success: true`, employee.lineUserId updated |
| `verifyOtp — fails with wrong OTP` | Wrong OTP → UnauthorizedException, attempts incremented |
| `verifyOtp — locks after 5 failed attempts` | 6th wrong attempt → 429 Too Many Requests |
| `verifyOtp — rejects expired OTP` | OTP past expiresAt → UnauthorizedException |
| `verifyOtp — returns JWT with employeeId and companyId` | Verify the JWT payload contains correct claims |

---

## Do NOT

- Modify existing employee CRUD endpoints
- Change existing entity fields (only add new ones)
- Touch authentication middleware for other routes
- Install new packages unless absolutely necessary (`@nestjs/jwt` may already be installed — check first)
- Create any frontend files

## Coordination with frontend

The frontend repo (`../payday-liff/`) has its own agent prompt (`ONBOARDING_AGENT_PROMPT.md`). Both repos can be worked on independently — the contract is the three endpoint request/response shapes documented above. The frontend calls these via the configured `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:3001`).

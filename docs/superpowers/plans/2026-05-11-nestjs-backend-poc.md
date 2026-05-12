# NestJS Backend POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a NestJS backend in `backend/` that covers all 9 PayDay+ domain modules plus a LINE module, exposed entirely via Swagger UI, with SQLite + TypeORM, multi-company hard isolation, and layered per-employee EWA rule overrides.

**Architecture:** Module-per-entity NestJS app. Business rules extracted into `EwaRulesService` + `EffectivePolicyService` + `RequestStateMachine`. Multi-tenancy via `TenantInterceptor` + `CompanyScopedRepository` base. Audit via `@Audited` interceptor. LINE module switches between real `@line/bot-sdk` and a console stub based on env. No automated tests this POC — Swagger UI is the test surface.

**Tech Stack:** NestJS 10, TypeScript 5, TypeORM 0.3 with `better-sqlite3`, `@nestjs/swagger` (CLI plugin), `class-validator`, `class-transformer`, `@line/bot-sdk`, `@faker-js/faker`, `dayjs`, Node 20.

**Reference spec:** `docs/superpowers/specs/2026-05-11-nestjs-backend-poc-design.md` — read it before starting any task. The spec is the source of truth; if this plan and the spec disagree, the spec wins and the plan must be patched.

---

## How to execute

1. Every task is "make change → `npm run build` → curl/Swagger verify → commit". No `npm test` step exists — there is no test suite.
2. Run all commands from `backend/` unless otherwise stated.
3. Every commit message uses `feat(backend): ...`, `chore(backend): ...`, `fix(backend): ...` so they're easy to filter on the existing branch (`codex/liff-migration-plan`).
4. After each task, the server must boot cleanly (`npm run start:dev` exits with no errors and `http://localhost:3001/docs` renders). If it doesn't, fix before committing.
5. Default Swagger headers to set in "Authorize" panel between tasks: `x-company-id: COMP-001`, `x-actor-id: HR-001` (these don't exist until Phase 6, but Phase 1 scaffolds the Authorize panel itself).

---

## Phases

| Phase | Title | Outcome |
|---|---|---|
| 0 | Scaffold | Nest app boots on :3001 with Swagger at /docs and SQLite connected |
| 1 | Common infrastructure | Tenant/Actor/Audit/Error/Validation cross-cutting in place, exercised by `/health` |
| 2 | Foundational entities | Company, Department, HRUser CRUD live |
| 3 | Payroll cycles & settings | PayrollCycle + AppSettings per company; auto-bootstrap on company create |
| 4 | Employees + EWA rules engine | Employee CRUD, EwaRulesService, EffectivePolicyService, override endpoints |
| 5 | Requests lifecycle | EWARequest CRUD + state machine + preview + approve/reject/disburse + audit dispatch |
| 6 | Auxiliary modules | Notifications, BankTransfers, AuditLogs (read-only) |
| 7 | LINE module | LineMessagingClient (real/stub), push/notify/webhook/richmenu |
| 8 | Seeders | seed:demo (mirrors existing mocks across 2 companies) + seed:bulk (faker) |
| 9 | Polish | README, .env.example, fresh npm scripts, Swagger description tidy-up |

---

## Conventions used throughout this plan

### Standard module pattern

Every domain module is generated with `nest g resource <name> --no-spec` (REST + no test file). The generator produces 5 files under `src/modules/<name>/`: `<name>.module.ts`, `<name>.controller.ts`, `<name>.service.ts`, `dto/create-<name>.dto.ts`, `dto/update-<name>.dto.ts`. We then:

1. Replace the generated entity stub with the real `@Entity()` class under `src/modules/<name>/entities/<name>.entity.ts` (TypeORM).
2. Register the entity via `TypeOrmModule.forFeature([<Entity>])` in `<name>.module.ts`.
3. Replace the generated service to use the `CompanyScopedRepository<Entity>` base (introduced in Task 1.4).
4. Replace the generated controller to use `@CurrentCompany()` / `@CurrentActor()` decorators and Swagger tags.
5. Replace DTOs with `class-validator`-decorated DTOs.

For each module task this plan gives the full entity, service, controller, and DTO code (no "similar to Task N" — code is repeated per module so a subagent reading one task has everything).

### List response wrapper

All list endpoints return:

```ts
{ data: T[], total: number, limit: number, offset: number }
```

Implemented once via a `PaginatedListDto<T>` helper in `src/common/paginated-list.dto.ts` (Task 1.1).

### Swagger tags

One tag per module, matching its name (e.g. `companies`, `hr-users`, `requests`).

### Build/verify pattern

Every task ends with:

```bash
npm run build      # must exit 0 with no TS errors
npm run start:dev  # in another shell — open http://localhost:3001/docs, verify endpoint(s) appear, hit them
```

Curl examples per task assume the server is running on `:3001` and `x-company-id` is `COMP-001` (created in Task 2.1).

---

## Phase 0 — Scaffold

**Outcome:** `cd backend && npm run start:dev` boots Nest on `:3001`, Swagger UI renders at `/docs`, SQLite file `data/payday.db` exists.

---

### Task 0.1: Create backend folder and initialize Nest project

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/tsconfig.build.json`
- Create: `backend/nest-cli.json`
- Create: `backend/.gitignore`
- Create: `backend/src/main.ts`
- Create: `backend/src/app.module.ts`
- Modify: `.gitignore` (root)

- [ ] **Step 1: Create the backend directory and run Nest CLI scaffold**

From the repo root:

```bash
mkdir -p backend
cd backend
npx -y @nestjs/cli@10 new . --skip-git --skip-install --package-manager npm
```

Answer prompts: package manager = npm. This generates `package.json`, `tsconfig.json`, `nest-cli.json`, `src/main.ts`, `src/app.module.ts`, `src/app.controller.ts`, `src/app.service.ts`, plus test files.

- [ ] **Step 2: Delete the generated test/app scaffold we won't use**

```bash
rm -rf test
rm -f src/app.controller.ts src/app.controller.spec.ts src/app.service.ts
```

- [ ] **Step 3: Replace `src/app.module.ts` with an empty wiring module**

```ts
// backend/src/app.module.ts
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

- [ ] **Step 4: Replace `src/main.ts` with the bootstrap on port 3001**

```ts
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${port}`);
}
bootstrap();
```

- [ ] **Step 5: Replace `backend/.gitignore`**

```
node_modules
dist
data
.env
*.log
```

- [ ] **Step 6: Append backend artifact ignores to the repo root `.gitignore`**

Add these lines at the end of the existing root `/Users/tavana/dev/wow-2026/payday-liff/.gitignore`:

```
# backend POC
backend/node_modules
backend/dist
backend/data
backend/.env
```

- [ ] **Step 7: Install dependencies and verify the scaffold builds**

```bash
cd backend
npm install
npm run build
npm run start:dev
```

Expected: server logs `[backend] listening on http://localhost:3001`. `curl http://localhost:3001/` returns `404` (no controllers yet). Kill the server.

- [ ] **Step 8: Commit**

```bash
cd /Users/tavana/dev/wow-2026/payday-liff
git add backend/ .gitignore
git commit -m "chore(backend): scaffold NestJS app on port 3001"
```

---

### Task 0.2: Install runtime dependencies (TypeORM, SQLite, Swagger, validation)

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install runtime deps**

```bash
cd backend
npm install @nestjs/typeorm typeorm better-sqlite3 \
  @nestjs/swagger swagger-ui-express \
  @nestjs/config \
  class-validator class-transformer \
  reflect-metadata rxjs \
  dayjs \
  @line/bot-sdk
```

- [ ] **Step 2: Install dev deps**

```bash
npm install -D @types/better-sqlite3 @faker-js/faker ts-node
```

- [ ] **Step 3: Verify the build still passes**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore(backend): add typeorm, sqlite, swagger, line, validation deps"
```

---

### Task 0.3: Configure TypeORM + SQLite

**Files:**
- Create: `backend/.env.example`
- Create: `backend/.env`
- Create: `backend/src/db/data-source.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create `.env.example`**

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

- [ ] **Step 2: Copy `.env.example` to `.env`**

```bash
cp .env.example .env
```

`.env` is gitignored; `.env.example` is committed.

- [ ] **Step 3: Create the TypeORM DataSource at `src/db/data-source.ts`**

This DataSource is used by both the Nest app (via `TypeOrmModule.forRootAsync`) and the TypeORM CLI for migrations/generation.

```ts
// backend/src/db/data-source.ts
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import * as path from 'node:path';

loadEnv();

const databasePath = process.env.DATABASE_PATH ?? './data/payday.db';

export const dataSourceOptions: DataSourceOptions = {
  type: 'better-sqlite3',
  database: path.resolve(databasePath),
  entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  migrationsRun: true,
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
};

export default new DataSource(dataSourceOptions);
```

Note: `dotenv` is a transitive dep of `@nestjs/config`; if `npm run build` complains about it, run `npm install dotenv`.

- [ ] **Step 4: Ensure the data directory exists at startup**

Modify `backend/src/main.ts` to mkdir before `NestFactory.create`:

```ts
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const dbPath = process.env.DATABASE_PATH ?? './data/payday.db';
  fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${port}`);
}
bootstrap();
```

- [ ] **Step 5: Wire TypeORM and ConfigModule into AppModule**

```ts
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './db/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

- [ ] **Step 6: Boot and verify**

```bash
npm run start:dev
```

Expected: server logs the listen line, and `backend/data/payday.db` is created. No migrations table yet (no migrations exist) so TypeORM may log `No migrations are pending`. Kill the server.

- [ ] **Step 7: Commit**

```bash
git add backend/.env.example backend/src/db/data-source.ts backend/src/app.module.ts backend/src/main.ts
git commit -m "feat(backend): wire typeorm + sqlite, create data dir on boot"
```

---

### Task 0.4: Configure Swagger with global headers and validation pipe

**Files:**
- Modify: `backend/src/main.ts`
- Modify: `backend/nest-cli.json`

- [ ] **Step 1: Enable the Swagger CLI plugin in `nest-cli.json`**

This auto-derives Swagger schemas from `class-validator` DTOs without manual `@ApiProperty` on every field.

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ]
  }
}
```

- [ ] **Step 2: Add Swagger + ValidationPipe bootstrap to `main.ts`**

```ts
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AppModule } from './app.module';

const HEADER_COMPANY = 'x-company-id';
const HEADER_ACTOR = 'x-actor-id';

async function bootstrap() {
  const dbPath = process.env.DATABASE_PATH ?? './data/payday.db';
  fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('PayDay+ Backend POC')
    .setDescription(
      [
        'Multi-tenant EWA backend. Set `x-company-id` (required) and optionally `x-actor-id` via the Authorize button.',
        '',
        'Public endpoints (no `x-company-id` needed): `GET /companies`, `GET /companies/:id`, `POST /companies`, `GET /health`, `POST /line/webhook`.',
        '',
        'Business-rule errors return HTTP 422 with `error` codes: `EWA_OVER_LIMIT`, `EWA_BELOW_MIN`, `EWA_OUTSIDE_CUTOFF`, `EWA_QUOTA_EXHAUSTED`, `EWA_BLACKOUT_DATE`, `EWA_EMPLOYEE_SUSPENDED`, `EWA_EWA_DISABLED`, `EWA_INVALID_AMOUNT`, `EWA_INVALID_TRANSITION`.',
      ].join('\n'),
    )
    .setVersion('0.1.0')
    .addApiKey({ type: 'apiKey', name: HEADER_COMPANY, in: 'header', description: 'Required for all non-public endpoints. Example: COMP-001.' }, HEADER_COMPANY)
    .addApiKey({ type: 'apiKey', name: HEADER_ACTOR, in: 'header', description: 'Optional. HR or Employee ID performing the action (e.g. HR-001, EMP-0041).' }, HEADER_ACTOR)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${port} — docs at /docs`);
}
bootstrap();
```

- [ ] **Step 3: Build and boot**

```bash
npm run build
npm run start:dev
```

Open `http://localhost:3001/docs` in a browser. Expected: Swagger UI loads with title "PayDay+ Backend POC", description shows the header conventions and error codes, **Authorize** button shows two API keys (`x-company-id`, `x-actor-id`). The endpoint list is empty. Kill server.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main.ts backend/nest-cli.json
git commit -m "feat(backend): wire swagger UI + global validation pipe + auth headers"
```

---

### Task 0.5: Add the `/health` endpoint as the first wired-up route

**Files:**
- Create: `backend/src/modules/health/health.controller.ts`
- Create: `backend/src/modules/health/health.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create the controller**

```ts
// backend/src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness check (public)' })
  @ApiOkResponse({
    schema: { example: { status: 'ok', uptime: 123.4, timestamp: '2026-05-11T00:00:00.000Z' } },
  })
  check() {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }
}
```

- [ ] **Step 2: Create the module**

```ts
// backend/src/modules/health/health.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

- [ ] **Step 3: Register the module**

```ts
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './db/data-source';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    HealthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 4: Boot and verify**

```bash
npm run start:dev
```

```bash
curl -s http://localhost:3001/health | head
```

Expected: `{"status":"ok","uptime":...,"timestamp":"..."}`. Reload `/docs` — there is now a `health` tag with `GET /health`. Kill server.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/health backend/src/app.module.ts
git commit -m "feat(backend): add /health liveness endpoint"
```

---

## Phase 0 checkpoint

- `cd backend && npm run start:dev` boots clean
- `http://localhost:3001/docs` renders with Authorize panel
- `curl http://localhost:3001/health` returns ok
- `backend/data/payday.db` exists

---

## Phase 1 — Common infrastructure

**Outcome:** Cross-cutting infrastructure in place: error filter with `EwaRuleError` codes, tenant + actor interceptors, `CompanyScopedRepository` base, `AuditLog` entity + `@Audited` interceptor that writes rows, ID generators. Exercised by adding tenant-guard behavior to `/health` (which becomes an opt-out — stays public).

---

### Task 1.1: Common types — pagination, list query DTO, header constants

**Files:**
- Create: `backend/src/common/constants.ts`
- Create: `backend/src/common/dto/paginated-list.dto.ts`
- Create: `backend/src/common/dto/list-query.dto.ts`

- [ ] **Step 1: Create the constants file**

```ts
// backend/src/common/constants.ts
export const HEADER_COMPANY_ID = 'x-company-id';
export const HEADER_ACTOR_ID = 'x-actor-id';

export const REQUEST_KEY_COMPANY = 'company';
export const REQUEST_KEY_ACTOR = 'actor';

export const PUBLIC_ROUTES_KEY = 'tenant:public';
```

- [ ] **Step 2: Create the PaginatedListDto helper**

```ts
// backend/src/common/dto/paginated-list.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedListDto<T> {
  @ApiProperty({ isArray: true })
  data!: T[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;

  static of<T>(data: T[], total: number, limit: number, offset: number): PaginatedListDto<T> {
    const result = new PaginatedListDto<T>();
    result.data = data;
    result.total = total;
    result.limit = limit;
    result.offset = offset;
    return result;
  }
}
```

- [ ] **Step 3: Create the ListQueryDto base**

```ts
// backend/src/common/dto/list-query.dto.ts
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({ description: 'Sort spec, e.g. `createdAt:desc`' })
  @IsOptional()
  @IsString()
  sort?: string;
}
```

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add backend/src/common
git commit -m "feat(backend): add common pagination + list query DTOs"
```

---

### Task 1.2: HttpExceptionFilter + EwaRuleError

**Files:**
- Create: `backend/src/common/errors/ewa-rule.error.ts`
- Create: `backend/src/common/filters/http-exception.filter.ts`
- Modify: `backend/src/main.ts`

- [ ] **Step 1: Create the EwaRuleError class**

```ts
// backend/src/common/errors/ewa-rule.error.ts
export type EwaErrorCode =
  | 'EWA_OVER_LIMIT'
  | 'EWA_BELOW_MIN'
  | 'EWA_OUTSIDE_CUTOFF'
  | 'EWA_QUOTA_EXHAUSTED'
  | 'EWA_BLACKOUT_DATE'
  | 'EWA_EMPLOYEE_SUSPENDED'
  | 'EWA_EWA_DISABLED'
  | 'EWA_INVALID_AMOUNT'
  | 'EWA_INVALID_TRANSITION';

export class EwaRuleError extends Error {
  readonly code: EwaErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: EwaErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'EwaRuleError';
    this.code = code;
    this.details = details;
  }
}
```

- [ ] **Step 2: Create the HttpExceptionFilter**

```ts
// backend/src/common/filters/http-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EwaRuleError } from '../errors/ewa-rule.error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message: string | string[] = 'Internal server error';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof EwaRuleError) {
      statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        errorCode = exception.name;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        message = (b.message as string | string[]) ?? exception.message;
        errorCode = (b.error as string) ?? exception.name;
        details = (b.details as Record<string, unknown>) ?? undefined;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack ?? exception.message);
    }

    response.status(statusCode).json({
      statusCode,
      error: errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

- [ ] **Step 3: Register the filter globally in `main.ts`**

Add the import and `app.useGlobalFilters(new HttpExceptionFilter())` after `useGlobalPipes`:

```ts
// backend/src/main.ts (additions only)
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// ...after useGlobalPipes:
app.useGlobalFilters(new HttpExceptionFilter());
```

- [ ] **Step 4: Build and boot**

```bash
npm run build
npm run start:dev
```

```bash
curl -s -i http://localhost:3001/health-nonexistent
```

Expected: 404 with JSON body of the shape `{ "statusCode": 404, "error": "...", "message": "...", "timestamp": "...", "path": "..." }`. Kill server.

- [ ] **Step 5: Commit**

```bash
git add backend/src/common backend/src/main.ts
git commit -m "feat(backend): add HttpExceptionFilter + EwaRuleError"
```

---

### Task 1.3: Tenant + Actor interceptors and parameter decorators

Tenant interceptor in this phase just attaches `{ id: <header value> }` to `request.company` — no DB lookup yet (Company entity comes in Phase 2; Task 2.2 enhances this interceptor to actually load the row).

**Files:**
- Create: `backend/src/common/tenant/tenant.types.ts`
- Create: `backend/src/common/tenant/public.decorator.ts`
- Create: `backend/src/common/tenant/tenant.interceptor.ts`
- Create: `backend/src/common/tenant/current-company.decorator.ts`
- Create: `backend/src/common/auth/actor.types.ts`
- Create: `backend/src/common/auth/actor.interceptor.ts`
- Create: `backend/src/common/auth/current-actor.decorator.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/modules/health/health.controller.ts`

- [ ] **Step 1: Tenant context type**

```ts
// backend/src/common/tenant/tenant.types.ts
export interface TenantContext {
  id: string;
  name?: string;
  active?: boolean;
}
```

- [ ] **Step 2: `@Public()` decorator that opts a route out of the tenant guard**

```ts
// backend/src/common/tenant/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { PUBLIC_ROUTES_KEY } from '../constants';

export const Public = () => SetMetadata(PUBLIC_ROUTES_KEY, true);
```

- [ ] **Step 3: TenantInterceptor — Phase-1 shape (header-only)**

```ts
// backend/src/common/tenant/tenant.interceptor.ts
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import {
  HEADER_COMPANY_ID,
  PUBLIC_ROUTES_KEY,
  REQUEST_KEY_COMPANY,
} from '../constants';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return next.handle();

    const request = context.switchToHttp().getRequest();
    const companyId = request.header(HEADER_COMPANY_ID);
    if (!companyId || typeof companyId !== 'string') {
      throw new BadRequestException(`Missing required header: ${HEADER_COMPANY_ID}`);
    }

    // Phase 2 (Task 2.2) replaces this stub with a real DB lookup.
    request[REQUEST_KEY_COMPANY] = { id: companyId };

    return next.handle();
  }
}
```

- [ ] **Step 4: `@CurrentCompany()` parameter decorator**

```ts
// backend/src/common/tenant/current-company.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_KEY_COMPANY } from '../constants';
import { TenantContext } from './tenant.types';

export const CurrentCompany = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): TenantContext => {
    const req = ctx.switchToHttp().getRequest();
    return req[REQUEST_KEY_COMPANY] as TenantContext;
  },
);
```

- [ ] **Step 5: Actor context type**

```ts
// backend/src/common/auth/actor.types.ts
export type ActorKind = 'hr' | 'employee' | 'system';

export interface ActorContext {
  id: string;
  kind: ActorKind;
  name?: string;
  role?: string | null;
}

export const SYSTEM_ACTOR: ActorContext = {
  id: 'system',
  kind: 'system',
  name: 'system',
  role: null,
};
```

- [ ] **Step 6: ActorInterceptor — Phase-1 shape (header-only)**

```ts
// backend/src/common/auth/actor.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  HEADER_ACTOR_ID,
  REQUEST_KEY_ACTOR,
} from '../constants';
import { ActorContext, SYSTEM_ACTOR } from './actor.types';

@Injectable()
export class ActorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const actorId = request.header(HEADER_ACTOR_ID);

    let actor: ActorContext;
    if (typeof actorId === 'string' && actorId.length > 0) {
      const kind: ActorContext['kind'] = actorId.startsWith('HR-')
        ? 'hr'
        : actorId.startsWith('EMP-')
          ? 'employee'
          : 'system';
      // Phase 4 (Task 4.x) replaces this stub with a DB lookup that
      // verifies the actor belongs to request.company and populates name/role.
      actor = { id: actorId, kind };
    } else {
      actor = SYSTEM_ACTOR;
    }

    request[REQUEST_KEY_ACTOR] = actor;
    return next.handle();
  }
}
```

- [ ] **Step 7: `@CurrentActor()` parameter decorator**

```ts
// backend/src/common/auth/current-actor.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_KEY_ACTOR } from '../constants';
import { ActorContext, SYSTEM_ACTOR } from './actor.types';

export const CurrentActor = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ActorContext => {
    const req = ctx.switchToHttp().getRequest();
    return (req[REQUEST_KEY_ACTOR] as ActorContext) ?? SYSTEM_ACTOR;
  },
);
```

- [ ] **Step 8: Register both interceptors globally**

```ts
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './db/data-source';
import { HealthModule } from './modules/health/health.module';
import { TenantInterceptor } from './common/tenant/tenant.interceptor';
import { ActorInterceptor } from './common/auth/actor.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    HealthModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ActorInterceptor },
  ],
})
export class AppModule {}
```

- [ ] **Step 9: Make `/health` public via `@Public()`**

```ts
// backend/src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/tenant/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness check (public)' })
  @ApiOkResponse({
    schema: { example: { status: 'ok', uptime: 123.4, timestamp: '2026-05-11T00:00:00.000Z' } },
  })
  check() {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }
}
```

- [ ] **Step 10: Build and verify**

```bash
npm run build
npm run start:dev
```

```bash
# Public: no header needed
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/health
# Expected: 200

# Non-public: trigger missing-header path by hitting a route that exists later (none yet)
# Confirm only that the build is clean and /health still works.
```

Kill server.

- [ ] **Step 11: Commit**

```bash
git add backend/src
git commit -m "feat(backend): add tenant + actor interceptors and @Public/@CurrentCompany/@CurrentActor"
```

---

### Task 1.4: `CompanyScopedRepository` base

This base auto-applies `where: { companyId }` to all `find*` / `update` / `delete` operations so domain services never have to remember it.

**Files:**
- Create: `backend/src/common/tenant/company-scoped.repository.ts`

- [ ] **Step 1: Implement the base**

```ts
// backend/src/common/tenant/company-scoped.repository.ts
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';

export interface HasCompanyId {
  companyId: string;
}

export class CompanyScopedRepository<T extends ObjectLiteral & HasCompanyId> {
  constructor(protected readonly repo: Repository<T>) {}

  protected scope(companyId: string, where?: FindOptionsWhere<T> | FindOptionsWhere<T>[]): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    if (Array.isArray(where)) {
      return where.map((w) => ({ ...w, companyId } as unknown as FindOptionsWhere<T>));
    }
    return { ...(where ?? {}), companyId } as unknown as FindOptionsWhere<T>;
  }

  findAll(companyId: string, opts: FindManyOptions<T> = {}): Promise<[T[], number]> {
    return this.repo.findAndCount({
      ...opts,
      where: this.scope(companyId, opts.where as FindOptionsWhere<T>),
    });
  }

  findOneBy(companyId: string, where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repo.findOne({ where: this.scope(companyId, where) as FindOptionsWhere<T> } as FindOneOptions<T>);
  }

  findById(companyId: string, id: string): Promise<T | null> {
    return this.findOneBy(companyId, { id } as unknown as FindOptionsWhere<T>);
  }

  async createOne(companyId: string, partial: DeepPartial<T>): Promise<T> {
    const entity = this.repo.create({ ...partial, companyId } as DeepPartial<T>);
    return this.repo.save(entity);
  }

  async updateById(companyId: string, id: string, patch: DeepPartial<T>): Promise<T | null> {
    const found = await this.findById(companyId, id);
    if (!found) return null;
    Object.assign(found, patch);
    return this.repo.save(found);
  }

  async deleteById(companyId: string, id: string): Promise<boolean> {
    const found = await this.findById(companyId, id);
    if (!found) return false;
    await this.repo.remove(found);
    return true;
  }

  get manager(): EntityManager {
    return this.repo.manager;
  }

  get raw(): Repository<T> {
    return this.repo;
  }
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add backend/src/common/tenant/company-scoped.repository.ts
git commit -m "feat(backend): add CompanyScopedRepository base"
```

---

### Task 1.5: `AuditLog` entity + initial migration

**Files:**
- Create: `backend/src/modules/audit-logs/entities/audit-log.entity.ts`
- Create: `backend/src/db/migrations/1715472000000-init-audit-logs.ts`
- Modify: `backend/package.json` (scripts)

- [ ] **Step 1: Add migration scripts to `package.json`**

In `backend/package.json` `scripts`, add (keeping existing scripts):

```json
{
  "scripts": {
    "db:reset": "rm -f data/payday.db",
    "db:migrate": "typeorm-ts-node-commonjs migration:run -d src/db/data-source.ts",
    "db:revert": "typeorm-ts-node-commonjs migration:revert -d src/db/data-source.ts"
  }
}
```

Install the ts-node bridge:

```bash
npm install -D typeorm
```

(`typeorm` is already a dep; this is a no-op but ensures the CLI binary `typeorm-ts-node-commonjs` is on path.)

- [ ] **Step 2: Create the AuditLog entity**

```ts
// backend/src/modules/audit-logs/entities/audit-log.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

export type AuditAction =
  | 'request_created'
  | 'request_approved'
  | 'request_rejected'
  | 'request_on_behalf'
  | 'request_disbursed'
  | 'settings_changed'
  | 'employee_overrides_changed'
  | 'employee_suspended'
  | 'employee_reinstated'
  | 'employee_deleted'
  | 'transfer_settled'
  | 'transfer_retried'
  | 'transfer_batched';

export type AuditTargetType = 'request' | 'employee' | 'settings' | 'transfer' | 'company';

@Entity('audit_logs')
@Index(['companyId', 'createdAt'])
@Index(['companyId', 'actorId'])
@Index(['companyId', 'targetId'])
export class AuditLog {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  companyId!: string;

  @Column({ type: 'text' })
  action!: AuditAction;

  @Column({ type: 'text' })
  actorId!: string;

  @Column({ type: 'text' })
  actorName!: string;

  @Column({ type: 'text', nullable: true })
  actorRole!: string | null;

  @Column({ type: 'text' })
  targetId!: string;

  @Column({ type: 'text' })
  targetType!: AuditTargetType;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
```

- [ ] **Step 3: Create the initial migration**

```ts
// backend/src/db/migrations/1715472000000-init-audit-logs.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAuditLogs1715472000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" text PRIMARY KEY NOT NULL,
        "companyId" text NOT NULL,
        "action" text NOT NULL,
        "actorId" text NOT NULL,
        "actorName" text NOT NULL,
        "actorRole" text,
        "targetId" text NOT NULL,
        "targetType" text NOT NULL,
        "description" text NOT NULL,
        "metadata" text,
        "ipAddress" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_company_created" ON "audit_logs" ("companyId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_company_actor" ON "audit_logs" ("companyId", "actorId")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_company_target" ON "audit_logs" ("companyId", "targetId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_company_target"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_company_actor"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_company_created"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
```

- [ ] **Step 4: Boot — migration runs automatically**

```bash
npm run db:reset
npm run start:dev
```

Expected log: `Migration InitAuditLogs1715472000000 has been executed successfully.` The `audit_logs` table exists. Kill server.

- [ ] **Step 5: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/modules/audit-logs backend/src/db/migrations
git commit -m "feat(backend): audit_log entity + initial migration"
```

---

### Task 1.6: `AuditInterceptor` + `@Audited` decorator (writes audit rows)

**Files:**
- Create: `backend/src/common/audit/audited.decorator.ts`
- Create: `backend/src/common/audit/audit.service.ts`
- Create: `backend/src/common/audit/audit.interceptor.ts`
- Create: `backend/src/common/audit/audit.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: ID helper for audit log rows**

Add inline ID generation in the audit service (full ID generator helpers come in Task 1.7).

- [ ] **Step 2: `@Audited()` decorator**

```ts
// backend/src/common/audit/audited.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { AuditAction, AuditTargetType } from '../../modules/audit-logs/entities/audit-log.entity';

export const AUDITED_KEY = 'audit:meta';

export interface AuditedMeta {
  action: AuditAction;
  targetType: AuditTargetType;
  target?: (req: Request, response: unknown) => string;
  description?: (req: Request, response: unknown) => string;
  metadata?: (req: Request, response: unknown) => Record<string, unknown>;
}

export const Audited = (meta: AuditedMeta) => SetMetadata(AUDITED_KEY, meta);
```

- [ ] **Step 3: AuditService**

```ts
// backend/src/common/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditTargetType } from '../../modules/audit-logs/entities/audit-log.entity';
import { ActorContext } from '../auth/actor.types';

export interface AuditWrite {
  companyId: string;
  action: AuditAction;
  targetId: string;
  targetType: AuditTargetType;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  actor: ActorContext;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>,
  ) {}

  async record(write: AuditWrite): Promise<AuditLog> {
    const ts = Date.now().toString(36).toUpperCase();
    const id = `AUD-${ts}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
    const entity = this.repo.create({
      id,
      companyId: write.companyId,
      action: write.action,
      actorId: write.actor.id,
      actorName: write.actor.name ?? write.actor.id,
      actorRole: write.actor.role ?? null,
      targetId: write.targetId,
      targetType: write.targetType,
      description: write.description,
      metadata: write.metadata ?? null,
      ipAddress: write.ipAddress ?? null,
    });
    return this.repo.save(entity);
  }
}
```

- [ ] **Step 4: AuditInterceptor**

```ts
// backend/src/common/audit/audit.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDITED_KEY, AuditedMeta } from './audited.decorator';
import { AuditService } from './audit.service';
import { REQUEST_KEY_ACTOR, REQUEST_KEY_COMPANY } from '../constants';
import { ActorContext, SYSTEM_ACTOR } from '../auth/actor.types';
import { TenantContext } from '../tenant/tenant.types';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditInterceptor');

  constructor(
    private readonly reflector: Reflector,
    private readonly audits: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditedMeta | undefined>(AUDITED_KEY, context.getHandler());
    if (!meta) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const company = (request as unknown as Record<string, TenantContext>)[REQUEST_KEY_COMPANY];
    const actor = ((request as unknown as Record<string, ActorContext>)[REQUEST_KEY_ACTOR]) ?? SYSTEM_ACTOR;

    return next.handle().pipe(
      tap((response) => {
        if (!company) return;
        const targetId = meta.target ? meta.target(request, response) : (request.params?.id ?? 'unknown');
        const description = meta.description ? meta.description(request, response) : `${meta.action} on ${meta.targetType}:${targetId}`;
        const metadata = meta.metadata ? meta.metadata(request, response) : undefined;
        this.audits
          .record({
            companyId: company.id,
            action: meta.action,
            targetId,
            targetType: meta.targetType,
            description,
            metadata,
            ipAddress: request.ip ?? null,
            actor,
          })
          .catch((err) => this.logger.error(`audit write failed: ${err}`));
      }),
    );
  }
}
```

- [ ] **Step 5: AuditModule**

```ts
// backend/src/common/audit/audit.module.ts
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../../modules/audit-logs/entities/audit-log.entity';
import { AuditService } from './audit.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
```

- [ ] **Step 6: Register AuditModule + AuditInterceptor in `app.module.ts`**

```ts
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './db/data-source';
import { HealthModule } from './modules/health/health.module';
import { TenantInterceptor } from './common/tenant/tenant.interceptor';
import { ActorInterceptor } from './common/auth/actor.interceptor';
import { AuditModule } from './common/audit/audit.module';
import { AuditInterceptor } from './common/audit/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    AuditModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ActorInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
```

- [ ] **Step 7: Build and boot**

```bash
npm run build
npm run start:dev
```

Expected: no errors. `audit_logs` table is still empty (no decorated endpoints yet). Kill server.

- [ ] **Step 8: Commit**

```bash
git add backend/src
git commit -m "feat(backend): audit interceptor + service + @Audited decorator"
```

---

### Task 1.7: ID generators

**Files:**
- Create: `backend/src/ewa/ids/id-generators.ts`

- [ ] **Step 1: Implement generators ported from `lib/utils/ewa-calculations.ts`**

```ts
// backend/src/ewa/ids/id-generators.ts
import dayjs from 'dayjs';

export function generateEWAId(employeeId: string, now: Date = new Date()): string {
  const date = dayjs(now).format('YYYYMMDD');
  const empNum = employeeId.replace(/^EMP-/, '');
  return `EWA-${date}-${empNum}`;
}

export function generateTransferId(now: Date = new Date()): string {
  const date = dayjs(now).format('YYYYMMDD');
  const rand = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `TRF-${date}-${rand}`;
}

export function generateAuditId(now: Date = new Date()): string {
  const ts = now.getTime().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `AUD-${ts}-${rand}`;
}

export function generateCompanyId(seq: number): string {
  return `COMP-${seq.toString().padStart(3, '0')}`;
}

export function generateNotificationId(now: Date = new Date()): string {
  const ts = now.getTime().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `NOTIF-${ts}-${rand}`;
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add backend/src/ewa
git commit -m "feat(backend): ID generators (EWA, transfer, audit, company, notification)"
```

---

## Phase 1 checkpoint

- Build is clean
- `/health` still responds, still public
- `audit_logs` table exists in SQLite
- Interceptors registered but no business endpoints yet

---

## Phase 2 — Foundational entities (Company, Department, HRUser)

**Outcome:** Company / Department / HRUser CRUD is live. `TenantInterceptor` upgraded to load the company row (404 on missing/inactive).

---

### Task 2.1: Company entity + module + public endpoints

**Files:**
- Create: `backend/src/modules/companies/entities/company.entity.ts`
- Create: `backend/src/modules/companies/dto/create-company.dto.ts`
- Create: `backend/src/modules/companies/dto/update-company.dto.ts`
- Create: `backend/src/modules/companies/dto/company.dto.ts`
- Create: `backend/src/modules/companies/companies.service.ts`
- Create: `backend/src/modules/companies/companies.controller.ts`
- Create: `backend/src/modules/companies/companies.module.ts`
- Create: `backend/src/db/migrations/1715472100000-add-companies.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Entity**

```ts
// backend/src/modules/companies/entities/company.entity.ts
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  nameEn!: string | null;

  @Column({ type: 'text', nullable: true })
  code!: string | null;

  @Column({ type: 'integer', default: 1 })
  active!: number; // sqlite has no boolean — 1/0

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
```

- [ ] **Step 2: Migration**

```ts
// backend/src/db/migrations/1715472100000-add-companies.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanies1715472100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "nameEn" text,
        "code" text,
        "active" integer NOT NULL DEFAULT 1,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uniq_companies_code" ON "companies" ("code") WHERE "code" IS NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uniq_companies_code"`);
    await queryRunner.query(`DROP TABLE "companies"`);
  }
}
```

- [ ] **Step 3: DTOs**

```ts
// backend/src/modules/companies/dto/create-company.dto.ts
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'COMP-003' })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  id!: string;

  @ApiProperty({ example: 'โรงงาน Acme' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 'Acme Manufacturing' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ example: 'ACME' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
```

```ts
// backend/src/modules/companies/dto/update-company.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';

export class UpdateCompanyDto extends PartialType(OmitType(CreateCompanyDto, ['id'] as const)) {}
```

```ts
// backend/src/modules/companies/dto/company.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CompanyDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) nameEn!: string | null;
  @ApiProperty({ nullable: true }) code!: string | null;
  @ApiProperty() active!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
```

- [ ] **Step 4: Service**

```ts
// backend/src/modules/companies/companies.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(@InjectRepository(Company) private readonly repo: Repository<Company>) {}

  async list(limit: number, offset: number): Promise<{ data: CompanyDto[]; total: number; limit: number; offset: number }> {
    const [rows, total] = await this.repo.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'ASC' },
    });
    return { data: rows.map(this.toDto), total, limit, offset };
  }

  async findOne(id: string): Promise<CompanyDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Company ${id} not found`);
    return this.toDto(row);
  }

  async create(dto: CreateCompanyDto): Promise<CompanyDto> {
    const exists = await this.repo.findOne({ where: { id: dto.id } });
    if (exists) throw new ConflictException(`Company ${dto.id} already exists`);
    const saved = await this.repo.save(
      this.repo.create({
        id: dto.id,
        name: dto.name,
        nameEn: dto.nameEn ?? null,
        code: dto.code ?? null,
        active: dto.active === false ? 0 : 1,
      }),
    );
    return this.toDto(saved);
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<CompanyDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Company ${id} not found`);
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.nameEn !== undefined) row.nameEn = dto.nameEn ?? null;
    if (dto.code !== undefined) row.code = dto.code ?? null;
    if (dto.active !== undefined) row.active = dto.active ? 1 : 0;
    return this.toDto(await this.repo.save(row));
  }

  async loadActiveOrThrow(id: string): Promise<Company> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row || row.active !== 1) {
      throw new NotFoundException(`Company ${id} not found or inactive`);
    }
    return row;
  }

  private toDto = (c: Company): CompanyDto => ({
    id: c.id,
    name: c.name,
    nameEn: c.nameEn,
    code: c.code,
    active: c.active === 1,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  });
}
```

- [ ] **Step 5: Controller**

```ts
// backend/src/modules/companies/companies.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyDto } from './dto/company.dto';
import { Public } from '../../common/tenant/public.decorator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List companies (public — used by the pre-login selector)' })
  list(@Query() q: ListQueryDto) {
    return this.service.list(q.limit ?? 20, q.offset ?? 0);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get one company (public)' })
  @ApiOkResponse({ type: CompanyDto })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a company (public; bootstraps payroll cycles + settings in Phase 3)' })
  @ApiOkResponse({ type: CompanyDto })
  create(@Body() dto: CreateCompanyDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a company (requires matching x-company-id)' })
  @ApiOkResponse({ type: CompanyDto })
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.service.update(id, dto);
  }
}
```

- [ ] **Step 6: Module**

```ts
// backend/src/modules/companies/companies.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
```

- [ ] **Step 7: Wire into AppModule**

Add `CompaniesModule` to the `imports` array in `backend/src/app.module.ts`.

- [ ] **Step 8: Build, boot, verify**

```bash
npm run db:reset && npm run start:dev
```

```bash
# create
curl -s -X POST http://localhost:3001/companies -H 'content-type: application/json' \
  -d '{"id":"COMP-001","name":"โรงงานไทยดี จำกัด","nameEn":"Thaidee Factory","code":"TD"}' | head

# list
curl -s http://localhost:3001/companies | head

# get one
curl -s http://localhost:3001/companies/COMP-001 | head
```

Expected: each call returns 200 JSON. Reload `/docs` — `companies` tag has GET/GET-one/POST/PATCH. Kill server.

- [ ] **Step 9: Commit**

```bash
git add backend/src backend/src/db/migrations/1715472100000-add-companies.ts
git commit -m "feat(backend): companies module + entity + public endpoints"
```

---

### Task 2.2: Upgrade `TenantInterceptor` to load and validate the company

**Files:**
- Modify: `backend/src/common/tenant/tenant.interceptor.ts`
- Modify: `backend/src/common/tenant/tenant.module.ts` (new)
- Modify: `backend/src/app.module.ts`
- Create: `backend/src/common/tenant/tenant.module.ts`

- [ ] **Step 1: Make `TenantInterceptor` injectable with `CompaniesService` dependency**

```ts
// backend/src/common/tenant/tenant.interceptor.ts
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, switchMap } from 'rxjs';
import {
  HEADER_COMPANY_ID,
  PUBLIC_ROUTES_KEY,
  REQUEST_KEY_COMPANY,
} from '../constants';
import { CompaniesService } from '../../modules/companies/companies.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly companies: CompaniesService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return next.handle();

    const request = context.switchToHttp().getRequest();
    const companyId = request.header(HEADER_COMPANY_ID);
    if (!companyId || typeof companyId !== 'string') {
      throw new BadRequestException(`Missing required header: ${HEADER_COMPANY_ID}`);
    }

    return from(this.companies.loadActiveOrThrow(companyId)).pipe(
      switchMap((company) => {
        request[REQUEST_KEY_COMPANY] = {
          id: company.id,
          name: company.name,
          active: company.active === 1,
        };
        return next.handle();
      }),
    );
  }
}
```

Note: `loadActiveOrThrow` throws `NotFoundException` if missing or inactive — that propagates as a 404 via the HttpExceptionFilter.

- [ ] **Step 2: Re-export CompaniesService visibility**

`CompaniesService` is exported from `CompaniesModule` (already exported in Task 2.1 step 6). The `TenantInterceptor` needs to be in a module that imports `CompaniesModule`. Move the registration: instead of using `APP_INTERCEPTOR` directly in `AppModule`, create a `TenantModule`:

```ts
// backend/src/common/tenant/tenant.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CompaniesModule } from '../../modules/companies/companies.module';
import { TenantInterceptor } from './tenant.interceptor';

@Module({
  imports: [CompaniesModule],
  providers: [{ provide: APP_INTERCEPTOR, useClass: TenantInterceptor }],
})
export class TenantModule {}
```

- [ ] **Step 3: Update `app.module.ts`**

Remove the inline `APP_INTERCEPTOR` for `TenantInterceptor`. Add `TenantModule` to `imports`. Keep ActorInterceptor and AuditInterceptor as inline providers.

```ts
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './db/data-source';
import { HealthModule } from './modules/health/health.module';
import { ActorInterceptor } from './common/auth/actor.interceptor';
import { AuditModule } from './common/audit/audit.module';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { CompaniesModule } from './modules/companies/companies.module';
import { TenantModule } from './common/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    AuditModule,
    CompaniesModule,
    TenantModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ActorInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
```

- [ ] **Step 4: Build, boot, verify**

```bash
npm run build
npm run start:dev
```

```bash
# Public still works
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/companies
# Expected: 200

# Hit /companies/COMP-001 with no header (should still be 200 — public)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/companies/COMP-001
# Expected: 200

# PATCH /companies/:id is NOT public — should 400 without header
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:3001/companies/COMP-001 \
  -H 'content-type: application/json' -d '{"name":"x"}'
# Expected: 400 (missing header)

# With wrong company → 404
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:3001/companies/COMP-001 \
  -H 'content-type: application/json' -H 'x-company-id: COMP-DOESNOTEXIST' -d '{"name":"x"}'
# Expected: 404

# With correct company → 200
curl -s -X PATCH http://localhost:3001/companies/COMP-001 \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' -d '{"name":"renamed"}' | head
# Expected: 200, body shows name="renamed"
```

Kill server.

- [ ] **Step 5: Commit**

```bash
git add backend/src
git commit -m "feat(backend): tenant interceptor now loads + validates company"
```

---

### Task 2.3: Department entity + module + endpoints

**Files:**
- Create: `backend/src/modules/departments/entities/department.entity.ts`
- Create: `backend/src/modules/departments/dto/{create,update,department}.dto.ts`
- Create: `backend/src/modules/departments/departments.service.ts`
- Create: `backend/src/modules/departments/departments.controller.ts`
- Create: `backend/src/modules/departments/departments.module.ts`
- Create: `backend/src/db/migrations/1715472200000-add-departments.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Entity**

```ts
// backend/src/modules/departments/entities/department.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('departments')
@Index(['companyId', 'id'], { unique: true })
export class Department {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  companyId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  nameEn!: string | null;

  @Column({ type: 'integer', default: 0 })
  headCount!: number;

  @Column({ type: 'integer', default: 0 })
  ewaEnrolled!: number;

  @Column({ type: 'text', nullable: true })
  managerId!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
```

- [ ] **Step 2: Migration**

```ts
// backend/src/db/migrations/1715472200000-add-departments.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartments1715472200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" text NOT NULL,
        "companyId" text NOT NULL,
        "name" text NOT NULL,
        "nameEn" text,
        "headCount" integer NOT NULL DEFAULT 0,
        "ewaEnrolled" integer NOT NULL DEFAULT 0,
        "managerId" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY ("companyId", "id")
      )
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "departments"`);
  }
}
```

- [ ] **Step 3: DTOs**

```ts
// backend/src/modules/departments/dto/create-department.dto.ts
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'dept-prod-a' })
  @IsString() id!: string;

  @ApiProperty({ example: 'ผลิต A' })
  @IsString() name!: string;

  @ApiPropertyOptional({ example: 'Production A' })
  @IsOptional() @IsString() nameEn?: string;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional() @IsInt() @Min(0) headCount?: number;

  @ApiPropertyOptional({ example: 72 })
  @IsOptional() @IsInt() @Min(0) ewaEnrolled?: number;

  @ApiPropertyOptional({ example: 'EMP-0010' })
  @IsOptional() @IsString() managerId?: string;
}
```

```ts
// backend/src/modules/departments/dto/update-department.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDepartmentDto } from './create-department.dto';
export class UpdateDepartmentDto extends PartialType(OmitType(CreateDepartmentDto, ['id'] as const)) {}
```

```ts
// backend/src/modules/departments/dto/department.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class DepartmentDto {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) nameEn!: string | null;
  @ApiProperty() headCount!: number;
  @ApiProperty() ewaEnrolled!: number;
  @ApiProperty({ nullable: true }) managerId!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
```

- [ ] **Step 4: Service**

```ts
// backend/src/modules/departments/departments.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentDto } from './dto/department.dto';
import { CompanyScopedRepository } from '../../common/tenant/company-scoped.repository';

@Injectable()
export class DepartmentsService {
  private readonly scoped: CompanyScopedRepository<Department>;

  constructor(@InjectRepository(Department) repo: Repository<Department>) {
    this.scoped = new CompanyScopedRepository<Department>(repo);
  }

  async list(companyId: string, limit: number, offset: number) {
    const [rows, total] = await this.scoped.findAll(companyId, { take: limit, skip: offset, order: { id: 'ASC' } });
    return { data: rows.map(this.toDto), total, limit, offset };
  }

  async findOne(companyId: string, id: string): Promise<DepartmentDto> {
    const row = await this.scoped.findById(companyId, id);
    if (!row) throw new NotFoundException(`Department ${id} not found`);
    return this.toDto(row);
  }

  async create(companyId: string, dto: CreateDepartmentDto): Promise<DepartmentDto> {
    const exists = await this.scoped.findById(companyId, dto.id);
    if (exists) throw new ConflictException(`Department ${dto.id} already exists`);
    const saved = await this.scoped.createOne(companyId, {
      id: dto.id,
      name: dto.name,
      nameEn: dto.nameEn ?? null,
      headCount: dto.headCount ?? 0,
      ewaEnrolled: dto.ewaEnrolled ?? 0,
      managerId: dto.managerId ?? null,
    });
    return this.toDto(saved);
  }

  async update(companyId: string, id: string, dto: UpdateDepartmentDto): Promise<DepartmentDto> {
    const updated = await this.scoped.updateById(companyId, id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.nameEn !== undefined ? { nameEn: dto.nameEn ?? null } : {}),
      ...(dto.headCount !== undefined ? { headCount: dto.headCount } : {}),
      ...(dto.ewaEnrolled !== undefined ? { ewaEnrolled: dto.ewaEnrolled } : {}),
      ...(dto.managerId !== undefined ? { managerId: dto.managerId ?? null } : {}),
    });
    if (!updated) throw new NotFoundException(`Department ${id} not found`);
    return this.toDto(updated);
  }

  async remove(companyId: string, id: string): Promise<{ ok: true }> {
    const ok = await this.scoped.deleteById(companyId, id);
    if (!ok) throw new NotFoundException(`Department ${id} not found`);
    return { ok: true };
  }

  private toDto = (d: Department): DepartmentDto => ({
    id: d.id,
    companyId: d.companyId,
    name: d.name,
    nameEn: d.nameEn,
    headCount: d.headCount,
    ewaEnrolled: d.ewaEnrolled,
    managerId: d.managerId,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  });
}
```

- [ ] **Step 5: Controller**

```ts
// backend/src/modules/departments/departments.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CurrentCompany } from '../../common/tenant/current-company.decorator';
import { TenantContext } from '../../common/tenant/tenant.types';
import { ListQueryDto } from '../../common/dto/list-query.dto';

@ApiTags('departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List departments for the current company' })
  list(@CurrentCompany() company: TenantContext, @Query() q: ListQueryDto) {
    return this.service.list(company.id, q.limit ?? 20, q.offset ?? 0);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one department' })
  findOne(@CurrentCompany() company: TenantContext, @Param('id') id: string) {
    return this.service.findOne(company.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a department' })
  create(@CurrentCompany() company: TenantContext, @Body() dto: CreateDepartmentDto) {
    return this.service.create(company.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a department' })
  update(@CurrentCompany() company: TenantContext, @Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.service.update(company.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a department' })
  remove(@CurrentCompany() company: TenantContext, @Param('id') id: string) {
    return this.service.remove(company.id, id);
  }
}
```

- [ ] **Step 6: Module**

```ts
// backend/src/modules/departments/departments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Department])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
```

- [ ] **Step 7: Wire into AppModule and verify**

Add `DepartmentsModule` to `imports`.

```bash
npm run build
npm run start:dev
```

```bash
curl -s -X POST http://localhost:3001/departments \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' \
  -d '{"id":"dept-prod-a","name":"ผลิต A","nameEn":"Production A","headCount":85,"ewaEnrolled":72}' | head

curl -s http://localhost:3001/departments -H 'x-company-id: COMP-001' | head
```

Expected: both return 200. Kill server.

- [ ] **Step 8: Commit**

```bash
git add backend/src backend/src/db/migrations/1715472200000-add-departments.ts
git commit -m "feat(backend): departments module + CRUD + migration"
```

---

### Task 2.4: HRUser entity + module + endpoints

**Files:**
- Create: `backend/src/modules/hr-users/entities/hr-user.entity.ts`
- Create: `backend/src/modules/hr-users/dto/{create,update,hr-user}.dto.ts`
- Create: `backend/src/modules/hr-users/hr-users.service.ts`
- Create: `backend/src/modules/hr-users/hr-users.controller.ts`
- Create: `backend/src/modules/hr-users/hr-users.module.ts`
- Create: `backend/src/db/migrations/1715472300000-add-hr-users.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Entity**

```ts
// backend/src/modules/hr-users/entities/hr-user.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type HRRole = 'hr_manager' | 'accountant' | 'viewer';

@Entity('hr_users')
@Index(['companyId', 'id'], { unique: true })
@Index(['companyId', 'email'], { unique: true })
export class HRUser {
  @PrimaryColumn({ type: 'text' }) id!: string;
  @Column({ type: 'text' }) companyId!: string;
  @Column({ type: 'text' }) name!: string;
  @Column({ type: 'text', nullable: true }) nameEn!: string | null;
  @Column({ type: 'text' }) email!: string;
  @Column({ type: 'text' }) role!: HRRole;
  @Column({ type: 'text', nullable: true }) avatarInitials!: string | null;
  @Column({ type: 'text', nullable: true }) department!: string | null;
  @Column({ type: 'integer', default: 1 }) isActive!: number;
  @Column({ type: 'datetime', nullable: true }) lastLoginAt!: Date | null;
  @CreateDateColumn({ type: 'datetime' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'datetime' }) updatedAt!: Date;
}
```

- [ ] **Step 2: Migration**

```ts
// backend/src/db/migrations/1715472300000-add-hr-users.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHrUsers1715472300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "hr_users" (
        "id" text NOT NULL,
        "companyId" text NOT NULL,
        "name" text NOT NULL,
        "nameEn" text,
        "email" text NOT NULL,
        "role" text NOT NULL CHECK ("role" IN ('hr_manager','accountant','viewer')),
        "avatarInitials" text,
        "department" text,
        "isActive" integer NOT NULL DEFAULT 1,
        "lastLoginAt" datetime,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY ("companyId", "id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uniq_hr_users_company_email" ON "hr_users" ("companyId", "email")`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uniq_hr_users_company_email"`);
    await queryRunner.query(`DROP TABLE "hr_users"`);
  }
}
```

- [ ] **Step 3: DTOs**

```ts
// backend/src/modules/hr-users/dto/create-hr-user.dto.ts
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHRUserDto {
  @ApiProperty({ example: 'HR-001' })
  @IsString() id!: string;

  @ApiProperty({ example: 'สมศรี ใจดี' })
  @IsString() @MinLength(1) name!: string;

  @ApiPropertyOptional({ example: 'Somsri Jaidee' })
  @IsOptional() @IsString() nameEn?: string;

  @ApiProperty({ example: 'somsri@payday.com' })
  @IsEmail() email!: string;

  @ApiProperty({ enum: ['hr_manager', 'accountant', 'viewer'] })
  @IsIn(['hr_manager', 'accountant', 'viewer']) role!: 'hr_manager' | 'accountant' | 'viewer';

  @ApiPropertyOptional({ example: 'สศ' })
  @IsOptional() @IsString() avatarInitials?: string;

  @ApiPropertyOptional({ example: 'ฝ่ายบุคคล' })
  @IsOptional() @IsString() department?: string;
}
```

```ts
// backend/src/modules/hr-users/dto/update-hr-user.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateHRUserDto } from './create-hr-user.dto';
export class UpdateHRUserDto extends PartialType(OmitType(CreateHRUserDto, ['id'] as const)) {}
```

```ts
// backend/src/modules/hr-users/dto/hr-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HRUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) nameEn!: string | null;
  @ApiProperty() email!: string;
  @ApiProperty() role!: string;
  @ApiPropertyOptional({ nullable: true }) avatarInitials!: string | null;
  @ApiPropertyOptional({ nullable: true }) department!: string | null;
  @ApiProperty() isActive!: boolean;
  @ApiPropertyOptional({ nullable: true }) lastLoginAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
```

- [ ] **Step 4: Service**

```ts
// backend/src/modules/hr-users/hr-users.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HRUser } from './entities/hr-user.entity';
import { CreateHRUserDto } from './dto/create-hr-user.dto';
import { UpdateHRUserDto } from './dto/update-hr-user.dto';
import { HRUserDto } from './dto/hr-user.dto';
import { CompanyScopedRepository } from '../../common/tenant/company-scoped.repository';

@Injectable()
export class HRUsersService {
  private readonly scoped: CompanyScopedRepository<HRUser>;
  constructor(@InjectRepository(HRUser) repo: Repository<HRUser>) {
    this.scoped = new CompanyScopedRepository<HRUser>(repo);
  }

  async list(companyId: string, opts: { role?: string; isActive?: boolean; limit: number; offset: number }) {
    const where: Record<string, unknown> = {};
    if (opts.role) where.role = opts.role;
    if (opts.isActive !== undefined) where.isActive = opts.isActive ? 1 : 0;
    const [rows, total] = await this.scoped.findAll(companyId, {
      where,
      take: opts.limit,
      skip: opts.offset,
      order: { id: 'ASC' },
    });
    return { data: rows.map(this.toDto), total, limit: opts.limit, offset: opts.offset };
  }

  async findOne(companyId: string, id: string): Promise<HRUserDto> {
    const row = await this.scoped.findById(companyId, id);
    if (!row) throw new NotFoundException(`HRUser ${id} not found`);
    return this.toDto(row);
  }

  async create(companyId: string, dto: CreateHRUserDto): Promise<HRUserDto> {
    if (await this.scoped.findById(companyId, dto.id)) {
      throw new ConflictException(`HRUser ${dto.id} already exists`);
    }
    const saved = await this.scoped.createOne(companyId, {
      id: dto.id,
      name: dto.name,
      nameEn: dto.nameEn ?? null,
      email: dto.email,
      role: dto.role,
      avatarInitials: dto.avatarInitials ?? null,
      department: dto.department ?? null,
      isActive: 1,
    });
    return this.toDto(saved);
  }

  async update(companyId: string, id: string, dto: UpdateHRUserDto): Promise<HRUserDto> {
    const updated = await this.scoped.updateById(companyId, id, dto as Partial<HRUser>);
    if (!updated) throw new NotFoundException(`HRUser ${id} not found`);
    return this.toDto(updated);
  }

  async softDelete(companyId: string, id: string): Promise<{ ok: true }> {
    const updated = await this.scoped.updateById(companyId, id, { isActive: 0 } as Partial<HRUser>);
    if (!updated) throw new NotFoundException(`HRUser ${id} not found`);
    return { ok: true };
  }

  private toDto = (u: HRUser): HRUserDto => ({
    id: u.id,
    companyId: u.companyId,
    name: u.name,
    nameEn: u.nameEn,
    email: u.email,
    role: u.role,
    avatarInitials: u.avatarInitials,
    department: u.department,
    isActive: u.isActive === 1,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  });
}
```

- [ ] **Step 5: Controller**

```ts
// backend/src/modules/hr-users/hr-users.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { HRUsersService } from './hr-users.service';
import { CreateHRUserDto } from './dto/create-hr-user.dto';
import { UpdateHRUserDto } from './dto/update-hr-user.dto';
import { CurrentCompany } from '../../common/tenant/current-company.decorator';
import { TenantContext } from '../../common/tenant/tenant.types';
import { ListQueryDto } from '../../common/dto/list-query.dto';

class ListHRUsersQuery extends ListQueryDto {
  @ApiPropertyOptional({ enum: ['hr_manager', 'accountant', 'viewer'] })
  @IsOptional() @IsIn(['hr_manager', 'accountant', 'viewer']) role?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional() @Type(() => Boolean) @IsBoolean() isActive?: boolean;
}

@ApiTags('hr-users')
@Controller('hr-users')
export class HRUsersController {
  constructor(private readonly service: HRUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List HR users' })
  list(@CurrentCompany() company: TenantContext, @Query() q: ListHRUsersQuery) {
    return this.service.list(company.id, { role: q.role, isActive: q.isActive, limit: q.limit ?? 20, offset: q.offset ?? 0 });
  }

  @Get(':id')
  findOne(@CurrentCompany() company: TenantContext, @Param('id') id: string) {
    return this.service.findOne(company.id, id);
  }

  @Post()
  create(@CurrentCompany() company: TenantContext, @Body() dto: CreateHRUserDto) {
    return this.service.create(company.id, dto);
  }

  @Patch(':id')
  update(@CurrentCompany() company: TenantContext, @Param('id') id: string, @Body() dto: UpdateHRUserDto) {
    return this.service.update(company.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete (sets isActive=false)' })
  remove(@CurrentCompany() company: TenantContext, @Param('id') id: string) {
    return this.service.softDelete(company.id, id);
  }
}
```

- [ ] **Step 6: Module**

```ts
// backend/src/modules/hr-users/hr-users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HRUser } from './entities/hr-user.entity';
import { HRUsersService } from './hr-users.service';
import { HRUsersController } from './hr-users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HRUser])],
  controllers: [HRUsersController],
  providers: [HRUsersService],
  exports: [HRUsersService],
})
export class HRUsersModule {}
```

- [ ] **Step 7: Wire into AppModule, build, smoke**

Add `HRUsersModule` to `imports`.

```bash
npm run build && npm run start:dev
```

```bash
curl -s -X POST http://localhost:3001/hr-users \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' \
  -d '{"id":"HR-001","name":"สมศรี ใจดี","email":"somsri@payday.com","role":"hr_manager"}' | head
```

Expected: 200 with the created user. Kill server.

- [ ] **Step 8: Commit**

```bash
git add backend/src
git commit -m "feat(backend): hr-users module + CRUD + migration"
```

---

## Phase 2 checkpoint

- 3 entities live: Company, Department, HRUser
- Tenant guard rejects unknown companies (404)
- Swagger shows 3 module tags + health + companies
- `/companies` POST + GET still public; everything else needs `x-company-id`

---

## Phase 3 — Payroll cycles & settings (+ auto-bootstrap on company create)

**Outcome:** Each company has 2 `PayrollCycle` rows (monthly + weekly) and 1 `AppSettings` row, created automatically when the company is created. The company-level EWA policy editor (`PATCH /settings/policy/:cycle`) is live.

---

### Task 3.1: PayrollCycle entity + module

**Files:**
- Create: `backend/src/modules/payroll-cycles/entities/payroll-cycle.entity.ts`
- Create: `backend/src/modules/payroll-cycles/dto/{update,payroll-cycle}.dto.ts`
- Create: `backend/src/modules/payroll-cycles/payroll-cycles.service.ts`
- Create: `backend/src/modules/payroll-cycles/payroll-cycles.controller.ts`
- Create: `backend/src/modules/payroll-cycles/payroll-cycles.module.ts`
- Create: `backend/src/db/migrations/1715472400000-add-payroll-cycles.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Entity**

```ts
// backend/src/modules/payroll-cycles/entities/payroll-cycle.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type PayCycleType = 'monthly' | 'weekly';

@Entity('payroll_cycles')
@Index(['companyId', 'type'], { unique: true })
export class PayrollCycle {
  @PrimaryColumn({ type: 'text' }) id!: string;
  @Column({ type: 'text' }) companyId!: string;
  @Column({ type: 'text' }) type!: PayCycleType;
  @Column({ type: 'integer', default: 31 }) monthlyPayDay!: number;
  @Column({ type: 'integer', default: 25 }) monthlyEWACutoffDay!: number;
  @Column({ type: 'integer', default: 5 }) weeklyPayDayOfWeek!: number;
  @Column({ type: 'integer', default: 4 }) weeklyEWACutoffDayOfWeek!: number;
  @Column({ type: 'integer', default: 18 }) weeklyEWACutoffHour!: number;
  @Column({ type: 'simple-json', default: '[]' }) blackoutDates!: string[];
  @CreateDateColumn({ type: 'datetime' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'datetime' }) updatedAt!: Date;
}
```

- [ ] **Step 2: Migration**

```ts
// backend/src/db/migrations/1715472400000-add-payroll-cycles.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayrollCycles1715472400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payroll_cycles" (
        "id" text PRIMARY KEY NOT NULL,
        "companyId" text NOT NULL,
        "type" text NOT NULL CHECK ("type" IN ('monthly','weekly')),
        "monthlyPayDay" integer NOT NULL DEFAULT 31,
        "monthlyEWACutoffDay" integer NOT NULL DEFAULT 25,
        "weeklyPayDayOfWeek" integer NOT NULL DEFAULT 5,
        "weeklyEWACutoffDayOfWeek" integer NOT NULL DEFAULT 4,
        "weeklyEWACutoffHour" integer NOT NULL DEFAULT 18,
        "blackoutDates" text NOT NULL DEFAULT '[]',
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uniq_payroll_cycles_company_type" ON "payroll_cycles" ("companyId", "type")`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uniq_payroll_cycles_company_type"`);
    await queryRunner.query(`DROP TABLE "payroll_cycles"`);
  }
}
```

- [ ] **Step 3: DTOs**

```ts
// backend/src/modules/payroll-cycles/dto/payroll-cycle.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PayrollCycleDto {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty({ enum: ['monthly', 'weekly'] }) type!: 'monthly' | 'weekly';
  @ApiProperty() monthlyPayDay!: number;
  @ApiProperty() monthlyEWACutoffDay!: number;
  @ApiProperty() weeklyPayDayOfWeek!: number;
  @ApiProperty() weeklyEWACutoffDayOfWeek!: number;
  @ApiProperty() weeklyEWACutoffHour!: number;
  @ApiProperty({ type: [String] }) blackoutDates!: string[];
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
```

```ts
// backend/src/modules/payroll-cycles/dto/update-payroll-cycle.dto.ts
import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePayrollCycleDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 31 })
  @IsOptional() @IsInt() @Min(1) @Max(31) monthlyPayDay?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 31 })
  @IsOptional() @IsInt() @Min(1) @Max(31) monthlyEWACutoffDay?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 6 })
  @IsOptional() @IsInt() @Min(0) @Max(6) weeklyPayDayOfWeek?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 6 })
  @IsOptional() @IsInt() @Min(0) @Max(6) weeklyEWACutoffDayOfWeek?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 23 })
  @IsOptional() @IsInt() @Min(0) @Max(23) weeklyEWACutoffHour?: number;

  @ApiPropertyOptional({ type: [String], example: ['2026-04-13', '2026-04-14'] })
  @IsOptional() @IsArray() @IsString({ each: true }) blackoutDates?: string[];
}
```

- [ ] **Step 4: Service**

```ts
// backend/src/modules/payroll-cycles/payroll-cycles.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollCycle, PayCycleType } from './entities/payroll-cycle.entity';
import { UpdatePayrollCycleDto } from './dto/update-payroll-cycle.dto';
import { PayrollCycleDto } from './dto/payroll-cycle.dto';

@Injectable()
export class PayrollCyclesService {
  constructor(@InjectRepository(PayrollCycle) private readonly repo: Repository<PayrollCycle>) {}

  async list(companyId: string): Promise<{ data: PayrollCycleDto[]; total: number; limit: number; offset: number }> {
    const rows = await this.repo.find({ where: { companyId }, order: { type: 'ASC' } });
    return { data: rows.map(this.toDto), total: rows.length, limit: rows.length, offset: 0 };
  }

  async findOne(companyId: string, id: string): Promise<PayrollCycleDto> {
    const row = await this.repo.findOne({ where: { id, companyId } });
    if (!row) throw new NotFoundException(`PayrollCycle ${id} not found`);
    return this.toDto(row);
  }

  async update(companyId: string, id: string, dto: UpdatePayrollCycleDto): Promise<PayrollCycleDto> {
    const row = await this.repo.findOne({ where: { id, companyId } });
    if (!row) throw new NotFoundException(`PayrollCycle ${id} not found`);
    Object.assign(row, dto);
    return this.toDto(await this.repo.save(row));
  }

  /** Bootstraps monthly + weekly cycles for a new company. */
  async bootstrapForCompany(companyId: string): Promise<PayrollCycle[]> {
    const cycles: Array<Pick<PayrollCycle, 'id' | 'companyId' | 'type'>> = [
      { id: `PC-${companyId}-MONTHLY`, companyId, type: 'monthly' },
      { id: `PC-${companyId}-WEEKLY`, companyId, type: 'weekly' },
    ];
    const entities = this.repo.create(cycles as PayrollCycle[]);
    return this.repo.save(entities);
  }

  async getByType(companyId: string, type: PayCycleType): Promise<PayrollCycle> {
    const row = await this.repo.findOne({ where: { companyId, type } });
    if (!row) throw new NotFoundException(`PayrollCycle (${type}) not found for ${companyId}`);
    return row;
  }

  private toDto = (c: PayrollCycle): PayrollCycleDto => ({
    id: c.id,
    companyId: c.companyId,
    type: c.type,
    monthlyPayDay: c.monthlyPayDay,
    monthlyEWACutoffDay: c.monthlyEWACutoffDay,
    weeklyPayDayOfWeek: c.weeklyPayDayOfWeek,
    weeklyEWACutoffDayOfWeek: c.weeklyEWACutoffDayOfWeek,
    weeklyEWACutoffHour: c.weeklyEWACutoffHour,
    blackoutDates: c.blackoutDates ?? [],
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  });
}
```

- [ ] **Step 5: Controller**

```ts
// backend/src/modules/payroll-cycles/payroll-cycles.controller.ts
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PayrollCyclesService } from './payroll-cycles.service';
import { UpdatePayrollCycleDto } from './dto/update-payroll-cycle.dto';
import { CurrentCompany } from '../../common/tenant/current-company.decorator';
import { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('payroll-cycles')
@Controller('payroll-cycles')
export class PayrollCyclesController {
  constructor(private readonly service: PayrollCyclesService) {}

  @Get()
  @ApiOperation({ summary: 'List the company\'s payroll cycles (typically 2 rows)' })
  list(@CurrentCompany() company: TenantContext) {
    return this.service.list(company.id);
  }

  @Get(':id')
  findOne(@CurrentCompany() company: TenantContext, @Param('id') id: string) {
    return this.service.findOne(company.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Adjust pay days, cutoffs, and blackout dates' })
  update(@CurrentCompany() company: TenantContext, @Param('id') id: string, @Body() dto: UpdatePayrollCycleDto) {
    return this.service.update(company.id, id, dto);
  }
}
```

- [ ] **Step 6: Module**

```ts
// backend/src/modules/payroll-cycles/payroll-cycles.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollCycle } from './entities/payroll-cycle.entity';
import { PayrollCyclesService } from './payroll-cycles.service';
import { PayrollCyclesController } from './payroll-cycles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PayrollCycle])],
  controllers: [PayrollCyclesController],
  providers: [PayrollCyclesService],
  exports: [PayrollCyclesService],
})
export class PayrollCyclesModule {}
```

- [ ] **Step 7: Wire, build, boot, verify (no bootstrap yet)**

Add `PayrollCyclesModule` to `imports` in `app.module.ts`.

```bash
npm run build && npm run start:dev
```

Reload `/docs` — `payroll-cycles` tag appears with 3 endpoints. `GET /payroll-cycles` returns empty list (no rows yet — bootstrap wires up in Task 3.3). Kill server.

- [ ] **Step 8: Commit**

```bash
git add backend/src
git commit -m "feat(backend): payroll-cycles module + bootstrap helper"
```

---

### Task 3.2: AppSettings entity + module

**Files:**
- Create: `backend/src/modules/settings/entities/app-settings.entity.ts`
- Create: `backend/src/modules/settings/dto/{ewa-policy,app-settings,update}.dto.ts`
- Create: `backend/src/modules/settings/settings.service.ts`
- Create: `backend/src/modules/settings/settings.controller.ts`
- Create: `backend/src/modules/settings/settings.module.ts`
- Create: `backend/src/db/migrations/1715472500000-add-settings.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Entity**

```ts
// backend/src/modules/settings/entities/app-settings.entity.ts
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export interface EwaPolicyJson {
  payCycle: 'monthly' | 'weekly';
  maxPercent: number;
  maxRequestsPerPeriod: number;
  minAmount: number;
  maxAmount: number;
  autoApprovalEnabled: boolean;
  autoApprovalThreshold: number;
  approvalChain: 'single' | 'two_step';
  blackoutDates: string[];
  weeklyPayDayOfWeek?: number;
  weeklyCutoffDayOfWeek?: number;
  weeklyCutoffHour?: number;
}

export interface NotificationSettingsJson {
  hrNewRequest: { email: boolean; line: boolean };
  hrOverdue: { email: boolean; line: boolean };
  employeeApproved: { line: boolean; sms: boolean };
  employeeRejected: { line: boolean; sms: boolean };
  employeePayday: { line: boolean; sms: boolean };
  lineNotifyToken: string;
}

@Entity('app_settings')
export class AppSettings {
  @PrimaryColumn({ type: 'text' }) companyId!: string;
  @Column({ type: 'text' }) companyName!: string;
  @Column({ type: 'text', nullable: true }) companyLogoUrl!: string | null;
  @Column({ type: 'simple-json' }) ewaMonthlyPolicy!: EwaPolicyJson;
  @Column({ type: 'simple-json' }) ewaWeeklyPolicy!: EwaPolicyJson;
  @Column({ type: 'simple-json' }) notificationSettings!: NotificationSettingsJson;
  @Column({ type: 'text', nullable: true }) updatedBy!: string | null;
  @CreateDateColumn({ type: 'datetime' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'datetime' }) updatedAt!: Date;
}

export const DEFAULT_MONTHLY_POLICY: EwaPolicyJson = {
  payCycle: 'monthly',
  maxPercent: 50,
  maxRequestsPerPeriod: 2,
  minAmount: 500,
  maxAmount: 10000,
  autoApprovalEnabled: true,
  autoApprovalThreshold: 3000,
  approvalChain: 'single',
  blackoutDates: ['2026-04-13', '2026-04-14', '2026-04-15'],
};

export const DEFAULT_WEEKLY_POLICY: EwaPolicyJson = {
  payCycle: 'weekly',
  maxPercent: 50,
  maxRequestsPerPeriod: 1,
  minAmount: 200,
  maxAmount: 5000,
  autoApprovalEnabled: false,
  autoApprovalThreshold: 0,
  approvalChain: 'single',
  weeklyPayDayOfWeek: 5,
  weeklyCutoffDayOfWeek: 4,
  weeklyCutoffHour: 18,
  blackoutDates: [],
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsJson = {
  hrNewRequest: { email: true, line: true },
  hrOverdue: { email: true, line: false },
  employeeApproved: { line: true, sms: false },
  employeeRejected: { line: true, sms: false },
  employeePayday: { line: true, sms: false },
  lineNotifyToken: '',
};
```

- [ ] **Step 2: Migration**

```ts
// backend/src/db/migrations/1715472500000-add-settings.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettings1715472500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "app_settings" (
        "companyId" text PRIMARY KEY NOT NULL,
        "companyName" text NOT NULL,
        "companyLogoUrl" text,
        "ewaMonthlyPolicy" text NOT NULL,
        "ewaWeeklyPolicy" text NOT NULL,
        "notificationSettings" text NOT NULL,
        "updatedBy" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "app_settings"`);
  }
}
```

- [ ] **Step 3: DTOs**

```ts
// backend/src/modules/settings/dto/ewa-policy.dto.ts
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EwaPolicyDto {
  @ApiProperty({ enum: ['monthly', 'weekly'] })
  @IsIn(['monthly', 'weekly']) payCycle!: 'monthly' | 'weekly';

  @ApiProperty() @IsNumber() @Min(0) @Max(100) maxPercent!: number;
  @ApiProperty() @IsInt() @Min(1) maxRequestsPerPeriod!: number;
  @ApiProperty() @IsInt() @Min(0) minAmount!: number;
  @ApiProperty() @IsInt() @Min(0) maxAmount!: number;
  @ApiProperty() @IsBoolean() autoApprovalEnabled!: boolean;
  @ApiProperty() @IsInt() @Min(0) autoApprovalThreshold!: number;

  @ApiProperty({ enum: ['single', 'two_step'] })
  @IsIn(['single', 'two_step']) approvalChain!: 'single' | 'two_step';

  @ApiProperty({ type: [String] })
  @IsArray() @IsString({ each: true }) blackoutDates!: string[];

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(6) weeklyPayDayOfWeek?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(6) weeklyCutoffDayOfWeek?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(23) weeklyCutoffHour?: number;
}

export class PartialEwaPolicyDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) maxPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxRequestsPerPeriod?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) minAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) maxAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() autoApprovalEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) autoApprovalThreshold?: number;
  @ApiPropertyOptional() @IsOptional() @IsIn(['single', 'two_step']) approvalChain?: 'single' | 'two_step';
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) blackoutDates?: string[];
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(6) weeklyPayDayOfWeek?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(6) weeklyCutoffDayOfWeek?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(23) weeklyCutoffHour?: number;
}
```

```ts
// backend/src/modules/settings/dto/update-settings.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() companyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyLogoUrl?: string | null;
}
```

```ts
// backend/src/modules/settings/dto/notification-settings.dto.ts
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ChannelToggle {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() email?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() line?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() sms?: boolean;
}

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ type: ChannelToggle }) @IsOptional() @ValidateNested() @Type(() => ChannelToggle) hrNewRequest?: ChannelToggle;
  @ApiPropertyOptional({ type: ChannelToggle }) @IsOptional() @ValidateNested() @Type(() => ChannelToggle) hrOverdue?: ChannelToggle;
  @ApiPropertyOptional({ type: ChannelToggle }) @IsOptional() @ValidateNested() @Type(() => ChannelToggle) employeeApproved?: ChannelToggle;
  @ApiPropertyOptional({ type: ChannelToggle }) @IsOptional() @ValidateNested() @Type(() => ChannelToggle) employeeRejected?: ChannelToggle;
  @ApiPropertyOptional({ type: ChannelToggle }) @IsOptional() @ValidateNested() @Type(() => ChannelToggle) employeePayday?: ChannelToggle;
  @ApiPropertyOptional() @IsOptional() @IsString() lineNotifyToken?: string;
}
```

```ts
// backend/src/modules/settings/dto/app-settings.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { EwaPolicyDto } from './ewa-policy.dto';

export class AppSettingsDto {
  @ApiProperty() companyId!: string;
  @ApiProperty() companyName!: string;
  @ApiProperty({ nullable: true }) companyLogoUrl!: string | null;
  @ApiProperty({ type: EwaPolicyDto }) ewaMonthlyPolicy!: EwaPolicyDto;
  @ApiProperty({ type: EwaPolicyDto }) ewaWeeklyPolicy!: EwaPolicyDto;
  @ApiProperty() notificationSettings!: Record<string, unknown>;
  @ApiProperty({ nullable: true }) updatedBy!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
```

- [ ] **Step 4: Service**

```ts
// backend/src/modules/settings/settings.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AppSettings,
  DEFAULT_MONTHLY_POLICY,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_WEEKLY_POLICY,
  EwaPolicyJson,
} from './entities/app-settings.entity';
import { AppSettingsDto } from './dto/app-settings.dto';
import { PartialEwaPolicyDto } from './dto/ewa-policy.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateNotificationSettingsDto } from './dto/notification-settings.dto';
import { PayCycleType } from '../payroll-cycles/entities/payroll-cycle.entity';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(AppSettings) private readonly repo: Repository<AppSettings>) {}

  async get(companyId: string): Promise<AppSettingsDto> {
    return this.toDto(await this.loadOrThrow(companyId));
  }

  async update(companyId: string, dto: UpdateSettingsDto, actorId: string | null): Promise<AppSettingsDto> {
    const s = await this.loadOrThrow(companyId);
    if (dto.companyName !== undefined) s.companyName = dto.companyName;
    if (dto.companyLogoUrl !== undefined) s.companyLogoUrl = dto.companyLogoUrl ?? null;
    s.updatedBy = actorId;
    return this.toDto(await this.repo.save(s));
  }

  async getPolicy(companyId: string, cycle: PayCycleType): Promise<EwaPolicyJson> {
    const s = await this.loadOrThrow(companyId);
    return cycle === 'monthly' ? s.ewaMonthlyPolicy : s.ewaWeeklyPolicy;
  }

  async updatePolicy(companyId: string, cycle: PayCycleType, dto: PartialEwaPolicyDto, actorId: string | null): Promise<EwaPolicyJson> {
    const s = await this.loadOrThrow(companyId);
    const target = cycle === 'monthly' ? s.ewaMonthlyPolicy : s.ewaWeeklyPolicy;
    const merged: EwaPolicyJson = { ...target, ...(dto as Partial<EwaPolicyJson>), payCycle: cycle };
    if (cycle === 'monthly') s.ewaMonthlyPolicy = merged;
    else s.ewaWeeklyPolicy = merged;
    s.updatedBy = actorId;
    await this.repo.save(s);
    return merged;
  }

  async updateNotifications(companyId: string, dto: UpdateNotificationSettingsDto, actorId: string | null): Promise<AppSettingsDto> {
    const s = await this.loadOrThrow(companyId);
    const ns = { ...s.notificationSettings };
    if (dto.hrNewRequest) ns.hrNewRequest = { ...ns.hrNewRequest, ...dto.hrNewRequest };
    if (dto.hrOverdue) ns.hrOverdue = { ...ns.hrOverdue, ...dto.hrOverdue };
    if (dto.employeeApproved) ns.employeeApproved = { ...ns.employeeApproved, ...dto.employeeApproved };
    if (dto.employeeRejected) ns.employeeRejected = { ...ns.employeeRejected, ...dto.employeeRejected };
    if (dto.employeePayday) ns.employeePayday = { ...ns.employeePayday, ...dto.employeePayday };
    if (dto.lineNotifyToken !== undefined) ns.lineNotifyToken = dto.lineNotifyToken;
    s.notificationSettings = ns;
    s.updatedBy = actorId;
    return this.toDto(await this.repo.save(s));
  }

  async bootstrapForCompany(companyId: string, companyName: string): Promise<AppSettings> {
    const entity = this.repo.create({
      companyId,
      companyName,
      companyLogoUrl: null,
      ewaMonthlyPolicy: { ...DEFAULT_MONTHLY_POLICY },
      ewaWeeklyPolicy: { ...DEFAULT_WEEKLY_POLICY },
      notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
      updatedBy: 'system',
    });
    return this.repo.save(entity);
  }

  private async loadOrThrow(companyId: string): Promise<AppSettings> {
    const s = await this.repo.findOne({ where: { companyId } });
    if (!s) throw new NotFoundException(`AppSettings for ${companyId} not found`);
    return s;
  }

  private toDto = (s: AppSettings): AppSettingsDto => ({
    companyId: s.companyId,
    companyName: s.companyName,
    companyLogoUrl: s.companyLogoUrl,
    ewaMonthlyPolicy: s.ewaMonthlyPolicy as unknown as AppSettingsDto['ewaMonthlyPolicy'],
    ewaWeeklyPolicy: s.ewaWeeklyPolicy as unknown as AppSettingsDto['ewaWeeklyPolicy'],
    notificationSettings: s.notificationSettings as unknown as Record<string, unknown>,
    updatedBy: s.updatedBy,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  });
}
```

- [ ] **Step 5: Controller**

```ts
// backend/src/modules/settings/settings.controller.ts
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { PartialEwaPolicyDto } from './dto/ewa-policy.dto';
import { UpdateNotificationSettingsDto } from './dto/notification-settings.dto';
import { CurrentCompany } from '../../common/tenant/current-company.decorator';
import { TenantContext } from '../../common/tenant/tenant.types';
import { CurrentActor } from '../../common/auth/current-actor.decorator';
import { ActorContext } from '../../common/auth/actor.types';
import { Audited } from '../../common/audit/audited.decorator';
import { PayCycleType } from '../payroll-cycles/entities/payroll-cycle.entity';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  get(@CurrentCompany() company: TenantContext) {
    return this.service.get(company.id);
  }

  @Patch()
  update(@CurrentCompany() company: TenantContext, @CurrentActor() actor: ActorContext, @Body() dto: UpdateSettingsDto) {
    return this.service.update(company.id, dto, actor.id);
  }

  @Get('policy/:cycle')
  @ApiOperation({ summary: 'Get EWA policy for monthly or weekly cycle' })
  getPolicy(@CurrentCompany() company: TenantContext, @Param('cycle') cycle: PayCycleType) {
    return this.service.getPolicy(company.id, cycle);
  }

  @Patch('policy/:cycle')
  @ApiOperation({ summary: 'Adjust company-wide EWA policy' })
  @Audited({
    action: 'settings_changed',
    targetType: 'settings',
    target: (req) => `policy:${req.params.cycle}`,
    description: (req) => `EWA policy (${req.params.cycle}) updated`,
    metadata: (req) => ({ patch: req.body }),
  })
  updatePolicy(
    @CurrentCompany() company: TenantContext,
    @CurrentActor() actor: ActorContext,
    @Param('cycle') cycle: PayCycleType,
    @Body() dto: PartialEwaPolicyDto,
  ) {
    return this.service.updatePolicy(company.id, cycle, dto, actor.id);
  }

  @Patch('notifications')
  updateNotifications(
    @CurrentCompany() company: TenantContext,
    @CurrentActor() actor: ActorContext,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.service.updateNotifications(company.id, dto, actor.id);
  }
}
```

- [ ] **Step 6: Module**

```ts
// backend/src/modules/settings/settings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSettings } from './entities/app-settings.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AppSettings])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
```

- [ ] **Step 7: Wire into AppModule, build, boot**

Add `SettingsModule` to `imports`.

```bash
npm run build && npm run start:dev
```

Reload `/docs` — `settings` tag with 5 endpoints. Kill server.

- [ ] **Step 8: Commit**

```bash
git add backend/src
git commit -m "feat(backend): settings module + EWA policy editor + bootstrap helper"
```

---

### Task 3.3: Auto-bootstrap PayrollCycle + AppSettings on `POST /companies`

**Files:**
- Modify: `backend/src/modules/companies/companies.module.ts`
- Modify: `backend/src/modules/companies/companies.service.ts`

- [ ] **Step 1: Inject `PayrollCyclesService` + `SettingsService` into `CompaniesService`**

```ts
// backend/src/modules/companies/companies.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyDto } from './dto/company.dto';
import { PayrollCyclesService } from '../payroll-cycles/payroll-cycles.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private readonly repo: Repository<Company>,
    private readonly cycles: PayrollCyclesService,
    private readonly settings: SettingsService,
  ) {}

  // ... (list / findOne / update / loadActiveOrThrow / toDto stay the same)

  async create(dto: CreateCompanyDto): Promise<CompanyDto> {
    const exists = await this.repo.findOne({ where: { id: dto.id } });
    if (exists) throw new ConflictException(`Company ${dto.id} already exists`);
    const saved = await this.repo.save(
      this.repo.create({
        id: dto.id,
        name: dto.name,
        nameEn: dto.nameEn ?? null,
        code: dto.code ?? null,
        active: dto.active === false ? 0 : 1,
      }),
    );
    await this.cycles.bootstrapForCompany(saved.id);
    await this.settings.bootstrapForCompany(saved.id, saved.name);
    return this.toDto(saved);
  }
}
```

(Keep the rest of the file from Task 2.1 unchanged — only `create` and the constructor are modified.)

- [ ] **Step 2: Import PayrollCyclesModule + SettingsModule into CompaniesModule**

```ts
// backend/src/modules/companies/companies.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { PayrollCyclesModule } from '../payroll-cycles/payroll-cycles.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), PayrollCyclesModule, SettingsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
```

- [ ] **Step 3: Build, boot, verify the bootstrap**

```bash
npm run db:reset && npm run start:dev
```

```bash
curl -s -X POST http://localhost:3001/companies \
  -H 'content-type: application/json' \
  -d '{"id":"COMP-001","name":"โรงงานไทยดี จำกัด","code":"TD"}' | head

# Cycles should now exist
curl -s http://localhost:3001/payroll-cycles -H 'x-company-id: COMP-001' | head

# Settings should exist
curl -s http://localhost:3001/settings -H 'x-company-id: COMP-001' | head

# Policy editor
curl -s -X PATCH http://localhost:3001/settings/policy/monthly \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' -H 'x-actor-id: HR-001' \
  -d '{"maxPercent":40}' | head
```

Expected: 2 cycle rows (`PC-COMP-001-MONTHLY`, `PC-COMP-001-WEEKLY`), 1 settings row with both policies populated, the PATCH returns the merged monthly policy with `maxPercent=40` and an `audit_logs` row is written (verify in next step).

- [ ] **Step 4: Verify audit log written**

```bash
# Use sqlite3 CLI; install if missing (brew install sqlite)
sqlite3 backend/data/payday.db "SELECT id, action, actorId, targetId FROM audit_logs ORDER BY createdAt DESC LIMIT 3;"
```

Expected: at least one row with `action=settings_changed`, `actorId=HR-001`, `targetId=policy:monthly`. Kill server.

- [ ] **Step 5: Commit**

```bash
git add backend/src
git commit -m "feat(backend): auto-bootstrap payroll-cycles + settings on POST /companies"
```

---

## Phase 3 checkpoint

- `POST /companies` produces a fully usable company (cycles + settings rows in place)
- `PATCH /settings/policy/:cycle` updates company-wide EWA policy
- Audit interceptor writes rows on settings changes
- Build clean, all endpoints respond as documented

---

## Phase 4 — Employees + EWA rules engine

**Outcome:** Employee CRUD lives. `EwaRulesService` and `EffectivePolicyService` resolve company policy + per-employee overrides. `GET /employees/:id/effective-policy` returns the resolved policy with provenance. `ActorInterceptor` upgraded to load the actor row from DB and reject cross-company actors.

---

### Task 4.1: Employee entity + migration

**Files:**
- Create: `backend/src/modules/employees/entities/employee.entity.ts`
- Create: `backend/src/db/migrations/1715472600000-add-employees.ts`

- [ ] **Step 1: Entity (override fields nullable; current-period stored as JSON snapshot)**

```ts
// backend/src/modules/employees/entities/employee.entity.ts
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type EmploymentType = 'full_time' | 'part_time' | 'contract';
export type PayCycle = 'monthly' | 'weekly';
export type EWAEligibility = 'eligible' | 'quota_used' | 'suspended';

export interface CurrentPeriodSnapshot {
  label: string;
  startDate: string;
  endDate: string;
  payDate: string;
  cutoffDate: string;
  workedDays: number;
  totalWorkDays: number;
  earnedToDate: number;
  previousEWAThisPeriod: number;
  maxWithdrawable: number;
  usedRequests: number;
  remainingRequests: number;
}

@Entity('employees')
@Index(['companyId', 'id'], { unique: true })
@Index(['companyId', 'department'])
@Index(['companyId', 'payCycle'])
export class Employee {
  @PrimaryColumn({ type: 'text' }) id!: string;
  @Column({ type: 'text' }) companyId!: string;

  @Column({ type: 'text' }) name!: string;
  @Column({ type: 'text', nullable: true }) nameEn!: string | null;
  @Column({ type: 'text', nullable: true }) avatarInitials!: string | null;

  @Column({ type: 'text' }) department!: string;
  @Column({ type: 'text', nullable: true }) departmentName!: string | null;
  @Column({ type: 'text', nullable: true }) position!: string | null;
  @Column({ type: 'text' }) startDate!: string;
  @Column({ type: 'text' }) employmentType!: EmploymentType;

  @Column({ type: 'text' }) payCycle!: PayCycle;
  @Column({ type: 'integer', nullable: true }) monthlySalary!: number | null;
  @Column({ type: 'integer', nullable: true }) dailyRate!: number | null;
  @Column({ type: 'integer' }) standardWorkDays!: number;

  @Column({ type: 'text', nullable: true }) bankName!: string | null;
  @Column({ type: 'text', nullable: true }) bankAccountMasked!: string | null;
  @Column({ type: 'text', nullable: true }) bankAccountLast4!: string | null;

  // EWA OVERRIDES — null means inherit from company policy
  @Column({ type: 'integer', nullable: true }) ewaEnabledOverride!: number | null;
  @Column({ type: 'text', nullable: true }) ewaEligibilityOverride!: EWAEligibility | null;
  @Column({ type: 'integer', nullable: true }) ewaMaxPercentOverride!: number | null;
  @Column({ type: 'integer', nullable: true }) ewaMaxRequestsOverride!: number | null;
  @Column({ type: 'integer', nullable: true }) ewaMinAmountOverride!: number | null;
  @Column({ type: 'integer', nullable: true }) ewaMaxAmountOverride!: number | null;

  @Column({ type: 'simple-json', nullable: true }) currentPeriod!: CurrentPeriodSnapshot | null;

  @CreateDateColumn({ type: 'datetime' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'datetime' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'datetime', nullable: true }) deletedAt!: Date | null;
}
```

- [ ] **Step 2: Migration**

```ts
// backend/src/db/migrations/1715472600000-add-employees.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployees1715472600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id" text NOT NULL,
        "companyId" text NOT NULL,
        "name" text NOT NULL,
        "nameEn" text,
        "avatarInitials" text,
        "department" text NOT NULL,
        "departmentName" text,
        "position" text,
        "startDate" text NOT NULL,
        "employmentType" text NOT NULL CHECK ("employmentType" IN ('full_time','part_time','contract')),
        "payCycle" text NOT NULL CHECK ("payCycle" IN ('monthly','weekly')),
        "monthlySalary" integer,
        "dailyRate" integer,
        "standardWorkDays" integer NOT NULL DEFAULT 22,
        "bankName" text,
        "bankAccountMasked" text,
        "bankAccountLast4" text,
        "ewaEnabledOverride" integer,
        "ewaEligibilityOverride" text CHECK ("ewaEligibilityOverride" IN ('eligible','quota_used','suspended')),
        "ewaMaxPercentOverride" integer,
        "ewaMaxRequestsOverride" integer,
        "ewaMinAmountOverride" integer,
        "ewaMaxAmountOverride" integer,
        "currentPeriod" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime,
        PRIMARY KEY ("companyId", "id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_employees_company_dept" ON "employees" ("companyId","department")`);
    await queryRunner.query(`CREATE INDEX "idx_employees_company_cycle" ON "employees" ("companyId","payCycle")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_employees_company_cycle"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_employees_company_dept"`);
    await queryRunner.query(`DROP TABLE "employees"`);
  }
}
```

- [ ] **Step 3: Build, boot (migration runs)**

```bash
npm run db:reset && npm run start:dev
```

Expected: migration log line for `AddEmployees1715472600000`, server starts. Kill server.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/employees/entities backend/src/db/migrations/1715472600000-add-employees.ts
git commit -m "feat(backend): employee entity + migration (override columns nullable)"
```

---

### Task 4.2: `EwaRulesService` + `EffectivePolicyService`

**Files:**
- Create: `backend/src/ewa/rules/effective-policy.service.ts`
- Create: `backend/src/ewa/rules/effective-policy.types.ts`
- Create: `backend/src/ewa/rules/ewa-rules.service.ts`
- Create: `backend/src/ewa/rules/ewa-rules.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Effective policy types**

```ts
// backend/src/ewa/rules/effective-policy.types.ts
import { EWAEligibility } from '../../modules/employees/entities/employee.entity';

export interface EffectivePolicy {
  enabled: boolean;
  eligibility: EWAEligibility;
  maxPercent: number;
  maxRequests: number;
  minAmount: number;
  maxAmount: number;
  autoApprovalEnabled: boolean;
  autoApprovalThreshold: number;
  approvalChain: 'single' | 'two_step';
  blackoutDates: string[];
  weeklyPayDayOfWeek?: number;
  weeklyCutoffDayOfWeek?: number;
  weeklyCutoffHour?: number;
}

export type FieldSource = 'employee' | 'company';

export interface EffectivePolicyResolved {
  effective: EffectivePolicy;
  source: Record<keyof Pick<EffectivePolicy,
    'enabled' | 'eligibility' | 'maxPercent' | 'maxRequests' | 'minAmount' | 'maxAmount'
  >, FieldSource>;
}
```

- [ ] **Step 2: `EffectivePolicyService`**

```ts
// backend/src/ewa/rules/effective-policy.service.ts
import { Injectable } from '@nestjs/common';
import { Employee, EWAEligibility } from '../../modules/employees/entities/employee.entity';
import { SettingsService } from '../../modules/settings/settings.service';
import { EwaPolicyJson } from '../../modules/settings/entities/app-settings.entity';
import { EffectivePolicy, EffectivePolicyResolved, FieldSource } from './effective-policy.types';

@Injectable()
export class EffectivePolicyService {
  constructor(private readonly settings: SettingsService) {}

  async resolve(employee: Employee): Promise<EffectivePolicyResolved> {
    const policy = await this.settings.getPolicy(employee.companyId, employee.payCycle);
    const eff: EffectivePolicy = {
      enabled: employee.ewaEnabledOverride !== null ? employee.ewaEnabledOverride === 1 : true,
      eligibility: (employee.ewaEligibilityOverride ?? 'eligible') as EWAEligibility,
      maxPercent: employee.ewaMaxPercentOverride ?? policy.maxPercent,
      maxRequests: employee.ewaMaxRequestsOverride ?? policy.maxRequestsPerPeriod,
      minAmount: employee.ewaMinAmountOverride ?? policy.minAmount,
      maxAmount: employee.ewaMaxAmountOverride ?? policy.maxAmount,
      autoApprovalEnabled: policy.autoApprovalEnabled,
      autoApprovalThreshold: policy.autoApprovalThreshold,
      approvalChain: policy.approvalChain,
      blackoutDates: policy.blackoutDates ?? [],
      weeklyPayDayOfWeek: policy.weeklyPayDayOfWeek,
      weeklyCutoffDayOfWeek: policy.weeklyCutoffDayOfWeek,
      weeklyCutoffHour: policy.weeklyCutoffHour,
    };
    const src = (v: unknown): FieldSource => (v !== null && v !== undefined ? 'employee' : 'company');
    return {
      effective: eff,
      source: {
        enabled: src(employee.ewaEnabledOverride),
        eligibility: src(employee.ewaEligibilityOverride),
        maxPercent: src(employee.ewaMaxPercentOverride),
        maxRequests: src(employee.ewaMaxRequestsOverride),
        minAmount: src(employee.ewaMinAmountOverride),
        maxAmount: src(employee.ewaMaxAmountOverride),
      },
    };
  }

  /** Convenience: just the effective fields without the source map. */
  async effectiveOnly(employee: Employee): Promise<EffectivePolicy> {
    return (await this.resolve(employee)).effective;
  }

  /** Convenience: extract the underlying company policy for a cycle. */
  async companyPolicy(companyId: string, cycle: 'monthly' | 'weekly'): Promise<EwaPolicyJson> {
    return this.settings.getPolicy(companyId, cycle);
  }
}
```

- [ ] **Step 3: `EwaRulesService` — pure validators (port from `lib/utils/ewa-calculations.ts`)**

```ts
// backend/src/ewa/rules/ewa-rules.service.ts
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { EwaRuleError } from '../../common/errors/ewa-rule.error';
import { EffectivePolicy } from './effective-policy.types';
import { PayCycle, CurrentPeriodSnapshot } from '../../modules/employees/entities/employee.entity';

export const DEFAULT_TRANSFER_FEE_THB = 15;

@Injectable()
export class EwaRulesService {
  calculateEarnedToDate(payCycle: PayCycle, opts: { monthlySalary?: number | null; dailyRate?: number | null; workedDays: number; standardWorkDays?: number }): number {
    if (payCycle === 'monthly' && opts.monthlySalary && opts.workedDays) {
      const std = opts.standardWorkDays ?? 22;
      return Math.round((opts.monthlySalary / std) * opts.workedDays);
    }
    if (payCycle === 'weekly' && opts.dailyRate && opts.workedDays) {
      return opts.dailyRate * opts.workedDays;
    }
    return 0;
  }

  calculateMaxWithdrawable(earnedToDate: number, maxPercent: number, previousEWAThisPeriod: number): number {
    const gross = Math.floor(earnedToDate * (maxPercent / 100));
    return Math.max(0, gross - previousEWAThisPeriod);
  }

  calculateNetTransferAmount(requestedAmount: number, transferFee = DEFAULT_TRANSFER_FEE_THB): number {
    return Math.max(requestedAmount - transferFee, 0);
  }

  shouldAutoApprove(amount: number, policy: EffectivePolicy): boolean {
    return policy.autoApprovalEnabled && amount < policy.autoApprovalThreshold;
  }

  isBlackoutToday(policy: EffectivePolicy, now: Date = new Date()): boolean {
    const today = dayjs(now).format('YYYY-MM-DD');
    return policy.blackoutDates.includes(today);
  }

  isWithinCutoff(payCycle: PayCycle, policy: EffectivePolicy, period: CurrentPeriodSnapshot, now: Date = new Date()): boolean {
    const today = dayjs(now);
    if (payCycle === 'monthly') {
      return today.isBefore(dayjs(period.cutoffDate).endOf('day')) || today.isSame(dayjs(period.cutoffDate), 'day');
    }
    // weekly
    const cutoffDay = policy.weeklyCutoffDayOfWeek ?? 4;
    const cutoffHour = policy.weeklyCutoffHour ?? 18;
    const dow = today.day();
    if (dow > cutoffDay) return false;
    if (dow === cutoffDay && today.hour() >= cutoffHour) return false;
    return true;
  }

  validateAmount(amount: number, policy: EffectivePolicy, maxWithdrawable: number): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new EwaRuleError('EWA_INVALID_AMOUNT', 'กรุณาระบุจำนวนเต็มบาท (ไม่มีสตางค์)', { amount });
    }
    if (amount < policy.minAmount) {
      throw new EwaRuleError('EWA_BELOW_MIN', `ยอดขั้นต่ำ ฿${policy.minAmount.toLocaleString()}`, { minAmount: policy.minAmount });
    }
    if (amount > maxWithdrawable) {
      throw new EwaRuleError('EWA_OVER_LIMIT', `เกินวงเงิน กรุณาใส่ไม่เกิน ฿${maxWithdrawable.toLocaleString()}`, { maxWithdrawable });
    }
    if (amount > policy.maxAmount) {
      throw new EwaRuleError('EWA_OVER_LIMIT', `เกินเพดานต่อครั้ง ฿${policy.maxAmount.toLocaleString()}`, { maxAmount: policy.maxAmount });
    }
  }

  validateGuards(policy: EffectivePolicy, period: CurrentPeriodSnapshot, payCycle: PayCycle, now: Date = new Date()): void {
    if (!policy.enabled) throw new EwaRuleError('EWA_EWA_DISABLED', 'EWA ปิดสำหรับพนักงานคนนี้');
    if (policy.eligibility === 'suspended') throw new EwaRuleError('EWA_EMPLOYEE_SUSPENDED', 'พนักงานถูกระงับ');
    if (period.usedRequests >= policy.maxRequests) throw new EwaRuleError('EWA_QUOTA_EXHAUSTED', 'ใช้สิทธิ์ครบสำหรับงวดนี้แล้ว');
    if (this.isBlackoutToday(policy, now)) throw new EwaRuleError('EWA_BLACKOUT_DATE', 'วันนี้ไม่สามารถทำรายการได้');
    if (!this.isWithinCutoff(payCycle, policy, period, now)) throw new EwaRuleError('EWA_OUTSIDE_CUTOFF', 'พ้นกำหนดยื่นคำขอของงวดนี้');
  }
}
```

- [ ] **Step 4: Module**

```ts
// backend/src/ewa/rules/ewa-rules.module.ts
import { Global, Module } from '@nestjs/common';
import { EwaRulesService } from './ewa-rules.service';
import { EffectivePolicyService } from './effective-policy.service';
import { SettingsModule } from '../../modules/settings/settings.module';

@Global()
@Module({
  imports: [SettingsModule],
  providers: [EwaRulesService, EffectivePolicyService],
  exports: [EwaRulesService, EffectivePolicyService],
})
export class EwaRulesModule {}
```

- [ ] **Step 5: Wire and build**

Add `EwaRulesModule` to `app.module.ts` `imports`.

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add backend/src/ewa backend/src/app.module.ts
git commit -m "feat(backend): EwaRulesService + EffectivePolicyService (pure rules engine)"
```

---

### Task 4.3: Employees CRUD module

**Files:**
- Create: `backend/src/modules/employees/dto/{create,update,employee}.dto.ts`
- Create: `backend/src/modules/employees/employees.service.ts`
- Create: `backend/src/modules/employees/employees.controller.ts`
- Create: `backend/src/modules/employees/employees.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create DTO**

```ts
// backend/src/modules/employees/dto/create-employee.dto.ts
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-0041' }) @IsString() id!: string;
  @ApiProperty({ example: 'สมชาย วงศ์ดี' }) @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() avatarInitials?: string;

  @ApiProperty({ example: 'dept-prod-a' }) @IsString() department!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() position?: string;
  @ApiProperty({ example: '2021-08-01' }) @IsString() startDate!: string;

  @ApiProperty({ enum: ['full_time', 'part_time', 'contract'] })
  @IsIn(['full_time', 'part_time', 'contract']) employmentType!: 'full_time' | 'part_time' | 'contract';

  @ApiProperty({ enum: ['monthly', 'weekly'] })
  @IsIn(['monthly', 'weekly']) payCycle!: 'monthly' | 'weekly';

  @ApiPropertyOptional({ example: 18000 }) @IsOptional() @IsInt() @Min(0) monthlySalary?: number;
  @ApiPropertyOptional({ example: 420 }) @IsOptional() @IsInt() @Min(0) dailyRate?: number;
  @ApiProperty({ example: 22 }) @IsInt() @Min(1) standardWorkDays!: number;

  @ApiPropertyOptional() @IsOptional() @IsString() bankName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bankAccountMasked?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bankAccountLast4?: string;
}
```

- [ ] **Step 2: Update DTO**

```ts
// backend/src/modules/employees/dto/update-employee.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';
export class UpdateEmployeeDto extends PartialType(OmitType(CreateEmployeeDto, ['id'] as const)) {}
```

- [ ] **Step 3: Read DTO**

```ts
// backend/src/modules/employees/dto/employee.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeDto {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) nameEn!: string | null;
  @ApiPropertyOptional({ nullable: true }) avatarInitials!: string | null;
  @ApiProperty() department!: string;
  @ApiPropertyOptional({ nullable: true }) departmentName!: string | null;
  @ApiPropertyOptional({ nullable: true }) position!: string | null;
  @ApiProperty() startDate!: string;
  @ApiProperty() employmentType!: string;
  @ApiProperty() payCycle!: string;
  @ApiPropertyOptional({ nullable: true }) monthlySalary!: number | null;
  @ApiPropertyOptional({ nullable: true }) dailyRate!: number | null;
  @ApiProperty() standardWorkDays!: number;
  @ApiPropertyOptional({ nullable: true }) bankName!: string | null;
  @ApiPropertyOptional({ nullable: true }) bankAccountMasked!: string | null;
  @ApiPropertyOptional({ nullable: true }) bankAccountLast4!: string | null;

  @ApiPropertyOptional({ nullable: true }) ewaEnabledOverride!: boolean | null;
  @ApiPropertyOptional({ nullable: true }) ewaEligibilityOverride!: string | null;
  @ApiPropertyOptional({ nullable: true }) ewaMaxPercentOverride!: number | null;
  @ApiPropertyOptional({ nullable: true }) ewaMaxRequestsOverride!: number | null;
  @ApiPropertyOptional({ nullable: true }) ewaMinAmountOverride!: number | null;
  @ApiPropertyOptional({ nullable: true }) ewaMaxAmountOverride!: number | null;

  @ApiPropertyOptional({ nullable: true }) currentPeriod!: Record<string, unknown> | null;

  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
```

- [ ] **Step 4: Service (CRUD only; override + effective-policy endpoints in Task 4.4–4.5)**

```ts
// backend/src/modules/employees/employees.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeDto } from './dto/employee.dto';
import { CompanyScopedRepository } from '../../common/tenant/company-scoped.repository';

export interface ListEmployeesOpts {
  department?: string;
  payCycle?: 'monthly' | 'weekly';
  ewaEligibility?: string;
  q?: string;
  limit: number;
  offset: number;
}

@Injectable()
export class EmployeesService {
  private readonly scoped: CompanyScopedRepository<Employee>;
  constructor(@InjectRepository(Employee) private readonly repo: Repository<Employee>) {
    this.scoped = new CompanyScopedRepository<Employee>(repo);
  }

  async list(companyId: string, opts: ListEmployeesOpts) {
    const qb = this.repo.createQueryBuilder('e')
      .where('e.companyId = :companyId', { companyId })
      .andWhere('e.deletedAt IS NULL');
    if (opts.department) qb.andWhere('e.department = :department', { department: opts.department });
    if (opts.payCycle) qb.andWhere('e.payCycle = :cycle', { cycle: opts.payCycle });
    if (opts.q) qb.andWhere('(e.name LIKE :q OR e.id LIKE :q OR e.nameEn LIKE :q)', { q: `%${opts.q}%` });
    qb.orderBy('e.id', 'ASC').take(opts.limit).skip(opts.offset);
    const [rows, total] = await qb.getManyAndCount();
    return { data: rows.map(this.toDto), total, limit: opts.limit, offset: opts.offset };
  }

  async findOne(companyId: string, id: string): Promise<EmployeeDto> {
    const e = await this.loadOrThrow(companyId, id);
    return this.toDto(e);
  }

  async create(companyId: string, dto: CreateEmployeeDto): Promise<EmployeeDto> {
    if (await this.scoped.findById(companyId, dto.id)) {
      throw new ConflictException(`Employee ${dto.id} already exists`);
    }
    const saved = await this.scoped.createOne(companyId, {
      ...dto,
      monthlySalary: dto.monthlySalary ?? null,
      dailyRate: dto.dailyRate ?? null,
      nameEn: dto.nameEn ?? null,
      avatarInitials: dto.avatarInitials ?? null,
      departmentName: dto.departmentName ?? null,
      position: dto.position ?? null,
      bankName: dto.bankName ?? null,
      bankAccountMasked: dto.bankAccountMasked ?? null,
      bankAccountLast4: dto.bankAccountLast4 ?? null,
    } as Partial<Employee>);
    return this.toDto(saved);
  }

  async update(companyId: string, id: string, dto: UpdateEmployeeDto): Promise<EmployeeDto> {
    const updated = await this.scoped.updateById(companyId, id, dto as Partial<Employee>);
    if (!updated) throw new NotFoundException(`Employee ${id} not found`);
    return this.toDto(updated);
  }

  async softDelete(companyId: string, id: string): Promise<{ ok: true }> {
    const e = await this.loadOrThrow(companyId, id);
    await this.repo.softRemove(e);
    return { ok: true };
  }

  async loadOrThrow(companyId: string, id: string): Promise<Employee> {
    const e = await this.repo.findOne({ where: { id, companyId } });
    if (!e || e.deletedAt) throw new NotFoundException(`Employee ${id} not found`);
    return e;
  }

  toDto = (e: Employee): EmployeeDto => ({
    id: e.id,
    companyId: e.companyId,
    name: e.name,
    nameEn: e.nameEn,
    avatarInitials: e.avatarInitials,
    department: e.department,
    departmentName: e.departmentName,
    position: e.position,
    startDate: e.startDate,
    employmentType: e.employmentType,
    payCycle: e.payCycle,
    monthlySalary: e.monthlySalary,
    dailyRate: e.dailyRate,
    standardWorkDays: e.standardWorkDays,
    bankName: e.bankName,
    bankAccountMasked: e.bankAccountMasked,
    bankAccountLast4: e.bankAccountLast4,
    ewaEnabledOverride: e.ewaEnabledOverride === null ? null : e.ewaEnabledOverride === 1,
    ewaEligibilityOverride: e.ewaEligibilityOverride,
    ewaMaxPercentOverride: e.ewaMaxPercentOverride,
    ewaMaxRequestsOverride: e.ewaMaxRequestsOverride,
    ewaMinAmountOverride: e.ewaMinAmountOverride,
    ewaMaxAmountOverride: e.ewaMaxAmountOverride,
    currentPeriod: e.currentPeriod as Record<string, unknown> | null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  });
}
```

- [ ] **Step 5: Controller (CRUD only; override/policy endpoints added in 4.4–4.5)**

```ts
// backend/src/modules/employees/employees.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CurrentCompany } from '../../common/tenant/current-company.decorator';
import { TenantContext } from '../../common/tenant/tenant.types';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { Audited } from '../../common/audit/audited.decorator';

class ListEmployeesQuery extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
  @ApiPropertyOptional({ enum: ['monthly', 'weekly'] }) @IsOptional() @IsIn(['monthly', 'weekly']) payCycle?: 'monthly' | 'weekly';
  @ApiPropertyOptional({ enum: ['eligible', 'quota_used', 'suspended'] }) @IsOptional() @IsIn(['eligible', 'quota_used', 'suspended']) ewaEligibility?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() q?: string;
}

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  list(@CurrentCompany() c: TenantContext, @Query() q: ListEmployeesQuery) {
    return this.service.list(c.id, {
      department: q.department,
      payCycle: q.payCycle,
      ewaEligibility: q.ewaEligibility,
      q: q.q,
      limit: q.limit ?? 20,
      offset: q.offset ?? 0,
    });
  }

  @Get(':id')
  findOne(@CurrentCompany() c: TenantContext, @Param('id') id: string) {
    return this.service.findOne(c.id, id);
  }

  @Post()
  create(@CurrentCompany() c: TenantContext, @Body() dto: CreateEmployeeDto) {
    return this.service.create(c.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update non-EWA fields' })
  update(@CurrentCompany() c: TenantContext, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(c.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an employee' })
  @Audited({ action: 'employee_deleted', targetType: 'employee', target: (req) => req.params.id })
  remove(@CurrentCompany() c: TenantContext, @Param('id') id: string) {
    return this.service.softDelete(c.id, id);
  }
}
```

- [ ] **Step 6: Module**

```ts
// backend/src/modules/employees/employees.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Employee])],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
```

- [ ] **Step 7: Wire, build, smoke**

Add `EmployeesModule` to `app.module.ts`.

```bash
npm run build && npm run start:dev
```

```bash
# Create department first (Phase 2 already covered this)
curl -s -X POST http://localhost:3001/departments \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' \
  -d '{"id":"dept-prod-a","name":"ผลิต A"}'

# Create employee
curl -s -X POST http://localhost:3001/employees \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' \
  -d '{
    "id":"EMP-0041","name":"สมชาย วงศ์ดี","department":"dept-prod-a",
    "startDate":"2021-08-01","employmentType":"full_time","payCycle":"monthly",
    "monthlySalary":18000,"standardWorkDays":22
  }' | head
```

Expected: 200 with the employee. Kill server.

- [ ] **Step 8: Commit**

```bash
git add backend/src
git commit -m "feat(backend): employees CRUD"
```

---

### Task 4.4: EWA overrides endpoints (`/employees/:id/ewa-overrides`)

**Files:**
- Create: `backend/src/modules/employees/dto/ewa-overrides.dto.ts`
- Modify: `backend/src/modules/employees/employees.service.ts`
- Modify: `backend/src/modules/employees/employees.controller.ts`

- [ ] **Step 1: DTOs**

```ts
// backend/src/modules/employees/dto/ewa-overrides.dto.ts
import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEwaOverridesDto {
  @ApiPropertyOptional({ nullable: true, description: 'null = inherit from company' })
  @IsOptional() @IsBoolean() ewaEnabled?: boolean | null;

  @ApiPropertyOptional({ nullable: true, enum: ['eligible', 'quota_used', 'suspended'] })
  @IsOptional() @IsIn(['eligible', 'quota_used', 'suspended']) ewaEligibility?: 'eligible' | 'quota_used' | 'suspended' | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsInt() @Min(0) ewaMaxPercent?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsInt() @Min(1) ewaMaxRequests?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsInt() @Min(0) ewaMinAmount?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsInt() @Min(0) ewaMaxAmount?: number | null;
}

export class EwaOverridesDto {
  ewaEnabledOverride!: boolean | null;
  ewaEligibilityOverride!: string | null;
  ewaMaxPercentOverride!: number | null;
  ewaMaxRequestsOverride!: number | null;
  ewaMinAmountOverride!: number | null;
  ewaMaxAmountOverride!: number | null;
}
```

- [ ] **Step 2: Service methods**

Append to `employees.service.ts`:

```ts
// Inside EmployeesService class
import { UpdateEwaOverridesDto, EwaOverridesDto } from './dto/ewa-overrides.dto';

async getOverrides(companyId: string, id: string): Promise<EwaOverridesDto> {
  const e = await this.loadOrThrow(companyId, id);
  return {
    ewaEnabledOverride: e.ewaEnabledOverride === null ? null : e.ewaEnabledOverride === 1,
    ewaEligibilityOverride: e.ewaEligibilityOverride,
    ewaMaxPercentOverride: e.ewaMaxPercentOverride,
    ewaMaxRequestsOverride: e.ewaMaxRequestsOverride,
    ewaMinAmountOverride: e.ewaMinAmountOverride,
    ewaMaxAmountOverride: e.ewaMaxAmountOverride,
  };
}

async updateOverrides(companyId: string, id: string, dto: UpdateEwaOverridesDto): Promise<EwaOverridesDto> {
  const e = await this.loadOrThrow(companyId, id);
  // Each field: if key present in body → set (null clears, value sets). If key absent → leave alone.
  if ('ewaEnabled' in dto) e.ewaEnabledOverride = dto.ewaEnabled === null || dto.ewaEnabled === undefined ? null : (dto.ewaEnabled ? 1 : 0);
  if ('ewaEligibility' in dto) e.ewaEligibilityOverride = dto.ewaEligibility ?? null;
  if ('ewaMaxPercent' in dto) e.ewaMaxPercentOverride = dto.ewaMaxPercent ?? null;
  if ('ewaMaxRequests' in dto) e.ewaMaxRequestsOverride = dto.ewaMaxRequests ?? null;
  if ('ewaMinAmount' in dto) e.ewaMinAmountOverride = dto.ewaMinAmount ?? null;
  if ('ewaMaxAmount' in dto) e.ewaMaxAmountOverride = dto.ewaMaxAmount ?? null;
  await this.repo.save(e);
  return this.getOverrides(companyId, id);
}
```

- [ ] **Step 3: Controller endpoints**

Append to `employees.controller.ts`:

```ts
import { UpdateEwaOverridesDto } from './dto/ewa-overrides.dto';
// inside class:

@Get(':id/ewa-overrides')
getOverrides(@CurrentCompany() c: TenantContext, @Param('id') id: string) {
  return this.service.getOverrides(c.id, id);
}

@Patch(':id/ewa-overrides')
@ApiOperation({ summary: 'Set/clear per-employee EWA overrides (null clears, omitting leaves alone)' })
@Audited({
  action: 'employee_overrides_changed',
  targetType: 'employee',
  target: (req) => req.params.id,
  metadata: (req) => ({ patch: req.body }),
})
updateOverrides(
  @CurrentCompany() c: TenantContext,
  @Param('id') id: string,
  @Body() dto: UpdateEwaOverridesDto,
) {
  return this.service.updateOverrides(c.id, id, dto);
}
```

- [ ] **Step 4: Build, boot, verify**

```bash
npm run build && npm run start:dev
```

```bash
curl -s -X PATCH http://localhost:3001/employees/EMP-0041/ewa-overrides \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' -H 'x-actor-id: HR-001' \
  -d '{"ewaMaxPercent":40,"ewaMaxAmount":8000}' | head

curl -s http://localhost:3001/employees/EMP-0041/ewa-overrides \
  -H 'x-company-id: COMP-001' | head
```

Expected: returns the overrides showing `ewaMaxPercentOverride:40, ewaMaxAmountOverride:8000`, others null. Kill server.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/employees
git commit -m "feat(backend): per-employee EWA overrides endpoints"
```

---

### Task 4.5: `/employees/:id/effective-policy` + `/employees/:id/current-period`

**Files:**
- Create: `backend/src/modules/employees/effective-policy.controller.ts`
- Modify: `backend/src/modules/employees/employees.module.ts`
- Modify: `backend/src/modules/employees/employees.controller.ts`

- [ ] **Step 1: Add `effective-policy` and `current-period` endpoints to the controller**

Add the imports at the top of `employees.controller.ts`:

```ts
import { EffectivePolicyService } from '../../ewa/rules/effective-policy.service';
import { EwaRulesService } from '../../ewa/rules/ewa-rules.service';
import dayjs from 'dayjs';
```

**Replace** the existing constructor from Task 4.3 (do not add a second one) with:

```ts
constructor(
  private readonly service: EmployeesService,
  private readonly policies: EffectivePolicyService,
  private readonly rules: EwaRulesService,
) {}

```

Then **append** the two new endpoint methods inside the controller class:

```ts
@Get(':id/effective-policy')
@ApiOperation({ summary: 'Resolved EWA policy for this employee + provenance per field' })
async effectivePolicy(@CurrentCompany() c: TenantContext, @Param('id') id: string) {
  const employee = await this.service.loadOrThrow(c.id, id);
  return this.policies.resolve(employee);
}

@Get(':id/current-period')
@ApiOperation({ summary: 'Computed currentPeriod snapshot (uses today)' })
async currentPeriod(@CurrentCompany() c: TenantContext, @Param('id') id: string) {
  const employee = await this.service.loadOrThrow(c.id, id);
  const policy = await this.policies.effectiveOnly(employee);
  const now = new Date();

  // Compute a simple snapshot based on employee + policy + today.
  // Monthly: period is 1st → last day of month, cutoff = configured day, workedDays = today.date()-1 capped at standardWorkDays
  // Weekly: Mon → Fri current week, cutoff/payDay = configured days
  if (employee.payCycle === 'monthly') {
    const monthStart = dayjs(now).startOf('month');
    const monthEnd = dayjs(now).endOf('month');
    const cutoff = monthStart.date(25);
    const workedDays = Math.min(dayjs(now).diff(monthStart, 'day') + 1, employee.standardWorkDays);
    const earnedToDate = this.rules.calculateEarnedToDate('monthly', {
      monthlySalary: employee.monthlySalary,
      dailyRate: employee.dailyRate,
      workedDays,
      standardWorkDays: employee.standardWorkDays,
    });
    return {
      label: dayjs(now).format('MMM YYYY'),
      startDate: monthStart.format('YYYY-MM-DD'),
      endDate: monthEnd.format('YYYY-MM-DD'),
      payDate: monthEnd.format('YYYY-MM-DD'),
      cutoffDate: cutoff.format('YYYY-MM-DD'),
      workedDays,
      totalWorkDays: employee.standardWorkDays,
      earnedToDate,
      previousEWAThisPeriod: employee.currentPeriod?.previousEWAThisPeriod ?? 0,
      maxWithdrawable: this.rules.calculateMaxWithdrawable(earnedToDate, policy.maxPercent, employee.currentPeriod?.previousEWAThisPeriod ?? 0),
      usedRequests: employee.currentPeriod?.usedRequests ?? 0,
      remainingRequests: Math.max(0, policy.maxRequests - (employee.currentPeriod?.usedRequests ?? 0)),
    };
  }

  // weekly
  const weekStart = dayjs(now).day(1); // Monday
  const weekEnd = dayjs(now).day(5);   // Friday
  const workedDays = Math.min(dayjs(now).diff(weekStart, 'day') + 1, employee.standardWorkDays);
  const earnedToDate = this.rules.calculateEarnedToDate('weekly', {
    dailyRate: employee.dailyRate,
    workedDays,
  });
  return {
    label: `สัปดาห์ ${dayjs(now).format('w')}/${dayjs(now).format('YYYY')}`,
    startDate: weekStart.format('YYYY-MM-DD'),
    endDate: weekEnd.format('YYYY-MM-DD'),
    payDate: weekEnd.format('YYYY-MM-DD'),
    cutoffDate: dayjs(now).day(policy.weeklyCutoffDayOfWeek ?? 4).format('YYYY-MM-DD'),
    workedDays,
    totalWorkDays: employee.standardWorkDays,
    earnedToDate,
    previousEWAThisPeriod: employee.currentPeriod?.previousEWAThisPeriod ?? 0,
    maxWithdrawable: this.rules.calculateMaxWithdrawable(earnedToDate, policy.maxPercent, employee.currentPeriod?.previousEWAThisPeriod ?? 0),
    usedRequests: employee.currentPeriod?.usedRequests ?? 0,
    remainingRequests: Math.max(0, policy.maxRequests - (employee.currentPeriod?.usedRequests ?? 0)),
  };
}
```

- [ ] **Step 2: Build, boot, verify**

```bash
npm run build && npm run start:dev
```

```bash
curl -s http://localhost:3001/employees/EMP-0041/effective-policy \
  -H 'x-company-id: COMP-001' | head

# Should show effective.maxPercent=40 (from override) and source.maxPercent="employee"

curl -s http://localhost:3001/employees/EMP-0041/current-period \
  -H 'x-company-id: COMP-001' | head
```

Expected: effective-policy returns `{ effective: {...}, source: {...} }` with `maxPercent:40, source.maxPercent:"employee"` (set in Task 4.4). current-period returns the computed snapshot. Kill server.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/employees
git commit -m "feat(backend): effective-policy + current-period endpoints"
```

---

### Task 4.6: Upgrade `ActorInterceptor` to load actor from DB and enforce hard isolation

**Files:**
- Create: `backend/src/common/auth/actor.module.ts`
- Modify: `backend/src/common/auth/actor.interceptor.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Build an ActorModule that imports HRUsers + Employees**

```ts
// backend/src/common/auth/actor.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HRUsersModule } from '../../modules/hr-users/hr-users.module';
import { EmployeesModule } from '../../modules/employees/employees.module';
import { ActorInterceptor } from './actor.interceptor';

@Module({
  imports: [HRUsersModule, EmployeesModule],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ActorInterceptor }],
})
export class ActorModule {}
```

- [ ] **Step 2: Upgrade ActorInterceptor to load actor from DB**

```ts
// backend/src/common/auth/actor.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, of, switchMap } from 'rxjs';
import { HEADER_ACTOR_ID, REQUEST_KEY_ACTOR, REQUEST_KEY_COMPANY } from '../constants';
import { ActorContext, SYSTEM_ACTOR } from './actor.types';
import { HRUsersService } from '../../modules/hr-users/hr-users.service';
import { EmployeesService } from '../../modules/employees/employees.service';
import { TenantContext } from '../tenant/tenant.types';

@Injectable()
export class ActorInterceptor implements NestInterceptor {
  constructor(
    private readonly hr: HRUsersService,
    private readonly emp: EmployeesService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const actorId = request.header(HEADER_ACTOR_ID);
    const company = request[REQUEST_KEY_COMPANY] as TenantContext | undefined;

    if (!actorId || typeof actorId !== 'string') {
      request[REQUEST_KEY_ACTOR] = SYSTEM_ACTOR;
      return next.handle();
    }

    const resolve$ = from(this.resolveActor(actorId, company?.id));
    return resolve$.pipe(
      switchMap((actor) => {
        request[REQUEST_KEY_ACTOR] = actor;
        return next.handle();
      }),
    );
  }

  private async resolveActor(actorId: string, companyId?: string): Promise<ActorContext> {
    if (actorId.startsWith('HR-')) {
      if (!companyId) return { id: actorId, kind: 'hr' };
      try {
        const hr = await this.hr.findOne(companyId, actorId);
        return { id: hr.id, kind: 'hr', name: hr.name, role: hr.role };
      } catch {
        throw new ForbiddenException(`Actor ${actorId} not found in company ${companyId}`);
      }
    }
    if (actorId.startsWith('EMP-')) {
      if (!companyId) return { id: actorId, kind: 'employee' };
      try {
        const e = await this.emp.findOne(companyId, actorId);
        return { id: e.id, kind: 'employee', name: e.name, role: null };
      } catch {
        throw new ForbiddenException(`Actor ${actorId} not found in company ${companyId}`);
      }
    }
    return { id: actorId, kind: 'system' };
  }
}
```

- [ ] **Step 3: Remove the old inline `ActorInterceptor` registration; use ActorModule**

```ts
// backend/src/app.module.ts — remove APP_INTERCEPTOR ActorInterceptor line
// and add ActorModule to imports:
import { ActorModule } from './common/auth/actor.module';

// In @Module decorator:
imports: [
  // ...
  ActorModule,
  // ...
]
providers: [
  // remove { provide: APP_INTERCEPTOR, useClass: ActorInterceptor },
  { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
],
```

- [ ] **Step 4: Build, boot, verify**

```bash
npm run build && npm run start:dev
```

```bash
# Valid HR actor → 200
curl -s -X PATCH http://localhost:3001/settings/policy/monthly \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' -H 'x-actor-id: HR-001' \
  -d '{"maxPercent":45}' -o /dev/null -w "%{http_code}\n"
# Expected: 200

# HR actor that doesn't exist in this company → 403
curl -s -X PATCH http://localhost:3001/settings/policy/monthly \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' -H 'x-actor-id: HR-999' \
  -d '{"maxPercent":45}' -o /dev/null -w "%{http_code}\n"
# Expected: 403

# No actor header → 200 (system actor)
curl -s -X PATCH http://localhost:3001/settings/policy/monthly \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' \
  -d '{"maxPercent":45}' -o /dev/null -w "%{http_code}\n"
# Expected: 200
```

Kill server.

- [ ] **Step 5: Commit**

```bash
git add backend/src
git commit -m "feat(backend): ActorInterceptor loads actor from DB, enforces hard isolation"
```

---

## Phase 4 checkpoint

- Employees CRUD + soft-delete works
- EWA overrides PATCH/GET works
- Effective policy endpoint shows resolved values + provenance
- Current-period endpoint computes a snapshot
- Actor header now hard-isolated to the same company (403 on mismatch)

---

## Phase 5 — Requests lifecycle

**Outcome:** EWA request CRUD + dry-run preview + state machine (pending → approved/rejected → disbursed). Auto-approval honored. Audit rows written. Notifications dispatched as no-op stubs (Phase 7 wires LINE).

---

### Task 5.1: EWARequest entity + migration

**Files:**
- Create: `backend/src/modules/requests/entities/ewa-request.entity.ts`
- Create: `backend/src/db/migrations/1715472700000-add-ewa-requests.ts`

- [ ] **Step 1: Entity**

```ts
// backend/src/modules/requests/entities/ewa-request.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { PayCycle } from '../../employees/entities/employee.entity';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'disbursed';

@Entity('ewa_requests')
@Index(['companyId', 'status', 'requestedAt'])
@Index(['companyId', 'employeeId'])
export class EWARequest {
  @PrimaryColumn({ type: 'text' }) id!: string;
  @Column({ type: 'text' }) companyId!: string;

  @Column({ type: 'text' }) employeeId!: string;
  @Column({ type: 'text' }) employeeName!: string;
  @Column({ type: 'text', nullable: true }) employeeAvatar!: string | null;
  @Column({ type: 'text' }) department!: string;
  @Column({ type: 'text', nullable: true }) departmentName!: string | null;

  @Column({ type: 'text' }) payCycle!: PayCycle;
  @Column({ type: 'text' }) periodLabel!: string;
  @Column({ type: 'text' }) periodStart!: string;
  @Column({ type: 'text' }) periodEnd!: string;

  @Column({ type: 'integer' }) requestedAmount!: number;
  @Column({ type: 'integer', default: 15 }) transferFee!: number;
  @Column({ type: 'integer' }) netTransferAmount!: number;
  @Column({ type: 'integer' }) earnedToDate!: number;
  @Column({ type: 'integer' }) maxWithdrawable!: number;
  @Column({ type: 'integer', default: 0 }) previousEWAThisPeriod!: number;
  @Column({ type: 'real' }) percentOfEarned!: number;

  @Column({ type: 'text' }) reason!: string;
  @Column({ type: 'text', nullable: true }) employeeNote!: string | null;

  @Column({ type: 'text' }) status!: RequestStatus;
  @Column({ type: 'datetime' }) requestedAt!: Date;

  @Column({ type: 'text', nullable: true }) reviewedBy!: string | null;
  @Column({ type: 'text', nullable: true }) reviewedById!: string | null;
  @Column({ type: 'datetime', nullable: true }) reviewedAt!: Date | null;
  @Column({ type: 'text', nullable: true }) rejectionReason!: string | null;
  @Column({ type: 'text', nullable: true }) hrNote!: string | null;

  @Column({ type: 'integer', default: 0 }) isOnBehalf!: number;
  @Column({ type: 'text', nullable: true }) onBehalfHRId!: string | null;
  @Column({ type: 'text', nullable: true }) onBehalfHRName!: string | null;
  @Column({ type: 'text', nullable: true }) onBehalfReason!: string | null;

  @Column({ type: 'datetime', nullable: true }) disbursedAt!: Date | null;
  @Column({ type: 'text', nullable: true }) bankTransferId!: string | null;
  @Column({ type: 'text', nullable: true }) bankAccountMasked!: string | null;
  @Column({ type: 'text', nullable: true }) bankName!: string | null;

  @CreateDateColumn({ type: 'datetime' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'datetime' }) updatedAt!: Date;
}
```

- [ ] **Step 2: Migration**

```ts
// backend/src/db/migrations/1715472700000-add-ewa-requests.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEwaRequests1715472700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ewa_requests" (
        "id" text PRIMARY KEY NOT NULL,
        "companyId" text NOT NULL,
        "employeeId" text NOT NULL,
        "employeeName" text NOT NULL,
        "employeeAvatar" text,
        "department" text NOT NULL,
        "departmentName" text,
        "payCycle" text NOT NULL,
        "periodLabel" text NOT NULL,
        "periodStart" text NOT NULL,
        "periodEnd" text NOT NULL,
        "requestedAmount" integer NOT NULL,
        "transferFee" integer NOT NULL DEFAULT 15,
        "netTransferAmount" integer NOT NULL,
        "earnedToDate" integer NOT NULL,
        "maxWithdrawable" integer NOT NULL,
        "previousEWAThisPeriod" integer NOT NULL DEFAULT 0,
        "percentOfEarned" real NOT NULL,
        "reason" text NOT NULL,
        "employeeNote" text,
        "status" text NOT NULL CHECK ("status" IN ('pending','approved','rejected','disbursed')),
        "requestedAt" datetime NOT NULL,
        "reviewedBy" text,
        "reviewedById" text,
        "reviewedAt" datetime,
        "rejectionReason" text,
        "hrNote" text,
        "isOnBehalf" integer NOT NULL DEFAULT 0,
        "onBehalfHRId" text,
        "onBehalfHRName" text,
        "onBehalfReason" text,
        "disbursedAt" datetime,
        "bankTransferId" text,
        "bankAccountMasked" text,
        "bankName" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_requests_company_status_requested" ON "ewa_requests" ("companyId","status","requestedAt")`);
    await queryRunner.query(`CREATE INDEX "idx_requests_company_employee" ON "ewa_requests" ("companyId","employeeId")`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_requests_company_employee"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_requests_company_status_requested"`);
    await queryRunner.query(`DROP TABLE "ewa_requests"`);
  }
}
```

- [ ] **Step 3: Build, boot (migration runs)**

```bash
npm run db:reset && npm run start:dev
```

Expected: migration logs include `AddEwaRequests1715472700000`. Kill server.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/requests backend/src/db/migrations/1715472700000-add-ewa-requests.ts
git commit -m "feat(backend): ewa-request entity + migration"
```

---

### Task 5.2: `RequestStateMachine`

**Files:**
- Create: `backend/src/ewa/state/request-state-machine.ts`

- [ ] **Step 1: Implement**

```ts
// backend/src/ewa/state/request-state-machine.ts
import { EwaRuleError } from '../../common/errors/ewa-rule.error';
import { RequestStatus } from '../../modules/requests/entities/ewa-request.entity';

const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['disbursed'],
  rejected: [],
  disbursed: [],
};

export function assertTransition(from: RequestStatus, to: RequestStatus): void {
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new EwaRuleError(
      'EWA_INVALID_TRANSITION',
      `Cannot transition request from ${from} to ${to}`,
      { from, to, allowed },
    );
  }
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add backend/src/ewa/state
git commit -m "feat(backend): request state machine"
```

---

### Task 5.3: Requests module — CRUD + preview + create-with-rules

**Files:**
- Create: `backend/src/modules/requests/dto/{create-request,on-behalf,preview-request,review,disburse,request,list-query}.dto.ts`
- Create: `backend/src/modules/requests/requests.service.ts`
- Create: `backend/src/modules/requests/requests.controller.ts`
- Create: `backend/src/modules/requests/requests.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: DTOs**

```ts
// backend/src/modules/requests/dto/create-request.dto.ts
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRequestDto {
  @ApiProperty({ example: 'EMP-0041' }) @IsString() employeeId!: string;
  @ApiProperty({ example: 3000 }) @IsInt() @Min(1) requestedAmount!: number;
  @ApiProperty({ example: 'ค่ารักษาพยาบาล' }) @IsString() reason!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) employeeNote?: string;
}
```

```ts
// backend/src/modules/requests/dto/preview-request.dto.ts
import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PreviewRequestDto {
  @ApiProperty({ example: 'EMP-0041' }) @IsString() employeeId!: string;
  @ApiProperty({ example: 3000 }) @IsInt() @Min(1) requestedAmount!: number;
}
```

```ts
// backend/src/modules/requests/dto/on-behalf.dto.ts
import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OnBehalfRequestDto {
  @ApiProperty() @IsString() employeeId!: string;
  @ApiProperty() @IsInt() @Min(1) requestedAmount!: number;
  @ApiProperty() @IsString() reason!: string;
  @ApiProperty({ description: 'Why HR is submitting on behalf' }) @IsString() onBehalfReason!: string;
}
```

```ts
// backend/src/modules/requests/dto/review.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class RejectRequestDto {
  @ApiProperty() @IsString() rejectionReason!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
```

```ts
// backend/src/modules/requests/dto/disburse.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DisburseRequestDto {
  @ApiPropertyOptional({ description: 'Existing bankTransferId; if absent, a new single-request transfer is created' })
  @IsOptional() @IsString() bankTransferId?: string;
}
```

```ts
// backend/src/modules/requests/dto/list-requests-query.dto.ts
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../../common/dto/list-query.dto';

export class ListRequestsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: ['pending', 'approved', 'rejected', 'disbursed'] })
  @IsOptional() @IsIn(['pending', 'approved', 'rejected', 'disbursed']) status?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() employeeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reviewedById?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() periodStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() periodEnd?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) isOnBehalf?: boolean;
}
```

```ts
// backend/src/modules/requests/dto/request.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class EWARequestDto {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() employeeName!: string;
  @ApiProperty() department!: string;
  @ApiProperty() payCycle!: string;
  @ApiProperty() periodLabel!: string;
  @ApiProperty() periodStart!: string;
  @ApiProperty() periodEnd!: string;
  @ApiProperty() requestedAmount!: number;
  @ApiProperty() transferFee!: number;
  @ApiProperty() netTransferAmount!: number;
  @ApiProperty() earnedToDate!: number;
  @ApiProperty() maxWithdrawable!: number;
  @ApiProperty() previousEWAThisPeriod!: number;
  @ApiProperty() percentOfEarned!: number;
  @ApiProperty() reason!: string;
  @ApiProperty({ nullable: true }) employeeNote!: string | null;
  @ApiProperty() status!: string;
  @ApiProperty() requestedAt!: string;
  @ApiProperty({ nullable: true }) reviewedBy!: string | null;
  @ApiProperty({ nullable: true }) reviewedById!: string | null;
  @ApiProperty({ nullable: true }) reviewedAt!: string | null;
  @ApiProperty({ nullable: true }) rejectionReason!: string | null;
  @ApiProperty({ nullable: true }) hrNote!: string | null;
  @ApiProperty() isOnBehalf!: boolean;
  @ApiProperty({ nullable: true }) onBehalfHRId!: string | null;
  @ApiProperty({ nullable: true }) onBehalfHRName!: string | null;
  @ApiProperty({ nullable: true }) onBehalfReason!: string | null;
  @ApiProperty({ nullable: true }) disbursedAt!: string | null;
  @ApiProperty({ nullable: true }) bankTransferId!: string | null;
  @ApiProperty({ nullable: true }) bankAccountMasked!: string | null;
  @ApiProperty({ nullable: true }) bankName!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
```

- [ ] **Step 2: Service — covers list, get, preview, create, on-behalf, approve, reject, disburse**

```ts
// backend/src/modules/requests/requests.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import { EWARequest } from './entities/ewa-request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { OnBehalfRequestDto } from './dto/on-behalf.dto';
import { PreviewRequestDto } from './dto/preview-request.dto';
import { ApproveRequestDto, RejectRequestDto } from './dto/review.dto';
import { DisburseRequestDto } from './dto/disburse.dto';
import { ListRequestsQueryDto } from './dto/list-requests-query.dto';
import { EWARequestDto } from './dto/request.dto';
import { EmployeesService } from '../employees/employees.service';
import { EffectivePolicyService } from '../../ewa/rules/effective-policy.service';
import { EwaRulesService, DEFAULT_TRANSFER_FEE_THB } from '../../ewa/rules/ewa-rules.service';
import { generateEWAId, generateTransferId } from '../../ewa/ids/id-generators';
import { assertTransition } from '../../ewa/state/request-state-machine';
import { ActorContext } from '../../common/auth/actor.types';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(EWARequest) private readonly repo: Repository<EWARequest>,
    private readonly employees: EmployeesService,
    private readonly policies: EffectivePolicyService,
    private readonly rules: EwaRulesService,
  ) {}

  async list(companyId: string, q: ListRequestsQueryDto) {
    const qb = this.repo.createQueryBuilder('r').where('r.companyId = :companyId', { companyId });
    if (q.status) qb.andWhere('r.status = :status', { status: q.status });
    if (q.employeeId) qb.andWhere('r.employeeId = :eid', { eid: q.employeeId });
    if (q.reviewedById) qb.andWhere('r.reviewedById = :rid', { rid: q.reviewedById });
    if (q.periodStart) qb.andWhere('r.periodStart >= :ps', { ps: q.periodStart });
    if (q.periodEnd) qb.andWhere('r.periodEnd <= :pe', { pe: q.periodEnd });
    if (q.isOnBehalf !== undefined) qb.andWhere('r.isOnBehalf = :ob', { ob: q.isOnBehalf ? 1 : 0 });
    qb.orderBy('r.requestedAt', 'DESC').take(q.limit ?? 20).skip(q.offset ?? 0);
    const [rows, total] = await qb.getManyAndCount();
    return { data: rows.map(this.toDto), total, limit: q.limit ?? 20, offset: q.offset ?? 0 };
  }

  async findOne(companyId: string, id: string): Promise<EWARequestDto> {
    return this.toDto(await this.loadOrThrow(companyId, id));
  }

  /** Snapshot inputs for a request; returns the values used to lock into the request row. */
  private async snapshot(companyId: string, employeeId: string, requestedAmount: number) {
    const employee = await this.employees.loadOrThrow(companyId, employeeId);
    const policy = await this.policies.effectiveOnly(employee);
    const period = employee.currentPeriod ?? this.fallbackPeriod(employee.payCycle);
    const earnedToDate = this.rules.calculateEarnedToDate(employee.payCycle, {
      monthlySalary: employee.monthlySalary,
      dailyRate: employee.dailyRate,
      workedDays: period.workedDays,
      standardWorkDays: employee.standardWorkDays,
    }) || period.earnedToDate;
    const maxWithdrawable = this.rules.calculateMaxWithdrawable(earnedToDate, policy.maxPercent, period.previousEWAThisPeriod);
    const transferFee = DEFAULT_TRANSFER_FEE_THB;
    const netTransferAmount = this.rules.calculateNetTransferAmount(requestedAmount, transferFee);
    const percentOfEarned = earnedToDate > 0 ? Math.round((requestedAmount / earnedToDate) * 1000) / 10 : 0;
    return { employee, policy, period, earnedToDate, maxWithdrawable, transferFee, netTransferAmount, percentOfEarned };
  }

  private fallbackPeriod(cycle: 'monthly' | 'weekly') {
    const now = dayjs();
    if (cycle === 'monthly') {
      return {
        label: now.format('MMM YYYY'),
        startDate: now.startOf('month').format('YYYY-MM-DD'),
        endDate: now.endOf('month').format('YYYY-MM-DD'),
        payDate: now.endOf('month').format('YYYY-MM-DD'),
        cutoffDate: now.startOf('month').date(25).format('YYYY-MM-DD'),
        workedDays: 18,
        totalWorkDays: 22,
        earnedToDate: 0,
        previousEWAThisPeriod: 0,
        maxWithdrawable: 0,
        usedRequests: 0,
        remainingRequests: 0,
      };
    }
    return {
      label: `สัปดาห์ ${now.format('w')}/${now.format('YYYY')}`,
      startDate: now.day(1).format('YYYY-MM-DD'),
      endDate: now.day(5).format('YYYY-MM-DD'),
      payDate: now.day(5).format('YYYY-MM-DD'),
      cutoffDate: now.day(4).format('YYYY-MM-DD'),
      workedDays: 4,
      totalWorkDays: 5,
      earnedToDate: 0,
      previousEWAThisPeriod: 0,
      maxWithdrawable: 0,
      usedRequests: 0,
      remainingRequests: 0,
    };
  }

  async preview(companyId: string, dto: PreviewRequestDto) {
    const snap = await this.snapshot(companyId, dto.employeeId, dto.requestedAmount);
    try {
      this.rules.validateGuards(snap.policy, snap.period, snap.employee.payCycle);
      this.rules.validateAmount(dto.requestedAmount, snap.policy, snap.maxWithdrawable);
      return {
        valid: true as const,
        transferFee: snap.transferFee,
        netTransferAmount: snap.netTransferAmount,
        percentOfEarned: snap.percentOfEarned,
        maxWithdrawable: snap.maxWithdrawable,
      };
    } catch (e) {
      const err = e as { code?: string; message?: string; details?: Record<string, unknown> };
      return {
        valid: false as const,
        errorCode: err.code,
        errorMessage: err.message,
        details: err.details,
        transferFee: snap.transferFee,
        netTransferAmount: snap.netTransferAmount,
        percentOfEarned: snap.percentOfEarned,
        maxWithdrawable: snap.maxWithdrawable,
      };
    }
  }

  async create(companyId: string, dto: CreateRequestDto, actor: ActorContext): Promise<EWARequestDto> {
    return this.persist(companyId, {
      employeeId: dto.employeeId,
      requestedAmount: dto.requestedAmount,
      reason: dto.reason,
      employeeNote: dto.employeeNote ?? null,
      isOnBehalf: false,
      onBehalf: null,
    }, actor);
  }

  async createOnBehalf(companyId: string, dto: OnBehalfRequestDto, actor: ActorContext): Promise<EWARequestDto> {
    if (actor.kind !== 'hr') throw new ConflictException('On-behalf requires an HR actor (x-actor-id starting with HR-)');
    return this.persist(companyId, {
      employeeId: dto.employeeId,
      requestedAmount: dto.requestedAmount,
      reason: dto.reason,
      employeeNote: null,
      isOnBehalf: true,
      onBehalf: { hrId: actor.id, hrName: actor.name ?? actor.id, reason: dto.onBehalfReason },
    }, actor);
  }

  private async persist(
    companyId: string,
    input: {
      employeeId: string;
      requestedAmount: number;
      reason: string;
      employeeNote: string | null;
      isOnBehalf: boolean;
      onBehalf: { hrId: string; hrName: string; reason: string } | null;
    },
    actor: ActorContext,
  ): Promise<EWARequestDto> {
    const snap = await this.snapshot(companyId, input.employeeId, input.requestedAmount);
    this.rules.validateGuards(snap.policy, snap.period, snap.employee.payCycle);
    this.rules.validateAmount(input.requestedAmount, snap.policy, snap.maxWithdrawable);

    const id = generateEWAId(input.employeeId);
    const auto = this.rules.shouldAutoApprove(input.requestedAmount, snap.policy);

    const entity = this.repo.create({
      id,
      companyId,
      employeeId: snap.employee.id,
      employeeName: snap.employee.name,
      employeeAvatar: snap.employee.avatarInitials,
      department: snap.employee.department,
      departmentName: snap.employee.departmentName,
      payCycle: snap.employee.payCycle,
      periodLabel: snap.period.label,
      periodStart: snap.period.startDate,
      periodEnd: snap.period.endDate,
      requestedAmount: input.requestedAmount,
      transferFee: snap.transferFee,
      netTransferAmount: snap.netTransferAmount,
      earnedToDate: snap.earnedToDate,
      maxWithdrawable: snap.maxWithdrawable,
      previousEWAThisPeriod: snap.period.previousEWAThisPeriod,
      percentOfEarned: snap.percentOfEarned,
      reason: input.reason,
      employeeNote: input.employeeNote,
      status: auto ? 'approved' : 'pending',
      requestedAt: new Date(),
      reviewedBy: auto ? 'system' : null,
      reviewedById: auto ? 'system' : null,
      reviewedAt: auto ? new Date() : null,
      rejectionReason: null,
      hrNote: null,
      isOnBehalf: input.isOnBehalf ? 1 : 0,
      onBehalfHRId: input.onBehalf?.hrId ?? null,
      onBehalfHRName: input.onBehalf?.hrName ?? null,
      onBehalfReason: input.onBehalf?.reason ?? null,
      disbursedAt: null,
      bankTransferId: null,
      bankAccountMasked: snap.employee.bankAccountMasked,
      bankName: snap.employee.bankName,
    });
    const saved = await this.repo.save(entity);

    // Update employee.currentPeriod counters
    const newPeriod = {
      ...snap.period,
      usedRequests: snap.period.usedRequests + 1,
      remainingRequests: Math.max(0, snap.policy.maxRequests - (snap.period.usedRequests + 1)),
      previousEWAThisPeriod: snap.period.previousEWAThisPeriod + (auto ? input.requestedAmount : 0),
      maxWithdrawable: this.rules.calculateMaxWithdrawable(snap.earnedToDate, snap.policy.maxPercent, snap.period.previousEWAThisPeriod + (auto ? input.requestedAmount : 0)),
      earnedToDate: snap.earnedToDate,
    };
    snap.employee.currentPeriod = newPeriod;
    await this.employees.loadOrThrow(companyId, snap.employee.id); // ensure attached
    await this.employees['repo'].save(snap.employee); // direct repo save (private but acceptable in same package)

    return this.toDto(saved);
  }

  async approve(companyId: string, id: string, dto: ApproveRequestDto, actor: ActorContext): Promise<EWARequestDto> {
    const r = await this.loadOrThrow(companyId, id);
    assertTransition(r.status, 'approved');
    r.status = 'approved';
    r.reviewedBy = actor.name ?? actor.id;
    r.reviewedById = actor.id;
    r.reviewedAt = new Date();
    r.hrNote = dto.note ?? r.hrNote;
    return this.toDto(await this.repo.save(r));
  }

  async reject(companyId: string, id: string, dto: RejectRequestDto, actor: ActorContext): Promise<EWARequestDto> {
    const r = await this.loadOrThrow(companyId, id);
    assertTransition(r.status, 'rejected');
    r.status = 'rejected';
    r.reviewedBy = actor.name ?? actor.id;
    r.reviewedById = actor.id;
    r.reviewedAt = new Date();
    r.rejectionReason = dto.rejectionReason;
    r.hrNote = dto.note ?? r.hrNote;
    return this.toDto(await this.repo.save(r));
  }

  async disburse(companyId: string, id: string, dto: DisburseRequestDto, actor: ActorContext): Promise<EWARequestDto> {
    const r = await this.loadOrThrow(companyId, id);
    assertTransition(r.status, 'disbursed');
    r.status = 'disbursed';
    r.disbursedAt = new Date();
    r.bankTransferId = dto.bankTransferId ?? generateTransferId();
    if (!dto.bankTransferId) {
      // BankTransfers module owns creation; for the POC we just stamp the id and let Phase 6 fill the row
    }
    if (!r.reviewedById) {
      r.reviewedBy = actor.name ?? actor.id;
      r.reviewedById = actor.id;
      r.reviewedAt = new Date();
    }
    return this.toDto(await this.repo.save(r));
  }

  private async loadOrThrow(companyId: string, id: string): Promise<EWARequest> {
    const r = await this.repo.findOne({ where: { id, companyId } });
    if (!r) throw new NotFoundException(`Request ${id} not found`);
    return r;
  }

  private toDto = (r: EWARequest): EWARequestDto => ({
    id: r.id,
    companyId: r.companyId,
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    department: r.department,
    payCycle: r.payCycle,
    periodLabel: r.periodLabel,
    periodStart: r.periodStart,
    periodEnd: r.periodEnd,
    requestedAmount: r.requestedAmount,
    transferFee: r.transferFee,
    netTransferAmount: r.netTransferAmount,
    earnedToDate: r.earnedToDate,
    maxWithdrawable: r.maxWithdrawable,
    previousEWAThisPeriod: r.previousEWAThisPeriod,
    percentOfEarned: r.percentOfEarned,
    reason: r.reason,
    employeeNote: r.employeeNote,
    status: r.status,
    requestedAt: r.requestedAt.toISOString(),
    reviewedBy: r.reviewedBy,
    reviewedById: r.reviewedById,
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
    rejectionReason: r.rejectionReason,
    hrNote: r.hrNote,
    isOnBehalf: r.isOnBehalf === 1,
    onBehalfHRId: r.onBehalfHRId,
    onBehalfHRName: r.onBehalfHRName,
    onBehalfReason: r.onBehalfReason,
    disbursedAt: r.disbursedAt ? r.disbursedAt.toISOString() : null,
    bankTransferId: r.bankTransferId,
    bankAccountMasked: r.bankAccountMasked,
    bankName: r.bankName,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  });
}
```

Note on `this.employees['repo'].save(snap.employee)`: this reaches into the private repo for brevity. Acceptable for the POC; if you want it cleaner, expose a public `saveRaw(employee: Employee): Promise<Employee>` on `EmployeesService`.

- [ ] **Step 3: Controller**

```ts
// backend/src/modules/requests/requests.controller.ts
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { OnBehalfRequestDto } from './dto/on-behalf.dto';
import { PreviewRequestDto } from './dto/preview-request.dto';
import { ApproveRequestDto, RejectRequestDto } from './dto/review.dto';
import { DisburseRequestDto } from './dto/disburse.dto';
import { ListRequestsQueryDto } from './dto/list-requests-query.dto';
import { CurrentCompany } from '../../common/tenant/current-company.decorator';
import { TenantContext } from '../../common/tenant/tenant.types';
import { CurrentActor } from '../../common/auth/current-actor.decorator';
import { ActorContext } from '../../common/auth/actor.types';
import { Audited } from '../../common/audit/audited.decorator';

@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly service: RequestsService) {}

  @Get()
  list(@CurrentCompany() c: TenantContext, @Query() q: ListRequestsQueryDto) {
    return this.service.list(c.id, q);
  }

  @Get(':id')
  findOne(@CurrentCompany() c: TenantContext, @Param('id') id: string) {
    return this.service.findOne(c.id, id);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Dry-run validation; does not persist' })
  preview(@CurrentCompany() c: TenantContext, @Body() dto: PreviewRequestDto) {
    return this.service.preview(c.id, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Employee submit (validates against effective policy; auto-approves under threshold)' })
  @Audited({
    action: 'request_created',
    targetType: 'request',
    target: (_req, res: { id?: string }) => res?.id ?? 'unknown',
    description: (req) => `EWA request submitted for ${req.body?.employeeId} amount=${req.body?.requestedAmount}`,
  })
  create(@CurrentCompany() c: TenantContext, @CurrentActor() a: ActorContext, @Body() dto: CreateRequestDto) {
    return this.service.create(c.id, dto, a);
  }

  @Post('on-behalf')
  @ApiOperation({ summary: 'HR submits on behalf of an employee (requires HR actor)' })
  @Audited({
    action: 'request_on_behalf',
    targetType: 'request',
    target: (_req, res: { id?: string }) => res?.id ?? 'unknown',
    metadata: (req) => ({ onBehalfReason: req.body?.onBehalfReason }),
  })
  onBehalf(@CurrentCompany() c: TenantContext, @CurrentActor() a: ActorContext, @Body() dto: OnBehalfRequestDto) {
    return this.service.createOnBehalf(c.id, dto, a);
  }

  @Post(':id/approve')
  @Audited({ action: 'request_approved', targetType: 'request', target: (req) => req.params.id })
  approve(@CurrentCompany() c: TenantContext, @CurrentActor() a: ActorContext, @Param('id') id: string, @Body() dto: ApproveRequestDto) {
    return this.service.approve(c.id, id, dto, a);
  }

  @Post(':id/reject')
  @Audited({ action: 'request_rejected', targetType: 'request', target: (req) => req.params.id, metadata: (req) => ({ rejectionReason: req.body?.rejectionReason }) })
  reject(@CurrentCompany() c: TenantContext, @CurrentActor() a: ActorContext, @Param('id') id: string, @Body() dto: RejectRequestDto) {
    return this.service.reject(c.id, id, dto, a);
  }

  @Post(':id/disburse')
  @Audited({ action: 'request_disbursed', targetType: 'request', target: (req) => req.params.id })
  disburse(@CurrentCompany() c: TenantContext, @CurrentActor() a: ActorContext, @Param('id') id: string, @Body() dto: DisburseRequestDto) {
    return this.service.disburse(c.id, id, dto, a);
  }
}
```

- [ ] **Step 4: Module**

```ts
// backend/src/modules/requests/requests.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EWARequest } from './entities/ewa-request.entity';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [TypeOrmModule.forFeature([EWARequest]), EmployeesModule],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
```

- [ ] **Step 5: Wire and verify**

Add `RequestsModule` to `app.module.ts`.

```bash
npm run build && npm run start:dev
```

```bash
# Need EMP-0041 with valid currentPeriod for proper rules; for now use the fallback period.
# Preview a request:
curl -s -X POST http://localhost:3001/requests/preview \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' \
  -d '{"employeeId":"EMP-0041","requestedAmount":3000}' | head

# Submit a real request:
curl -s -X POST http://localhost:3001/requests \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' -H 'x-actor-id: EMP-0041' \
  -d '{"employeeId":"EMP-0041","requestedAmount":3000,"reason":"ค่ารักษาพยาบาล"}' | head

# Approve (requires the request id printed from previous call)
REQ_ID=$(curl -s -X POST http://localhost:3001/requests \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' -H 'x-actor-id: EMP-0041' \
  -d '{"employeeId":"EMP-0041","requestedAmount":1000,"reason":"x"}' | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
curl -s -X POST "http://localhost:3001/requests/$REQ_ID/approve" \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' -H 'x-actor-id: HR-001' -d '{}' | head
```

Expected: preview returns `valid:true` with fee/net; create returns 200 (`status:approved` for amounts under 3000 since auto-approval threshold is 3000); approve transitions a pending request to approved. Audit rows are written. Kill server.

- [ ] **Step 6: Commit**

```bash
git add backend/src
git commit -m "feat(backend): requests lifecycle (preview, create, on-behalf, approve, reject, disburse)"
```

---

## Phase 5 checkpoint

- The full EWA loop drives end-to-end via Swagger
- Auto-approval works for sub-threshold amounts
- State machine rejects illegal transitions (e.g. approving a `disbursed` request → 422 `EWA_INVALID_TRANSITION`)
- All lifecycle endpoints write audit rows

---

## Phase 6 — Auxiliary modules (Notifications, BankTransfers, AuditLogs read-only)

**Outcome:** Three smaller modules live. Notifications support recipient filtering + read-state. Bank transfers support batch/settle/retry. Audit logs are queryable.

---

### Task 6.1: Notifications module

**Files:**
- Create: `backend/src/modules/notifications/entities/notification.entity.ts`
- Create: `backend/src/modules/notifications/dto/{create,notification,list-query,read-all}.dto.ts`
- Create: `backend/src/modules/notifications/notifications.service.ts`
- Create: `backend/src/modules/notifications/notifications.controller.ts`
- Create: `backend/src/modules/notifications/notifications.module.ts`
- Create: `backend/src/db/migrations/1715472800000-add-notifications.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Entity**

```ts
// backend/src/modules/notifications/entities/notification.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

export type NotificationType =
  | 'new_request' | 'request_approved' | 'request_rejected' | 'disbursement_complete'
  | 'payday_reminder' | 'cutoff_reminder' | 'quota_warning';
export type RecipientType = 'hr' | 'employee';
export type NotificationChannel = 'email' | 'line' | 'sms';

@Entity('notifications')
@Index(['companyId', 'recipientId', 'recipientType'])
export class Notification {
  @PrimaryColumn({ type: 'text' }) id!: string;
  @Column({ type: 'text' }) companyId!: string;
  @Column({ type: 'text' }) type!: NotificationType;
  @Column({ type: 'text' }) recipientId!: string;
  @Column({ type: 'text' }) recipientType!: RecipientType;
  @Column({ type: 'text' }) title!: string;
  @Column({ type: 'text' }) body!: string;
  @Column({ type: 'text', nullable: true }) requestId!: string | null;
  @Column({ type: 'integer', default: 0 }) isRead!: number;
  @Column({ type: 'simple-json', default: '[]' }) channel!: NotificationChannel[];
  @CreateDateColumn({ type: 'datetime' }) createdAt!: Date;
}
```

- [ ] **Step 2: Migration**

```ts
// backend/src/db/migrations/1715472800000-add-notifications.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotifications1715472800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" text PRIMARY KEY NOT NULL,
        "companyId" text NOT NULL,
        "type" text NOT NULL,
        "recipientId" text NOT NULL,
        "recipientType" text NOT NULL CHECK ("recipientType" IN ('hr','employee')),
        "title" text NOT NULL,
        "body" text NOT NULL,
        "requestId" text,
        "isRead" integer NOT NULL DEFAULT 0,
        "channel" text NOT NULL DEFAULT '[]',
        "createdAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_notifications_company_recipient" ON "notifications" ("companyId","recipientId","recipientType")`);
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS "idx_notifications_company_recipient"`);
    await q.query(`DROP TABLE "notifications"`);
  }
}
```

- [ ] **Step 3: DTOs**

```ts
// backend/src/modules/notifications/dto/create-notification.dto.ts
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty() @IsString() type!: string;
  @ApiProperty() @IsString() recipientId!: string;
  @ApiProperty({ enum: ['hr', 'employee'] }) @IsIn(['hr', 'employee']) recipientType!: 'hr' | 'employee';
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() body!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() requestId?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) channel?: string[];
}
```

```ts
// backend/src/modules/notifications/dto/list-query.dto.ts
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../../common/dto/list-query.dto';

export class ListNotificationsQuery extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() recipientId?: string;
  @ApiPropertyOptional({ enum: ['hr', 'employee'] }) @IsOptional() @IsIn(['hr', 'employee']) recipientType?: 'hr' | 'employee';
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() isRead?: boolean;
}
```

```ts
// backend/src/modules/notifications/dto/read-all.dto.ts
import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReadAllDto {
  @ApiProperty() @IsString() recipientId!: string;
  @ApiProperty({ enum: ['hr', 'employee'] }) @IsIn(['hr', 'employee']) recipientType!: 'hr' | 'employee';
}
```

- [ ] **Step 4: Service**

```ts
// backend/src/modules/notifications/notifications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ListNotificationsQuery } from './dto/list-query.dto';
import { generateNotificationId } from '../../ewa/ids/id-generators';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private readonly repo: Repository<Notification>) {}

  async list(companyId: string, q: ListNotificationsQuery) {
    const qb = this.repo.createQueryBuilder('n').where('n.companyId = :companyId', { companyId });
    if (q.recipientId) qb.andWhere('n.recipientId = :rid', { rid: q.recipientId });
    if (q.recipientType) qb.andWhere('n.recipientType = :rt', { rt: q.recipientType });
    if (q.isRead !== undefined) qb.andWhere('n.isRead = :r', { r: q.isRead ? 1 : 0 });
    qb.orderBy('n.createdAt', 'DESC').take(q.limit ?? 20).skip(q.offset ?? 0);
    const [rows, total] = await qb.getManyAndCount();
    return { data: rows, total, limit: q.limit ?? 20, offset: q.offset ?? 0 };
  }

  async findOne(companyId: string, id: string) {
    const n = await this.repo.findOne({ where: { id, companyId } });
    if (!n) throw new NotFoundException(`Notification ${id} not found`);
    return n;
  }

  async create(companyId: string, dto: CreateNotificationDto): Promise<Notification> {
    const entity = this.repo.create({
      id: generateNotificationId(),
      companyId,
      type: dto.type as Notification['type'],
      recipientId: dto.recipientId,
      recipientType: dto.recipientType,
      title: dto.title,
      body: dto.body,
      requestId: dto.requestId ?? null,
      channel: (dto.channel ?? []) as Notification['channel'],
      isRead: 0,
    });
    return this.repo.save(entity);
  }

  async markRead(companyId: string, id: string) {
    const n = await this.findOne(companyId, id);
    n.isRead = 1;
    return this.repo.save(n);
  }

  async readAll(companyId: string, recipientId: string, recipientType: 'hr' | 'employee') {
    await this.repo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: 1 })
      .where('companyId = :c', { c: companyId })
      .andWhere('recipientId = :r', { r: recipientId })
      .andWhere('recipientType = :t', { t: recipientType })
      .execute();
    return { ok: true };
  }
}
```

- [ ] **Step 5: Controller + Module**

```ts
// backend/src/modules/notifications/notifications.controller.ts
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ListNotificationsQuery } from './dto/list-query.dto';
import { ReadAllDto } from './dto/read-all.dto';
import { CurrentCompany } from '../../common/tenant/current-company.decorator';
import { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get() list(@CurrentCompany() c: TenantContext, @Query() q: ListNotificationsQuery) { return this.service.list(c.id, q); }
  @Get(':id') findOne(@CurrentCompany() c: TenantContext, @Param('id') id: string) { return this.service.findOne(c.id, id); }
  @Post() create(@CurrentCompany() c: TenantContext, @Body() dto: CreateNotificationDto) { return this.service.create(c.id, dto); }
  @Post(':id/read') markRead(@CurrentCompany() c: TenantContext, @Param('id') id: string) { return this.service.markRead(c.id, id); }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications for a recipient as read' })
  readAll(@CurrentCompany() c: TenantContext, @Body() dto: ReadAllDto) {
    return this.service.readAll(c.id, dto.recipientId, dto.recipientType);
  }
}
```

```ts
// backend/src/modules/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

- [ ] **Step 6: Wire, build, smoke**

Add `NotificationsModule` to `app.module.ts`.

```bash
npm run build && npm run start:dev
```

```bash
curl -s -X POST http://localhost:3001/notifications \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' \
  -d '{"type":"request_approved","recipientId":"EMP-0041","recipientType":"employee","title":"คำขออนุมัติแล้ว","body":"...","channel":["line"]}' | head
```

Expected: 200. Kill server.

- [ ] **Step 7: Commit**

```bash
git add backend/src
git commit -m "feat(backend): notifications module"
```

---

### Task 6.2: BankTransfers module (batch/settle/retry)

**Files:**
- Create: `backend/src/modules/bank-transfers/entities/bank-transfer.entity.ts`
- Create: `backend/src/modules/bank-transfers/dto/{batch,bank-transfer,list-query}.dto.ts`
- Create: `backend/src/modules/bank-transfers/bank-transfers.service.ts`
- Create: `backend/src/modules/bank-transfers/bank-transfers.controller.ts`
- Create: `backend/src/modules/bank-transfers/bank-transfers.module.ts`
- Create: `backend/src/db/migrations/1715472900000-add-bank-transfers.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Entity**

```ts
// backend/src/modules/bank-transfers/entities/bank-transfer.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type TransferStatus = 'processing' | 'settled' | 'failed';

@Entity('bank_transfers')
@Index(['companyId', 'status'])
export class BankTransfer {
  @PrimaryColumn({ type: 'text' }) id!: string;
  @Column({ type: 'text' }) companyId!: string;
  @Column({ type: 'simple-json', default: '[]' }) requestIds!: string[];
  @Column({ type: 'integer' }) totalAmount!: number;
  @Column({ type: 'text', nullable: true }) recipientBank!: string | null;
  @Column({ type: 'text', nullable: true }) recipientAccountMasked!: string | null;
  @Column({ type: 'text' }) status!: TransferStatus;
  @Column({ type: 'text', nullable: true }) processingBank!: string | null;
  @Column({ type: 'text', nullable: true }) referenceNumber!: string | null;
  @Column({ type: 'datetime' }) initiatedAt!: Date;
  @Column({ type: 'datetime', nullable: true }) settledAt!: Date | null;
  @Column({ type: 'text', nullable: true }) failureReason!: string | null;
  @Column({ type: 'integer', default: 0 }) retryCount!: number;
  @Column({ type: 'text', nullable: true }) batchLabel!: string | null;
  @CreateDateColumn({ type: 'datetime' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'datetime' }) updatedAt!: Date;
}
```

- [ ] **Step 2: Migration**

```ts
// backend/src/db/migrations/1715472900000-add-bank-transfers.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBankTransfers1715472900000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "bank_transfers" (
        "id" text PRIMARY KEY NOT NULL,
        "companyId" text NOT NULL,
        "requestIds" text NOT NULL DEFAULT '[]',
        "totalAmount" integer NOT NULL,
        "recipientBank" text,
        "recipientAccountMasked" text,
        "status" text NOT NULL CHECK ("status" IN ('processing','settled','failed')),
        "processingBank" text,
        "referenceNumber" text,
        "initiatedAt" datetime NOT NULL,
        "settledAt" datetime,
        "failureReason" text,
        "retryCount" integer NOT NULL DEFAULT 0,
        "batchLabel" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await q.query(`CREATE INDEX "idx_bank_transfers_company_status" ON "bank_transfers" ("companyId","status")`);
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS "idx_bank_transfers_company_status"`);
    await q.query(`DROP TABLE "bank_transfers"`);
  }
}
```

- [ ] **Step 3: DTOs**

```ts
// backend/src/modules/bank-transfers/dto/batch.dto.ts
import { ArrayMinSize, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchTransferDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMinSize(1) @IsString({ each: true }) requestIds!: string[];
}
```

```ts
// backend/src/modules/bank-transfers/dto/list-query.dto.ts
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../../common/dto/list-query.dto';

export class ListBankTransfersQuery extends ListQueryDto {
  @ApiPropertyOptional({ enum: ['processing', 'settled', 'failed'] })
  @IsOptional() @IsIn(['processing', 'settled', 'failed']) status?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() batchLabel?: string;
}
```

- [ ] **Step 4: Service**

```ts
// backend/src/modules/bank-transfers/bank-transfers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BankTransfer } from './entities/bank-transfer.entity';
import { BatchTransferDto } from './dto/batch.dto';
import { ListBankTransfersQuery } from './dto/list-query.dto';
import { EWARequest } from '../requests/entities/ewa-request.entity';
import { generateTransferId } from '../../ewa/ids/id-generators';

@Injectable()
export class BankTransfersService {
  constructor(
    @InjectRepository(BankTransfer) private readonly repo: Repository<BankTransfer>,
    @InjectRepository(EWARequest) private readonly reqRepo: Repository<EWARequest>,
  ) {}

  async list(companyId: string, q: ListBankTransfersQuery) {
    const qb = this.repo.createQueryBuilder('t').where('t.companyId = :c', { c: companyId });
    if (q.status) qb.andWhere('t.status = :s', { s: q.status });
    if (q.batchLabel) qb.andWhere('t.batchLabel = :b', { b: q.batchLabel });
    qb.orderBy('t.initiatedAt', 'DESC').take(q.limit ?? 20).skip(q.offset ?? 0);
    const [rows, total] = await qb.getManyAndCount();
    return { data: rows, total, limit: q.limit ?? 20, offset: q.offset ?? 0 };
  }

  async findOne(companyId: string, id: string) {
    const t = await this.repo.findOne({ where: { id, companyId } });
    if (!t) throw new NotFoundException(`BankTransfer ${id} not found`);
    const requests = t.requestIds.length
      ? await this.reqRepo.find({ where: { id: In(t.requestIds), companyId } })
      : [];
    return { ...t, requests };
  }

  async batch(companyId: string, dto: BatchTransferDto) {
    const requests = await this.reqRepo.find({ where: { id: In(dto.requestIds), companyId } });
    if (requests.length !== dto.requestIds.length) {
      throw new NotFoundException('One or more requests not found in this company');
    }
    const totalAmount = requests.reduce((sum, r) => sum + r.netTransferAmount, 0);
    const id = generateTransferId();
    const first = requests[0];
    const transfer = this.repo.create({
      id,
      companyId,
      requestIds: requests.map(r => r.id),
      totalAmount,
      recipientBank: first?.bankName ?? null,
      recipientAccountMasked: first?.bankAccountMasked ?? null,
      status: 'processing',
      processingBank: 'ธ.กสิกรไทย',
      referenceNumber: id.replace('TRF-', 'REF-'),
      initiatedAt: new Date(),
      retryCount: 0,
      batchLabel: first?.periodLabel ?? null,
    });
    await this.repo.save(transfer);

    // Stamp transfer id on the involved requests
    for (const r of requests) {
      r.bankTransferId = id;
      await this.reqRepo.save(r);
    }
    return transfer;
  }

  async settle(companyId: string, id: string) {
    const t = await this.repo.findOne({ where: { id, companyId } });
    if (!t) throw new NotFoundException(`BankTransfer ${id} not found`);
    if (t.status !== 'processing') throw new NotFoundException(`Transfer not in processing state`);
    t.status = 'settled';
    t.settledAt = new Date();
    return this.repo.save(t);
  }

  async retry(companyId: string, id: string) {
    const t = await this.repo.findOne({ where: { id, companyId } });
    if (!t) throw new NotFoundException(`BankTransfer ${id} not found`);
    if (t.status !== 'failed') throw new NotFoundException(`Transfer not in failed state`);
    t.status = 'processing';
    t.retryCount += 1;
    return this.repo.save(t);
  }
}
```

- [ ] **Step 5: Controller + Module**

```ts
// backend/src/modules/bank-transfers/bank-transfers.controller.ts
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BankTransfersService } from './bank-transfers.service';
import { BatchTransferDto } from './dto/batch.dto';
import { ListBankTransfersQuery } from './dto/list-query.dto';
import { CurrentCompany } from '../../common/tenant/current-company.decorator';
import { TenantContext } from '../../common/tenant/tenant.types';
import { Audited } from '../../common/audit/audited.decorator';

@ApiTags('bank-transfers')
@Controller('bank-transfers')
export class BankTransfersController {
  constructor(private readonly service: BankTransfersService) {}

  @Get() list(@CurrentCompany() c: TenantContext, @Query() q: ListBankTransfersQuery) { return this.service.list(c.id, q); }
  @Get(':id') findOne(@CurrentCompany() c: TenantContext, @Param('id') id: string) { return this.service.findOne(c.id, id); }

  @Post('batch')
  @Audited({ action: 'transfer_batched', targetType: 'transfer', target: (_req, res: { id?: string }) => res?.id ?? 'unknown' })
  batch(@CurrentCompany() c: TenantContext, @Body() dto: BatchTransferDto) { return this.service.batch(c.id, dto); }

  @Post(':id/settle')
  @Audited({ action: 'transfer_settled', targetType: 'transfer', target: (req) => req.params.id })
  settle(@CurrentCompany() c: TenantContext, @Param('id') id: string) { return this.service.settle(c.id, id); }

  @Post(':id/retry')
  @Audited({ action: 'transfer_retried', targetType: 'transfer', target: (req) => req.params.id })
  retry(@CurrentCompany() c: TenantContext, @Param('id') id: string) { return this.service.retry(c.id, id); }
}
```

```ts
// backend/src/modules/bank-transfers/bank-transfers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankTransfer } from './entities/bank-transfer.entity';
import { EWARequest } from '../requests/entities/ewa-request.entity';
import { BankTransfersService } from './bank-transfers.service';
import { BankTransfersController } from './bank-transfers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BankTransfer, EWARequest])],
  controllers: [BankTransfersController],
  providers: [BankTransfersService],
  exports: [BankTransfersService],
})
export class BankTransfersModule {}
```

- [ ] **Step 6: Wire, build, smoke, commit**

Add `BankTransfersModule` to `app.module.ts`. Build + boot.

```bash
# Approve a request, then batch it:
REQ_ID="...the EWA id from earlier..."
curl -s -X POST http://localhost:3001/bank-transfers/batch \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' -H 'x-actor-id: HR-001' \
  -d "{\"requestIds\":[\"$REQ_ID\"]}" | head
```

```bash
git add backend/src
git commit -m "feat(backend): bank-transfers module (batch/settle/retry)"
```

---

### Task 6.3: AuditLogs read-only module

The entity + table already exist (Phase 1). Add the read-only controller.

**Files:**
- Create: `backend/src/modules/audit-logs/dto/list-query.dto.ts`
- Create: `backend/src/modules/audit-logs/audit-logs.service.ts`
- Create: `backend/src/modules/audit-logs/audit-logs.controller.ts`
- Create: `backend/src/modules/audit-logs/audit-logs.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Query DTO**

```ts
// backend/src/modules/audit-logs/dto/list-query.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../../common/dto/list-query.dto';

export class ListAuditLogsQuery extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() actorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() targetId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() action?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() to?: string;
}
```

- [ ] **Step 2: Service**

```ts
// backend/src/modules/audit-logs/audit-logs.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { ListAuditLogsQuery } from './dto/list-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  async list(companyId: string, q: ListAuditLogsQuery) {
    const qb = this.repo.createQueryBuilder('a').where('a.companyId = :c', { c: companyId });
    if (q.actorId) qb.andWhere('a.actorId = :aid', { aid: q.actorId });
    if (q.targetId) qb.andWhere('a.targetId = :tid', { tid: q.targetId });
    if (q.action) qb.andWhere('a.action = :ac', { ac: q.action });
    if (q.from) qb.andWhere('a.createdAt >= :f', { f: q.from });
    if (q.to) qb.andWhere('a.createdAt <= :t', { t: q.to });
    qb.orderBy('a.createdAt', 'DESC').take(q.limit ?? 50).skip(q.offset ?? 0);
    const [rows, total] = await qb.getManyAndCount();
    return { data: rows, total, limit: q.limit ?? 50, offset: q.offset ?? 0 };
  }

  async findOne(companyId: string, id: string) {
    const a = await this.repo.findOne({ where: { id, companyId } });
    if (!a) throw new NotFoundException(`AuditLog ${id} not found`);
    return a;
  }
}
```

- [ ] **Step 3: Controller + Module**

```ts
// backend/src/modules/audit-logs/audit-logs.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { ListAuditLogsQuery } from './dto/list-query.dto';
import { CurrentCompany } from '../../common/tenant/current-company.decorator';
import { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('audit-logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get() list(@CurrentCompany() c: TenantContext, @Query() q: ListAuditLogsQuery) { return this.service.list(c.id, q); }
  @Get(':id') findOne(@CurrentCompany() c: TenantContext, @Param('id') id: string) { return this.service.findOne(c.id, id); }
}
```

```ts
// backend/src/modules/audit-logs/audit-logs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
```

- [ ] **Step 4: Wire, build, smoke, commit**

Add `AuditLogsModule` to `app.module.ts`.

```bash
npm run build && npm run start:dev
curl -s http://localhost:3001/audit-logs -H 'x-company-id: COMP-001' | head
```

```bash
git add backend/src
git commit -m "feat(backend): audit-logs read-only endpoints"
```

---

## Phase 6 checkpoint

- All 9 domain modules live
- Audit trail queryable via Swagger
- Bank transfers batchable from approved requests
- Notifications can be created and marked read

---

## Phase 7 — LINE module (real / stub switch)

**Outcome:** `LineMessagingClient` is bound to `RealLineClient` when `LINE_CHANNEL_ACCESS_TOKEN` is set, `ConsoleLineClient` otherwise. POST `/line/push`, POST `/line/notify/request-status`, POST `/line/webhook` (public, signature-verified), GET/PUT `/line/richmenu` all live.

---

### Task 7.1: LineMessagingClient interface + implementations

**Files:**
- Create: `backend/src/modules/line/line.types.ts`
- Create: `backend/src/modules/line/line-messaging-client.interface.ts`
- Create: `backend/src/modules/line/console-line.client.ts`
- Create: `backend/src/modules/line/real-line.client.ts`
- Create: `backend/src/modules/line/line.module.ts`

- [ ] **Step 1: Types and interface**

```ts
// backend/src/modules/line/line.types.ts
export type LineMessage =
  | { type: 'text'; text: string }
  | { type: 'flex'; altText: string; contents: Record<string, unknown> };

export interface PushPayload {
  to: string; // LINE userId (Uxxx...)
  messages: LineMessage[];
}

export interface WebhookEvent {
  type: 'follow' | 'unfollow' | 'message' | 'postback';
  source: { userId?: string };
  timestamp: number;
  message?: { type: string; text?: string };
  postback?: { data: string };
}

export interface RichMenuConfig {
  name: string;
  cells: Array<{ id: string; label: string; action: string }>;
}
```

```ts
// backend/src/modules/line/line-messaging-client.interface.ts
import { PushPayload } from './line.types';

export interface LineMessagingClient {
  isReal: boolean;
  push(payload: PushPayload): Promise<{ ok: true }>;
}

export const LINE_CLIENT = Symbol('LINE_CLIENT');
```

- [ ] **Step 2: Console stub**

```ts
// backend/src/modules/line/console-line.client.ts
import { Injectable, Logger } from '@nestjs/common';
import { LineMessagingClient } from './line-messaging-client.interface';
import { PushPayload } from './line.types';

@Injectable()
export class ConsoleLineClient implements LineMessagingClient {
  readonly isReal = false;
  private readonly log = new Logger('LINE-STUB');

  async push(payload: PushPayload) {
    for (const m of payload.messages) {
      const summary = m.type === 'text' ? m.text : `[flex] ${m.altText}`;
      this.log.log(`[LINE STUB] push to=${payload.to} message=${summary}`);
    }
    return { ok: true as const };
  }
}
```

- [ ] **Step 3: Real client**

```ts
// backend/src/modules/line/real-line.client.ts
import { Injectable, Logger } from '@nestjs/common';
import { Client, FlexMessage, TextMessage } from '@line/bot-sdk';
import { LineMessagingClient } from './line-messaging-client.interface';
import { PushPayload } from './line.types';

@Injectable()
export class RealLineClient implements LineMessagingClient {
  readonly isReal = true;
  private readonly log = new Logger('LINE');
  private readonly client: Client;

  constructor(channelAccessToken: string) {
    this.client = new Client({ channelAccessToken });
  }

  async push(payload: PushPayload) {
    const messages = payload.messages.map((m): TextMessage | FlexMessage =>
      m.type === 'text'
        ? { type: 'text', text: m.text }
        : { type: 'flex', altText: m.altText, contents: m.contents as FlexMessage['contents'] },
    );
    await this.client.pushMessage(payload.to, messages);
    this.log.log(`pushed ${messages.length} message(s) to ${payload.to}`);
    return { ok: true as const };
  }
}
```

- [ ] **Step 4: Module (factory binds the right client based on env)**

```ts
// backend/src/modules/line/line.module.ts
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LINE_CLIENT } from './line-messaging-client.interface';
import { ConsoleLineClient } from './console-line.client';
import { RealLineClient } from './real-line.client';

@Module({
  providers: [
    ConsoleLineClient,
    {
      provide: LINE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const token = config.get<string>('LINE_CHANNEL_ACCESS_TOKEN');
        if (token && token.length > 0) {
          new Logger('LINE').log('LINE_CHANNEL_ACCESS_TOKEN present — using RealLineClient');
          return new RealLineClient(token);
        }
        new Logger('LINE').warn('LINE_CHANNEL_ACCESS_TOKEN not set — using ConsoleLineClient (stub mode)');
        return new ConsoleLineClient();
      },
    },
  ],
  exports: [LINE_CLIENT],
})
export class LineMessagingModule {}
```

- [ ] **Step 5: Build, commit**

```bash
npm run build
```

```bash
git add backend/src/modules/line
git commit -m "feat(backend): LINE messaging client (real/stub switch)"
```

---

### Task 7.2: LINE controller — push + notify/request-status + richmenu

**Files:**
- Create: `backend/src/modules/line/dto/{push,notify-status,richmenu}.dto.ts`
- Create: `backend/src/modules/line/line.service.ts`
- Create: `backend/src/modules/line/line.controller.ts`
- Create: `backend/src/modules/line/richmenu.store.ts`
- Modify: `backend/src/modules/line/line.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: DTOs**

```ts
// backend/src/modules/line/dto/push.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class LineTextMessage {
  @ApiProperty({ example: 'text' }) @IsIn(['text']) type!: 'text';
  @ApiProperty() @IsString() text!: string;
}
class LineFlexMessage {
  @ApiProperty({ example: 'flex' }) @IsIn(['flex']) type!: 'flex';
  @ApiProperty() @IsString() altText!: string;
  @ApiProperty({ type: Object }) @IsObject() contents!: Record<string, unknown>;
}

export class PushDto {
  @ApiProperty({ example: 'U1234567890abcdef' }) @IsString() to!: string;
  @ApiProperty({ type: [Object] })
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => Object)
  messages!: Array<LineTextMessage | LineFlexMessage>;
}
```

```ts
// backend/src/modules/line/dto/notify-status.dto.ts
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotifyRequestStatusDto {
  @ApiProperty({ example: 'EWA-20260511-0041' }) @IsString() requestId!: string;
  @ApiProperty({ example: 'U1234567890abcdef', description: 'LINE userId of the recipient' }) @IsString() to!: string;
}
```

```ts
// backend/src/modules/line/dto/richmenu.dto.ts
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class RichMenuCellDto {
  @ApiProperty() @IsString() id!: string;
  @ApiProperty() @IsString() label!: string;
  @ApiProperty() @IsString() action!: string;
}

export class RichMenuConfigDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ type: [RichMenuCellDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => RichMenuCellDto) cells!: RichMenuCellDto[];
}
```

- [ ] **Step 2: In-memory rich menu store (one row per company)**

```ts
// backend/src/modules/line/richmenu.store.ts
import { Injectable } from '@nestjs/common';
import { RichMenuConfig } from './line.types';

@Injectable()
export class RichMenuStore {
  private readonly defaults: RichMenuConfig = {
    name: 'PayDay+ default',
    cells: [
      { id: 'home', label: 'Home', action: 'liff:home' },
      { id: 'request', label: 'Request EWA', action: 'liff:request' },
      { id: 'history', label: 'History', action: 'liff:history' },
      { id: 'profile', label: 'Profile', action: 'liff:profile' },
    ],
  };

  private readonly byCompany = new Map<string, RichMenuConfig>();

  get(companyId: string): RichMenuConfig {
    return this.byCompany.get(companyId) ?? this.defaults;
  }

  set(companyId: string, cfg: RichMenuConfig): RichMenuConfig {
    this.byCompany.set(companyId, cfg);
    return cfg;
  }
}
```

(In-memory is fine for the POC; a real implementation would persist this.)

- [ ] **Step 3: Service**

```ts
// backend/src/modules/line/line.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LINE_CLIENT } from './line-messaging-client.interface';
import type { LineMessagingClient } from './line-messaging-client.interface';
import { LineMessage, PushPayload, RichMenuConfig } from './line.types';
import { RequestsService } from '../requests/requests.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RichMenuStore } from './richmenu.store';

@Injectable()
export class LineService {
  constructor(
    @Inject(LINE_CLIENT) private readonly client: LineMessagingClient,
    private readonly requests: RequestsService,
    private readonly notifications: NotificationsService,
    private readonly richmenu: RichMenuStore,
  ) {}

  push(payload: PushPayload) {
    return this.client.push(payload);
  }

  async notifyRequestStatus(companyId: string, requestId: string, to: string) {
    const r = await this.requests.findOne(companyId, requestId);
    const title =
      r.status === 'approved' ? 'EWA Approved'
      : r.status === 'rejected' ? 'EWA Rejected'
      : r.status === 'disbursed' ? 'EWA Disbursed'
      : 'EWA Update';
    const body = `Request ${r.id}: ${r.requestedAmount} THB → ${r.status}`;
    const messages: LineMessage[] = [{ type: 'text', text: `${title}\n${body}` }];
    await this.client.push({ to, messages });
    await this.notifications.create(companyId, {
      type:
        r.status === 'approved' ? 'request_approved'
        : r.status === 'rejected' ? 'request_rejected'
        : r.status === 'disbursed' ? 'disbursement_complete'
        : 'new_request',
      recipientId: r.employeeId,
      recipientType: 'employee',
      title,
      body,
      requestId: r.id,
      channel: ['line'],
    });
    return { ok: true as const, isReal: this.client.isReal };
  }

  getRichMenu(companyId: string): RichMenuConfig {
    return this.richmenu.get(companyId);
  }

  putRichMenu(companyId: string, cfg: RichMenuConfig): RichMenuConfig {
    return this.richmenu.set(companyId, cfg);
  }
}
```

- [ ] **Step 4: Controller**

```ts
// backend/src/modules/line/line.controller.ts
import { Body, Controller, Get, Headers, HttpCode, Logger, Post, Put, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import * as crypto from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { LineService } from './line.service';
import { PushDto } from './dto/push.dto';
import { NotifyRequestStatusDto } from './dto/notify-status.dto';
import { RichMenuConfigDto } from './dto/richmenu.dto';
import { CurrentCompany } from '../../common/tenant/current-company.decorator';
import { TenantContext } from '../../common/tenant/tenant.types';
import { Public } from '../../common/tenant/public.decorator';

@ApiTags('line')
@Controller('line')
export class LineController {
  private readonly log = new Logger('line.webhook');
  constructor(private readonly service: LineService, private readonly config: ConfigService) {}

  @Post('push')
  push(@Body() dto: PushDto) {
    return this.service.push({ to: dto.to, messages: dto.messages });
  }

  @Post('notify/request-status')
  @ApiOperation({ summary: 'Render the status of a request and push it to a LINE userId' })
  notifyStatus(@CurrentCompany() c: TenantContext, @Body() dto: NotifyRequestStatusDto) {
    return this.service.notifyRequestStatus(c.id, dto.requestId, dto.to);
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'LINE webhook receiver (public; verifies signature when LINE_CHANNEL_SECRET set)' })
  webhook(@Req() req: Request, @Headers('x-line-signature') signature: string | undefined) {
    const secret = this.config.get<string>('LINE_CHANNEL_SECRET');
    const body = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
    if (secret && secret.length > 0) {
      const expected = crypto.createHmac('sha256', secret).update(body).digest('base64');
      if (expected !== signature) {
        this.log.warn(`signature mismatch — expected=${expected}, got=${signature}`);
        return { ok: false, reason: 'invalid_signature' };
      }
    } else {
      this.log.warn('LINE_CHANNEL_SECRET not set — accepting webhook without signature check');
    }
    const events = (req.body?.events ?? []) as Array<{ type: string; source?: { userId?: string } }>;
    for (const e of events) this.log.log(`event=${e.type} user=${e.source?.userId ?? '?'}`);
    return { ok: true, processed: events.length };
  }

  @Get('richmenu')
  getRichMenu(@CurrentCompany() c: TenantContext) {
    return this.service.getRichMenu(c.id);
  }

  @Put('richmenu')
  putRichMenu(@CurrentCompany() c: TenantContext, @Body() dto: RichMenuConfigDto) {
    return this.service.putRichMenu(c.id, dto);
  }
}
```

- [ ] **Step 5: Capture the raw body for signature verification**

Modify `backend/src/main.ts` before `app.listen` to use `express.json` with a `verify` callback that stashes `rawBody`:

```ts
// backend/src/main.ts (additions)
import * as express from 'express';

// after NestFactory.create:
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as unknown as { rawBody?: Buffer }).rawBody = buf;
  },
}));
```

- [ ] **Step 6: Module + wire**

```ts
// backend/src/modules/line/line.module.ts (replace previous version)
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LINE_CLIENT } from './line-messaging-client.interface';
import { ConsoleLineClient } from './console-line.client';
import { RealLineClient } from './real-line.client';
import { LineService } from './line.service';
import { LineController } from './line.controller';
import { RichMenuStore } from './richmenu.store';
import { RequestsModule } from '../requests/requests.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [RequestsModule, NotificationsModule],
  providers: [
    ConsoleLineClient,
    RichMenuStore,
    LineService,
    {
      provide: LINE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const token = config.get<string>('LINE_CHANNEL_ACCESS_TOKEN');
        if (token && token.length > 0) {
          new Logger('LINE').log('LINE_CHANNEL_ACCESS_TOKEN present — using RealLineClient');
          return new RealLineClient(token);
        }
        new Logger('LINE').warn('LINE_CHANNEL_ACCESS_TOKEN not set — using ConsoleLineClient (stub mode)');
        return new ConsoleLineClient();
      },
    },
  ],
  controllers: [LineController],
  exports: [LineService, LINE_CLIENT],
})
export class LineMessagingModule {}
```

Add `LineMessagingModule` to `app.module.ts` (rename the import accordingly).

- [ ] **Step 7: Build, boot, verify**

```bash
npm run build && npm run start:dev
```

Expected boot log: `LINE_CHANNEL_ACCESS_TOKEN not set — using ConsoleLineClient (stub mode)` (since `.env` leaves it blank).

```bash
curl -s -X POST http://localhost:3001/line/push \
  -H 'content-type: application/json' -H 'x-company-id: COMP-001' \
  -d '{"to":"U1234","messages":[{"type":"text","text":"hello"}]}' | head
# Backend log shows: [LINE STUB] push to=U1234 message=hello

curl -s -X POST http://localhost:3001/line/webhook \
  -H 'content-type: application/json' \
  -d '{"events":[{"type":"follow","source":{"userId":"U1"}}]}' | head
# Expected: {"ok":true,"processed":1}; backend logs the signature-check skip warning

curl -s http://localhost:3001/line/richmenu -H 'x-company-id: COMP-001' | head
# Expected: default richmenu config
```

Kill server.

- [ ] **Step 8: Commit**

```bash
git add backend/src
git commit -m "feat(backend): LINE module (push, notify-status, webhook, richmenu)"
```

---

## Phase 7 checkpoint

- LINE module is fully wired with real/stub fallback
- Webhook receiver accepts events; verifies signature when secret is configured
- `notify/request-status` writes a `Notification` row alongside the push

---

## Phase 8 — Seeders

**Outcome:** `npm run seed:demo` produces 2 companies with realistic data so Swagger demos light up immediately. `npm run seed:bulk` (env-driven) generates faker data for pagination/report testing.

---

### Task 8.1: SeedService skeleton

Idempotent helpers that truncate-then-insert via the real services so business rules run on every seeded request.

**Files:**
- Create: `backend/src/db/seed/seed.service.ts`
- Create: `backend/src/db/seed/seed.module.ts`

- [ ] **Step 1: SeedService**

```ts
// backend/src/db/seed/seed.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { CompaniesService } from '../../modules/companies/companies.service';
import { DepartmentsService } from '../../modules/departments/departments.service';
import { HRUsersService } from '../../modules/hr-users/hr-users.service';
import { EmployeesService } from '../../modules/employees/employees.service';
import { RequestsService } from '../../modules/requests/requests.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { ActorContext } from '../../common/auth/actor.types';

const SYSTEM: ActorContext = { id: 'system', kind: 'system', name: 'system', role: null };

@Injectable()
export class SeedService {
  private readonly log = new Logger('seed');

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    readonly companies: CompaniesService,
    readonly departments: DepartmentsService,
    readonly hrUsers: HRUsersService,
    readonly employees: EmployeesService,
    readonly requests: RequestsService,
    readonly settings: SettingsService,
  ) {}

  async truncateAll(): Promise<void> {
    // SQLite delete order matters only for FKs; we don't enforce FKs, so simple loop works.
    const tables = [
      'audit_logs', 'notifications', 'bank_transfers',
      'ewa_requests', 'employees', 'hr_users', 'departments',
      'payroll_cycles', 'app_settings', 'companies',
    ];
    for (const t of tables) {
      await this.ds.query(`DELETE FROM "${t}"`);
    }
    this.log.log(`truncated ${tables.length} tables`);
  }

  /** Actor context for system-driven seeds. */
  get systemActor(): ActorContext { return SYSTEM; }
}
```

- [ ] **Step 2: SeedModule (wraps every service the seeders need)**

```ts
// backend/src/db/seed/seed.module.ts
import { Module } from '@nestjs/common';
import { CompaniesModule } from '../../modules/companies/companies.module';
import { DepartmentsModule } from '../../modules/departments/departments.module';
import { HRUsersModule } from '../../modules/hr-users/hr-users.module';
import { EmployeesModule } from '../../modules/employees/employees.module';
import { RequestsModule } from '../../modules/requests/requests.module';
import { SettingsModule } from '../../modules/settings/settings.module';
import { SeedService } from './seed.service';

@Module({
  imports: [CompaniesModule, DepartmentsModule, HRUsersModule, EmployeesModule, RequestsModule, SettingsModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/db/seed
git commit -m "feat(backend): SeedService skeleton + module"
```

---

### Task 8.2: `seed:demo` — port the mock data across 2 companies

**Files:**
- Create: `backend/src/db/seed/data/comp-001-data.ts`
- Create: `backend/src/db/seed/data/comp-002-data.ts`
- Create: `backend/src/db/seed/seed-demo.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: Data file for COMP-001 (mirrors data-model.md)**

```ts
// backend/src/db/seed/data/comp-001-data.ts
export const COMP_001 = {
  company: { id: 'COMP-001', name: 'โรงงานไทยดี จำกัด', nameEn: 'Thaidee Factory', code: 'TD' },
  departments: [
    { id: 'dept-prod-a',     name: 'ผลิต A',       nameEn: 'Production A',     headCount: 85, ewaEnrolled: 72 },
    { id: 'dept-prod-b',     name: 'ผลิต B',       nameEn: 'Production B',     headCount: 78, ewaEnrolled: 65 },
    { id: 'dept-warehouse',  name: 'คลังสินค้า',    nameEn: 'Warehouse',        headCount: 45, ewaEnrolled: 38 },
    { id: 'dept-qc',         name: 'QC',           nameEn: 'Quality Control',  headCount: 32, ewaEnrolled: 28 },
    { id: 'dept-maintenance',name: 'ซ่อมบำรุง',    nameEn: 'Maintenance',      headCount: 28, ewaEnrolled: 22 },
    { id: 'dept-hr',         name: 'ฝ่ายบุคคล',    nameEn: 'Human Resources',  headCount: 12, ewaEnrolled: 8 },
  ],
  hrUsers: [
    { id: 'HR-001', name: 'สมศรี ใจดี',      nameEn: 'Somsri Jaidee',      email: 'somsri@payday.com',  role: 'hr_manager' as const, department: 'ฝ่ายบุคคล' },
    { id: 'HR-002', name: 'วิภา บัญชีดี',     nameEn: 'Wipa Bancheedee',    email: 'wipa@payday.com',    role: 'accountant' as const, department: 'การเงิน' },
    { id: 'HR-003', name: 'ประวิทย์ ดูแล',     nameEn: 'Prawit Dooal',       email: 'prawit@payday.com',  role: 'viewer' as const,     department: 'ฝ่ายบุคคล' },
  ],
  employees: [
    // 5 named monthly employees, mirror the spec
    { id: 'EMP-0041', name: 'สมชาย วงศ์ดี',   department: 'dept-prod-a',     position: 'พนักงานสายการผลิต', startDate: '2021-08-01', employmentType: 'full_time' as const, payCycle: 'monthly' as const, monthlySalary: 18000, standardWorkDays: 22, bankName: 'ธนาคารกสิกรไทย', bankAccountMasked: 'xxx-x-x1234-x' },
    { id: 'EMP-0089', name: 'นภาพร ใจดี',    department: 'dept-warehouse',  position: 'หัวหน้าคลังสินค้า',  startDate: '2019-03-15', employmentType: 'full_time' as const, payCycle: 'monthly' as const, monthlySalary: 24000, standardWorkDays: 22, bankName: 'ธนาคารไทยพาณิชย์', bankAccountMasked: 'xxx-x-x5678-x' },
    { id: 'EMP-0112', name: 'ประเสริฐ มั่นคง', department: 'dept-prod-b',     position: 'ช่างเทคนิค',         startDate: '2020-11-01', employmentType: 'full_time' as const, payCycle: 'monthly' as const, monthlySalary: 20000, standardWorkDays: 22, bankName: 'ธนาคารกรุงไทย',   bankAccountMasked: 'xxx-x-x9012-x' },
    { id: 'EMP-0054', name: 'มาลี สุขสม',     department: 'dept-qc',         position: 'เจ้าหน้าที่ QC',     startDate: '2022-05-20', employmentType: 'full_time' as const, payCycle: 'monthly' as const, monthlySalary: 17000, standardWorkDays: 22, bankName: 'ธนาคารกสิกรไทย', bankAccountMasked: 'xxx-x-x3456-x' },
    { id: 'EMP-0203', name: 'วิชัย ดำรงค์',    department: 'dept-maintenance',position: 'ช่างซ่อมบำรุง',     startDate: '2018-06-10', employmentType: 'full_time' as const, payCycle: 'monthly' as const, monthlySalary: 22000, standardWorkDays: 22, bankName: 'ธนาคารกรุงเทพ',   bankAccountMasked: 'xxx-x-x7890-x' },
    // Weekly employees — 6 records
    { id: 'EMP-0301', name: 'มิน มาเยีย',      department: 'dept-prod-a',     position: 'พนักงานสายการผลิต', startDate: '2023-09-01', employmentType: 'full_time' as const, payCycle: 'weekly'  as const, dailyRate: 420, standardWorkDays: 5,  bankName: 'ธนาคารกสิกรไทย', bankAccountMasked: 'xxx-x-x2222-x' },
    { id: 'EMP-0302', name: 'เมียะ ซอ',        department: 'dept-prod-a',     position: 'พนักงานสายการผลิต', startDate: '2024-01-15', employmentType: 'full_time' as const, payCycle: 'weekly'  as const, dailyRate: 400, standardWorkDays: 5,  bankName: 'ธนาคารกสิกรไทย', bankAccountMasked: 'xxx-x-x3000-x' },
    { id: 'EMP-0303', name: 'ซูซาน ต่าย',     department: 'dept-prod-b',     position: 'พนักงานสายการผลิต', startDate: '2024-01-15', employmentType: 'full_time' as const, payCycle: 'weekly'  as const, dailyRate: 420, standardWorkDays: 5,  bankName: 'ธนาคารกสิกรไทย', bankAccountMasked: 'xxx-x-x3001-x' },
    { id: 'EMP-0304', name: 'ทุน มอ',          department: 'dept-warehouse',  position: 'พนักงานสายการผลิต', startDate: '2024-01-15', employmentType: 'full_time' as const, payCycle: 'weekly'  as const, dailyRate: 440, standardWorkDays: 5,  bankName: 'ธนาคารกสิกรไทย', bankAccountMasked: 'xxx-x-x3002-x' },
    { id: 'EMP-0305', name: 'ฉ่วย ลิน',       department: 'dept-prod-a',     position: 'พนักงานสายการผลิต', startDate: '2024-01-15', employmentType: 'full_time' as const, payCycle: 'weekly'  as const, dailyRate: 460, standardWorkDays: 5,  bankName: 'ธนาคารกสิกรไทย', bankAccountMasked: 'xxx-x-x3003-x' },
    { id: 'EMP-0306', name: 'อองมิน',          department: 'dept-prod-b',     position: 'พนักงานสายการผลิต', startDate: '2024-01-15', employmentType: 'full_time' as const, payCycle: 'weekly'  as const, dailyRate: 480, standardWorkDays: 5,  bankName: 'ธนาคารกสิกรไทย', bankAccountMasked: 'xxx-x-x3004-x' },
  ],
  // Pre-set currentPeriod snapshots so seed:demo requests pass rule checks immediately
  // Engineer note: the seeder will stamp this after creating each employee
  currentPeriods: {
    'EMP-0041': { workedDays: 18, totalWorkDays: 22, previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-0089': { workedDays: 18, totalWorkDays: 22, previousEWAThisPeriod: 5000, usedRequests: 1 },
    'EMP-0112': { workedDays: 18, totalWorkDays: 22, previousEWAThisPeriod: 8000, usedRequests: 2 },
    'EMP-0054': { workedDays: 18, totalWorkDays: 22, previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-0203': { workedDays: 18, totalWorkDays: 22, previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-0301': { workedDays: 4,  totalWorkDays: 5,  previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-0302': { workedDays: 4,  totalWorkDays: 5,  previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-0303': { workedDays: 4,  totalWorkDays: 5,  previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-0304': { workedDays: 4,  totalWorkDays: 5,  previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-0305': { workedDays: 4,  totalWorkDays: 5,  previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-0306': { workedDays: 4,  totalWorkDays: 5,  previousEWAThisPeriod: 0, usedRequests: 0 },
  } as Record<string, { workedDays: number; totalWorkDays: number; previousEWAThisPeriod: number; usedRequests: number }>,
  // 8 sample requests across mixed statuses
  requests: [
    { employeeId: 'EMP-0041', requestedAmount: 3000, reason: 'ค่ารักษาพยาบาล',  status: 'pending'   as const },
    { employeeId: 'EMP-0089', requestedAmount: 5000, reason: 'ค่าใช้จ่ายในบ้าน', status: 'approved'  as const },
    { employeeId: 'EMP-0112', requestedAmount: 2000, reason: 'ค่าใช้จ่ายฉุกเฉิน', status: 'disbursed' as const },
    { employeeId: 'EMP-0054', requestedAmount: 8000, reason: 'อื่นๆ',           status: 'rejected'  as const, rejectionReason: 'จำนวนที่ขอเกินกว่าวงเงิน' },
    { employeeId: 'EMP-0203', requestedAmount: 4500, reason: 'ค่าเล่าเรียนบุตร',  status: 'pending'   as const },
    { employeeId: 'EMP-0301', requestedAmount: 800,  reason: 'ค่าเดินทาง',       status: 'approved'  as const },
    { employeeId: 'EMP-0302', requestedAmount: 700,  reason: 'ค่ารักษาพยาบาล',  status: 'disbursed' as const },
    { employeeId: 'EMP-0303', requestedAmount: 600,  reason: 'อื่นๆ',           status: 'pending'   as const },
  ],
};
```

- [ ] **Step 2: Data file for COMP-002 (smaller English-name dataset)**

```ts
// backend/src/db/seed/data/comp-002-data.ts
export const COMP_002 = {
  company: { id: 'COMP-002', name: 'Acme Manufacturing', nameEn: 'Acme Manufacturing', code: 'ACME' },
  departments: [
    { id: 'dept-assembly', name: 'Assembly', nameEn: 'Assembly', headCount: 40, ewaEnrolled: 30 },
    { id: 'dept-shipping', name: 'Shipping', nameEn: 'Shipping', headCount: 20, ewaEnrolled: 15 },
    { id: 'dept-admin',    name: 'Admin',    nameEn: 'Admin',    headCount: 10, ewaEnrolled: 5  },
  ],
  hrUsers: [
    { id: 'HR-101', name: 'Jane Smith',  email: 'jane@acme.com',  role: 'hr_manager' as const, department: 'Admin' },
    { id: 'HR-102', name: 'Bob Johnson', email: 'bob@acme.com',   role: 'accountant' as const, department: 'Admin' },
  ],
  employees: [
    { id: 'EMP-1001', name: 'Alice Williams', department: 'dept-assembly', position: 'Operator',  startDate: '2022-01-10', employmentType: 'full_time' as const, payCycle: 'monthly' as const, monthlySalary: 22000, standardWorkDays: 22, bankName: 'Acme Bank', bankAccountMasked: 'xxx-x-x4001-x' },
    { id: 'EMP-1002', name: 'David Brown',    department: 'dept-assembly', position: 'Operator',  startDate: '2021-06-12', employmentType: 'full_time' as const, payCycle: 'monthly' as const, monthlySalary: 21000, standardWorkDays: 22, bankName: 'Acme Bank', bankAccountMasked: 'xxx-x-x4002-x' },
    { id: 'EMP-1003', name: 'Eve Davis',      department: 'dept-shipping', position: 'Packer',    startDate: '2023-03-01', employmentType: 'full_time' as const, payCycle: 'monthly' as const, monthlySalary: 19000, standardWorkDays: 22, bankName: 'Acme Bank', bankAccountMasked: 'xxx-x-x4003-x' },
    { id: 'EMP-1004', name: 'Frank Miller',   department: 'dept-shipping', position: 'Driver',    startDate: '2020-09-15', employmentType: 'full_time' as const, payCycle: 'weekly'  as const, dailyRate: 500,    standardWorkDays: 5,  bankName: 'Acme Bank', bankAccountMasked: 'xxx-x-x4004-x' },
    { id: 'EMP-1005', name: 'Grace Lee',      department: 'dept-admin',    position: 'Clerk',     startDate: '2024-02-01', employmentType: 'full_time' as const, payCycle: 'monthly' as const, monthlySalary: 18000, standardWorkDays: 22, bankName: 'Acme Bank', bankAccountMasked: 'xxx-x-x4005-x' },
    { id: 'EMP-1006', name: 'Henry Wilson',   department: 'dept-assembly', position: 'Operator',  startDate: '2024-04-05', employmentType: 'full_time' as const, payCycle: 'weekly'  as const, dailyRate: 480,    standardWorkDays: 5,  bankName: 'Acme Bank', bankAccountMasked: 'xxx-x-x4006-x' },
    { id: 'EMP-1007', name: 'Ivy Moore',      department: 'dept-shipping', position: 'Packer',    startDate: '2023-11-12', employmentType: 'full_time' as const, payCycle: 'monthly' as const, monthlySalary: 20000, standardWorkDays: 22, bankName: 'Acme Bank', bankAccountMasked: 'xxx-x-x4007-x' },
    { id: 'EMP-1008', name: 'Jack Taylor',    department: 'dept-admin',    position: 'Accountant',startDate: '2019-07-22', employmentType: 'full_time' as const, payCycle: 'monthly' as const, monthlySalary: 26000, standardWorkDays: 22, bankName: 'Acme Bank', bankAccountMasked: 'xxx-x-x4008-x' },
  ],
  currentPeriods: {
    'EMP-1001': { workedDays: 18, totalWorkDays: 22, previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-1002': { workedDays: 18, totalWorkDays: 22, previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-1003': { workedDays: 18, totalWorkDays: 22, previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-1004': { workedDays: 4,  totalWorkDays: 5,  previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-1005': { workedDays: 18, totalWorkDays: 22, previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-1006': { workedDays: 4,  totalWorkDays: 5,  previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-1007': { workedDays: 18, totalWorkDays: 22, previousEWAThisPeriod: 0, usedRequests: 0 },
    'EMP-1008': { workedDays: 18, totalWorkDays: 22, previousEWAThisPeriod: 0, usedRequests: 0 },
  } as Record<string, { workedDays: number; totalWorkDays: number; previousEWAThisPeriod: number; usedRequests: number }>,
  requests: [
    { employeeId: 'EMP-1001', requestedAmount: 3500, reason: 'Medical',  status: 'pending'   as const },
    { employeeId: 'EMP-1002', requestedAmount: 2000, reason: 'Home',     status: 'approved'  as const },
    { employeeId: 'EMP-1003', requestedAmount: 1500, reason: 'School',   status: 'disbursed' as const },
    { employeeId: 'EMP-1005', requestedAmount: 4500, reason: 'Family',   status: 'rejected'  as const, rejectionReason: 'Over policy threshold' },
  ],
};
```

- [ ] **Step 3: Demo seed entry point**

```ts
// backend/src/db/seed/seed-demo.ts
import 'reflect-metadata';
import dayjs from 'dayjs';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { SeedService } from './seed.service';
import { COMP_001 } from './data/comp-001-data';
import { COMP_002 } from './data/comp-002-data';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { EWARequest } from '../../modules/requests/entities/ewa-request.entity';

async function seedCompany(seed: SeedService, data: typeof COMP_001 | typeof COMP_002, log: Logger) {
  await seed.companies.create(data.company);
  for (const d of data.departments) await seed.departments.create(data.company.id, d);
  for (const h of data.hrUsers) await seed.hrUsers.create(data.company.id, h);

  // Attach department name from the lookup
  const deptNameMap = new Map(data.departments.map(d => [d.id, d.name]));
  for (const e of data.employees) {
    await seed.employees.create(data.company.id, { ...e, departmentName: deptNameMap.get(e.department) });
  }

  // Stamp currentPeriod snapshots directly on the Employee rows
  const empRepo = seed.employees['repo']; // (POC shortcut — same pattern used in RequestsService)
  for (const [empId, snap] of Object.entries(data.currentPeriods)) {
    const e = await empRepo.findOne({ where: { id: empId, companyId: data.company.id } });
    if (!e) continue;
    e.currentPeriod = {
      label: dayjs().format('MMM YYYY'),
      startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
      payDate: dayjs().endOf('month').format('YYYY-MM-DD'),
      cutoffDate: dayjs().startOf('month').date(25).format('YYYY-MM-DD'),
      workedDays: snap.workedDays,
      totalWorkDays: snap.totalWorkDays,
      earnedToDate: 0, // recomputed by RequestsService.snapshot
      previousEWAThisPeriod: snap.previousEWAThisPeriod,
      maxWithdrawable: 0,
      usedRequests: snap.usedRequests,
      remainingRequests: Math.max(0, 2 - snap.usedRequests),
    };
    await empRepo.save(e);
  }

  // Create requests; let business rules run, then patch status if seed wants approved/rejected/disbursed
  const reqRepo = (seed.requests as unknown as { repo: { save: (r: EWARequest) => Promise<EWARequest> } }).repo;
  for (const r of data.requests) {
    const created = await seed.requests.create(data.company.id, {
      employeeId: r.employeeId,
      requestedAmount: r.requestedAmount,
      reason: r.reason,
    }, seed.systemActor);

    if (r.status !== 'pending' && r.status !== 'approved') {
      // Force the seeded final status via direct save (auto-approve may have already approved low amounts)
      const row = await reqRepo.save({
        ...created,
        status: r.status,
        rejectionReason: 'rejectionReason' in r ? r.rejectionReason : null,
        reviewedBy: 'HR-001',
        reviewedById: 'HR-001',
        reviewedAt: new Date(),
        disbursedAt: r.status === 'disbursed' ? new Date() : null,
      } as unknown as EWARequest);
      log.log(`forced status ${created.id} → ${row.status}`);
    }
  }

  log.log(`seeded ${data.company.id}: ${data.departments.length} depts, ${data.hrUsers.length} hr, ${data.employees.length} emp, ${data.requests.length} req`);
}

async function main() {
  const log = new Logger('seed:demo');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const seed = app.get(SeedService);
  await seed.truncateAll();
  await seedCompany(seed, COMP_001, log);
  await seedCompany(seed, COMP_002, log);
  await app.close();
  log.log('seed:demo complete');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
```

Note: `seed.requests` exposes a private `repo` only because we accept the shortcut from RequestsService. If you'd rather keep public surface clean, add a `saveRaw(r: EWARequest)` method on `RequestsService` and call it here.

- [ ] **Step 4: Register SeedModule in AppModule**

Add `SeedModule` to `app.module.ts` `imports`.

- [ ] **Step 5: npm script**

Add to `backend/package.json` `scripts`:

```json
"seed:demo": "ts-node -r tsconfig-paths/register src/db/seed/seed-demo.ts"
```

Install ts-node helpers:

```bash
npm install -D tsconfig-paths
```

- [ ] **Step 6: Run end-to-end**

```bash
npm run db:reset
# Start app once to run migrations, then stop:
npm run start:dev   # let it boot, see "Migration ... has been executed", then Ctrl+C
npm run seed:demo
```

Expected: seed logs `seeded COMP-001: 6 depts, 3 hr, 11 emp, 8 req` and similar for COMP-002, then `seed:demo complete`.

```bash
npm run start:dev
curl -s http://localhost:3001/companies | head
curl -s http://localhost:3001/employees -H 'x-company-id: COMP-001' | head
curl -s http://localhost:3001/requests -H 'x-company-id: COMP-001' | head
```

Expected: COMP-001 shows 11 employees and 8 requests with mixed statuses.

- [ ] **Step 7: Commit**

```bash
git add backend/src/db/seed backend/package.json backend/package-lock.json
git commit -m "feat(backend): seed:demo with COMP-001 (Thai mocks) + COMP-002 (English)"
```

---

### Task 8.3: `seed:bulk` — faker volume seeder

**Files:**
- Create: `backend/src/db/seed/seed-bulk.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: Seed-bulk entry point**

```ts
// backend/src/db/seed/seed-bulk.ts
import 'reflect-metadata';
import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { SeedService } from './seed.service';
import { generateCompanyId } from '../../ewa/ids/id-generators';

async function main() {
  const log = new Logger('seed:bulk');
  const numCompanies = Number(process.env.SEED_COMPANIES ?? 3);
  const empPerCompany = Number(process.env.SEED_EMPLOYEES_PER_COMPANY ?? 200);
  const months = Number(process.env.SEED_MONTHS ?? 12);
  const reqPerEmpMonth = Number(process.env.SEED_REQUESTS_PER_EMPLOYEE_PER_MONTH ?? 2);

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const seed = app.get(SeedService);
  await seed.truncateAll();

  for (let c = 1; c <= numCompanies; c += 1) {
    const companyId = generateCompanyId(c);
    await seed.companies.create({ id: companyId, name: `${faker.company.name()} Co.`, code: companyId });

    const deptCount = 4;
    const depts: string[] = [];
    for (let d = 0; d < deptCount; d += 1) {
      const did = `dept-${companyId}-${d}`;
      depts.push(did);
      await seed.departments.create(companyId, { id: did, name: faker.commerce.department(), headCount: 20 + d * 5 });
    }

    for (let h = 0; h < 3; h += 1) {
      const hid = `HR-${companyId}-${h}`;
      await seed.hrUsers.create(companyId, {
        id: hid, name: faker.person.fullName(), email: `${hid.toLowerCase()}@example.com`,
        role: h === 0 ? 'hr_manager' : h === 1 ? 'accountant' : 'viewer',
      });
    }

    for (let e = 0; e < empPerCompany; e += 1) {
      const eid = `EMP-${companyId}-${e.toString().padStart(4, '0')}`;
      const cycle: 'monthly' | 'weekly' = e % 4 === 0 ? 'weekly' : 'monthly';
      await seed.employees.create(companyId, {
        id: eid,
        name: faker.person.fullName(),
        department: depts[e % depts.length],
        startDate: dayjs(faker.date.past({ years: 3 })).format('YYYY-MM-DD'),
        employmentType: 'full_time',
        payCycle: cycle,
        monthlySalary: cycle === 'monthly' ? 15000 + faker.number.int({ min: 0, max: 15000 }) : undefined,
        dailyRate: cycle === 'weekly' ? 380 + faker.number.int({ min: 0, max: 200 }) : undefined,
        standardWorkDays: cycle === 'monthly' ? 22 : 5,
      });
    }

    // Generate requests
    const empRepo = (seed.employees as unknown as { repo: { find: () => Promise<unknown[]> } }).repo;
    const employees = (await empRepo.find()) as Array<{ id: string; companyId: string; payCycle: 'monthly' | 'weekly' }>;
    for (const emp of employees.filter(x => x.companyId === companyId)) {
      for (let m = 0; m < months; m += 1) {
        for (let i = 0; i < reqPerEmpMonth; i += 1) {
          const amount = emp.payCycle === 'monthly' ? faker.number.int({ min: 800, max: 6000 }) : faker.number.int({ min: 300, max: 1500 });
          try {
            await seed.requests.create(companyId, {
              employeeId: emp.id,
              requestedAmount: amount,
              reason: faker.helpers.arrayElement(['Medical', 'Family', 'School', 'Emergency', 'Other']),
            }, seed.systemActor);
          } catch {
            // ignore rule violations (e.g. quota exhausted) — that's the point of testing
          }
        }
      }
    }

    log.log(`seeded ${companyId} with ${empPerCompany} employees, ~${empPerCompany * months * reqPerEmpMonth} request attempts`);
  }

  await app.close();
  log.log('seed:bulk complete');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: npm script**

Add to `backend/package.json`:

```json
"seed:bulk": "ts-node -r tsconfig-paths/register src/db/seed/seed-bulk.ts"
```

- [ ] **Step 3: Smoke (small numbers to keep it fast)**

```bash
npm run db:reset
npm run start:dev   # let migrations run, Ctrl+C
SEED_COMPANIES=2 SEED_EMPLOYEES_PER_COMPANY=20 SEED_MONTHS=2 SEED_REQUESTS_PER_EMPLOYEE_PER_MONTH=1 \
  npm run seed:bulk
```

Expected: 2 companies created, 20 employees each, ~40 request attempts each. Some will be rejected by quota rules — that's expected and logged silently.

- [ ] **Step 4: Commit**

```bash
git add backend/src/db/seed/seed-bulk.ts backend/package.json
git commit -m "feat(backend): seed:bulk (faker-driven volume seeder)"
```

---

## Phase 8 checkpoint

- `npm run seed:demo` produces a fully-populated 2-company demo
- `npm run seed:bulk` produces faker data sized by env vars
- Both seeders go through real services so business rules execute

---

## Phase 9 — Polish (README, fresh script, final review)

**Outcome:** README explains setup in one paragraph and one command. `npm run fresh` chains reset + migrate + seed:demo. Final smoke run from a clean checkout proves the POC works end-to-end.

---

### Task 9.1: `fresh` script + final npm scripts pass

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Add the `fresh` script**

In `backend/package.json` `scripts`, ensure all these are present:

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main.js",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "db:reset": "rm -f data/payday.db",
    "db:migrate": "typeorm-ts-node-commonjs migration:run -d src/db/data-source.ts",
    "db:revert": "typeorm-ts-node-commonjs migration:revert -d src/db/data-source.ts",
    "seed:demo": "ts-node -r tsconfig-paths/register src/db/seed/seed-demo.ts",
    "seed:bulk": "ts-node -r tsconfig-paths/register src/db/seed/seed-bulk.ts",
    "fresh": "npm run db:reset && npm run db:migrate && npm run seed:demo"
  }
}
```

- [ ] **Step 2: Verify the chain**

```bash
npm run fresh
```

Expected: deletes the DB, runs every migration top to bottom, seeds 2 companies. Final log line is `seed:demo complete`.

- [ ] **Step 3: Commit**

```bash
git add backend/package.json
git commit -m "chore(backend): add 'fresh' script (reset + migrate + seed:demo)"
```

---

### Task 9.2: README

**Files:**
- Create: `backend/README.md`

- [ ] **Step 1: Write README**

```markdown
# PayDay+ Backend POC

NestJS backend that mirrors the PayDay+ data model and exposes every domain operation through Swagger UI. Built as a proof-of-concept; not production code. Read the design spec at `../docs/superpowers/specs/2026-05-11-nestjs-backend-poc-design.md` and the implementation plan at `../docs/superpowers/plans/2026-05-11-nestjs-backend-poc.md` before changing anything substantial.

## Quick start

```bash
cd backend
cp .env.example .env
npm install
npm run fresh        # reset DB + run migrations + seed 2 demo companies
npm run start:dev    # Nest on http://localhost:3001
```

Open Swagger UI: http://localhost:3001/docs

In the **Authorize** panel, set:
- `x-company-id`: `COMP-001` (Thai mocks) or `COMP-002` (English Acme)
- `x-actor-id` (optional): `HR-001` for Thai HR Manager, `EMP-0041` for a sample employee

Exercise any endpoint. To switch companies, change the header in **Authorize** and re-fire.

## What's seeded

`COMP-001` "โรงงานไทยดี จำกัด" — mirrors the data in `data-model.md`:
- 6 departments
- 3 HR users (HR-001 manager, HR-002 accountant, HR-003 viewer)
- 11 employees (5 monthly, 6 weekly)
- 8 EWA requests across mixed statuses
- Default monthly + weekly EWA policies + notification settings

`COMP-002` "Acme Manufacturing" — smaller English-name dataset for testing the company selector and isolation:
- 3 departments
- 2 HR users
- 8 employees
- 4 EWA requests

## Multi-company hard isolation

Every domain endpoint requires `x-company-id`. The `TenantInterceptor` rejects unknown or inactive companies with 404. The `ActorInterceptor` rejects an `x-actor-id` whose company doesn't match `x-company-id` with 403. Repository operations are scoped to `companyId` via the `CompanyScopedRepository` base, so it's not possible to read or write data across companies even if a controller forgets the filter.

## Layered EWA rules

Each company has two policy rows (monthly + weekly) in `app_settings.ewaMonthlyPolicy` / `ewaWeeklyPolicy`. Each employee has six nullable override columns:
- `ewaEnabledOverride`, `ewaEligibilityOverride`
- `ewaMaxPercentOverride`, `ewaMaxRequestsOverride`
- `ewaMinAmountOverride`, `ewaMaxAmountOverride`

`null` means "inherit from company policy". Any non-null value wins. The resolved policy and per-field provenance is exposed at `GET /employees/:id/effective-policy` — the demo endpoint that shows the override system working.

## LINE module

- `POST /line/push` — send a message; uses the real Messaging API when `LINE_CHANNEL_ACCESS_TOKEN` is set, otherwise logs to the console
- `POST /line/notify/request-status` — convenience: load a request, render a status text/Flex message, push it
- `POST /line/webhook` — public; verifies signature when `LINE_CHANNEL_SECRET` is set, accepts events without signature when not (logs a warning at boot)
- `GET/PUT /line/richmenu` — in-memory rich menu config per company

## Bulk seeder (for pagination/report testing)

```bash
SEED_COMPANIES=3 SEED_EMPLOYEES_PER_COMPANY=200 \
SEED_MONTHS=12 SEED_REQUESTS_PER_EMPLOYEE_PER_MONTH=2 \
  npm run seed:bulk
```

Generates faker data; some requests will be silently dropped due to quota/cutoff/blackout rules — that's the point.

## Error codes

Business-rule failures return HTTP 422 with one of:
`EWA_OVER_LIMIT`, `EWA_BELOW_MIN`, `EWA_OUTSIDE_CUTOFF`, `EWA_QUOTA_EXHAUSTED`, `EWA_BLACKOUT_DATE`, `EWA_EMPLOYEE_SUSPENDED`, `EWA_EWA_DISABLED`, `EWA_INVALID_AMOUNT`, `EWA_INVALID_TRANSITION`. Full list rendered in the Swagger description block.

## Module map

| Tag | Routes | Notes |
|---|---|---|
| `health` | `GET /health` | Public liveness check |
| `companies` | `/companies/*` | Public list/get/create; PATCH requires matching company |
| `hr-users` | `/hr-users/*` | CRUD; soft-delete sets `isActive=false` |
| `departments` | `/departments/*` | CRUD |
| `employees` | `/employees/*` + overrides + effective-policy + current-period | Soft-delete |
| `payroll-cycles` | `/payroll-cycles/*` | 2 rows per company (monthly + weekly) |
| `settings` | `/settings/*` + policy editor | per-company AppSettings |
| `requests` | `/requests/*` + preview + on-behalf + approve/reject/disburse | EWA lifecycle |
| `notifications` | `/notifications/*` + read-state | |
| `bank-transfers` | `/bank-transfers/*` + batch/settle/retry | |
| `audit-logs` | `/audit-logs/*` | Read-only |
| `line` | `/line/push`, `/line/notify/request-status`, `/line/webhook`, `/line/richmenu` | Real/stub switch on env |
```

- [ ] **Step 2: Commit**

```bash
git add backend/README.md
git commit -m "docs(backend): README — quick start, multi-company, EWA overrides, LINE switch"
```

---

### Task 9.3: Final smoke run + plan checkpoint

- [ ] **Step 1: Run the full clean-slate flow**

```bash
cd backend
rm -rf data dist
npm run fresh
npm run start:dev
```

- [ ] **Step 2: Walk the demo**

In Swagger UI at http://localhost:3001/docs:
1. **companies** → `GET /companies` → see COMP-001 and COMP-002 (no auth)
2. **Authorize** → set `x-company-id: COMP-001`, `x-actor-id: HR-001`
3. **employees** → `GET /employees/EMP-0041/effective-policy` → confirm resolved policy + provenance
4. **employees** → `PATCH /employees/EMP-0041/ewa-overrides` body `{"ewaMaxPercent":40}` → confirm override
5. **employees** → `GET /employees/EMP-0041/effective-policy` → confirm `effective.maxPercent=40` and `source.maxPercent="employee"`
6. **requests** → `POST /requests/preview` body `{"employeeId":"EMP-0041","requestedAmount":3000}` → returns `valid:true` (or specific rule-error code)
7. **requests** → `POST /requests` body `{"employeeId":"EMP-0041","requestedAmount":1000,"reason":"x"}` → auto-approves under threshold
8. **requests** → `POST /requests/{ID}/approve` body `{}` (the existing pending request) with `x-actor-id: HR-001` → succeeds
9. **requests** → `POST /requests/{ID}/disburse` body `{}` → status moves to `disbursed`
10. **bank-transfers** → `GET /bank-transfers` → see the auto-created transfer row
11. **audit-logs** → `GET /audit-logs` → see all operations recorded
12. **Authorize** → change `x-company-id` to `COMP-002` → confirm only Acme data appears
13. **employees** → `GET /employees/EMP-0041` with `x-company-id: COMP-002` → 404 (hard isolation works)
14. **line** → `POST /line/push` body `{"to":"U1","messages":[{"type":"text","text":"hi"}]}` → backend logs `[LINE STUB]`
15. **line** → `POST /line/webhook` body `{"events":[{"type":"follow","source":{"userId":"U1"}}]}` → 200, backend logs `event=follow`

- [ ] **Step 3: If anything fails the demo above, fix it and add a follow-up task here. If everything passes, no further commits needed.**

---

## Phase 9 checkpoint — DONE

- README written and committed
- `npm run fresh` is the one-liner from clean checkout
- Full demo walks end-to-end through Swagger
- All 11 modules + LINE live
- Multi-company isolation verified by switching headers
- Per-employee EWA overrides verified via the effective-policy endpoint

---

# Spec coverage matrix

Sanity check that every section in the spec is covered by at least one task.

| Spec section | Implementing task(s) |
|---|---|
| §1 Goal — full system, multi-company, layered rules | Phases 2, 3, 4 (overrides) |
| §2.1 NestJS 10 + TS | Task 0.1 |
| §2.2 SQLite (better-sqlite3) | Task 0.2, 0.3 |
| §2.3 TypeORM 0.3 | Task 0.2, 0.3 |
| §2.4 backend/ folder | Task 0.1 |
| §2.5 Hybrid auth | Tasks 1.3, 4.6 |
| §2.6 LINE real/stub | Task 7.1, 7.2 |
| §2.7 Two seeders | Tasks 8.2, 8.3 |
| §2.8 No automated tests | (skipped intentionally) |
| §2.9 Architecture C — module-per-entity + EwaRulesService | Task 4.2 + every module task |
| §2.10 Multi-company hard isolation | Tasks 1.3, 1.4, 2.2, 4.6 |
| §3 Stack & runtime | Tasks 0.2–0.5 |
| §4 Folder layout | Tasks 0.1, 0.3, 1.x, 2.x onwards |
| §5.1 ID strategy | Task 1.7 + per-entity tasks |
| §5.2 Entities table | Tasks 1.5 (audit), 2.1 (company), 2.3 (dept), 2.4 (hr), 3.1 (cycles), 3.2 (settings), 4.1 (employee), 5.1 (request), 6.1 (notification), 6.2 (bank-transfer) |
| §5.3 Override fields nullable | Task 4.1 |
| §5.4 EffectivePolicyService + provenance | Task 4.2, 4.5 |
| §6 endpoints (all 11 modules) | Phases 2–7 |
| §7.1 Tenant + actor model | Tasks 1.3, 2.2, 4.6 |
| §7.2 Validation pipe | Task 0.4 |
| §7.3 Error format + EWA codes | Task 1.2 |
| §7.4 Audit interceptor | Task 1.6 |
| §7.5 Swagger setup | Task 0.4 |
| §7.6 LINE real/stub switch | Task 7.1 |
| §8.1 EwaRulesService | Task 4.2 |
| §8.2 RequestStateMachine | Task 5.2 |
| §8.3 Request creation flow | Task 5.3 |
| §9 Seed strategy (demo + bulk) | Tasks 8.1, 8.2, 8.3 |
| §10 Local dev workflow | Tasks 9.1, 9.2 |
| §11 Non-goals | (intentionally not implemented) |
| §12 Open questions | Resolved in plan choices: incremental migrations (Phase 1+), `@DeleteDateColumn` for Employee + `isActive` for HR/Company, baht as integer, POST /companies bootstraps cycles + settings (Task 3.3) |

No spec gap.

---

# Glossary of cross-task references

These names appear across multiple tasks; double-check naming when reading any single task in isolation:

| Name | Defined in | Used in |
|---|---|---|
| `HEADER_COMPANY_ID` constant | Task 1.1 | Tasks 1.3, 0.4 |
| `HEADER_ACTOR_ID` constant | Task 1.1 | Tasks 1.3, 0.4 |
| `PUBLIC_ROUTES_KEY` constant | Task 1.1 | Tasks 1.3, 7.2 |
| `Public` decorator | Task 1.3 | Tasks 0.5, 2.1, 7.2 |
| `CurrentCompany` decorator | Task 1.3 | Tasks 2.3, 2.4, 3.1, 3.2, 4.3, 5.3, 6.x, 7.2 |
| `CurrentActor` decorator | Task 1.3 | Tasks 3.2, 4.3, 5.3, 6.x |
| `TenantContext` type | Task 1.3 | All controllers |
| `ActorContext` type | Task 1.3 | Task 5.3, 7.2 |
| `CompanyScopedRepository<T>` | Task 1.4 | Tasks 2.3, 2.4, 4.3 |
| `AuditLog` entity | Task 1.5 | Tasks 1.6, 6.3 |
| `AuditService` | Task 1.6 | Task 1.6 (via `@Audited`) |
| `Audited` decorator | Task 1.6 | Tasks 3.2, 4.3, 4.4, 5.3, 6.2 |
| `EwaRuleError` + codes | Task 1.2 | Tasks 4.2, 5.2 |
| `EwaRulesService` | Task 4.2 | Tasks 5.3, 4.5 |
| `EffectivePolicyService` | Task 4.2 | Tasks 4.5, 5.3 |
| `RequestStateMachine.assertTransition` | Task 5.2 | Task 5.3 |
| `LINE_CLIENT` token | Task 7.1 | Task 7.2 |
| `SeedService` | Task 8.1 | Tasks 8.2, 8.3 |

---

# How to use this plan

1. Pick a task. Read the whole task, including all "Step N" entries, before starting.
2. Each step ends with either `npm run build` (must exit 0) or a `curl` call (must produce the documented output). If anything diverges, stop and figure out why before moving on.
3. Commits are per-task, not per-step. Use the suggested commit message verbatim.
4. If a task introduces a TS error in code from an earlier task, that's a bug in the plan — patch the earlier task's snippet and call it out in the commit message.
5. Phase checkpoints summarize what should be working at the end of each phase. If a checkpoint doesn't pass, do not move to the next phase.

# AGENTS.md

## Project Shape
- Single NestJS starter app. Main entrypoints are `src/main.ts` and `src/app.module.ts`.
- This repository is a backend cascaron for new projects with JWT auth, RBAC, optional API credentials, Prisma and PostgreSQL.
- Current source modules are `auth`, `users`, `prisma`, `common`, and `config`.
- Auth/RBAC state lives in Postgres via Prisma: `users`, `roles`, `permissions`, `role_permissions`, `api_credentials`, `refresh_tokens`, and `audit_logs`.
- Domain/business modules should be added as new feature modules under `src/` and imported from `src/app.module.ts`.
- `Diagrama-ER.png` documents the current base schema. `Diagrama-ER-original.png` preserves the previous production ERD before this repo was converted into a starter.
- `AuditInterceptor` exists, but it is not registered globally by default. The `audit_logs` table is available for projects that choose to enable or wire audit logging.

## Run And Verify
- Use `npm`; `package-lock.json` is the only lockfile.
- Install dependencies with `npm install`.
- Local dev server: `npm run start:dev`.
- Build: `npm run build`.
- Generate Prisma Client: `npm run prisma:generate`.
- Local DB bootstrap order: `npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed`.
- Production migrations: `npm run prisma:migrate:prod`.
- Swagger is served at `http://localhost:${PORT}/${API_PREFIX}/docs`.
- `npm run lint` is destructive because it runs `eslint --fix`.
- Do not rely on `npm test` or `npm run test:e2e` for repo verification today: there are no committed `*.spec.ts` files and no `test/` directory.
- `prisma/schema.prisma` is the schema source of truth; there is no committed migration SQL under `prisma/migrations/`.

## Env And Runtime
- `ConfigModule` only loads `.env`; `.env.example` is a template, not auto-loaded.
- All routes are under `/${API_PREFIX}`; default is `/api/v1`.
- URI versioning is enabled globally, but controllers do not declare versions. Do not guess `/v1/...` route variants beyond the global prefix.
- Security/runtime middleware in `main.ts`: Helmet, compression, cookie-parser, CORS, validation pipe, global exception filter, and global interceptors.
- Successful responses are wrapped as `{ statusCode, message, data, timestamp }` by `TransformInterceptor`.
- Error responses come from `HttpExceptionFilter`, not Nest default error formatting. Error bodies include `statusCode`, `timestamp`, `path`, `method`, `error`, and `message`.
- Winston writes to `logs/error.log` and `logs/combined.log`; `logs/` is gitignored.
- `THROTTLE_TTL`, `THROTTLE_LIMIT`, and `LOG_LEVEL` in `.env.example` are currently informational: throttling and logger setup are hardcoded in code.
- Current CORS `allowedHeaders` are `Content-Type`, `Authorization`, and `X-Requested-With`. Browser clients using `x-api-key` and `x-api-token` may need those headers added to CORS.

## Auth And Authorization
- `AuthModule` registers global `JwtAuthGuard`, `RolesGuard`, and `PermissionsGuard`.
- `AppModule` registers global `ThrottlerGuard`.
- Only `POST /auth/login` and `POST /auth/refresh` are public via `@Public()`.
- Everything else requires Bearer JWT or enabled API credentials.
- Login DTO uses `username`, but the service accepts either username or email.
- Login returns `accessToken`, `refreshToken`, `tokenType`, and `expiresIn`.
- Refresh tokens are persisted in `refresh_tokens`, rotated on refresh, and revoked on logout.
- Seeded bootstrap admin is `admin` / `Admin@123456` (`admin@example.com`).
- Seeded roles are `SUPER_ADMIN`, `ADMIN`, `USER`, and `API_CLIENT`.
- Seeded permissions are currently `read users` and `manage users`.
- `SUPER_ADMIN` receives all seeded permissions. `ADMIN` receives read-only seeded permissions.
- `UsersController` currently exposes only `GET /users/:id`, guarded by `SUPER_ADMIN` and `ADMIN`. Other CRUD routes exist in code but are commented out.
- `API_AUTH_ENABLED=true` enables `x-api-key` and `x-api-token` authentication for external integrations.
- API credential auth first checks hashed DB-backed credentials in `api_credentials`; if no DB match exists, it can fall back to legacy env credentials `API_AUTH_KEY`, `API_AUTH_TOKEN`, and `API_AUTH_USER`.
- `prisma/seed-api-credentials.ts` creates hashed DB-backed API credentials for an existing user and prints the plain key/token once.

## Prisma Model
- Keep auth/base models generic unless a new project explicitly needs domain tables.
- Current schema models: `Role`, `Permission`, `RolePermission`, `User`, `ApiCredential`, `RefreshToken`, and `AuditLog`.
- Current enum: `RoleType`.
- Removed business/SAP models should not be reintroduced unless required by a specific project.

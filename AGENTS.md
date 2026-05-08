# AGENTS.md

## Project Shape
- Single NestJS starter app. Main entrypoints are `src/main.ts` and `src/app.module.ts`.
- This repository is a backend cascaron for new projects with JWT auth, RBAC, API credentials, audit logging, Prisma and PostgreSQL.
- Auth/RBAC state lives in Postgres via Prisma: `users`, `roles`, `permissions`, `role_permissions`, `api_credentials`, `refresh_tokens`, and `audit_logs`.
- Domain/business modules should be added as new feature modules under `src/` and imported from `src/app.module.ts`.
- `Diagrama-ER.png` documents the current base schema. `Diagrama-ER-original.png` preserves the previous production ERD before this repo was converted into a starter.

## Run And Verify
- Use `npm`; `package-lock.json` is the only lockfile.
- Local dev server: `npm run start:dev`.
- Build: `npm run build`.
- Bootstrap local DB in this order: `npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed`.
- Swagger is served at `http://localhost:${PORT}/${API_PREFIX}/docs`.
- `npm run lint` is destructive because it runs `eslint --fix`.
- Do not rely on `npm test` or `npm run test:e2e` for repo verification today: there are no committed `*.spec.ts` files and no `test/` directory.
- `prisma/schema.prisma` is the schema source of truth; there is no committed migration SQL under `prisma/migrations/`.

## Env And Runtime
- `ConfigModule` only loads `.env`; `.env.example` is a template, not auto-loaded.
- All routes are under `/${API_PREFIX}`; default is `/api/v1`.
- URI versioning is enabled globally, but controllers do not declare versions. Do not guess `/v1/...` route variants beyond the global prefix.
- Successful responses are wrapped as `{ statusCode, message, data, timestamp }` by `TransformInterceptor`.
- Error responses come from `HttpExceptionFilter`, not Nest default error formatting.
- Winston writes to `logs/error.log` and `logs/combined.log`; `logs/` is gitignored.
- `THROTTLE_TTL`, `THROTTLE_LIMIT`, and `LOG_LEVEL` in `.env.example` are currently informational: throttling and logger setup are hardcoded in code.

## Auth And Authorization
- Only `POST /auth/login` and `POST /auth/refresh` are public. Everything else requires Bearer JWT or enabled API credentials.
- Login DTO uses `username`, but the service accepts either username or email.
- Seeded bootstrap admin is `admin` / `Admin@123456` (`admin@example.com`).
- Seeded roles are `SUPER_ADMIN`, `ADMIN`, `USER`, and `API_CLIENT`.
- `SUPER_ADMIN` receives all seeded permissions. `ADMIN` receives read-only seeded permissions.
- `API_AUTH_ENABLED=true` enables `x-api-key` and `x-api-token` authentication for external integrations.
- `prisma/seed-api-credentials.ts` creates hashed DB-backed API credentials for an existing user.

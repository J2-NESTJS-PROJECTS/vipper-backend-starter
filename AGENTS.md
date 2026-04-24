# AGENTS.md

## Project Shape
- Single NestJS app only. Main entrypoints are `src/main.ts` and `src/app.module.ts`.
- `README.md` is placeholder text; trust code and config instead.
- Postgres + Prisma store auth/RBAC state only: `users`, `roles`, `permissions`, `refresh_tokens`, `audit_logs`.
- Business data does not come from Prisma. `customers`, `cards`, `transactions`, and `statements` are fetched from SAP RFC via `src/sap/sap.service.ts`.
- Useful module boundaries: `auth` and `users` are local DB-backed; `customers`, `cards`, `transactions`, and `statements` are SAP-backed.

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
- `THROTTLE_TTL`, `THROTTLE_LIMIT`, and `LOG_LEVEL` in `.env.example` are currently misleading: throttling and logger setup are hardcoded in code.

## Auth And Authorization
- Only `POST /auth/login` and `POST /auth/refresh` are public. Everything else requires Bearer JWT.
- Login DTO uses `username`, but the service accepts either username or email.
- Seeded bootstrap admin is `admin` / `Admin@123456` (`admin@example.com`).
- Seeded permission model matters for API testing: `SUPER_ADMIN` gets all seeded permissions, `ADMIN` gets read-only business permissions, and `USER` / `API_CLIENT` get no seeded business permissions.
- `users` endpoints are role-guarded, not permission-guarded: `SUPER_ADMIN` and `ADMIN` can create/list/update/toggle users; only `SUPER_ADMIN` can delete.

## SAP Integration
- SAP-backed endpoints delegate through `SapRfcClientService`; business endpoint testing requires real SAP credentials plus valid SAP identifiers.
- With only local Postgres working, focus verification on `auth` and `users`; SAP-backed endpoints will not be meaningfully testable.
- Current RFC functions used by the app are `ZDATOS_TARJETA`, `ZGET_CUSTOMER_CARDS`, `ZGET_CARD_TRANSACTIONS`, `ZGET_CARD_STATEMENTS`, `ZGET_TRANSACTIONS`, and `ZGET_STATEMENTS`.
- `customerId` handling is intentionally inconsistent in current code: customer lookup sends raw `CEDULA`, while card/transaction/statement calls left-pad customer IDs to 10 digits as `I_KUNNR`.
- If SAP is unreachable, the app may still boot because SAP init failure is swallowed, but SAP-backed requests will fail later with `503` or `502`.

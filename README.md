# NestJS RBAC Starter

Cascaron NestJS para nuevos proyectos backend con autenticacion JWT, RBAC, credenciales API para integraciones externas, auditoria, Prisma y PostgreSQL.

## Caracteristicas

- Auth JWT con access token y refresh token.
- RBAC con roles, permisos y guards globales.
- Autenticacion opcional por `x-api-key` y `x-api-token`.
- Prisma Client con PostgreSQL.
- Swagger bajo `/${API_PREFIX}/docs`.
- Respuestas exitosas estandarizadas con `TransformInterceptor`.
- Manejo centralizado de errores con `HttpExceptionFilter`.
- Logging con Winston.

## Instalacion

```bash
npm install
```

## Configuracion

```bash
cp .env.example .env
```

Actualiza al menos:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGINS`

## Base De Datos

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Usuario bootstrap:

- Username: `admin`
- Email: `admin@example.com`
- Password: `Admin@123456`

## Credenciales API

Para habilitar autenticacion machine-to-machine:

```env
API_AUTH_ENABLED=true
```

Generar credenciales para un usuario existente:

```bash
SEED_API_CREDENTIAL_USER=admin npm run prisma:seed:api-credential
```

Tambien puedes definir tus propios valores:

```bash
SEED_API_CREDENTIAL_USER=admin SEED_API_CREDENTIAL_NAME="External Integration" SEED_API_CREDENTIAL_KEY="my_key" SEED_API_CREDENTIAL_TOKEN="my_token" npm run prisma:seed:api-credential
```

## Desarrollo

```bash
npm run start:dev
```

## Build

```bash
npm run build
```

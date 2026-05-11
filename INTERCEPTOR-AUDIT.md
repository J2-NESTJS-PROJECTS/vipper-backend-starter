# Interceptors

Este cascaron incluye interceptors para estandarizar respuestas, logging y auditoria opcional.

## Interceptors Activos

En `src/main.ts` estan registrados globalmente:

```ts
app.useGlobalInterceptors(
  new LoggingInterceptor(),
  new TransformInterceptor(),
);
```

`LoggingInterceptor` registra informacion basica de requests/responses.

`TransformInterceptor` envuelve respuestas exitosas con el formato:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2026-05-11T00:00:00.000Z"
}
```

Los errores no pasan por `TransformInterceptor`; se formatean con `HttpExceptionFilter`.

## AuditInterceptor

`AuditInterceptor` existe en:

```txt
src/common/interceptors/audit.interceptor.ts
```

No esta activo por defecto. Se debe habilitar explicitamente cuando un proyecto necesite auditoria.

El interceptor escribe en la tabla `audit_logs` definida en `prisma/schema.prisma`.

Campos que registra:

- `userId`: usuario autenticado, si existe.
- `action`: accion auditada.
- `resource`: recurso auditado.
- `resourceId`: identificador del recurso, si se puede resolver.
- `oldValues`: payload de entrada sanitizado, si se configura.
- `newValues`: respuesta sanitizada, si se configura.
- `ipAddress`: IP del request.
- `userAgent`: user-agent del cliente.
- `statusCode`: codigo HTTP exitoso o de error.

El interceptor no rompe la respuesta si falla la escritura en auditoria. En ese caso solo registra un `warn` en logs.

## Decorator @Audit

El decorator esta en:

```txt
src/common/decorators/audit.decorator.ts
```

Permite configurar metadata por controller o endpoint:

```ts
@Audit({
  action: 'update',
  resource: 'users',
  resourceIdParam: 'id',
  captureRequestBody: true,
})
```

Opciones disponibles:

- `action`: nombre de accion. Si no se define, usa el metodo HTTP en minusculas.
- `resource`: nombre del recurso. Si no se define, se infiere desde la URL.
- `resourceIdParam`: toma el id desde `request.params`.
- `resourceIdBodyField`: toma el id desde `request.body`.
- `resourceIdResponseField`: toma el id desde la respuesta del handler.
- `captureRequestBody`: guarda el body sanitizado en `oldValues`.
- `captureResponseBody`: guarda la respuesta sanitizada en `newValues`.

Los paths de id soportan notacion simple o con punto, por ejemplo `user.id`.

## Sanitizacion

Antes de guardar `oldValues` o `newValues`, el interceptor redacta campos sensibles:

- `authorization`
- `cookie`
- `password`
- `token`
- `accessToken`
- `refreshToken`
- `apiKey`
- `apiToken`
- `keyHash`
- `tokenHash`

Ejemplo:

```json
{
  "username": "admin",
  "password": "[REDACTED]"
}
```

## Implementacion Selectiva A Nivel Controller

Usa esta opcion cuando quieres auditar todos los endpoints de un controller.

Archivo a modificar:

```txt
src/users/users.controller.ts
```

Ejemplo:

```ts
import { Controller, UseInterceptors } from '@nestjs/common';
import { Audit } from '../common/decorators/audit.decorator';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@Audit({ resource: 'users' })
@UseInterceptors(AuditInterceptor)
@Controller('users')
export class UsersController {}
```

Resultado:

- Todos los endpoints de `UsersController` quedan auditados.
- Si un endpoint no define `action`, se usa `get`, `post`, `patch` o `delete`.
- Si un endpoint tiene `:id`, se usa como `resourceId` por defecto.

## Implementacion Selectiva A Nivel Endpoint

Usa esta opcion cuando solo quieres auditar operaciones sensibles.

Archivo a modificar:

```txt
src/users/users.controller.ts
```

Ejemplo para auditar una actualizacion:

```ts
import { Body, Param, Patch, UseInterceptors } from '@nestjs/common';
import { Audit } from '../common/decorators/audit.decorator';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@Patch(':id')
@UseInterceptors(AuditInterceptor)
@Audit({
  action: 'update',
  resource: 'users',
  resourceIdParam: 'id',
  captureRequestBody: true,
  captureResponseBody: true,
})
update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  return this.usersService.update(id, dto);
}
```

Ejemplo para auditar una desactivacion:

```ts
import { Param, Patch, UseInterceptors } from '@nestjs/common';
import { Audit } from '../common/decorators/audit.decorator';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@Patch(':id/toggle-active')
@UseInterceptors(AuditInterceptor)
@Audit({
  action: 'toggle-active',
  resource: 'users',
  resourceIdParam: 'id',
  captureResponseBody: true,
})
toggleActive(@Param('id') id: string) {
  return this.usersService.toggleActive(id);
}
```

## Implementacion Global

Usa esta opcion solo si el proyecto necesita auditar toda la API.

Archivo a modificar:

```txt
src/app.module.ts
```

Agregar imports:

```ts
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
```

Registrar provider:

```ts
providers: [
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: AuditInterceptor,
  },
]
```

Esta opcion puede generar muchos registros en `audit_logs`, incluyendo consultas `GET`. Para la mayoria de proyectos es mejor usar auditoria selectiva.

## Requisitos

Antes de habilitar auditoria:

1. Ejecutar migraciones para asegurar que exista la tabla `audit_logs`.
2. Generar Prisma Client si el schema cambio.
3. Confirmar que los endpoints protegidos carguen `request.user` mediante JWT o API credentials.

Comandos recomendados:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run build
```

## Recomendacion

Para nuevos proyectos, mantener `AuditInterceptor` desactivado por defecto y habilitarlo solo en endpoints que cambian estado o manejan informacion sensible.

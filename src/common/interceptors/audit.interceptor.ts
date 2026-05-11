import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { PrismaService } from '../../prisma/prisma.service';

type RequestWithUser = Request & {
  user?: { id?: string };
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  private readonly sensitiveKeys = new Set([
    'authorization',
    'cookie',
    'password',
    'token',
    'accesstoken',
    'refreshtoken',
    'apikey',
    'apitoken',
    'keyhash',
    'tokenhash',
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithUser>();
    const response = ctx.getResponse<Response>();
    const options = this.reflector.getAllAndOverride<AuditOptions>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? {};

    return next.handle().pipe(
      tap((data) => {
        void this.createAuditLog(request, response, options, data);
      }),
      catchError((error) => {
        void this.createAuditLog(request, response, options, undefined, error);
        return throwError(() => error);
      }),
    );
  }

  private async createAuditLog(
    request: RequestWithUser,
    response: Response,
    options: AuditOptions,
    responseData?: unknown,
    error?: unknown,
  ): Promise<void> {
    try {
      const statusCode = error
        ? this.getErrorStatusCode(error)
        : response.statusCode;
      const resource = options.resource ?? this.inferResource(request);
      const action = options.action ?? request.method.toLowerCase();
      const resourceId = this.resolveResourceId(request, responseData, options);
      const oldValues = options.captureRequestBody
        ? this.sanitize(request.body)
        : undefined;
      const newValues = options.captureResponseBody
        ? this.sanitize(responseData)
        : undefined;

      await this.prisma.auditLog.create({
        data: {
          userId: request.user?.id ?? null,
          action,
          resource,
          resourceId,
          oldValues: oldValues as Prisma.InputJsonValue | undefined,
          newValues: newValues as Prisma.InputJsonValue | undefined,
          ipAddress: request.ip,
          userAgent: request.get('user-agent') ?? '',
          statusCode,
        },
      });
    } catch (auditError) {
      const message =
        auditError instanceof Error ? auditError.message : String(auditError);
      this.logger.warn(`Audit log was not persisted: ${message}`);
    }
  }

  private getErrorStatusCode(error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private inferResource(request: Request): string {
    const segments = request.path.split('/').filter(Boolean);
    const apiIndex = segments.findIndex((segment) => segment === 'api');

    if (apiIndex >= 0 && /^v\d+$/i.test(segments[apiIndex + 1] ?? '')) {
      return segments[apiIndex + 2] ?? request.path;
    }

    return segments[0] ?? request.path;
  }

  private resolveResourceId(
    request: Request,
    responseData: unknown,
    options: AuditOptions,
  ): string | null {
    const value =
      this.getValue(request.params, options.resourceIdParam) ??
      this.getValue(request.body, options.resourceIdBodyField) ??
      this.getValue(responseData, options.resourceIdResponseField) ??
      request.params?.id;

    if (value === undefined || value === null) {
      return null;
    }

    return String(value);
  }

  private getValue(source: unknown, path?: string): unknown {
    if (!path || !source || typeof source !== 'object') {
      return undefined;
    }

    return path.split('.').reduce<unknown>((current, key) => {
      if (!current || typeof current !== 'object') {
        return undefined;
      }

      return (current as Record<string, unknown>)[key];
    }, source);
  }

  private sanitize(value: unknown, depth = 0): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (depth > 8) {
      return '[MAX_DEPTH]';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item, depth + 1));
    }

    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).reduce(
        (acc, [key, item]) => {
          acc[key] = this.isSensitiveKey(key)
            ? '[REDACTED]'
            : this.sanitize(item, depth + 1);
          return acc;
        },
        {} as Record<string, unknown>,
      );
    }

    return value;
  }

  private isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    return this.sensitiveKeys.has(normalized);
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const { method, url, ip, user } = request;
    const userAgent = request.get('user-agent') || '';

    return next.handle().pipe(
      tap({
        next: async (data) => {
          const response = ctx.getResponse();
          try {
            await this.prisma.auditLog.create({
              data: {
                userId: user?.id || null,
                action: method,
                resource: url.split('/')[3] || url,
                ipAddress: ip,
                userAgent,
                statusCode: response.statusCode,
              },
            });
          } catch {}
        },
      }),
    );
  }
}

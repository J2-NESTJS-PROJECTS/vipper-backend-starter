import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { createHash } from 'crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const hasBearerToken =
      typeof request.headers.authorization === 'string' &&
      request.headers.authorization.toLowerCase().startsWith('bearer ');

    if (hasBearerToken) {
      return super.canActivate(context);
    }

    const apiKey = request.header('x-api-key');
    const apiToken = request.header('x-api-token');
    if (apiKey || apiToken) {
      return this.validateApiCredentials(request);
    }

    return super.canActivate(context);
  }

  private async validateApiCredentials(request: Request): Promise<boolean> {
    const apiAuthEnabled = this.configService.get<boolean>('apiAuth.enabled', false);
    if (!apiAuthEnabled) {
      throw new UnauthorizedException('API key authentication is disabled');
    }

    const apiKey = request.header('x-api-key') || '';
    const apiToken = request.header('x-api-token') || '';
    if (!apiKey || !apiToken) {
      throw new UnauthorizedException('x-api-key and x-api-token are required');
    }

    const dbUser = await this.validateApiCredentialFromDatabase(apiKey, apiToken);
    if (dbUser) {
      request.user = dbUser;
      return true;
    }

    const legacyUser = await this.validateLegacyApiCredential(apiKey, apiToken);
    if (legacyUser) {
      request.user = legacyUser;
      return true;
    }

    throw new UnauthorizedException('Invalid API credentials');
  }

  private async validateApiCredentialFromDatabase(
    apiKey: string,
    apiToken: string,
  ): Promise<any | null> {
    const apiCredentialDelegate = this.prisma.apiCredential;
    const keyHash = this.sha256(apiKey);
    const tokenHash = this.sha256(apiToken);

    if (!apiCredentialDelegate || typeof apiCredentialDelegate.findFirst !== 'function') {
      return this.validateApiCredentialFromRawQuery(keyHash, tokenHash);
    }

    try {
      const credential = await apiCredentialDelegate.findFirst({
        where: {
          keyHash,
          tokenHash,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          user: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!credential || !credential.user?.isActive) {
        return null;
      }

      if (typeof apiCredentialDelegate.update === 'function') {
        await apiCredentialDelegate.update({
          where: { id: credential.id },
          data: { lastUsedAt: new Date() },
        });
      }

      const { password, ...result } = credential.user;
      return result;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2021') {
        return null;
      }

      throw error;
    }
  }

  private async validateApiCredentialFromRawQuery(
    keyHash: string,
    tokenHash: string,
  ): Promise<any | null> {
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{ credentialId: string; userId: string }>
      >`
        SELECT ac.id AS "credentialId", ac."userId" AS "userId"
        FROM api_credentials ac
        INNER JOIN users u ON u.id = ac."userId"
        WHERE ac."keyHash" = ${keyHash}
          AND ac."tokenHash" = ${tokenHash}
          AND ac."isActive" = true
          AND u."isActive" = true
          AND (ac."expiresAt" IS NULL OR ac."expiresAt" > NOW())
        LIMIT 1
      `;

      const match = rows[0];
      if (!match) {
        return null;
      }

      await this.prisma.$executeRaw`
        UPDATE api_credentials
        SET "lastUsedAt" = NOW()
        WHERE id = ${match.credentialId}
      `;

      return this.usersService.findOne(match.userId);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2010') {
        return null;
      }

      throw error;
    }
  }

  private async validateLegacyApiCredential(
    apiKey: string,
    apiToken: string,
  ): Promise<any | null> {
    const legacyKey = this.configService.get<string>('apiAuth.legacyKey', '');
    const legacyToken = this.configService.get<string>('apiAuth.legacyToken', '');
    const legacyUser = this.configService.get<string>('apiAuth.legacyUser', '');

    if (!legacyKey || !legacyToken || !legacyUser) {
      return null;
    }

    const validKey = this.secureEquals(apiKey, legacyKey);
    const validToken = this.secureEquals(apiToken, legacyToken);
    if (!validKey || !validToken) {
      return null;
    }

    const user = await this.usersService.findByUsernameOrEmail(legacyUser);
    if (!user || !user.isActive) {
      return null;
    }

    const { password, ...result } = user;
    return result;
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private secureEquals(value: string, expected: string): boolean {
    const valueBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);
    if (valueBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(valueBuffer, expectedBuffer);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}

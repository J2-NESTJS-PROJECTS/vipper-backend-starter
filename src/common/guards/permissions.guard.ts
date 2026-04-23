import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No user in request');

    const userPermissions: RequiredPermission[] =
      user.role?.permissions?.map((rp: any) => ({
        action: rp.permission.action,
        resource: rp.permission.resource,
      })) || [];

    const hasAll = requiredPermissions.every((required) =>
      userPermissions.some(
        (up) =>
          (up.action === required.action || up.action === 'manage') &&
          up.resource === required.resource,
      ),
    );

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}

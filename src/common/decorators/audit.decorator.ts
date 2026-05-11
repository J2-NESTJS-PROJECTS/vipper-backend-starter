import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditOptions {
  action?: string;
  resource?: string;
  resourceIdParam?: string;
  resourceIdBodyField?: string;
  resourceIdResponseField?: string;
  captureRequestBody?: boolean;
  captureResponseBody?: boolean;
}

export const Audit = (options: AuditOptions = {}) =>
  SetMetadata(AUDIT_KEY, options);

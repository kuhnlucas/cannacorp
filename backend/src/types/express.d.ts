/**
 * Tipos extendidos para Express Request con autenticación y multi-tenant
 */

import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
}

export interface TenantContext {
  id: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'STAFF';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenant?: TenantContext;
    }
  }
}

export {};

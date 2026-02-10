/**
 * Middleware de multi-tenancy
 * Requiere requireAuth antes
 * Valida X-Tenant-Id y membership, adjunta req.tenant
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenant?: { id: string; name: string; role: 'OWNER' | 'ADMIN' | 'STAFF' };
      user?: { id: string; email: string };
    }
  }
}

const prisma = new PrismaClient();

export const requireTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Compatibilidad: authenticateToken (middleware.ts) usa req.userId, otros usan req.user
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) {
      console.error('❌ requireTenant: No user in request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Leer header X-Tenant-Id
    const tenantId = req.headers['x-tenant-id'] as string | undefined;

    console.log('🔍 requireTenant:', { userId, tenantId, hasHeader: !!tenantId });

    // Estrategia: si no viene header o no corresponde, elegir el primer tenant del usuario
    let membership = tenantId
      ? await prisma.membership.findUnique({
          where: {
            userId_tenantId: {
              userId,
              tenantId,
            },
          },
          include: {
            tenant: { select: { id: true, name: true } },
          },
        })
      : null;

    if (!membership) {
      console.warn('⚠️ requireTenant: usando fallback al primer tenant del usuario');
      membership = await prisma.membership.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        include: {
          tenant: { select: { id: true, name: true } },
        },
      });
    }

    if (!membership) {
      console.error('❌ requireTenant: usuario sin memberships', { userId, tenantId });
      return res.status(403).json({ error: 'User has no tenant membership' });
    }

    req.tenant = {
      id: membership.tenant.id,
      name: membership.tenant.name,
      role: membership.role as 'OWNER' | 'ADMIN' | 'STAFF',
    };

    // Reescribir header para downstream con el tenant efectivo
    (req as any).headers['x-tenant-id'] = membership.tenant.id;

    console.log('✅ requireTenant: Membership verificada y tenant adjuntado');
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    return res.status(500).json({ error: 'Tenant validation failed' });
  }
};

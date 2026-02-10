/**
 * Rutas de Tenants
 * Gestión de organizaciones multi-tenant
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
const prisma = new PrismaClient();

// Request extendido para tener req.user asignado por requireAuth
type AuthReq = Request & { user?: { id: string; email?: string } };

/**
 * GET /api/tenants
 * Lista todos los tenants donde el usuario tiene membership
 */
router.get('/', requireAuth, async (req: AuthReq, res: Response) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user!.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const tenants = memberships.map((m: any) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      role: m.role,
      createdAt: m.tenant.createdAt,
    }));

    res.json({ tenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

/**
 * POST /api/tenants
 * Crea un nuevo tenant con el usuario como OWNER
 */
router.post('/', requireAuth, async (req: AuthReq, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tenant name is required' });
    }

    // Crear tenant y membership en una transacción
    const result = await prisma.$transaction(async (tx: any) => {
      const tenant = await tx.tenant.create({
        data: { name: name.trim() },
      });

      const membership = await tx.membership.create({
        data: {
          userId: req.user!.id,
          tenantId: tenant.id,
          role: 'OWNER',
        },
      });

      return { tenant, membership };
    });

    res.status(201).json({
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        role: result.membership.role,
        createdAt: result.tenant.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

/**
 * GET /api/tenants/:id
 * Obtiene detalles de un tenant específico
 */
router.get('/:id', requireAuth, async (req: AuthReq, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: req.user!.id,
          tenantId: id,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'No access to this tenant' });
    }

    res.json({
      tenant: {
        ...membership.tenant,
        role: membership.role,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

export default router;

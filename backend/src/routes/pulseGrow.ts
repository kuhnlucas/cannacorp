/**
 * Pulse Grow Integration Routes
 *
 * Prefix (registered in index.ts): /api/sensors/pulsegrow
 * Auth: authenticateToken on all routes
 * Tenant scope: from PULSE_GROW_TENANT_ID env var (global config, not per-tenant)
 *
 * Available endpoints:
 *   GET /devices
 *   GET /:deviceId/recent
 *   GET /:deviceId/history
 */

import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware';
import config from '../config';
import { getRecentData, getAllDevices, getDeviceHistory } from '../services/pulseGrowService';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * requirePulseTenantAdmin
 *
 * Single middleware that enforces all Pulse Grow access rules. Rules applied in order:
 *
 *  1. PULSE_GROW_TENANT_ID must be configured      → 503
 *  2. X-Tenant-Id header must be present           → 400
 *  3. X-Tenant-Id must equal config.pulseGrowTenantId → 403
 *  4. Authenticated user must have OWNER or ADMIN
 *     membership in that exact tenant              → 403
 */
const requirePulseTenantAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Config guard
  const pulseTenantId = config.pulseGrowTenantId;
  if (!pulseTenantId) {
    return res.status(503).json({ error: 'Pulse Grow tenant authorization is not configured' });
  }

  // 2. Header presence — Express lowercases all header names
  const headerValue = req.headers['x-tenant-id'] as string | undefined;
  if (!headerValue) {
    return res.status(400).json({ error: 'X-Tenant-Id header is required for Pulse Grow routes' });
  }

  // 3. Header value must match the configured Pulse tenant exactly
  if (headerValue !== pulseTenantId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 4. User must have OWNER or ADMIN membership in the Pulse tenant
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: pulseTenantId,
        },
      },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  } catch (err) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

router.use(authenticateToken);
router.use(requirePulseTenantAdmin);

// GET /api/sensors/pulsegrow/devices
router.get('/devices', async (req, res) => {
  try {
    const devices = await getAllDevices();
    res.json(devices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/pulsegrow/:deviceId/recent
router.get('/:deviceId/recent', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const data = await getRecentData(deviceId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/pulsegrow/:deviceId/history?start=...&end=...
router.get('/:deviceId/history', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { start, end } = req.query;
    if (!start) return res.status(400).json({ error: 'start query param required (ISO8601)' });
    const data = await getDeviceHistory(deviceId, String(start), end ? String(end) : undefined);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

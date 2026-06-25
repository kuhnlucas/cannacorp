/**
 * Edenic Integration Routes
 *
 * Prefix (registered in index.ts): /api/integrations/edenic
 * Auth: requireAuth on all routes
 * Organization scope: from EDENIC_ORGANIZATION_ID env var (global config, not per-tenant)
 *
 * Available endpoints:
 *   GET /config
 *   GET /devices
 *   GET /devices/:deviceId/telemetry/latest
 *   GET /devices/:deviceId/telemetry/history
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware';
import {
  validateConfiguration,
  getDevices,
  getLatestTelemetry,
  getTelemetryHistory,
  normalizeEdenicError,
  EdenicTelemetryKey,
  EdenicTelemetryAgg,
  EdenicOrderBy,
} from '../services/edenicClient';

const router = Router();

// All Edenic routes require authentication
router.use(authenticateToken);

/**
 * GET /api/integrations/edenic/config
 * Returns Edenic configuration status. Never returns credentials.
 */
router.get('/config', (_req: Request, res: Response) => {
  try {
    const result = validateConfiguration();
    res.json(result);
  } catch (err) {
    const normalized = normalizeEdenicError(err);
    res.status(500).json({ error: normalized.message });
  }
});

/**
 * GET /api/integrations/edenic/devices
 * Lists all Edenic devices for the configured organization.
 */
router.get('/devices', async (_req: Request, res: Response) => {
  try {
    const devices = await getDevices();
    res.json({ devices });
  } catch (err) {
    const normalized = normalizeEdenicError(err);
    const status =
      normalized.type === 'config' ? 503 :
      normalized.type === 'validation' ? 400 :
      normalized.status ?? 500;
    res.status(status).json({ error: normalized.message });
  }
});

/**
 * GET /api/integrations/edenic/devices/:deviceId/telemetry/latest
 * Returns the latest telemetry for a device.
 *
 * Query params:
 *   keys  (optional, comma-separated): ph,electrical_conductivity,temperature
 */
router.get('/devices/:deviceId/telemetry/latest', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const rawKeys = req.query.keys as string | undefined;
    const keys = rawKeys
      ? (rawKeys.split(',').map((k) => k.trim()) as EdenicTelemetryKey[])
      : undefined;

    const data = await getLatestTelemetry(deviceId, keys ? { keys } : undefined);
    res.json({ telemetry: data });
  } catch (err) {
    const normalized = normalizeEdenicError(err);
    const status =
      normalized.type === 'config' ? 503 :
      normalized.type === 'validation' ? 400 :
      normalized.status ?? 500;
    res.status(status).json({ error: normalized.message });
  }
});

/**
 * GET /api/integrations/edenic/devices/:deviceId/telemetry/history
 * Returns historical telemetry for a device within a time range.
 *
 * Query params:
 *   keys      (required, comma-separated): ph,electrical_conductivity,temperature
 *   startTs   (required, Unix ms): e.g. 1719000000000
 *   endTs     (required, Unix ms): e.g. 1719100000000
 *   interval  (optional, ms, min 60000): e.g. 300000
 *   agg       (optional): AVG | COUNT | MAX | MIN | NONE | SUM
 *   orderBy   (optional): ASC | DESC
 */
router.get('/devices/:deviceId/telemetry/history', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const rawKeys = req.query.keys as string | undefined;
    if (!rawKeys) {
      return res.status(400).json({ error: 'keys query param is required' });
    }
    const keys = rawKeys.split(',').map((k) => k.trim()) as EdenicTelemetryKey[];

    const startTsRaw = req.query.startTs as string | undefined;
    const endTsRaw = req.query.endTs as string | undefined;
    if (!startTsRaw || !endTsRaw) {
      return res
        .status(400)
        .json({ error: 'startTs and endTs query params are required' });
    }

    const startTs = Number(startTsRaw);
    const endTs = Number(endTsRaw);
    if (isNaN(startTs) || isNaN(endTs)) {
      return res
        .status(400)
        .json({ error: 'startTs and endTs must be numeric Unix timestamps (ms)' });
    }

    const intervalRaw = req.query.interval as string | undefined;
    const interval = intervalRaw !== undefined ? Number(intervalRaw) : undefined;
    const agg = req.query.agg as EdenicTelemetryAgg | undefined;
    const orderBy = req.query.orderBy as EdenicOrderBy | undefined;

    const data = await getTelemetryHistory(deviceId, {
      keys,
      startTs,
      endTs,
      ...(interval !== undefined && { interval }),
      ...(agg && { agg }),
      ...(orderBy && { orderBy }),
    });

    res.json({ telemetry: data });
  } catch (err) {
    const normalized = normalizeEdenicError(err);
    const status =
      normalized.type === 'config' ? 503 :
      normalized.type === 'validation' ? 400 :
      normalized.status ?? 500;
    res.status(status).json({ error: normalized.message });
  }
});

export default router;

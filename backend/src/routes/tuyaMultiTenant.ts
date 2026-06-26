/**
 * Rutas Tuya con Multi-Tenant
 * Endpoints para vincular y gestionar dispositivos Smart Life por tenant
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import { requireTenant } from '../middleware/requireTenant';
import { createTuyaClient } from '../services/tuyaClient';
import config from '../config';

const router = Router();
const prisma = new PrismaClient();

/**
 * requireTuyaTenantAdmin
 *
 * Ensure the authenticated user has OWNER or ADMIN membership in the
 * tenant resolved by requireTenant. Responds with appropriate HTTP codes:
 *  - 401 if unauthenticated
 *  - 400 if tenant not resolved
 *  - 403 if membership missing or insufficient
 */
const requireTuyaTenantAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const tenant = (req as any).tenant;
  if (!tenant) {
    return res.status(400).json({ error: 'Tenant not resolved' });
  }

  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: tenant.id,
        },
      },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  } catch (err) {
    console.error('Error checking Tuya tenant membership:', err);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * Helper para normalizar status de sensores
 */
function normalizeSensorStatus(statusList: Array<{ code: string; value: any }>) {
  let temperature: number | undefined;
  let humidity: number | undefined;

  for (const status of statusList) {
    // Temperature (various DP codes)
    if (['temp_current', 'temperature', 'va_temperature', 'temp'].includes(status.code)) {
      // Tuya usually sends temperature as integer (e.g., 235 = 23.5°C)
      temperature = typeof status.value === 'number' ? status.value / 10 : undefined;
    }

    // Humidity
    if (['humidity_value', 'humidity', 'va_humidity'].includes(status.code)) {
      humidity = typeof status.value === 'number' ? status.value : undefined;
    }
  }

  return { temperature, humidity };
}

/**
 * POST /api/tuya/app-accounts/validate
 * Valida UID y sincroniza dispositivos del tenant
 */
router.post('/app-accounts/validate', requireAuth, requireTenant, requireTuyaTenantAdmin, async (req: Request, res: Response) => {
  try {
    const { uid, region: bodyRegion, baseUrl: bodyBaseUrl } = req.body;

    if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const tenantId = req.tenant!.id;
    const region = (bodyRegion as string) || config.tuyaRegion || 'us';
    const baseUrl = (bodyBaseUrl as string) || config.tuyaBaseUrl || undefined;

    // Ensure Tuya central credentials are configured before creating client
    if (!config.isTuyaConfigured()) {
      return res.status(503).json({ error: 'Tuya integration not configured' });
    }

    // Llamar a Tuya para listar dispositivos del UID
    const client = createTuyaClient({ region, baseUrl });
    let devices;

    try {
      devices = await client.listDevicesByUid(uid.trim());
    } catch (error: any) {
      console.error('❌ Tuya API Error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      if (error.message.includes('UID not found') || error.message.includes('no permission')) {
        return res.status(400).json({
          error: 'No se encontraron dispositivos para este UID',
          details: 'Verifica que hayas escaneado el QR correcto desde Smart Life app. Ve a Cloud Project → Devices → Link Tuya App Account → Add App Account, y asegúrate de que el Data Center coincide con la región de tu cuenta.',
        });
      }
      
      // Retornar el error completo de Tuya para debugging
      return res.status(400).json({
        error: error.message || 'Error al vincular cuenta Tuya',
        details: error.response?.data?.msg || error.response?.data || 'Error desconocido',
        code: error.code || error.response?.data?.code,
      });
    }

    if (!devices || devices.length === 0) {
      return res.status(400).json({
        error: 'No se encontraron dispositivos',
        details: 'La cuenta está vinculada pero no tiene dispositivos. Agrega dispositivos en Smart Life app y vuelve a intentar.',
      });
    }

    // Upsert TuyaAppAccount
    const appAccount = await prisma.tuyaAppAccount.upsert({
      where: {
        tenantId_uid: {
          tenantId,
          uid: uid.trim(),
        },
      },
      create: {
        tenantId,
        uid: uid.trim(),
        baseUrl: baseUrl ?? config.tuyaBaseUrl ?? '',
        region,
      },
      update: {
        baseUrl: baseUrl ?? config.tuyaBaseUrl ?? '',
        region,
        updatedAt: new Date(),
      },
    });

    // Sincronizar dispositivos
    const syncedDevices = [];
    for (const device of devices) {
      const existing = await prisma.tuyaDevice.findUnique({
        where: { tuyaDeviceId: device.id },
      });
      
      const syncedDevice = await prisma.tuyaDevice.upsert({
        where: { tuyaDeviceId: device.id },
        create: {
          tenantId,
          tuyaDeviceId: device.id,
          name: device.name,
          category: device.category,
          isOnline: device.online,
          raw: JSON.stringify(device),
          lastSyncAt: new Date(),
        },
        update: {
          tenantId, // Actualizar también el tenant por si cambió
          name: device.name,
          category: device.category,
          isOnline: device.online,
          raw: JSON.stringify(device), // Actualizar raw completo con status actualizado
          lastSyncAt: new Date(),
        },
      });
      syncedDevices.push(syncedDevice);
    }

    res.json({
      ok: true,
      devicesCount: syncedDevices.length,
      appAccount: {
        id: appAccount.id,
        uid: appAccount.uid,
      },
    });
  } catch (error) {
    console.error('Error validating Tuya UID:', error);
    res.status(500).json({ error: 'Failed to validate UID' });
  }
});

/**
 * GET /api/tuya/devices
 * Lista dispositivos Tuya del tenant
 */
router.get('/devices', requireAuth, requireTenant, requireTuyaTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;

    // Usar región/baseUrl guardados en la cuenta si existe
    const appAccount = await prisma.tuyaAppAccount.findFirst({ where: { tenantId } });
    const client = createTuyaClient({
        region: appAccount?.region || config.tuyaRegion || 'us',
        baseUrl: appAccount?.baseUrl || config.tuyaBaseUrl || undefined,
    });

    // Auto-registrar nuevos dispositivos al consultar la lista
    try {
      if (appAccount) {
        // Guard: ensure central Tuya credentials present
        if (!config.isTuyaConfigured()) {
          return res.status(503).json({ error: 'Tuya integration not configured' });
        }

        const devicesFromTuya = await client.listDevicesByUid(appAccount.uid);
        for (const device of devicesFromTuya) {
          await prisma.tuyaDevice.upsert({
            where: { tuyaDeviceId: device.id },
            create: {
              tenantId,
              tuyaDeviceId: device.id,
              name: device.name,
              category: device.category,
              isOnline: device.online,
              raw: JSON.stringify(device),
              lastSyncAt: new Date(),
            },
            update: {
              tenantId,
              name: device.name,
              category: device.category,
              isOnline: device.online,
              raw: JSON.stringify(device),
              lastSyncAt: new Date(),
            },
          });
        }
      }
    } catch (syncErr: unknown) {
      const msg = (syncErr as any)?.message || '';
      // Map known Tuya service expiration to 503
      if (msg.includes('IoT Core service subscription has expired')) {
        console.error('⚠️  Tuya IoT Core subscription expired');
        return res.status(503).json({ error: 'Tuya IoT Core service is not active' });
      }

      console.error('⚠️  No se pudo auto-registrar dispositivos Tuya:', msg);
    }

    const devices = await prisma.tuyaDevice.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        lab: true, // Incluir información del laboratorio
      },
    });

    const devicesFormatted = await Promise.all(devices.map(async (d: any) => {
      let rawData = d.raw ? JSON.parse(d.raw) : {};

      // Si no hay status almacenado, traer estado en vivo para mostrar datos del nuevo dispositivo
      if (!rawData.status || rawData.status.length === 0) {
        try {
          const live = await client.getDeviceStatus(d.tuyaDeviceId);
          rawData = { ...rawData, ...live };

          // Persistir el estado en vivo para futuras lecturas rápidas
          await prisma.tuyaDevice.update({
            where: { id: d.id },
            data: {
              isOnline: live.online,
              raw: JSON.stringify(rawData),
              lastSyncAt: new Date(),
            },
          });
        } catch (err) {
          console.error('⚠️  No se pudo obtener estado en vivo de Tuya:', {
            deviceId: d.tuyaDeviceId,
            error: (err as any)?.message,
          });
        }
      }

      return {
        id: d.id,
        tuyaDeviceId: d.tuyaDeviceId,
        name: d.name,
        category: d.category,
        productName: rawData.product_name || '',
        online: rawData.online ?? d.isOnline,
        status: rawData.status || [],
        icon: rawData.icon || '',
        lastSyncAt: d.lastSyncAt,
        labId: d.labId,
        labName: d.lab?.name,
      };
    }));

    res.json({ devices: devicesFormatted });
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('IoT Core service subscription has expired')) {
        console.error('❌ Tuya IoT Core subscription expired when fetching devices');
        return res.status(503).json({ error: 'Tuya IoT Core service is not active' });
      }

      console.error('Error fetching Tuya devices:', msg);
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

/**
 * GET /api/tuya/devices/:tuyaDeviceId/status
 * Obtiene estado en tiempo real de un dispositivo
 */
router.get('/devices/:tuyaDeviceId/status', requireAuth, requireTenant, requireTuyaTenantAdmin, async (req: Request, res: Response) => {
  try {
    const { tuyaDeviceId } = req.params;

    // Verificar ownership
    const device = await prisma.tuyaDevice.findFirst({
      where: {
        tuyaDeviceId,
        tenantId: req.tenant!.id,
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found or no access' });
    }

    // Ensure Tuya is configured
    if (!config.isTuyaConfigured()) {
      return res.status(503).json({ error: 'Tuya integration not configured' });
    }

    // Llamar a Tuya para obtener estado actual
    const client = createTuyaClient();
    const status = await client.getDeviceStatus(tuyaDeviceId);

    // Normalizar datos de sensores
    const normalized = normalizeSensorStatus(status.status || []);

    res.json({
      tuyaDeviceId: status.id,
      name: status.name,
      category: status.category,
      online: status.online,
      temperature: normalized.temperature,
      humidity: normalized.humidity,
      rawStatus: status.status,
    });
  } catch (error: any) {
    const msg = error?.message || '';
    if (msg.includes('IoT Core service subscription has expired')) {
      console.error('❌ Tuya IoT Core subscription expired when fetching device status');
      return res.status(503).json({ error: 'Tuya IoT Core service is not active' });
    }

    console.error('Error fetching device status:', msg);
    res.status(500).json({ error: 'Failed to fetch device status' });
  }
});

/**
 * POST /api/tuya/sync
 * Re-sincroniza dispositivos del tenant
 */
router.post('/sync', requireAuth, requireTenant, requireTuyaTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;

    // Buscar TuyaAppAccount del tenant
    const appAccount = await prisma.tuyaAppAccount.findFirst({
      where: { tenantId },
    });

    if (!appAccount) {
      return res.status(404).json({ error: 'No Tuya account linked to this tenant' });
    }

    // Sincronizar dispositivos
    if (!config.isTuyaConfigured()) {
      return res.status(503).json({ error: 'Tuya integration not configured' });
    }

    const client = createTuyaClient({
      region: appAccount.region || config.tuyaRegion || 'us',
      baseUrl: appAccount.baseUrl || config.tuyaBaseUrl || undefined,
    });
    const devices = await client.listDevicesByUid(appAccount.uid);

    const syncedDevices = [];
    for (const device of devices) {
      const existing = await prisma.tuyaDevice.findUnique({
        where: { tuyaDeviceId: device.id },
      });
      
      const syncedDevice = await prisma.tuyaDevice.upsert({
        where: { tuyaDeviceId: device.id },
        create: {
          tenantId,
          tuyaDeviceId: device.id,
          name: device.name,
          category: device.category,
          isOnline: device.online,
          raw: JSON.stringify(device),
          lastSyncAt: new Date(),
        },
        update: {
          tenantId, // Actualizar tenant por si cambió
          name: device.name, // Actualizar nombre si cambió
          category: device.category,
          isOnline: device.online,
          raw: JSON.stringify(device), // Actualizar raw completo con status más reciente
          lastSyncAt: new Date(),
        },
      });
      syncedDevices.push(syncedDevice);
    }

    res.json({
      ok: true,
      devicesCount: syncedDevices.length,
      lastSyncAt: new Date(),
    });
  } catch (error: any) {
    const msg = error?.message || '';
    if (msg.includes('IoT Core service subscription has expired')) {
      console.error('❌ Tuya IoT Core subscription expired during sync');
      return res.status(503).json({ error: 'Tuya IoT Core service is not active' });
    }

    console.error('Error syncing Tuya devices:', msg);
    res.status(500).json({ error: 'Failed to sync devices' });
  }
});

/**
 * PATCH /api/tuya/devices/:deviceId/lab
 * Asignar dispositivo Tuya a un laboratorio
 */
router.patch('/devices/:deviceId/lab', requireAuth, requireTenant, requireTuyaTenantAdmin, async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { labId } = req.body;
    const tenantId = req.tenant!.id;

    // Verificar que el dispositivo pertenece al tenant
    const device = await prisma.tuyaDevice.findFirst({
      where: {
        id: deviceId,
        tenantId,
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Si se proporciona labId, verificar que el laboratorio pertenece al tenant
    if (labId) {
      
      const lab = await prisma.lab.findFirst({
        where: {
          id: labId,
          tenantId,
        },
      });

      if (!lab) {
        return res.status(404).json({ error: 'Lab not found' });
      }
    }

    // Actualizar la asignación
    const updatedDevice = await prisma.tuyaDevice.update({
      where: { id: deviceId },
      data: { labId: labId || null },
      include: {
        lab: true,
      },
    });

    res.json({
      ok: true,
      device: {
        id: updatedDevice.id,
        name: updatedDevice.name,
        labId: updatedDevice.labId,
        labName: updatedDevice.lab?.name,
      },
    });
  } catch (error) {
    console.error('❌ Error assigning device to lab:', error);
    res.status(500).json({ error: 'Failed to assign device to lab' });
  }
});

/**
 * GET /api/tuya/app-accounts
 * Lista cuentas Tuya vinculadas al tenant
 */
router.get('/app-accounts', requireAuth, requireTenant, requireTuyaTenantAdmin, async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.tuyaAppAccount.findMany({
      where: { tenantId: req.tenant!.id },
      select: {
        id: true,
        uid: true,
        region: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ accounts });
  } catch (error) {
    console.error('Error fetching Tuya accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

export default router;

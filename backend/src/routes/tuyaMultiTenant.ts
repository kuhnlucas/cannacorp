/**
 * Rutas Tuya con Multi-Tenant
 * Endpoints para vincular y gestionar dispositivos Smart Life por tenant
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import { requireTenant } from '../middleware/requireTenant';
import { createTuyaClient } from '../services/tuyaClient';

const router = Router();
const prisma = new PrismaClient();

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
router.post('/app-accounts/validate', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const { uid, region: bodyRegion, baseUrl: bodyBaseUrl } = req.body;

    if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const tenantId = req.tenant!.id;
    const region = (bodyRegion as string) || process.env.TUYA_REGION || 'us';
    const baseUrl = (bodyBaseUrl as string) || process.env.TUYA_BASE_URL || '';

    // Llamar a Tuya para listar dispositivos del UID
    const client = createTuyaClient({ region, baseUrl });
    let devices;

    try {
      console.log(`🔄 Attempting to validate UID: ${uid.trim()} for tenant: ${tenantId}`);
      devices = await client.listDevicesByUid(uid.trim());
      console.log(`✅ Successfully retrieved ${devices?.length || 0} devices`);
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
        baseUrl,
        region,
      },
      update: {
        baseUrl,
        region,
        updatedAt: new Date(),
      },
    });

    // Sincronizar dispositivos
    console.log(`🔄 Sincronizando ${devices.length} dispositivos...`);
    const syncedDevices = [];
    for (const device of devices) {
      const existing = await prisma.tuyaDevice.findUnique({
        where: { tuyaDeviceId: device.id },
      });
      
      if (existing) {
        console.log(`📝 Actualizando dispositivo: ${existing.name} → ${device.name} (${device.online ? 'Online' : 'Offline'})`);
      } else {
        console.log(`➕ Nuevo dispositivo: ${device.name} (${device.category})`);
      }
      
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
    console.log(`✅ Sincronización completada: ${syncedDevices.length} dispositivos`);

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
router.get('/devices', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;

    // Usar región/baseUrl guardados en la cuenta si existe
    const appAccount = await prisma.tuyaAppAccount.findFirst({ where: { tenantId } });
    const client = createTuyaClient({
      region: appAccount?.region || process.env.TUYA_REGION || 'us',
      baseUrl: appAccount?.baseUrl || process.env.TUYA_BASE_URL || undefined,
    });

    // Auto-registrar nuevos dispositivos al consultar la lista
    try {
      if (appAccount) {
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
      console.error('⚠️  No se pudo auto-registrar dispositivos Tuya:', (syncErr as Error)?.message);
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
  } catch (error) {
    console.error('Error fetching Tuya devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

/**
 * GET /api/tuya/devices/:tuyaDeviceId/status
 * Obtiene estado en tiempo real de un dispositivo
 */
router.get('/devices/:tuyaDeviceId/status', requireAuth, requireTenant, async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ error: 'Failed to fetch device status' });
  }
});

/**
 * POST /api/tuya/sync
 * Re-sincroniza dispositivos del tenant
 */
router.post('/sync', requireAuth, requireTenant, async (req: Request, res: Response) => {
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
    console.log(`🔄 Sincronización manual solicitada para tenant: ${tenantId}`);
    const client = createTuyaClient({
      region: appAccount.region || process.env.TUYA_REGION || 'us',
      baseUrl: appAccount.baseUrl || process.env.TUYA_BASE_URL || undefined,
    });
    const devices = await client.listDevicesByUid(appAccount.uid);
    console.log(`📡 Obtenidos ${devices.length} dispositivos desde Tuya API`);

    const syncedDevices = [];
    for (const device of devices) {
      const existing = await prisma.tuyaDevice.findUnique({
        where: { tuyaDeviceId: device.id },
      });
      
      if (existing) {
        const nameChanged = existing.name !== device.name;
        const statusChanged = existing.isOnline !== device.online;
        console.log(`📝 Actualizando: ${existing.name}${nameChanged ? ` → ${device.name}` : ''} (${device.online ? '🟢 Online' : '🔴 Offline'}${statusChanged ? ' - estado cambió' : ''})`);
      } else {
        console.log(`➕ Nuevo dispositivo: ${device.name} (${device.category})`);
      }
      
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
    console.log(`✅ Sincronización completada: ${syncedDevices.length} dispositivos actualizados`);

    res.json({
      ok: true,
      devicesCount: syncedDevices.length,
      lastSyncAt: new Date(),
    });
  } catch (error) {
    console.error('Error syncing Tuya devices:', error);
    res.status(500).json({ error: 'Failed to sync devices' });
  }
});

/**
 * PATCH /api/tuya/devices/:deviceId/lab
 * Asignar dispositivo Tuya a un laboratorio
 */
router.patch('/devices/:deviceId/lab', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { labId } = req.body;
    const tenantId = req.tenant!.id;

    console.log('🔄 Asignación de dispositivo Tuya:', { deviceId, labId, tenantId });

    // Verificar que el dispositivo pertenece al tenant
    const device = await prisma.tuyaDevice.findFirst({
      where: {
        id: deviceId,
        tenantId,
      },
    });

    if (!device) {
      console.error('❌ Dispositivo no encontrado:', { deviceId, tenantId });
      return res.status(404).json({ error: 'Device not found' });
    }

    console.log('✅ Dispositivo encontrado:', device.name);

    // Si se proporciona labId, verificar que el laboratorio pertenece al tenant
    if (labId) {
      console.log('🔍 Buscando laboratorio:', { labId, tenantId });
      
      const lab = await prisma.lab.findFirst({
        where: {
          id: labId,
          tenantId,
        },
      });

      console.log('📊 Resultado búsqueda lab:', lab);

      if (!lab) {
        // Listar todos los labs del tenant para debug
        const allLabs = await prisma.lab.findMany({
          where: { tenantId },
          select: { id: true, name: true },
        });
        console.error('❌ Lab no encontrado. Labs disponibles:', allLabs);
        return res.status(404).json({ 
          error: 'Lab not found',
          availableLabs: allLabs,
          requestedLabId: labId,
        });
      }

      console.log('✅ Lab encontrado:', lab.name);
    }

    // Actualizar la asignación
    const updatedDevice = await prisma.tuyaDevice.update({
      where: { id: deviceId },
      data: { labId: labId || null },
      include: {
        lab: true,
      },
    });

    console.log(`🔗 Dispositivo ${device.name} ${labId ? `asignado a laboratorio ${updatedDevice.lab?.name}` : 'desasignado de laboratorio'}`);

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
router.get('/app-accounts', requireAuth, requireTenant, async (req: Request, res: Response) => {
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

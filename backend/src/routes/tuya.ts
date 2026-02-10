/**
 * Tuya Integration Routes
 * Endpoints para gestionar dispositivos Smart Life / Tuya IoT
 */

import { Router, Request, Response } from 'express';
import { createTuyaClient } from '../services/tuyaClient';

const router = Router();

/**
 * GET /api/integrations/tuya/devices
 * Lista todos los dispositivos Tuya vinculados
 */
router.get('/devices', async (req: Request, res: Response) => {
  try {
    const client = createTuyaClient();
    const userId = req.query.user_id as string | undefined;
    
    const devices = await client.listDevices(userId);
    
    // Normalizar respuesta
    const normalizedDevices = devices.map(device => ({
      id: device.id,
      name: device.name,
      category: device.category,
      productName: device.product_name,
      online: device.online,
      status: device.status,
      icon: device.icon,
      createTime: device.create_time,
      updateTime: device.update_time,
      activeTime: device.active_time,
    }));

    res.json({
      success: true,
      count: normalizedDevices.length,
      devices: normalizedDevices,
    });
  } catch (error: any) {
    console.error('Error in GET /devices:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/integrations/tuya/devices/:deviceId
 * Obtiene el estado detallado de un dispositivo específico
 */
router.get('/devices/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const client = createTuyaClient();
    
    const device = await client.getDeviceStatus(deviceId);

    res.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        category: device.category,
        productName: device.product_name,
        online: device.online,
        status: device.status,
        icon: device.icon,
        ip: device.ip,
        timeZone: device.time_zone,
        createTime: device.create_time,
        updateTime: device.update_time,
        activeTime: device.active_time,
      },
    });
  } catch (error: any) {
    console.error(`Error in GET /devices/${req.params.deviceId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/integrations/tuya/devices/:deviceId/specifications
 * Obtiene las capacidades y especificaciones de un dispositivo
 */
router.get('/devices/:deviceId/specifications', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const client = createTuyaClient();
    
    const specs = await client.getDeviceSpecifications(deviceId);

    res.json({
      success: true,
      specifications: specs,
    });
  } catch (error: any) {
    console.error(`Error in GET /devices/${req.params.deviceId}/specifications:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * POST /api/integrations/tuya/devices/:deviceId/commands
 * Envía comandos a un dispositivo
 * Body: { commands: [{ code: 'switch', value: true }, ...] }
 */
router.post('/devices/:deviceId/commands', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { commands } = req.body;

    if (!commands || !Array.isArray(commands)) {
      return res.status(400).json({
        success: false,
        error: 'Commands array is required',
      });
    }

    // Validar estructura de comandos
    for (const cmd of commands) {
      if (!cmd.code || cmd.value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Each command must have code and value properties',
        });
      }
    }

    const client = createTuyaClient();
    const result = await client.sendCommands(deviceId, commands);

    res.json({
      success: result,
      message: result ? 'Commands sent successfully' : 'Failed to send commands',
      deviceId,
      commands,
    });
  } catch (error: any) {
    console.error(`Error in POST /devices/${req.params.deviceId}/commands:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/integrations/tuya/devices/:deviceId/logs
 * Obtiene el historial de logs de un dispositivo
 */
router.get('/devices/:deviceId/logs', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const startTime = req.query.start_time ? parseInt(req.query.start_time as string) : undefined;
    const endTime = req.query.end_time ? parseInt(req.query.end_time as string) : undefined;

    const client = createTuyaClient();
    const logs = await client.getDeviceLogs(deviceId, startTime, endTime);

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    console.error(`Error in GET /devices/${req.params.deviceId}/logs:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * POST /api/integrations/tuya/sync
 * Fuerza sincronización/refresh de dispositivos (para cache futuro)
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const client = createTuyaClient();
    const devices = await client.listDevices();

    // Aquí podrías guardar en DB si implementas cache
    // await saveTuyaDevicesToDB(devices);

    res.json({
      success: true,
      message: 'Devices synchronized successfully',
      count: devices.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in POST /sync:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/integrations/tuya/test
 * Endpoint de prueba para verificar conectividad
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const client = createTuyaClient();
    
    // Intentar obtener token
    await client.getAccessToken();
    
    // Intentar listar dispositivos
    const devices = await client.listDevices();

    res.json({
      success: true,
      message: 'Tuya integration is working correctly',
      region: process.env.TUYA_REGION || 'us',
      devicesFound: devices.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in GET /test:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Tuya integration test failed',
      details: error.response?.data || error.message,
    });
  }
});

export default router;

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware';

const prisma = new PrismaClient();

export const getMeasurements_handler = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const { batchId } = req.query;

    const where: any = {};
    if (batchId) {
      where.batchId = batchId as string;
    } else if (tenantId) {
      // Filter measurements through batch → tenant
      where.batch = { tenantId };
    }

    const measurements = await prisma.measurement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(measurements);
  } catch (err) {
    console.error('Error fetching measurements:', err);
    res.status(500).json({ error: 'Failed to get measurements' });
  }
};

export const createMeasurement = async (req: AuthRequest, res: Response) => {
  try {
    const { batchId, type, value, unit, source } = req.body;

    if (!batchId || !type || value === undefined) {
      return res.status(400).json({ error: 'batchId, type, and value are required' });
    }

    const measurement = await prisma.measurement.create({
      data: {
        batchId,
        type,
        value: parseFloat(value),
        unit: unit || '',
        source: source || 'manual',
      },
    });
    res.json(measurement);
  } catch (err) {
    console.error('Error creating measurement:', err);
    res.status(500).json({ error: 'Failed to create measurement' });
  }
};

export const getSensorData = async (req: Request, res: Response) => {
  try {
    const { labId } = req.params;
    const tenantId = (req as any).tenant?.id;
    const where: any = { labId };
    if (tenantId) where.tenantId = tenantId;

    const sensors = await prisma.sensor.findMany({ where });
    res.json(sensors);
  } catch (err) {
    console.error('Error fetching sensors:', err);
    res.status(500).json({ error: 'Failed to get sensors' });
  }
};

export const getLabRealtimeData = async (req: Request, res: Response) => {
  try {
    const { labId } = req.params;
    const tenantId = (req as any).tenant?.id;
    const sensorWhere: any = { labId };
    if (tenantId) sensorWhere.tenantId = tenantId;

    const sensors = await prisma.sensor.findMany({ where: sensorWhere });
    const measurements = await prisma.measurement.findMany({
      where: { batch: { labId } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ sensors, measurements });
  } catch (err) {
    console.error('Error fetching realtime data:', err);
    res.status(500).json({ error: 'Failed to get realtime data' });
  }
};

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSensors_handler = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { labId } = req.query;
    const where: any = { tenantId };
    if (labId) where.labId = labId as string;

    const sensors = await prisma.sensor.findMany({
      where,
      include: { lab: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ sensors });
  } catch (err) {
    console.error('Error fetching sensors:', err);
    res.status(500).json({ error: 'Failed to get sensors' });
  }
};

export const createSensor = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { labId, name, type } = req.body;
    if (!labId || !name || !type) {
      return res.status(400).json({ error: 'labId, name, and type are required' });
    }

    const sensor = await prisma.sensor.create({
      data: { tenantId, labId, name, type },
      include: { lab: { select: { id: true, name: true } } },
    });
    res.json({ sensor });
  } catch (err) {
    console.error('Error creating sensor:', err);
    res.status(500).json({ error: 'Failed to create sensor' });
  }
};

export const updateSensor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const existing = await prisma.sensor.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Sensor not found' });

    const { name, type, status, labId } = req.body;
    const sensor = await prisma.sensor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(labId !== undefined && { labId }),
      },
      include: { lab: { select: { id: true, name: true } } },
    });
    res.json({ sensor });
  } catch (err) {
    console.error('Error updating sensor:', err);
    res.status(500).json({ error: 'Failed to update sensor' });
  }
};

export const deleteSensor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const existing = await prisma.sensor.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Sensor not found' });

    await prisma.sensor.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting sensor:', err);
    res.status(500).json({ error: 'Failed to delete sensor' });
  }
};

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware';

const prisma = new PrismaClient();

export const getBatches_handler = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const batches = await prisma.batch.findMany({
      where,
      include: { genetics: true, lab: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(batches);
  } catch (err) {
    console.error('Error fetching batches:', err);
    res.status(500).json({ error: 'Failed to get batches' });
  }
};

export const createBatch = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { code, labId, geneticsId, state, plantCount, sowingDate, harvestDate, phenotype, notes } = req.body;

    if (!code || !labId || !geneticsId) {
      return res.status(400).json({ error: 'code, labId, and geneticsId are required' });
    }

    const batch = await prisma.batch.create({
      data: {
        code,
        tenantId,
        labId,
        geneticsId,
        state: state || 'VEGETATIVE',
        plantCount: plantCount ?? 0,
        sowingDate: new Date(sowingDate),
        harvestDate: harvestDate ? new Date(harvestDate) : null,
        phenotype: phenotype || null,
        notes: notes || null,
      },
      include: { genetics: true, lab: true },
    });
    res.json(batch);
  } catch (err) {
    console.error('Error creating batch:', err);
    res.status(500).json({ error: 'Failed to create batch' });
  }
};

export const getBatchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.id;
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;

    const batch = await prisma.batch.findFirst({
      where,
      include: { genetics: true, lab: true, operations: { orderBy: { createdAt: 'desc' } }, measurements: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json(batch);
  } catch (err) {
    console.error('Error fetching batch by id:', err);
    res.status(500).json({ error: 'Failed to get batch' });
  }
};

export const updateBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { state, plantCount, harvestDate, phenotype, notes } = req.body;

    const existing = await prisma.batch.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Batch not found' });

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        ...(state !== undefined && { state }),
        ...(plantCount !== undefined && { plantCount }),
        ...(harvestDate !== undefined && { harvestDate: harvestDate ? new Date(harvestDate) : null }),
        ...(phenotype !== undefined && { phenotype }),
        ...(notes !== undefined && { notes }),
      },
      include: { genetics: true, lab: true },
    });
    res.json(batch);
  } catch (err) {
    console.error('Error updating batch:', err);
    res.status(500).json({ error: 'Failed to update batch' });
  }
};

export const deleteBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const existing = await prisma.batch.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Batch not found' });

    await prisma.batch.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting batch:', err);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
};

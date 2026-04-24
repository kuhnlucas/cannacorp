import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware';

const prisma = new PrismaClient();

export const getOperations_handler = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const { batchId } = req.query;
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (batchId) where.batchId = batchId as string;

    const operations = await prisma.operation.findMany({
      where,
      include: { batch: true, lab: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(operations);
  } catch (err) {
    console.error('Error fetching operations:', err);
    res.status(500).json({ error: 'Failed to get operations' });
  }
};

export const createOperation = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { batchId, type, labId, data, notes } = req.body;

    if (!batchId || !type) {
      return res.status(400).json({ error: 'batchId and type are required' });
    }

    const operation = await prisma.operation.create({
      data: {
        tenantId,
        batchId,
        type,
        labId: labId || null,
        data: typeof data === 'string' ? data : JSON.stringify(data || {}),
        notes: notes || null,
        userId,
      },
      include: { batch: true, lab: true, user: { select: { id: true, name: true, email: true } } },
    });
    res.json(operation);
  } catch (err) {
    console.error('Error creating operation:', err);
    res.status(500).json({ error: 'Failed to create operation' });
  }
};

export const getOperationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.id;
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;

    const operation = await prisma.operation.findFirst({
      where,
      include: { batch: true, lab: true, user: { select: { id: true, name: true, email: true } } },
    });
    if (!operation) return res.status(404).json({ error: 'Operation not found' });
    res.json(operation);
  } catch (err) {
    console.error('Error fetching operation by id:', err);
    res.status(500).json({ error: 'Failed to get operation' });
  }
};

export const updateOperation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { type, data, notes } = req.body;

    const existing = await prisma.operation.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Operation not found' });

    const operation = await prisma.operation.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(data !== undefined && { data: typeof data === 'string' ? data : JSON.stringify(data) }),
        ...(notes !== undefined && { notes }),
      },
      include: { batch: true, lab: true, user: { select: { id: true, name: true, email: true } } },
    });
    res.json(operation);
  } catch (err) {
    console.error('Error updating operation:', err);
    res.status(500).json({ error: 'Failed to update operation' });
  }
};

export const deleteOperation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const existing = await prisma.operation.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Operation not found' });

    await prisma.operation.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting operation:', err);
    res.status(500).json({ error: 'Failed to delete operation' });
  }
};

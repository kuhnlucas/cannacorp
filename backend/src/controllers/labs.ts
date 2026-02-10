import { Request, Response } from 'express';
import { AuthRequest } from '../middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLabs_handler = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const labs = await prisma.lab.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
    
    res.json({ labs });
  } catch (err) {
    console.error('Error fetching labs:', err);
    res.status(500).json({ error: 'Failed to get labs' });
  }
};

export const createLab = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { name, type, m2, cycle } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const lab = await prisma.lab.create({
      data: {
        name,
        type,
        area: m2 || 0,
        cycle: cycle || '18/6',
        tenantId
      }
    });

    console.log('✅ Laboratorio creado:', lab.name, 'ID:', lab.id);
    res.json({ lab });
  } catch (err) {
    console.error('❌ Error creando laboratorio:', err);
    res.status(500).json({ error: 'Failed to create lab' });
  }
};

export const getLabById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.id;
    
    const lab = await prisma.lab.findFirst({
      where: { id, tenantId }
    });
    
    if (!lab) return res.status(404).json({ error: 'Lab not found' });
    res.json(lab);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get lab' });
  }
};

export const updateLab = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, area, cycle } = req.body;
    const tenantId = (req as any).tenant?.id;
    
    const lab = await prisma.lab.updateMany({
      where: { id, tenantId },
      data: { name, type, area, cycle }
    });
    
    if (lab.count === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }
    
    const updated = await prisma.lab.findUnique({ where: { id } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lab' });
  }
};

export const deleteLab = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenant?.id;
    
    await prisma.lab.deleteMany({
      where: { id, tenantId }
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete lab' });
  }
};


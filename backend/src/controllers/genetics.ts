import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware';

const prisma = new PrismaClient();

export const getGenetics_handler = async (req: Request, res: Response) => {
  try {
    const genetics = await prisma.genetics.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(genetics);
  } catch (err) {
    console.error('Error fetching genetics:', err);
    res.status(500).json({ error: 'Failed to get genetics' });
  }
};

export const createGenetics = async (req: AuthRequest, res: Response) => {
  try {
    const { name, breeder, origin, type, thcMin, thcMax, cbdMin, cbdMax, terpenes } = req.body;

    if (!name || !breeder) {
      return res.status(400).json({ error: 'Name and breeder are required' });
    }

    const gene = await prisma.genetics.create({
      data: {
        name,
        breeder,
        origin: origin || '',
        type: type || 'hybrid',
        thcMin: thcMin ?? 0,
        thcMax: thcMax ?? 0,
        cbdMin: cbdMin ?? 0,
        cbdMax: cbdMax ?? 0,
        terpenes: terpenes || '',
      },
    });
    res.json(gene);
  } catch (err) {
    console.error('Error creating genetics:', err);
    res.status(500).json({ error: 'Failed to create genetics' });
  }
};

export const getGeneticsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const gene = await prisma.genetics.findUnique({
      where: { id },
      include: { batches: true },
    });
    if (!gene) return res.status(404).json({ error: 'Genetics not found' });
    res.json(gene);
  } catch (err) {
    console.error('Error fetching genetics by id:', err);
    res.status(500).json({ error: 'Failed to get genetics' });
  }
};

export const updateGenetics = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, breeder, origin, type, thcMin, thcMax, cbdMin, cbdMax, terpenes } = req.body;

    const existing = await prisma.genetics.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Genetics not found' });

    const gene = await prisma.genetics.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(breeder !== undefined && { breeder }),
        ...(origin !== undefined && { origin }),
        ...(type !== undefined && { type }),
        ...(thcMin !== undefined && { thcMin }),
        ...(thcMax !== undefined && { thcMax }),
        ...(cbdMin !== undefined && { cbdMin }),
        ...(cbdMax !== undefined && { cbdMax }),
        ...(terpenes !== undefined && { terpenes }),
      },
    });
    res.json(gene);
  } catch (err) {
    console.error('Error updating genetics:', err);
    res.status(500).json({ error: 'Failed to update genetics' });
  }
};

export const deleteGenetics = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.genetics.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting genetics:', err);
    res.status(500).json({ error: 'Failed to delete genetics' });
  }
};

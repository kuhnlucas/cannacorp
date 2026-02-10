import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AuthRequest } from '../middleware';

const dbPath = path.join(process.cwd(), 'data');
const geneticsFile = path.join(dbPath, 'genetics.json');

const ensureDbDir = () => {
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
};

const getGenetics = () => {
  ensureDbDir();
  if (!fs.existsSync(geneticsFile)) return [];
  return JSON.parse(fs.readFileSync(geneticsFile, 'utf-8'));
};

const saveGenetics = (genetics: any) => {
  ensureDbDir();
  fs.writeFileSync(geneticsFile, JSON.stringify(genetics, null, 2));
};

export const getGenetics_handler = (req: Request, res: Response) => {
  try {
    const genetics = getGenetics();
    res.json(genetics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get genetics' });
  }
};

export const createGenetics = (req: AuthRequest, res: Response) => {
  try {
    const { name, breeder, origin, type, thcMin, thcMax, cbdMin, cbdMax, terpenes } = req.body;
    const genetics = getGenetics();
    const newGene = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      breeder,
      origin,
      type,
      thcMin,
      thcMax,
      cbdMin,
      cbdMax,
      terpenes,
      createdAt: new Date().toISOString()
    };
    genetics.push(newGene);
    saveGenetics(genetics);
    res.json(newGene);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create genetics' });
  }
};

export const getGeneticsById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const genetics = getGenetics();
    const gene = genetics.find((g: any) => g.id === id);
    if (!gene) return res.status(404).json({ error: 'Genetics not found' });
    res.json(gene);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get genetics' });
  }
};

export const updateGenetics = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, breeder, origin, type, thcMin, thcMax, cbdMin, cbdMax, terpenes } = req.body;
    let genetics = getGenetics();
    const index = genetics.findIndex((g: any) => g.id === id);
    if (index === -1) return res.status(404).json({ error: 'Genetics not found' });
    genetics[index] = { ...genetics[index], name, breeder, origin, type, thcMin, thcMax, cbdMin, cbdMax, terpenes };
    saveGenetics(genetics);
    res.json(genetics[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update genetics' });
  }
};

export const deleteGenetics = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let genetics = getGenetics();
    genetics = genetics.filter((g: any) => g.id !== id);
    saveGenetics(genetics);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete genetics' });
  }
};

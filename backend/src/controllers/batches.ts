import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AuthRequest } from '../middleware';

const dbPath = path.join(process.cwd(), 'data');
const batchesFile = path.join(dbPath, 'batches.json');

const ensureDbDir = () => {
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
};

const getBatches = () => {
  ensureDbDir();
  if (!fs.existsSync(batchesFile)) return [];
  return JSON.parse(fs.readFileSync(batchesFile, 'utf-8'));
};

const saveBatches = (batches: any) => {
  ensureDbDir();
  fs.writeFileSync(batchesFile, JSON.stringify(batches, null, 2));
};

export const getBatches_handler = (req: Request, res: Response) => {
  try {
    const batches = getBatches();
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get batches' });
  }
};

export const createBatch = (req: AuthRequest, res: Response) => {
  try {
    const { code, labId, geneticsId, state, plantCount, sowingDate, harvestDate, phenotype, notes } = req.body;
    const batches = getBatches();
    const batch = {
      id: Math.random().toString(36).substr(2, 9),
      code,
      labId,
      geneticsId,
      state,
      plantCount,
      sowingDate,
      harvestDate: harvestDate || null,
      phenotype,
      notes,
      createdAt: new Date().toISOString()
    };
    batches.push(batch);
    saveBatches(batches);
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create batch' });
  }
};

export const getBatchById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const batches = getBatches();
    const batch = batches.find((b: any) => b.id === id);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get batch' });
  }
};

export const updateBatch = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { state, plantCount, harvestDate, phenotype, notes } = req.body;
    let batches = getBatches();
    const index = batches.findIndex((b: any) => b.id === id);
    if (index === -1) return res.status(404).json({ error: 'Batch not found' });
    batches[index] = { ...batches[index], state, plantCount, harvestDate, phenotype, notes };
    saveBatches(batches);
    res.json(batches[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update batch' });
  }
};

export const deleteBatch = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let batches = getBatches();
    batches = batches.filter((b: any) => b.id !== id);
    saveBatches(batches);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete batch' });
  }
};

import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AuthRequest } from '../middleware';

const dbPath = path.join(process.cwd(), 'data');
const operationsFile = path.join(dbPath, 'operations.json');

const ensureDbDir = () => {
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
};

const getOperations = () => {
  ensureDbDir();
  if (!fs.existsSync(operationsFile)) return [];
  return JSON.parse(fs.readFileSync(operationsFile, 'utf-8'));
};

const saveOperations = (operations: any) => {
  ensureDbDir();
  fs.writeFileSync(operationsFile, JSON.stringify(operations, null, 2));
};

export const getOperations_handler = (req: Request, res: Response) => {
  try {
    const { batchId } = req.query;
    let operations = getOperations();
    if (batchId) operations = operations.filter((op: any) => op.batchId === batchId);
    res.json(operations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get operations' });
  }
};

export const createOperation = (req: AuthRequest, res: Response) => {
  try {
    const { batchId, type, lab, room, data, notes } = req.body;
    const operations = getOperations();
    const operation = {
      id: Math.random().toString(36).substr(2, 9),
      batchId,
      type,
      lab,
      room,
      data,
      notes,
      userId: req.userId,
      createdAt: new Date().toISOString()
    };
    operations.push(operation);
    saveOperations(operations);
    res.json(operation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create operation' });
  }
};

export const getOperationById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const operations = getOperations();
    const operation = operations.find((op: any) => op.id === id);
    if (!operation) return res.status(404).json({ error: 'Operation not found' });
    res.json(operation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get operation' });
  }
};

export const deleteOperation = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let operations = getOperations();
    operations = operations.filter((op: any) => op.id !== id);
    saveOperations(operations);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete operation' });
  }
};

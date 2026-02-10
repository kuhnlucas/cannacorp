import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AuthRequest } from '../middleware';

const dbPath = path.join(process.cwd(), 'data');
const measurementsFile = path.join(dbPath, 'measurements.json');
const sensorsFile = path.join(dbPath, 'sensors.json');

const ensureDbDir = () => {
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
};

const getMeasurements = () => {
  ensureDbDir();
  if (!fs.existsSync(measurementsFile)) return [];
  return JSON.parse(fs.readFileSync(measurementsFile, 'utf-8'));
};

const saveMeasurements = (measurements: any) => {
  ensureDbDir();
  fs.writeFileSync(measurementsFile, JSON.stringify(measurements, null, 2));
};

const getSensors = () => {
  ensureDbDir();
  if (!fs.existsSync(sensorsFile)) return [];
  return JSON.parse(fs.readFileSync(sensorsFile, 'utf-8'));
};

const saveSensors = (sensors: any) => {
  ensureDbDir();
  fs.writeFileSync(sensorsFile, JSON.stringify(sensors, null, 2));
};

export const getMeasurements_handler = (req: Request, res: Response) => {
  try {
    const { batchId } = req.query;
    let measurements = getMeasurements();
    if (batchId) measurements = measurements.filter((m: any) => m.batchId === batchId);
    res.json(measurements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get measurements' });
  }
};

export const createMeasurement = (req: AuthRequest, res: Response) => {
  try {
    const { batchId, type, value, unit, source } = req.body;
    const measurements = getMeasurements();
    const measurement = {
      id: Math.random().toString(36).substr(2, 9),
      batchId,
      type,
      value,
      unit,
      source: source || 'manual',
      createdAt: new Date().toISOString()
    };
    measurements.push(measurement);
    saveMeasurements(measurements);
    res.json(measurement);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create measurement' });
  }
};

export const getSensorData = (req: Request, res: Response) => {
  try {
    const { labId } = req.params;
    const sensors = getSensors().filter((s: any) => s.labId === labId);
    res.json(sensors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get sensors' });
  }
};

export const getLabRealtimeData = (req: Request, res: Response) => {
  try {
    const { labId } = req.params;
    const sensors = getSensors().filter((s: any) => s.labId === labId);
    const measurements = getMeasurements().slice(-100);
    res.json({ sensors, measurements });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get realtime data' });
  }
};

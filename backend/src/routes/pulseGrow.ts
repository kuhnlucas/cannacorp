import express from 'express';
import { getRecentData, getAllDevices, getDeviceHistory } from '../services/pulseGrowService';

const router = express.Router();


// GET /api/sensors/pulsegrow/devices
router.get('/devices', async (req, res) => {
  try {
    const devices = await getAllDevices();
    res.json(devices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/pulsegrow/:deviceId/recent
router.get('/:deviceId/recent', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const data = await getRecentData(deviceId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/pulsegrow/:deviceId/history?start=...&end=...
router.get('/:deviceId/history', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { start, end } = req.query;
    if (!start) return res.status(400).json({ error: 'start query param required (ISO8601)' });
    const data = await getDeviceHistory(deviceId, String(start), end ? String(end) : undefined);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

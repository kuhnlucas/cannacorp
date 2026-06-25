import axios from 'axios';
import config from '../config';

const PULSE_GROW_API_URL = config.pulseGrowApiUrl;
const API_KEY = config.pulseGrowApiKey || '';

if (!API_KEY) {
  // Keep silent on startup; endpoints using Pulse should throw if required at call time.
}


// List all devices with latest data
export async function getAllDevices() {
  if (!API_KEY) throw new Error('Pulse Grow API key not configured');
  const url = `${PULSE_GROW_API_URL}/all-devices`;
  const client = axios.create({ baseURL: PULSE_GROW_API_URL, timeout: 15000 });
  const response = await client.get('/all-devices', {
    headers: {
      'x-api-key': API_KEY,
    },
  });
  return response.data;
}

// Get recent data for a device
export async function getRecentData(deviceId: string) {
  if (!API_KEY) throw new Error('Pulse Grow API key not configured');
  const client = axios.create({ baseURL: PULSE_GROW_API_URL, timeout: 15000 });
  const response = await client.get(`/devices/${deviceId}/recent-data`, {
    headers: { 'x-api-key': API_KEY },
  });
  return response.data;
}

// Get historical data for a device
export async function getDeviceHistory(deviceId: string, start: string, end?: string) {
  if (!API_KEY) throw new Error('Pulse Grow API key not configured');
  const client = axios.create({ baseURL: PULSE_GROW_API_URL, timeout: 15000 });
  const params: any = { start };
  if (end) params.end = end;
  const response = await client.get(`/devices/${deviceId}/data-range`, {
    headers: { 'x-api-key': API_KEY },
    params,
  });
  return response.data;
}

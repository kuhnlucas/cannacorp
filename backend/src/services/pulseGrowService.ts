import axios, { AxiosInstance } from 'axios';
import config from '../config';

// Module-level client — created once and reused.
// Reads baseURL from config (never from process.env directly).
// API key is intentionally NOT logged anywhere.
const client: AxiosInstance = axios.create({
  baseURL: config.pulseGrowApiUrl,
  timeout: 15_000,
});

/**
 * Returns the API key or throws a clear error at call time.
 * Keeps startup silent so the app boots even when Pulse is not configured.
 */
function requireApiKey(): string {
  const key = config.pulseGrowApiKey;
  if (!key) throw new Error('Pulse Grow API key not configured');
  return key;
}

// ---------------------------------------------------------------------------
// Public API (names unchanged — existing routes depend on these)
// ---------------------------------------------------------------------------

// List all devices with latest data
export async function getAllDevices() {
  const key = requireApiKey();
  const response = await client.get('/all-devices', {
    headers: { 'x-api-key': key },
  });
  return response.data;
}

// Get recent data for a device
export async function getRecentData(deviceId: string) {
  const key = requireApiKey();
  const response = await client.get(`/devices/${deviceId}/recent-data`, {
    headers: { 'x-api-key': key },
  });
  return response.data;
}

// Get historical data for a device
export async function getDeviceHistory(deviceId: string, start: string, end?: string) {
  const key = requireApiKey();
  const params: Record<string, string> = { start };
  if (end) params.end = end;
  const response = await client.get(`/devices/${deviceId}/data-range`, {
    headers: { 'x-api-key': key },
    params,
  });
  return response.data;
}

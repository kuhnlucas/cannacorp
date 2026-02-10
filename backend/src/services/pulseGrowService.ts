import axios from 'axios';


const PULSE_GROW_API_URL = process.env.PULSE_GROW_API_URL || 'https://api.pulsegrow.com';
const API_KEY = process.env.PULSE_GROW_API_KEY || '';

if (!API_KEY) {
  console.warn('Pulse Grow API key not set. Set PULSE_GROW_API_KEY in your environment.');
}


// List all devices with latest data
export async function getAllDevices() {
  if (!API_KEY) throw new Error('Pulse Grow API key not configured');
  const url = `${PULSE_GROW_API_URL}/all-devices`;
  const response = await axios.get(url, {
    headers: {
      'x-api-key': API_KEY
    }
  });
  return response.data;
}

// Get recent data for a device
export async function getRecentData(deviceId: string) {
  if (!API_KEY) throw new Error('Pulse Grow API key not configured');
  const url = `${PULSE_GROW_API_URL}/devices/${deviceId}/recent-data`;
  const response = await axios.get(url, {
    headers: {
      'x-api-key': API_KEY
    }
  });
  return response.data;
}

// Get historical data for a device
export async function getDeviceHistory(deviceId: string, start: string, end?: string) {
  if (!API_KEY) throw new Error('Pulse Grow API key not configured');
  let url = `${PULSE_GROW_API_URL}/devices/${deviceId}/data-range?start=${encodeURIComponent(start)}`;
  if (end) url += `&end=${encodeURIComponent(end)}`;
  const response = await axios.get(url, {
    headers: {
      'x-api-key': API_KEY
    }
  });
  return response.data;
}

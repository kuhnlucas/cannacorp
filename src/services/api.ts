// API Service for CannaCorp Frontend
// Handles all communication with the backend API

const API_URL = 'http://localhost:3000/api';

// Helper function to get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to get tenant ID from localStorage
const getTenantId = (): string | null => {
  return localStorage.getItem('selectedTenantId');
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const tenantId = getTenantId();
  
  console.log('🔐 fetchWithAuth:', { 
    url, 
    hasToken: !!token, 
    hasTenantId: !!tenantId,
    token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
    tenantId 
  });
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  } else {
    console.error('❌ No hay token en localStorage. Usuario no autenticado.');
  }

  if (tenantId) {
    (headers as any)['X-Tenant-Id'] = tenantId;
  } else {
    console.warn('⚠️ No hay tenantId en localStorage.');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    console.error('❌ Error en la respuesta:', { status: response.status, url });
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

export const api = {
  // ===== Authentication =====
  auth: {
    register: (email: string, password: string, name: string) =>
      fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      }).then(r => r.json()),

    login: (email: string, password: string) =>
      fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(r => r.json()),
  },

  // ===== Labs =====
  labs: {
    getAll: () => fetchWithAuth(`${API_URL}/labs`),

    getById: (id: string) => fetchWithAuth(`${API_URL}/labs/${id}`),

    create: (data: any) =>
      fetchWithAuth(`${API_URL}/labs`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      fetchWithAuth(`${API_URL}/labs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchWithAuth(`${API_URL}/labs/${id}`, {
        method: 'DELETE',
      }),
  },

  // ===== Genetics =====
  genetics: {
    getAll: () => fetchWithAuth(`${API_URL}/genetics`),

    getById: (id: string) => fetchWithAuth(`${API_URL}/genetics/${id}`),

    create: (data: any) =>
      fetchWithAuth(`${API_URL}/genetics`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      fetchWithAuth(`${API_URL}/genetics/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchWithAuth(`${API_URL}/genetics/${id}`, {
        method: 'DELETE',
      }),
  },

  // ===== Batches =====
  batches: {
    getAll: () => fetchWithAuth(`${API_URL}/batches`),

    getById: (id: string) => fetchWithAuth(`${API_URL}/batches/${id}`),

    create: (data: any) =>
      fetchWithAuth(`${API_URL}/batches`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      fetchWithAuth(`${API_URL}/batches/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchWithAuth(`${API_URL}/batches/${id}`, {
        method: 'DELETE',
      }),
  },

  // ===== Operations =====
  operations: {
    getAll: () => fetchWithAuth(`${API_URL}/operations`),

    getByBatchId: (batchId: string) =>
      fetchWithAuth(`${API_URL}/operations?batchId=${batchId}`),

    getById: (id: string) => fetchWithAuth(`${API_URL}/operations/${id}`),

    create: (data: any) =>
      fetchWithAuth(`${API_URL}/operations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchWithAuth(`${API_URL}/operations/${id}`, {
        method: 'DELETE',
      }),
  },

  // ===== Monitoring =====
  monitoring: {
    getMeasurements: (batchId?: string) => {
      const url = batchId
        ? `${API_URL}/monitoring/measurements?batchId=${batchId}`
        : `${API_URL}/monitoring/measurements`;
      return fetchWithAuth(url);
    },

    createMeasurement: (data: any) =>
      fetchWithAuth(`${API_URL}/monitoring/measurements`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getSensors: (labId: string) =>
      fetchWithAuth(`${API_URL}/monitoring/sensors/${labId}`),

    getRealtimeData: (labId: string) =>
      fetchWithAuth(`${API_URL}/monitoring/realtime/${labId}`),
  },

  // ===== Pulse Grow Integration =====
  pulseGrow: {
    // Get all devices with latest data
    getAllDevices: () =>
      fetch(`${API_URL}/sensors/pulsegrow/devices`).then(r => r.json()),

    // Get recent data for a specific device
    getRecentData: (deviceId: string) =>
      fetch(`${API_URL}/sensors/pulsegrow/${deviceId}/recent`).then(r => r.json()),

    // Get historical data for a device
    getDeviceHistory: (deviceId: string, start: string, end?: string) => {
      const url = end
        ? `${API_URL}/sensors/pulsegrow/${deviceId}/history?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
        : `${API_URL}/sensors/pulsegrow/${deviceId}/history?start=${encodeURIComponent(start)}`;
      return fetch(url).then(r => r.json());
    },
  },
};

export default api;

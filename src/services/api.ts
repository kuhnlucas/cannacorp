// API Service for CannaCorp Frontend
// Handles all communication with the backend API

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Callback registrado por AuthContext para ejecutar logout ante 401.
let _onAuthError: (() => void) | null = null;
// Flag que evita múltiples logout ante requests 401 simultáneas.
// Se resetea automáticamente cada vez que se registra un nuevo handler (login).
let _isHandlingAuthError = false;

export const setAuthErrorHandler = (handler: () => void): void => {
  _onAuthError = handler;
  _isHandlingAuthError = false; // siempre resetear al registrar (login o mount)
};

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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    if (_onAuthError && !_isHandlingAuthError) {
      console.warn('⚠️ fetchWithAuth: sesión expirada, ejecutando logout');
      _isHandlingAuthError = true;
      _onAuthError();
    }
    throw new Error('AUTH_ERROR');
  }

  if (!response.ok) {
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

  // ===== Tenants =====
  tenants: {
    getAll: () => fetchWithAuth(`${API_URL}/tenants`),
    getById: (id: string) => fetchWithAuth(`${API_URL}/tenants/${id}`),
    create: (name: string) =>
      fetchWithAuth(`${API_URL}/tenants`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
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
    getAllDevices: () =>
      fetchWithAuth(`${API_URL}/sensors/pulsegrow/devices`),

    getRecentData: (deviceId: string) =>
      fetchWithAuth(`${API_URL}/sensors/pulsegrow/${deviceId}/recent`),

    getDeviceHistory: (deviceId: string, start: string, end?: string) => {
      const url = end
        ? `${API_URL}/sensors/pulsegrow/${deviceId}/history?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
        : `${API_URL}/sensors/pulsegrow/${deviceId}/history?start=${encodeURIComponent(start)}`;
      return fetchWithAuth(url);
    },
  },

  // ===== Tuya Smart Life =====
  tuya: {
    getDevices: () => fetchWithAuth(`${API_URL}/tuya/devices`),

    syncDevices: () =>
      fetchWithAuth(`${API_URL}/tuya/sync`, { method: 'POST' }),

    assignDeviceToLab: (deviceId: string, labId: string | null) =>
      fetchWithAuth(`${API_URL}/tuya/devices/${deviceId}/lab`, {
        method: 'PATCH',
        body: JSON.stringify({ labId }),
      }),

    validateAppAccount: (uid: string) =>
      fetchWithAuth(`${API_URL}/tuya/app-accounts/validate`, {
        method: 'POST',
        body: JSON.stringify({ uid }),
      }),
  },

  // ===== Dashboard =====
  dashboard: {
    getStats: () => fetchWithAuth(`${API_URL}/dashboard/stats`),
    getActivity: () => fetchWithAuth(`${API_URL}/dashboard/activity`),
  },

  // ===== Sensors =====
  sensors: {
    getAll: () => fetchWithAuth(`${API_URL}/sensors`),
    getByLab: (labId: string) => fetchWithAuth(`${API_URL}/sensors?labId=${labId}`),
  },
};

export default api;

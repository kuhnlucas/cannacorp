import { useState, useEffect } from 'react';
import { Wifi, Zap, Thermometer, Droplets, Wind, Sun, Leaf } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import TuyaLinkWizard from '../components/TuyaLinkWizard';
import { useTenant } from '../contexts/TenantContext';
import api, { EdenicDevice, EdenicTelemetryResponse, EdenicTelemetryKey } from '../services/api';

interface PulseGrowDevice {
  id: string;
  deviceName: string;
  mostRecentDataPoint?: {
    temperature?: number;
    temperatureF?: number;
    humidityRh?: number;
    vpd?: number;
    lightLux?: number;
    timestamp: string;
  };
}

interface TuyaDevice {
  id: string;
  name: string;
  category: string;
  productName: string;
  online: boolean;
  status: Array<{
    code: string;
    value: any;
  }>;
  icon?: string;
}

// ---------------------------------------------------------------------------
// Edenic telemetry helpers (module-level, no state dependency)
// ---------------------------------------------------------------------------
const EDENIC_TELEMETRY_COOLDOWN_MS = 60_000;
const EDENIC_TELEMETRY_KEYS: EdenicTelemetryKey[] = [
  'ph',
  'temperature',
  'electrical_conductivity',
];

const EDENIC_HISTORY_COOLDOWN_MS = 60_000;
const EDENIC_HISTORY_INTERVAL_MS = 5 * 60 * 1_000;
const EDENIC_HISTORY_RANGE_MS = 2 * 60 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Minimal SVG sparkline — no external dependency
// ---------------------------------------------------------------------------

// Keep sparkline consistent with displayed values to avoid amplifying invisible decimal changes.
const getDisplayPrecision = (key: string): number => {
  if (key === 'temperature') return 1;
  if (key === 'ph') return 2;
  if (key === 'electrical_conductivity') return 2;
  return 2;
};

const roundForDisplay = (value: number, precision: number): number =>
  Number(value.toFixed(precision));

function MiniSparkline({
  points,
  color,
  precision = 2,
}: {
  points: { ts: number; value: string | number }[];
  color: string;
  precision?: number;
}) {
  const validPoints = points.filter(
    (p) => p.value !== null && p.value !== undefined && p.value !== '' && !isNaN(Number(p.value))
  );
  if (validPoints.length < 2) return null;
  // Round to display precision so sparkline matches the table values shown to the user.
  const values = validPoints.map((p) => roundForDisplay(Number(p.value), precision));
  const min = Math.min(...values);
  const max = Math.max(...values);
  // If all rounded values are equal, range = 0 → flat line (correct, no amplification).
  const range = max - min || 1;
  const W = 80;
  const H = 24;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={W} height={H} className="flex-shrink-0">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

const getLatestTelemetryValue = (
  telemetry: EdenicTelemetryResponse | undefined,
  key: string
) => {
  const points = telemetry?.telemetry?.[key as EdenicTelemetryKey];
  // No points or empty array -> no data
  if (!points || points.length === 0) return null;
  const point = points[0];
  // Treat explicit null/undefined/empty-string as missing data
  if (point == null) return null;
  const v = (point as any).value;
  if (v === null || v === undefined || v === '') return null;
  return point;
};

export default function Sensors() {
  const { selectedTenant } = useTenant();
  const [pulseGrowDevices, setPulseGrowDevices] = useState<PulseGrowDevice[]>([]);
  const [tuyaDevices, setTuyaDevices] = useState<TuyaDevice[]>([]);
  const [loadingPulse, setLoadingPulse] = useState(true);
  const [loadingTuya, setLoadingTuya] = useState(true);
  const [activeTab, setActiveTab] = useState<'pulse' | 'tuya' | 'edenic'>('pulse');
  const [showWizard, setShowWizard] = useState(false);
  const [edicDevices, setEdicDevices] = useState<EdenicDevice[]>([]);
  const [loadingEdenic, setLoadingEdenic] = useState(false);
  const [edicError, setEdicError] = useState<string | null>(null);
  const [edicFetchedForTenant, setEdicFetchedForTenant] = useState<string | null>(null);
  const [edenicTelemetryByDevice, setEdenicTelemetryByDevice] = useState<Record<string, EdenicTelemetryResponse>>({});
  const [loadingEdenicTelemetry, setLoadingEdenicTelemetry] = useState<Record<string, boolean>>({});
  const [edenicTelemetryErrors, setEdenicTelemetryErrors] = useState<Record<string, string>>({});
  const [edenicTelemetryFetchedAt, setEdenicTelemetryFetchedAt] = useState<Record<string, number>>({});
  const [edenicHistoryByDevice, setEdenicHistoryByDevice] = useState<Record<string, EdenicTelemetryResponse>>({});
  const [loadingEdenicHistory, setLoadingEdenicHistory] = useState<Record<string, boolean>>({});
  const [edenicHistoryErrors, setEdenicHistoryErrors] = useState<Record<string, string>>({});
  const [edenicHistoryFetchedAt, setEdenicHistoryFetchedAt] = useState<Record<string, number>>({});
  const [expandedEdenicHistoryDevice, setExpandedEdenicHistoryDevice] = useState<string | null>(null);

  useEffect(() => {
    fetchPulseGrowData();
    
    // Refresh cada 30 segundos solo para PulseGrow
    const interval = setInterval(() => {
      fetchPulseGrowData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Cargar datos de Tuya cuando cambie el tenant seleccionado
  useEffect(() => {
    fetchTuyaData();
  }, [selectedTenant]);

  const fetchPulseGrowData = async () => {
    try {
      const data = await api.pulseGrow.getAllDevices();
      setPulseGrowDevices(data.deviceViewDtos || []);
    } catch (error) {
      console.error('Error fetching Pulse Grow data:', error);
    } finally {
      setLoadingPulse(false);
    }
  };

  const fetchTuyaData = async () => {
    if (!selectedTenant) {
      setTuyaDevices([]);
      setLoadingTuya(false);
      return;
    }

    setLoadingTuya(true);
    try {
      const data = await api.tuya.getDevices();
      setTuyaDevices(data.devices || []);
    } catch (error) {
      console.error('Error fetching Tuya data:', error);
      setTuyaDevices([]);
    } finally {
      setLoadingTuya(false);
    }
  };

  const syncTuyaDevices = async () => {
    if (!selectedTenant) return;
    
    setLoadingTuya(true);
    try {
      const data = await api.tuya.syncDevices();
      // Reload devices after sync
      await fetchTuyaData();
    } catch (error) {
      console.error('Error syncing Tuya devices:', error);
    } finally {
      setLoadingTuya(false);
    }
  };

  const fetchEdenicData = async () => {
    if (!selectedTenant) return;
    setEdicDevices([]);
    setEdicError(null);
    setLoadingEdenic(true);
    try {
      const data = await api.edenic.getDevices();
      setEdicDevices(data.devices || []);
      setEdicFetchedForTenant(selectedTenant.id);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('403')) {
        setEdicError('forbidden');
      } else if (msg.includes('400')) {
        setEdicError('bad_request');
      } else {
        setEdicError('general');
      }
    } finally {
      setLoadingEdenic(false);
    }
  };

  const fetchEdenicTelemetry = async (deviceId: string) => {
    if (!deviceId) return;
    if (loadingEdenicTelemetry[deviceId]) return;
    const now = Date.now();
    const lastFetch = edenicTelemetryFetchedAt[deviceId];
    if (lastFetch && now - lastFetch < EDENIC_TELEMETRY_COOLDOWN_MS) return;
    setLoadingEdenicTelemetry(prev => ({ ...prev, [deviceId]: true }));
    setEdenicTelemetryErrors(prev => {
      const next = { ...prev };
      delete next[deviceId];
      return next;
    });
    try {
      const data = await api.edenic.getLatestTelemetry(deviceId, EDENIC_TELEMETRY_KEYS);
      setEdenicTelemetryByDevice(prev => ({ ...prev, [deviceId]: data }));
      setEdenicTelemetryFetchedAt(prev => ({ ...prev, [deviceId]: Date.now() }));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      let friendlyError: string;
      if (msg.includes('403')) {
        friendlyError = 'No tenés permisos para consultar mediciones Edenic en este tenant.';
      } else if (msg.includes('429')) {
        friendlyError = 'Edenic limitó la frecuencia de consultas. Probá nuevamente en un minuto.';
      } else if (msg.includes('400')) {
        friendlyError = 'Seleccioná el tenant Edenic autorizado para consultar mediciones.';
      } else {
        friendlyError = 'No se pudieron cargar las mediciones Edenic.';
      }
      setEdenicTelemetryErrors(prev => ({ ...prev, [deviceId]: friendlyError }));
    } finally {
      setLoadingEdenicTelemetry(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  const fetchEdenicHistory = async (deviceId: string) => {
    if (!deviceId) return;
    if (loadingEdenicHistory[deviceId]) return;
    const now = Date.now();
    const lastFetch = edenicHistoryFetchedAt[deviceId];
    if (lastFetch && now - lastFetch < EDENIC_HISTORY_COOLDOWN_MS) return;
    setLoadingEdenicHistory((prev) => ({ ...prev, [deviceId]: true }));
    setEdenicHistoryErrors((prev) => {
      const next = { ...prev };
      delete next[deviceId];
      return next;
    });
    try {
      const endTs = Date.now();
      const startTs = endTs - EDENIC_HISTORY_RANGE_MS;
      const data = await api.edenic.getTelemetryHistory(deviceId, {
        keys: ['ph', 'temperature', 'electrical_conductivity'],
        startTs,
        endTs,
        interval: EDENIC_HISTORY_INTERVAL_MS,
        agg: 'AVG',
        orderBy: 'ASC',
      });
      setEdenicHistoryByDevice((prev) => ({ ...prev, [deviceId]: data }));
      setEdenicHistoryFetchedAt((prev) => ({ ...prev, [deviceId]: Date.now() }));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      let friendlyError: string;
      if (msg.includes('403')) {
        friendlyError = 'No tenés permisos para consultar histórico Edenic en este tenant.';
      } else if (msg.includes('400')) {
        friendlyError = 'Seleccioná el tenant Edenic autorizado para consultar histórico.';
      } else if (msg.includes('429')) {
        friendlyError = 'Edenic limitó la frecuencia de consultas. Probá nuevamente en un minuto.';
      } else {
        friendlyError = 'No se pudo cargar el histórico Edenic.';
      }
      setEdenicHistoryErrors((prev) => ({ ...prev, [deviceId]: friendlyError }));
    } finally {
      setLoadingEdenicHistory((prev) => ({ ...prev, [deviceId]: false }));
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab !== 'edenic') return;
    if (!selectedTenant) return;
    const isAllowed = selectedTenant.role === 'OWNER' || selectedTenant.role === 'ADMIN';
    if (!isAllowed) return;
    if (edicFetchedForTenant === selectedTenant.id) return;
    fetchEdenicData();
  }, [activeTab, selectedTenant]);

  // Limpiar cache de telemetría y histórico Edenic al cambiar de tenant
  useEffect(() => {
    setEdenicTelemetryByDevice({});
    setLoadingEdenicTelemetry({});
    setEdenicTelemetryErrors({});
    setEdenicTelemetryFetchedAt({});
    setEdenicHistoryByDevice({});
    setLoadingEdenicHistory({});
    setEdenicHistoryErrors({});
    setEdenicHistoryFetchedAt({});
    setExpandedEdenicHistoryDevice(null);
  }, [selectedTenant?.id]);

  const convertFtoC = (fahrenheit: number) => {
    return ((fahrenheit - 32) * 5) / 9;
  };

  const getStatusValue = (device: TuyaDevice, code: string) => {
    const status = device.status?.find(s => s.code === code);
    return status?.value;
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'wsdcg': 'Sensor Temp/Humedad',
      'dj': 'Luz',
      'cz': 'Enchufe',
      'kg': 'Interruptor',
      'cl': 'Cortina',
      'wk': 'Termostato',
    };
    return categories[category] || category;
  };

  const isEdenicUser = selectedTenant?.role === 'OWNER' || selectedTenant?.role === 'ADMIN';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Sensores
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitoreo en tiempo real de sensores Pulse Grow y dispositivos Tuya Smart Life
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('pulse')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'pulse'
              ? 'border-green-600 text-green-600 dark:border-green-500 dark:text-green-500'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Pulse Grow ({pulseGrowDevices.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('tuya')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'tuya'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Tuya Smart Life ({tuyaDevices.length})
          </div>
        </button>
        {isEdenicUser && (
          <button
            onClick={() => setActiveTab('edenic')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'edenic'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-500'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Edenic ({edicDevices.length})
            </div>
          </button>
        )}
      </div>

      {/* Pulse Grow Sensors */}
      {activeTab === 'pulse' && (
        <div>
          {loadingPulse ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando sensores Pulse Grow...</p>
            </div>
          ) : pulseGrowDevices.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Wifi className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No hay sensores Pulse Grow disponibles
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pulseGrowDevices.map((device) => {
                const data = device.mostRecentDataPoint;
                const tempC = data?.temperatureF ? convertFtoC(data.temperatureF) : data?.temperature;

                return (
                  <Card key={device.id}>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {device.deviceName}
                        </h3>
                        <Badge variant="success" size="sm">
                          <Wifi className="h-3 w-3" />
                        </Badge>
                      </div>
                    </div>

                    {data ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="flex items-start gap-2">
                            <Thermometer className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Temperatura
                              </div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {tempC?.toFixed(1)}°C
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Droplets className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Humedad
                              </div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {data.humidityRh?.toFixed(1)}%
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Wind className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                VPD
                              </div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {data.vpd?.toFixed(2)} kPa
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Sun className="h-3.5 w-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Luz
                              </div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {data.lightLux?.toFixed(0)} lux
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {data.temperatureF && (
                              <span className="mr-3">
                                {data.temperatureF.toFixed(1)}°F
                              </span>
                            )}
                            <span className="text-gray-400">
                              {new Date(data.timestamp).toLocaleString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                        Sin datos recientes
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tuya Devices */}
      {activeTab === 'tuya' && (
        <div>
          {/* Sync button */}
          {tuyaDevices.length > 0 && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={syncTuyaDevices}
                disabled={loadingTuya}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`h-4 w-4 ${loadingTuya ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loadingTuya ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </div>
          )}
          
          {loadingTuya ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando dispositivos Tuya...</p>
            </div>
          ) : tuyaDevices.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay dispositivos Tuya vinculados
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Vincula tu cuenta Smart Life para ver tus dispositivos aquí
                </p>
                <button
                  onClick={() => setShowWizard(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Vincular Smart Life
                </button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tuyaDevices.map((device) => {
                const isSwitch = device.category === 'kg' || device.category === 'cz';
                const switchValue = getStatusValue(device, 'switch') || 
                                   getStatusValue(device, 'switch_1') ||
                                   getStatusValue(device, 'switch_led');
                const temperature = getStatusValue(device, 'temp') || getStatusValue(device, 'va_temperature');
                const humidity = getStatusValue(device, 'humidity') || getStatusValue(device, 'va_humidity');

                return (
                  <Card key={device.id}>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {device.name}
                        </h3>
                        <Badge 
                          variant={device.online ? 'success' : 'error'} 
                          size="sm"
                        >
                          {device.online ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getCategoryLabel(device.category)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {/* Temperature sensor */}
                      {temperature !== undefined && (
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Temperatura:
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {(temperature / 10).toFixed(1)}°C
                          </span>
                        </div>
                      )}

                      {/* Humidity sensor */}
                      {humidity !== undefined && (
                        <div className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Humedad:
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {humidity}%
                          </span>
                        </div>
                      )}

                      {/* Switch/Power status */}
                      {isSwitch && switchValue !== undefined && (
                        <div className="flex items-center gap-2">
                          <Zap className={`h-4 w-4 ${switchValue ? 'text-green-500' : 'text-gray-400'}`} />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Estado:
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {switchValue ? 'Encendido' : 'Apagado'}
                          </span>
                        </div>
                      )}

                      {/* All other status */}
                      {device.status && device.status.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                            Ver todos los estados ({device.status.length})
                          </summary>
                          <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            {device.status.map((status, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                  {status.code}:
                                </span>{' '}
                                <span className="text-gray-900 dark:text-white font-mono">
                                  {typeof status.value === 'boolean' 
                                    ? (status.value ? 'true' : 'false')
                                    : JSON.stringify(status.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edenic Devices */}
      {activeTab === 'edenic' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={fetchEdenicData}
              disabled={loadingEdenic}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`h-4 w-4 ${loadingEdenic ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loadingEdenic ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {loadingEdenic ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando dispositivos Edenic...</p>
            </div>
          ) : edicError ? (
            <Card>
              <div className="text-center py-12">
                <Leaf className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {edicError === 'forbidden'
                    ? 'No tenés permisos para ver Edenic en este tenant o el tenant seleccionado no está autorizado.'
                    : edicError === 'bad_request'
                    ? 'Seleccioná un tenant válido para consultar Edenic.'
                    : 'No se pudieron cargar los dispositivos Edenic.'}
                </p>
              </div>
            </Card>
          ) : edicDevices.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Leaf className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No hay dispositivos Edenic disponibles.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {edicDevices.map((device) => {
                const displayName = device.label
                  ? device.label
                  : device.gateway === true
                  ? 'Gateway Edenic'
                  : device.name || device.id;
                const shortId = device.id.length > 8 ? `${device.id.slice(0, 8)}...` : device.id;
                const subType = device.additionalInfo?.deviceSubType as string | undefined;

                const deviceTelemetry = edenicTelemetryByDevice[device.id];
                const isTelemetryLoading = loadingEdenicTelemetry[device.id] ?? false;
                const telemetryError = edenicTelemetryErrors[device.id];
                const fetchedAt = edenicTelemetryFetchedAt[device.id];
                const cooldownRemaining = fetchedAt
                  ? Math.max(0, Math.ceil((EDENIC_TELEMETRY_COOLDOWN_MS - (Date.now() - fetchedAt)) / 1000))
                  : 0;
                const isInCooldown = cooldownRemaining > 0;
                const phPoint = getLatestTelemetryValue(deviceTelemetry, 'ph');
                const tempPoint = getLatestTelemetryValue(deviceTelemetry, 'temperature');
                const ecPoint = getLatestTelemetryValue(deviceTelemetry, 'electrical_conductivity');

                const deviceHistory = edenicHistoryByDevice[device.id];
                const isHistoryLoading = loadingEdenicHistory[device.id] ?? false;
                const historyError = edenicHistoryErrors[device.id];
                const historyFetchedAt = edenicHistoryFetchedAt[device.id];
                const historyRemainingCooldown = historyFetchedAt
                  ? Math.max(0, Math.ceil((EDENIC_HISTORY_COOLDOWN_MS - (Date.now() - historyFetchedAt)) / 1000))
                  : 0;
                const isHistoryInCooldown = historyRemainingCooldown > 0;
                const isHistoryExpanded = expandedEdenicHistoryDevice === device.id;

                return (
                  <Card key={device.id}>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {displayName}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {device.deleted && (
                            <Badge variant="danger" size="sm">Eliminado</Badge>
                          )}
                          {device.gateway === true && (
                            <Badge variant="default" size="sm">Gateway</Badge>
                          )}
                          {device.gateway === false && (
                            <Badge variant="success" size="sm">Sensor</Badge>
                          )}
                        </div>
                      </div>
                      {subType && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{subType}</p>
                      )}
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mb-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        ID: {shortId}
                      </span>
                    </div>
                    {/* Últimas mediciones */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Últimas mediciones
                        </span>
                        {device.gateway === true ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Gateway: no expone mediciones directas
                          </span>
                        ) : (
                          <button
                            onClick={() => fetchEdenicTelemetry(device.id)}
                            disabled={isTelemetryLoading || isInCooldown}
                            className="text-xs px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isTelemetryLoading
                              ? 'Cargando...'
                              : isInCooldown
                              ? `Disponible en ${cooldownRemaining}s`
                              : deviceTelemetry
                              ? 'Actualizar mediciones'
                              : 'Cargar mediciones'}
                          </button>
                        )}
                      </div>
                      {telemetryError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mb-2">{telemetryError}</p>
                      )}
                      {isTelemetryLoading && !deviceTelemetry && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cargando mediciones...</p>
                      )}
                      {deviceTelemetry && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">pH</span>
                            <div className="text-right">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {phPoint !== null ? String(phPoint.value) : 'Sin dato'}
                              </span>
                              {phPoint !== null && (
                                <div className="text-gray-400 dark:text-gray-500">
                                  {new Date(phPoint.ts).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Temperatura</span>
                            <div className="text-right">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {tempPoint !== null ? `${tempPoint.value} °C` : 'Sin dato'}
                              </span>
                              {tempPoint !== null && (
                                <div className="text-gray-400 dark:text-gray-500">
                                  {new Date(tempPoint.ts).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">EC</span>
                            <div className="text-right">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {ecPoint !== null ? String(ecPoint.value) : 'Sin dato'}
                              </span>
                              {ecPoint !== null && (
                                <div className="text-gray-400 dark:text-gray-500">
                                  {new Date(ecPoint.ts).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Histórico */}
                    {device.gateway !== true && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Histórico (2h)
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setExpandedEdenicHistoryDevice(
                                  isHistoryExpanded ? null : device.id
                                )
                              }
                              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              {isHistoryExpanded ? 'Ocultar histórico' : 'Ver histórico'}
                            </button>
                            {isHistoryExpanded && (
                              <button
                                onClick={() => fetchEdenicHistory(device.id)}
                                disabled={isHistoryLoading || isHistoryInCooldown}
                                className="text-xs px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isHistoryLoading
                                  ? 'Cargando histórico...'
                                  : isHistoryInCooldown
                                  ? `Disponible en ${historyRemainingCooldown}s`
                                  : deviceHistory
                                  ? 'Actualizar histórico'
                                  : 'Cargar histórico'}
                              </button>
                            )}
                          </div>
                        </div>
                        {isHistoryExpanded && (
                          <div className="mt-2">
                            {historyError && (
                              <p className="text-xs text-red-600 dark:text-red-400 mb-2">{historyError}</p>
                            )}
                            {isHistoryLoading && !deviceHistory && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">Cargando histórico...</p>
                            )}
                            {!isHistoryLoading && !historyError && !deviceHistory && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Hacé click en "Cargar histórico" para ver datos del historial.
                              </p>
                            )}
                            {deviceHistory && (() => {
                              const phH = (deviceHistory.telemetry.ph ?? []).filter(
                                (p) => p.value !== null && p.value !== undefined && p.value !== '' && !isNaN(Number(p.value))
                              );
                              const tmpH = (deviceHistory.telemetry.temperature ?? []).filter(
                                (p) => p.value !== null && p.value !== undefined && p.value !== '' && !isNaN(Number(p.value))
                              );
                              const ecH = (deviceHistory.telemetry.electrical_conductivity ?? []).filter(
                                (p) => p.value !== null && p.value !== undefined && p.value !== '' && !isNaN(Number(p.value))
                              );
                              const hasAny = phH.length > 0 || tmpH.length > 0 || ecH.length > 0;
                              if (!hasAny) {
                                return (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    No hay datos históricos disponibles para este rango.
                                  </p>
                                );
                              }
                              return (
                                <div className="space-y-3">
                                  {phH.length > 0 && (
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">pH</span>
                                        <MiniSparkline points={phH} color="#2563eb" precision={getDisplayPrecision('ph')} />
                                      </div>
                                      <table className="w-full text-xs">
                                        <tbody>
                                          {phH.slice(-8).map((p, i) => (
                                            <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                                              <td className="py-0.5 text-gray-400 dark:text-gray-500 pr-2">
                                                {new Date(p.ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                              </td>
                                              <td className="py-0.5 font-mono text-gray-900 dark:text-white text-right">
                                                {Number(p.value).toFixed(2)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                  {tmpH.length > 0 && (
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-red-500 dark:text-red-400">Temperatura (°C)</span>
                                        <MiniSparkline points={tmpH} color="#ef4444" precision={getDisplayPrecision('temperature')} />
                                      </div>
                                      <table className="w-full text-xs">
                                        <tbody>
                                          {tmpH.slice(-8).map((p, i) => (
                                            <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                                              <td className="py-0.5 text-gray-400 dark:text-gray-500 pr-2">
                                                {new Date(p.ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                              </td>
                                              <td className="py-0.5 font-mono text-gray-900 dark:text-white text-right">
                                                {Number(p.value).toFixed(1)}&nbsp;°C
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                  {ecH.length > 0 && (
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">EC</span>
                                        <MiniSparkline points={ecH} color="#059669" precision={getDisplayPrecision('electrical_conductivity')} />
                                      </div>
                                      <table className="w-full text-xs">
                                        <tbody>
                                          {ecH.slice(-8).map((p, i) => (
                                            <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                                              <td className="py-0.5 text-gray-400 dark:text-gray-500 pr-2">
                                                {new Date(p.ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                              </td>
                                              <td className="py-0.5 font-mono text-gray-900 dark:text-white text-right">
                                                {Number(p.value).toFixed(2)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tuya Link Wizard */}
      <TuyaLinkWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={() => {
          fetchTuyaData();
        }}
      />
    </div>
  );
}

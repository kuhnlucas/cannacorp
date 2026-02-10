import { useState, useEffect } from 'react';
import { Wifi, Zap, Thermometer, Droplets, Wind, Sun } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import TuyaLinkWizard from '../components/TuyaLinkWizard';
import { useTenant } from '../contexts/TenantContext';

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

export default function Sensors() {
  const { selectedTenant } = useTenant();
  const [pulseGrowDevices, setPulseGrowDevices] = useState<PulseGrowDevice[]>([]);
  const [tuyaDevices, setTuyaDevices] = useState<TuyaDevice[]>([]);
  const [loadingPulse, setLoadingPulse] = useState(true);
  const [loadingTuya, setLoadingTuya] = useState(true);
  const [activeTab, setActiveTab] = useState<'pulse' | 'tuya'>('pulse');
  const [showWizard, setShowWizard] = useState(false);

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
      const response = await fetch('http://localhost:3000/api/sensors/pulsegrow/devices');
      const data = await response.json();
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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/tuya/devices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Id': selectedTenant.id,
        },
      });
      const data = await response.json();
      console.log('📊 Tuya devices received:', data.devices);
      if (data.devices && data.devices.length > 0) {
        console.log('📊 First device:', data.devices[0]);
        console.log('📊 Device status:', data.devices[0].status);
        console.log('📊 Device online:', data.devices[0].online);
      }
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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/tuya/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Id': selectedTenant.id,
        },
      });
      const data = await response.json();
      console.log('✅ Sync response:', data);
      // Reload devices after sync
      await fetchTuyaData();
    } catch (error) {
      console.error('Error syncing Tuya devices:', error);
    } finally {
      setLoadingTuya(false);
    }
  };

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

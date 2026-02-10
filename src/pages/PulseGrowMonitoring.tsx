import React, { useState, useEffect } from 'react';
import { Thermometer, Droplets, Wind, Activity, Zap, RefreshCw, Wifi } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import api from '../services/api';

interface PulseDevice {
  id: number;
  name: string;
  deviceType: number;
  mostRecentDataPoint?: {
    temperatureF: number;
    humidityRh: number;
    vpd: number;
    co2: number;
    lightLux: number;
    airPressure: number;
    dpC: number;
    dpF: number;
    createdAt: string;
    pluggedIn: boolean;
    batteryV: number;
    signalStrength: number;
  };
}

export default function PulseGrowMonitoring() {
  const [devices, setDevices] = useState<PulseDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setIsLoading(true);
        const data = await api.pulseGrow.getAllDevices();
        
        // Extract devices from response
        if (data.deviceViewDtos && Array.isArray(data.deviceViewDtos)) {
          setDevices(data.deviceViewDtos);
        }
        
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching Pulse Grow devices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sensores Pulse Grow
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitoreo en tiempo real de sensores IoT
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="success">
            <Wifi className="h-4 w-4 mr-1" />
            {devices.length} Dispositivos
          </Badge>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Última actualización: {formatTime(lastUpdate)}
          </div>
        </div>
      </div>

      {isLoading && devices.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Cargando dispositivos...</p>
          </div>
        </Card>
      ) : devices.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No se encontraron dispositivos Pulse Grow</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((device) => {
            const data = device.mostRecentDataPoint;
            if (!data) return null;

            // Convertir Fahrenheit a Celsius
            const tempC = data.temperatureF ? ((data.temperatureF - 32) * 5 / 9) : null;

            return (
              <Card key={device.id}>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{device.name}</h3>
                      <p className="text-xs text-gray-500">ID: {device.id}</p>
                    </div>
                    <Badge variant={data.pluggedIn ? 'success' : 'warning'} size="sm">
                      {data.pluggedIn ? '🔌' : '🔋'}
                    </Badge>
                  </div>

                  {/* Métricas principales en grid compacto */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Temperatura */}
                    <div className="p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      <div className="flex items-center space-x-1.5">
                        <Thermometer className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Temp</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                        {tempC ? tempC.toFixed(1) : '--'}°C
                      </p>
                      <p className="text-xs text-gray-500">{data.temperatureF?.toFixed(1)}°F</p>
                    </div>

                    {/* Humedad */}
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                      <div className="flex items-center space-x-1.5">
                        <Droplets className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Humedad</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                        {data.humidityRh?.toFixed(1)}%
                      </p>
                    </div>

                    {/* VPD */}
                    <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <div className="flex items-center space-x-1.5">
                        <Activity className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">VPD</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                        {data.vpd?.toFixed(2)} kPa
                      </p>
                    </div>

                    {/* CO2 */}
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                      <div className="flex items-center space-x-1.5">
                        <Wind className="h-3.5 w-3.5 text-purple-600" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">CO₂</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                        {data.co2} ppm
                      </p>
                    </div>
                  </div>

                  {/* Métricas secundarias */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-3.5 w-3.5 text-yellow-600" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Luz</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {data.lightLux?.toFixed(0)} lux
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Batería / Señal</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {data.batteryV?.toFixed(1)}V / {data.signalStrength}%
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

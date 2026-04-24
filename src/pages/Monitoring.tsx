import React, { useState, useEffect } from 'react';
import { Thermometer, Droplets, Zap, AlertTriangle, Activity, Wifi, BarChart3, Wind } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';

export default function Monitoring() {
  const { labs, batches, measurements } = useData();
  const { t } = useLanguage();
  const [selectedLab, setSelectedLab] = useState<string>('all');
  const [realtimeData, setRealtimeData] = useState<{[key: string]: any}>({});
  const [pulseGrowData, setPulseGrowData] = useState<any[]>([]);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch measurements from API
        const data = await api.monitoring.getMeasurements();
        
        // Fetch Pulse Grow sensor data
        let pulseDevices: any[] = [];
        try {
          const pulseData = await api.pulseGrow.getAllDevices();
          if (pulseData?.deviceViewDtos) {
            pulseDevices = pulseData.deviceViewDtos;
            setPulseGrowData(pulseDevices);
          }
        } catch (error) {
          console.log('Pulse Grow data not available:', error);
        }
        
        // Group measurements by lab
        const byLab: {[key: string]: any} = {};
        labs.forEach(lab => {
          byLab[lab.id] = {
            temperature: '--',
            humidity: '--',
            ph: '--',
            ec: '--'
          };
        });

        if (Array.isArray(data)) {
          data.forEach((m: any) => {
            const batch = batches.find(b => b.id === m.batchId);
            if (batch && byLab[batch.labId]) {
              if (m.type === 'temperature') {
                byLab[batch.labId].temperature = m.value?.toFixed(1) || '--';
              } else if (m.type === 'humidity') {
                byLab[batch.labId].humidity = m.value?.toFixed(0) || '--';
              } else if (m.type === 'ph') {
                byLab[batch.labId].ph = m.value?.toFixed(1) || '--';
              } else if (m.type === 'ec') {
                byLab[batch.labId].ec = m.value?.toFixed(1) || '--';
              }
            }
          });
        }

        setRealtimeData(byLab);

        // Generate alerts based on measurements
        const generatedAlerts: any[] = [];
        Object.entries(byLab).forEach(([labId, data]: [string, any]) => {
          const lab = labs.find(l => l.id === labId);
          
          // Temperature alert
          const temp = parseFloat(data.temperature);
          if (!isNaN(temp) && temp > 27) {
            generatedAlerts.push({
              id: `temp-${labId}`,
              type: temp > 30 ? 'error' : 'warning',
              message: `Temperatura elevada en ${lab?.name}`,
              value: `${temp}°C`,
              threshold: '< 27°C',
              time: 'Ahora'
            });
          }

          // Humidity alert
          const humidity = parseFloat(data.humidity);
          if (!isNaN(humidity) && (humidity < 40 || humidity > 80)) {
            generatedAlerts.push({
              id: `humidity-${labId}`,
              type: humidity < 40 ? 'warning' : 'info',
              message: `Humedad fuera de rango en ${lab?.name}`,
              value: `${humidity}%`,
              threshold: '40-80%',
              time: 'Ahora'
            });
          }

          // pH alert
          const pH = parseFloat(data.ph);
          if (!isNaN(pH) && (pH < 5.5 || pH > 6.5)) {
            generatedAlerts.push({
              id: `ph-${labId}`,
              type: 'warning',
              message: `pH fuera de rango en ${lab?.name}`,
              value: `${pH}`,
              threshold: '5.5-6.5',
              time: 'Ahora'
            });
          }
        });

        if (generatedAlerts.length === 0) {
          generatedAlerts.push({
            id: 'ok',
            type: 'info',
            message: 'Todos los parámetros dentro de los límites óptimos',
            time: 'Ahora'
          });
        }

        setAlerts(generatedAlerts);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
        setIsLoading(false);
      }
    };

    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [labs, batches]);

  const filteredBatches = selectedLab === 'all' 
    ? batches.filter(b => b.state !== 'harvested')
    : batches.filter(b => b.labId === selectedLab && b.state !== 'harvested');

  // Generate sensor status based on measurements
  const [sensorStatus, setSensorStatus] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const res = await api.sensors.getAll();
        if (res?.sensors) {
          setSensorStatus(res.sensors.map((s: any) => ({
            id: s.id,
            name: s.name,
            lab: s.lab?.name || '—',
            status: s.status || 'online',
            lastReading: s.lastRead ? new Date(s.lastRead).toLocaleString() : 'Sin datos',
          })));
        } else {
          // Fallback: generate from labs
          setSensorStatus(labs.flatMap(lab => [
            { id: `temp-${lab.id}`, name: 'Sensor Temperatura', lab: lab.name, status: 'online', lastReading: 'Ahora' },
            { id: `humidity-${lab.id}`, name: 'Sensor Humedad', lab: lab.name, status: 'online', lastReading: 'Ahora' },
          ]));
        }
      } catch {
        setSensorStatus(labs.flatMap(lab => [
          { id: `temp-${lab.id}`, name: 'Sensor Temperatura', lab: lab.name, status: 'online', lastReading: 'Ahora' },
          { id: `humidity-${lab.id}`, name: 'Sensor Humedad', lab: lab.name, status: 'online', lastReading: 'Ahora' },
        ]));
      }
    };
    fetchSensors();
  }, [labs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('monitoring.title')}</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">{t('monitoring.allLabs')}</option>
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>{lab.name}</option>
            ))}
          </select>
          <Badge variant="success">
            <Wifi className="h-4 w-4 mr-1" />
            {t('monitoring.liveData')}
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card title={t('monitoring.activeAlerts')} className="border-l-4 border-l-yellow-500">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`flex items-start space-x-3 p-3 rounded-lg ${
                alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                  alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{alert.message}</p>
                  {'value' in alert && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Current: {alert.value} | Target: {alert.threshold}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Real-time Environmental Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {labs.map((lab) => {
          const labData = realtimeData[lab.id];
          const labBatches = batches.filter(b => b.labId === lab.id && b.state !== 'harvested');
          
          return (
            <Card key={lab.id} title={lab.name} subtitle={`${labBatches.length} ${t('monitoring.activeBatches')}`}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg flex-shrink-0">
                      <Thermometer className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('monitoring.temperature')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {labData?.temperature || '--'}°C
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                      <Droplets className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('monitoring.humidity')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {labData?.humidity || '--'}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('monitoring.ph')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {labData?.ph || '--'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
                      <Zap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('monitoring.ec')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {labData?.ec || '--'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{t('monitoring.lastUpdate')}</span>
                    <span className="text-green-600">{t('monitoring.live')}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pulse Grow Sensors Live Data */}
      {pulseGrowData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Wifi className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sensores IoT Pulse Grow</h2>
            <Badge variant="success">En vivo</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pulseGrowData.map((device: any) => {
              const tempF = device.mostRecentDataPoint?.temperatureF;
              const tempC = tempF ? ((tempF - 32) * 5 / 9).toFixed(1) : '--';
              
              return (
                <Card key={device.id} title={device.name} subtitle={`Dispositivo #${device.id}`}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Thermometer className="h-4 w-4 text-red-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Temp</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {tempC}°C
                        </p>
                        <p className="text-xs text-gray-500">{tempF?.toFixed(1)}°F</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Droplets className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Humedad</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {device.mostRecentDataPoint?.humidityRh?.toFixed(0) || '--'}%
                        </p>
                      </div>
                      
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Wind className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">VPD</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {device.mostRecentDataPoint?.vpd?.toFixed(2) || '--'} kPa
                        </p>
                      </div>
                      
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-purple-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">CO₂</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {device.mostRecentDataPoint?.co2 || '--'} ppm
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500">
                        {device.pluggedIn ? '🔌 Conectado' : '🔋 Batería'}
                      </span>
                      <span className="text-xs text-green-600">● En línea</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Batches Environmental Status */}
        <Card title={t('monitoring.batchEnvironmentalStatus')} subtitle={t('monitoring.currentConditionsActiveBatches')}>
          <div className="space-y-4">
            {filteredBatches.map((batch) => {
              const lab = labs.find(l => l.id === batch.labId);
              const labData = realtimeData[batch.labId];
              
              return (
                <div key={batch.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{batch.code}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{lab?.name}</p>
                    </div>
                    <Badge variant={batch.state === 'flowering' ? 'warning' : 'success'}>
                      {batch.state}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400">Temp</p>
                      <p className="font-medium text-red-600">{labData?.temperature || '--'}°C</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400">RH</p>
                      <p className="font-medium text-blue-600">{labData?.humidity || '--'}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400">pH</p>
                      <p className="font-medium text-green-600">{labData?.ph || '--'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400">EC</p>
                      <p className="font-medium text-purple-600">{labData?.ec || '--'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Sensor Status */}
        <Card title={t('monitoring.sensorNetworkStatus')} subtitle={t('monitoring.iotSensorConnectivity')}>
          <div className="space-y-3">
            {sensorStatus.map((sensor) => (
              <div key={sensor.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{sensor.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{sensor.lab}</p>
                </div>
                <div className="text-right">
                  <Badge variant={sensor.status === 'online' ? 'success' : 'danger'}>
                    {sensor.status === 'online' ? t('monitoring.online') : t('monitoring.offline')}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{sensor.lastReading}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Historical Chart Placeholder */}
      <Card title={t('monitoring.environmentalTrends')} subtitle={t('monitoring.temperatureHumidityTrends')}>
        <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">{t('monitoring.chartsComingSoon')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t('monitoring.realtimeDataVisualization')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
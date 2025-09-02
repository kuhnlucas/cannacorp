import React, { useState, useEffect } from 'react';
import { Thermometer, Droplets, Zap, AlertTriangle, Activity, Wifi } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useData } from '../contexts/DataContext';

export default function Monitoring() {
  const { labs, batches, measurements, addMeasurement } = useData();
  const [selectedLab, setSelectedLab] = useState<string>('all');
  const [realtimeData, setRealtimeData] = useState<{[key: string]: any}>({});

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newData: {[key: string]: any} = {};
      labs.forEach(lab => {
        newData[lab.id] = {
          temperature: (22 + Math.random() * 6).toFixed(1),
          humidity: (60 + Math.random() * 20).toFixed(0),
          ph: (5.8 + Math.random() * 1.4).toFixed(1),
          ec: (1.2 + Math.random() * 1.0).toFixed(1)
        };
      });
      setRealtimeData(newData);
    }, 5000);

    return () => clearInterval(interval);
  }, [labs]);

  const filteredBatches = selectedLab === 'all' 
    ? batches.filter(b => b.state !== 'harvested')
    : batches.filter(b => b.labId === selectedLab && b.state !== 'harvested');

  const alerts = [
    {
      id: '1',
      type: 'warning',
      message: 'Temperature slightly high in Flower Room B',
      value: '28.2°C',
      threshold: '< 27°C',
      time: '5 minutes ago'
    },
    {
      id: '2',
      type: 'info',
      message: 'Humidity optimal across all rooms',
      time: '1 hour ago'
    }
  ];

  const sensorStatus = [
    { id: '1', name: 'Temp Sensor A1', lab: 'Veg Room A', status: 'online', lastReading: '2 min ago' },
    { id: '2', name: 'Humidity Sensor A1', lab: 'Veg Room A', status: 'online', lastReading: '2 min ago' },
    { id: '3', name: 'pH Sensor B1', lab: 'Flower Room B', status: 'offline', lastReading: '15 min ago' },
    { id: '4', name: 'EC Sensor B1', lab: 'Flower Room B', status: 'online', lastReading: '1 min ago' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Monitoring</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Labs</option>
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>{lab.name}</option>
            ))}
          </select>
          <Badge variant="success">
            <Wifi className="h-4 w-4 mr-1" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card title="Active Alerts" className="border-l-4 border-l-yellow-500">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {labs.map((lab) => {
          const labData = realtimeData[lab.id];
          const labBatches = batches.filter(b => b.labId === lab.id && b.state !== 'harvested');
          
          return (
            <Card key={lab.id} title={lab.name} subtitle={`${labBatches.length} active batches`}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <Thermometer className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {labData?.temperature || '--'}°C
                      </p>
                      <p className="text-xs text-gray-500">Temperature</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Droplets className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {labData?.humidity || '--'}%
                      </p>
                      <p className="text-xs text-gray-500">Humidity</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {labData?.ph || '--'}
                      </p>
                      <p className="text-xs text-gray-500">pH</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Zap className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {labData?.ec || '--'}
                      </p>
                      <p className="text-xs text-gray-500">EC (mS/cm)</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Last Update</span>
                    <span className="text-green-600">Live</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Batches Environmental Status */}
        <Card title="Batch Environmental Status" subtitle="Current conditions for active batches">
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
        <Card title="Sensor Network Status" subtitle="IoT sensor connectivity and health">
          <div className="space-y-3">
            {sensorStatus.map((sensor) => (
              <div key={sensor.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{sensor.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{sensor.lab}</p>
                </div>
                <div className="text-right">
                  <Badge variant={sensor.status === 'online' ? 'success' : 'danger'}>
                    {sensor.status}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{sensor.lastReading}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Historical Chart Placeholder */}
      <Card title="Environmental Trends" subtitle="24-hour temperature and humidity trends">
        <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Environmental charts will be displayed here</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Real-time data visualization coming soon
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
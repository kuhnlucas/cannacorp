import React from 'react';
import { Sprout, Beaker, TrendingUp, AlertTriangle, Thermometer, Droplets } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useData } from '../contexts/DataContext';

export default function Dashboard() {
  const { labs, genetics, batches, measurements } = useData();

  const activeBatches = batches.filter(batch => batch.state !== 'harvested');
  const floweringBatches = batches.filter(batch => batch.state === 'flowering');
  
  const recentMeasurements = measurements
    .filter(m => m.type === 'temperature' || m.type === 'humidity')
    .slice(-4);

  const stats = [
    {
      name: 'Active Batches',
      value: activeBatches.length,
      change: '+2',
      changeType: 'increase',
      icon: Sprout,
      color: 'text-green-600'
    },
    {
      name: 'Genetics Library',
      value: genetics.length,
      change: '+1',
      changeType: 'increase',
      icon: Beaker,
      color: 'text-blue-600'
    },
    {
      name: 'Labs Online',
      value: labs.length,
      change: '100%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      name: 'Alerts',
      value: 2,
      change: '-1',
      changeType: 'decrease',
      icon: AlertTriangle,
      color: 'text-red-600'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Badge variant="success">All Systems Online</Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'increase' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Batches */}
        <Card title="Active Batches" subtitle="Currently in cultivation">
          <div className="space-y-4">
            {activeBatches.map((batch) => {
              const genetic = genetics.find(g => g.id === batch.geneticsId);
              const lab = labs.find(l => l.id === batch.labId);
              
              return (
                <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <Sprout className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{batch.code}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {genetic?.name} • {lab?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={batch.state === 'flowering' ? 'warning' : 'success'}>
                      {batch.state}
                    </Badge>
                    <span className="text-sm text-gray-500">{batch.plantCount} plants</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Environmental Conditions */}
        <Card title="Live Environmental Data" subtitle="Latest sensor readings">
          <div className="space-y-4">
            {recentMeasurements.map((measurement) => {
              const batch = batches.find(b => b.id === measurement.batchId);
              const Icon = measurement.type === 'temperature' ? Thermometer : Droplets;
              
              return (
                <div key={measurement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      measurement.type === 'temperature' 
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-600' 
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {measurement.type}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Batch {batch?.code}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {measurement.value}{measurement.unit}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(measurement.takenAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card title="Recent Activity" subtitle="Latest cultivation events">
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">New batch started: BD-003</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Blue Dream genetics in Veg Room A • 2 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Environmental alert resolved</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Temperature normalized in Flower Room B • 4 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">New genetics added</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gorilla Glue #4 from Original Sensible Seeds • 6 hours ago</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
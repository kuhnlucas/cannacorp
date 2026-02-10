import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Droplets, Scissors, Sprout, Activity } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useData } from '../contexts/DataContext';

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { batches, genetics, labs, measurements } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'measurements'>('overview');

  const batch = batches.find(b => b.id === id);
  const genetic = genetics.find(g => g.id === batch?.geneticsId);
  const lab = labs.find(l => l.id === batch?.labId);
  const batchMeasurements = measurements.filter(m => m.batchId === id);

  if (!batch) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Batch not found</p>
      </div>
    );
  }

  const getDaysFromSowing = () => {
    return Math.floor((Date.now() - new Date(batch.sowingDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const events = [
    {
      id: '1',
      type: 'watering',
      date: '2024-01-18',
      description: 'Regular watering - 2L per plant',
      icon: Droplets,
      color: 'text-blue-600'
    },
    {
      id: '2',
      type: 'pruning',
      date: '2024-01-15',
      description: 'Lower branch pruning for better air circulation',
      icon: Scissors,
      color: 'text-green-600'
    },
    {
      id: '3',
      type: 'transplanting',
      date: '2024-01-10',
      description: 'Transplanted to 7L pots',
      icon: Sprout,
      color: 'text-purple-600'
    }
  ];

  const getStateBadgeVariant = (state: string) => {
    switch (state) {
      case 'vegetative': return 'success';
      case 'flowering': return 'warning';
      case 'harvested': return 'info';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate('/batches')}
          >
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Batch {batch.code}
          </h1>
          <Badge variant={getStateBadgeVariant(batch.state)}>
            {batch.state}
          </Badge>
        </div>
        <Button icon={Plus}>
          Log Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Batch Overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Days from Sowing</p>
                <p className="text-2xl font-bold text-green-600">{getDaysFromSowing()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Plant Count</p>
                <p className="text-2xl font-bold text-blue-600">{batch.plantCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Flowering</p>
                <p className="text-2xl font-bold text-purple-600">{genetic?.floweringDays || '--'} days</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Health Score</p>
                <p className="text-2xl font-bold text-green-600">9.2/10</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Genetics Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Strain:</span>
                    <span className="text-gray-900 dark:text-white">{genetic?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Breeder:</span>
                    <span className="text-gray-900 dark:text-white">{genetic?.breeder || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Phenotype:</span>
                    <span className="text-gray-900 dark:text-white">{batch.phenotype}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Indica/Sativa:</span>
                    <span className="text-gray-900 dark:text-white">
                      {genetic ? `${genetic.indicaPct}%/${genetic.sativaPct}%` : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Environment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Lab:</span>
                    <span className="text-gray-900 dark:text-white">{lab?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Light Cycle:</span>
                    <span className="text-gray-900 dark:text-white">{lab?.cycle || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Area:</span>
                    <span className="text-gray-900 dark:text-white">{lab?.m2 || 'Unknown'} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sowing Date:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(batch.sowingDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: Activity },
                { id: 'events', name: 'Events', icon: Calendar },
                { id: 'measurements', name: 'Measurements', icon: Activity }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'events' && (
            <Card title="Event Timeline">
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-600 ${event.color}`}>
                      <event.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                          {event.type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'measurements' && (
            <Card title="Environmental Measurements">
              <div className="space-y-4">
                {batchMeasurements.map((measurement) => (
                  <div key={measurement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {measurement.type}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(measurement.takenAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {measurement.value}{measurement.unit}
                      </p>
                      <Badge variant={measurement.source === 'iot' ? 'info' : 'default'} size="sm">
                        {measurement.source}
                      </Badge>
                    </div>
                  </div>
                ))}
                {batchMeasurements.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No measurements recorded yet
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Current Conditions">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Temperature</span>
                <span className="font-bold text-red-600">24.5°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Humidity</span>
                <span className="font-bold text-blue-600">65%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">pH</span>
                <span className="font-bold text-green-600">6.2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">EC</span>
                <span className="font-bold text-purple-600">1.8 mS/cm</span>
              </div>
            </div>
          </Card>

          <Card title="Quick Actions">
            <div className="space-y-3">
              <Button className="w-full" variant="secondary" icon={Droplets}>
                Log Watering
              </Button>
              <Button className="w-full" variant="secondary" icon={Scissors}>
                Record Pruning
              </Button>
              <Button className="w-full" variant="secondary" icon={Sprout}>
                Add Feeding
              </Button>
              <Button className="w-full" variant="secondary" icon={Activity}>
                Manual Reading
              </Button>
            </div>
          </Card>

          <Card title="Growth Progress">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Vegetative Phase</span>
                <span className="text-sm font-medium text-green-600">Day {getDaysFromSowing()}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min((getDaysFromSowing() / 60) * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {batch.state === 'vegetative' ? 'Growing strong in vegetative phase' : 
                 batch.state === 'flowering' ? 'Flowering phase in progress' : 
                 'Batch completed'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
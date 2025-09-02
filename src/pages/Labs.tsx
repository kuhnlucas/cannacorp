import React, { useState } from 'react';
import { Plus, Settings, Thermometer, Zap } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useData } from '../contexts/DataContext';

export default function Labs() {
  const { labs, batches, addLab } = useData();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Vegetative',
    m2: 0,
    cycle: '18/6'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLab(formData);
    setFormData({ name: '', type: 'Vegetative', m2: 0, cycle: '18/6' });
    setShowForm(false);
  };

  const getLabBatches = (labId: string) => {
    return batches.filter(batch => batch.labId === labId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Labs & Facilities</h1>
        <Button icon={Plus} onClick={() => setShowForm(true)}>
          Add Lab
        </Button>
      </div>

      {showForm && (
        <Card title="Add New Lab">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lab Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Veg Room C"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Vegetative">Vegetative</option>
                  <option value="Flowering">Flowering</option>
                  <option value="Mother">Mother Room</option>
                  <option value="Clone">Clone Room</option>
                  <option value="Dry">Drying Room</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Area (m²)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.m2}
                  onChange={(e) => setFormData({ ...formData, m2: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Light Cycle
                </label>
                <select
                  value={formData.cycle}
                  onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="18/6">18/6 (Vegetative)</option>
                  <option value="12/12">12/12 (Flowering)</option>
                  <option value="24/0">24/0 (Continuous)</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Lab
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map((lab) => {
          const labBatches = getLabBatches(lab.id);
          const activeBatches = labBatches.filter(batch => batch.state !== 'harvested');
          
          return (
            <Card key={lab.id}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Settings className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {lab.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lab.m2} m² • {lab.cycle}
                      </p>
                    </div>
                  </div>
                  
                  <Badge variant={lab.type === 'Flowering' ? 'warning' : 'success'}>
                    {lab.type}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">24.5°C</p>
                      <p className="text-xs text-gray-500">Temperature</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">65%</p>
                      <p className="text-xs text-gray-500">Humidity</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active Batches
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {activeBatches.length}
                    </span>
                  </div>
                  
                  {activeBatches.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {activeBatches.slice(0, 2).map((batch) => (
                        <div key={batch.id} className="text-sm text-gray-600 dark:text-gray-400">
                          {batch.code} • {batch.plantCount} plants
                        </div>
                      ))}
                      {activeBatches.length > 2 && (
                        <div className="text-sm text-gray-500">
                          +{activeBatches.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
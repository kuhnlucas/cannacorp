import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Package, QrCode, Calendar } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useData } from '../contexts/DataContext';

export default function Batches() {
  const { batches, genetics, labs, addBatch } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    labId: '',
    geneticsId: '',
    phenotype: 'A1',
    code: '',
    sowingDate: new Date().toISOString().split('T')[0],
    state: 'vegetative' as 'vegetative' | 'flowering' | 'harvested',
    notes: '',
    plantCount: 12
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBatch(formData);
    setFormData({
      labId: '',
      geneticsId: '',
      phenotype: 'A1',
      code: '',
      sowingDate: new Date().toISOString().split('T')[0],
      state: 'vegetative',
      notes: '',
      plantCount: 12
    });
    setShowForm(false);
  };

  const filteredBatches = batches.filter(batch => {
    const genetic = genetics.find(g => g.id === batch.geneticsId);
    const matchesSearch = batch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         genetic?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filterState === 'all' || batch.state === filterState;
    return matchesSearch && matchesState;
  });

  const generateQRCode = (batchId: string) => {
    alert(`QR Code generated for batch ID: ${batchId}`);
  };

  const getStateBadgeVariant = (state: string) => {
    switch (state) {
      case 'vegetative': return 'success';
      case 'flowering': return 'warning';
      case 'harvested': return 'info';
      default: return 'default';
    }
  };

  const getDaysFromSowing = (sowingDate: string) => {
    const days = Math.floor((Date.now() - new Date(sowingDate).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Batch Management</h1>
        <Button icon={Plus} onClick={() => setShowForm(true)}>
          Start New Batch
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by batch code or genetics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All States</option>
          <option value="vegetative">Vegetative</option>
          <option value="flowering">Flowering</option>
          <option value="harvested">Harvested</option>
        </select>
      </div>

      {showForm && (
        <Card title="Start New Batch">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Batch Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., OGK-003"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lab *
                </label>
                <select
                  required
                  value={formData.labId}
                  onChange={(e) => setFormData({ ...formData, labId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Lab</option>
                  {labs.map((lab) => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Genetics *
                </label>
                <select
                  required
                  value={formData.geneticsId}
                  onChange={(e) => setFormData({ ...formData, geneticsId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Genetics</option>
                  {genetics.map((genetic) => (
                    <option key={genetic.id} value={genetic.id}>{genetic.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phenotype
                </label>
                <input
                  type="text"
                  value={formData.phenotype}
                  onChange={(e) => setFormData({ ...formData, phenotype: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., A1, NN"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sowing Date
                </label>
                <input
                  type="date"
                  value={formData.sowingDate}
                  onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plant Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.plantCount}
                  onChange={(e) => setFormData({ ...formData, plantCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Initial Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Initial observations, seed source, etc..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Start Batch
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map((batch) => {
          const genetic = genetics.find(g => g.id === batch.geneticsId);
          const lab = labs.find(l => l.id === batch.labId);
          const daysFromSowing = getDaysFromSowing(batch.sowingDate);
          
          return (
            <Card key={batch.id}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {batch.code}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {genetic?.name} • Phenotype {batch.phenotype}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => generateQRCode(batch.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <Badge variant={getStateBadgeVariant(batch.state)}>
                    {batch.state}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    Day {daysFromSowing}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Lab</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {lab?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Plant Count</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {batch.plantCount} plants
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Sowing Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(batch.sowingDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Expected Flowering</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {genetic?.floweringDays || '--'} days
                    </p>
                  </div>
                </div>

                {batch.notes && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {batch.notes}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/batches/${batch.id}`)}
                  >
                    Manage Batch
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredBatches.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No batches found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Start your first batch to begin cultivation tracking
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
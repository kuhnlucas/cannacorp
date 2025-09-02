import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Sprout, TreePine, QrCode } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useData } from '../contexts/DataContext';

export default function Genetics() {
  const { genetics, addGenetics } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    breeder: '',
    origin: '',
    indicaPct: 50,
    sativaPct: 50,
    thcMin: 0,
    thcMax: 0,
    cbdMin: 0,
    cbdMax: 0,
    floweringDays: 60,
    yieldEstimate: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addGenetics({
      ...formData,
      terpenes: []
    });
    setFormData({
      name: '',
      breeder: '',
      origin: '',
      indicaPct: 50,
      sativaPct: 50,
      thcMin: 0,
      thcMax: 0,
      cbdMin: 0,
      cbdMax: 0,
      floweringDays: 60,
      yieldEstimate: '',
      notes: ''
    });
    setShowForm(false);
  };

  const filteredGenetics = genetics.filter(genetic =>
    genetic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    genetic.breeder.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateQRCode = (geneticsId: string) => {
    // In a real app, this would generate an actual QR code
    alert(`QR Code generated for genetics ID: ${geneticsId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Genetics Library</h1>
        <Button icon={Plus} onClick={() => setShowForm(true)}>
          Add Genetics
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name or breeder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {showForm && (
        <Card title="Add New Genetics">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Strain Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Purple Haze"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Breeder *
                </label>
                <input
                  type="text"
                  required
                  value={formData.breeder}
                  onChange={(e) => setFormData({ ...formData, breeder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Dutch Passion"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Origin
                </label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Netherlands"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flowering Days
                </label>
                <input
                  type="number"
                  min="40"
                  max="120"
                  value={formData.floweringDays}
                  onChange={(e) => setFormData({ ...formData, floweringDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Indica % ({formData.indicaPct}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.indicaPct}
                  onChange={(e) => {
                    const indica = parseInt(e.target.value);
                    setFormData({ 
                      ...formData, 
                      indicaPct: indica, 
                      sativaPct: 100 - indica 
                    });
                  }}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sativa % ({formData.sativaPct}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.sativaPct}
                  onChange={(e) => {
                    const sativa = parseInt(e.target.value);
                    setFormData({ 
                      ...formData, 
                      sativaPct: sativa, 
                      indicaPct: 100 - sativa 
                    });
                  }}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  THC Min %
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.1"
                  value={formData.thcMin}
                  onChange={(e) => setFormData({ ...formData, thcMin: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  THC Max %
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.1"
                  value={formData.thcMax}
                  onChange={(e) => setFormData({ ...formData, thcMax: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CBD Min %
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={formData.cbdMin}
                  onChange={(e) => setFormData({ ...formData, cbdMin: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CBD Max %
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={formData.cbdMax}
                  onChange={(e) => setFormData({ ...formData, cbdMax: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Yield Estimate
              </label>
              <input
                type="text"
                value={formData.yieldEstimate}
                onChange={(e) => setFormData({ ...formData, yieldEstimate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 400-500g/m²"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Additional notes about this genetics..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Genetics
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGenetics.map((genetic) => (
          <Card key={genetic.id}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Sprout className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {genetic.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {genetic.breeder}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => generateQRCode(genetic.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <QrCode className="h-4 w-4" />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Badge variant="info">{genetic.indicaPct}% Indica</Badge>
                  <Badge variant="success">{genetic.sativaPct}% Sativa</Badge>
                </div>
                {genetic.parents && (
                  <TreePine className="h-4 w-4 text-gray-400" title="Has lineage" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">THC Range</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {genetic.thcMin}% - {genetic.thcMax}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Flowering</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {genetic.floweringDays} days
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Origin</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {genetic.origin || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Yield Est.</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {genetic.yieldEstimate || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/genetics/${genetic.id}`)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
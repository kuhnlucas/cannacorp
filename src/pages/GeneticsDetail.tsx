import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TreePine, Beaker, BarChart3, Image } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useData } from '../contexts/DataContext';

export default function GeneticsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { genetics, batches } = useData();

  const genetic = genetics.find(g => g.id === id);
  const geneticBatches = batches.filter(batch => batch.geneticsId === id);

  if (!genetic) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Genetics not found</p>
      </div>
    );
  }

  const totalPlants = geneticBatches.reduce((sum, batch) => sum + batch.plantCount, 0);
  const activeBatches = geneticBatches.filter(batch => batch.state !== 'harvested');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate('/genetics')}
          >
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {genetic.name}
          </h1>
          <Badge variant="info">{genetic.breeder}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Genetics Profile">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Indica</p>
                  <p className="text-2xl font-bold text-purple-600">{genetic.indicaPct}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sativa</p>
                  <p className="text-2xl font-bold text-green-600">{genetic.sativaPct}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">THC Range</p>
                  <p className="text-2xl font-bold text-red-600">{genetic.thcMin}-{genetic.thcMax}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CBD Range</p>
                  <p className="text-2xl font-bold text-blue-600">{genetic.cbdMin}-{genetic.cbdMax}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Growing Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Flowering Time:</span>
                      <span className="text-gray-900 dark:text-white">{genetic.floweringDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Expected Yield:</span>
                      <span className="text-gray-900 dark:text-white">{genetic.yieldEstimate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Origin:</span>
                      <span className="text-gray-900 dark:text-white">{genetic.origin || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Terpene Profile</h4>
                  <div className="space-y-2">
                    {genetic.terpenes.length > 0 ? (
                      genetic.terpenes.map((terpene, index) => (
                        <Badge key={index} variant="default" size="sm">
                          {terpene}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No terpene data available</p>
                    )}
                  </div>
                </div>
              </div>

              {genetic.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Notes</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {genetic.notes}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Lineage */}
          {genetic.parents && (
            <Card title="Lineage" className="border-l-4 border-l-purple-500">
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="p-4 bg-pink-100 dark:bg-pink-900/20 rounded-lg mb-2">
                    <TreePine className="h-6 w-6 text-pink-600 mx-auto" />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">Mother</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{genetic.parents.mother}</p>
                </div>

                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                  <span className="mx-2 text-gray-400">×</span>
                  <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                </div>

                <div className="text-center">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg mb-2">
                    <TreePine className="h-6 w-6 text-blue-600 mx-auto" />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">Father</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{genetic.parents.father}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Batches */}
          <Card title="Cultivation History" subtitle={`${geneticBatches.length} batches, ${totalPlants} plants total`}>
            <div className="space-y-3">
              {geneticBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{batch.code}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {batch.phenotype} • {batch.plantCount} plants • {batch.sowingDate}
                      </p>
                    </div>
                  </div>
                  <Badge variant={batch.state === 'harvested' ? 'success' : 'warning'}>
                    {batch.state}
                  </Badge>
                </div>
              ))}
              {geneticBatches.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No batches recorded yet
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Quick Stats">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Batches</span>
                <span className="font-bold text-gray-900 dark:text-white">{geneticBatches.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Batches</span>
                <span className="font-bold text-green-600">{activeBatches.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Plants</span>
                <span className="font-bold text-gray-900 dark:text-white">{totalPlants}</span>
              </div>
            </div>
          </Card>

          <Card title="Actions">
            <div className="space-y-3">
              <Button className="w-full" variant="secondary" icon={Beaker}>
                Start New Batch
              </Button>
              <Button className="w-full" variant="secondary" icon={BarChart3}>
                View Analytics
              </Button>
              <Button className="w-full" variant="secondary" icon={Image}>
                Add Photos
              </Button>
            </div>
          </Card>

          <Card title="Performance Score">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">8.7/10</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on yield, stability, and cultivation ease
              </p>
              <div className="mt-4 space-y-2 text-xs text-left">
                <div className="flex justify-between">
                  <span>Yield Performance:</span>
                  <span className="text-green-600">9.1/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Disease Resistance:</span>
                  <span className="text-green-600">8.5/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Growth Stability:</span>
                  <span className="text-yellow-600">8.0/10</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
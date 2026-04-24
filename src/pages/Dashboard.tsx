import React, { useState, useEffect } from 'react';
import { Sprout, Beaker, TrendingUp, AlertTriangle, Thermometer, Droplets, ChevronDown, ChevronUp, Zap, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge';
import Card from '../components/Card';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';

interface DashboardStats {
  activeBatches: number;
  genetics: number;
  labs: number;
  alerts: number;
}

interface ActivityItem {
  id: string;
  type: 'operation' | 'batch';
  description: string;
  detail: string;
  createdAt: string;
}

export default function Dashboard() {
  const { labs, genetics, batches, measurements } = useData();
  const { t, language } = useLanguage();
  const [expandedStat, setExpandedStat] = useState<string | null>(null);
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const activeBatches = batches.filter(batch => batch.state !== 'harvested');
  const floweringBatches = batches.filter(batch => batch.state === 'flowering');
  
  const recentMeasurements = measurements
    .filter(m => m.type === 'temperature' || m.type === 'humidity')
    .slice(-4);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.dashboard.getStats().catch(() => null),
          api.dashboard.getActivity().catch(() => null),
        ]);
        if (statsRes?.stats) setDashStats(statsRes.stats);
        if (activityRes?.activity) setActivity(activityRes.activity);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      }
    };
    fetchDashboard();
  }, []);

  const getTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return language === 'es' ? 'hace unos minutos' : 'just now';
    if (language === 'es') return `hace ${hours} horas`;
    return `${hours} hours ago`;
  };

  const stats = [
    {
      id: 'activeBatches',
      name: t('dashboard.activeBatches'),
      value: dashStats?.activeBatches ?? activeBatches.length,
      icon: Sprout,
      color: 'text-green-600'
    },
    {
      id: 'genetics',
      name: t('dashboard.geneticsLibrary'),
      value: dashStats?.genetics ?? genetics.length,
      icon: Beaker,
      color: 'text-blue-600'
    },
    {
      id: 'labs',
      name: t('dashboard.labsOnline'),
      value: dashStats?.labs ?? labs.length,
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      id: 'alerts',
      name: t('dashboard.alerts'),
      value: dashStats?.alerts ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        <div className="flex items-center space-x-4">
          <Badge variant="success">{t('dashboard.allSystemsOnline')}</Badge>
        </div>
      </div>

      {/* Quick Actions - Accesos rápidos para Operaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/ops/new" className="group">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 hover:shadow-md transition-all group-hover:border-blue-400">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Registrar Riego</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Riego matutino</p>
              </div>
              <Plus className="h-4 w-4 text-blue-600 ml-auto opacity-0 group-hover:opacity-100 transition" />
            </div>
          </div>
        </Link>

        <Link to="/ops/new" className="group">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50 border border-green-200 dark:border-green-800 rounded-lg p-4 hover:shadow-md transition-all group-hover:border-green-400">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-lg text-white">
                <Beaker className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Aplicar Dieta</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Nutrientes</p>
              </div>
              <Plus className="h-4 w-4 text-green-600 ml-auto opacity-0 group-hover:opacity-100 transition" />
            </div>
          </div>
        </Link>

        <Link to="/ops/logs" className="group">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-lg p-4 hover:shadow-md transition-all group-hover:border-purple-400">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Ver Bitácora</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Último evento</p>
              </div>
              <Plus className="h-4 w-4 text-purple-600 ml-auto opacity-0 group-hover:opacity-100 transition" />
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const isExpanded = expandedStat === stat.id;
          
          return (
            <div
              key={stat.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setExpandedStat(isExpanded ? null : stat.id)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                      <div className="flex items-baseline">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    {stat.id === 'activeBatches' && (
                      <div className="space-y-2">
                        {activeBatches.length === 0 ? (
                          <p className="text-sm text-gray-500">{t('common.noData')}</p>
                        ) : (
                          activeBatches.slice(0, 3).map(batch => {
                            const genetic = genetics.find(g => g.id === batch.geneticsId);
                            return (
                              <div key={batch.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900 dark:text-white">{batch.code}</span>
                                  <p className="text-gray-500 text-xs">{genetic?.name}</p>
                                </div>
                                <Badge variant={batch.state === 'flowering' ? 'warning' : 'success'} size="sm">
                                  {batch.state === 'vegetative' ? t('batches.vegetative') : 
                                   batch.state === 'flowering' ? t('batches.flowering') : 
                                   t('batches.harvested')}
                                </Badge>
                              </div>
                            );
                          })
                        )}
                        {activeBatches.length > 3 && (
                          <p className="text-xs text-gray-500 text-center mt-2">
                            +{activeBatches.length - 3} {t('common.all').toLowerCase()}
                          </p>
                        )}
                      </div>
                    )}

                    {stat.id === 'genetics' && (
                      <div className="space-y-2">
                        {genetics.length === 0 ? (
                          <p className="text-sm text-gray-500">{t('common.noData')}</p>
                        ) : (
                          genetics.slice(0, 3).map(genetic => (
                            <div key={genetic.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                              <div className="flex-1">
                                <span className="font-medium text-gray-900 dark:text-white">{genetic.name}</span>
                                <p className="text-gray-500 text-xs">{genetic.breeder}</p>
                              </div>
                            </div>
                          ))
                        )}
                        {genetics.length > 3 && (
                          <p className="text-xs text-gray-500 text-center mt-2">
                            +{genetics.length - 3} {t('common.all').toLowerCase()}
                          </p>
                        )}
                      </div>
                    )}

                    {stat.id === 'labs' && (
                      <div className="space-y-2">
                        {labs.length === 0 ? (
                          <p className="text-sm text-gray-500">{t('common.noData')}</p>
                        ) : (
                          labs.slice(0, 3).map(lab => (
                            <div key={lab.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                              <div className="flex-1">
                                <span className="font-medium text-gray-900 dark:text-white">{lab.name}</span>
                                <p className="text-gray-500 text-xs">{lab.type}</p>
                              </div>
                            </div>
                          ))
                        )}
                        {labs.length > 3 && (
                          <p className="text-xs text-gray-500 text-center mt-2">
                            +{labs.length - 3} {t('common.all').toLowerCase()}
                          </p>
                        )}
                      </div>
                    )}

                    {stat.id === 'alerts' && (
                      <div className="space-y-2">
                        {(dashStats?.alerts ?? 0) === 0 ? (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {t('dashboard.allSystemsOnline')}
                          </p>
                        ) : (
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            {dashStats?.alerts} {t('dashboard.alerts').toLowerCase()} {language === 'es' ? 'en las últimas 24h' : 'in the last 24h'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Batches */}
        <Card title={t('dashboard.activeBatchesTitle')} subtitle={t('dashboard.activeBatchesSubtitle')}>
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
                      {batch.state === 'vegetative' ? t('batches.vegetative') : 
                       batch.state === 'flowering' ? t('batches.flowering') : 
                       t('batches.harvested')}
                    </Badge>
                    <span className="text-sm text-gray-500">{batch.plantCount} {t('dashboard.plants')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Environmental Conditions */}
        <Card title={t('dashboard.liveEnvironmentalData')} subtitle={t('dashboard.latestSensorReadings')}>
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
                        {measurement.type === 'temperature' ? t('dashboard.temperature') : t('dashboard.humidity')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('dashboard.batch')} {batch?.code}
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
      <Card title={t('dashboard.recentActivity')} subtitle={t('dashboard.latestCultivationEvents')}>
        <div className="space-y-4">
          {activity.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
              {t('common.noData')}
            </p>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${item.type === 'batch' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.description}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.detail} • {getTimeAgo(item.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
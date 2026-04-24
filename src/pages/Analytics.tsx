import React, { useMemo, useState } from 'react';
import { TrendingUp, Target, Calendar, BarChart3, AlertTriangle, Layers, RefreshCw } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTenant } from '../contexts/TenantContext';

export default function Analytics() {
  const { genetics, batches, measurements, isLoading, error, errors, refreshData } = useData();
  const { t } = useLanguage();
  const { selectedTenant } = useTenant();

  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('90d');
  const [selectedGeneticsId, setSelectedGeneticsId] = useState<string>('all');

  // Cutoff date for timeRange filter
  const timeCutoff = useMemo(() => {
    const now = new Date();
    if (timeRange === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (timeRange === '90d') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }, [timeRange]);

  // Batches filtered by genetics AND time range (sowingDate is a reliable date field on every batch)
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      if (selectedGeneticsId !== 'all' && b.geneticsId !== selectedGeneticsId) return false;
      if (b.sowingDate && new Date(b.sowingDate) < timeCutoff) return false;
      return true;
    });
  }, [batches, selectedGeneticsId, timeCutoff]);

  // Measurements filtered by timeRange and genetics (via batchId)
  // Note: only filters by genetics if a specific one is selected, since not all measurements have batchId
  const filteredMeasurements = useMemo(() => {
    const batchIds = new Set(filteredBatches.map(b => b.id));
    return measurements.filter(m => {
      // Filter by time range using createdAt or takenAt
      const dateStr = m.takenAt || m.createdAt;
      if (dateStr && new Date(dateStr) < timeCutoff) return false;
      // Filter by genetics via batchId (only when a specific genetics is selected)
      if (selectedGeneticsId !== 'all' && m.batchId && !batchIds.has(m.batchId)) return false;
      return true;
    });
  }, [measurements, timeCutoff, selectedGeneticsId, filteredBatches]);

  // KPI: batch counts (real data)
  const totalBatches = filteredBatches.length;
  const activeBatches = filteredBatches.filter(b => b.state?.toLowerCase() !== 'harvested').length;
  const harvestedBatches = filteredBatches.filter(b => b.state?.toLowerCase() === 'harvested').length;
  const harvestRate: number | null = totalBatches > 0
    ? parseFloat(((harvestedBatches / totalBatches) * 100).toFixed(1))
    : null;

  // KPI: avg flowering time from genetics used in filtered batches
  const avgFloweringTime = useMemo((): number | null => {
    const usedGeneticsIds = new Set(filteredBatches.map(b => b.geneticsId));
    const usedGenetics = genetics.filter(g => usedGeneticsIds.has(g.id) && g.floweringDays);
    if (usedGenetics.length === 0) return null;
    const total = usedGenetics.reduce((sum, g) => sum + (g.floweringDays || 0), 0);
    return parseFloat((total / usedGenetics.length).toFixed(1));
  }, [genetics, filteredBatches]);

  // Environmental averages — only from real measurements, never fallback to hardcoded values
  const envData = useMemo(() => {
    const avg = (values: number[]): number | null =>
      values.length > 0
        ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
        : null;

    const temps   = filteredMeasurements.filter(m => m.type === 'temperature').map(m => m.value);
    const hums    = filteredMeasurements.filter(m => m.type === 'humidity').map(m => m.value);
    const phs     = filteredMeasurements.filter(m => m.type === 'ph').map(m => m.value);
    const ecs     = filteredMeasurements.filter(m => m.type === 'ec').map(m => m.value);

    const avgTemp     = avg(temps);
    const avgHumidity = avg(hums);
    const avgPH       = avg(phs);
    const avgEC       = avg(ecs);

    // Environmental score only when we have both temperature AND humidity
    let envScore: number | null = null;
    if (avgTemp !== null && avgHumidity !== null) {
      let score = 10;
      if (avgTemp < 22 || avgTemp > 26) score -= 1;
      if (avgHumidity < 55 || avgHumidity > 65) score -= 1;
      if (avgPH !== null && (avgPH < 5.8 || avgPH > 6.2)) score -= 0.5;
      if (avgEC !== null && (avgEC < 1.2 || avgEC > 1.8)) score -= 0.5;
      envScore = parseFloat(Math.max(5, Math.min(10, score)).toFixed(1));
    }

    return { avgTemp, avgHumidity, avgPH, avgEC, envScore };
  }, [filteredMeasurements]);

  // Genetics ranking — uses filteredBatches so timeRange and selectedGenetics filters are consistent
  const geneticsRanking = useMemo(() => {
    return genetics
      .map(g => ({
        id: g.id,
        name: g.name,
        batchCount: filteredBatches.filter(b => b.geneticsId === g.id).length,
        activeBatchCount: filteredBatches.filter(b => b.geneticsId === g.id && b.state?.toLowerCase() !== 'harvested').length,
        floweringDays: g.floweringDays ?? null,
        yieldEstimate: g.yieldEstimate ?? null,
      }))
      .filter(g => g.batchCount > 0)
      .sort((a, b) => b.batchCount - a.batchCount)
      .slice(0, 5);
  }, [genetics, filteredBatches]);

  // Environmental parameter display config
  const environmentalParams = useMemo(() => [
    {
      key: 'temperature',
      label: t('monitoring.temperature'),
      value: envData.avgTemp,
      unit: '°C',
      optimal: '22–26°C',
      isWarning: envData.avgTemp !== null && (envData.avgTemp < 22 || envData.avgTemp > 26),
    },
    {
      key: 'humidity',
      label: t('monitoring.humidity'),
      value: envData.avgHumidity,
      unit: '%',
      optimal: '55–65%',
      isWarning: envData.avgHumidity !== null && (envData.avgHumidity < 55 || envData.avgHumidity > 65),
    },
    {
      key: 'ph',
      label: t('monitoring.ph'),
      value: envData.avgPH,
      unit: '',
      optimal: '5.8–6.2',
      isWarning: envData.avgPH !== null && (envData.avgPH < 5.8 || envData.avgPH > 6.2),
    },
    {
      key: 'ec',
      label: t('monitoring.ec'),
      value: envData.avgEC,
      unit: ' mS/cm',
      optimal: '1.2–1.8',
      isWarning: envData.avgEC !== null && (envData.avgEC < 1.2 || envData.avgEC > 1.8),
    },
  ], [envData, t]);

  // No tenant selected
  if (!selectedTenant) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('analytics.title')}</h1>
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">{t('analytics.noTenant')}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state from DataContext (avoids duplicate API calls)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('analytics.title')}</h1>
        <Card>
          <div className="text-center py-8">
            <div className="inline-block animate-spin">
              <div className="h-8 w-8 border-4 border-gray-300 border-t-green-600 rounded-full"></div>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t('analytics.loading')}</p>
          </div>
        </Card>
      </div>
    );
  }

  // API error state — shown when any critical endpoint failed; keeps loading false
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('analytics.title')}</h1>
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {t('analytics.errorTitle')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t('analytics.errorSubtitle')}
            </p>
            {(errors.batches || errors.genetics || errors.measurements) && (
              <p className="text-sm text-gray-400 mb-4">{t('analytics.partialError')}</p>
            )}
            <button
              onClick={refreshData}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium mt-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{t('analytics.retry')}</span>
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('analytics.title')}</h1>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="30d">{t('analytics.last30d')}</option>
            <option value="90d">{t('analytics.last90d')}</option>
            <option value="1y">{t('analytics.lastYear')}</option>
          </select>
          <select
            value={selectedGeneticsId}
            onChange={(e) => setSelectedGeneticsId(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="all">{t('analytics.allGenetics')}</option>
            {genetics.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards — all real data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Batches */}
        <Card>
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-blue-600">
              <Layers className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('analytics.totalBatches')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBatches}</p>
            </div>
          </div>
        </Card>

        {/* Active Batches */}
        <Card>
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('analytics.activeBatches')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeBatches}</p>
            </div>
          </div>
        </Card>

        {/* Harvest Rate */}
        <Card>
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-purple-600">
              <Target className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('analytics.harvestRate')}</p>
              {harvestRate !== null ? (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{harvestRate}%</p>
              ) : (
                <p className="text-2xl font-bold text-gray-400">--</p>
              )}
            </div>
          </div>
        </Card>

        {/* Avg Flowering Time */}
        <Card>
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-orange-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('analytics.avgFloweringTime')}</p>
              {avgFloweringTime !== null ? (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgFloweringTime} {t('analytics.days')}
                </p>
              ) : (
                <p className="text-2xl font-bold text-gray-400">--</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Environmental Score — only shown when calculable from real measurements */}
      {envData.envScore !== null && (
        <Card>
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-orange-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('analytics.envScore')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{envData.envScore}/10</p>
              <p className="text-xs text-gray-400 mt-0.5">{t('analytics.envScoreNote')}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genetics Ranking — by batch count (real) */}
        <Card title={t('analytics.geneticsRankingTitle')} subtitle={t('analytics.geneticsRankingSubtitle')}>
          {geneticsRanking.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t('analytics.noGeneticsData')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {geneticsRanking.map((g, index) => (
                <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{g.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {g.batchCount} {t('analytics.batches')} · {g.activeBatchCount} {t('analytics.active')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {g.yieldEstimate ? (
                      <div>
                        <p className="text-xs text-gray-400">{t('analytics.estimated')}</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{g.yieldEstimate}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">{t('analytics.noYieldData')}</p>
                    )}
                    {g.floweringDays && (
                      <p className="text-xs text-gray-400 mt-0.5">{g.floweringDays} {t('analytics.days')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Environmental Parameters — real measurements only */}
        <Card title={t('analytics.envParamsTitle')} subtitle={t('analytics.envParamsSubtitle')}>
          {filteredMeasurements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t('analytics.noMeasurementsData')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {environmentalParams.map(param => (
                <div key={param.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{param.label}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('analytics.optimal')}: {param.optimal}
                    </p>
                  </div>
                  <div className="text-right">
                    {param.value !== null ? (
                      <>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {param.value}{param.unit}
                        </p>
                        <Badge variant={param.isWarning ? 'warning' : 'success'} size="sm">
                          {param.isWarning ? t('analytics.warning') : t('analytics.stable')}
                        </Badge>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-gray-400">--</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Harvest data informational note */}
      <Card>
        <div className="flex items-start space-x-3 p-1">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('analytics.harvestDataNote')}
          </p>
        </div>
      </Card>
    </div>
  );
}
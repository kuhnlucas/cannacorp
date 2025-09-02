import React, { useState } from 'react';
import { BarChart3, TrendingUp, Award, Target, Calendar, Filter } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useData } from '../contexts/DataContext';

export default function Analytics() {
  const { genetics, batches, measurements } = useData();
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('90d');
  const [selectedGenetics, setSelectedGenetics] = useState<string>('all');

  // Mock analytics data - in a real app, this would come from your API
  const yieldData = genetics.map(genetic => ({
    id: genetic.id,
    name: genetic.name,
    avgYield: 450 + Math.random() * 200,
    batches: batches.filter(b => b.geneticsId === genetic.id).length,
    successRate: 85 + Math.random() * 15
  })).sort((a, b) => b.avgYield - a.avgYield);

  const performanceMetrics = [
    {
      name: 'Average Yield',
      value: '482g/m²',
      change: '+12%',
      changeType: 'increase',
      icon: Award,
      color: 'text-green-600'
    },
    {
      name: 'Success Rate',
      value: '89%',
      change: '+5%',
      changeType: 'increase',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      name: 'Avg Flowering Time',
      value: '62 days',
      change: '-2 days',
      changeType: 'decrease',
      icon: Calendar,
      color: 'text-purple-600'
    },
    {
      name: 'Environmental Score',
      value: '8.7/10',
      change: '+0.3',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ];

  const topPerformers = yieldData.slice(0, 3);

  const environmentalTrends = [
    {
      parameter: 'Temperature',
      avg: 24.2,
      unit: '°C',
      trend: 'stable',
      optimal: '22-26°C'
    },
    {
      parameter: 'Humidity',
      avg: 62,
      unit: '%',
      trend: 'decreasing',
      optimal: '55-65%'
    },
    {
      parameter: 'pH',
      avg: 6.1,
      unit: '',
      trend: 'stable',
      optimal: '5.8-6.2'
    },
    {
      parameter: 'EC',
      avg: 1.6,
      unit: 'mS/cm',
      trend: 'increasing',
      optimal: '1.2-1.8'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <select
            value={selectedGenetics}
            onChange={(e) => setSelectedGenetics(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Genetics</option>
            {genetics.map((genetic) => (
              <option key={genetic.id} value={genetic.id}>{genetic.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric) => (
          <Card key={metric.name}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${metric.color}`}>
                <metric.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                  <p className={`ml-2 text-sm font-medium ${
                    metric.changeType === 'increase' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {metric.change}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genetics Performance Ranking */}
        <Card title="Genetics Performance Ranking" subtitle="Ranked by average yield per m²">
          <div className="space-y-4">
            {yieldData.slice(0, 5).map((genetic, index) => (
              <div key={genetic.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{genetic.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {genetic.batches} batches • {genetic.successRate.toFixed(0)}% success
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {genetic.avgYield.toFixed(0)}g/m²
                  </p>
                  {index < 3 && (
                    <Badge variant="success" size="sm">
                      Top Performer
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Environmental Trends */}
        <Card title="Environmental Parameter Trends" subtitle="Average conditions over selected period">
          <div className="space-y-4">
            {environmentalTrends.map((trend) => (
              <div key={trend.parameter} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{trend.parameter}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Optimal: {trend.optimal}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {trend.avg}{trend.unit}
                  </p>
                  <Badge 
                    variant={
                      trend.trend === 'stable' ? 'success' :
                      trend.trend === 'increasing' ? 'warning' : 'info'
                    } 
                    size="sm"
                  >
                    {trend.trend}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Yield Comparison Chart */}
      <Card title="Yield Comparison by Genetics" subtitle="Historical yield performance">
        <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Yield comparison charts will be displayed here</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Interactive charts showing genetics performance over time
            </p>
          </div>
        </div>
      </Card>

      {/* Growth Phase Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Vegetative Phase" subtitle="Average duration and performance">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Duration</span>
              <span className="font-bold text-green-600">28 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Growth Rate Score</span>
              <span className="font-bold text-blue-600">8.4/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Health Score</span>
              <span className="font-bold text-purple-600">9.1/10</span>
            </div>
          </div>
        </Card>

        <Card title="Flowering Phase" subtitle="Flowering performance metrics">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Duration</span>
              <span className="font-bold text-green-600">61 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bud Development</span>
              <span className="font-bold text-blue-600">8.7/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Trichome Quality</span>
              <span className="font-bold text-purple-600">9.3/10</span>
            </div>
          </div>
        </Card>

        <Card title="Harvest Results" subtitle="Final yield and quality metrics">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Fresh Weight Avg</span>
              <span className="font-bold text-green-600">2.1kg/m²</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Dry Weight Avg</span>
              <span className="font-bold text-blue-600">482g/m²</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Quality Score</span>
              <span className="font-bold text-purple-600">8.9/10</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
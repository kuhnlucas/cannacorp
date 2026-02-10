/**
 * Alertas
 * Vista dedicada para alertas del sistema
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import Card from '../components/Card';
import Breadcrumbs from '../components/Breadcrumbs';
import Badge from '../components/Badge';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import { useData } from '../contexts/DataContext';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  room?: string;
  resolved: boolean;
  measurement?: {
    type: string;
    value: number;
    unit: string;
  };
}

export default function AlertsPage() {
  const { t } = useLanguage();
  const { labs } = useData();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const measurements = await api.monitoring.getMeasurements();
        
        // Crear mapa de labs por ID
        const labMap = new Map(labs.map(lab => [lab.id, lab.name]));
        
        // Generar alertas basadas en mediciones reales
        const generatedAlerts: Alert[] = [];
        const alertIds = new Set<string>();

        measurements.forEach((measurement: any, index: number) => {
          const labName = labMap.get(measurement.batchId) || `Lab ${measurement.batchId?.slice(0, 4)}`;
          
          if (measurement.type === 'temperature') {
            if (measurement.value > 30) {
              const alertId = `temp-error-${measurement.batchId}-${index}`;
              if (!alertIds.has(alertId)) {
                alertIds.add(alertId);
                generatedAlerts.push({
                  id: alertId,
                  type: 'error',
                  title: 'Temperatura crítica',
                  message: `La temperatura en ${labName} ha alcanzado ${measurement.value}°C (límite: 30°C)`,
                  timestamp: new Date(measurement.createdAt || Date.now()),
                  room: labName,
                  resolved: dismissedAlerts.has(alertId),
                  measurement: { type: 'temperature', value: measurement.value, unit: '°C' }
                });
              }
            } else if (measurement.value > 27) {
              const alertId = `temp-warning-${measurement.batchId}-${index}`;
              if (!alertIds.has(alertId)) {
                alertIds.add(alertId);
                generatedAlerts.push({
                  id: alertId,
                  type: 'warning',
                  title: 'Temperatura elevada',
                  message: `La temperatura en ${labName} está en ${measurement.value}°C (óptimo: < 27°C)`,
                  timestamp: new Date(measurement.createdAt || Date.now()),
                  room: labName,
                  resolved: dismissedAlerts.has(alertId),
                  measurement: { type: 'temperature', value: measurement.value, unit: '°C' }
                });
              }
            }
          }
          
          if (measurement.type === 'humidity') {
            if (measurement.value < 40 || measurement.value > 80) {
              const alertId = `humidity-${measurement.batchId}-${index}`;
              if (!alertIds.has(alertId)) {
                alertIds.add(alertId);
                generatedAlerts.push({
                  id: alertId,
                  type: 'warning',
                  title: 'Humedad fuera de rango',
                  message: `La humedad en ${labName} está en ${measurement.value}% (rango: 40-80%)`,
                  timestamp: new Date(measurement.createdAt || Date.now()),
                  room: labName,
                  resolved: dismissedAlerts.has(alertId),
                  measurement: { type: 'humidity', value: measurement.value, unit: '%' }
                });
              }
            }
          }
          
          if (measurement.type === 'ph') {
            if (measurement.value < 5.5 || measurement.value > 6.5) {
              const alertId = `ph-${measurement.batchId}-${index}`;
              if (!alertIds.has(alertId)) {
                alertIds.add(alertId);
                generatedAlerts.push({
                  id: alertId,
                  type: 'warning',
                  title: 'pH fuera de rango',
                  message: `El pH en ${labName} está en ${measurement.value} (óptimo: 5.5-6.5)`,
                  timestamp: new Date(measurement.createdAt || Date.now()),
                  room: labName,
                  resolved: dismissedAlerts.has(alertId),
                  measurement: { type: 'ph', value: measurement.value, unit: '' }
                });
              }
            }
          }

          if (measurement.type === 'ec') {
            if (measurement.value < 0.5 || measurement.value > 2.0) {
              const alertId = `ec-${measurement.batchId}-${index}`;
              if (!alertIds.has(alertId)) {
                alertIds.add(alertId);
                generatedAlerts.push({
                  id: alertId,
                  type: 'warning',
                  title: 'EC fuera de rango',
                  message: `La conductividad en ${labName} está en ${measurement.value} mS/cm (rango: 0.5-2.0)`,
                  timestamp: new Date(measurement.createdAt || Date.now()),
                  room: labName,
                  resolved: dismissedAlerts.has(alertId),
                  measurement: { type: 'ec', value: measurement.value, unit: 'mS/cm' }
                });
              }
            }
          }
        });

        // Ordenar por timestamp más reciente primero
        generatedAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setAlerts(generatedAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [labs, dismissedAlerts]);

  const [filterType, setFilterType] = useState<'all' | 'unresolved' | 'resolved'>(
    'unresolved'
  );

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]));
  };

  const filteredAlerts = alerts.filter((alert) => {
    // No mostrar alertas descartadas
    if (dismissedAlerts.has(alert.id)) return false;
    
    if (filterType === 'unresolved') return !alert.resolved;
    if (filterType === 'resolved') return alert.resolved;
    return true;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30';
      default:
        return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `hace ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `hace ${diffDays}d`;
  };

  const unresolved = alerts.filter((a) => !a.resolved).length;

  const breadcrumbs = [
    { label: 'Monitoreo', href: '/alerts' },
    { label: 'Alertas', current: true },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <Breadcrumbs items={breadcrumbs} />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Alertas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitoreo de eventos críticos y notificaciones del sistema
            </p>
          </div>
          {unresolved > 0 && (
            <div className="inline-flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg font-medium">
              <AlertCircle className="h-5 w-5 mr-2" />
              {unresolved} alertas activas
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {(['all', 'unresolved', 'resolved'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === filter
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {filter === 'all'
                ? 'Todas'
                : filter === 'unresolved'
                  ? 'Activas'
                  : 'Resueltas'}
            </button>
          ))}
        </div>

        {/* Lista de alertas */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Todas las alertas resueltas
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                El sistema está funcionando correctamente
              </p>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-4 border-l-4 ${getAlertColor(alert.type)} ${
                  alert.resolved ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {alert.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatTime(alert.timestamp)}</span>
                      {alert.room && (
                        <>
                          <span>•</span>
                          <span>{alert.room}</span>
                        </>
                      )}
                      {alert.resolved && (
                        <>
                          <span>•</span>
                          <Badge variant="success" size="sm">
                            Resuelta
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {!alert.resolved && (
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                      title="Marcar como resuelta"
                    >
                      <X className="h-5 w-5 text-gray-400" />
                    </button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

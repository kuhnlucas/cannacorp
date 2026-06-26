/**
 * Constantes y tipos de producción para el módulo de Operaciones.
 * Importar desde aquí en componentes runtime.
 * Los datos mock/demo viven exclusivamente en src/mocks/ops.ts.
 */

export type EventType =
  | 'watering'
  | 'fertilizer'
  | 'foliar'
  | 'ipm'
  | 'pruning'
  | 'transplant'
  | 'incident'
  | 'harvest';

// Mapeo de tipos de eventos a etiquetas legibles
export const eventTypeLabels: Record<EventType, string> = {
  watering: 'Riego',
  fertilizer: 'Dieta',
  foliar: 'Foliar',
  ipm: 'IPM',
  pruning: 'Poda',
  transplant: 'Trasplante',
  incident: 'Incidencia',
  harvest: 'Cosecha',
};

// Colores para chips según tipo
export const eventTypeColors: Record<EventType, string> = {
  watering: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  fertilizer: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  foliar: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  ipm: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  pruning: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  transplant: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  incident: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  harvest: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
};

// Tipos de eventos disponibles para registro rápido
export const quickEventTypes: Array<{
  type: EventType;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    type: 'watering',
    label: 'Riego',
    icon: '💧',
    description: 'Registrar riego',
  },
  {
    type: 'fertilizer',
    label: 'Dieta',
    icon: '🥬',
    description: 'Aplicar fertilizante',
  },
  {
    type: 'foliar',
    label: 'Foliar',
    icon: '🌿',
    description: 'Spray foliar',
  },
  {
    type: 'ipm',
    label: 'IPM',
    icon: '🛡️',
    description: 'Control de plagas',
  },
  {
    type: 'pruning',
    label: 'Poda',
    icon: '✂️',
    description: 'Poda y deshojes',
  },
  {
    type: 'transplant',
    label: 'Trasplante',
    icon: '🌱',
    description: 'Trasplante de plantas',
  },
  {
    type: 'incident',
    label: 'Incidencia',
    icon: '⚠️',
    description: 'Reportar problema',
  },
  {
    type: 'harvest',
    label: 'Cosecha',
    icon: '🎉',
    description: 'Cosecha/Pesaje',
  },
];

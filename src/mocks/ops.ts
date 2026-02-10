/**
 * Mocks para el módulo de Operaciones
 * Datos de ejemplo para Registro, Bitácora y Plan
 * Preparado para integración con API a futuro
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

export interface OperationEvent {
  id: string;
  lab: string;
  room: string;
  batch?: string;
  type: EventType;
  timestamp: Date;
  data: Record<string, any>;
  notes?: string;
  attachments?: string[];
}

export interface PlanTask {
  id: string;
  room: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  overdue: boolean;
}

// Mock data - Bitácora de eventos
export const mockOperationEvents: OperationEvent[] = [
  {
    id: '1',
    lab: 'Lab A',
    room: 'Sala 1',
    batch: 'Batch #001',
    type: 'watering',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    data: {
      volume: 5.2,
      ph: 6.1,
      ec: 1.8,
    },
    notes: 'Riego matutino normal',
  },
  {
    id: '2',
    lab: 'Lab A',
    room: 'Sala 1',
    batch: 'Batch #001',
    type: 'fertilizer',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    data: {
      recipe: 'Standard Growth',
      targetEC: 1.8,
      products: {
        'NPK 5-2-1': 3.5,
        'Calcium': 1.2,
        'Magnesium': 0.8,
      },
    },
    notes: 'Aplicada receta estándar',
  },
  {
    id: '3',
    lab: 'Lab A',
    room: 'Sala 2',
    batch: 'Batch #002',
    type: 'ipm',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    data: {
      product: 'Neem Oil',
      dosage: '5ml/L',
      target: 'Spider Mites',
    },
    notes: 'Detectados ácaros en zona inferior',
  },
  {
    id: '4',
    lab: 'Lab B',
    room: 'Sala 3',
    type: 'incident',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    data: {
      incidentType: 'Leaf Spot',
      severity: 'medium',
      affectedArea: '15%',
    },
    notes: 'Mancha foliar detectada, mejorando ventilación',
  },
];

// Mock data - Plan/Checklist
export const mockPlanTasks: PlanTask[] = [
  {
    id: '1',
    room: 'Sala 1',
    title: 'Riego matutino',
    dueDate: new Date(),
    completed: true,
    overdue: false,
  },
  {
    id: '2',
    room: 'Sala 1',
    title: 'Inspeccionar plagas',
    dueDate: new Date(),
    completed: false,
    overdue: false,
  },
  {
    id: '3',
    room: 'Sala 1',
    title: 'Ajustar pH/EC',
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    completed: false,
    overdue: true,
  },
  {
    id: '4',
    room: 'Sala 2',
    title: 'Cambio de recipientes',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    completed: false,
    overdue: false,
  },
  {
    id: '5',
    room: 'Sala 3',
    title: 'Preparar cosecha',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    completed: false,
    overdue: false,
  },
];

// Mapeo de tipos de eventos a etiquetas
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

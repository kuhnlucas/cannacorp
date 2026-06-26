/**
 * Mocks para el módulo de Operaciones
 * Datos de ejemplo para Registro, Bitácora y Plan
 * SOLO para uso en dev/tests — no importar desde páginas runtime.
 */

// Importar tipos y constantes reales desde constants/operations
export type { EventType } from '../constants/operations';
export { eventTypeLabels, eventTypeColors, quickEventTypes } from '../constants/operations';

import type { EventType } from '../constants/operations';

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

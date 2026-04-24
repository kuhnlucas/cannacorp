/**
 * Plan / Checklist de Operaciones
 * Tareas diarias por sala
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, AlertCircle, Calendar } from 'lucide-react';
import Card from '../../components/Card';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { eventTypeLabels, EventType } from '../../mocks/ops';
import api from '../../services/api';

interface PlanTask {
  id: string;
  title: string;
  labName: string;
  batchCode: string;
  dueDate: string;
  completed: boolean;
  overdue: boolean;
}

export default function OperationPlanPage() {
  const { t } = useLanguage();
  const { labs } = useData();
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [selectedLab, setSelectedLab] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await api.operations.getAll();
        const ops = res.operations || res || [];
        // Convert recent operations into today's task list
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const planTasks: PlanTask[] = ops.map((op: any) => {
          const created = new Date(op.createdAt);
          return {
            id: op.id,
            title: `${eventTypeLabels[op.type as EventType] || op.type}${op.batch?.code ? ` — ${op.batch.code}` : ''}`,
            labName: op.lab?.name || '—',
            batchCode: op.batch?.code || '',
            dueDate: op.createdAt,
            completed: true, // Past operations are "done"
            overdue: false,
          };
        });
        setTasks(planTasks);
      } catch (err) {
        console.error('Error fetching plan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const filteredTasks =
    selectedLab === 'all'
      ? tasks
      : tasks.filter((t) => t.labName === selectedLab);

  const uniqueLabs = Array.from(new Set(tasks.map((t) => t.labName))).filter(n => n !== '—');

  const completedCount = filteredTasks.filter((t) => t.completed).length;
  const completionPercentage = Math.round(
    (completedCount / filteredTasks.length) * 100
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) {
      return 'Hoy';
    } else if (d.getTime() === tomorrow.getTime()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    }
  };

  const breadcrumbs = [
    { label: 'Operaciones', href: '/ops/new' },
    { label: 'Plan / Checklist', current: true },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <Breadcrumbs items={breadcrumbs} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Plan de Operaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Checklist de tareas diarias por sala
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tareas totales
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredTasks.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completadas
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {completedCount}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Progreso
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completionPercentage}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                {completionPercentage}%
              </div>
            </div>
          </Card>
        </div>

        {/* Filtro de labs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setSelectedLab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedLab === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Todos los labs
          </button>
          {uniqueLabs.map((lab) => (
            <button
              key={lab}
              onClick={() => setSelectedLab(lab)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedLab === lab
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {lab}
            </button>
          ))}
        </div>

        {/* Lista de tareas */}
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="p-4 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="flex-shrink-0 transition"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${
                      task.completed
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span>{task.labName}</span>
                    <span>•</span>
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                </div>

                {task.overdue && !task.completed && (
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                      <AlertCircle className="h-3 w-3" />
                      <span>Vencida</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

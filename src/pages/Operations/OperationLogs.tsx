/**
 * Bitácora de Operaciones
 * Vista filtrable de eventos registrados
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Breadcrumbs from '../../components/Breadcrumbs';
import { mockOperationEvents, eventTypeLabels, eventTypeColors, EventType } from '../../mocks/ops';
import { useLanguage } from '../../contexts/LanguageContext';

export default function OperationLogsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('all');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredEvents = useMemo(() => {
    let filtered = [...mockOperationEvents];

    // Filtro por sala
    if (filterRoom !== 'all') {
      filtered = filtered.filter((e) => e.room === filterRoom);
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter((e) => e.type === filterType);
    }

    // Búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.lab.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.batch && e.batch.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      return sortOrder === 'desc'
        ? b.timestamp.getTime() - a.timestamp.getTime()
        : a.timestamp.getTime() - b.timestamp.getTime();
    });

    return filtered;
  }, [searchTerm, filterRoom, filterType, sortOrder]);

  const uniqueRooms = Array.from(new Set(mockOperationEvents.map((e) => e.room)));

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

  const breadcrumbs = [
    { label: 'Operaciones', href: '/ops/new' },
    { label: 'Bitácora', current: true },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <Breadcrumbs items={breadcrumbs} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bitácora de Operaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Historial de eventos registrados en las salas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de filtros */}
          <Card className="h-fit lg:col-span-1">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </h3>

              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Sala, lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>

              {/* Sala */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sala
                </label>
                <select
                  value={filterRoom}
                  onChange={(e) => setFilterRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="all">Todas</option>
                  {uniqueRooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="watering">Riego</option>
                  <option value="fertilizer">Dieta</option>
                  <option value="foliar">Foliar</option>
                  <option value="ipm">IPM</option>
                  <option value="pruning">Poda</option>
                  <option value="transplant">Trasplante</option>
                  <option value="incident">Incidencia</option>
                  <option value="harvest">Cosecha</option>
                </select>
              </div>

              {/* Ordenamiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordenar
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="desc">Más recientes</option>
                  <option value="asc">Más antiguos</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterRoom('all');
                  setFilterType('all');
                }}
                className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Limpiar filtros
              </button>
            </div>
          </Card>

          {/* Lista de eventos */}
          <div className="lg:col-span-3 space-y-3">
            {filteredEvents.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay eventos que coincidan con los filtros
                  </p>
                </div>
              </Card>
            ) : (
              filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="p-4 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="info" size="sm">
                          {eventTypeLabels[event.type]}
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Lab:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {event.lab}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Sala:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {event.room}
                          </p>
                        </div>
                        {event.batch && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Lote:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {event.batch}
                            </p>
                          </div>
                        )}
                      </div>
                      {event.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                          "{event.notes}"
                        </p>
                      )}
                      {Object.keys(event.data).length > 0 && (
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          {Object.entries(event.data)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(' • ')}
                        </div>
                      )}
                    </div>
                    <ChevronDown className="h-5 w-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

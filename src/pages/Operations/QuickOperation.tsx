/**
 * Registro Rápido de Operaciones
 * UI minimalista para registrar eventos de cultivo rápidamente
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import Card from '../../components/Card';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { quickEventTypes, EventType } from '../../mocks/ops';
import api from '../../services/api';

export default function QuickOperationsPage() {
  const { t } = useLanguage();
  const { labs, batches } = useData();
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    labId: '',
    room: '',
    batchId: '',
    volume: '',
    ph: '',
    ec: '',
    notes: '',
  });

  const handleEventTypeSelect = (type: EventType) => {
    setSelectedEventType(type);
    setFormData({
      labId: labs[0]?.id || '',
      room: '',
      batchId: '',
      volume: '',
      ph: '',
      ec: '',
      notes: '',
    });
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventType || submitting) return;
    setSubmitting(true);
    try {
      const data: Record<string, any> = {};
      if (formData.volume) data.volume = formData.volume;
      if (formData.ph) data.ph = formData.ph;
      if (formData.ec) data.ec = formData.ec;
      if (formData.room) data.room = formData.room;

      await api.operations.create({
        type: selectedEventType,
        batchId: formData.batchId || undefined,
        labId: formData.labId || undefined,
        data,
        notes: formData.notes || undefined,
      });

      const labName = labs.find(l => l.id === formData.labId)?.name || '';
      showSuccessToast(`✅ Evento registrado en ${labName}`);
      setSelectedEventType(null);
    } catch (err) {
      console.error('Error creating operation:', err);
      showSuccessToast('❌ Error al registrar evento');
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Operaciones', href: '/ops/new' },
    { label: 'Registro Rápido', current: true },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <Breadcrumbs items={breadcrumbs} />

        {selectedEventType ? (
          // Formulario para evento seleccionado
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Registrar {quickEventTypes.find((e) => e.type === selectedEventType)?.label}
              </h2>
              <button
                onClick={() => setSelectedEventType(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contexto */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Laboratorio
                  </label>
                  <select
                    value={formData.labId}
                    onChange={(e) => setFormData({ ...formData, labId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Seleccionar...</option>
                    {labs.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sala
                  </label>
                  <input
                    type="text"
                    placeholder="Sala 1"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lote (opcional)
                  </label>
                  <select
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Sin lote</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parámetros específicos */}
              {selectedEventType === 'watering' && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Volumen (L)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="5.2"
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      pH
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="5"
                      max="8"
                      placeholder="6.1"
                      value={formData.ph}
                      onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      EC (mS/cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="1.8"
                      value={formData.ec}
                      onChange={(e) => setFormData({ ...formData, ec: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {selectedEventType === 'fertilizer' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Receta
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                      <option>Standard Growth</option>
                      <option>Bloom Boost</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Producto (ej: NPK 5-2-1)"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="ml/L"
                      step="0.1"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {selectedEventType === 'ipm' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-4">
                  <input
                    type="text"
                    placeholder="Producto (ej: Neem Oil)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Dosis (ej: 5ml/L)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    <option>Spider Mites</option>
                    <option>Aphids</option>
                    <option>Whiteflies</option>
                  </select>
                </div>
              )}

              {selectedEventType === 'incident' && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg space-y-4">
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    <option>Leaf Spot</option>
                    <option>Mold</option>
                    <option>Pest Infestation</option>
                    <option>Nutrient Issue</option>
                  </select>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalles adicionales..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEventType(null)}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Card>
        ) : (
          // Grilla de tipos de eventos
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Registrar Evento
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Selecciona el tipo de operación que deseas registrar
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickEventTypes.map((eventType) => (
                <button
                  key={eventType.type}
                  onClick={() => handleEventTypeSelect(eventType.type)}
                  className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group"
                >
                  <div className="text-4xl mb-3">{eventType.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400">
                    {eventType.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {eventType.description}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <AlertCircle className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Settings, Thermometer, Zap, Droplets, Wind, Sun, Activity } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTenant } from '../contexts/TenantContext';
import api from '../services/api';

const LAB_TYPE_OPTIONS = [
  { value: 'Vegetative', label: 'Vegetativo' },
  { value: 'Flowering', label: 'Floración' },
  { value: 'Dry', label: 'Secado' },
  { value: 'Clone', label: 'Clones' },
  { value: 'Mother', label: 'Madres' },
];

const getLabTypeClass = (type: string) => {
  if (type === 'Flowering') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100';
  if (type === 'Dry') return 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-100';
  if (type === 'Clone') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100';
  if (type === 'Mother') return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-100';
  return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-100';
};

export default function Labs() {
  const { labs, batches, addLab, updateLab } = useData();
  const { t } = useLanguage();
  const { selectedTenant } = useTenant();
  const tenantId = selectedTenant?.id || localStorage.getItem('selectedTenantId');
  const [showForm, setShowForm] = useState(false);
  const [pulseGrowData, setPulseGrowData] = useState<any[]>([]);
  const [tuyaDevices, setTuyaDevices] = useState<any[]>([]);
  const [labSensorMapping, setLabSensorMapping] = useState<{[labId: string]: number | null}>({});
  const [updatingLabId, setUpdatingLabId] = useState<string | null>(null);
  const [assigningLabId, setAssigningLabId] = useState<string | null>(null);
  const [editingLabId, setEditingLabId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    cycle: '18/6',
    area: 0,
  });
  const [deletingLabId, setDeletingLabId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Vegetative',
    m2: 0,
    cycle: '18/6'
  });

  // Fetch Pulse Grow data
  useEffect(() => {
    const fetchPulseData = async () => {
      try {
        const data = await api.pulseGrow.getAllDevices();
        if (data?.deviceViewDtos) {
          setPulseGrowData(data.deviceViewDtos);
        }
      } catch (error) {
        console.log('Pulse Grow data not available:', error);
      }
    };

    fetchPulseData();
    const interval = setInterval(fetchPulseData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch labs from database when workspace changes
  useEffect(() => {
    const fetchLabs = async () => {
      if (!tenantId) {
        console.log('⚠️ No hay workspace activo');
        return;
      }

      console.log('🔄 Cargando laboratorios para workspace:', tenantId);

      try {
        const result = await api.labs.getAll();
        console.log('📊 Laboratorios recibidos:', result);
        
        // Update DataContext if labs were fetched successfully
        if (result && result.labs) {
          console.log('✅ Encontrados', result.labs.length, 'laboratorios');
        }
      } catch (error) {
        console.error('❌ Error cargando laboratorios:', error);
      }
    };

    fetchLabs();
  }, [selectedTenant]);

  // Fetch Tuya devices
  useEffect(() => {
    if (!tenantId) {
      console.log('⚠️ No hay workspace activo, limpiando dispositivos Tuya');
      setTuyaDevices([]);
      return;
    }

    let isCancelled = false;
    const fetchTuyaData = async () => {
      if (isCancelled) return;
      console.log('🔄 Cargando dispositivos Tuya para workspace:', tenantId, ' @', new Date().toISOString());

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/tuya/devices', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Id': tenantId,
          },
        });
        const data = await response.json();
        if (isCancelled) return;
        console.log('📊 Dispositivos Tuya recibidos:', data.devices);
        setTuyaDevices(data.devices || []);
      } catch (error) {
        if (!isCancelled) {
          console.error('❌ Error cargando dispositivos Tuya:', error);
          setTuyaDevices([]);
        }
      }
    };

    fetchTuyaData();
    const interval = setInterval(fetchTuyaData, 30000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantId) {
      alert('Reinicia sesión para continuar');
      return;
    }

    try {
      console.log('🔄 Creando laboratorio:', formData);
      
      const result = await api.labs.create(formData);
      console.log('📡 Respuesta del servidor:', result);
      console.log('✅ Laboratorio creado correctamente:', result.lab);
      
      // Actualizar la lista local del DataContext
      addLab(result.lab);
      setFormData({ name: '', type: 'Vegetative', m2: 0, cycle: '18/6' });
      setShowForm(false);
      alert(`Laboratorio "${result.lab.name}" creado exitosamente`);
    } catch (error) {
      console.error('❌ Error creando laboratorio:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'No se pudo crear el laboratorio'}`);
    }
  };

  const getLabBatches = (labId: string) => {
    return batches.filter(batch => batch.labId === labId);
  };

  const handleSensorChange = (labId: string, deviceId: string) => {
    setLabSensorMapping(prev => ({
      ...prev,
      [labId]: deviceId === 'none' ? null : parseInt(deviceId)
    }));
  };

  const handleTuyaAssignment = async (tuyaDeviceId: string, labId: string | null) => {
    if (!tenantId) {
      console.error('❌ No hay workspace activo');
      return;
    }

    try {
      setAssigningLabId(labId);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/tuya/devices/${tuyaDeviceId}/lab`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Id': tenantId,
        },
        body: JSON.stringify({ labId }),
      });
      
      const result = await response.json();
      console.log('📡 Respuesta del servidor:', result);
      
      if (response.ok) {
        console.log('✅ Dispositivo Tuya asignado correctamente');
        const updatedResponse = await fetch('http://localhost:3000/api/tuya/devices', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Id': tenantId,
          },
        });
        const data = await updatedResponse.json();
        console.log('📊 Dispositivos actualizados:', data.devices);
        setTuyaDevices(data.devices || []);
      } else {
        console.error('❌ Error en la respuesta:', result);
        alert(`Error: ${result.error || 'No se pudo asignar el dispositivo'}`);
      }
    } catch (error) {
      console.error('❌ Error asignando dispositivo Tuya:', error);
      alert('Error de conexión. Verifica la consola para más detalles.');
    } finally {
      setAssigningLabId(null);
    }
  };

  const handleLabTypeChange = async (labId: string, newType: string) => {
    if (!tenantId) {
      console.error('❌ No hay workspace activo');
      return;
    }

    try {
      setUpdatingLabId(labId);
      await updateLab(labId, { type: newType });
    } catch (error) {
      console.error('❌ Error actualizando tipo de laboratorio:', error);
      alert('No se pudo actualizar la clase del laboratorio');
    } finally {
      setUpdatingLabId(null);
    }
  };

  const startEditingLab = (lab: any) => {
    setEditingLabId(lab.id);
    setEditForm({
      name: lab.name,
      cycle: lab.cycle || '18/6',
      area: lab.m2 ?? lab.area ?? 0,
    });
  };

  const handleEditSubmit = async (labId: string) => {
    if (!tenantId) {
      console.error('❌ No hay workspace activo');
      return;
    }

    try {
      setUpdatingLabId(labId);
      await updateLab(labId, {
        name: editForm.name,
        cycle: editForm.cycle,
        area: Number(editForm.area) || 0,
      });
      setEditingLabId(null);
    } catch (error) {
      console.error('❌ Error actualizando laboratorio:', error);
      alert('No se pudo actualizar el laboratorio');
    } finally {
      setUpdatingLabId(null);
    }
  };

  const handleDeleteLab = async (labId: string) => {
    if (!tenantId) {
      console.error('❌ No hay workspace activo');
      return;
    }

    const confirm = window.confirm('¿Está seguro que desea eliminar este laboratorio?');
    if (!confirm) return;

    try {
      setDeletingLabId(labId);
      await api.labs.delete(labId);
      // Refrescar datos locales: filtramos el lab borrado
      const refreshed = await api.labs.getAll().catch(() => null);
      if (refreshed?.labs) {
        // Forzamos recarga de datos del DataContext limpiando cache local
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Error eliminando laboratorio:', error);
      alert('No se pudo eliminar el laboratorio');
    } finally {
      setDeletingLabId(null);
    }
  };

  const getStatusValue = (device: any, code: string) => device?.status?.find((s: any) => s.code === code)?.value;

  const getTuyaReadings = (device: any) => {
    if (!device) return { temp: null, humidity: null };
    const rawTemp = getStatusValue(device, 'temp') ?? getStatusValue(device, 'va_temperature');
    const rawHumidity = getStatusValue(device, 'humidity') ?? getStatusValue(device, 'va_humidity');
    // Algunos dispositivos reportan décimas de grado
    const tempC = rawTemp !== undefined && rawTemp !== null ? Number(rawTemp) / 10 : null;
    const humidity = rawHumidity !== undefined && rawHumidity !== null ? Number(rawHumidity) : null;
    return { temp: tempC, humidity };
  };

  const tuyaOptionsForLab = (labId: string) =>
    tuyaDevices
      .filter((device) => !device.labId || device.labId === labId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('labs.title')}</h1>
        <Button icon={Plus} onClick={() => setShowForm(true)}>
          {t('labs.addLab')}
        </Button>
      </div>

      {showForm && (
        <Card title={t('labs.addNewLab')}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('labs.name')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder={`${t('labs.eg')}, ${t('labs.vegRoomC')}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('labs.type')}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Vegetative">{t('labs.vegetative')}</option>
                  <option value="Flowering">{t('labs.flowering')}</option>
                  <option value="Mother">{t('labs.motherRoom')}</option>
                  <option value="Clone">{t('labs.cloneRoom')}</option>
                  <option value="Dry">{t('labs.dryingRoom')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('labs.area')}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.m2}
                  onChange={(e) => setFormData({ ...formData, m2: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Light Cycle
                </label>
                <select
                  value={formData.cycle}
                  onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="18/6">18/6 (Vegetative)</option>
                  <option value="12/12">12/12 (Flowering)</option>
                  <option value="24/0">24/0 (Continuous)</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Lab
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map((lab) => {
          const labBatches = getLabBatches(lab.id);
          const activeBatches = labBatches.filter(batch => batch.state !== 'harvested');
          
          // Get assigned sensor for this lab
          const assignedDeviceId = labSensorMapping[lab.id];
          const pulseDevice = assignedDeviceId 
            ? pulseGrowData.find(d => d.id === assignedDeviceId)
            : null;
          const tuyaDevice = tuyaDevices.find((d) => d.labId === lab.id);
          const tuyaMetrics = getTuyaReadings(tuyaDevice);
          const hasPulse = Boolean(pulseDevice);
          const hasTuya = Boolean(tuyaDevice);
          const pulseData = pulseDevice?.mostRecentDataPoint;

          const tempF = pulseData?.temperatureF;
          const tempPulseC = tempF !== undefined && tempF !== null ? ((tempF - 32) * 5) / 9 : null;
          const displayTempValue = tuyaMetrics.temp ?? tempPulseC;
          const displayTemp = displayTempValue !== null && displayTempValue !== undefined ? displayTempValue.toFixed(1) : '--';

          const displayHumidityValue = tuyaMetrics.humidity ?? pulseData?.humidityRh;
          const displayHumidity = displayHumidityValue !== null && displayHumidityValue !== undefined
            ? displayHumidityValue.toFixed(0)
            : '--';

          const displayLightValue = pulseData?.lightLux;
          const displayLight = displayLightValue !== null && displayLightValue !== undefined
            ? displayLightValue.toFixed(0)
            : '--';

          const displayVpdValue = pulseData?.vpd;
          const displayVpd = displayVpdValue !== null && displayVpdValue !== undefined
            ? displayVpdValue.toFixed(2)
            : '--';
          
          return (
            <Card key={lab.id}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => startEditingLab(lab)}
                      className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Settings className="h-5 w-5 text-blue-600" />
                    </button>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {lab.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lab.m2} m² • {lab.cycle}
                      </p>
                        <div className="flex items-center gap-2 mt-1">
                          {hasPulse && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-200">
                              <Activity className="h-3.5 w-3.5" /> Pulse
                            </span>
                          )}
                          {hasTuya && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-200">
                              <Zap className="h-3.5 w-3.5" /> Tuya
                            </span>
                          )}
                        </div>
                    </div>
                  </div>
                  
                  <select
                    value={lab.type}
                    onChange={(e) => handleLabTypeChange(lab.id, e.target.value)}
                    disabled={updatingLabId === lab.id}
                    className={`text-xs font-semibold px-3 py-1 rounded-full border border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none pr-6 ${getLabTypeClass(lab.type)}`}
                    style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, rgba(0,0,0,0.35) 50%), linear-gradient(135deg, rgba(0,0,0,0.35) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 14px) center, calc(100% - 9px) center', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                  >
                    {LAB_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {editingLabId === lab.id && (
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre</label>
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ciclo</label>
                        <select
                          value={editForm.cycle}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, cycle: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="18/6">18/6</option>
                          <option value="12/12">12/12</option>
                          <option value="24/0">24/0</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">m²</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.area}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, area: parseFloat(e.target.value) }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:flex-wrap md:justify-end gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingLabId(null)}
                        className="w-full md:w-auto md:min-w-[96px]"
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteLab(lab.id)}
                        disabled={deletingLabId === lab.id}
                        className="w-full md:w-auto md:min-w-[96px]"
                      >
                        Eliminar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditSubmit(lab.id)}
                        disabled={updatingLabId === lab.id}
                        className="w-full md:w-auto md:min-w-[96px]"
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Selectores de sensores */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3 space-y-3">
                  {/* Selector Pulse Grow */}
                  {pulseGrowData.length > 0 && (
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        <Activity className="h-3.5 w-3.5 text-amber-600" />
                        Sensor Pulse Grow
                      </label>
                      <select
                        value={assignedDeviceId || 'none'}
                        onChange={(e) => handleSensorChange(lab.id, e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="none">Sin sensor asignado</option>
                        {pulseGrowData.map((device) => (
                          <option key={device.id} value={device.id}>
                            {device.name} (ID: {device.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Selector Tuya Smart Life */}
                  {tuyaDevices.length > 0 && (
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        <Zap className="h-3.5 w-3.5 text-emerald-500" />
                        Sensor Tuya (uno por laboratorio)
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={(tuyaDevices.find((d) => d.labId === lab.id)?.id) || ''}
                          onChange={(e) => {
                            const current = tuyaDevices.find((d) => d.labId === lab.id);
                            const newDeviceId = e.target.value;
                            if (newDeviceId === '') {
                              if (current) {
                                handleTuyaAssignment(current.id, null);
                              }
                              return;
                            }
                            handleTuyaAssignment(newDeviceId, lab.id);
                          }}
                          disabled={assigningLabId === lab.id || tuyaOptionsForLab(lab.id).length === 0}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">
                            {tuyaDevices.find((d) => d.labId === lab.id) ? 'Quitar sensor' : 'Sin sensor asignado'}
                          </option>
                          {tuyaOptionsForLab(lab.id).map((device) => (
                            <option key={device.id} value={device.id}>
                              {device.name || 'Sensor'} {device.online ? '• Online' : '• Offline'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        Los sensores asignados a otro lab no aparecen aquí. Libera primero para reasignar.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex items-center gap-3 h-full">
                    <div className="h-9 w-9 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                      <Thermometer className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayTemp}°C</p>
                      <p className="text-xs text-gray-500">Temperatura {tuyaDevice ? '(Tuya)' : pulseDevice ? '(Pulse)' : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 h-full">
                    <div className="h-9 w-9 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Droplets className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayHumidity}%</p>
                      <p className="text-xs text-gray-500">Humedad</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 h-full">
                    <div className="h-9 w-9 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <Sun className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayLight} lux</p>
                      <p className="text-xs text-gray-500">Luz {pulseDevice ? '(Pulse)' : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 h-full">
                    <div className="h-9 w-9 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <Wind className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayVpd} kPa</p>
                      <p className="text-xs text-gray-500">VPD {pulseDevice && `(${pulseDevice.name})`}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active Batches
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {activeBatches.length}
                    </span>
                  </div>
                  
                  {activeBatches.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {activeBatches.slice(0, 2).map((batch) => (
                        <div key={batch.id} className="text-sm text-gray-600 dark:text-gray-400">
                          {batch.code} • {batch.plantCount} plants
                        </div>
                      ))}
                      {activeBatches.length > 2 && (
                        <div className="text-sm text-gray-500">
                          +{activeBatches.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
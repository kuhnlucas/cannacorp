import { useState } from 'react';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';

export default function TenantSelector() {
  const { selectedTenant, tenants, selectTenant, createTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    console.log('🔄 Creando organización:', newTenantName);
    setCreating(true);
    try {
      const tenant = await createTenant(newTenantName.trim());
      console.log('✅ Organización creada:', tenant);
      setNewTenantName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('❌ Error creating tenant:', error);
      alert('Error al crear organización: ' + (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  // No mostrar nada si no hay token (usuario no autenticado)
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  if (tenants.length === 0) {
    return (
      <>
        <button
          onClick={() => {
            console.log('🔘 Click en botón Crear Organización');
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">Crear Organización</span>
        </button>

        {/* Modal crear tenant */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Crear Nueva Organización
              </h2>

              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la organización
                  </label>
                  <input
                    type="text"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    placeholder="Mi empresa"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewTenantName('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    disabled={creating}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={creating}
                  >
                    {creating ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedTenant?.name || 'Seleccionar organización'}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="p-2">
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => {
                    selectTenant(tenant);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedTenant?.id === tenant.id
                      ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {tenant.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {tenant.role}
                  </div>
                </button>
              ))}

              <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-green-600 dark:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nueva organización
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal crear tenant */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Crear Nueva Organización
            </h2>

            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la organización
                </label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="Mi empresa"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTenantName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

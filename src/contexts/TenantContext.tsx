import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface Tenant {
  id: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'STAFF';
  createdAt: string;
}

interface TenantContextType {
  selectedTenant: Tenant | null;
  tenants: Tenant[];
  loading: boolean;
  selectTenant: (tenant: Tenant) => void;
  refreshTenants: () => Promise<void>;
  createTenant: (name: string) => Promise<Tenant>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const getStoredTenant = (): Tenant | null => {
    try {
      const stored = localStorage.getItem('selectedTenant');
      if (stored) return JSON.parse(stored);
      const tenantId = localStorage.getItem('selectedTenantId');
      if (tenantId) {
        return {
          id: tenantId,
          name: "Mi espacio de trabajo",
          role: 'OWNER',
          createdAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Error leyendo tenant almacenado:', error);
    }
    return null;
  };

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(getStoredTenant());
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const tenant = getStoredTenant();
    return tenant ? [tenant] : [];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      refreshTenants();
    } else {
      setSelectedTenant(null);
      setTenants([]);
    }
  }, [isAuthenticated]);

  const selectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    localStorage.setItem('selectedTenantId', tenant.id);
    localStorage.setItem('selectedTenant', JSON.stringify(tenant));
  };

  const refreshTenants = async () => {
    setLoading(true);
    try {
      const data = await api.tenants.getAll();
      const list: Tenant[] = (data.tenants || data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        role: t.membership?.role || t.role || 'STAFF',
        createdAt: t.createdAt,
      }));
      setTenants(list);

      // Auto-select: keep current if still valid, otherwise pick first
      const stored = getStoredTenant();
      const stillValid = stored && list.find((t) => t.id === stored.id);
      if (stillValid) {
        selectTenant(stillValid);
      } else if (list.length > 0) {
        selectTenant(list[0]);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
      // Fallback to localStorage
      const tenant = getStoredTenant();
      setTenants(tenant ? [tenant] : []);
      setSelectedTenant(tenant);
    }
    setLoading(false);
  };

  const createTenant = async (name: string) => {
    const data = await api.tenants.create(name);
    const tenant: Tenant = {
      id: data.tenant.id,
      name: data.tenant.name,
      role: 'OWNER',
      createdAt: data.tenant.createdAt,
    };
    setTenants((prev) => [...prev, tenant]);
    selectTenant(tenant);
    return tenant;
  };

  return (
    <TenantContext.Provider
      value={{
        selectedTenant,
        tenants,
        loading,
        selectTenant,
        refreshTenants,
        createTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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
    const tenant = getStoredTenant();
    if (tenant) {
      setSelectedTenant(tenant);
      setTenants([tenant]);
    }
  }, []);

  useEffect(() => {
    const tenant = getStoredTenant();
    setSelectedTenant(tenant);
    setTenants(tenant ? [tenant] : []);
  }, [isAuthenticated]);

  const selectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTenants([tenant]);
    localStorage.setItem('selectedTenantId', tenant.id);
    localStorage.setItem('selectedTenant', JSON.stringify(tenant));
  };

  const refreshTenants = async () => {
    setLoading(true);
    const tenant = getStoredTenant();
    setSelectedTenant(tenant);
    setTenants(tenant ? [tenant] : []);
    setLoading(false);
  };

  const createTenant = async () => {
    throw new Error('Multi-tenant deshabilitado en el MVP');
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

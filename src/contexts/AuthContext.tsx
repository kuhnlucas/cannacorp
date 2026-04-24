import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAuthErrorHandler } from '../services/api';

interface User {
  id: string;
  email: string;
  role?: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Decodifica el exp del JWT sin verificar firma. Retorna true si expiró o no se puede parsear. */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    // JWT usa base64url (RFC 7519): reemplazar - → + y _ → / antes de llamar atob
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const payload = JSON.parse(atob(padded));
    // Token sin claim exp → tratar como inválido
    if (typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

const clearSession = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('selectedTenantId');
  localStorage.removeItem('selectedTenant');
};

const getStoredUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token) {
      // Sin token, no hay sesión válida. Limpiar user stale si quedó.
      if (storedUser) clearSession();
      return null;
    }
    if (isTokenExpired(token)) {
      console.warn('⚠️ Token expirado al iniciar la app. Limpiando sesión.');
      clearSession();
      return null;
    }
    if (!storedUser) return null;
    return JSON.parse(storedUser);
  } catch (err) {
    console.error('Error parsing stored user:', err);
    clearSession();
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const logout = useCallback(() => {
    setUser(null);
    clearSession();
  }, []);

  useEffect(() => {
    // Hydrate y registrar handler de 401 en api.ts
    setUser(getStoredUser());
    setIsHydrated(true);
    setAuthErrorHandler(logout);
    return () => setAuthErrorHandler(() => {});
  }, [logout]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔐 Intentando login con:', { email });
      const response = await api.auth.login(email, password);
      console.log('📡 Respuesta del login:', { hasUser: !!response.user, hasToken: !!response.token, hasTenant: !!response.tenant });
      
      if (response.user && response.token) {
        const memberRole = response.memberships?.[0]?.role || response.user.role || 'STAFF';
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: memberRole
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.token);
        // Re-registrar handler y resetear flag de deduplicación de 401
        setAuthErrorHandler(logout);
        
        // Auto-guardar el tenant del usuario
        if (response.tenant) {
          localStorage.setItem('selectedTenantId', response.tenant.id);
          localStorage.setItem('selectedTenant', JSON.stringify(response.tenant));
          console.log('✅ Tenant auto-asignado:', response.tenant.name);
        }
        
        console.log('✅ Login exitoso.');
        setIsLoading(false);
        return true;
      }
      
      console.error('❌ Login falló: respuesta sin user o token');
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('❌ Error en login:', error);
      setIsLoading(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      isLoading,
      isHydrated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
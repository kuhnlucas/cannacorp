import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  role?: 'admin' | 'operator' | 'reader';
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

const getStoredUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    return JSON.parse(storedUser);
  } catch (err) {
    console.error('Error parsing stored user:', err);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Ensure auth is hydrated on first load
    setUser(getStoredUser());
    setIsHydrated(true);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔐 Intentando login con:', { email });
      const response = await api.auth.login(email, password);
      console.log('📡 Respuesta del login:', { hasUser: !!response.user, hasToken: !!response.token, hasTenant: !!response.tenant });
      
      if (response.user && response.token) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: 'operator'
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.token);
        
        // Auto-guardar el tenant del usuario
        if (response.tenant) {
          localStorage.setItem('selectedTenantId', response.tenant.id);
          localStorage.setItem('selectedTenant', JSON.stringify(response.tenant));
          console.log('✅ Tenant auto-asignado:', response.tenant.name);
        }
        
        console.log('✅ Login exitoso. Token guardado:', response.token.substring(0, 20) + '...');
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('selectedTenantId');
    localStorage.removeItem('selectedTenant');
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
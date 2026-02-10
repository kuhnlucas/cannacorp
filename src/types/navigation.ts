/**
 * Tipos para el sistema de navegación escalable
 */

import { ReactNode } from 'react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: ReactNode;
  badge?: {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  };
  // Feature flag para ocultar/mostrar
  feature?: string;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
  icon?: ReactNode;
  // Colapsable por defecto (true = abierto)
  defaultOpen?: boolean;
  // Feature flag para el grupo completo
  feature?: string;
}

export type NavigationSchema = NavigationGroup[];

export interface Breadcrumb {
  label: string;
  href?: string;
  current?: boolean;
}

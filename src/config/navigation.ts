/**
 * Schema de navegación centralizado y escalable
 * Construido con feature flags en mente
 * Un único origen de verdad para toda la navegación
 */

import {
  LayoutDashboard,
  Beaker,
  Leaf,
  Package,
  Activity,
  AlertCircle,
  BookOpen,
  ShoppingCart,
  FileText,
  CheckSquare2,
  Plus,
  Monitor,
  Wifi,
} from 'lucide-react';
import { NavigationSchema } from '../types/navigation';
import { isFeatureEnabled } from './features';

export const buildNavigationSchema = (): NavigationSchema => {
  const schema: NavigationSchema = [
    // ===== GESTIÓN =====
    {
      label: 'Gestión',
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [
        {
          name: 'Panel de Control',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Laboratorios',
          href: '/labs',
          icon: Beaker,
        },
        {
          name: 'Genética',
          href: '/genetics',
          icon: Leaf,
        },
        {
          name: 'Lotes',
          href: '/batches',
          icon: Package,
        },
      ],
    },

    // ===== OPERACIONES (Nuevo módulo) =====
    ...(isFeatureEnabled('operations')
      ? [
          {
            label: 'Operaciones',
            icon: Activity,
            defaultOpen: true,
            items: [
              {
                name: 'Registro Rápido',
                href: '/ops/new',
                icon: Plus,
              },
              {
                name: 'Bitácora',
                href: '/ops/logs',
                icon: FileText,
              },
              {
                name: 'Plan / Checklist',
                href: '/ops/plan',
                icon: CheckSquare2,
              },
              ...(isFeatureEnabled('operations_recipes')
                ? [
                    {
                      name: 'Recetas',
                      href: '/ops/recipes',
                      icon: BookOpen,
                      feature: 'operations_recipes',
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),

    // ===== MONITOREO =====
    {
      label: 'Monitoreo',
      icon: Monitor,
      defaultOpen: false,
      items: [
        {
          name: 'Monitoreo',
          href: '/monitoring',
          icon: Monitor,
        },
        {
          name: 'Sensores',
          href: '/sensors',
          icon: Wifi,
        },
        ...(isFeatureEnabled('alerts')
          ? [
              {
                name: 'Alertas',
                href: '/alerts',
                icon: AlertCircle,
              },
            ]
          : []),
      ],
    },

    // ===== ANALÍTICA =====
    {
      label: 'Analítica',
      icon: BookOpen,
      defaultOpen: false,
      items: [
        {
          name: 'Analítica',
          href: '/analytics',
          icon: BookOpen,
        },
        {
          name: 'Análisis de Problemas',
          href: '/problems',
          icon: AlertCircle,
        },
      ],
    },

    // ===== RECURSOS (Oculto por feature flag) =====
    ...(isFeatureEnabled('resources_guides') ||
    isFeatureEnabled('resources_growshops')
      ? [
          {
            label: 'Recursos',
            icon: BookOpen,
            defaultOpen: false,
            items: [
              ...(isFeatureEnabled('resources_guides')
                ? [
                    {
                      name: 'Guías',
                      href: '/resources/guides',
                      icon: BookOpen,
                      feature: 'resources_guides',
                    },
                  ]
                : []),
              ...(isFeatureEnabled('resources_growshops')
                ? [
                    {
                      name: 'Growshops',
                      href: '/resources/growshops',
                      icon: ShoppingCart,
                      feature: 'resources_growshops',
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
  ];

  return schema;
};

export const navigationSchema = buildNavigationSchema();

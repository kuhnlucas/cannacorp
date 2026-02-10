/**
 * Feature Flags - Controla la disponibilidad de módulos y features
 * Escalable y centralizado: un único origen de verdad
 */

export interface FeatureFlags {
  operations: boolean;
  operations_recipes: boolean;
  resources_guides: boolean;
  resources_growshops: boolean;
  alerts: boolean;
}

export const featureFlags: FeatureFlags = {
  // Módulo Operaciones: Registro de eventos de cultivo
  operations: true,
  // Sub-feature: Recetas en Operaciones
  operations_recipes: false,
  
  // Módulo Recursos: Guías y Growshops
  resources_guides: false,
  resources_growshops: false,
  
  // Módulo Alertas
  alerts: true,
};

/**
 * Función helper para verificar si una feature está activa
 */
export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  return featureFlags[flag] === true;
};

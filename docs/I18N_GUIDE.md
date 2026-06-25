# Sistema de Internacionalización (i18n)

## Descripción
Sistema completo de idiomas configurable para la aplicación CannabisHub. Soporta español (es) e inglés (en) con opción de cambiar el idioma desde cualquier sección de la aplicación.

## Componentes Principales

### 1. **LanguageContext** (`src/contexts/LanguageContext.tsx`)
- Proporciona el estado global del idioma
- Almacena la preferencia en localStorage
- Incluye la función `t()` para traducir textos

### 2. **Locales** (`src/locales/`)
- `es.ts`: Traducciones al español
- `en.ts`: Traducciones al inglés

### 3. **LanguageSwitcher** (`src/components/LanguageSwitcher.tsx`)
- Componente visual para cambiar idioma
- Ubicado en el Header
- Muestra selector desplegable con ES/EN

## Uso

### En Componentes
```tsx
import { useLanguage } from '../contexts/LanguageContext';

export default function MiComponente() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      <p>{t('login.email')}</p>
      <button onClick={() => setLanguage('en')}>English</button>
    </div>
  );
}
```

### Estructura de Claves de Traducción
Las claves están organizadas por módulos:
- `common.*`: Elementos comunes (logout, settings, etc.)
- `navigation.*`: Elementos de navegación
- `header.*`: Encabezado
- `login.*`: Página de login
- `dashboard.*`: Dashboard
- `batches.*`: Gestión de lotes
- `genetics.*`: Gestión de genética
- `labs.*`: Laboratorios
- `monitoring.*`: Monitoreo
- `analytics.*`: Analítica

## Agregar Nuevas Traducciones

1. Abre `src/locales/es.ts` y `src/locales/en.ts`
2. Agrega la nueva clave en la estructura correspondiente
3. Usa la clave en tus componentes con `t('clave.nueva')`

Ejemplo:
```typescript
// En es.ts y en.ts
batches: {
  // ... otros campos
  deleteConfirm: 'Confirma la eliminación del lote', // ES
  deleteConfirm: 'Confirm batch deletion', // EN
}

// En componente
const { t } = useLanguage();
<p>{t('batches.deleteConfirm')}</p>
```

## Persistencia
El idioma seleccionado se guarda en localStorage con la clave `language`, por lo que se mantiene entre sesiones.

## Idioma por Defecto
El idioma por defecto es **Español (es)**. Puedes cambiarlo en `LanguageContext.tsx`:
```typescript
const saved = localStorage.getItem('language');
return (saved as Language) || 'es'; // Cambia 'es' a 'en' para inglés por defecto
```

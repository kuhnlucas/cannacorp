# Auditoría Técnica Completa — CannaCorp (cannagrow)

**Fecha:** 2026-04-12
**Auditor:** GitHub Copilot (Claude Opus 4.6)
**Alcance:** Monorepo completo — frontend, backend, DB, infra, seguridad, DX, dockerización

---

# 1. Resumen Ejecutivo

## Estado general
El repositorio es un **MVP funcional** con frontend React + backend Express + SQLite (Prisma). Tiene buenas bases (multi-tenancy, JWT auth, integración IoT con Tuya/PulseGrow), pero presenta **deuda técnica alta** y **problemas de seguridad críticos** que impiden un despliegue a producción sin intervención significativa.

## Principales riesgos
1. **JWT Secret hardcodeado como fallback `'secret'`** en 3 archivos — cualquiera sin `.env` corre el backend con un secreto trivial.
2. **Controladores con acceso a datos vía JSON files** (batches, genetics, operations, monitoring) coexistiendo con Prisma — doble fuente de verdad incoherente.
3. **Sin lockfile en backend** (`node_modules` no instalados, 18+ UNMET DEPENDENCY).
4. **Cero tests** — no existe ni un solo archivo `.test.ts`, `.spec.ts`, ni configuración de test runner.
5. **API URL hardcodeada** `http://localhost:3000` en 8+ archivos del frontend, sin variable de entorno.
6. **Sin `.env.example`** — no hay forma documentada de saber qué variables se necesitan.
7. **4 vulnerabilidades npm en backend** (1 crítica en axios, 2 high).
8. **Sin CI/CD, sin Docker, sin pipeline alguno.**

## Principales fortalezas
- Arquitectura multi-tenant funcional con memberships y roles.
- Integración IoT real (Tuya HMAC-SHA256 signing, PulseGrow API).
- i18n funcional (ES/EN) con contexto React.
- Feature flags en frontend para enable/disable módulos.
- Helmet + rate limiting en backend (implementado, no solo planeado).
- Dark mode, mobile nav, esquema de componentes coherente en frontend.
- Prisma schema bien diseñado con índices en las relaciones multi-tenant.

## Nivel de deuda técnica: **ALTO**

---

# 2. Mapa del Monorepo

## Package manager
- **npm** (evidenciado por `package-lock.json` en root y backend).
- **No hay workspaces configurados** — el root `package.json` no tiene campo `"workspaces"`.

## Workspace manager
- **Ninguno.** No existe turbo, nx, lerna, ni pnpm-workspace.yaml.
- Frontend y backend son proyectos npm independientes sin vínculo formal.

## Apps
| App | Ubicación | Stack |
|-----|-----------|-------|
| Frontend | `./` (root) | React 18 + Vite 7 + Tailwind 3 + TypeScript |
| Backend | `./backend/` | Express 4 + Prisma 5 + SQLite + TypeScript |

## Packages compartidos
- **No existen.** No hay `packages/`, `libs/`, ni tipos compartidos entre frontend y backend.

## Servicios principales
- **API REST**: Express en puerto 3000
- **Frontend SPA**: Vite dev server en puerto 5173
- **Base de datos**: SQLite local (archivo `.db`)
- **Integraciones IoT**: Tuya Smart Cloud API, PulseGrow API

## Scripts clave

### Root (frontend)
| Script | Comando |
|--------|---------|
| `dev` | `vite` |
| `build` | `vite build` |
| `lint` | `eslint .` |
| `preview` | `vite preview` |

### Backend
| Script | Comando |
|--------|---------|
| `dev` | `ts-node src/index.ts` |
| `build` | `tsc` |
| `start` | `node dist/index.js` |

**Falta:** scripts de test, seed, migrate, lint, format, typecheck en ambos lados.

---

# 3. Hallazgos Priorizados

## H-01: JWT Secret trivial como fallback
- **Severidad:** CRÍTICA
- **Categoría:** Seguridad
- **Hallazgo:** En 3 archivos del backend, `JWT_SECRET` tiene fallback `|| 'secret'`. Si no se configura `.env`, el JWT se firma con la palabra `"secret"`, trivialmente explotable.
- **Evidencia:**
  - [backend/src/middleware.ts](backend/src/middleware.ts#L4): `const JWT_SECRET = process.env.JWT_SECRET || 'secret';`
  - [backend/src/middleware/requireAuth.ts](backend/src/middleware/requireAuth.ts#L4): ídem
  - [backend/src/controllers/auth.ts](backend/src/controllers/auth.ts#L7): ídem
- **Impacto:** Cualquier atacante puede forjar JWTs válidos si el backend corre sin `.env`.
- **Recomendación:** Eliminar los fallbacks. Si `JWT_SECRET` no está definido, el server no debe arrancar: `const JWT_SECRET = process.env.JWT_SECRET; if (!JWT_SECRET) throw new Error('JWT_SECRET is required');`
- **Esfuerzo:** Bajo

## H-02: Doble fuente de verdad en persistencia (JSON files vs Prisma)
- **Severidad:** CRÍTICA
- **Categoría:** Arquitectura
- **Hallazgo:** Los controladores de `batches`, `genetics`, `operations` y `monitoring` leen/escriben archivos JSON en `backend/data/`, mientras que `auth`, `labs`, `tenants` y `tuya` usan Prisma/SQLite. La misma entidad `Batch` existe en el schema Prisma Y en `batches.json`.
- **Evidencia:**
  - [backend/src/controllers/batches.ts](backend/src/controllers/batches.ts#L7-L8): `const batchesFile = path.join(dbPath, 'batches.json');`
  - [backend/src/controllers/genetics.ts](backend/src/controllers/genetics.ts#L7): `const geneticsFile = path.join(dbPath, 'genetics.json');`
  - [backend/src/controllers/monitoring.ts](backend/src/controllers/monitoring.ts#L7-L8): dice measurements.json y sensors.json
  - [backend/src/controllers/operations.ts](backend/src/controllers/operations.ts#L7): JSON file
  - [backend/src/controllers/labs.ts](backend/src/controllers/labs.ts#L5): **Prisma** ✓
  - [backend/src/controllers/auth.ts](backend/src/controllers/auth.ts#L6): **Prisma** ✓
- **Impacto:** Los datos de batches/genetics/operations están completamente desconectados de la DB relacional. No hay integridad referencial, no hay transacciones, no hay filtro por tenant. Las relaciones del schema Prisma (Batch→Lab, Batch→Genetics) son **dead code**.
- **Recomendación:** Migrar todos los controladores JSON a Prisma. Eliminar la carpeta `data/` con los archivos JSON.
- **Esfuerzo:** Medio

## H-03: Instancias múltiples de PrismaClient
- **Severidad:** ALTA
- **Categoría:** Performance / Correctitud
- **Hallazgo:** Se crea `new PrismaClient()` en 5 archivos del backend independientemente. Cada import crea una nueva conexión pool.
- **Evidencia:** 9 instancias de `new PrismaClient()` en archivos distintos:
  - [backend/src/controllers/auth.ts](backend/src/controllers/auth.ts#L6)
  - [backend/src/controllers/labs.ts](backend/src/controllers/labs.ts#L5)
  - [backend/src/middleware/requireTenant.ts](backend/src/middleware/requireTenant.ts#L19)
  - [backend/src/routes/tenants.ts](backend/src/routes/tenants.ts#L11)
  - [backend/src/routes/tuyaMultiTenant.ts](backend/src/routes/tuyaMultiTenant.ts#L13)
- **Impacto:** Múltiples connection pools a SQLite, potencial data corruption en escrituras concurrentes, "too many connections" en producción con PostgreSQL.
- **Recomendación:** Crear un singleton `backend/src/lib/prisma.ts` que exporte una única instancia. Importar esa instancia en todos los módulos.
- **Esfuerzo:** Bajo

## H-04: Rutas GET sin autenticación exponen datos
- **Severidad:** ALTA
- **Categoría:** Seguridad
- **Hallazgo:** Varias rutas GET no tienen middleware de autenticación, exponiendo datos a todo el mundo.
- **Evidencia:**
  - [backend/src/routes/batches.ts](backend/src/routes/batches.ts#L6): `router.get('/', batchesController.getBatches_handler)` — sin auth
  - [backend/src/routes/genetics.ts](backend/src/routes/genetics.ts#L6): `router.get('/', geneticsController.getGenetics_handler)` — sin auth
  - [backend/src/routes/monitoring.ts](backend/src/routes/monitoring.ts#L6-L8): GET measurements, sensors y realtime — sin auth
  - [backend/src/routes/operations.ts](backend/src/routes/operations.ts#L6): GET operations — sin auth
  - [backend/src/routes/pulseGrow.ts](backend/src/routes/pulseGrow.ts): **todas** las rutas sin auth
  - [backend/src/routes/tuya.ts](backend/src/routes/tuya.ts): **todas** las rutas de Tuya legacy sin auth — control de dispositivos IoT expuesto
- **Impacto:** Cualquier persona puede leer todos los datos de cultivo, enviar comandos a dispositivos IoT, y leer mediciones sin autenticarse.
- **Recomendación:** Aplicar `authenticateToken` + `requireTenant` a TODAS las rutas excepto auth y health.
- **Esfuerzo:** Bajo

## H-05: API URL hardcodeada en el frontend
- **Severidad:** ALTA
- **Categoría:** Configuración / DX
- **Hallazgo:** La URL `http://localhost:3000/api` está hardcodeada en 8+ ubicaciones del frontend. No se usa `import.meta.env.VITE_API_URL`.
- **Evidencia:**
  - [src/services/api.ts](src/services/api.ts#L4): `const API_URL = 'http://localhost:3000/api';`
  - [src/components/TuyaLinkWizard.tsx](src/components/TuyaLinkWizard.tsx#L48): fetch directo a localhost
  - [src/pages/Sensors.tsx](src/pages/Sensors.tsx#L61): 3 fetch directos a localhost
  - [src/pages/Labs.tsx](src/pages/Labs.tsx#L110): 3 fetch directos a localhost
- **Impacto:** Imposible desplegar en otro entorno sin modificar código fuente. Rompe build de producción.
- **Recomendación:** Crear `VITE_API_URL` en `.env`. Usar `import.meta.env.VITE_API_URL` en `api.ts`. Centralizar TODOS los fetch en el servicio `api.ts` (eliminar los fetch directos en componentes).
- **Esfuerzo:** Bajo

## H-06: Sin archivo `.env.example`
- **Severidad:** ALTA
- **Categoría:** DX / Operaciones
- **Hallazgo:** No existe ningún `.env.example` ni `.env.sample` en el repo. Un nuevo desarrollador no sabe qué variables configurar.
- **Evidencia:** `file_search` por `.env*` solo encuentra archivos `.gitignore` que excluyen `.env`.
- **Impacto:** Onboarding roto. Variables descubiertas solo leyendo todo el código fuente.
- **Recomendación:** Crear `backend/.env.example`:
  ```
  DATABASE_URL="file:./dev.db"
  JWT_SECRET="cambiar-en-produccion"
  TUYA_CLIENT_ID=""
  TUYA_CLIENT_SECRET=""
  TUYA_REGION="ueaz"
  TUYA_BASE_URL=""
  PULSE_GROW_API_URL="https://api.pulsegrow.com"
  PULSE_GROW_API_KEY=""
  PORT=3000
  ```
  Y `.env.example` en root:
  ```
  VITE_API_URL=http://localhost:3000/api
  ```
- **Esfuerzo:** Bajo

## H-07: 4 vulnerabilidades npm en backend (1 crítica)
- **Severidad:** ALTA
- **Categoría:** Seguridad / Dependencias
- **Hallazgo:** `npm audit` del backend reporta:
  - **axios ≤1.14.0** — CRÍTICA: DoS vía `__proto__`, SSRF bypass, cloud metadata exfiltration
  - **express-rate-limit 8.2.0-8.2.1** — ALTA: bypass de rate limit con IPv4-mapped IPv6
  - **path-to-regexp <0.1.13** — ALTA: ReDoS
  - **qs 6.7.0-6.14.1** — BAJA: DoS en parsing
- **Evidencia:** `npm audit` ejecutado el 2026-04-12
- **Impacto:** Superficies de ataque activas en producción. axios es usado para llamar a Tuya API → SSRF real.
- **Recomendación:** `cd backend && npm audit fix` (todos tienen fix disponible). Pin axios a ≥1.14.1.
- **Esfuerzo:** Bajo

## H-08: Backend node_modules no instalados
- **Severidad:** ALTA
- **Categoría:** DX / Build
- **Hallazgo:** `npm ls` del backend muestra 18+ UNMET DEPENDENCY. El backend no tiene node_modules.
- **Evidencia:** Output de `npm ls --depth=0` en backend: todas las dependencias son UNMET.
- **Impacto:** El backend no puede arrancar sin antes ejecutar `npm install`.
- **Recomendación:** Documentar en README. Considerar script root que instale ambos: `"install:all": "npm install && cd backend && npm install"`.
- **Esfuerzo:** Bajo

## H-09: IDs generados con Math.random()
- **Severidad:** ALTA
- **Categoría:** Seguridad / Integridad
- **Hallazgo:** Los controladores que usan JSON files generan IDs con `Math.random().toString(36).substr(2, 9)`, que es predecible y puede colisionar.
- **Evidencia:**
  - [backend/src/controllers/batches.ts](backend/src/controllers/batches.ts#L25): `id: Math.random().toString(36).substr(2, 9)`
  - [backend/src/controllers/genetics.ts](backend/src/controllers/genetics.ts#L25): ídem
  - [backend/src/controllers/operations.ts](backend/src/controllers/operations.ts#L25): ídem
  - [backend/src/controllers/monitoring.ts](backend/src/controllers/monitoring.ts#L40): ídem
- **Impacto:** IDs predecibles = enumeración de recursos. Colisiones = data loss.
- **Recomendación:** Se resuelve al migrar a Prisma (usa `cuid()`). Si se mantiene JSON temporalmente, usar `crypto.randomUUID()`.
- **Esfuerzo:** Bajo (se resuelve con H-02)

## H-10: Sin validación de input en el backend
- **Severidad:** ALTA
- **Categoría:** Seguridad
- **Hallazgo:** Los controladores extraen datos de `req.body` sin ninguna validación. No hay Zod, Joi, class-validator, ni validación manual más allá de checks null esporádicos.
- **Evidencia:**
  - [backend/src/controllers/auth.ts](backend/src/controllers/auth.ts#L11): `const { email, password, name } = req.body;` — sin validar formato de email, longitud de password
  - [backend/src/controllers/batches.ts](backend/src/controllers/batches.ts#L17): destructuring directo sin validación
  - [backend/src/controllers/genetics.ts](backend/src/controllers/genetics.ts#L24): ídem
  - Excepción parcial: [backend/src/controllers/labs.ts](backend/src/controllers/labs.ts#L41-L43) valida `name` y `type` — pero sin sanitización
- **Impacto:** Inyección de datos malformados, crashes inesperados, potencial NoSQL injection en queries Prisma con datos no validados.
- **Recomendación:** Implementar Zod para validación de schemas en cada endpoint. Ejemplo: `const RegisterSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().optional() });`
- **Esfuerzo:** Medio

## H-11: Token en localStorage sin protección
- **Severidad:** MEDIA
- **Categoría:** Seguridad
- **Hallazgo:** JWT se almacena en `localStorage`, vulnerable a XSS. No se usa httpOnly cookie.
- **Evidencia:**
  - [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx#L69): `localStorage.setItem('token', response.token);`
- **Impacto:** Si hay XSS, el atacante roba el token. Con httpOnly cookie esto no es posible.
- **Recomendación:** Para MVP es aceptable. En producción, migrar a httpOnly cookie con `credentials: 'include'` + CSRF token.
- **Esfuerzo:** Medio

## H-12: Console.log extensivo con datos sensibles
- **Severidad:** MEDIA
- **Categoría:** Seguridad / Operaciones
- **Hallazgo:** Se logean fragmentos de JWT tokens y secretos en los logs tanto del frontend como del backend.
- **Evidencia:**
  - [backend/src/middleware.ts](backend/src/middleware.ts#L17-L18): Logea substring del JWT_SECRET
  - [src/services/api.ts](src/services/api.ts#L25): Logea substring del token
  - [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx#L79): Logea substring del token
- **Impacto:** Filtración de credenciales parciales en logs de producción. Los substrings ayudan a ataques de fuerza bruta.
- **Recomendación:** Eliminar todos los console.log que contengan tokens, secrets, o datos de autenticación. Usar un logger estructurado (pino/winston) con niveles que se desactivan en producción.
- **Esfuerzo:** Bajo

## H-13: CORS permisivo con lista de ports
- **Severidad:** MEDIA
- **Categoría:** Seguridad
- **Hallazgo:** CORS permite 6 orígenes localhost con puertos 5173-5177 y 3000. En producción esto debe cambiar.
- **Evidencia:**
  - [backend/src/index.ts](backend/src/index.ts#L39-L46): Lista hardcodeada de origins
- **Impacto:** Seguro en desarrollo, pero si se despliega sin cambiar, cualquier localhost puede hacer requests.
- **Recomendación:** Cargar `CORS_ORIGINS` desde `.env` como array. Ej: `CORS_ORIGINS=http://localhost:5173,https://app.cannacorp.com`
- **Esfuerzo:** Bajo

## H-14: Nombre del proyecto inconsistente
- **Severidad:** BAJA
- **Categoría:** DX
- **Hallazgo:** El `package.json` raíz tiene `"name": "vite-react-typescript-starter"` (template default), no `"cannacorp"` o `"cannagrow"`.
- **Evidencia:** [package.json](package.json#L2)
- **Impacto:** Confusión en logs, npm workspace, y registry.
- **Recomendación:** Cambiar a `"name": "cannagrow"`.
- **Esfuerzo:** Bajo

## H-15: TypeScript types para paquetes deprecados (@types/helmet, @types/express-rate-limit)
- **Severidad:** BAJA
- **Categoría:** Dependencias
- **Hallazgo:** `@types/helmet@^0.0.48` y `@types/express-rate-limit@^5.1.3` son paquetes obsoletos. Las versiones modernas de helmet (7+) y express-rate-limit (7+) incluyen sus propios tipos.
- **Evidencia:** [backend/package.json](backend/package.json#L28-L29)
- **Impacto:** Conflicto de tipos, warnings en instalación.
- **Recomendación:** Eliminar `@types/helmet` y `@types/express-rate-limit` del devDependencies.
- **Esfuerzo:** Bajo

## H-16: Token con expiración de 7 días sin refresh
- **Severidad:** MEDIA
- **Categoría:** Seguridad
- **Hallazgo:** El JWT expira en 7 días y no hay mecanismo de refresh token.
- **Evidencia:**
  - [backend/src/controllers/auth.ts](backend/src/controllers/auth.ts#L57): `{ expiresIn: '7d' }`
  - [backend/src/controllers/auth.ts](backend/src/controllers/auth.ts#L109): ídem en login
- **Impacto:** Si un token se compromete, el atacante tiene acceso durante 7 días. No hay forma de revocarlo.
- **Recomendación:** Reducir a 1h con refresh token, o implementar blacklist de tokens revocados.
- **Esfuerzo:** Medio

## H-17: Rutas Tuya legacy sin autenticación + sin uso de tenant
- **Severidad:** ALTA
- **Categoría:** Seguridad
- **Hallazgo:** Las rutas en `tuya.ts` (legacy) no tienen autenticación y permiten listar/controlar TODOS los dispositivos IoT sin verificación de tenant o usuario.
- **Evidencia:** [backend/src/routes/tuya.ts](backend/src/routes/tuya.ts) — ninguna ruta usa `authenticateToken` ni `requireTenant`. Incluye `POST /devices/:deviceId/commands` que envía comandos a dispositivos.
- **Impacto:** Cualquiera puede controlar remotamente dispositivos IoT (encender/apagar, cambiar configuración). Riesgo físico real.
- **Recomendación:** Eliminar las rutas legacy de tuya.ts y usar exclusivamente tuyaMultiTenant.ts que sí tiene auth.
- **Esfuerzo:** Bajo

## H-18: No existe estructura de monorepo real
- **Severidad:** MEDIA
- **Categoría:** Arquitectura
- **Hallazgo:** Aunque el repo contiene frontend y backend, no tiene configuración de workspaces. El frontend es el root package (anti-pattern), y el backend es un subdirectorio con su propio package.json sin vinculación.
- **Evidencia:**
  - [package.json](package.json): No tiene campo `"workspaces"`
  - No existe `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, ni `lerna.json`
- **Impacto:** No se puede ejecutar `npm install` desde root para ambos. No se comparten dependencias. No se puede hacer `npm run dev` para ambos servicios a la vez.
- **Recomendación:** Reestructurar como:
  ```
  apps/
    web/     ← frontend actual
    api/     ← backend actual
  packages/
    types/   ← tipos compartidos
    config/  ← eslint, ts configs base
  ```
  Configurar npm workspaces o migrar a pnpm workspaces.
- **Esfuerzo:** Alto

## H-19: Duplicación de tipo ExpressRequest
- **Severidad:** BAJA
- **Categoría:** Código
- **Hallazgo:** La extensión de `Express.Request` está declarada en 2 archivos distintos con definiciones ligeramente diferentes.
- **Evidencia:**
  - [backend/src/types/express.d.ts](backend/src/types/express.d.ts): Declara `user?: AuthUser` y `tenant?: TenantContext`
  - [backend/src/middleware/requireTenant.ts](backend/src/middleware/requireTenant.ts#L10-L16): Re-declara la misma extensión global con tipos distintos (`role` inline)
  - [backend/src/middleware.ts](backend/src/middleware.ts#L6): Define `AuthRequest` con `userId?: string` (patrón distinto)
- **Impacto:** Confusión sobre qué tipo usar. Posibles conflictos de tipado.
- **Recomendación:** Unificar en `express.d.ts` y eliminar duplicaciones.
- **Esfuerzo:** Bajo

---

# 4. Hallazgos por Servicio

## API (Backend)

### Arquitectura
- Express plano sin capas claras (no hay capa de servicio entre controllers y DB).
- Controllers manejan directamente lógica de negocio, acceso a datos y response HTTP.
- Rutas definen middleware inline con inconsistencias (labs usa requireTenant, batches no).
- No hay DTOs ni transformación de responses.
- El error handler global es genérico: solo logea error y devuelve 500.

### Patrón de acceso a datos
| Módulo | Mecanismo | Tenant-aware |
|--------|-----------|-------------|
| Auth | Prisma | N/A (global) |
| Labs | Prisma | ✓ (filtra por tenantId) |
| Tenants | Prisma | ✓ |
| Tuya Multi-tenant | Prisma | ✓ |
| Batches | JSON file | ✗ |
| Genetics | JSON file | ✗ |
| Operations | JSON file | ✗ |
| Monitoring | JSON file | ✗ |

**Conclusión:** Solo 4 de 8 módulos usan la DB real. Los otros 4 ignoran completamente el multi-tenancy.

### Manejo de errores
- try/catch individual por handler con `res.status(500).json({ error: '...' })`.
- No hay logging estructurado — solo `console.log` y `console.error`.
- El error handler global en [backend/src/middleware.ts](backend/src/middleware.ts#L40-L43) no distingue tipos de error ni status codes.
- No hay serialización de errores de Prisma (ej: unique constraint violations devuelven 500 en vez de 409).

### Logging
- Console.log con emojis (🔐, ✅, ❌, ⚠️, 📝) — no es estructurado, no es filtrable.
- Se logean datos sensibles (substrings de tokens/secretos).
- No hay request ID, no hay correlation, no hay niveles (debug/info/warn/error).

## Frontend

### Estructura
```
src/
  components/    → 11 componentes UI reutilizables ✓
  config/        → feature flags + navigation schema ✓
  contexts/      → 5 contextos React (Auth, Data, Theme, Language, Tenant)
  locales/       → en.ts, es.ts
  mocks/         → ops.ts (datos mock para operaciones)
  pages/         → 15 páginas (incluye subdirectories Operations/, Resources/)
  services/      → api.ts (cliente API)
  types/         → navigation.ts
```

### Problemas principales
1. **Páginas demasiado grandes**: Labs.tsx (~500 líneas), Monitoring.tsx (~400), Analytics.tsx (~380), Sensors.tsx (~420), Problems.tsx (~500) — mezclan UI, lógica de negocio y fetching.
2. **Fetching inconsistente**: Labs, Sensors y TuyaLinkWizard hacen `fetch()` directos en vez de usar el servicio `api.ts`.
3. **No hay custom hooks**: La lógica de fetching, polling y transformación de datos vive dentro de los componentes.
4. **Polling hardcodeado**: SetInterval de 30s en múltiples componentes sin cleanup verificable → memory leaks potenciales.
5. **Conversión F→C repetida**: Lógica de conversión de temperature duplicada en Sensors, PulseGrowMonitoring, Monitoring.
6. **Mocks en producción**: `src/mocks/ops.ts` exporta datos hardcodeados que se usan directamente en componentes.
7. **No hay lazy loading**: Todas las rutas se importan estáticamente en App.tsx → bundle innecesariamente grande.

### Estado y contextos
- **5 contextos anidados** en App.tsx (ThemeProvider > LanguageProvider > AuthProvider > TenantProvider > DataProvider).
- DataContext hace 4 fetch paralelos al montar, por cada cambio de tenant.
- No hay caché de datos (React Query / SWR ausente).
- Estado global via Context API — suficiente para MVP, pero escala mal con más módulos.

### Accesibilidad
- No se encontraron atributos `aria-*` ni roles WAI-ARIA.
- No hay `label` asociado a inputs (solo placeholder).
- No hay skip navigation ni focus management.
- **Hipótesis:** La accesibilidad no fue considerada en la fase MVP.

## DB

### Motor
- **SQLite** via Prisma.
- **Evidencia:** [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L9): `provider = "sqlite"`

### Schema
- **13 modelos** bien definidos: Tenant, User, Membership, TuyaAppAccount, TuyaDevice, Lab, Genetics, Batch, Operation, Measurement, Sensor.
- **Relaciones correctas** con foreign keys y onDelete cascade/setNull según contexto.
- **Índices explícitos** en tenantId, labId, batchId, userId — bien configurado.
- `role` en Membership es `String` en vez de enum — no hay restricción a nivel DB.
- `TuyaDevice.raw` almacena JSON como String — aceptable en SQLite, pero en PostgreSQL debería ser `Json`.
- `Genetics` no tiene `tenantId` — es global para todos los tenants. **Hipótesis:** intencional (genética compartida), pero limita la personalización por tenant.

### Migraciones
- 2 migraciones:
  - `20260129175631_multi_tenant_tuya`
  - `20260130034715_add_lab_to_tuya_devices`
- **No hay seed script** en package.json. Los scripts de seed son archivos sueltos (`create-org.js`, `create-lab.js`).

### Riesgos de producción
- SQLite no soporta conexiones concurrentes para escritura.
- No hay backup strategy para el archivo `.db`.
- `role` como String permite valores inválidos (ej: "SUPERADMIN" no se valida).

## Shared/Packages

- **No existen.** No hay paquetes compartidos entre frontend y backend.
- Los tipos de datos (Lab, Batch, Genetics, etc.) están definidos independientemente en:
  - Frontend: [src/contexts/DataContext.tsx](src/contexts/DataContext.tsx) (interfaces inline)
  - Backend: Prisma schema (generado automáticamente)
- **Riesgo:** Los tipos pueden desincronizarse silenciosamente.

---

# 5. Riesgos de Producción (priorizados)

| # | Riesgo | Severidad | Probabilidad |
|---|--------|-----------|-------------|
| 1 | JWT firmado con `'secret'` si falta `.env` | Crítica | Alta |
| 2 | Rutas Tuya legacy permiten control de dispositivos IoT sin auth | Crítica | Alta |
| 3 | Datos de batches/genetics/ops no están en DB real | Crítica | Cierta |
| 4 | API URL hardcodeada — build de producción apunta a localhost | Alta | Cierta |
| 5 | Vulnerabilidades npm en axios (SSRF + DoS) | Alta | Media |
| 6 | Sin validación de input — inyección de datos malformados | Alta | Alta |
| 7 | SQLite no escala en concurrencia | Alta | Alta en producción |
| 8 | Sin tests — cualquier cambio puede romper algo sin detectarse | Alta | Permanente |
| 9 | Sin CI/CD — no hay gate de calidad antes de merge | Alta | Permanente |
| 10 | Console.logs con datos sensibles en producción | Media | Alta |
| 11 | JWT de 7 días sin refresh ni revocación | Media | Media |
| 12 | Token en localStorage vulnerable a XSS | Media | Baja-Media |
| 13 | Sin health check profundo (DB readiness, integrations) | Media | Media |
| 14 | Memory leaks por polling sin cleanup en frontend | Media | Media |

---

# 6. Plan de Remediación por Fases

## Fase 1: Quick Wins (1-2 días)

### Seguridad inmediata
- [ ] Eliminar fallback `|| 'secret'` de JWT_SECRET en los 3 archivos. Crash on missing.
- [ ] Eliminar o bloquear `backend/src/routes/tuya.ts` (rutas legacy sin auth).
- [ ] Aplicar `authenticateToken` + `requireTenant` a TODAS las rutas GET de batches, genetics, operations, monitoring.
- [ ] `cd backend && npm audit fix` — resolver las 4 vulnerabilidades.
- [ ] Eliminar console.logs que exponen tokens/secrets.

### Configuración
- [ ] Crear `backend/.env.example` con todas las variables necesarias.
- [ ] Crear `.env.example` en root con `VITE_API_URL`.
- [ ] Centralizar API_URL en frontend: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'`.
- [ ] Eliminar los 8 fetch directos a `localhost:3000` en componentes — usar `api.ts`.
- [ ] Renombrar `package.json` name a `"cannagrow"`.

### DX
- [ ] Crear script root `"install:all"` y `"dev:all"` (concurrently frontend + backend).
- [ ] Crear singleton de PrismaClient en `backend/src/lib/prisma.ts`.
- [ ] Eliminar `@types/helmet` y `@types/express-rate-limit` obsoletos.

## Fase 2: Mejoras Estructurales (1 semana)

### Migración de persistencia
- [ ] Migrar controllers de `batches`, `genetics`, `operations`, `monitoring` de JSON files a Prisma.
- [ ] Agregar `tenantId` filtering a todas las queries migradas.
- [ ] Crear seed script oficial: `backend/prisma/seed.ts` + agregar a `"prisma": { "seed": "ts-node prisma/seed.ts" }` en package.json.
- [ ] Eliminar carpeta `backend/data/` después de migrar.

### Validación de input
- [ ] Instalar Zod: `npm install zod`.
- [ ] Crear schemas de validación para todos los endpoints (RegisterSchema, LoginSchema, CreateLabSchema, etc.).
- [ ] Middleware de validación: `const validate = (schema) => (req, res, next) => { ... }`.

### Frontend refactor
- [ ] Extraer custom hooks: `useLabData()`, `useBatches()`, `useTuyaDevices()`, `usePulseGrow()`.
- [ ] Extraer utilidad `convertFahrenheitToCelsius()`.
- [ ] Implementar React.lazy() + Suspense para todas las rutas.
- [ ] Mover interfaz types a `src/types/` con archivos por dominio.

### Testing foundation
- [ ] Configurar Vitest para frontend.
- [ ] Configurar Vitest o Jest para backend.
- [ ] Escribir tests para: auth controller (login/register), requireAuth middleware, requireTenant middleware.
- [ ] Escribir tests para: api.ts (frontend), ProtectedRoute.

### Logging
- [ ] Instalar pino (backend).
- [ ] Reemplazar console.log/error por logger.info/error con request IDs.
- [ ] Desactivar debug logs en producción.

## Fase 3: Hardening y Escalabilidad (2-3 semanas)

### Base de datos
- [ ] Migrar de SQLite a PostgreSQL.
- [ ] Convertir `role` a enum en Prisma schema.
- [ ] Agregar `tenantId` a `Genetics` para hacer tenant-aware.
- [ ] Agregar índices compuestos donde haga falta (batch code + tenantId, etc.).

### Monorepo real
- [ ] Reestructurar a `apps/web`, `apps/api`, `packages/types`.
- [ ] Configurar npm workspaces o migrar a pnpm.
- [ ] Extraer tipos compartidos al paquete `@cannagrow/types`.

### Auth mejorado
- [ ] Implementar refresh tokens con rotación.
- [ ] Migrar a httpOnly cookies (o mantener localStorage con CSP estricto).
- [ ] Implementar token revocation (blacklist en Redis o DB).
- [ ] Reducir expiración a 1 hora.

### CI/CD
- [ ] Crear GitHub Actions workflow: lint → typecheck → test → build.
- [ ] Agregar pre-commit hooks con husky + lint-staged.
- [ ] Agregar pipeline de deploy (preview en PR, staging, producción).

### Observabilidad
- [ ] Health check profundo: `/health` que verifique DB connection + Tuya API reachability.
- [ ] Agregar métricas básicas (request count, latency, error rate).
- [ ] Estructura de logs compatible con ELK/Datadog.

### Performance frontend
- [ ] Implementar React Query / TanStack Query para caching y deduplicación.
- [ ] Throttle/debounce en filtros y búsquedas.
- [ ] Virtualizar listas largas (Operations Logs).

---

# 7. Dockerización

## Estado actual
- **No existe ningún archivo Docker** en el repositorio. No hay Dockerfile, docker-compose.yml, ni .dockerignore.

## Bloqueantes actuales
1. **API URL hardcodeada**: El frontend apunta a `localhost:3000` — en Docker necesita resolverse a `api:3000` o una URL configurable.
2. **SQLite como DB**: No se puede compartir fácilmente entre contenedores. Necesita volumen o migrar a PostgreSQL.
3. **No hay `.env.example`**: No se sabe qué variables pasar al contenedor.
4. **Backend sin `node_modules`**: Necesita `npm install` en build.
5. **Frontend y backend mezclan build contexts**: Frontend es el root, backend es subdirectorio.

## Propuesta concreta

### Estructura propuesta
```
docker/
  Dockerfile.api
  Dockerfile.web
docker-compose.yml
docker-compose.prod.yml
.dockerignore
```

### `docker/Dockerfile.api`
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM base AS build
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ .
RUN npx prisma generate
RUN npm run build

FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY backend/prisma ./prisma
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### `docker/Dockerfile.web`
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `docker-compose.yml` (desarrollo)
```yaml
services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./dev.db
      - JWT_SECRET=${JWT_SECRET}
      - TUYA_CLIENT_ID=${TUYA_CLIENT_ID}
      - TUYA_CLIENT_SECRET=${TUYA_CLIENT_SECRET}
      - TUYA_REGION=${TUYA_REGION}
    volumes:
      - ./backend/src:/app/src  # hot reload
      - db-data:/app/prisma
    
  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
      args:
        VITE_API_URL: http://localhost:3000/api
    ports:
      - "5173:80"
    depends_on:
      - api

volumes:
  db-data:
```

### Para producción con PostgreSQL
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: cannagrow
      POSTGRES_USER: cannagrow
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    environment:
      DATABASE_URL: postgresql://cannagrow:${DB_PASSWORD}@db:5432/cannagrow
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - db

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
      args:
        VITE_API_URL: https://api.cannagrow.com

volumes:
  pgdata:
```

### Cambios necesarios para que funcione
1. Crear `VITE_API_URL` envvar y usarla en todo el frontend.
2. Migrar `backend/.env` a variables de entorno en compose.
3. Agregar `.dockerignore` (node_modules, dist, .env, *.db).
4. Agregar script de migrations al entrypoint del API: `npx prisma migrate deploy && node dist/index.js`.
5. Hot reload en desarrollo: montar volúmenes de src, usar `ts-node-dev` o `nodemon`.

---

# 8. Checklist Final de Remediación

## Seguridad (Día 1)
- [ ] Eliminar fallback `'secret'` de JWT_SECRET (3 archivos)
- [ ] Eliminar/desactivar rutas legacy Tuya sin auth
- [ ] Agregar auth a todas las rutas GET desprotegidas
- [ ] Ejecutar `npm audit fix` en backend
- [ ] Eliminar logs de tokens/secrets
- [ ] Crear `.env.example` para backend y frontend

## Configuración (Día 1-2)
- [ ] Centralizar API_URL con envvar `VITE_API_URL`
- [ ] Eliminar fetch directos a localhost en componentes
- [ ] Crear PrismaClient singleton
- [ ] Eliminar @types obsoletos (helmet, express-rate-limit)
- [ ] Renombrar package.json name

## Persistencia (Semana 1)
- [ ] Migrar batches controller a Prisma
- [ ] Migrar genetics controller a Prisma
- [ ] Migrar operations controller a Prisma
- [ ] Migrar monitoring controller a Prisma
- [ ] Agregar tenantId filtering a módulos migrados
- [ ] Crear seed script oficial
- [ ] Eliminar carpeta backend/data/

## Validación (Semana 1)
- [ ] Instalar y configurar Zod
- [ ] Crear schemas: auth, labs, genetics, batches, operations, monitoring
- [ ] Crear middleware de validación reutilizable

## Testing (Semana 1-2)
- [ ] Configurar Vitest (frontend + backend)
- [ ] Tests: auth controller
- [ ] Tests: middleware de auth y tenant
- [ ] Tests: api.ts del frontend
- [ ] Tests: componente ProtectedRoute

## Frontend Quality (Semana 2)
- [ ] Extraer custom hooks de fetching
- [ ] Implementar React.lazy + Suspense
- [ ] Extraer utility functions (conversiones, formateo)
- [ ] Mover types a directorio centralizado

## Observabilidad (Semana 2)
- [ ] Instalar pino para logging estructurado
- [ ] Agregar request IDs a los logs
- [ ] Health check profundo (/health → DB + integrations)

## Infraestructura (Semana 2-3)
- [ ] Crear Dockerfiles (api + web)
- [ ] Crear docker-compose.yml
- [ ] Crear .dockerignore
- [ ] GitHub Actions: lint → typecheck → test → build
- [ ] Pre-commit hooks (husky + lint-staged)

## Escalabilidad (Semana 3+)
- [ ] Migrar SQLite → PostgreSQL
- [ ] Reestructurar como monorepo real
- [ ] Extraer paquete de tipos compartidos
- [ ] Implementar refresh tokens
- [ ] Implementar React Query para caché

---

*Fin de auditoría. Todos los hallazgos están basados en archivos reales del repositorio auditado el 2026-04-12.*

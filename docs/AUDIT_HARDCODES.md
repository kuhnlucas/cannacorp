# Auditoría Técnica — Hardcodes y Migración a API-Driven Frontend

**Fecha:** 2026-04-12  
**Alcance:** Repositorio completo `cannacorp/` — frontend (`src/`) + backend (`backend/`)

---

# 1. Resumen Ejecutivo

| Aspecto | Estado |
|---------|--------|
| Dependencia de mocks/datos fake | **Alta** — 3 páginas de Operations consumen 100% de mocks, 4 controladores backend usan JSON files en vez de Prisma |
| Datos hardcodeados en frontend | **40+ hallazgos** en 15 archivos |
| Dominios más afectados | Operations (100% mock), Analytics (fallback fake + Math.random), Dashboard (stats/activity fake), Resources (100% hardcoded), BatchDetail (fake events/metrics) |
| Backend legacy JSON | **4 controladores** (genetics, batches, operations, monitoring) leen/escriben archivos JSON en vez de usar los modelos Prisma que YA existen |
| Modelos Prisma sin endpoint | `Sensor` no tiene ningún endpoint CRUD |
| Deuda técnica estimada | **ALTA** |

### Estado por dominio

| Dominio | Frontend | Backend | Fuente de verdad |
|---------|----------|---------|-------------------|
| Auth/Tenant | Rol hardcodeado `'operator'` | Prisma ✅ | Mixta — localStorage + API parcial |
| Labs | API real ✅ | Prisma ✅ | Prisma |
| Genetics | API (consume JSON backend) | **JSON file** ❌ | `data/genetics.json` |
| Batches | API (consume JSON backend) | **JSON file** ❌ | `data/batches.json` |
| BatchDetail | **Hardcoded** events/metrics | JSON file (sin events) | Ninguna |
| Operations | **100% mocks** (`mocks/ops.ts`) | **JSON file** ❌ | `mocks/ops.ts` (frontend) |
| Monitoring | Sensores fabricados en frontend | **JSON file** ❌ | `data/measurements.json` |
| Sensors/IoT | `localhost` fetch directo | Prisma ✅ (Tuya) / External API (PulseGrow) | Mixta |
| Analytics | Fallback fake + `Math.random()` | No endpoint dedicado | Ninguna real |
| Dashboard | Stats/activity hardcoded | No endpoint | Frontend fake |
| Alerts | Generada desde measurements ✅ | Measurements es JSON ❌ | Semi-funcional |
| Resources | **100% hardcoded** | No existe | Frontend inline |
| Problems | 19 items inline con i18n | No existe | Frontend inline |

---

# 2. Inventario de Hardcodes Detectados

## A. Hardcodes que DEBEN salir desde API

### A1 — Dashboard: estadísticas y actividad reciente
| Campo | Valor |
|-------|-------|
| **Severidad** | Crítica |
| **Categoría** | stat fake + array inline |
| **Dominio** | Dashboard |
| **Archivo** | [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) |
| **Evidencia** | Líneas ~37–63: `value: 2, change: '-1'` (alertas), `change: '+2'` (labs), `change: '+1'` (batches), `change: '100%'` (genetics). Líneas ~203–212: alert cards fake ("High Temperature Alert", "28°C"). Líneas ~341–365: activity feed fake ("BD-003", "Gorilla Glue") |
| **Debe venir desde API** | Sí — endpoint `/api/dashboard/stats` y `/api/dashboard/activity` |
| **Estado backend** | No existe |

### A2 — Analytics: métricas fake y Math.random()
| Campo | Valor |
|-------|-------|
| **Severidad** | Crítica |
| **Categoría** | fallback mock + datos random |
| **Dominio** | Analytics |
| **Archivo** | [src/pages/Analytics.tsx](src/pages/Analytics.tsx) |
| **Evidencia** | Líneas ~37–44 y ~84–93: fallback `avgYield: 450, successRate: 89` cuando no hay datos. Líneas ~106–111: `Math.random()` para fabricar yield por genética. Líneas ~113–140: `change: '+12%'` hardcoded. Líneas ~335–378: "Growth Phase Analysis" con 9 scores fake (`8.7/10`, `9.1/10`, etc.) |
| **Debe venir desde API** | Sí — endpoint `/api/analytics/summary` con cálculos reales |
| **Estado backend** | No existe |

### A3 — Operations: 100% consumo de mocks
| Campo | Valor |
|-------|-------|
| **Severidad** | Crítica |
| **Categoría** | mock completo |
| **Dominio** | Operations |
| **Archivos** | [src/pages/Operations/QuickOperation.tsx](src/pages/Operations/QuickOperation.tsx), [src/pages/Operations/OperationLogs.tsx](src/pages/Operations/OperationLogs.tsx), [src/pages/Operations/OperationPlan.tsx](src/pages/Operations/OperationPlan.tsx) |
| **Evidencia** | Import directo de `mocks/ops.ts`: `mockOperationEvents`, `mockPlanTasks`, `quickEventTypes`. QuickOperation pushea a array mock en memoria. OperationLogs filtra array mock. OperationPlan inicializa `useState(mockPlanTasks)`. Ninguna de las 3 páginas hace fetch a API |
| **Debe venir desde API** | Sí — existen endpoints `/api/operations` pero son JSON-based y las páginas no los usan |
| **Estado backend** | Existe endpoint JSON file, pero estructura no coincide con mock frontend |

### A4 — BatchDetail: eventos, health score, condiciones ambientales
| Campo | Valor |
|-------|-------|
| **Severidad** | Alta |
| **Categoría** | array inline + stat fake |
| **Dominio** | Batches |
| **Archivo** | [src/pages/BatchDetail.tsx](src/pages/BatchDetail.tsx) |
| **Evidencia** | Líneas ~30–49: array `events` con 3 eventos fake (watering, pruning, transplanting) de enero 2024. Línea ~80: "Health Score 9.2/10" hardcoded. Líneas ~206–222: condiciones ambientales fake (24.5°C, 65%, pH 6.2, EC 1.8 mS/cm) |
| **Debe venir desde API** | Sí — events deberían ser operations del batch, condiciones deberían ser measurements reales |
| **Estado backend** | Operations endpoint existe (JSON) pero no filtra por batch. Measurements existe (JSON) pero no filtra por batch |

### A5 — GeneticsDetail: performance scores fake
| Campo | Valor |
|-------|-------|
| **Severidad** | Alta |
| **Categoría** | stat fake |
| **Dominio** | Genetics |
| **Archivo** | [src/pages/GeneticsDetail.tsx](src/pages/GeneticsDetail.tsx) |
| **Evidencia** | Líneas ~163–178: "8.7/10" overall, "9.1/10" yield, "8.5/10" disease resistance, "8.0/10" stability — todos hardcodeados |
| **Debe venir desde API** | Sí — endpoint de analytics por genética o campo calculado |
| **Estado backend** | No existe |

### A6 — Monitoring: sensores fabricados en frontend
| Campo | Valor |
|-------|-------|
| **Severidad** | Alta |
| **Categoría** | array generado fake |
| **Dominio** | Monitoring |
| **Archivo** | [src/pages/Monitoring.tsx](src/pages/Monitoring.tsx) |
| **Evidencia** | Líneas ~131–137: `sensorStatus` se genera con `labs.flatMap()` creando 4 sensores ficticios por lab (temp, humedad, pH, EC), todos siempre `status: 'online'`, `lastReading: 'Ahora'` |
| **Debe venir desde API** | Sí — usar modelo Prisma `Sensor` (ya existe) con CRUD real |
| **Estado backend** | Modelo Prisma existe. No tiene endpoint CRUD |

### A7 — AuthContext: rol hardcodeado
| Campo | Valor |
|-------|-------|
| **Severidad** | Alta |
| **Categoría** | config funcional |
| **Dominio** | Auth |
| **Archivo** | [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) |
| **Evidencia** | Línea ~60: `role: 'operator'` hardcodeado — ignora el rol real que viene del server (membership.role = OWNER/ADMIN/STAFF) |
| **Debe venir desde API** | Sí — leer del response de login (ya viene en memberships) |
| **Estado backend** | Ya devuelve memberships con role en login response |

### A8 — TenantContext: sin API calls
| Campo | Valor |
|-------|-------|
| **Severidad** | Alta |
| **Categoría** | mock / fallback |
| **Dominio** | Tenants |
| **Archivo** | [src/contexts/TenantContext.tsx](src/contexts/TenantContext.tsx) |
| **Evidencia** | `refreshTenants()` solo lee localStorage, nunca consulta API. Fallback fabrica tenant con `name: "Mi espacio de trabajo"`, `role: 'OWNER'`. `createTenant` siempre lanza error |
| **Debe venir desde API** | Sí — endpoint `GET /api/tenants` ya existe y funciona |
| **Estado backend** | Ya existe endpoint completo |

### A9 — QuickOperation: selects hardcodeados
| Campo | Valor |
|-------|-------|
| **Severidad** | Alta |
| **Categoría** | catálogo hardcodeado |
| **Dominio** | Operations |
| **Archivo** | [src/pages/Operations/QuickOperation.tsx](src/pages/Operations/QuickOperation.tsx) |
| **Evidencia** | Líneas ~94–107, ~196–221: `<option>Lab A</option>`, `<option>Sala 1</option>`, `<option>Standard Growth</option>`, `<option>Spider Mites</option>`, etc. — labs, salas, recetas y plagas están hardcodeadas como options HTML |
| **Debe venir desde API** | Sí — labs ya tienen endpoint. Salas/recetas/plagas necesitan catálogo |
| **Estado backend** | Labs existe. Catálogos de recetas/plagas no existen |

### A10 — Resources/Growshops: página 100% hardcoded
| Campo | Valor |
|-------|-------|
| **Severidad** | Media |
| **Categoría** | array inline |
| **Dominio** | Resources |
| **Archivo** | [src/pages/Resources/Growshops.tsx](src/pages/Resources/Growshops.tsx) |
| **Evidencia** | Líneas ~28–71: 4 growshops con nombre, teléfono, website, rating, specialties — todo inline |
| **Debe venir desde API** | Sí |
| **Estado backend** | No existe modelo ni endpoint |

### A11 — Resources/Guides: página 100% hardcoded
| Campo | Valor |
|-------|-------|
| **Severidad** | Media |
| **Categoría** | array inline |
| **Dominio** | Resources |
| **Archivo** | [src/pages/Resources/Guides.tsx](src/pages/Resources/Guides.tsx) |
| **Evidencia** | Líneas ~22–44: 3 guías con título, descripción, categoría, dificultad, readTime |
| **Debe venir desde API** | Sí |
| **Estado backend** | No existe modelo ni endpoint |

---

## B. Hardcodes que PUEDEN quedarse en frontend (con mejoras)

### B1 — Problems: enciclopedia de problemas con i18n
| Campo | Valor |
|-------|-------|
| **Severidad** | Baja |
| **Archivo** | [src/pages/Problems.tsx](src/pages/Problems.tsx) |
| **Evidencia** | 19 problemas con estructura, ID, categoría, severidad e ícono inline. Los textos ya usan `t()` (i18n) |
| **Decisión** | Puede quedarse como knowledge base estática en frontend. Es contenido de referencia, no datos de usuario. A futuro podría migrar a API si se quiere que los usuarios lo editen |

### B2 — Alerts: thresholds de medición
| Campo | Valor |
|-------|-------|
| **Severidad** | Baja |
| **Archivo** | [src/pages/Alerts.tsx](src/pages/Alerts.tsx) |
| **Evidencia** | Los umbrales (temp > 30°C = error, > 27°C = warning, humidity 40–80%, pH 5.5–6.5, EC 0.5–2.0) son constantes de negocio |
| **Decisión** | Pueden quedarse como constantes configurables. A futuro podrían ser configuraciones por lab |

### B3 — Labs: opciones de tipo de sala
| Campo | Valor |
|-------|-------|
| **Severidad** | Baja |
| **Archivo** | [src/pages/Labs.tsx](src/pages/Labs.tsx) |
| **Evidencia** | `LAB_TYPE_OPTIONS` con 5 tipos (Vegetative, Flowering, Dry, Clone, Mother) — hardcoded en español |
| **Decisión** | Puede quedarse como constante SI se traduce con i18n. El modelo `Lab.type` es un `String` libre en Prisma |

### B4 — Sensors: labels de categoría Tuya
| Campo | Valor |
|-------|-------|
| **Severidad** | Baja |
| **Archivo** | [src/pages/Sensors.tsx](src/pages/Sensors.tsx) |
| **Evidencia** | Líneas ~118–125: `categories` mapea códigos Tuya a labels (`'wsdcg'` → `'Sensor Temp/Humedad'`) |
| **Decisión** | Puede quedarse como constante — son códigos fijos de Tuya. Debería usar i18n |

### B5 — Mocks/ops.ts: labels y colores de tipos de evento
| Campo | Valor |
|-------|-------|
| **Severidad** | Baja |
| **Archivo** | [src/mocks/ops.ts](src/mocks/ops.ts) |
| **Evidencia** | `eventTypeLabels` y `eventTypeColors` son mapeos UI (watering → 'Riego', watering → blue) |
| **Decisión** | Los labels deberían usar i18n. Los colores son UI. Pueden moverse a `config/` cuando se eliminen los mocks |

---

## C. Hardcodes dudosos

### C1 — Login: credenciales demo visibles
| Campo | Valor |
|-------|-------|
| **Archivo** | [src/pages/Login.tsx](src/pages/Login.tsx) |
| **Evidencia** | Líneas ~109–113: muestra `admin@cannabis.com` / `admin123` en la UI |
| **Decisión** | Útil para desarrollo. Debería existir solo cuando `NODE_ENV=development` o flag similar |

### C2 — Sidebar: versión hardcodeada
| Campo | Valor |
|-------|-------|
| **Archivo** | [src/components/Sidebar.tsx](src/components/Sidebar.tsx) |
| **Evidencia** | `v1.0.0` hardcodeado |
| **Decisión** | Debería leer de `package.json` o env var. Baja prioridad |

---

# 3. Mapa de Cobertura Actual de API

## Endpoints existentes por fuente de datos

### Prisma (real DB) ✅

| Método | Ruta | Auth | Tenant |
|--------|------|------|--------|
| POST | `/api/auth/register` | No | — |
| POST | `/api/auth/login` | No | — |
| GET | `/api/tenants` | Sí | Sí |
| POST | `/api/tenants` | Sí | — |
| GET | `/api/tenants/:id` | Sí | Sí |
| GET/POST/PATCH/DELETE | `/api/labs[/:id]` | Sí | Sí |
| All | `/api/tuya/*` | Sí | Sí |

### JSON file (legacy) ❌

| Método | Ruta | Auth | Tenant |
|--------|------|------|--------|
| GET/POST/PATCH/DELETE | `/api/genetics[/:id]` | Parcial | No |
| GET/POST/PATCH/DELETE | `/api/batches[/:id]` | Parcial | No |
| GET/POST/DELETE | `/api/operations[/:id]` | Parcial | No |
| GET/POST | `/api/monitoring/measurements` | Parcial | No |
| GET | `/api/monitoring/sensors/:labId` | No | No |
| GET | `/api/monitoring/realtime/:labId` | No | No |

### External API (passthrough)

| Método | Ruta | Auth | Notas |
|--------|------|------|-------|
| GET | `/api/sensors/pulsegrow/devices` | No | Sin auth headers |
| GET | `/api/sensors/pulsegrow/:id/recent` | No | Sin auth headers |
| GET | `/api/sensors/pulsegrow/:id/history` | No | Sin auth headers |

## Endpoints faltantes

| Endpoint necesario | Modelo Prisma | Para qué |
|--------------------|---------------|----------|
| `GET /api/dashboard/stats` | N/A (agregación) | Stats cards del dashboard |
| `GET /api/dashboard/activity` | N/A (agregación) | Feed de actividad reciente |
| CRUD `/api/sensors` | `Sensor` ✅ existe | Sensores reales (hoy fabricados en frontend) |
| `GET /api/analytics/summary` | N/A (agregación) | Métricas calculadas reales |
| `PATCH /api/operations/:id` | `Operation` ✅ | Falta en controller actual |
| `GET /api/users/me` | `User` ✅ | Perfil usuario actual |
| `PATCH /api/users/me` | `User` ✅ | Actualizar perfil |

## Gaps críticos

1. **4 controladores legacy** usan JSON files pero los modelos Prisma YA existen
2. **Modelo `Sensor`** tiene cero endpoints
3. **No hay endpoints de agregación** (dashboard, analytics)
4. **No hay CRUD de memberships** (invite, change role)
5. **GET endpoints sin auth** en genetics, batches, operations, monitoring

---

# 4. Plan de Migración a API por Dominio

## Auth / Tenant / Memberships

| Aspecto | Acción | Esfuerzo |
|---------|--------|----------|
| AuthContext role hardcoded | Leer `response.memberships[0].role` | 5 min |
| TenantContext sin API | Usar `GET /api/tenants` real | 1h |
| TenantSelector createTenant muerto | Conectar a `POST /api/tenants` | 30 min |
| **Prioridad** | **Alta** | |

## Dashboard

| Aspecto | Acción | Esfuerzo |
|---------|--------|----------|
| Stat cards fake | Crear `GET /api/dashboard/stats` que cuente en Prisma | 2h |
| Alert detail cards fake | Usar measurements reales (como Alerts.tsx) | 1h |
| Activity feed fake | Crear `GET /api/dashboard/activity` + últimas operations | 2h |
| **Prioridad** | **Alta** | |

## Genetics

| Aspecto | Acción | Esfuerzo |
|---------|--------|----------|
| Backend JSON → Prisma | Migrar controller a `prisma.genetics.*` | 2h |
| Frontend | Ya consume API, no cambiar | — |
| GeneticsDetail scores fake | Calcular o eliminar | 1h |
| **Prioridad** | **Alta** | |

## Batches

| Aspecto | Acción | Esfuerzo |
|---------|--------|----------|
| Backend JSON → Prisma | Migrar controller, requiere FK a lab+genetics | 2h |
| BatchDetail events fake | Conectar a `GET /api/operations?batchId=X` | 1h |
| BatchDetail conditions fake | Conectar a measurements reales | 1h |
| BatchDetail health score | Calcular o eliminar | 30 min |
| **Prioridad** | **Alta** | |

## Operations

| Aspecto | Acción | Esfuerzo |
|---------|--------|----------|
| Backend JSON → Prisma + PATCH | Migrar controller completo | 2h |
| 3 páginas frontend → API | Conectar a endpoints reales | 3h |
| Selects hardcodeados | Labs de API, crear catálogos para resto | 2h |
| Eliminar mocks/ops.ts | Después de conectar API | 5 min |
| **Prioridad** | **Crítica** | |

## Monitoring / Sensors

| Aspecto | Acción | Esfuerzo |
|---------|--------|----------|
| Backend monitoring JSON → Prisma | Migrar a `prisma.measurement.*` + `prisma.sensor.*` | 3h |
| Crear CRUD Sensor | Nuevo controller + routes | 2h |
| Frontend sensores fabricados | Consumir `GET /api/sensors` | 1h |
| **Prioridad** | **Alta** | |

## IoT / Tuya / PulseGrow

| Aspecto | Acción | Esfuerzo |
|---------|--------|----------|
| 7 fetch directos a localhost | Reemplazar por `api.*` service | 1h total |
| PulseGrow sin auth headers | Agregar `fetchWithAuth` | 15 min |
| **Prioridad** | **Alta** (bug de producción) | |

## Analytics

| Aspecto | Acción | Esfuerzo |
|---------|--------|----------|
| Fallback fake data | Mostrar "sin datos" en vez de fake | 30 min |
| Math.random yields | Calcular en backend | 3h |
| Growth Phase cards fake | Eliminar o calcular | 1h |
| **Prioridad** | **Media** (requiere datos reales primero) | |

## Resources

| Aspecto | Acción | Esfuerzo |
|---------|--------|----------|
| Growshops 100% hardcoded | Crear modelo + CRUD o mover a config JSON | 2h |
| Guides 100% hardcoded | Crear modelo + CRUD o mover a config JSON | 2h |
| **Prioridad** | **Baja** | |

---

# 5. Plan de Implementación por Fases

## Fase 1 — Quick Wins (1–2 días)

Eliminar bugs de producción y hardcodes triviales donde ya existe endpoint.

| # | Tarea | Archivo(s) | Riesgo |
|---|-------|-----------|--------|
| 1.1 | Reemplazar `fetch('http://localhost:3000/...')` con `api.*` en Labs.tsx, Sensors.tsx, TuyaLinkWizard.tsx | 3 archivos | Bajo |
| 1.2 | Usar `import.meta.env.VITE_API_URL` en api.ts | api.ts | Bajo |
| 1.3 | Leer role real del login response en AuthContext | AuthContext.tsx | Bajo |
| 1.4 | Conectar TenantContext a `GET /api/tenants` | TenantContext.tsx | Bajo |
| 1.5 | Agregar auth a PulseGrow fetch calls en api.ts | api.ts | Bajo |
| 1.6 | Traducir `LAB_TYPE_OPTIONS` con i18n | Labs.tsx | Bajo |
| 1.7 | Condicionar credenciales demo en Login.tsx a env de dev | Login.tsx | Bajo |

## Fase 2 — Migración de Backend Legacy (3–5 días)

Migrar los 4 controladores JSON a Prisma, con tenant scoping y auth.

| # | Tarea | Riesgo |
|---|-------|--------|
| 2.1 | Migrar genetics controller de JSON a Prisma | Medio |
| 2.2 | Migrar batches controller de JSON a Prisma | Medio (FKs) |
| 2.3 | Migrar operations controller de JSON a Prisma + PATCH | Medio |
| 2.4 | Migrar monitoring controller de JSON a Prisma | Medio |
| 2.5 | Crear CRUD para modelo Sensor | Bajo |
| 2.6 | Agregar auth middleware a GET routes desprotegidos | Bajo |
| 2.7 | Agregar tenant scoping a controllers migrados | Medio |
| 2.8 | Unificar middleware auth duplicado | Bajo |
| 2.9 | Actualizar seed con genetics, batches, measurements demo | Bajo |

## Fase 3 — Integración Frontend ← API real (3–5 días)

Conectar todas las páginas frontend a los endpoints reales.

| # | Tarea |
|---|-------|
| 3.1 | Conectar Operations (3 páginas) a `api.operations.*` |
| 3.2 | Reemplazar selects hardcodeados con datos de API |
| 3.3 | Conectar Monitoring.tsx a API de sensores real |
| 3.4 | BatchDetail: events reales de operations |
| 3.5 | BatchDetail: conditions reales de measurements |
| 3.6 | Crear + conectar `GET /api/dashboard/stats` |
| 3.7 | Crear + conectar `GET /api/dashboard/activity` |
| 3.8 | Eliminar `src/mocks/ops.ts` |

## Fase 4 — Cleanup y Hardening (2–3 días)

| # | Tarea |
|---|-------|
| 4.1 | Eliminar fallback fake + `Math.random()` en Analytics.tsx |
| 4.2 | Crear `GET /api/analytics/summary` con cálculos reales |
| 4.3 | Eliminar scores fake en GeneticsDetail.tsx |
| 4.4 | Decidir destino de Resources (Growshops/Guides) |
| 4.5 | Eliminar `backend/data/*.json` legacy |
| 4.6 | Eliminar `backend/data/users.json` (muerto) |
| 4.7 | Eliminar JWT `'secret'` fallback en 3 archivos |
| 4.8 | Seed completo con datos demo volumétricos |
| 4.9 | Documentar API endpoints |

---

# 6. Quick Wins Concretos (se pueden hacer hoy)

1. **`src/services/api.ts` línea 4** — cambiar `'http://localhost:3000/api'` por `import.meta.env.VITE_API_URL || 'http://localhost:3000/api'`
2. **`src/contexts/AuthContext.tsx`** — cambiar `role: 'operator'` por `role: response.memberships?.[0]?.role || 'STAFF'`
3. **`src/pages/Labs.tsx`** — reemplazar 3 `fetch('http://localhost:3000/...')` por llamadas a `api.tuya.*`
4. **`src/pages/Sensors.tsx`** — reemplazar 3 `fetch('http://localhost:3000/...')` por llamadas a `api.*`
5. **`src/components/TuyaLinkWizard.tsx`** — reemplazar `fetch('http://localhost:3000/...')` por `api.tuya.*`
6. **`src/contexts/TenantContext.tsx`** — conectar `refreshTenants()` a `api.tenants.getAll()`

---

# 7. Riesgos y Bloqueantes

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| **Migrar controllers a Prisma pierde datos JSON** | Alto si hay datos demo | Migrar datos vía seed antes de cambiar controllers |
| **Batch requiere FK a Genetics y Lab** | Al migrar batches a Prisma, deben existir genetics y labs referenciadas | Migrar genetics y labs primero |
| **Mocks ops.ts tiene estructura diferente a Prisma Operation** | Mock tiene `lab: string`, `room: string`. Prisma tiene `batchId`, `labId`, `userId` (FKs) | Adaptar frontend al shape de Prisma |
| **OperationPlan no tiene modelo Prisma** | `mockPlanTasks` no mapea a ningún modelo existente | Decidir: ¿crear modelo `PlanTask`? ¿Feature flag? |
| **Analytics requiere datos reales** | Sin measurements/operations reales, métricas sin sentido | Priorizar seed demo con datos volumétricos |
| **`data/users.json` es archivo muerto** | No rompe nada pero confunde | Eliminar |
| **Auth middleware duplicado** | `authenticateToken` vs `requireAuth` hacen lo mismo | Unificar |
| **CORS hardcoded a localhost** | Bloqueante para deploy | Agregar `CORS_ORIGINS` env var |

---

# 8. Checklist Final

## Fase 1 — Quick Wins
- [ ] `api.ts`: usar `VITE_API_URL` env var
- [ ] `AuthContext.tsx`: leer role real de memberships
- [ ] `TenantContext.tsx`: conectar a `GET /api/tenants`
- [ ] `Labs.tsx`: reemplazar 3 fetch directos por `api.tuya.*`
- [ ] `Sensors.tsx`: reemplazar 3 fetch directos por `api.*`
- [ ] `TuyaLinkWizard.tsx`: reemplazar fetch directo por `api.*`
- [ ] `api.ts`: agregar auth headers a PulseGrow calls
- [ ] `Labs.tsx`: traducir `LAB_TYPE_OPTIONS` con i18n

## Fase 2 — Backend Migration
- [ ] Migrar genetics controller a Prisma
- [ ] Migrar batches controller a Prisma
- [ ] Migrar operations controller a Prisma + PATCH
- [ ] Migrar monitoring controller a Prisma
- [ ] Crear CRUD endpoints para Sensor
- [ ] Agregar auth a GET routes desprotegidos
- [ ] Agregar tenant scoping a controllers migrados
- [ ] Unificar auth middleware duplicado
- [ ] Actualizar seed con datos demo completos

## Fase 3 — Frontend Integration
- [ ] Conectar QuickOperation a `POST /api/operations`
- [ ] Conectar OperationLogs a `GET /api/operations`
- [ ] Decidir modelo para OperationPlan
- [ ] Conectar selects de QuickOperation a datos de API
- [ ] Conectar Monitoring.tsx a `GET /api/sensors`
- [ ] Conectar BatchDetail events a operations reales
- [ ] Conectar BatchDetail conditions a measurements reales
- [ ] Crear + conectar `GET /api/dashboard/stats`
- [ ] Crear + conectar `GET /api/dashboard/activity`
- [ ] Eliminar `src/mocks/ops.ts`

## Fase 4 — Cleanup
- [ ] Eliminar fallback fake en Analytics.tsx
- [ ] Eliminar `Math.random()` en Analytics.tsx
- [ ] Crear `GET /api/analytics/summary`
- [ ] Eliminar scores fake en GeneticsDetail.tsx
- [ ] Decidir destino de Resources (Growshops/Guides)
- [ ] Eliminar `backend/data/*.json` legacy
- [ ] Eliminar `backend/data/users.json`
- [ ] Eliminar JWT `'secret'` fallback en 3 archivos
- [ ] Seed completo con datos demo volumétricos
- [ ] Documentar API endpoints

# Propuesta de Dockerización — CannaCorp

**Fecha:** 2026-04-12
**Basada en:** estructura real del repositorio, sin inventar rutas ni scripts.

---

## 0. Diagnóstico del repositorio

### Ubicaciones
| Componente | Ubicación | Build context |
|-----------|-----------|--------------|
| Frontend | `./` (root del repo) | `.` |
| Backend | `./backend/` | `./backend` |
| Prisma schema | `./backend/prisma/schema.prisma` | — |
| Migraciones | `./backend/prisma/migrations/` (2 migraciones) | — |
| JSON data (legacy) | `./backend/data/` (batches, genetics, measurements, users.json) | — |

### Scripts reales

**Frontend** ([package.json](package.json)):
| Script | Comando | Nota |
|--------|---------|------|
| `dev` | `vite` | Necesita `--host 0.0.0.0` para Docker |
| `build` | `vite build` | Output en `./dist` |
| `lint` | `eslint .` | — |
| `preview` | `vite preview` | — |

**Backend** ([backend/package.json](backend/package.json)):
| Script | Comando | Nota |
|--------|---------|------|
| `dev` | `ts-node src/index.ts` | Sin watcher. ts-node 10.x NO tiene --watch |
| `build` | `tsc` | Output en `./dist` (tsconfig.outDir) |
| `start` | `node dist/index.js` | — |

**No existen:** scripts de test, seed, migrate, typecheck, format.

### Frameworks reales
| Stack | Framework | Versión |
|-------|-----------|---------|
| Frontend | Vite + React + Tailwind | Vite 7.3.1, React 18.3.1, Tailwind 3.4.1 |
| Backend | Express | 4.18.2 |
| ORM | Prisma | 5.22.0 |
| DB | SQLite | via Prisma `provider = "sqlite"` |
| TypeScript | — | Frontend 5.5.3, Backend 5.0.0 |

### DATABASE_URL hoy
- Definido en Prisma schema como `env("DATABASE_URL")`.
- Documentado en READMEs como `DATABASE_URL="file:./dev.db"`.
- Se resuelve relativo a `backend/prisma/schema.prisma` → crea `backend/prisma/dev.db`.
- No existe `.env.example` — no hay forma documentada de saber qué variables se necesitan.
- No hay `.db` en el repo (está en `.gitignore`).

### Archivos necesarios para build

**Frontend (contexto: root `/`):**
- `package.json`, `package-lock.json`
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`
- `eslint.config.js`
- `index.html`
- `src/` (todo el directorio)

**Backend (contexto: `./backend/`):**
- `package.json`, `package-lock.json`
- `tsconfig.json`
- `prisma/` (schema + migrations)
- `src/` (todo el directorio)
- `data/` (JSON files — **necesario mientras los controllers no migren a Prisma**)

---

## 1. SQLite vs PostgreSQL

### Si seguimos con SQLite

**Funciona**, pero con estas limitaciones:

| Aspecto | Impacto |
|---------|---------|
| Concurrencia escritura | SQLite tiene un lock global de escritura. Con 2+ usuarios simultáneos, las escrituras se serializan |
| Docker volumes | El archivo `.db` vive en un bind mount o named volume. No se puede compartir entre réplicas |
| Backups | Hay que copiar el archivo `.db` con cuidado (SQLite puede corromperse si se copia durante escritura) |
| Scaling | Imposible tener 2+ instancias de API — todas pegarían contra el mismo archivo |
| Migraciones | `prisma migrate deploy` funciona bien. `prisma migrate dev` requiere el directorio con permisos de escritura |
| Dev local | Perfecto. Sin dependencias externas. Un solo contenedor |

**Para desarrollo local, SQLite es la opción más simple y funcional.**

### Si migramos a PostgreSQL

| Cambio necesario | Detalle |
|-----------------|---------|
| Prisma schema | Cambiar `provider = "sqlite"` por `provider = "postgresql"` |
| migration_lock.toml | Dice `provider = "sqlite"` → hay que borrar migraciones y re-crear |
| DATABASE_URL | Cambiar `file:./dev.db` por `postgresql://user:pass@host:5432/dbname` |
| `TuyaDevice.raw` | `String` en SQLite funciona; en PG debería ser `Json` |
| docker-compose | Agregar servicio `db` con `postgres:16-alpine` |
| Migraciones | Hay que re-generar desde cero: `prisma migrate dev --name init` |
| campo `role` | Oportunidad de convertir a `enum` (SQLite no soporta enums) |

**Para producción, PostgreSQL es necesario. Para dev, es opcional.**

---

## 2. Propuesta de desarrollo local — docker-compose.yml

**Archivo creado:** [docker-compose.yml](docker-compose.yml)

Servicios:
1. **`api`** — Node 20 Alpine, monta `./backend`, ejecuta `node --watch -r ts-node/register src/index.ts` (hot reload nativo de Node 20, no requiere nodemon).
2. **`web`** — Node 20 Alpine, monta archivos del frontend selectivamente, ejecuta `vite --host 0.0.0.0`.
3. **Sin servicio de DB** — SQLite vive dentro del bind mount del backend (en `backend/prisma/dev.db`), persiste automáticamente en el host.

Decisiones de diseño:
- **No se usan Dockerfiles para dev.** Se usa `image: node:20-alpine` directamente con `command` — más rápido, sin builds.
- **`npm install` corre al iniciar** el contenedor. Los `node_modules` viven en named volumes (no pisan los del host Windows).
- **Migraciones corren automáticamente** al arrancar el API: `prisma migrate dev` en dev, fallback a `prisma migrate deploy`.
- **Vite corre con `--host 0.0.0.0`** — requerido para que el puerto sea accesible fuera del contenedor.
- **El watcher del backend** usa `node --watch` (Node 20 built-in) porque `ts-node` 10.x no tiene flag `--watch`. No se requiere instalar `nodemon` ni `tsx`.
- **El web depende del api** con `condition: service_healthy` — no arranca hasta que el backend responda en `/health`.

### Flujo de uso
```bash
cp .env.example .env          # primera vez: configurar JWT_SECRET
docker compose up              # levanta todo
# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
# Health:   http://localhost:3000/health
```

---

## 3. Propuesta de producción — docker-compose.prod.yml

**Archivo creado:** [docker-compose.prod.yml](docker-compose.prod.yml)

Servicios:
1. **`db`** — PostgreSQL 16 Alpine con volumen persistente.
2. **`api`** — Build multi-stage desde `Dockerfile.api`. Entrypoint ejecuta `prisma migrate deploy` antes de arrancar.
3. **`web`** — Build multi-stage desde `Dockerfile.web`. Nginx sirve assets estáticos.

**Nota:** Requiere migrar Prisma a PostgreSQL (ver sección 1).

---

## 4. Dockerfile exacto — Frontend

**Archivo creado:** [docker/Dockerfile.web](docker/Dockerfile.web)

Build context: raíz del repo (`.`).

Stages:
1. `deps` — `npm ci` (instala dependencias).
2. `build` — Copia configs + `src/` + `index.html`, ejecuta `npm run build` (= `vite build`). `VITE_API_URL` se pasa como build arg.
3. `production` — Nginx 1.27 Alpine, copia `dist/` y `nginx.conf`.

**Solo se usa para producción.** En dev, el compose usa `node:20-alpine` directamente con Vite.

---

## 5. Dockerfile exacto — Backend

**Archivo creado:** [docker/Dockerfile.api](docker/Dockerfile.api)

Build context: `./backend`.

Stages:
1. `deps` — `npm ci --omit=dev` (dependencias de producción).
2. `build` — `npm ci` (todas), `prisma generate`, `npm run build` (= `tsc`).
3. `production` — Copia: node_modules prod + .prisma client + dist + prisma schema/migrations + data/.

Entrypoint: [docker/entrypoint.sh](docker/entrypoint.sh) — ejecuta `prisma migrate deploy` y luego `node dist/index.js`.

---

## 6. Archivos auxiliares creados

| Archivo | Propósito |
|---------|-----------|
| [docker/nginx.conf](docker/nginx.conf) | Config de Nginx para SPA (fallback a index.html, cache de assets) |
| [docker/entrypoint.sh](docker/entrypoint.sh) | Script que corre migraciones antes de arrancar el server |
| [.dockerignore](.dockerignore) | Exclusiones para build context del frontend (root) |
| [backend/.dockerignore](backend/.dockerignore) | Exclusiones para build context del backend |
| [.env.example](.env.example) | Template de variables de entorno |

---

## 7. Variables de entorno mínimas

### Requeridas para dev (`docker compose up`)
```env
JWT_SECRET=cualquier-string-largo-minimo-32-chars
```
Todo lo demás tiene defaults. La DB SQLite se crea automáticamente.

### Requeridas para prod (`docker compose -f docker-compose.prod.yml up`)
```env
JWT_SECRET=string-aleatorio-muy-largo
DB_PASSWORD=password-seguro-para-postgres
VITE_API_URL=https://api.tudominio.com/api
```

### Opcionales (ambos entornos)
```env
API_PORT=3000                     # default 3000
WEB_PORT=5173                     # default 5173 (dev) / 80 (prod)
TUYA_CLIENT_ID=xxx               # integración Tuya
TUYA_CLIENT_SECRET=xxx
TUYA_REGION=us
TUYA_BASE_URL=
PULSE_GROW_API_URL=https://api.pulsegrow.com
PULSE_GROW_API_KEY=xxx
```

---

## 8. Entrypoint de migraciones y arranque

### Desarrollo (docker-compose.yml)
Inline en el `command` del servicio `api`:
```sh
npm install &&
npx prisma generate &&
npx prisma migrate dev --name auto 2>/dev/null || npx prisma migrate deploy &&
node --watch -r ts-node/register src/index.ts
```
- `prisma migrate dev` crea la DB si no existe y aplica migraciones pendientes.
- Si falla (ej: DB ya existe y no hay migraciones pendientes por crear), fallback a `prisma migrate deploy`.
- `node --watch` reinicia el proceso cuando cambian archivos en `src/`.

### Producción (Dockerfile.api + entrypoint.sh)
```sh
#!/bin/sh
set -e
echo "==> Running Prisma migrations..."
npx prisma migrate deploy
echo "==> Starting server..."
exec node dist/index.js
```
- `prisma migrate deploy` solo aplica migraciones ya existentes. No genera nuevas.
- `exec` reemplaza el shell por el proceso de Node — señales (SIGTERM, etc.) llegan directamente.

---

## 9. Bloqueantes reales para que funcione HOY

### BLOQUEAN docker compose up en dev

| # | Bloqueante | Archivo | Acción requerida |
|---|-----------|---------|-----------------|
| 1 | **`VITE_API_URL` no se usa en el frontend** | [src/services/api.ts](src/services/api.ts#L4) | Cambiar `'http://localhost:3000/api'` por `import.meta.env.VITE_API_URL \|\| 'http://localhost:3000/api'` |
| 2 | **8+ fetch directos a `localhost:3000`** en componentes | Labs.tsx, Sensors.tsx, TuyaLinkWizard.tsx, etc. | Reemplazar por imports de `api.ts` o al menos usar la misma envvar |
| 3 | **CORS no acepta origen del contenedor web** | [backend/src/index.ts](backend/src/index.ts#L39-L46) | Agregar el origen del contenedor web o hacer CORS configurable via envvar |

### BLOQUEAN docker compose -f docker-compose.prod.yml up

| # | Bloqueante | Archivo | Acción requerida |
|---|-----------|---------|-----------------|
| 4 | **Prisma provider es `sqlite`** | [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L9) | Cambiar a `postgresql` + re-crear migraciones |
| 5 | **migration_lock.toml dice `sqlite`** | [backend/prisma/migrations/migration_lock.toml](backend/prisma/migrations/migration_lock.toml#L3) | Se regenera al cambiar provider |
| 6 | **`TuyaDevice.raw` es `String`** | [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L87) | En PG debería ser `Json` para queries directas |

### NO bloquean pero deberían resolverse pronto

| # | Issue | Impacto en Docker |
|---|-------|------------------|
| 7 | Controllers JSON (`batches`, `genetics`, `operations`, `monitoring`) | Funcionan porque `data/` se monta, pero no tienen tenant isolation ni integridad referencial |
| 8 | JWT_SECRET con fallback `'secret'` | El compose FUERZA la variable (`${JWT_SECRET:?}`), pero si alguien corre sin Docker, sigue vulnerable |
| 9 | No hay `.env` en el repo | Creé `.env.example` — el desarrollador tiene que copiarlo |

### Cambios mínimos para que el dev compose funcione

**1 archivo a modificar** — [src/services/api.ts](src/services/api.ts):
```typescript
// Antes:
const API_URL = 'http://localhost:3000/api';

// Después:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

**1 línea a agregar** en [backend/src/index.ts](backend/src/index.ts) — CORS origins:
```typescript
// Agregar al array de origins:
process.env.CORS_ORIGINS?.split(',') || []
```

Con solo esos 2 cambios + el `.env`, `docker compose up` debería funcionar para desarrollo.

---

## Resumen de archivos creados

---

## Quick Start — Desarrollo Local

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env y definir JWT_SECRET (mínimo 32 caracteres)

# 2. Levantar contenedores
docker compose up -d --build

# 3. Ejecutar seed demo (crea usuario admin + tenant)
docker compose exec api sh -lc "npx prisma db seed"

# 4. Iniciar sesión
#    Email:    admin@cannabis.com
#    Password: admin123
```

> El seed es idempotente: se puede ejecutar múltiples veces sin crear duplicados.
> Si el usuario ya existe, actualiza la contraseña a `admin123`.

---

```
cannacorp/
├── .dockerignore                    ← nuevo
├── .env.example                     ← nuevo
├── docker-compose.yml               ← nuevo (dev con SQLite)
├── docker-compose.prod.yml          ← nuevo (prod con PostgreSQL)
├── docker/
│   ├── Dockerfile.web               ← nuevo (frontend, solo prod)
│   ├── Dockerfile.api               ← nuevo (backend, solo prod)
│   ├── entrypoint.sh                ← nuevo (migraciones + arranque)
│   └── nginx.conf                   ← nuevo (SPA routing)
└── backend/
    └── .dockerignore                ← nuevo
```

cannacorp

## Quick Start

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env y definir JWT_SECRET

# 2. Levantar contenedores
docker compose up -d --build

# 3. Ejecutar seed demo (crea usuario admin + tenant)
docker compose exec api sh -lc "npx prisma db seed"

# 4. Iniciar sesión en http://localhost:5173
#    Email:    admin@cannabis.com
#    Password: admin123
```

### Seed sin Docker (local)

```bash
cd backend
npm install
npx prisma migrate dev
npm run seed
```

> El seed es idempotente: se puede ejecutar múltiples veces sin crear duplicados.

### Desarrollo local (sin Docker)

```bash
# 1. Instalar dependencias frontend
npm install

# 2. Instalar dependencias backend
cd backend
npm install

# 3. Iniciar API (puerto 3000)
npm run dev

# 4. En otra terminal, iniciar frontend (puerto 5173)
cd ..
npm run dev
```

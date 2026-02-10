# CannaCorp Backend API

RESTful API para CannaCorp - Sistema de Cultivo de Cannabis

## 🚀 Instalación

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Servidor corre en `http://localhost:3000`

## 📊 Endpoints

### Autenticación

```
POST   /api/auth/register      Registrar usuario
POST   /api/auth/login         Iniciar sesión
```

### Laboratorios

```
GET    /api/labs               Obtener todos
POST   /api/labs               Crear (requiere auth)
GET    /api/labs/:id           Obtener por ID
PATCH  /api/labs/:id           Actualizar (requiere auth)
DELETE /api/labs/:id           Eliminar (requiere auth)
```

### Genética

```
GET    /api/genetics           Obtener todos
POST   /api/genetics           Crear (requiere auth)
GET    /api/genetics/:id       Obtener por ID
PATCH  /api/genetics/:id       Actualizar (requiere auth)
DELETE /api/genetics/:id       Eliminar (requiere auth)
```

### Lotes

```
GET    /api/batches            Obtener todos
POST   /api/batches            Crear (requiere auth)
GET    /api/batches/:id        Obtener por ID
PATCH  /api/batches/:id        Actualizar (requiere auth)
DELETE /api/batches/:id        Eliminar (requiere auth)
```

### Operaciones

```
GET    /api/operations         Obtener todas
POST   /api/operations         Crear (requiere auth)
GET    /api/operations/:id     Obtener por ID
DELETE /api/operations/:id     Eliminar (requiere auth)
```

### Monitoreo

```
GET    /api/monitoring/measurements        Obtener mediciones
POST   /api/monitoring/measurements        Crear medición
GET    /api/monitoring/sensors/:labId      Obtener sensores
GET    /api/monitoring/realtime/:labId     Datos en tiempo real
```

## 🔐 Autenticación

Todos los endpoints que modifiquen datos requieren JWT:

```
Authorization: Bearer {token}
```

## 📝 Variables de Entorno

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
PORT=3000
```

## 🧪 Testing

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cannabis.com","password":"admin123"}'
```

### Crear Laboratorio
```bash
curl -X POST http://localhost:3000/api/labs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Lab A","type":"Veg","area":25,"cycle":"18/6"}'
```

## 📦 Tech Stack

- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite
- JWT Authentication
- bcryptjs for password hashing

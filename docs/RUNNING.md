# 🎉 CannaCorp Backend - INICIADO

## ✅ Estado Actual

El backend está **CORRIENDO** en:
- **URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Frontend**: http://localhost:5173

## 📊 Endpoints Disponibles

### 🔐 Autenticación
```bash
# Registrarse
POST /api/auth/register
Body: { "email": "user@email.com", "password": "pass123", "name": "John Doe" }

# Iniciar Sesión
POST /api/auth/login
Body: { "email": "admin@cannabis.com", "password": "admin123" }
```

### 🏭 Laboratorios
```bash
# Obtener todos
GET /api/labs

# Crear (requiere token)
POST /api/labs
Body: { "name": "Lab A", "type": "Vegetativo", "area": 25, "cycle": "18/6" }
Headers: Authorization: Bearer {token}

# Obtener por ID
GET /api/labs/{id}

# Actualizar (requiere token)
PATCH /api/labs/{id}

# Eliminar (requiere token)
DELETE /api/labs/{id}
```

### 🧬 Genética
```bash
GET /api/genetics
POST /api/genetics (requiere token)
GET /api/genetics/{id}
PATCH /api/genetics/{id} (requiere token)
DELETE /api/genetics/{id} (requiere token)
```

### 📦 Lotes
```bash
GET /api/batches
POST /api/batches (requiere token)
GET /api/batches/{id}
PATCH /api/batches/{id} (requiere token)
DELETE /api/batches/{id} (requiere token)
```

### ⚙️ Operaciones
```bash
GET /api/operations
POST /api/operations (requiere token)
GET /api/operations/{id}
DELETE /api/operations/{id} (requiere token)
```

### 📈 Monitoreo
```bash
GET /api/monitoring/measurements
POST /api/monitoring/measurements (requiere token)
GET /api/monitoring/sensors/{labId}
GET /api/monitoring/realtime/{labId}
```

## 🧪 Pruebas Rápidas

### 1. Probar Health Check
```bash
curl http://localhost:3000/health
```

### 2. Registrarse
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@email.com","password":"password123","name":"Test User"}'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@email.com","password":"password123"}'
```

Respuesta:
```json
{
  "user": {"id": "...", "email": "test@email.com", "name": "Test User"},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Crear Laboratorio
```bash
# Guardar el token de la respuesta anterior en una variable
TOKEN="tu_token_aqui"

curl -X POST http://localhost:3000/api/labs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Veg Room A",
    "type": "Vegetativo",
    "area": 25,
    "cycle": "18/6"
  }'
```

### 5. Obtener Todos los Labs
```bash
curl http://localhost:3000/api/labs
```

## 📁 Estructura de Datos

Los datos se almacenan en archivos JSON en `/backend/data/`:
- `users.json` - Usuarios registrados
- `labs.json` - Laboratorios
- `genetics.json` - Genéticas
- `batches.json` - Lotes
- `operations.json` - Operaciones
- `measurements.json` - Mediciones
- `sensors.json` - Sensores

## 🔑 Variables de Entorno

Archivo: `/backend/.env`
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="development"
PORT=3000
```

## 🚀 Próximos Pasos

1. ✅ Backend corriendo en puerto 3000
2. ✅ Frontend corriendo en puerto 5173
3. 📝 **TODO**: Conectar frontend con API
   - Crear servicio API en `src/services/api.ts`
   - Actualizar `AuthContext` para usar POST /api/auth/login
   - Reemplazar `DataContext` con llamadas a API
   - Guardar JWT en localStorage
   - Agregar Authorization header a todas las solicitudes

## 🛠️ Comandos Útiles

### Backend
```bash
cd /Users/estefanipereira/Desktop/desarrollo/cannacorp-main/backend

# Build
npm run build

# Ejecutar
node dist/index.js

# Dev (con ts-node)
npm run dev
```

### Frontend
```bash
cd /Users/estefanipereira/Desktop/desarrollo/cannacorp-main

# Dev server
npm run dev

# Build
npm run build
```

## ⚠️ Notas Importantes

- El backend usa JSON files en lugar de base de datos SQL (más simple para desarrollo)
- Cada usuario tiene su propio `userId` que se almacena automáticamente
- Los tokens JWT expiran en 7 días
- Las contraseñas se hashean con bcryptjs antes de almacenarse
- CORS está configurado para localhost:5173 y localhost:3000

---

**Backend iniciado exitosamente el 28 de enero de 2026** ✅

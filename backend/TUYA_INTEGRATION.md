# Integración Tuya IoT Cloud (Smart Life)

Integración completa con Tuya OpenAPI para gestionar dispositivos Smart Life desde CannaCorp.

## 📋 Índice

- [Configuración](#configuración)
- [Arquitectura](#arquitectura)
- [API Endpoints](#api-endpoints)
- [Uso](#uso)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🔧 Configuración

### 1. Crear Cloud Project en Tuya

1. Ir a [Tuya IoT Platform](https://iot.tuya.com/)
2. Crear cuenta o iniciar sesión
3. Ir a **Cloud** → **Development** → **Create Cloud Project**
4. Seleccionar **Smart Home** como Industry
5. Configurar el proyecto:
   - Name: CannaCorp Smart Devices
   - Development Method: Custom
   - Data Center: Elegir región (US, EU, CN, IN)
6. Una vez creado, ir a la pestaña **Overview** para obtener:
   - **Access ID / Client ID**
   - **Access Secret / Client Secret**

### 2. Vincular dispositivos

Para que la API pueda ver tus dispositivos Smart Life:

#### Opción A: Usar Smart Life App
1. Descargar Smart Life app
2. Crear cuenta y agregar dispositivos
3. En Tuya Platform:
   - Ir a **Cloud** → **API Group** → Habilitar APIs necesarias:
     - Device Management
     - Device Control
     - Device Status Query
   - Ir a **Cloud** → **Link Tuya App Account**
   - Escanear QR con Smart Life app

#### Opción B: Usar Tuya Developer App
1. Descargar Tuya Smart app (versión desarrollador)
2. Usar mismas credenciales del Cloud Project
3. Agregar dispositivos desde la app

### 3. Configurar Backend

Editar `/backend/.env`:

```env
# Tuya IoT Cloud Configuration
TUYA_CLIENT_ID=tu_access_id_aqui
TUYA_CLIENT_SECRET=tu_access_secret_aqui
TUYA_REGION=us  # us, eu, cn, o in
```

### 4. Instalar dependencias (si es necesario)

```bash
cd backend
npm install axios crypto dotenv
```

## 🏗️ Arquitectura

### Componentes

```
┌─────────────────┐
│   Frontend      │
│  (React App)    │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Backend API    │
│  Express Routes │
│  /api/integrations/tuya/*
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  TuyaClient     │
│  - Auth/Tokens  │
│  - HMAC Sign    │
│  - API Calls    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Tuya OpenAPI   │
│  openapi.tuya*.com
└─────────────────┘
```

### Flujo de Autenticación

1. **Token Request**: Cliente solicita `access_token` con firma HMAC-SHA256
2. **Token Storage**: Token guardado en memoria (expira en ~2 horas)
3. **Auto-refresh**: Token se refresca automáticamente 5 min antes de expirar
4. **Request Signing**: Cada request incluye:
   - `client_id`
   - `sign` (firma HMAC)
   - `t` (timestamp)
   - `access_token`

### Estructura de Firma

```typescript
stringToSign = METHOD + '\n' + 
               contentHash + '\n' + 
               '' + '\n' + 
               url_path

signStr = client_id + access_token + timestamp + stringToSign

sign = HMAC-SHA256(signStr, client_secret).toUpperCase()
```

## 🌐 API Endpoints

### Base URL
```
http://localhost:3000/api/integrations/tuya
```

### Endpoints Disponibles

#### 1. Test de Conectividad
```http
GET /test
```
**Respuesta:**
```json
{
  "success": true,
  "message": "Tuya integration is working correctly",
  "region": "us",
  "devicesFound": 5,
  "timestamp": "2026-01-29T10:00:00.000Z"
}
```

#### 2. Listar Dispositivos
```http
GET /devices
GET /devices?user_id=USER_ID  # Opcional
```
**Respuesta:**
```json
{
  "success": true,
  "count": 5,
  "devices": [
    {
      "id": "bf1234567890abcdef",
      "name": "Living Room Light",
      "category": "dj",
      "productName": "Smart Bulb",
      "online": true,
      "status": [
        { "code": "switch_led", "value": true },
        { "code": "bright_value", "value": 255 }
      ],
      "icon": "https://...",
      "createTime": 1640000000,
      "updateTime": 1706500000,
      "activeTime": 1706500000
    }
  ]
}
```

#### 3. Estado de Dispositivo
```http
GET /devices/:deviceId
```
**Ejemplo:**
```bash
curl http://localhost:3000/api/integrations/tuya/devices/bf1234567890abcdef
```

**Respuesta:**
```json
{
  "success": true,
  "device": {
    "id": "bf1234567890abcdef",
    "name": "Living Room Light",
    "category": "dj",
    "online": true,
    "status": [
      { "code": "switch_led", "value": true },
      { "code": "work_mode", "value": "white" },
      { "code": "bright_value", "value": 255 },
      { "code": "temp_value", "value": 500 }
    ],
    "ip": "192.168.1.100",
    "timeZone": "-05:00"
  }
}
```

#### 4. Especificaciones del Dispositivo
```http
GET /devices/:deviceId/specifications
```

#### 5. Enviar Comandos
```http
POST /devices/:deviceId/commands
Content-Type: application/json

{
  "commands": [
    { "code": "switch_led", "value": true },
    { "code": "bright_value", "value": 128 }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Commands sent successfully",
  "deviceId": "bf1234567890abcdef",
  "commands": [...]
}
```

**Ejemplos de comandos comunes:**

```javascript
// Encender/Apagar
{ "code": "switch", "value": true }
{ "code": "switch_1", "value": false }  // Multi-switch

// Brillo (0-255 o 0-1000 según dispositivo)
{ "code": "bright_value", "value": 200 }

// Temperatura de color (kelvin)
{ "code": "temp_value", "value": 4500 }

// Color RGB
{ "code": "colour_data", "value": {"h": 120, "s": 100, "v": 100} }

// Termostato
{ "code": "temp_set", "value": 22.5 }
{ "code": "mode", "value": "cold" }  // cold, hot, auto
```

#### 6. Logs del Dispositivo
```http
GET /devices/:deviceId/logs
GET /devices/:deviceId/logs?start_time=1706000000&end_time=1706500000
```

#### 7. Sincronizar Dispositivos
```http
POST /sync
```

Fuerza refresh de la lista de dispositivos (útil para actualizar cache).

## 💻 Uso

### Desde JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/integrations/tuya';

// Listar dispositivos
async function listDevices() {
  const response = await axios.get(`${API_URL}/devices`);
  return response.data.devices;
}

// Controlar luz
async function toggleLight(deviceId: string, on: boolean) {
  const response = await axios.post(`${API_URL}/devices/${deviceId}/commands`, {
    commands: [
      { code: 'switch_led', value: on }
    ]
  });
  return response.data.success;
}

// Ajustar brillo
async function setBrightness(deviceId: string, brightness: number) {
  await axios.post(`${API_URL}/devices/${deviceId}/commands`, {
    commands: [
      { code: 'switch_led', value: true },
      { code: 'bright_value', value: brightness }  // 0-255
    ]
  });
}

// Ejemplo de uso
const devices = await listDevices();
const light = devices.find(d => d.category === 'dj');
await toggleLight(light.id, true);
await setBrightness(light.id, 200);
```

### Desde curl

```bash
# Test de conectividad
curl http://localhost:3000/api/integrations/tuya/test

# Listar dispositivos
curl http://localhost:3000/api/integrations/tuya/devices | jq

# Ver estado
curl http://localhost:3000/api/integrations/tuya/devices/YOUR_DEVICE_ID | jq

# Encender luz
curl -X POST http://localhost:3000/api/integrations/tuya/devices/YOUR_DEVICE_ID/commands \
  -H "Content-Type: application/json" \
  -d '{"commands": [{"code": "switch_led", "value": true}]}'
```

## 🧪 Testing

### Test Manual

1. **Verificar configuración:**
```bash
curl http://localhost:3000/api/integrations/tuya/test
```

2. **Listar dispositivos:**
```bash
curl http://localhost:3000/api/integrations/tuya/devices | jq '.devices[] | {id, name, online}'
```

3. **Probar comando seguro** (switch):
```bash
# Obtener device ID del paso anterior
DEVICE_ID="tu_device_id_aqui"

# Encender
curl -X POST http://localhost:3000/api/integrations/tuya/devices/$DEVICE_ID/commands \
  -H "Content-Type: application/json" \
  -d '{"commands": [{"code": "switch", "value": true}]}'

# Apagar
curl -X POST http://localhost:3000/api/integrations/tuya/devices/$DEVICE_ID/commands \
  -H "Content-Type: application/json" \
  -d '{"commands": [{"code": "switch", "value": false}]}'
```

### Categorías de Dispositivos Comunes

| Categoría | Descripción | Comandos Típicos |
|-----------|-------------|------------------|
| `dj` | Smart Light/Bulb | switch_led, bright_value, temp_value |
| `cz` | Smart Plug | switch, switch_1, cur_power |
| `wk` | Thermostat | temp_set, mode |
| `kg` | Switch | switch_1, switch_2, etc. |
| `cl` | Curtain | control, percent_control |
| `tgq` | Sensor | temp, humidity, battery |

## 🔍 Troubleshooting

### Error: "Tuya credentials not configured"

**Solución:** Verificar que `.env` tenga:
```env
TUYA_CLIENT_ID=...
TUYA_CLIENT_SECRET=...
TUYA_REGION=us
```

### Error: "Sign invalid" o "Permission deny"

**Causas comunes:**
1. Clock skew - verificar hora del sistema
2. Región incorrecta - cambiar `TUYA_REGION`
3. API no habilitada en Tuya Platform

**Solución:**
1. Sincronizar hora: `sudo ntpdate -u time.apple.com` (macOS)
2. Verificar región en Tuya Platform → Overview
3. Ir a **Cloud** → **API Group** → habilitar APIs necesarias

### No devices found

**Posibles causas:**
1. No hay cuenta vinculada
2. Dispositivos en otra región
3. API "Device Management" no habilitada

**Solución:**
1. Vincular Smart Life app con Cloud Project
2. Verificar región correcta
3. Habilitar APIs en Tuya Platform

### Token expired errors

El cliente maneja refresh automáticamente, pero si persiste:
```bash
# Reiniciar backend para forzar nuevo token
npm run build && npm start
```

## 📚 Referencias

- [Tuya IoT Platform](https://iot.tuya.com/)
- [API Reference](https://developer.tuya.com/en/docs/iot/api-reference)
- [Device Control Guide](https://developer.tuya.com/en/docs/iot/device-control)
- [API Explorer](https://developer.tuya.com/en/docs/iot/api-debugging)
- [Error Codes](https://developer.tuya.com/en/docs/iot/error-code)

## 🔐 Seguridad

- ✅ Credenciales en `.env`, nunca en código
- ✅ Firma HMAC en cada request
- ✅ Tokens en memoria (no persistidos)
- ✅ HTTPS para comunicación con Tuya
- ⚠️ Rate limiting: ~1000 requests/día en plan gratuito
- ⚠️ Logs sanitizados (sin secretos)

## 🚀 Próximos Pasos

- [ ] Persistencia en DB (tabla `tuya_devices`)
- [ ] Cache de dispositivos con TTL
- [ ] Webhooks para eventos en tiempo real
- [ ] Polling programado (cron/Celery)
- [ ] Support multitenant (múltiples Cloud Projects)
- [ ] UI en frontend para gestión de dispositivos

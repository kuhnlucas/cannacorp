# 🔗 Cómo Vincular Dispositivos Smart Life a Tuya Cloud Project

## Estado Actual

✅ **Backend configurado correctamente**
✅ **Autenticación con Tuya funcionando**
✅ **Endpoints listos para usar**
⏳ **Pendiente: Vincular dispositivos**

## 📱 Paso a Paso para Vincular Dispositivos

### Opción 1: Vincular Cuenta Smart Life (Recomendado)

1. **En la App Smart Life:**
   - Descarga Smart Life app si no la tienes
   - Crea una cuenta y agrega tus dispositivos
   - Asegúrate de que todos funcionen correctamente

2. **En Tuya IoT Platform** (https://iot.tuya.com/):
   - Ve a tu Cloud Project: **p17696950259504urpk9**
   - Click en **Cloud** → **API Group**
   - Habilita los siguientes API Groups:
     - ✅ Authorization Management
     - ✅ Device Management
     - ✅ Device Control
     - ✅ Device Status Notification
     - ✅ Smart Home Basic Service
     - ✅ Smart Home Scene Linkage

3. **Vincular la cuenta:**
   - En tu Cloud Project, ve a **Cloud** → **Link Tuya App Account**
   - Aparecerá un código QR
   - Abre Smart Life app → **Me** (Mi cuenta) → **Settings** → **Account and Security**
   - Busca la opción de vincular con Cloud Project / Developer Mode
   - Escanea el QR

4. **Verificar:**
   ```bash
   curl http://localhost:3000/api/integrations/tuya/devices | jq
   ```
   Deberías ver tus dispositivos listados

### Opción 2: Usar Tuya Smart App (Desarrolladores)

1. Descarga **Tuya Smart** app (versión para desarrolladores)
2. Inicia sesión con las credenciales:
   - Client ID: `aetxa89fhcnrrgrf98tf`
   - O crea una cuenta de desarrollador asociada al proyecto
3. Agrega dispositivos directamente desde esta app

### Opción 3: Assets (Para instalaciones empresariales)

Si estás usando Tuya para un negocio:

1. En Tuya Platform → **Assets**
2. Crea un nuevo Asset (edificio, oficina, etc.)
3. Agrega dispositivos al Asset
4. El endpoint `/v1.0/iot-02/assets` los detectará automáticamente

## 🧪 Testing Después de Vincular

Una vez vinculados los dispositivos, prueba:

```bash
# Listar dispositivos
curl http://localhost:3000/api/integrations/tuya/devices | jq

# Ver estado de un dispositivo específico
curl http://localhost:3000/api/integrations/tuya/devices/DEVICE_ID | jq

# Enviar comando (ejemplo: encender luz)
curl -X POST http://localhost:3000/api/integrations/tuya/devices/DEVICE_ID/commands \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"code": "switch_led", "value": true}
    ]
  }'
```

## 📋 Verificar Configuración Actual

Tu configuración en `.env`:
```
TUYA_CLIENT_ID=aetxa89fhcnrrgrf98tf
TUYA_CLIENT_SECRET=1ff38f1732224732af9cf431ecbf0107
TUYA_REGION=us
TUYA_BASE_URL=https://openapi-ueaz.tuyaus.com
```

Project Code: **p17696950259504urpk9**
Data Center: **US East (Arizona)** - `https://openapi-ueaz.tuyaus.com`

## ❓ Troubleshooting

### "No devices found" después de vincular
1. Verifica que los API Groups estén habilitados
2. Espera 2-5 minutos después de vincular la cuenta
3. Refresca la sesión: `curl http://localhost:3000/api/integrations/tuya/sync`

### "Space permission" error
- Necesitas vincular cuenta Smart Life o crear Assets

### "Sign invalid" error
- Verifica que Access ID y Secret sean correctos
- Asegúrate de que el Data Center coincida con el de tu proyecto

## 📚 Recursos

- Tuya IoT Platform: https://iot.tuya.com/
- Documentación API: https://developer.tuya.com/en/docs/iot/api-reference
- Smart Life App: https://smartlifesolutions.com/download/
- Soporte Backend: Ver `backend/TUYA_INTEGRATION.md`

---

**Siguiente paso:** Vincular tu cuenta Smart Life y probar los endpoints 🚀

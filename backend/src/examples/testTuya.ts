/**
 * Script de ejemplo para probar la integración Tuya
 * 
 * Uso:
 * 1. Configurar TUYA_CLIENT_ID, TUYA_CLIENT_SECRET y TUYA_REGION en .env
 * 2. Ejecutar: ts-node src/examples/testTuya.ts
 */

import { createTuyaClient } from '../services/tuyaClient';

async function main() {
  console.log('🧪 Iniciando test de integración Tuya...\n');

  try {
    // Crear cliente
    console.log('1️⃣ Creando cliente Tuya...');
    const client = createTuyaClient();
    console.log('✅ Cliente creado correctamente\n');

    // Obtener token
    console.log('2️⃣ Obteniendo access token...');
    await client.getAccessToken();
    console.log('✅ Token obtenido exitosamente\n');

    // Listar dispositivos
    console.log('3️⃣ Listando dispositivos...');
    const devices = await client.listDevices();
    console.log(`✅ Encontrados ${devices.length} dispositivos:\n`);

    devices.forEach((device, index) => {
      console.log(`   ${index + 1}. ${device.name}`);
      console.log(`      - ID: ${device.id}`);
      console.log(`      - Categoría: ${device.category}`);
      console.log(`      - Online: ${device.online ? '🟢' : '🔴'}`);
      console.log(`      - Producto: ${device.product_name}`);
      
      if (device.status && device.status.length > 0) {
        console.log(`      - Estado actual:`);
        device.status.slice(0, 3).forEach(s => {
          console.log(`         • ${s.code}: ${JSON.stringify(s.value)}`);
        });
      }
      console.log('');
    });

    // Si hay dispositivos, obtener detalle del primero
    if (devices.length > 0) {
      const firstDevice = devices[0];
      console.log(`4️⃣ Obteniendo detalle de "${firstDevice.name}"...`);
      const detail = await client.getDeviceStatus(firstDevice.id);
      console.log('✅ Detalle obtenido:');
      console.log(JSON.stringify(detail, null, 2));
      console.log('');

      // Intentar obtener especificaciones
      try {
        console.log(`5️⃣ Obteniendo especificaciones de "${firstDevice.name}"...`);
        const specs = await client.getDeviceSpecifications(firstDevice.id);
        console.log('✅ Especificaciones:');
        console.log(JSON.stringify(specs, null, 2));
      } catch (error: any) {
        console.log('⚠️  No se pudieron obtener especificaciones:', error.message);
      }
      console.log('');

      // Ejemplo de comando (comentado por seguridad)
      console.log('6️⃣ Ejemplo de envío de comando:');
      console.log('   (Comentado por seguridad - descomentar para probar)');
      console.log(`
      // Ejemplo: Encender/Apagar un switch
      const result = await client.sendCommands('${firstDevice.id}', [
        { code: 'switch', value: true }  // o false para apagar
      ]);
      console.log('Comando enviado:', result);
      `);
    }

    console.log('\n✅ Test completado exitosamente!');
    console.log('\n📖 Para más información, ver: backend/TUYA_INTEGRATION.md');

  } catch (error: any) {
    console.error('\n❌ Error durante el test:', error.message);
    
    if (error.response?.data) {
      console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }

    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verificar credenciales en .env');
    console.error('   2. Verificar región correcta (TUYA_REGION)');
    console.error('   3. Verificar que cuenta esté vinculada en Tuya Platform');
    console.error('   4. Verificar APIs habilitadas en Cloud Project');
    console.error('\n   Documentación: backend/TUYA_INTEGRATION.md');
    
    process.exit(1);
  }
}

main();

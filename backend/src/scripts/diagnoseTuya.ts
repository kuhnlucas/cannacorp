/**
 * Script de diagnóstico para Tuya
 * Prueba diferentes endpoints para ver cuáles están habilitados
 */

import dotenv from 'dotenv';
import { createTuyaClient } from '../services/tuyaClient';

// Cargar variables de entorno
dotenv.config();

async function diagnose() {
  console.log('🔍 Diagnosticando configuración de Tuya...\n');

  try {
    const client = createTuyaClient();

    // Test 1: Obtener token
    console.log('1️⃣  Probando autenticación...');
    try {
      const tokenInfo = await (client as any).getAccessToken();
      console.log('✅ Token obtenido correctamente');
      console.log(`   Token: ${tokenInfo.substring(0, 20)}...`);
    } catch (error: any) {
      console.log('❌ Error obteniendo token:', error.message);
      return;
    }

    // Test 2: Obtener info del usuario del token
    console.log('\n2️⃣  Probando obtener info del usuario...');
    try {
      const userInfo = await client.getUserInfo();
      if (userInfo) {
        console.log('✅ Info de usuario obtenida:');
        console.log(JSON.stringify(userInfo, null, 2));
      } else {
        console.log('ℹ️  No hay usuario vinculado al Cloud Project');
      }
    } catch (error: any) {
      console.log('⚠️  No se pudo obtener info de usuario:', error.message);
    }

    // Test 3: Intentar listar homes/assets
    console.log('\n3️⃣  Probando listar homes/assets...');
    try {
      const response = await (client as any).client.get('/v2.0/cloud/thing/home');
      console.log('✅ Homes encontrados:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.log('⚠️  No se pudo listar homes:', error.response?.data || error.message);
    }

    // Test 4: Intentar listar assets
    console.log('\n4️⃣  Probando listar assets...');
    try {
      const response = await (client as any).client.get('/v1.0/iot-02/assets');
      console.log('✅ Assets encontrados:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.log('⚠️  No se pudo listar assets:', error.response?.data || error.message);
    }

    // Test 5: Intentar endpoint de industria
    console.log('\n5️⃣  Probando endpoint de industria...');
    try {
      const response = await (client as any).client.get('/v1.0/iot-03/devices');
      console.log('✅ Dispositivos de industria:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.log('⚠️  No se pudo listar por industria:', error.response?.data || error.message);
    }

    // Test 6: Token user info
    console.log('\n6️⃣  Probando info desde token...');
    try {
      const response = await (client as any).client.get('/v1.0/token');
      console.log('✅ Info del token:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.log('⚠️  No se pudo obtener info del token:', error.response?.data || error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DIAGNÓSTICO COMPLETADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📖 Para que funcione, necesitas:');
    console.log('   1. Habilitar "Device Management API" en tu Cloud Project');
    console.log('   2. Vincular tu cuenta Smart Life:');
    console.log('      Cloud → Link Tuya App Account → Escanear QR');
    console.log('   3. O agregar dispositivos directamente al Cloud Project\n');

  } catch (error: any) {
    console.error('❌ Error en diagnóstico:', error.message);
    console.error(error.stack);
  }
}

diagnose();

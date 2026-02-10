const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createLab() {
  try {
    // Obtener el primer tenant
    const tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      console.log('❌ No hay tenants en la base de datos');
      console.log('   Ejecuta primero: node create-org.js');
      process.exit(1);
    }

    console.log(`✅ Usando tenant: ${tenant.name} (${tenant.id})`);

    // Crear laboratorio
    const lab = await prisma.lab.create({
      data: {
        name: 'Lab Vegetativo A',
        type: 'Vegetative',
        area: 25,
        cycle: '18/6',
        tenantId: tenant.id
      }
    });

    console.log(`✅ Laboratorio creado: ${lab.name} (ID: ${lab.id})`);
    console.log('\n📊 Detalles:');
    console.log(`   - Tipo: ${lab.type}`);
    console.log(`   - Área: ${lab.area} m²`);
    console.log(`   - Ciclo: ${lab.cycle}`);
    console.log(`   - Tenant: ${tenant.name}`);
    
  } catch (error) {
    console.error('❌ Error creando laboratorio:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLab();

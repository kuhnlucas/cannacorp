const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createLabForSalakit() {
  try {
    // Buscar tenant salakit
    const tenant = await prisma.tenant.findFirst({
      where: { name: 'salakit' }
    });

    if (!tenant) {
      console.log('❌ Tenant salakit no encontrado');
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
    console.log(`📊 Detalles:`);
    console.log(`   - Tipo: ${lab.type}`);
    console.log(`   - Área: ${lab.area} m²`);
    console.log(`   - Ciclo: ${lab.cycle}`);
    console.log(`   - Tenant: ${tenant.name}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLabForSalakit();

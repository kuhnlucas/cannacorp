const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createUser() {
  try {
    const tenant = await prisma.tenant.findFirst({ where: { name: 'salakit' } });
    if (!tenant) {
      console.log('❌ Tenant salakit no encontrado');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@salakit.com',
        passwordHash: hashedPassword,
        name: 'Admin Salakit',
        tenantId: tenant.id
      }
    });

    console.log(`✅ Usuario creado: ${user.email}`);
    console.log(`   Contraseña: admin123`);
    console.log(`   Tenant: ${tenant.name}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();

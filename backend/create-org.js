const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    let user = await prisma.user.findUnique({
      where: { email: 'admin@cannabis.com' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@cannabis.com',
          passwordHash: hashedPassword,
          name: 'Administrador',
        },
      });
      console.log(`✅ Usuario creado: ${user.email}`);
    } else {
      console.log(`ℹ️  Usuario ya existe: ${user.email}`);
    }

    // Crear organización
    let tenant = await prisma.tenant.findFirst({
      where: { name: 'CannaCorp' }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'CannaCorp',
        },
      });
      console.log(`✅ Organización creada: ${tenant.name}`);
    } else {
      console.log(`ℹ️  Organización ya existe: ${tenant.name}`);
    }

    // Crear membership
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenant.id,
        }
      }
    });

    if (!existingMembership) {
      await prisma.membership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'OWNER',
        },
      });
      console.log(`✅ Membership creado: ${user.email} es OWNER de ${tenant.name}`);
    } else {
      console.log(`ℹ️  Membership ya existe`);
    }

    console.log(`\n🎉 ¡Listo! Usa estas credenciales para iniciar sesión:`);
    console.log(`   Email: admin@cannabis.com`);
    console.log(`   Contraseña: admin123\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();

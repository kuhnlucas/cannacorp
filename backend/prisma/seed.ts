import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'admin@cannabis.com';
const DEMO_PASSWORD = 'admin123';
const DEMO_NAME = 'Admin Demo';
const DEMO_TENANT_NAME = 'CannaCorp Demo';
const DEMO_ROLE = 'OWNER';

async function main() {
  console.log('🌱 Ejecutando seed demo...\n');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Upsert usuario demo
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      name: DEMO_NAME,
    },
  });
  console.log(`✅ Usuario: ${user.email} (id: ${user.id})`);

  // 2. Buscar si ya existe un tenant demo para este usuario (via membership OWNER)
  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id, role: DEMO_ROLE },
    include: { tenant: true },
  });

  let tenant;
  if (existingMembership) {
    tenant = existingMembership.tenant;
    console.log(`✅ Tenant existente: ${tenant.name} (id: ${tenant.id})`);
  } else {
    tenant = await prisma.tenant.create({
      data: { name: DEMO_TENANT_NAME },
    });
    console.log(`✅ Tenant creado: ${tenant.name} (id: ${tenant.id})`);
  }

  // 3. Upsert membership con rol OWNER
  const membership = await prisma.membership.upsert({
    where: {
      userId_tenantId: {
        userId: user.id,
        tenantId: tenant.id,
      },
    },
    update: { role: DEMO_ROLE },
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: DEMO_ROLE,
    },
  });
  console.log(`✅ Membership: rol ${membership.role} (id: ${membership.id})`);

  // 4. Genetics (global catalog, idempotent by name)
  const geneticsData = [
    { name: 'Blue Dream', breeder: 'DJ Short x Santa Cruz', origin: 'California', type: 'Hybrid', thcMin: 17, thcMax: 24, cbdMin: 0.1, cbdMax: 0.2, terpenes: 'Myrcene, Caryophyllene' },
    { name: 'Gorilla Glue #4', breeder: 'GG Strains', origin: 'USA', type: 'Hybrid', thcMin: 25, thcMax: 30, cbdMin: 0.05, cbdMax: 0.1, terpenes: 'Caryophyllene, Limonene' },
    { name: 'White Widow', breeder: 'Green House Seeds', origin: 'Netherlands', type: 'Hybrid', thcMin: 18, thcMax: 25, cbdMin: 0.1, cbdMax: 0.3, terpenes: 'Myrcene, Pinene' },
    { name: 'OG Kush', breeder: 'Unknown', origin: 'California', type: 'Indica', thcMin: 20, thcMax: 26, cbdMin: 0.1, cbdMax: 0.3, terpenes: 'Limonene, Myrcene, Linalool' },
    { name: 'Sour Diesel', breeder: 'Reservoir Seeds', origin: 'USA', type: 'Sativa', thcMin: 20, thcMax: 25, cbdMin: 0.1, cbdMax: 0.2, terpenes: 'Caryophyllene, Limonene, Myrcene' },
  ];

  const geneticsMap: Record<string, any> = {};
  for (const g of geneticsData) {
    const existing = await prisma.genetics.findFirst({ where: { name: g.name } });
    if (existing) {
      geneticsMap[g.name] = existing;
      console.log(`✅ Genética existente: ${g.name}`);
    } else {
      const created = await prisma.genetics.create({ data: g });
      geneticsMap[g.name] = created;
      console.log(`✅ Genética creada: ${g.name}`);
    }
  }

  // 5. Labs (tenant-scoped, idempotent by name+tenant)
  const labsData = [
    { name: 'Sala Vegetativo A', type: 'indoor', area: 25, cycle: '18/6' },
    { name: 'Sala Floración B', type: 'indoor', area: 40, cycle: '12/12' },
    { name: 'Nursery C', type: 'indoor', area: 10, cycle: '24/0' },
  ];

  const labsMap: Record<string, any> = {};
  for (const l of labsData) {
    const existing = await prisma.lab.findFirst({
      where: { name: l.name, tenantId: tenant.id },
    });
    if (existing) {
      labsMap[l.name] = existing;
      console.log(`✅ Lab existente: ${l.name}`);
    } else {
      const created = await prisma.lab.create({
        data: { ...l, tenantId: tenant.id },
      });
      labsMap[l.name] = created;
      console.log(`✅ Lab creado: ${l.name}`);
    }
  }

  // 6. Batches (tenant-scoped, idempotent by code)
  const batchesData = [
    { code: 'BD-001', geneticsName: 'Blue Dream', labName: 'Sala Vegetativo A', state: 'vegetative', plantCount: 24, sowingDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
    { code: 'GG-001', geneticsName: 'Gorilla Glue #4', labName: 'Sala Floración B', state: 'flowering', plantCount: 18, sowingDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
    { code: 'WW-001', geneticsName: 'White Widow', labName: 'Sala Floración B', state: 'flowering', plantCount: 20, sowingDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) },
    { code: 'OK-001', geneticsName: 'OG Kush', labName: 'Nursery C', state: 'vegetative', plantCount: 30, sowingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  ];

  const batchesMap: Record<string, any> = {};
  for (const b of batchesData) {
    const existing = await prisma.batch.findFirst({ where: { code: b.code } });
    if (existing) {
      batchesMap[b.code] = existing;
      console.log(`✅ Batch existente: ${b.code}`);
    } else {
      const created = await prisma.batch.create({
        data: {
          code: b.code,
          tenantId: tenant.id,
          labId: labsMap[b.labName].id,
          geneticsId: geneticsMap[b.geneticsName].id,
          state: b.state,
          plantCount: b.plantCount,
          sowingDate: b.sowingDate,
        },
      });
      batchesMap[b.code] = created;
      console.log(`✅ Batch creado: ${b.code}`);
    }
  }

  // 7. Sensors (tenant+lab scoped)
  const sensorsData = [
    { name: 'Sensor Temperatura VegA', type: 'temperature', labName: 'Sala Vegetativo A', status: 'online' },
    { name: 'Sensor Humedad VegA', type: 'humidity', labName: 'Sala Vegetativo A', status: 'online' },
    { name: 'Sensor Temperatura FlorB', type: 'temperature', labName: 'Sala Floración B', status: 'online' },
    { name: 'Sensor Humedad FlorB', type: 'humidity', labName: 'Sala Floración B', status: 'online' },
    { name: 'Sensor pH FlorB', type: 'ph', labName: 'Sala Floración B', status: 'online' },
    { name: 'Sensor EC FlorB', type: 'ec', labName: 'Sala Floración B', status: 'online' },
  ];

  for (const s of sensorsData) {
    const existing = await prisma.sensor.findFirst({
      where: { name: s.name, tenantId: tenant.id },
    });
    if (!existing) {
      await prisma.sensor.create({
        data: {
          tenantId: tenant.id,
          labId: labsMap[s.labName].id,
          name: s.name,
          type: s.type,
          status: s.status,
        },
      });
      console.log(`✅ Sensor creado: ${s.name}`);
    } else {
      console.log(`✅ Sensor existente: ${s.name}`);
    }
  }

  // 8. Operations (recent demo activity)
  const opsCount = await prisma.operation.count({ where: { tenantId: tenant.id } });
  if (opsCount === 0) {
    const opsData = [
      { type: 'watering', batchCode: 'BD-001', labName: 'Sala Vegetativo A', notes: 'Riego matutino 5L por planta, pH 6.1', data: '{"volume":"5","ph":"6.1","ec":"1.8"}', hoursAgo: 2 },
      { type: 'fertilizer', batchCode: 'BD-001', labName: 'Sala Vegetativo A', notes: 'Aplicada receta Standard Growth', data: '{"recipe":"Standard Growth","targetEC":"1.8"}', hoursAgo: 6 },
      { type: 'watering', batchCode: 'GG-001', labName: 'Sala Floración B', notes: 'Riego con nutrición bloom', data: '{"volume":"4","ph":"6.3","ec":"2.1"}', hoursAgo: 3 },
      { type: 'ipm', batchCode: 'WW-001', labName: 'Sala Floración B', notes: 'Aplicación preventiva de Neem Oil', data: '{"product":"Neem Oil","dosage":"5ml/L"}', hoursAgo: 24 },
      { type: 'transplant', batchCode: 'OK-001', labName: 'Nursery C', notes: 'Trasplante a macetas de 3L', data: '{"potSize":"3L"}', hoursAgo: 48 },
      { type: 'pruning', batchCode: 'GG-001', labName: 'Sala Floración B', notes: 'Defoliación inferior para circulación', data: '{}', hoursAgo: 72 },
    ];

    for (const op of opsData) {
      await prisma.operation.create({
        data: {
          tenantId: tenant.id,
          batchId: batchesMap[op.batchCode].id,
          labId: labsMap[op.labName].id,
          type: op.type,
          data: op.data,
          notes: op.notes,
          userId: user.id,
          createdAt: new Date(Date.now() - op.hoursAgo * 60 * 60 * 1000),
        },
      });
      console.log(`✅ Operación creada: ${op.type} (${op.batchCode})`);
    }
  } else {
    console.log(`✅ Operaciones existentes: ${opsCount}`);
  }

  // 9. Measurements (recent demo readings)
  const measCount = await prisma.measurement.count({
    where: { batch: { tenantId: tenant.id } },
  });
  if (measCount === 0) {
    const measData = [
      { batchCode: 'BD-001', type: 'temperature', value: 24.2, unit: '°C', source: 'manual' },
      { batchCode: 'BD-001', type: 'humidity', value: 62, unit: '%', source: 'manual' },
      { batchCode: 'BD-001', type: 'ph', value: 6.1, unit: '', source: 'manual' },
      { batchCode: 'GG-001', type: 'temperature', value: 25.8, unit: '°C', source: 'manual' },
      { batchCode: 'GG-001', type: 'humidity', value: 55, unit: '%', source: 'manual' },
      { batchCode: 'GG-001', type: 'ph', value: 6.3, unit: '', source: 'manual' },
      { batchCode: 'GG-001', type: 'ec', value: 2.1, unit: 'mS/cm', source: 'manual' },
      { batchCode: 'WW-001', type: 'temperature', value: 26.1, unit: '°C', source: 'manual' },
      { batchCode: 'WW-001', type: 'humidity', value: 58, unit: '%', source: 'manual' },
      { batchCode: 'OK-001', type: 'temperature', value: 23.5, unit: '°C', source: 'manual' },
      { batchCode: 'OK-001', type: 'humidity', value: 70, unit: '%', source: 'manual' },
    ];

    for (const m of measData) {
      await prisma.measurement.create({
        data: {
          batchId: batchesMap[m.batchCode].id,
          type: m.type,
          value: m.value,
          unit: m.unit,
          source: m.source,
        },
      });
      console.log(`✅ Medición creada: ${m.type} ${m.value}${m.unit} (${m.batchCode})`);
    }
  } else {
    console.log(`✅ Mediciones existentes: ${measCount}`);
  }

  console.log('\n========================================');
  console.log('  🔑 Credenciales demo');
  console.log('========================================');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Tenant:   ${tenant.name}`);
  console.log('========================================\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

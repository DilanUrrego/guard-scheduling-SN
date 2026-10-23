import { PrismaClient, NoveltyCategory, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// RNF-02: la contraseña inicial de los usuarios de ejemplo viene del entorno, no del código.
const SEED_PASSWORD = process.env.SEED_PASSWORD;
if (!SEED_PASSWORD) {
  throw new Error('Defina la variable SEED_PASSWORD antes de ejecutar el seed');
}

// ── Helpers ───────────────────────────────────
const date = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const today = new Date();
const year  = today.getFullYear();
const month = today.getMonth() + 1;

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. TIPOS DE NOVEDAD ───────────────────────
  const noveltyTypes = [
    { code: 'IEG',  name: 'Incapacidad General',       category: NoveltyCategory.absence,     affects_payroll: true,  is_termination: false, support_required: true,  color_hex: '#E53E3E' },
    { code: 'INL',  name: 'Incapacidad Sin Soporte',   category: NoveltyCategory.absence,     affects_payroll: true,  is_termination: false, support_required: true,  color_hex: '#FC8181' },
    { code: 'CCS',  name: 'Calamidad Con Soporte',     category: NoveltyCategory.absence,     affects_payroll: false, is_termination: false, support_required: true,  color_hex: '#ED8936' },
    { code: 'CSS',  name: 'Calamidad Sin Soporte',     category: NoveltyCategory.absence,     affects_payroll: true,  is_termination: false, support_required: true,  color_hex: '#F6AD55' },
    { code: 'PNR',  name: 'Permiso No Remunerado',     category: NoveltyCategory.permit,      affects_payroll: true,  is_termination: false, support_required: false, color_hex: '#D69E2E' },
    { code: 'PRE',  name: 'Permiso Remunerado',        category: NoveltyCategory.permit,      affects_payroll: false, is_termination: false, support_required: false, color_hex: '#ECC94B' },
    { code: 'SUS',  name: 'Suspensión',                category: NoveltyCategory.suspension,  affects_payroll: true,  is_termination: false, support_required: false, color_hex: '#9F7AEA' },
    { code: 'VAC',  name: 'Vacaciones',                category: NoveltyCategory.vacation,    affects_payroll: false, is_termination: false, support_required: false, color_hex: '#48BB78' },
    { code: 'LIC',  name: 'Licencia de Paternidad',   category: NoveltyCategory.license,     affects_payroll: false, is_termination: false, support_required: true,  color_hex: '#4299E1' },
    { code: 'LUT',  name: 'Licencia por Luto',         category: NoveltyCategory.license,     affects_payroll: false, is_termination: false, support_required: true,  color_hex: '#667EEA' },
    { code: 'IAT',  name: 'Accidente Laboral',         category: NoveltyCategory.accident,    affects_payroll: true,  is_termination: false, support_required: true,  color_hex: '#F56500' },
    { code: 'RET',  name: 'Retiro Voluntario',         category: NoveltyCategory.termination, affects_payroll: true,  is_termination: true,  support_required: false, color_hex: '#718096' },
    { code: 'RET1', name: 'Período de Prueba',         category: NoveltyCategory.termination, affects_payroll: true,  is_termination: true,  support_required: false, color_hex: '#4A5568' },
    { code: 'RET2', name: 'Exclusión',                 category: NoveltyCategory.termination, affects_payroll: true,  is_termination: true,  support_required: false, color_hex: '#2D3748' },
    { code: 'RET3', name: 'Muerte del Trabajador',     category: NoveltyCategory.termination, affects_payroll: true,  is_termination: true,  support_required: true,  color_hex: '#1A202C' },
  ];

  const noveltyTypeMap: Record<string, string> = {};
  for (const nt of noveltyTypes) {
    const created = await prisma.noveltyType.upsert({
      where: { code: nt.code }, update: nt, create: nt,
    });
    noveltyTypeMap[nt.code] = created.id;
  }
  console.log(`✅ ${noveltyTypes.length} tipos de novedad`);

  // ── 2. USUARIOS ───────────────────────────────
  const usersData = [
    { id_number: '000000001', name: 'Administrador Sistema', email: 'admin@claveseguridad.com',       password: SEED_PASSWORD,  role: 'admin'       },
    { id_number: '000000002', name: 'Carlos Mejía Ríos',     email: 'carlos@claveseguridad.com',      password: SEED_PASSWORD,  role: 'coordinator' },
    { id_number: '000000003', name: 'Diana Vargas López',    email: 'diana@claveseguridad.com',       password: SEED_PASSWORD,  role: 'coordinator' },
    { id_number: '000000004', name: 'Laura Gómez Pérez',     email: 'laura@claveseguridad.com',       password: SEED_PASSWORD,  role: 'viewer'      },
  ];

  const userMap: Record<string, string> = {};
  for (const u of usersData) {
    const hash = await bcrypt.hash(u.password, 12);
    const { password, role, ...rest } = u;
    const created = await prisma.user.upsert({
      where: { email: u.email }, update: {}, create: { ...rest, role: role as UserRole, password_hash: hash },
    });
    userMap[u.id_number] = created.id;
  }
  console.log(`✅ ${usersData.length} usuarios`);

  // ── 3. CLIENTES ───────────────────────────────
  const clientsData = [
    { code: 'CLI001', name: 'Unidad Residencial El Prado',       nit: '900123456-1', phone: '6041234567', address: 'Cra 45 #20-30, Medellín' },
    { code: 'CLI002', name: 'Centro Comercial Ayacucho',         nit: '900234567-2', phone: '6042345678', address: 'Calle 50 #42-00, Medellín' },
    { code: 'CLI003', name: 'Edificio Torre Century',            nit: '900345678-3', phone: '6043456789', address: 'El Poblado, Medellín'       },
    { code: 'CLI004', name: 'Parque Industrial Sopetran',        nit: '900456789-4', phone: '6044567890', address: 'Autopista Norte Km 40'      },
    { code: 'CLI005', name: 'Urbanización Santa Fe Campestre',   nit: '900567890-5', phone: '6045678901', address: 'Rionegro, Antioquia'        },
  ];

  const clientMap: Record<string, string> = {};
  for (const c of clientsData) {
    const created = await prisma.client.upsert({
      where: { code: c.code }, update: {}, create: c,
    });
    clientMap[c.code] = created.id;
  }
  console.log(`✅ ${clientsData.length} clientes`);

  // ── 4. PUESTOS ────────────────────────────────
  const postsData = [
    { client: 'CLI001', code: '0010001', name: 'Portería Principal — El Prado'        },
    { client: 'CLI001', code: '0010002', name: 'Portería Secundaria — El Prado'       },
    { client: 'CLI002', code: '0020001', name: 'Entrada Principal — CC Ayacucho'      },
    { client: 'CLI002', code: '0020002', name: 'Parqueadero — CC Ayacucho'            },
    { client: 'CLI002', code: '0020003', name: 'Ronda Nocturna — CC Ayacucho'         },
    { client: 'CLI003', code: '0030001', name: 'Portería — Torre Century P.H'         },
    { client: 'CLI004', code: '0040001', name: 'Control Entrada — Sopetran'           },
    { client: 'CLI004', code: '0040002', name: 'Vigilancia Bodegas — Sopetran'        },
    { client: 'CLI005', code: '0050001', name: 'Portería Norte — Santa Fe Campestre'  },
    { client: 'CLI005', code: '0050002', name: 'Portería Sur — Santa Fe Campestre'    },
  ];

  const postMap: Record<string, string> = {};
  for (const p of postsData) {
    const created = await prisma.post.upsert({
      where: { code: p.code },
      update: {},
      create: { client_id: clientMap[p.client], code: p.code, name: p.name },
    });
    postMap[p.code] = created.id;
  }
  console.log(`✅ ${postsData.length} puestos`);

  // ── 5. TURNOS CONFIGURADOS ───────────────────
  // Turno día 06-18, turno noche 18-06, turno partido, descanso laborado
  const shiftsData = [
    // Puestos 24/7 (El Prado, CC Ayacucho, Torre Century)
    { post: '0010001', code: '4',   name: 'Turno Día 06 a 18',         start: '06:00', end: '18:00', days: '1111111', is_rest: false, color: '#3B82F6' },
    { post: '0010001', code: '5',   name: 'Turno Noche 18 a 06',       start: '18:00', end: '06:00', days: '1111111', is_rest: false, color: '#1E3A5F' },
    { post: '0010002', code: '4',   name: 'Turno Día 06 a 18',         start: '06:00', end: '18:00', days: '1111111', is_rest: false, color: '#3B82F6' },
    { post: '0010002', code: '5',   name: 'Turno Noche 18 a 06',       start: '18:00', end: '06:00', days: '1111111', is_rest: false, color: '#1E3A5F' },
    { post: '0020001', code: '63',  name: 'Turno Día 06 a 18',         start: '06:00', end: '18:00', days: '1111111', is_rest: false, color: '#3B82F6' },
    { post: '0020001', code: '45',  name: 'Turno Noche 18 a 06',       start: '18:00', end: '06:00', days: '1111111', is_rest: false, color: '#1E3A5F' },
    { post: '0020002', code: '63',  name: 'Turno Día 06 a 18',         start: '06:00', end: '18:00', days: '1111111', is_rest: false, color: '#3B82F6' },
    { post: '0020003', code: '98',  name: 'Ronda Noche 20 a 06',       start: '20:00', end: '06:00', days: '1111111', is_rest: false, color: '#2D3748' },
    { post: '0030001', code: '4',   name: 'Turno Día 06 a 18',         start: '06:00', end: '18:00', days: '1111111', is_rest: false, color: '#3B82F6' },
    { post: '0030001', code: '5',   name: 'Turno Noche 18 a 06',       start: '18:00', end: '06:00', days: '1111111', is_rest: false, color: '#1E3A5F' },
    // Puestos L-S (Sopetran, Santa Fe)
    { post: '0040001', code: '180', name: 'Turno 05 a 17 L-S',         start: '05:00', end: '17:00', days: '1111110', is_rest: false, color: '#059669' },
    { post: '0040001', code: '214', name: 'Descanso Laborado 05 a 17', start: '05:00', end: '17:00', days: '0000001', is_rest: true,  color: '#10B981' },
    { post: '0040002', code: '180', name: 'Turno 05 a 17 L-S',         start: '05:00', end: '17:00', days: '1111110', is_rest: false, color: '#059669' },
    { post: '0050001', code: '4',   name: 'Turno Día 06 a 18',         start: '06:00', end: '18:00', days: '1111111', is_rest: false, color: '#3B82F6' },
    { post: '0050001', code: '5',   name: 'Turno Noche 18 a 06',       start: '18:00', end: '06:00', days: '1111111', is_rest: false, color: '#1E3A5F' },
    { post: '0050002', code: '4',   name: 'Turno Día 06 a 18',         start: '06:00', end: '18:00', days: '1111111', is_rest: false, color: '#3B82F6' },
    { post: '0050002', code: '5',   name: 'Turno Noche 18 a 06',       start: '18:00', end: '06:00', days: '1111111', is_rest: false, color: '#1E3A5F' },
  ];

  // Código de turno es único globalmente — añadimos el código del puesto como prefijo interno
  const shiftMap: Record<string, string> = {};
  for (const s of shiftsData) {
    const uniqueCode = `${s.post}_${s.code}`;
    const crosses    = s.end <= s.start;
    const created = await prisma.shiftConfig.upsert({
      where: { code: uniqueCode },
      update: {},
      create: {
        post_id:        postMap[s.post],
        code:           uniqueCode,
        name:           s.name,
        start_time:     s.start,
        end_time:       s.end,
        crosses_midnight: crosses,
        active_days:    s.days,
        is_worked_rest: s.is_rest,
        color_hex:      s.color,
      },
    });
    shiftMap[uniqueCode] = created.id;
  }
  console.log(`✅ ${shiftsData.length} configuraciones de turno`);

  // ── 6. VIGILANTES ─────────────────────────────
  const guardsData = [
    { id_number: '1035232961', full_name: 'Yepes Arango Hernán Darío',       phone: '3001234561', hire_date: date(2022, 3, 15), is_supervisor: false },
    { id_number: '1085164397', full_name: 'Del Castillo Díaz Daniel Alfonso', phone: '3001234562', hire_date: date(2021, 7, 1),  is_supervisor: true  },
    { id_number: '1102833749', full_name: 'Padilla Romero Víctor León',       phone: '3001234563', hire_date: date(2023, 1, 10), is_supervisor: false },
    { id_number: '1067908972', full_name: 'González Acosta John Elber',       phone: '3001234564', hire_date: date(2020, 5, 20), is_supervisor: false },
    { id_number: '1192745636', full_name: 'Fabra Segura Germán Andrés',       phone: '3001234565', hire_date: date(2022, 9, 5),  is_supervisor: false },
    { id_number: '71215266',   full_name: 'Loaiza Pérez Froilán Esaú',        phone: '3001234566', hire_date: date(2019, 11, 1), is_supervisor: true  },
    { id_number: '1036125874', full_name: 'Sánchez Tamayo Johan Sebastián',   phone: '3001234567', hire_date: date(2023, 4, 12), is_supervisor: false },
    { id_number: '1000395275', full_name: 'Agudelo Jiménez Luis Fernando',    phone: '3001234568', hire_date: date(2021, 2, 28), is_supervisor: false },
    { id_number: '1001341370', full_name: 'Ramírez Londoño Robinson Duván',   phone: '3001234569', hire_date: date(2022, 6, 14), is_supervisor: false },
    { id_number: '1000398144', full_name: 'Guzmán Mira Anderson Arbey',       phone: '3001234570', hire_date: date(2024, 1, 8),  is_supervisor: false },
    { id_number: '1000440420', full_name: 'Correa Velásquez Eduar Alexander', phone: '3001234571', hire_date: date(2023, 8, 22), is_supervisor: false },
    { id_number: '71111715',   full_name: 'Arbeláez Arbeláez Francisco Antonio', phone: '3001234572', hire_date: date(2018, 3, 1), is_supervisor: true },
    { id_number: '1001033083', full_name: 'Caldera Donado Jeison David',      phone: '3001234573', hire_date: date(2024, 3, 1),  is_supervisor: false },
    // Vigilante sin turno asignado este mes (para probar el informe)
    { id_number: '1058745236', full_name: 'Mora Castro Ricardo Andrés',       phone: '3001234574', hire_date: date(2024, 5, 1),  is_supervisor: false },
    { id_number: '1074123698', full_name: 'Ospina Restrepo Camilo Andrés',    phone: '3001234575', hire_date: date(2024, 6, 1),  is_supervisor: false },
  ];

  const guardMap: Record<string, string> = {};
  for (const g of guardsData) {
    const created = await prisma.guard.upsert({
      where: { id_number: g.id_number }, update: {}, create: g,
    });
    guardMap[g.id_number] = created.id;
  }
  console.log(`✅ ${guardsData.length} vigilantes`);

  // ── 7. DESCANSOS ──────────────────────────────
  const restsData = [
    { guard: '1035232961', start: date(year, month, 8),  end: date(year, month, 8)  },
    { guard: '1085164397', start: date(year, month, 15), end: date(year, month, 15) },
    { guard: '1102833749', start: date(year, month, 22), end: date(year, month, 22) },
    { guard: '71215266',   start: date(year, month, 1),  end: date(year, month, 1)  },
  ];

  const adminId = userMap['000000001'];
  for (const r of restsData) {
    await prisma.rest.create({
      data: {
        guard_id:       guardMap[r.guard],
        date_start:     r.start,
        date_end:       r.end,
        approved_by_id: adminId,
      },
    }).catch(() => {}); // ignora duplicados
  }
  console.log(`✅ ${restsData.length} descansos`);

  // ── 8. PROGRAMACIÓN DEL MES ACTUAL ───────────
  // Asigna turnos para los primeros 15 días del mes a varios vigilantes
  const scheduleAssignments = [
    // Portería Principal El Prado — turno día
    { guard: '1035232961', shift: '0010001_4', days: [1,2,3,4,5,6,7,9,10,11,12,13,14,15] },
    // Portería Principal El Prado — turno noche
    { guard: '1085164397', shift: '0010001_5', days: [1,2,3,4,5,6,7,9,10,11,12,13,14,15] },
    // Portería Secundaria El Prado — turno día
    { guard: '1102833749', shift: '0010002_4', days: [1,2,3,4,5,6,7,9,10,11,12,13,14,15] },
    // CC Ayacucho entrada — turno día
    { guard: '1067908972', shift: '0020001_63', days: [1,2,3,4,5,6,7,9,10,11,12,13,14] },
    // CC Ayacucho entrada — turno noche
    { guard: '1192745636', shift: '0020001_45', days: [1,2,3,4,5,6,9,10,11,12,13,14,15] },
    // CC Ayacucho parqueadero
    { guard: '71215266',   shift: '0020002_63', days: [2,3,4,5,6,7,9,10,11,12,13,14,15] },
    // Ronda nocturna CC Ayacucho
    { guard: '1036125874', shift: '0020003_98', days: [1,2,3,4,5,6,7,9,10,11,12,13,14,15] },
    // Torre Century día
    { guard: '1000395275', shift: '0030001_4',  days: [1,2,3,4,5,6,7,9,10,11,12,13,14,15] },
    // Torre Century noche
    { guard: '1001341370', shift: '0030001_5',  days: [1,2,3,4,5,6,7,9,10,11,12,13,14,15] },
    // Sopetran L-S
    { guard: '1000398144', shift: '0040001_180', days: [1,2,3,4,5,6,8,9,10,11,12,13] },
    { guard: '1000440420', shift: '0040002_180', days: [1,2,3,4,5,6,8,9,10,11,12,13] },
    // Santa Fe Campestre
    { guard: '71111715',   shift: '0050001_4',   days: [1,2,3,4,5,6,7,9,10,11,12,13,14,15] },
    { guard: '1001033083', shift: '0050002_5',   days: [1,2,3,4,5,6,7,9,10,11,12,13,14,15] },
  ];

  let scheduleCount = 0;
  const scheduleMap: Record<string, string> = {};

  for (const a of scheduleAssignments) {
    for (const day of a.days) {
      try {
        const scheduleDate = date(year, month, day);
        const created = await prisma.schedule.create({
          data: {
            guard_id:        guardMap[a.guard],
            shift_config_id: shiftMap[a.shift],
            date:            scheduleDate,
            status:          'scheduled',
            created_by_id:   adminId,
          },
        });
        scheduleMap[`${a.guard}_${day}`] = created.id;
        scheduleCount++;
      } catch { /* ignora duplicados */ }
    }
  }
  console.log(`✅ ${scheduleCount} programaciones`);

  // ── 9. NOVEDADES ──────────────────────────────
  const coordId = userMap['000000002'];

  // IEG con soporte pendiente — Yepes día 5
  const schedYepes5 = scheduleMap['1035232961_5'];
  if (schedYepes5) {
    await prisma.novelty.create({
      data: {
        guard_id:          guardMap['1035232961'],
        novelty_type_id:   noveltyTypeMap['IEG'],
        post_id:           postMap['0010001'],
        schedule_id:       schedYepes5,
        date_start:        date(year, month, 5),
        date_end:          date(year, month, 7),
        support_submitted: false,   // ← soporte PENDIENTE
        observations:      'El vigilante reportó enfermedad. Soporte médico pendiente de entrega.',
        registered_by_id:  coordId,
      },
    }).catch(() => {});
    await prisma.schedule.update({ where: { id: schedYepes5 }, data: { status: 'novedad' } });
  }

  // PNR — Del Castillo día 3 (sin soporte requerido)
  const schedDelCastillo3 = scheduleMap['1085164397_3'];
  if (schedDelCastillo3) {
    await prisma.novelty.create({
      data: {
        guard_id:          guardMap['1085164397'],
        novelty_type_id:   noveltyTypeMap['PNR'],
        post_id:           postMap['0010001'],
        schedule_id:       schedDelCastillo3,
        date_start:        date(year, month, 3),
        support_submitted: false,
        observations:      'Permiso personal solicitado con anticipación.',
        registered_by_id:  coordId,
      },
    }).catch(() => {});
    await prisma.schedule.update({ where: { id: schedDelCastillo3 }, data: { status: 'novedad' } });
  }

  // INL — González día 10 (soporte entregado)
  const schedGonzalez10 = scheduleMap['1067908972_10'];
  if (schedGonzalez10) {
    await prisma.novelty.create({
      data: {
        guard_id:          guardMap['1067908972'],
        novelty_type_id:   noveltyTypeMap['INL'],
        post_id:           postMap['0020001'],
        schedule_id:       schedGonzalez10,
        date_start:        date(year, month, 10),
        date_end:          date(year, month, 12),
        support_submitted: true,   // ← soporte ya entregado
        observations:      'Incapacidad médica. Soporte entregado el mismo día.',
        registered_by_id:  coordId,
      },
    }).catch(() => {});
    await prisma.schedule.update({ where: { id: schedGonzalez10 }, data: { status: 'novedad' } });
  }

  // SUS — Correa día 6
  const schedCorrea6 = scheduleMap['1000440420_6'];
  if (schedCorrea6) {
    await prisma.novelty.create({
      data: {
        guard_id:          guardMap['1000440420'],
        novelty_type_id:   noveltyTypeMap['SUS'],
        post_id:           postMap['0040002'],
        schedule_id:       schedCorrea6,
        date_start:        date(year, month, 6),
        support_submitted: false,
        observations:      'Suspensión disciplinaria por 1 día.',
        registered_by_id:  adminId,
      },
    }).catch(() => {});
    await prisma.schedule.update({ where: { id: schedCorrea6 }, data: { status: 'novedad' } });
  }

  console.log('✅ 4 novedades');
  console.log('\n🎉 Seed completo!\n');
  console.log('── Credenciales de acceso ────────────────────');
  console.log('Admin:       admin@claveseguridad.com   / Admin1234!');
  console.log('Coordinador: carlos@claveseguridad.com  / Coord1234!');
  console.log('Coordinador: diana@claveseguridad.com   / Coord1234!');
  console.log('Visualizador: laura@claveseguridad.com  / Viewer123!');
  console.log('─────────────────────────────────────────────');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
import { PrismaClient, NoveltyCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ── Tipos de novedad ──────────────────────────────────────────
  const noveltyTypes = [
    // Ausencias
    {
      code: 'IEG',  name: 'Incapacidad General',
      category: NoveltyCategory.absence,
      affects_payroll: true,  is_termination: false, support_required: true,
      color_hex: '#E53E3E',
    },
    {
      code: 'INL',  name: 'Incapacidad Sin Soporte',
      category: NoveltyCategory.absence,
      affects_payroll: true,  is_termination: false, support_required: true,
      color_hex: '#FC8181',
      // Nota: support_required=true — "Sin Soporte" indica que AÚN no se ha presentado,
      // no que no se requiera. El campo support_submitted en Novelty marcará si ya fue entregado.
    },
    {
      code: 'CCS',  name: 'Calamidad Con Soporte',
      category: NoveltyCategory.absence,
      affects_payroll: false, is_termination: false, support_required: true,
      color_hex: '#ED8936',
    },
    {
      code: 'CSS',  name: 'Calamidad Sin Soporte',
      category: NoveltyCategory.absence,
      affects_payroll: true,  is_termination: false, support_required: true,
      color_hex: '#F6AD55',
    },
    // Permisos
    {
      code: 'PNR',  name: 'Permiso No Remunerado',
      category: NoveltyCategory.permit,
      affects_payroll: true,  is_termination: false, support_required: false,
      color_hex: '#D69E2E',
    },
    {
      code: 'PRE',  name: 'Permiso Remunerado',
      category: NoveltyCategory.permit,
      affects_payroll: false, is_termination: false, support_required: false,
      color_hex: '#ECC94B',
    },
    // Suspensión
    {
      code: 'SUS',  name: 'Suspensión',
      category: NoveltyCategory.suspension,
      affects_payroll: true,  is_termination: false, support_required: false,
      color_hex: '#9F7AEA',
    },
    // Vacaciones
    {
      code: 'VAC',  name: 'Vacaciones',
      category: NoveltyCategory.vacation,
      affects_payroll: false, is_termination: false, support_required: false,
      color_hex: '#48BB78',
    },
    // Licencias
    {
      code: 'LIC',  name: 'Licencia de Paternidad',
      category: NoveltyCategory.license,
      affects_payroll: false, is_termination: false, support_required: true,
      color_hex: '#4299E1',
    },
    {
      code: 'LUT',  name: 'Licencia por Luto',
      category: NoveltyCategory.license,
      affects_payroll: false, is_termination: false, support_required: true,
      color_hex: '#667EEA',
    },
    // Accidente
    {
      code: 'IAT',  name: 'Accidente Laboral',
      category: NoveltyCategory.accident,
      affects_payroll: true,  is_termination: false, support_required: true,
      color_hex: '#F56500',
    },
    // Retiros
    {
      code: 'RET',  name: 'Retiro Voluntario',
      category: NoveltyCategory.termination,
      affects_payroll: true,  is_termination: true,  support_required: false,
      color_hex: '#718096',
    },
    {
      code: 'RET1', name: 'Período de Prueba',
      category: NoveltyCategory.termination,
      affects_payroll: true,  is_termination: true,  support_required: false,
      color_hex: '#4A5568',
    },
    {
      code: 'RET2', name: 'Exclusión',
      category: NoveltyCategory.termination,
      affects_payroll: true,  is_termination: true,  support_required: false,
      color_hex: '#2D3748',
    },
    {
      code: 'RET3', name: 'Muerte del Trabajador',
      category: NoveltyCategory.termination,
      affects_payroll: true,  is_termination: true,  support_required: true,
      color_hex: '#1A202C',
    },
  ];

  for (const nt of noveltyTypes) {
    await prisma.noveltyType.upsert({
      where:  { code: nt.code },
      update: nt,
      create: nt,
    });
  }
  console.log(`✅ ${noveltyTypes.length} novelty types seeded`);

  // ── Usuario admin por defecto ─────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin1234!', 12);
  await prisma.user.upsert({
    where:  { email: 'admin@claveseguridad.com' },
    update: {},
    create: {
      id_number:     '000000000',
      name:          'Administrador',
      email:         'admin@claveseguridad.com',
      password_hash: adminPassword,
      role:          'admin',
    },
  });
  console.log('✅ Default admin user seeded');

  console.log('🎉 Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
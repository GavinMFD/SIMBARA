import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting data migration for Pegawai...');

  // Get all unique nama_pegawai and unit_kerja combinations from TransaksiAtk
  const uniquePegawai = await prisma.transaksiAtk.findMany({
    select: {
      namaPegawai: true,
      unitKerja: true,
    },
    distinct: ['namaPegawai', 'unitKerja'],
  });

  console.log(`Found ${uniquePegawai.length} unique pegawai from TransaksiAtk.`);

  for (const p of uniquePegawai) {
    if (!p.namaPegawai || !p.unitKerja) {
      console.warn('Skipping invalid entry:', p);
      continue;
    }

    // Check if Pegawai already exists
    let pegawai = await prisma.pegawai.findFirst({
      where: {
        nama: p.namaPegawai,
        unitKerja: p.unitKerja,
      },
    });

    // Create if not exists
    if (!pegawai) {
      pegawai = await prisma.pegawai.create({
        data: {
          nama: p.namaPegawai,
          unitKerja: p.unitKerja,
          isActive: true,
        },
      });
      console.log(`Created new Pegawai: ${pegawai.nama} - ${pegawai.unitKerja}`);
    }

    // Update all TransaksiAtk matching this name and unit
    const updateResult = await prisma.transaksiAtk.updateMany({
      where: {
        namaPegawai: p.namaPegawai,
        unitKerja: p.unitKerja,
      },
      data: {
        pegawaiId: pegawai.id,
      },
    });

    console.log(`Updated ${updateResult.count} TransaksiAtk for ${pegawai.nama}`);
  }

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

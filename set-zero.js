const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const prisma = new PrismaClient();
  try {
    const barang = await prisma.masterBarang.findFirst();
    if (barang) {
      await prisma.masterBarang.update({
        where: { id: barang.id },
        data: { stok: 0 }
      });
      console.log('Berhasil mengatur stok menjadi 0 untuk barang:', barang.namaBarang);
    } else {
      console.log('Tidak ada barang di database.');
    }
  } catch (err) {
    console.error("Prisma error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();

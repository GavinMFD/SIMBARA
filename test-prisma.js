const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log("Prisma connected successfully!");
  } catch (err) {
    console.error("Prisma connection error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();

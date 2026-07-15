const { Pool } = require('pg');

async function testPassword(password) {
  const connectionString = `postgresql://postgres.imallpfmwqhtzkwuqwaj:${password}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
  const pool = new Pool({ connectionString });
  try {
    const client = await pool.connect();
    console.log(`Success with password: ${password.substring(0, 5)}...`);
    client.release();
  } catch (err) {
    console.error(`Error with password: ${password.substring(0, 5)}...`, err.message);
  } finally {
    pool.end();
  }
}

async function run() {
  await testPassword('sb_secret_kVjRtOepe16VLX-cC1cD9g_z3tWmkPJ');
  await testPassword('sb_publishable_W6QcM1b81hYbKPpJOagVeA_3VmV-xIk');
  await testPassword('postgres'); // default postgres password
  await testPassword('root');
}

run();

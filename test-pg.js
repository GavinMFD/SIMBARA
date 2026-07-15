const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection(connectionString) {
  const pool = new Pool({ connectionString });
  try {
    const client = await pool.connect();
    console.log("Success with", connectionString.substring(0, 50) + "...");
    client.release();
  } catch (err) {
    console.error("Error with", connectionString.substring(0, 50) + "...", err.message);
  } finally {
    pool.end();
  }
}

async function run() {
  const url1 = process.env.DATABASE_URL;
  const url2 = url1.replace("%2E", ".");
  
  await testConnection(url1);
  await testConnection(url2);
}

run();

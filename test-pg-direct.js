const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const url1 = process.env.DIRECT_URL;
  const pool = new Pool({ connectionString: url1 });
  try {
    const client = await pool.connect();
    console.log("Success with DIRECT_URL");
    client.release();
  } catch (err) {
    console.error("Error with DIRECT_URL", err.message);
  } finally {
    pool.end();
  }
}

run();

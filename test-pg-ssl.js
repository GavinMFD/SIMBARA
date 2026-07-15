const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ 
    connectionString, 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    const client = await pool.connect();
    console.log("Success with SSL");
    client.release();
  } catch (err) {
    console.error("Error with SSL", err.message);
  } finally {
    pool.end();
  }
}

run();

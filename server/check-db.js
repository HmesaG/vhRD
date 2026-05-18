import { Client } from 'pg';
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/vhrd'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT id, email, password_hash, role FROM users');
    console.log('Users in DB:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('DB Error:', e.message);
  } finally {
    await client.end();
  }
}
run();

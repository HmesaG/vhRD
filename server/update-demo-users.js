import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function updateUsers() {
  try {
    await client.connect();
    console.log('Connected to database.');

    await client.query(`UPDATE users SET email = 'demo1' WHERE email = 'admin@empresademo.com'`);
    await client.query(`UPDATE users SET email = 'demo2' WHERE email = 'admin@residencialdemo.com'`);
    
    console.log('Users updated successfully.');
  } catch (err) {
    console.error('Error updating users:', err);
  } finally {
    await client.end();
  }
}

updateUsers();

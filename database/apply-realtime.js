import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new pg.Pool({
    host: '31.97.100.82',
    port: 8432,
    user: 'postgres',
    password: 'zX9!nQ2pL_7tR4vB',
    database: 'visitflow'
});

async function applyRealtime() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '03-realtime.sql'), 'utf8');
        await pool.query(sql);
        console.log('✅ Real-time triggers applied successfully!');
    } catch (err) {
        console.error('❌ Error applying triggers:', err);
    } finally {
        await pool.end();
    }
}

applyRealtime();

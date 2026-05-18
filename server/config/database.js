import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:zX9!nQ2pL_7tR4vB@31.97.100.82:8432/visitflow',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
});

export const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected:', result.rows[0].now);
        client.release();
    } catch (err) {
        console.error('❌ PostgreSQL connection failed:', err.message);
    }
};

export default pool;

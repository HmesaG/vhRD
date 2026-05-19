import pg from 'pg';

const pool = new pg.Pool({
    host: '31.97.100.82',
    port: 8432,
    user: 'postgres',
    password: 'zX9!nQ2pL_7tR4vB',
    database: 'vhrd'
});

async function migrateCheckpoints() {
    try {
        console.log('🔌 Connecting to database...');
        const client = await pool.connect();
        console.log('✅ Connected!');
        
        console.log('🔄 Creating visit_checkpoints table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS visit_checkpoints (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                visit_id    UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
                area_id     UUID REFERENCES areas(id) ON DELETE SET NULL,
                status      VARCHAR(50) NOT NULL,
                notes       TEXT,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_visit_checkpoints_visit ON visit_checkpoints(visit_id);
            CREATE INDEX IF NOT EXISTS idx_visit_checkpoints_created ON visit_checkpoints(created_at ASC);
        `);
        
        console.log('✅ Table visit_checkpoints created/verified successfully!');
        client.release();
    } catch (err) {
        console.error('❌ Error during migration:', err.message);
    } finally {
        await pool.end();
        console.log('🔌 Connection closed.');
    }
}

migrateCheckpoints();

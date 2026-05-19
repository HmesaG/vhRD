import pg from 'pg';

const DB_HOST = process.env.DB_HOST || '31.97.100.82';
const DB_PORT = process.env.DB_PORT || 8432;
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'zX9!nQ2pL_7tR4vB';
const DB_NAME = 'vhrd';

async function migrate() {
    console.log(`🔌 Connecting to database ${DB_NAME} at ${DB_HOST}:${DB_PORT}...`);
    
    const pool = new pg.Pool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });

    try {
        const client = await pool.connect();
        console.log('✅ Connected!');

        console.log('🛠️ Applying missing columns migrations...');

        // 1. Add rnc VARCHAR(50) to visitor_companies if it doesn't exist
        try {
            const checkRnc = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='visitor_companies' AND column_name='rnc'
            `);
            
            if (checkRnc.rows.length === 0) {
                await client.query("ALTER TABLE visitor_companies ADD COLUMN rnc VARCHAR(50)");
                console.log('✅ Column rnc added to visitor_companies.');
            } else {
                console.log('ℹ️  Column rnc already exists in visitor_companies.');
            }
        } catch (err) {
            console.error('❌ Error adding column rnc:', err.message);
        }

        // 2. Add requires_badge BOOLEAN NOT NULL DEFAULT TRUE to visit_reasons if it doesn't exist
        try {
            const checkBadge = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='visit_reasons' AND column_name='requires_badge'
            `);
            
            if (checkBadge.rows.length === 0) {
                await client.query("ALTER TABLE visit_reasons ADD COLUMN requires_badge BOOLEAN NOT NULL DEFAULT TRUE");
                console.log('✅ Column requires_badge added to visit_reasons.');
            } else {
                console.log('ℹ️  Column requires_badge already exists in visit_reasons.');
            }
        } catch (err) {
            console.error('❌ Error adding column requires_badge:', err.message);
        }

        client.release();
        console.log('\n🚀 Migration complete!');
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();

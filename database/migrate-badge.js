
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

        console.log('🛠️ Applying migrations...');

        // 1. Remove requires_badge from visit_reasons if it exists
        try {
            await client.query('ALTER TABLE visit_reasons DROP COLUMN IF EXISTS requires_badge');
            console.log('✅ Column requires_badge removed from visit_reasons (or already absent).');
        } catch (err) {
            console.error('❌ Error dropping column requires_badge:', err.message);
        }

        // 2. Add access_method to visits if it doesn't exist
        try {
            // Check if column exists first to avoid error
            const checkCol = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='visits' AND column_name='access_method'
            `);
            
            if (checkCol.rows.length === 0) {
                await client.query("ALTER TABLE visits ADD COLUMN access_method VARCHAR(20) NOT NULL DEFAULT 'badge' CHECK (access_method IN ('badge', 'ticket'))");
                console.log('✅ Column access_method added to visits.');
            } else {
                console.log('ℹ️  Column access_method already exists in visits.');
            }
        } catch (err) {
            console.error('❌ Error adding column access_method:', err.message);
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

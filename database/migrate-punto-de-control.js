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

        // Add has_punto_de_control to organizations if it doesn't exist
        try {
            // Check if column exists first to avoid error
            const checkCol = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='organizations' AND column_name='has_punto_de_control'
            `);
            
            if (checkCol.rows.length === 0) {
                await client.query("ALTER TABLE organizations ADD COLUMN has_punto_de_control BOOLEAN NOT NULL DEFAULT TRUE");
                console.log('✅ Column has_punto_de_control added to organizations.');
            } else {
                console.log('ℹ️  Column has_punto_de_control already exists in organizations.');
            }
        } catch (err) {
            console.error('❌ Error adding column has_punto_de_control:', err.message);
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

/**
 * Database Setup Script
 * Creates the 'vhrd' database and runs schema + seed SQL
 * Run: node database/setup.js
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_HOST = process.env.DB_HOST || '31.97.100.82';
const DB_PORT = process.env.DB_PORT || 8432;
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'zX9!nQ2pL_7tR4vB';
const DB_NAME = 'vhrd';

async function setup() {
    // Step 1: Connect to default 'postgres' database and create 'vhrd' db
    console.log(`🔌 Connecting to PostgreSQL at ${DB_HOST}:${DB_PORT}...`);
    
    const adminPool = new pg.Pool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: 'postgres',
        max: 2
    });

    try {
        const client = await adminPool.connect();
        console.log('✅ Connected to PostgreSQL!');
        
        // Check if database exists
        const dbCheck = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1", [DB_NAME]
        );
        
        if (dbCheck.rows.length === 0) {
            console.log(`📦 Creating database '${DB_NAME}'...`);
            await client.query(`CREATE DATABASE ${DB_NAME}`);
            console.log('✅ Database created!');
        } else {
            console.log(`ℹ️  Database '${DB_NAME}' already exists.`);
        }
        
        client.release();
        await adminPool.end();
    } catch (err) {
        console.error('❌ Error connecting to PostgreSQL:', err.message);
        console.error('\n🔧 Make sure your PostgreSQL server is running at', `${DB_HOST}:${DB_PORT}`);
        console.error('   with user:', DB_USER);
        process.exit(1);
    }

    // Step 2: Connect to 'vhrd' database and run schema
    console.log(`\n📋 Running schema on '${DB_NAME}'...`);
    
    const appPool = new pg.Pool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        max: 2
    });

    try {
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await appPool.query(schemaSQL);
        console.log('✅ Schema applied!');
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️  Schema objects already exist (skipping).');
        } else {
            console.error('❌ Schema error:', err.message);
        }
    }

    // Step 3: Run seed data
    console.log('\n🌱 Running seed data...');
    try {
        const seedSQL = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
        await appPool.query(seedSQL);
        console.log('✅ Seed data applied!');
    } catch (err) {
        if (err.message.includes('duplicate') || err.message.includes('already exists')) {
            console.log('ℹ️  Seed data already exists (skipping).');
        } else {
            console.error('⚠️  Seed warning:', err.message);
        }
    }

    // Step 4: Verify
    console.log('\n🔍 Verifying setup...');
    try {
        const tables = await appPool.query(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        );
        console.log('📊 Tables created:');
        tables.rows.forEach(r => console.log(`   • ${r.tablename}`));

        const userCount = await appPool.query('SELECT COUNT(*) as count FROM users');
        console.log(`\n👤 Users: ${userCount.rows[0].count}`);

        const orgCount = await appPool.query('SELECT COUNT(*) as count FROM organizations');
        console.log(`🏢 Organizations: ${orgCount.rows[0].count}`);
    } catch (err) {
        console.error('Verification error:', err.message);
    }

    await appPool.end();

    console.log('\n🚀 Setup complete!');
    console.log('═══════════════════════════════════════');
    console.log('  Next steps:');
    console.log('  1. cd server && npm run dev');
    console.log('  2. cd VisitFlow-React && npm run dev');
    console.log('  3. Login: hmesag@gmail.com / Admin2026!');
    console.log('═══════════════════════════════════════');
}

setup();

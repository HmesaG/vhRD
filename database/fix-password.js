import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
    host: '31.97.100.82',
    port: 8432,
    user: 'postgres',
    password: 'zX9!nQ2pL_7tR4vB',
    database: 'visitflow'
});

const hash = await bcrypt.hash('admin123', 10);
const result = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email',
    [hash, 'hmesag@gmail.com']
);
console.log('✅ Password updated for:', result.rows[0].email);
console.log('   Login: hmesag@gmail.com / admin123');
await pool.end();

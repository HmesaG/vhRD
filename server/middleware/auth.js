import { verifyToken } from '../utils/jwt.js';
import pool from '../config/database.js';

/**
 * JWT Authentication Middleware
 * Verifies the Authorization: Bearer <token> header
 * and attaches user info to req.user
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token de autenticación requerido' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        // Fetch fresh user data from DB
        const result = await pool.query(
            'SELECT id, email, role, company_id, assigned_areas FROM users WHERE id = $1',
            [decoded.uid]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        req.user = result.rows[0];
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Error de autenticación' });
    }
};

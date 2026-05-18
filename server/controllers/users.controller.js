import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

export const getAll = async (req, res) => {
    try {
        let query, params;
        if (req.user.role === 'superadmin') {
            query = 'SELECT id, email, role, company_id, assigned_areas, created_at, updated_at FROM users ORDER BY email';
            params = [];
        } else {
            query = 'SELECT id, email, role, company_id, assigned_areas, created_at, updated_at FROM users WHERE company_id = $1 ORDER BY email';
            params = [req.user.company_id];
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Users getAll error:', err);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

export const getById = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, role, company_id, assigned_areas, created_at, updated_at FROM users WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Users getById error:', err);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
};

export const create = async (req, res) => {
    try {
        const { email, password, role, companyId, assignedAreas } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Check if email already exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        const finalCompanyId = req.user.role === 'superadmin' ? companyId : req.user.company_id;
        const hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email, password_hash, role, company_id, assigned_areas) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, company_id, assigned_areas, created_at',
            [email.toLowerCase().trim(), hash, role || 'recepcion', finalCompanyId, JSON.stringify(assignedAreas || [])]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Users create error:', err);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};

export const update = async (req, res) => {
    try {
        const { email, role, companyId, assignedAreas, password } = req.body;
        const { id } = req.params;

        const finalCompanyId = req.user.role === 'superadmin' ? companyId : req.user.company_id;

        // Build update
        let query, params;
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            query = 'UPDATE users SET email = COALESCE($1, email), role = COALESCE($2, role), company_id = COALESCE($3, company_id), assigned_areas = $4, password_hash = $5 WHERE id = $6 RETURNING id, email, role, company_id, assigned_areas, updated_at';
            params = [email, role, finalCompanyId, JSON.stringify(assignedAreas || []), hash, id];
        } else {
            query = 'UPDATE users SET email = COALESCE($1, email), role = COALESCE($2, role), company_id = COALESCE($3, company_id), assigned_areas = $4 WHERE id = $5 RETURNING id, email, role, company_id, assigned_areas, updated_at';
            params = [email, role, finalCompanyId, JSON.stringify(assignedAreas || []), id];
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Users update error:', err);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};

export const remove = async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado', id: result.rows[0].id });
    } catch (err) {
        console.error('Users remove error:', err);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

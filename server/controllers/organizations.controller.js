import pool from '../config/database.js';

export const getAll = async (req, res) => {
    try {
        let query, params;
        if (req.user.role === 'superadmin') {
            query = 'SELECT * FROM organizations ORDER BY name';
            params = [];
        } else {
            query = 'SELECT * FROM organizations WHERE id = $1';
            params = [req.user.company_id];
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Organizations getAll error:', err);
        res.status(500).json({ error: 'Error al obtener organizaciones' });
    }
};

export const getById = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM organizations WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Organización no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Organizations getById error:', err);
        res.status(500).json({ error: 'Error al obtener organización' });
    }
};

export const create = async (req, res) => {
    try {
        const { name, nit, address, phone, email, logo_url } = req.body;
        const result = await pool.query(
            'INSERT INTO organizations (name, nit, address, phone, email, logo_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, nit || null, address || null, phone || null, email || null, logo_url || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Organizations create error:', err);
        res.status(500).json({ error: 'Error al crear organización' });
    }
};

export const update = async (req, res) => {
    try {
        const { name, nit, address, phone, email, logo_url } = req.body;
        const result = await pool.query(
            'UPDATE organizations SET name = COALESCE($1, name), nit = COALESCE($2, nit), address = COALESCE($3, address), phone = COALESCE($4, phone), email = COALESCE($5, email), logo_url = COALESCE($6, logo_url) WHERE id = $7 RETURNING *',
            [name, nit, address, phone, email, logo_url, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Organización no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Organizations update error:', err);
        res.status(500).json({ error: 'Error al actualizar organización' });
    }
};

export const remove = async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM organizations WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Organización no encontrada' });
        res.json({ message: 'Organización eliminada', id: result.rows[0].id });
    } catch (err) {
        console.error('Organizations remove error:', err);
        res.status(500).json({ error: 'Error al eliminar organización' });
    }
};

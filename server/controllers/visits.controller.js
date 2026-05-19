import pool from '../config/database.js';

// Helper to map DB snake_case fields to camelCase/expected frontend fields
const mapVisitRow = (row) => {
    if (!row) return null;
    return {
        ...row,
        company: row.company_name,
        areaId: row.area_id,
        accessMethod: row.access_method
    };
};

export const getAll = async (req, res) => {
    try {
        const { companyId, days } = req.query;
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        // Tenant isolation
        const tenantId = companyId || (req.user.role !== 'superadmin' ? req.user.company_id : null);
        if (tenantId) {
            conditions.push(`company_id = $${paramIndex++}`);
            params.push(tenantId);
        }

        // Date filter: when days is provided, fetch the last 2x period to allow
        // the frontend to calculate period-over-period trend comparisons.
        if (days && !isNaN(parseInt(days))) {
            const lookback = parseInt(days) * 2;
            conditions.push(`check_in >= NOW() - INTERVAL '${lookback} days'`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const query = `SELECT * FROM visits ${where} ORDER BY check_in DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows.map(mapVisitRow));
    } catch (err) {
        console.error('Visits getAll error:', err);
        res.status(500).json({ error: 'Error al obtener visitas' });
    }
};

export const getById = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM visits WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Visita no encontrada' });
        }
        res.json(mapVisitRow(result.rows[0]));
    } catch (err) {
        console.error('Visits getById error:', err);
        res.status(500).json({ error: 'Error al obtener visita' });
    }
};

export const create = async (req, res) => {
    try {
        const {
            full_name, document_id, company, reason, employee,
            badge_number, areaId, photo_url, visitor_phone, visitor_email,
            accessMethod, document_id_empresa
        } = req.body;

        const companyId = req.user.role === 'superadmin'
            ? (req.body.companyId || req.user.company_id)
            : req.user.company_id;

        const result = await pool.query(
            `INSERT INTO visits (
                company_id, full_name, document_id, company_name, document_id_empresa, 
                reason, employee, badge_number, area_id, photo_url, 
                check_in, status, visitor_phone, visitor_email, access_method
            ) VALUES (
                $1, $2, $3, $4, $5, 
                $6, $7, $8, $9, $10, 
                NOW(), 'Ingresado', $11, $12, $13
            ) RETURNING *`,
            [
                companyId, full_name, document_id, company, document_id_empresa || null, 
                reason, employee, badge_number || null, areaId || null, photo_url || null, 
                visitor_phone || '', visitor_email || '', accessMethod || 'badge'
            ]
        );

        res.status(201).json(mapVisitRow(result.rows[0]));
    } catch (err) {
        console.error('Visits create error:', err);
        res.status(500).json({ error: 'Error al crear visita' });
    }
};

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Build dynamic update query
        const fields = [];
        const values = [];
        let paramIndex = 1;

        const allowedFields = [
            'full_name', 'document_id', 'company_name', 'document_id_empresa',
            'reason', 'employee', 'badge_number', 'area_id', 'photo_url', 
            'check_out', 'status', 'visitor_phone', 'visitor_email', 'access_method'
        ];

        for (const [key, value] of Object.entries(updates)) {
            // Map frontend field names to DB column names
            const dbField = key === 'company' ? 'company_name' : key === 'areaId' ? 'area_id' : key === 'accessMethod' ? 'access_method' : key;
            if (allowedFields.includes(dbField)) {
                fields.push(`${dbField} = $${paramIndex}`);
                // Handle check_out special case — set to NOW()
                if (dbField === 'check_out' && value === true) {
                    fields[fields.length - 1] = `check_out = NOW()`;
                } else {
                    values.push(value);
                    paramIndex++;
                }
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE visits SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Visita no encontrada' });
        }

        res.json(mapVisitRow(result.rows[0]));
    } catch (err) {
        console.error('Visits update error:', err);
        res.status(500).json({ error: 'Error al actualizar visita' });
    }
};

export const remove = async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM visits WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Visita no encontrada' });
        }
        res.json({ message: 'Visita eliminada', id: result.rows[0].id });
    } catch (err) {
        console.error('Visits remove error:', err);
        res.status(500).json({ error: 'Error al eliminar visita' });
    }
};

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
        const query = `
            SELECT v.*, 
                   COALESCE(
                       NULLIF(v.visitor_phone, ''), 
                       (SELECT whatsapp FROM employees e WHERE e.company_id = v.company_id AND e.name = v.employee LIMIT 1), 
                       ''
                   ) AS visitor_phone,
                   COALESCE(
                       NULLIF(v.visitor_email, ''), 
                       (SELECT email FROM employees e WHERE e.company_id = v.company_id AND e.name = v.employee LIMIT 1), 
                       ''
                   ) AS visitor_email
            FROM visits v
            ${where}
            ORDER BY v.check_in DESC
        `;

        const result = await pool.query(query, params);
        res.json(result.rows.map(mapVisitRow));
    } catch (err) {
        console.error('Visits getAll error:', err);
        res.status(500).json({ error: 'Error al obtener visitas' });
    }
};

export const getById = async (req, res) => {
    try {
        const query = `
            SELECT v.*, 
                   COALESCE(
                       NULLIF(v.visitor_phone, ''), 
                       (SELECT whatsapp FROM employees e WHERE e.company_id = v.company_id AND e.name = v.employee LIMIT 1), 
                       ''
                   ) AS visitor_phone,
                   COALESCE(
                       NULLIF(v.visitor_email, ''), 
                       (SELECT email FROM employees e WHERE e.company_id = v.company_id AND e.name = v.employee LIMIT 1), 
                       ''
                   ) AS visitor_email
            FROM visits v
            WHERE v.id = $1
        `;
        const result = await pool.query(query, [req.params.id]);
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

        // Auto-lookup contact details from employees if they are missing
        let finalPhone = visitor_phone;
        let finalEmail = visitor_email;
        if ((!finalPhone || !finalEmail) && employee) {
            try {
                const empRes = await pool.query(
                    'SELECT whatsapp, email FROM employees WHERE company_id = $1 AND name = $2 LIMIT 1',
                    [companyId, employee]
                );
                if (empRes.rows.length > 0) {
                    if (!finalPhone) finalPhone = empRes.rows[0].whatsapp || '';
                    if (!finalEmail) finalEmail = empRes.rows[0].email || '';
                }
            } catch (empLookupErr) {
                console.error('Error looking up employee details during visit creation:', empLookupErr);
            }
        }

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
                finalPhone || '', finalEmail || '', accessMethod || 'badge'
            ]
        );

        const newVisit = result.rows[0];

        // Automatically create the initial checkpoint
        try {
            await pool.query(
                `INSERT INTO visit_checkpoints (visit_id, area_id, status, notes)
                 VALUES ($1, $2, $3, $4)`,
                [newVisit.id, newVisit.area_id || null, 'Ingresado', 'Registro inicial de visita.']
            );
        } catch (cpErr) {
            console.error('Error adding initial checkpoint:', cpErr);
        }

        res.status(201).json(mapVisitRow(newVisit));
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

        const updatedVisit = result.rows[0];

        // Automatically create checkpoint on exit
        if (updates.check_out === true || updates.status === 'Salida') {
            try {
                await pool.query(
                    `INSERT INTO visit_checkpoints (visit_id, area_id, status, notes)
                     VALUES ($1, $2, $3, $4)`,
                    [id, updatedVisit.area_id || null, 'Salida', 'Salida de las instalaciones.']
                );
            } catch (cpErr) {
                console.error('Error adding exit checkpoint:', cpErr);
            }
        }

        res.json(mapVisitRow(updatedVisit));
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

// ============================================================
// CHECKPOINTS METHODS (Ruta Multi-punto)
// ============================================================

export const getCheckpoints = async (req, res) => {
    try {
        const { id } = req.params; // visit_id
        const result = await pool.query(
            `SELECT c.*, a.name as area_name, a.level as area_level 
             FROM visit_checkpoints c
             LEFT JOIN areas a ON c.area_id = a.id
             WHERE c.visit_id = $1
             ORDER BY c.created_at ASC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('getCheckpoints error:', err);
        res.status(500).json({ error: 'Error al obtener checkpoints' });
    }
};

export const addCheckpoint = async (req, res) => {
    try {
        const { id } = req.params; // visit_id
        const { areaId, status, notes } = req.body;

        const result = await pool.query(
            `INSERT INTO visit_checkpoints (visit_id, area_id, status, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [id, areaId || null, status || 'En Tránsito', notes || '']
        );

        const checkpoint = result.rows[0];
        if (checkpoint.area_id) {
            const areaRes = await pool.query('SELECT name, level FROM areas WHERE id = $1', [checkpoint.area_id]);
            if (areaRes.rows.length > 0) {
                checkpoint.area_name = areaRes.rows[0].name;
                checkpoint.area_level = areaRes.rows[0].level;
            }
        }

        res.status(201).json(checkpoint);
    } catch (err) {
        console.error('addCheckpoint error:', err);
        res.status(500).json({ error: 'Error al agregar checkpoint' });
    }
};

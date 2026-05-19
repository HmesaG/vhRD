import pool from '../config/database.js';

// Convert snake_case DB columns → camelCase for consistent frontend API contract
const snakeToCamel = (str) => str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
const normalizeRow = (row) => {
    const out = {};
    for (const [key, val] of Object.entries(row)) out[snakeToCamel(key)] = val;
    return out;
};

/**
 * Generic CRUD controller factory for simple tenant-scoped entities.
 * Works for: visitor_companies, visit_reasons, badges, employees, areas
 */
export const createCrudController = (tableName, options = {}) => {
    const {
        orderBy = 'created_at DESC',
        returnFields = '*',
        insertFields = [],    // Array of { name, dbColumn (optional), required (optional) }
        updateFields = []     // Array of { name, dbColumn (optional) }
    } = options;

    return {
        getAll: async (req, res) => {
            try {
                const { companyId } = req.query;
                const filterCompanyId = req.user.role === 'superadmin'
                    ? (companyId || null)
                    : req.user.company_id;

                let query, params;
                if (filterCompanyId) {
                    query = `SELECT ${returnFields} FROM ${tableName} WHERE company_id = $1 ORDER BY ${orderBy}`;
                    params = [filterCompanyId];
                } else {
                    query = `SELECT ${returnFields} FROM ${tableName} ORDER BY ${orderBy}`;
                    params = [];
                }

                const result = await pool.query(query, params);
                res.json(result.rows.map(normalizeRow));
            } catch (err) {
                console.error(`${tableName} getAll error:`, err);
                res.status(500).json({ error: `Error al obtener registros` });
            }
        },

        getById: async (req, res) => {
            try {
                const result = await pool.query(`SELECT ${returnFields} FROM ${tableName} WHERE id = $1`, [req.params.id]);
                if (result.rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
                res.json(normalizeRow(result.rows[0]));
            } catch (err) {
                console.error(`${tableName} getById error:`, err);
                res.status(500).json({ error: 'Error al obtener registro' });
            }
        },

        create: async (req, res) => {
            try {
                const companyId = req.user.role === 'superadmin'
                    ? (req.body.companyId || req.user.company_id)
                    : req.user.company_id;

                const columns = ['company_id'];
                const placeholders = ['$1'];
                const values = [companyId];
                let idx = 2;

                for (const field of insertFields) {
                    const bodyValue = req.body[field.name];
                    if (field.required && (bodyValue === undefined || bodyValue === null || bodyValue === '')) {
                        return res.status(400).json({ error: `Campo ${field.name} es requerido` });
                    }
                    columns.push(field.dbColumn || field.name);
                    placeholders.push(`$${idx}`);
                    values.push(bodyValue ?? null);
                    idx++;
                }

                const result = await pool.query(
                    `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
                    values
                );

                res.status(201).json(normalizeRow(result.rows[0]));
            } catch (err) {
                console.error(`${tableName} create error:`, err);
                res.status(500).json({ error: 'Error al crear registro' });
            }
        },

        update: async (req, res) => {
            try {
                const setClauses = [];
                const values = [];
                let idx = 1;

                for (const field of updateFields) {
                    const bodyValue = req.body[field.name];
                    if (bodyValue !== undefined) {
                        setClauses.push(`${field.dbColumn || field.name} = $${idx}`);
                        values.push(bodyValue);
                        idx++;
                    }
                }

                if (setClauses.length === 0) {
                    return res.status(400).json({ error: 'No hay campos para actualizar' });
                }

                values.push(req.params.id);
                const result = await pool.query(
                    `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
                    values
                );

                if (result.rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
                res.json(normalizeRow(result.rows[0]));
            } catch (err) {
                console.error(`${tableName} update error:`, err);
                res.status(500).json({ error: 'Error al actualizar registro' });
            }
        },

        remove: async (req, res) => {
            try {
                const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [req.params.id]);
                if (result.rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
                res.json({ message: 'Registro eliminado', id: result.rows[0].id });
            } catch (err) {
                console.error(`${tableName} remove error:`, err);
                res.status(500).json({ error: 'Error al eliminar registro' });
            }
        },

        // Batch delete
        batchDelete: async (req, res) => {
            try {
                const { ids } = req.body;
                if (!ids || !Array.isArray(ids) || ids.length === 0) {
                    return res.status(400).json({ error: 'Se requiere un array de IDs' });
                }

                const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
                const result = await pool.query(
                    `DELETE FROM ${tableName} WHERE id IN (${placeholders}) RETURNING id`,
                    ids
                );

                res.json({ message: `${result.rowCount} registros eliminados`, ids: result.rows.map(r => r.id) });
            } catch (err) {
                console.error(`${tableName} batchDelete error:`, err);
                res.status(500).json({ error: 'Error al eliminar registros' });
            }
        }
    };
};

// ============================================================
// Concrete controllers using the factory
// ============================================================

export const companiesController = createCrudController('visitor_companies', {
    orderBy: 'name ASC',
    insertFields: [
        { name: 'name', required: true },
        { name: 'rnc' }
    ],
    updateFields: [
        { name: 'name' },
        { name: 'rnc' }
    ]
});

export const reasonsController = createCrudController('visit_reasons', {
    orderBy: 'label ASC',
    insertFields: [
        { name: 'label', required: true },
        { name: 'requiresBadge', dbColumn: 'requires_badge' }
    ],
    updateFields: [
        { name: 'label' },
        { name: 'requiresBadge', dbColumn: 'requires_badge' }
    ]
});

export const badgesController = createCrudController('badges', {
    orderBy: 'number ASC',
    insertFields: [
        { name: 'number', required: true }
    ],
    updateFields: [
        { name: 'number' }
    ]
});

export const employeesController = createCrudController('employees', {
    orderBy: 'name ASC',
    insertFields: [
        { name: 'name', required: true },
        { name: 'area' },
        { name: 'email' },
        { name: 'whatsapp' }
    ],
    updateFields: [
        { name: 'name' },
        { name: 'area' },
        { name: 'email' },
        { name: 'whatsapp' }
    ]
});

export const areasController = createCrudController('areas', {
    orderBy: 'level ASC, name ASC',
    insertFields: [
        { name: 'name', required: true },
        { name: 'level' },
        { name: 'parentAreaId', dbColumn: 'parent_area_id' }
    ],
    updateFields: [
        { name: 'name' },
        { name: 'level' },
        { name: 'parentAreaId', dbColumn: 'parent_area_id' }
    ]
});

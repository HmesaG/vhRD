import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Find user
        const result = await pool.query(
            'SELECT u.*, o.name as company_name, o.nit, o.address as company_address, o.phone as company_phone, o.email as company_email, o.logo_url FROM users u LEFT JOIN organizations o ON u.company_id = o.id WHERE u.email = $1',
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Generate JWT
        const token = generateToken({
            uid: user.id,
            email: user.email,
            role: user.role,
            companyId: user.company_id
        });

        // Build response
        const companyData = user.company_id ? {
            id: user.company_id,
            name: user.company_name,
            nit: user.nit,
            address: user.company_address,
            phone: user.company_phone,
            email: user.company_email,
            logo_url: user.logo_url
        } : null;

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.company_id,
                assignedAreas: user.assigned_areas || []
            },
            companyData
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

export const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT u.id, u.email, u.role, u.company_id, u.assigned_areas, o.name as company_name, o.nit, o.address as company_address, o.phone as company_phone, o.email as company_email, o.logo_url FROM users u LEFT JOIN organizations o ON u.company_id = o.id WHERE u.id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];

        const companyData = user.company_id ? {
            id: user.company_id,
            name: user.company_name,
            nit: user.nit,
            address: user.company_address,
            phone: user.company_phone,
            email: user.company_email,
            logo_url: user.logo_url
        } : null;

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.company_id,
                assignedAreas: user.assigned_areas || []
            },
            companyData
        });
    } catch (err) {
        console.error('GetMe error:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Contraseñas requeridas' });
        }

        const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        console.error('ChangePassword error:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

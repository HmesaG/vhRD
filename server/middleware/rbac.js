/**
 * Role-Based Access Control Middleware
 * Usage: rbac('administrador', 'superadmin')
 */
export const rbac = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        // Superadmin bypasses all role checks
        if (req.user.role === 'superadmin') {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'No tienes permisos para esta acción' });
        }

        next();
    };
};

/**
 * Multi-tenancy middleware
 * Ensures users can only access data from their own company
 * Adds companyFilter to req for use in controllers
 */
export const tenantFilter = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    // Superadmin can access any company's data
    if (req.user.role === 'superadmin') {
        // If a companyId is provided in query, use it; otherwise no filter
        req.companyFilter = req.query.companyId || req.body?.companyId || null;
    } else {
        // Regular users are always filtered to their own company
        req.companyFilter = req.user.company_id;
    }

    next();
};

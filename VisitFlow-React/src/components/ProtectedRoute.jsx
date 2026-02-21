import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SplashScreen from './SplashScreen';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <SplashScreen />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Superadmin bypasses role checks
    if (role === 'superadmin') {
        return children;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // Redirigir a su página principal permitida si no tiene acceso a la actual
        const roleHome = {
            'punto_de_control': '/seguridad',
            'recepcion': '/',
            'administrador': '/',
            'seguridad': '/',
            'superadmin': '/'
        };
        return <Navigate to={roleHome[role] || '/'} replace />;
    }

    return children;
};

export default ProtectedRoute;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('visitflow_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const data = await authApi.getMe();
                setUser(data.user);
                setRole(data.user.role);
                setCompanyId(data.user.companyId);
                setCompanyData(data.companyData);
            } catch (err) {
                // Token invalid or expired
                console.error('Session validation failed:', err);
                localStorage.removeItem('visitflow_token');
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const data = await authApi.login(email, password);

        // Store token
        localStorage.setItem('visitflow_token', data.token);

        // Update state
        setUser(data.user);
        setRole(data.user.role);
        setCompanyId(data.user.companyId);
        setCompanyData(data.companyData);

        return data;
    };

    const logout = () => {
        localStorage.removeItem('visitflow_token');
        setUser(null);
        setRole(null);
        setCompanyId(null);
        setCompanyData(null);
    };

    const value = {
        user,
        role,
        companyId,
        companyData,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

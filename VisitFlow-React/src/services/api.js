/**
 * Visitas Hub RD API Service
 * Centralized HTTP client that replaces all previous SDK calls.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('vhrd_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response) => {
    if (response.status === 401) {
        // Token expired or invalid — clear session
        localStorage.removeItem('vhrd_token');
        window.location.href = '/login';
        throw new Error('Sesión expirada');
    }

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) return null;

    return response.json();
};

const request = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...getHeaders(), ...options.headers }
    });
    return handleResponse(response);
};

// ============================================================
// Auth
// ============================================================
export const authApi = {
    login: (email, password) =>
        request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

    getMe: () =>
        request('/auth/me'),

    changePassword: (currentPassword, newPassword) =>
        request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
};

// ============================================================
// Visits
// ============================================================
export const visitsApi = {
    getAll: (companyId) =>
        request(`/visits${companyId ? `?companyId=${companyId}` : ''}`),

    getById: (id) =>
        request(`/visits/${id}`),

    create: (data) =>
        request('/visits', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        request(`/visits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id) =>
        request(`/visits/${id}`, { method: 'DELETE' }),
};

// ============================================================
// Organizations
// ============================================================
export const organizationsApi = {
    getAll: () =>
        request('/organizations'),

    getById: (id) =>
        request(`/organizations/${id}`),

    create: (data) =>
        request('/organizations', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        request(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id) =>
        request(`/organizations/${id}`, { method: 'DELETE' }),
};

// ============================================================
// Users
// ============================================================
export const usersApi = {
    getAll: () =>
        request('/users'),

    getById: (id) =>
        request(`/users/${id}`),

    create: (data) =>
        request('/users', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id) =>
        request(`/users/${id}`, { method: 'DELETE' }),
};

// ============================================================
// Visitor Companies
// ============================================================
export const companiesApi = {
    getAll: (companyId) =>
        request(`/companies${companyId ? `?companyId=${companyId}` : ''}`),

    create: (data) =>
        request('/companies', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        request(`/companies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id) =>
        request(`/companies/${id}`, { method: 'DELETE' }),

    batchDelete: (ids) =>
        request('/companies/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
};

// ============================================================
// Visit Reasons
// ============================================================
export const reasonsApi = {
    getAll: (companyId) =>
        request(`/reasons${companyId ? `?companyId=${companyId}` : ''}`),

    create: (data) =>
        request('/reasons', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        request(`/reasons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id) =>
        request(`/reasons/${id}`, { method: 'DELETE' }),
};

// ============================================================
// Badges
// ============================================================
export const badgesApi = {
    getAll: (companyId) =>
        request(`/badges${companyId ? `?companyId=${companyId}` : ''}`),

    create: (data) =>
        request('/badges', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        request(`/badges/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id) =>
        request(`/badges/${id}`, { method: 'DELETE' }),

    batchDelete: (ids) =>
        request('/badges/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
};

// ============================================================
// Employees
// ============================================================
export const employeesApi = {
    getAll: (companyId) =>
        request(`/employees${companyId ? `?companyId=${companyId}` : ''}`),

    create: (data) =>
        request('/employees', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        request(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id) =>
        request(`/employees/${id}`, { method: 'DELETE' }),

    batchDelete: (ids) =>
        request('/employees/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
};

// ============================================================
// Areas
// ============================================================
export const areasApi = {
    getAll: (companyId) =>
        request(`/areas${companyId ? `?companyId=${companyId}` : ''}`),

    create: (data) =>
        request('/areas', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        request(`/areas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id) =>
        request(`/areas/${id}`, { method: 'DELETE' }),

    batchDelete: (ids) =>
        request('/areas/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
};

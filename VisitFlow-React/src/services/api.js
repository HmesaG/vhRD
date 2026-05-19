/**
 * Visitas Hub RD API Service
 * Centralized HTTP client that replaces all previous SDK calls.
 */

/**
 * Detects the correct backend base URLs for both REST API and WebSockets.
 * Handles:
 * 1. Local environment (localhost/127.0.0.1) -> http://localhost:3001
 * 2. Production env variables (VITE_API_URL) -> If provided as full URL
 * 3. Dynamic production fallback -> Prefixes domain with api- (e.g. vhrd.31.97.100.82.sslip.io -> api-vhrd.31.97.100.82.sslip.io)
 */
export const getBackendUrls = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    
    // 1. If VITE_API_URL is configured as a full URL (not just '/api')
    if (envUrl && envUrl.startsWith('http')) {
        const cleanEnvUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
        
        // If VITE_API_URL includes the /api suffix
        if (cleanEnvUrl.endsWith('/api')) {
            return {
                API_URL: cleanEnvUrl,
                SOCKET_URL: cleanEnvUrl.slice(0, -4) // strip /api
            };
        }
        return {
            API_URL: `${cleanEnvUrl}/api`,
            SOCKET_URL: cleanEnvUrl
        };
    }

    // 2. If running locally on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return {
            API_URL: 'http://localhost:3001/api',
            SOCKET_URL: 'http://localhost:3001'
        };
    }

    // 3. Dynamic production fallback based on window.location
    const protocol = window.location.protocol;
    const host = window.location.host;
    
    // If we're already on an api host (precautionary)
    if (host.startsWith('api-') || host.startsWith('api.')) {
        return {
            API_URL: `${protocol}//${host}/api`,
            SOCKET_URL: `${protocol}//${host}`
        };
    }

    // Standard pattern: api-[frontend-domain]
    return {
        API_URL: `${protocol}//api-${host}/api`,
        SOCKET_URL: `${protocol}//api-${host}`
    };
};

const urls = getBackendUrls();
export const API_URL = urls.API_URL;
export const SOCKET_URL = urls.SOCKET_URL;


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
    getAll: (companyId, opts = {}) => {
        const params = new URLSearchParams();
        if (companyId) params.set('companyId', companyId);
        if (opts.days) params.set('days', opts.days);
        const qs = params.toString();
        return request(`/visits${qs ? `?${qs}` : ''}`);
    },

    getById: (id) =>
        request(`/visits/${id}`),

    create: (data) =>
        request('/visits', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        request(`/visits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id) =>
        request(`/visits/${id}`, { method: 'DELETE' }),

    getCheckpoints: (visitId) =>
        request(`/visits/${visitId}/checkpoints`),

    addCheckpoint: (visitId, checkpointData) =>
        request(`/visits/${visitId}/checkpoints`, { method: 'POST', body: JSON.stringify(checkpointData) }),
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

    getById: (id) =>
        request(`/companies/${id}`),

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

    getById: (id) =>
        request(`/reasons/${id}`),

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

    getById: (id) =>
        request(`/badges/${id}`),

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

    getById: (id) =>
        request(`/employees/${id}`),

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

    getById: (id) =>
        request(`/areas/${id}`),

    create: (data) =>
        request('/areas', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        request(`/areas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id) =>
        request(`/areas/${id}`, { method: 'DELETE' }),

    batchDelete: (ids) =>
        request('/areas/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
    get: async (path, auth = true) => {
        const headers = { 'Content-Type': 'application/json' };
        if (auth) {
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE}${path}`, { headers });
        if (res.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
            throw new Error('Session expired');
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(err.detail || 'Request failed');
        }
        return res.json();
    },

    post: async (path, data, auth = true) => {
        const headers = { 'Content-Type': 'application/json' };
        if (auth) {
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (res.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
            throw new Error('Session expired');
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(err.detail || 'Request failed');
        }
        return res.json();
    },

    put: async (path, data) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(err.detail || 'Request failed');
        }
        return res.json();
    },

    delete: async (path) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(err.detail || 'Request failed');
        }
        return res.json();
    }
};

export default api;

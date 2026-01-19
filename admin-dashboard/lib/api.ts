import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.user?.accessToken) {
        config.headers.Authorization = `Bearer ${session.user.accessToken}`;
    }
    return config;
});

// Tenant API
export const tenantsApi = {
    list: (params?: {
        page?: number;
        per_page?: number;
        status?: string;
        search?: string;
        sort_by?: string;
    }) => api.get('/api/v1/admin/tenants', { params }),

    get: (id: string) => api.get(`/api/v1/admin/tenants/${id}`),

    update: (id: string, data: Partial<{
        name: string;
        contact_email: string;
        contact_phone: string;
        logo_url: string;
        primary_color: string;
        secondary_color: string;
        website: string;
        address: string;
    }>) => api.patch(`/api/v1/admin/tenants/${id}`, data),

    create: (data: {
        name: string;
        contact_email: string;
        contact_phone: string;
        supabase_url_raw: string;
        supabase_key_raw: string;
    }, autoCreateDb: boolean = false) =>
        api.post(`/api/v1/admin/tenants${autoCreateDb ? '?auto_create_db=true' : ''}`, data),

    extend: (id: string, data: {
        extension_days: number;
        payment_reference: string;
        amount: number;
        notes?: string;
    }) => api.put(`/api/v1/admin/tenants/${id}/extend`, data),

    changeStatus: (id: string, action: string, reason?: string) =>
        api.put(`/api/v1/admin/tenants/${id}/status`, null, {
            params: { action, reason },
        }),

    activate: (id: string, payment_ref: string, notes?: string) =>
        api.put(`/api/v1/admin/tenants/${id}/activate`, null, {
            params: { payment_ref, notes },
        }),
};

// Analytics API
export const analyticsApi = {
    getStats: () => api.get('/api/v1/admin/stats'),
    getRevenue: (period: string = 'monthly') => api.get('/api/v1/admin/analytics/revenue', { params: { period } }),
    getSystemSettings: () => api.get('/api/v1/admin/settings'),
};

// Bulk Operations API
export const bulkApi = {
    extendSubscriptions: (tenant_ids: string[], extension_days: number) =>
        api.post('/api/v1/admin/bulk/extend', { tenant_ids, extension_days }),
};

// Module Management API
export const modulesApi = {
    listAll: () => api.get('/api/v1/admin/modules'),

    listTenantModules: (tenantId: string) =>
        api.get(`/api/v1/admin/tenants/${tenantId}/modules`),

    toggle: (tenantId: string, data: {
        module_id: string;
        is_enabled: boolean;
        price_override?: number;
    }) => api.post(`/api/v1/admin/tenants/${tenantId}/modules`, data),
};

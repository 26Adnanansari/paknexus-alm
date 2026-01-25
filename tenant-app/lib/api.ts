import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` : 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(async (config) => {
    // 1. Try to get token from localStorage (manual override/cache)
    let token = typeof window !== 'undefined' ? localStorage.getItem('tenant_token') : null;

    // 2. If not in localStorage, try getting it from the NextAuth session
    if (!token) {
        try {
            const session = await getSession();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((session as any)?.accessToken) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token = (session as any).accessToken;
            }
        } catch (error) {
            console.warn("Failed to retrieve session for API call:", error);
        }
    }

    // 3. Only attach header if we have a valid token string
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.debug("Making API request without Authorization token (User might be logged out)");
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 401 Unauthorized (Token expired/invalid) - Redirect to login
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                // Force signout to clear stale session
                signOut({ callbackUrl: '/login' });
            }
        }

        // Log detailed error for debugging 403s
        if (error.response?.status === 403) {
            console.error("Access Forbidden (403):", {
                url: error.config?.url,
                method: error.config?.method,
                detail: error.response?.data?.detail
            });
        }

        return Promise.reject(error);
    }
);

export default api;

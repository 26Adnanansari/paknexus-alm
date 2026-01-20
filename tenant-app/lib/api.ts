import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` : 'http://localhost:8000/api/v1',
});

import { getSession } from 'next-auth/react';

api.interceptors.request.use(async (config) => {
    let token = localStorage.getItem('tenant_token');

    if (!token) {
        const session = await getSession();
        // @ts-ignore
        token = session?.accessToken as string;
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;

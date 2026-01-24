'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface BrandingData {
    name: string;
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    website?: string;
    address?: string;
}

interface BrandingContextType {
    branding: BrandingData | null;
    setBranding: (data: BrandingData) => void;
    loading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
    branding: null,
    setBranding: () => { },
    loading: true,
});

export const BrandingProvider = ({ children }: { children: React.ReactNode }) => {
    const [branding, setBranding] = useState<BrandingData | null>(null);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = (global as any).session; // We need to access session here, but useSession needs SessionProvider. 
    // Since this is a context provider, it might be inside SessionProvider or not. 
    // To be safe, we will fetch school profile if we detect we are likely logged in or after initial load.
    // Actually, let's keep it simple. If we are on /dashboard, we trigger a fetch.

    useEffect(() => {
        const fetchBranding = async () => {
            const domain = window.location.hostname;
            try {
                // 1. Try public domain branding first (fastest)
                const res = await api.get(`/public/branding?domain=${domain}`);
                if (res.data) setBranding(res.data);

                // 2. If valid session token exists (localStorage or cookie), try fetching specific school profile
                // This fixes the issue where generic domains (vercel.app) show generic branding
                // We rely on api interceptor to attach token if present.
                const token = typeof window !== 'undefined' ? localStorage.getItem('tenant_token') : null;
                // Note: We can't easily check httpOnly cookies here without making a request.

                // Let's attempt to fetch authenticated profile if we are in dashboard
                if (window.location.pathname.startsWith('/dashboard')) {
                    try {
                        const profileRes = await api.get('/school/profile');
                        if (profileRes.data) {
                            setBranding(prev => ({ ...prev, ...profileRes.data }));
                        }
                    } catch {
                        // Ignore if not logged in
                    }
                }

                if (res.data.primary_color) document.documentElement.style.setProperty('--primary', res.data.primary_color);
                if (res.data.secondary_color) document.documentElement.style.setProperty('--secondary', res.data.secondary_color);

            } catch (err: any) {
                if (err.response && (err.response.status === 404 || err.response.status === 400)) {
                    if (process.env.NODE_ENV === 'development') {
                        console.debug(`[Branding] No custom branding found for ${domain}.`);
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBranding();
    }, []);

    return (
        <BrandingContext.Provider value={{ branding, setBranding, loading }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => useContext(BrandingContext);

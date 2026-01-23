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

    useEffect(() => {
        const fetchBranding = async () => {
            // Determine domain/subdomain to fetch branding
            const domain = window.location.hostname;

            try {
                // Use public endpoint
                const res = await api.get(`/public/branding?domain=${domain}`);
                setBranding(res.data);

                // Apply colors to CSS variables
                if (res.data.primary_color) {
                    document.documentElement.style.setProperty('--primary', res.data.primary_color);
                }
                if (res.data.secondary_color) {
                    document.documentElement.style.setProperty('--secondary', res.data.secondary_color);
                }
            } catch (err: any) {
                // Gracefully handle 404 (Domain not found) or 400 (Bad Request)
                if (err.response && (err.response.status === 404 || err.response.status === 400)) {
                    // Suppress verbose error for known branding failures
                    if (process.env.NODE_ENV === 'development') {
                        console.debug(`[Branding] No custom branding found for ${domain}. Using default.`);
                    }
                } else {
                    // Log actual errors (500s, network issues)
                    console.error('Failed to fetch branding:', err.message || err);
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

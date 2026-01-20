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
            try {
                // Determine domain/subdomain to fetch branding
                // In production: subdomain.pakainexus.com -> 'subdomain'
                // In dev: localhost -> handle gracefully (maybe hardcode 'demo' or user has to map it)
                const domain = window.location.hostname;

                // Use public endpoint so we don't get 401s on login/landing
                const res = await api.get(`/public/branding?domain=${domain}`);
                setBranding(res.data);

                // Apply colors to CSS variables
                if (res.data.primary_color) {
                    document.documentElement.style.setProperty('--primary', res.data.primary_color);
                }
                if (res.data.secondary_color) {
                    document.documentElement.style.setProperty('--secondary', res.data.secondary_color);
                }
            } catch (err) {
                console.error('Failed to fetch branding:', err);
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

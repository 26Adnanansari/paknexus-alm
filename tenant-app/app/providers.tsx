'use client';

import { SessionProvider } from "next-auth/react";
import { BrandingProvider } from "@/context/branding-context";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
            <BrandingProvider>
                {children}
            </BrandingProvider>
        </SessionProvider>
    );
}

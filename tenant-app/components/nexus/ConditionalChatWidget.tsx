'use client';

import { usePathname } from 'next/navigation';
import ChatWidget from './ChatWidget';

export default function ConditionalChatWidget() {
    const pathname = usePathname();

    // Don't show chat widget on login, signup, or public pages
    const publicPages = ['/login', '/signup', '/'];
    const isPublicPage = publicPages.some(page => pathname === page || pathname?.startsWith(page));

    if (isPublicPage) {
        return null;
    }

    return <ChatWidget />;
}

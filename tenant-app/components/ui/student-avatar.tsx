'use client';

import React, { useState } from 'react';

interface StudentAvatarProps {
    photoUrl: string | null;
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function StudentAvatar({ photoUrl, name, size = 'md' }: StudentAvatarProps) {
    const [imageError, setImageError] = useState(false);
    const [loading, setLoading] = useState(true);

    // Size mapping
    const sizeClasses = {
        sm: 'w-10 h-10 text-sm',
        md: 'w-14 h-14 text-lg',
        lg: 'w-20 h-20 text-2xl',
        xl: 'w-24 h-24 text-3xl' // Added XL just in case
    };

    // Generate initials from name
    const getInitials = (name: string) => {
        return (name || 'Unknown')
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Generate consistent color from name
    const getColorFromName = (name: string) => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-red-500',
            'bg-amber-500',
            'bg-teal-500'
        ];

        const charCode = (name || 'U').charCodeAt(0);
        const index = charCode % colors.length;
        return colors[index];
    };

    // If no photo URL or image failed to load, show initials
    if (!photoUrl || imageError) {
        return (
            <div
                className={`
          ${sizeClasses[size]}
          ${getColorFromName(name)}
          rounded-full
          flex items-center justify-center
          text-white font-semibold
          flex-shrink-0
          shadow-sm border border-white/20
        `}
            >
                {getInitials(name)}
            </div>
        );
    }

    // Show image with fallback
    return (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 bg-slate-100 relative shadow-sm border border-slate-200`}>
            {loading && (
                <div className="absolute inset-0 animate-pulse bg-slate-200 z-10" />
            )}
            <img
                src={photoUrl}
                alt={name}
                className={`
          w-full h-full object-cover
          ${loading ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300
        `}
                onLoad={() => setLoading(false)}
                onError={() => {
                    setImageError(true);
                    setLoading(false);
                }}
            />
        </div>
    );
}

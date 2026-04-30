'use client';

import { useMemo } from 'react';

interface UserAvatarProps {
    email?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export function UserAvatar({ email, name, size = 'md', className = '' }: UserAvatarProps) {
    const initials = useMemo(() => {
        if (name) return name.charAt(0).toUpperCase();
        if (email) return email.charAt(0).toUpperCase();
        return 'U';
    }, [name, email]);

    const sizeClasses = {
        sm: 'w-8 h-8 text-[10px]',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-24 h-24 text-3xl',
    };

    // Premium gradients based on name/email hash
    const bgGradient = useMemo(() => {
        const gradients = [
            'from-[#2563eb] to-[#1d4ed8]', // Blue
            'from-[#059669] to-[#047857]', // Emerald
            'from-[#7c3aed] to-[#6d28d9]', // Violet
            'from-[#db2777] to-[#be185d]', // Pink
            'from-[#d97706] to-[#b45309]', // Amber
        ];
        const str = name || email || 'u';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % gradients.length;
        return gradients[index];
    }, [name, email]);

    // Gravatar URL (no MD5 needed if we use the email directly, Gravatar handles it or we can just use a placeholder)
    // For now, let's use the gradient fallback as it looks very clean in the UI.
    
    return (
        <div className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br ${bgGradient} text-white font-bold shadow-inner ${sizeClasses[size]} ${className}`}>
            <span>{initials}</span>
            {/* Overlay to give it some depth */}
            <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        </div>
    );
}

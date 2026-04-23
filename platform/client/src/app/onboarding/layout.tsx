'use client';

import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface OnboardingLayoutProps {
    children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
    const { logout } = useAuth();

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
            position: 'relative',
        }}>
            <button
                onClick={logout}
                className="hover-lift"
                style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-body)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    zIndex: 50,
                }}
            >
                <LogOut size={16} />
                Sign Out
            </button>
            {children}
        </div>
    );
}

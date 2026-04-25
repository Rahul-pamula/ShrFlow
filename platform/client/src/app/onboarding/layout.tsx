'use client';

import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';

interface OnboardingLayoutProps {
    children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
    const { logout } = useAuth();

    return (
        <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-10rem] top-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[var(--accent)]/10 blur-3xl" />
                <div className="absolute bottom-[-12rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[var(--accent-secondary)]/10 blur-3xl" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(15,23,42,0.02)_100%)]" />
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-end px-4 pt-4 sm:px-6">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={logout}
                    className="border-[var(--border-strong)]"
                >
                    <LogOut size={16} />
                    Sign Out
                </Button>
            </div>

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

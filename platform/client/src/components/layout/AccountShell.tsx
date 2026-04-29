'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, LogOut, Mail, User } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';

interface AccountShellProps {
    children: React.ReactNode;
}

const ACCOUNT_NAV = [
    { href: '/account', label: 'Account Center', icon: User },
    { href: '/account/security', label: 'Security', icon: Lock },
];

export default function AccountShell({ children }: AccountShellProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <header className="border-b border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur">
                <div className="mx-auto flex min-h-[72px] w-full max-w-[1280px] items-center justify-between gap-4 px-5 py-4 md:px-8">
                    <div className="flex min-w-0 items-center gap-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">ShrFlow</p>
                            <p className="text-lg font-semibold text-[var(--text-primary)]">Account</p>
                        </div>

                        <nav className="hidden items-center gap-2 md:flex">
                            {ACCOUNT_NAV.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <Button variant={isActive ? 'secondary' : 'ghost'}>
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Button>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm text-[var(--text-muted)] md:flex">
                            <Mail className="h-4 w-4" />
                            <span className="max-w-[260px] truncate">{user?.email || 'Unknown account'}</span>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                void logout();
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>

                <div className="mx-auto flex w-full max-w-[1280px] gap-2 px-5 pb-4 md:hidden md:px-8">
                    {ACCOUNT_NAV.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} className="flex-1">
                                <Button variant={isActive ? 'secondary' : 'ghost'} className="w-full justify-center">
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        );
                    })}
                </div>
            </header>

            <main className="mx-auto w-full max-w-[1280px] px-5 py-8 md:px-8">
                {children}
            </main>
        </div>
    );
}

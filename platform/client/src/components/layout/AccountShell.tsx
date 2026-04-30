'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, Lock, LogOut, Settings, User } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '@/components/ui';

interface AccountShellProps {
    children: React.ReactNode;
}

export default function AccountShell({ children }: AccountShellProps) {
    const { user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <header className="bg-[var(--bg-primary)] border-b border-[var(--border)] h-[64px] flex items-center shrink-0 sticky top-0 z-50">
                <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-6">
                    {/* Left side: Logo + Breadcrumb */}
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg flex items-center justify-center shadow-sm">
                            <div className="w-4 h-4 border-2 border-[var(--accent)] rounded-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--accent)]">ShrFlow</span>
                            <span className="text-sm font-medium text-[var(--text-muted)]">/</span>
                            <span className="text-sm font-medium text-[var(--text-primary)]">Account Center</span>
                        </div>
                    </div>

                    {/* Right side: Bell + Profile Dropdown */}
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">
                            <Bell className="w-5 h-5" />
                        </button>

                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group"
                            >
                                <UserAvatar email={user.email} name={user.fullName} size="sm" />
                                <span className="text-sm font-semibold text-[var(--text-primary)]">
                                    {user.fullName}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProfileOpen && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* Header Info */}
                                    <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--border)] mb-1">
                                        <UserAvatar email={user.email} name={user.fullName} size="md" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.fullName}</p>
                                            <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="px-2 pt-1">
                                        <Link 
                                            href="/account/profile" 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                                        >
                                            <User className="w-4 h-4" /> Personal Details
                                        </Link>
                                        <Link 
                                            href="/account/security" 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                                        >
                                            <Lock className="w-4 h-4" /> Security
                                        </Link>
                                    </div>

                                    <div className="border-t border-[var(--border)] mt-2 mb-1"></div>

                                    <div className="px-2">
                                        <button
                                            onClick={() => {
                                                setIsProfileOpen(false);
                                                void logout();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-left font-medium"
                                        >
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[1280px] px-6 py-12">
                {children}
            </main>
        </div>
    );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Bell, Menu, User, Settings, CreditCard, ChevronDown, CheckCircle2, UserCircle2, Shield, LogOut, Mail } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CommandPalette } from '@/components/ui/CommandPalette';
import NotificationPopover from './NotificationPopover';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { UserAvatar } from '@/components/ui';

interface HeaderProps {
    setMobileMenuOpen?: () => void;
    settingsMode?: boolean;
}

export default function Header({ setMobileMenuOpen, settingsMode }: HeaderProps) {
    const { user, currentWorkspace, logout } = useAuth();
    const pathname = usePathname();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Fetch pending workspace requests count for owners
    useEffect(() => {
        if (!user || user.role !== 'OWNER') return;
        const fetchPendingRequests = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) return;
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/team/requests`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const pending = data.filter((r: any) => r.status === 'pending');
                    setPendingRequestsCount(pending.length);
                }
            } catch (err) {
                console.error('Failed to fetch pending requests', err);
            }
        };
        fetchPendingRequests();
    }, [user]);

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

    // Command K shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!user) return null;

    return (
        <header className="h-[64px] bg-[var(--bg-primary)] px-6 flex items-center justify-between sticky top-0 z-50 border-b border-[var(--border)] shrink-0 gap-6">
            {/* Left side: Mobile menu toggle + Workspace Switcher */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setMobileMenuOpen?.()}
                    className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2 -ml-2 rounded-lg hover:bg-[var(--bg-secondary)]"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="hidden md:flex items-center">
                    <WorkspaceSwitcher variant="header" />
                </div>

                {settingsMode && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/5 border border-[var(--accent)]/20 animate-in fade-in zoom-in duration-300">
                        <Settings className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">Settings Mode</span>
                    </div>
                )}
            </div>

            {/* Middle: Search Bar */}
            <div className="flex-1 max-w-md hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search campaigns, contacts, domains..."
                        readOnly
                        onClick={() => setIsSearchOpen(true)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all cursor-pointer"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border)] rounded">⌘K</kbd>
                    </div>
                </div>
            </div>

            {/* Right side: Notifications & Profile */}
            <div className="flex items-center gap-3 justify-end relative" ref={dropdownRef}>
                
                {/* Notifications Button */}
                <NotificationPopover />

                {/* Workspace Requests Button (Owners Only) */}
                {user?.role === 'OWNER' && (
                    <Link href="/settings/requests" className="relative p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors" title="Workspace Requests">
                        <User className="w-5 h-5" />
                        {pendingRequestsCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--danger)] text-[9px] font-bold text-white border-[1.5px] border-[var(--bg-primary)]">
                                {pendingRequestsCount}
                            </span>
                        )}
                    </Link>
                )}

                {/* Profile Avatar Button */}
                <div className="h-8 w-[1px] bg-[var(--border)] mx-1 hidden sm:block"></div>

                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 p-1 pr-2 rounded-full border border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-all"
                >
                    <UserAvatar email={user.email} name={user.fullName} size="sm" />
                    <div className="hidden sm:flex flex-col items-start text-left">
                        <span className="text-sm font-semibold text-[var(--text-primary)] leading-none mb-0.5">
                            {user.fullName}
                        </span>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-200 hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        
                        {/* Header Info */}
                        <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--border)] mb-1">
                            <UserAvatar email={user.email} name={user.fullName} size="md" />
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.fullName}</p>
                                <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="px-2 space-y-0.5">
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
                                <Shield className="w-4 h-4" /> Security
                            </Link>
                        </div>

                        <div className="border-t border-[var(--border)] my-1"></div>

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

            <CommandPalette isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
        </header>
    );
}

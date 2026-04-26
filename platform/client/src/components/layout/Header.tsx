'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Bell, Menu, User, Settings, CreditCard, LogOut, ChevronDown, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CommandPalette } from '@/components/ui/CommandPalette';

interface HeaderProps {
    setMobileMenuOpen?: () => void;
}

export default function Header({ setMobileMenuOpen }: HeaderProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [workspaceName, setWorkspaceName] = useState<string | null>(null);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch workspace name on mount
    useEffect(() => {
        if (!user || user.tenantStatus !== 'active') return;
        const fetchWorkspaceName = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) return;
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/workspaces`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const workspaces = await res.json();
                    const current = workspaces.find((w: any) => w.tenant_id === user.tenantId);
                    if (current) setWorkspaceName(current.company_name);
                }
            } catch (err) {
                console.error('Failed to fetch workspace name for header', err);
            }
        };
        fetchWorkspaceName();
    }, [user]);

    // Fetch pending workspace requests count for owners
    useEffect(() => {
        if (!user || (user.role !== 'MAIN_OWNER' && user.role !== 'FRANCHISE_OWNER')) return;
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
    const [isSearchOpen, setIsSearchOpen] = useState(false);
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

    // Get initials for avatar
    const initials = (user.fullName || user.email || 'U').charAt(0).toUpperCase();

    // Map the internal role to a friendly label
    const roleLabel = user.role === 'MAIN_OWNER' ? 'Main Owner' : user.role === 'FRANCHISE_OWNER' ? 'Franchise Owner' : user.role === 'MANAGER' ? 'Manager' : 'Member';



    return (
        <header className="h-[64px] bg-[var(--bg-primary)] px-6 flex items-center justify-between sticky top-0 z-50 border-b border-[var(--border)] shrink-0">
            {/* Left side: Mobile menu toggle only */}
            <div className="flex items-center gap-4 flex-1">
                <button 
                    onClick={() => setMobileMenuOpen?.()}
                    className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2 -ml-2 rounded-lg hover:bg-[var(--bg-secondary)]"
                >
                    <Menu className="w-5 h-5" />
                </button>
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
            <div className="flex items-center gap-3 flex-1 justify-end relative" ref={dropdownRef}>

                {/* Notifications Button */}
                <Link href="/settings/requests" className="relative p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors" title="Workspace Requests">
                    <Bell className="w-5 h-5" />
                    {/* Notification Dot */}
                    {pendingRequestsCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--danger)] text-[9px] font-bold text-white border-[1.5px] border-[var(--bg-primary)]">
                            {pendingRequestsCount}
                        </span>
                    )}
                </Link>

                {/* Profile Avatar Button */}
                <div className="h-8 w-[1px] bg-[var(--border)] mx-1 hidden sm:block"></div>

                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 p-1 pr-2 rounded-full border border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-all"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--ai-accent)] flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-[var(--accent)]/20">
                        {initials}
                    </div>
                    <div className="hidden sm:flex flex-col items-start text-left">
                        <span className="text-sm font-semibold text-[var(--text-primary)] leading-none mb-0.5">
                            {user.fullName || user.email.split('@')[0]}
                        </span>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-200 hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        
                        {/* Header Info */}
                        <div className="px-4 py-3 border-b border-[var(--border)] mb-2">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.fullName || 'User'}</p>
                            <p className="text-xs text-[var(--text-muted)] truncate mb-2">{user.email}</p>
                            
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                    (user.role === 'MAIN_OWNER' || user.role === 'FRANCHISE_OWNER') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                    user.role === 'MANAGER' ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20' : 
                                    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                }`}>
                                    {roleLabel}
                                </span>
                                {user.tenantStatus === 'active' && (
                                    <span className="text-xs text-[var(--success)] flex items-center gap-1 truncate" title={workspaceName || 'Active Workspace'}>
                                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> {workspaceName || 'Active Workspace'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="px-2">
                            <Link 
                                href="/settings/profile" 
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                            >
                                <User className="w-4 h-4" /> Personal Profile
                            </Link>

                            <Link 
                                href="/settings/organization" 
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                            >
                                <Settings className="w-4 h-4" /> Workspace Settings
                            </Link>

                            <Link 
                                href="/settings/billing" 
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                            >
                                <CreditCard className="w-4 h-4" /> Account & Billing
                            </Link>
                            
                            <button 
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors mt-1"
                            >
                                <RefreshCw className="w-4 h-4" /> Refresh Session
                            </button>
                        </div>

                        <div className="h-[1px] bg-[var(--border)] my-2"></div>

                        {/* Logout */}
                        <div className="px-2">
                            <button 
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
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

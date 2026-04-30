'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2, ChevronDown, Check, Plus, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Workspace {
    tenant_id: string;
    company_name: string;
    role: string;
    status: string;
}

interface WorkspaceSwitcherProps {
    collapsed?: boolean;
    variant?: 'sidebar' | 'header';
}

export default function WorkspaceSwitcher({ collapsed = false, variant = 'sidebar' }: WorkspaceSwitcherProps) {
    const { user, currentWorkspace: activeWorkspace, token, switchWorkspace } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSwitching, setIsSwitching] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Workspace list for switcher
    const otherWorkspaces = workspaces.filter(w => w.tenant_id !== user?.tenantId);
    const activeInList = workspaces.find(w => w.tenant_id === user?.tenantId);

    // Fetch workspaces when dropdown opens
    useEffect(() => {
        if (isOpen && token) {
            fetchWorkspaces();
        }
    }, [isOpen, token]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchWorkspaces = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/workspaces`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setWorkspaces(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch workspaces:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitch = async (tenantId: string) => {
        setIsSwitching(tenantId);
        try {
            await switchWorkspace(tenantId);
            // switchWorkspace does a full page reload, so we don't need to close the dropdown
        } catch (err) {
            console.error('Failed to switch workspace:', err);
            setIsSwitching(null);
        }
    };

    const displayName = activeWorkspace?.name || activeInList?.company_name || user?.tenantId?.slice(0, 8) || 'Workspace';
    const initial = displayName.charAt(0).toUpperCase();
    const isHeader = variant === 'header';

    const normalizeRole = (role: string) => role?.toUpperCase() || 'VIEWER';
    const formatRole = (role: string) => {
        const normalizedRole = normalizeRole(role);
        if (normalizedRole === 'OWNER') return 'Owner';
        if (normalizedRole === 'ADMIN') return 'Admin';
        if (normalizedRole === 'CREATOR') return 'Creator';
        return 'Viewer';
    };

    // Role badge color
    const roleColor = (role: string) => {
        const normalizedRole = normalizeRole(role);
        if (normalizedRole === 'OWNER') return 'text-amber-400';
        if (normalizedRole === 'ADMIN') return 'text-[var(--accent)]';
        return 'text-[var(--text-muted)]';
    };

    // Collapsed mode: just show the workspace initial
    if (!isHeader && collapsed) {
        return (
            <div className="px-2 mb-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    title={displayName}
                    className="w-full flex justify-center p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--accent)]/20 to-[var(--ai-accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                        {initial}
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className={isHeader ? 'relative' : 'px-3 mb-3 relative'} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 rounded-lg border transition-all duration-150
                    ${isOpen
                        ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5 shadow-sm shadow-[var(--accent)]/10'
                        : 'border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border)]'}
                    ${isHeader ? 'min-w-[220px] px-3 py-2' : 'w-full p-2.5'}
                `}
            >
                {/* Workspace Icon */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)]/20 to-[var(--ai-accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-[var(--accent)]" />
                </div>

                {/* Workspace Info */}
                <div className="flex-1 text-left min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                        {displayName}
                    </p>
                    {(activeWorkspace || activeInList) && (
                        <p className={`text-[10px] font-medium uppercase tracking-wider leading-tight mt-0.5 ${roleColor((activeWorkspace || activeInList).role)}`}>
                            {formatRole((activeWorkspace || activeInList).role)}
                        </p>
                    )}
                </div>

                {/* Chevron */}
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`${isHeader ? 'absolute left-0 top-full mt-2 w-[320px]' : 'absolute left-3 right-3 top-full mt-1'} z-50 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150`}>
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-[var(--border)]">
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] opacity-60">
                            Workspaces
                        </p>
                    </div>

                    {/* Loading state */}
                    {isLoading && (
                        <div className="px-3 py-4 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                        </div>
                    )}

                    {/* Workspace list */}
                    {!isLoading && (
                        <div className="py-1 max-h-[240px] overflow-y-auto">
                            {/* Current workspace */}
                            {activeInList && (
                                <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--accent)]/5">
                                    <div className="w-7 h-7 rounded-md bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-[var(--accent)]">
                                            {activeInList.company_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                                            {activeInList.company_name}
                                        </p>
                                        <p className={`text-[10px] font-medium uppercase tracking-wider ${roleColor(activeInList.role)}`}>
                                            {formatRole(activeInList.role)}
                                        </p>
                                    </div>
                                    <Check className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
                                </div>
                            )}

                            {/* Other workspaces */}
                            {otherWorkspaces.map(ws => (
                                <button
                                    key={ws.tenant_id}
                                    onClick={() => handleSwitch(ws.tenant_id)}
                                    disabled={isSwitching !== null}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left disabled:opacity-50"
                                >
                                    <div className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-[var(--text-muted)]">
                                            {ws.company_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                                            {ws.company_name}
                                        </p>
                                        <p className={`text-[10px] font-medium uppercase tracking-wider ${roleColor(ws.role)}`}>
                                            {formatRole(ws.role)}
                                        </p>
                                    </div>
                                    {isSwitching === ws.tenant_id && (
                                        <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin flex-shrink-0" />
                                    )}
                                </button>
                            ))}

                            {/* Empty state for single workspace */}
                            {otherWorkspaces.length === 0 && !isLoading && (
                                <div className="px-3 py-2 text-xs text-[var(--text-muted)] text-center opacity-60">
                                    No other workspaces
                                </div>
                            )}
                        </div>
                    )}

                    {/* Account center link */}
                    <div className="border-t border-[var(--border)] p-1">
                        <Link
                            href="/account"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between gap-3 px-3 py-2 text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Account Center
                            </span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

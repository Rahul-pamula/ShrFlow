'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mail, Users, Settings, Plus, FileText, ArrowRight, Activity, X } from 'lucide-react';

interface CommandPaletteProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const PAGES = [
    { name: 'Dashboard', path: '/dashboard', icon: Activity, section: 'Navigation' },
    { name: 'Campaigns', path: '/campaigns', icon: Mail, section: 'Navigation' },
    { name: 'Contacts', path: '/contacts', icon: Users, section: 'Navigation' },
    { name: 'Templates', path: '/templates', icon: FileText, section: 'Navigation' },
    { name: 'Create Campaign', path: '/campaigns/new', icon: Plus, section: 'Actions' },
    { name: 'Import Contacts', path: '/contacts?import=true', icon: Plus, section: 'Actions' },
    { name: 'Billing Settings', path: '/settings/billing', icon: Settings, section: 'Settings' },
    { name: 'Notifications', path: '/settings/notifications', icon: Settings, section: 'Settings' },
];

export function CommandPalette({ isOpen, setIsOpen }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredPages = PAGES.filter((page) =>
        page.name.toLowerCase().includes(query.toLowerCase()) ||
        page.section.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (!isOpen) return;

        setQuery('');
        setActiveIndex(0);
        const timer = setTimeout(() => inputRef.current?.focus(), 60);
        return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (filteredPages.length > 0) {
                    setActiveIndex((prev) => (prev + 1) % filteredPages.length);
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (filteredPages.length > 0) {
                    setActiveIndex((prev) => (prev - 1 + filteredPages.length) % filteredPages.length);
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const target = filteredPages[activeIndex];
                if (target) {
                    router.push(target.path);
                    setIsOpen(false);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, filteredPages, isOpen, router, setIsOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center px-4 pt-[10vh]">
            <button
                type="button"
                aria-label="Close command palette"
                className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />

            <div className="relative w-full max-w-2xl overflow-hidden rounded-[24px] border border-[var(--border-highlight)] bg-[var(--bg-card)] shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
                <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
                    <Search className="h-5 w-5 text-[var(--text-muted)]" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search pages or type a command..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActiveIndex(0);
                        }}
                        className="h-11 flex-1 border-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                    />
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto p-3">
                    {filteredPages.length === 0 ? (
                        <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--bg-primary)] px-6 py-12 text-center text-sm text-[var(--text-muted)]">
                            No matching commands yet.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredPages.map((page, index) => {
                                const Icon = page.icon;
                                const isActive = index === activeIndex;

                                return (
                                    <button
                                        key={page.path}
                                        type="button"
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => {
                                            router.push(page.path);
                                            setIsOpen(false);
                                        }}
                                        className={`flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left transition-all ${isActive
                                            ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/70'
                                            }`}
                                    >
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--accent)]">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium">{page.name}</span>
                                            <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                                {page.section}
                                            </span>
                                        </span>
                                        {isActive && <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-3 border-t border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-xs text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-2">
                        <kbd className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 font-medium">↑↓</kbd>
                        Navigate
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <kbd className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 font-medium">↵</kbd>
                        Select
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <kbd className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 font-medium">esc</kbd>
                        Dismiss
                    </span>
                </div>
            </div>
        </div>
    );
}

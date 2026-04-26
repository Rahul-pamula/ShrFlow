'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Mail, ChevronLeft, LayoutDashboard, Users, BarChart3,
    LayoutTemplate, Settings, ServerCog, Megaphone, ChevronRight,
    User, Building2, CreditCard, Shield, Key, Globe,
    MailCheck, UserPlus, Bell, Lock, Sliders, Store, History, Download, MessageSquareDot,
} from 'lucide-react';
import { useState } from 'react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { useAuth } from '@/context/AuthContext';
import { can, Action } from '@/utils/permissions';

/* ============================================================
   SIDEBAR — Single sidebar with inline Settings submenu
   ============================================================ */

type NavItem = { name: string; href: string; icon: any; action?: Action };

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
    {
        label: 'Operate',
        items: [
            { name: 'Dashboard', href: '/dashboard',     icon: LayoutDashboard },
            { name: 'Contacts',  href: '/contacts',      icon: Users, action: 'VIEW_CONTACT' },
            { name: 'Templates', href: '/templates',     icon: LayoutTemplate, action: 'VIEW_TEMPLATE' },
            { name: 'Campaigns', href: '/campaigns',     icon: Megaphone, action: 'VIEW_CAMPAIGN' },
        ],
    },
    {
        label: 'Observe',
        items: [
            { name: 'Analytics', href: '/analytics',     icon: BarChart3, action: 'VIEW_ANALYTICS' },
        ],
    },

    {
        label: 'Configure',
        items: [
            { name: 'Infrastructure', href: '/infrastructure', icon: ServerCog, action: 'VIEW_SETTINGS' },
            { name: 'Settings',       href: '/settings',       icon: Settings, action: 'VIEW_SETTINGS' },
        ],
    },
];

type SubItem = { href: string; icon: any; label: string; action?: Action };

const SETTINGS_SUB: { label: string; items: SubItem[] }[] = [
    {
        label: 'Account',
        items: [
            { href: '/settings/profile',       icon: User,      label: 'Profile' },
            { href: '/settings/preferences',   icon: Sliders,   label: 'Preferences' },
            { href: '/settings/security',      icon: Lock,      label: 'Security' },
            { href: '/settings/notifications', icon: Bell,      label: 'Notifications' },
        ],
    },
    {
        label: 'Workspace',
        items: [
            { href: '/settings/organization',  icon: Building2,         label: 'Organization', action: 'VIEW_SETTINGS' },
            { href: '/settings/team',          icon: Users,             label: 'Team', action: 'VIEW_SETTINGS' },
            { href: '/settings/team/requests', icon: UserPlus,          label: 'Access Requests', action: 'VIEW_SETTINGS' },
            { href: '/settings/franchises',    icon: Store,             label: 'Franchise Accounts', action: 'ADD_FRANCHISE' },
            { href: '/settings/requests',      icon: MessageSquareDot,  label: 'Workspace Requests', action: 'VIEW_SETTINGS' },
            { href: '/settings/billing',       icon: CreditCard,        label: 'Billing & Plan', action: 'VIEW_BILLING' },
            { href: '/settings/audit',         icon: History,           label: 'Audit History', action: 'VIEW_SETTINGS' },
            { href: '/settings/exports',       icon: Download,          label: 'Export History', action: 'VIEW_SETTINGS' },
        ],
    },
    {
        label: 'Email',
        items: [
            { href: '/settings/domain',        icon: Globe,     label: 'Domain', action: 'VIEW_DOMAIN' },
            { href: '/settings/senders',       icon: MailCheck, label: 'Senders', action: 'VIEW_SETTINGS' },
            { href: '/settings/compliance',    icon: Shield,    label: 'Compliance', action: 'VIEW_SETTINGS' },
        ],
    },
    {
        label: 'Developer',
        items: [
            { href: '/settings/api-keys',      icon: Key,       label: 'API Keys', action: 'VIEW_SETTINGS' },
        ],
    },
];

interface SidebarProps {
    mobileMenuOpen?: boolean;
    setMobileMenuOpen?: (open: boolean) => void;
}

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { user } = useAuth();

    const isOnSettings = pathname?.startsWith('/settings');

    const isActive = (href: string) =>
        pathname === href || (href !== '/' && pathname.startsWith(href));

    return (
        <>
            {/* Mobile backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen?.(false)}
                />
            )}

            <aside className={`
                flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out
                border-r border-[var(--border)] z-50 fixed md:relative h-screen
                bg-[var(--bg-card)] backdrop-blur-xl
                ${collapsed ? 'w-[72px]' : 'w-[240px]'}
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>

                {/* Logo */}
                <div className="h-[64px] shrink-0 flex items-center justify-between px-4 border-b border-[var(--border)]">
                    {!collapsed && (
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--ai-accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
                                <Mail className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-bold text-[14px] text-[var(--text-primary)] tracking-tight">
                                Sh_R_Mail
                            </span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-full flex justify-center">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--ai-accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
                                <Mail className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>
                    )}
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Expand toggle (when collapsed) */}
                {collapsed && (
                    <button
                        onClick={() => setCollapsed(false)}
                        className="absolute top-[76px] right-[-12px] bg-[var(--bg-card)] border border-[var(--border)] rounded-full p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-md z-30 transition-transform hover:scale-110"
                    >
                        <ChevronRight className="w-3 h-3" />
                    </button>
                )}

                {/* Workspace Switcher */}
                <div className="pt-4 pb-2">
                    <WorkspaceSwitcher collapsed={collapsed} />
                </div>

                {/* Navigation */}
                <nav className="flex-1 pb-4 px-2 overflow-y-auto space-y-4">
                    {NAV_SECTIONS.map(section => (
                        <div key={section.label}>
                            {/* Section label */}
                            {!collapsed && (
                                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] opacity-60 leading-none mt-0">
                                    {section.label}
                                </p>
                            )}
                            {collapsed && (
                                <div className="flex justify-center mb-1">
                                    <div className="w-4 h-px bg-[var(--border)]" />
                                </div>
                            )}

                            <ul className="space-y-0.5">
                                {section.items.map(item => {
                                    if (item.action && !can(user, item.action)) return null;

                                    const active = isActive(item.href);
                                    const Icon = item.icon;
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                title={collapsed ? item.name : undefined}
                                                className={`
                                                    group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
                                                    ${active
                                                        ? 'text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20'
                                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent'}
                                                    ${collapsed ? 'justify-center' : ''}
                                                `}
                                            >
                                                {active && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-[var(--accent)] to-[var(--ai-accent)] rounded-r-full" />
                                                )}
                                                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[var(--accent)]' : 'group-hover:text-[var(--text-secondary)]'}`} />
                                                {!collapsed && <span className="truncate">{item.name}</span>}
                                            </Link>

                                            {/* Settings submenu — expands inline when on /settings/* */}
                                            {item.href === '/settings' && isOnSettings && !collapsed && (
                                                <div className="mt-1 ml-3 pl-3 border-l border-[var(--border)] space-y-3">
                                                    {SETTINGS_SUB.map(sub => (
                                                        <div key={sub.label}>
                                                            <p className="px-2 mb-1 text-[9px] font-semibold tracking-widest uppercase text-[var(--text-muted)] opacity-50 leading-none">
                                                                {sub.label}
                                                            </p>
                                                            <ul className="space-y-0.5">
                                                                {sub.items.map(subItem => {
                                                                    if (subItem.action && !can(user, subItem.action)) return null;

                                                                    const subActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                                                                    const SubIcon = subItem.icon;
                                                                    return (
                                                                        <li key={subItem.href}>
                                                                            <Link
                                                                                href={subItem.href}
                                                                                className={`
                                                                                    group relative flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150
                                                                                    ${subActive
                                                                                        ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                                                                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}
                                                                                `}
                                                                            >
                                                                                <SubIcon size={13} className={`flex-shrink-0 ${subActive ? 'text-[var(--accent)]' : ''}`} />
                                                                                <span className="truncate">{subItem.label}</span>
                                                                            </Link>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}

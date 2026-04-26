'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2, CreditCard, Download, Globe, History, Key, MailCheck, MessageSquareDot, Settings, Shield, Store, User, UserPlus, Users } from 'lucide-react';
import { Badge, EmptyState, PageHeader, SectionCard, StatCard } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const CARDS = [
    { href: '/settings/profile', icon: User, title: 'Profile', description: 'Update your name, timezone, and personal account details.' },
    { href: '/settings/organization', icon: Building2, title: 'Organization', description: 'Set your company name and physical mailing address.' },
    { href: '/settings/billing', icon: CreditCard, title: 'Billing & Plan', description: 'Review your subscription, limits, and plan changes.', badge: 'Plan' },
    { href: '/settings/compliance', icon: Shield, title: 'Compliance & GDPR', description: 'Manage exports, erasure requests, and consent operations.' },
    { href: '/settings/api-keys', icon: Key, title: 'API Keys', description: 'Create and revoke credentials for product integrations.' },
    { href: '/settings/domain', icon: Globe, title: 'Sending Domain', description: 'Manage domain verification and DNS health.' },
    { href: '/settings/team', icon: Users, title: 'Team Members', description: 'Invite colleagues and govern workspace access.' },
    { href: '/settings/franchises', icon: Store, title: 'Franchise Accounts', description: 'Create and govern child workspaces without breaking tenant isolation.' },
    { href: '/settings/requests', icon: MessageSquareDot, title: 'Workspace Requests', description: 'Managers submit billing or franchise requests; owners review and approve them.' },
    { href: '/settings/audit', icon: History, title: 'Audit History', description: 'Review team, franchise, and export activity across the workspace.' },
    { href: '/settings/exports', icon: Download, title: 'Export History', description: 'Track contact exports and team member downloads from one timeline.' },
    { href: '/settings/team/requests', icon: UserPlus, title: 'Access Requests', description: 'Approve or block join requests from your corporate domain.' },
    { href: '/settings/senders', icon: MailCheck, title: 'Sender Identities', description: 'Verify FROM addresses tied to your sending domains.' },
];

export default function SettingsPage() {
    const { token } = useAuth();
    const [plan, setPlan] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_BASE}/billing/plan`, { headers: { Authorization: `Bearer ${token}` } })
            .then((response) => response.ok ? response.json() : null)
            .then((data) => { if (data) setPlan(data.plan_details?.name ?? null); })
            .catch(() => {});
    }, [token]);

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Settings"
                subtitle="Configure identity, infrastructure, billing, notifications, and workspace governance from one consistent control surface."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Settings Areas" value={CARDS.length.toString()} icon={<Settings className="h-5 w-5" />} />
                <StatCard label="Current Plan" value={plan || 'Loading'} icon={<CreditCard className="h-5 w-5" />} />
                <StatCard label="Workspace State" value="Configured" icon={<Shield className="h-5 w-5" />} />
            </div>

            <SectionCard title="Workspace Controls" description="Choose the area you want to manage. Settings are grouped by identity, infrastructure, access, and operational governance.">
                {CARDS.length === 0 ? (
                    <EmptyState title="No settings available" description="Settings modules will appear here once the workspace is configured." />
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {CARDS.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Link key={card.href} href={card.href} className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-primary)] p-5 transition hover:border-[var(--accent)]/35 hover:bg-[var(--bg-hover)]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] text-[var(--accent)]">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        {card.badge && plan ? <Badge variant="outline">{plan}</Badge> : null}
                                    </div>
                                    <h2 className="mt-4 text-base font-semibold text-[var(--text-primary)]">{card.title}</h2>
                                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{card.description}</p>
                                    <p className="mt-4 text-sm font-medium text-[var(--accent)] transition group-hover:opacity-80">Open settings</p>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </SectionCard>
        </div>
    );
}

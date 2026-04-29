'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Globe,
    Mail,
    Megaphone,
    ServerCog,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, InlineAlert, KeyValueList, PageHeader, SectionCard, StatCard, StatusBadge } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type HealthStatus = 'green' | 'yellow' | 'red';

function getHealthTone(status?: HealthStatus) {
    if (status === 'red') return 'danger';
    if (status === 'yellow') return 'warning';
    return 'success';
}

function ChecklistItem({
    isCompleted,
    title,
    description,
    href,
    actionLabel,
}: {
    isCompleted: boolean;
    title: string;
    description?: string;
    href?: string;
    actionLabel?: string;
}) {
    return (
        <div className={`rounded-[var(--radius-lg)] border p-4 transition ${isCompleted ? 'border-[var(--success-border)] bg-[var(--success-bg)]/40' : 'border-[var(--border)] bg-[var(--bg-primary)]'}`}>
            <div className="flex gap-3">
                <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${isCompleted ? 'bg-[var(--success)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)]'}`}>
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-[var(--text-muted)]/40" />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
                        {isCompleted && <Badge variant="success">Done</Badge>}
                    </div>
                    {description && <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{description}</p>}
                    {!isCompleted && href && actionLabel && (
                        <div className="mt-4">
                            <Link href={href}>
                                <Button size="sm">{actionLabel}</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { token } = useAuth();
    const [billing, setBilling] = useState<any>(null);
    const [health, setHealth] = useState<any>(null);
    const [domains, setDomains] = useState<any[]>([]);
    const [senders, setSenders] = useState<any[]>([]);
    const [contactsCount, setContactsCount] = useState(0);
    const [campaignsCount, setCampaignsCount] = useState(0);
    const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        fetch(`${API_BASE}/analytics/sender-health`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : null)).then((data) => {
            if (data) setHealth(data);
        }).catch(() => { });

        fetch(`${API_BASE}/billing/plan`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : null)).then((data) => {
            if (data) setBilling(data);
        }).catch(() => { });

        const cacheKey = `onboarding_status_${token.substring(0, 10)}`;
        const onboardingCached = localStorage.getItem(cacheKey) === 'completed';
        if (onboardingCached) {
            setIsOnboardingCompleted(true);
        }

        const fetchWithTimeout = (url: string, opts: RequestInit, ms = 5000): Promise<any> => {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), ms);
            return fetch(url, { ...opts, signal: ctrl.signal })
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
                .finally(() => clearTimeout(timer));
        };

        const headers = { Authorization: `Bearer ${token}` };
        Promise.all([
            fetchWithTimeout(`${API_BASE}/domains?limit=1`, { headers }),
            fetchWithTimeout(`${API_BASE}/senders?limit=1`, { headers }),
            fetchWithTimeout(`${API_BASE}/contacts/stats`, { headers }),
            fetchWithTimeout(`${API_BASE}/campaigns?limit=1`, { headers }),
        ]).then(([domainsData, sendersData, contactsData, campaignsData]) => {
            const doms = domainsData?.data || [];
            const snds = sendersData?.data || [];
            const contCount = contactsData?.total_contacts || 0;
            const campCount = campaignsData?.meta?.total || 0;

            setDomains(doms);
            setSenders(snds);
            setContactsCount(contCount);
            setCampaignsCount(campCount);

            const checkHasDomain = doms.some((d: any) => d.status === 'verified');
            const checkHasSender = snds.some((s: any) => s.status === 'verified');
            const checkSteps = 1 + (checkHasDomain ? 1 : 0) + (checkHasSender ? 1 : 0) + (contCount > 0 ? 1 : 0) + (campCount > 0 ? 1 : 0);

            if (checkSteps === 5) {
                localStorage.setItem(cacheKey, 'completed');
                setIsOnboardingCompleted(true);
            } else if (!onboardingCached) {
                setIsOnboardingCompleted(false);
            }
        }).catch((err) => {
            console.error('Failed to load dashboard data', err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, [token]);

    const hasDomain = domains.some((d) => d.status === 'verified');
    const hasSender = senders.some((s) => s.status === 'verified');
    const hasContacts = contactsCount > 0;
    const hasCampaigns = campaignsCount > 0;
    const completedSteps = 1 + (hasDomain ? 1 : 0) + (hasSender ? 1 : 0) + (hasContacts ? 1 : 0) + (hasCampaigns ? 1 : 0);
    const totalSteps = 5;
    const progressPercent = Math.round((completedSteps / totalSteps) * 100);

    const isNearQuota = useMemo(() => {
        if (!billing) return false;
        const limit = billing.plan_details.max_monthly_emails;
        const used = billing.usage.emails_sent_this_cycle;
        if (!limit || limit === 0) return false;
        return (used / limit) >= 0.8;
    }, [billing]);

    const summaryMetrics = [
        { label: 'Contacts', value: contactsCount.toLocaleString(), icon: <Users className="h-4 w-4" /> },
        { label: 'Campaigns', value: campaignsCount.toLocaleString(), icon: <Megaphone className="h-4 w-4" /> },
        { label: 'Verified Domains', value: domains.filter((d) => d.status === 'verified').length, icon: <Globe className="h-4 w-4" /> },
        { label: 'Verified Senders', value: senders.filter((s) => s.status === 'verified').length, icon: <Mail className="h-4 w-4" /> },
    ];

    const quickLinks = [
        {
            title: 'Campaign Workspace',
            description: 'Create, schedule, and monitor sends without leaving the production flow.',
            href: '/campaigns',
            icon: Megaphone,
        },
        {
            title: 'Contacts Engine',
            description: 'Import audiences, review suppressions, and improve list quality.',
            href: '/contacts',
            icon: Users,
        },
        {
            title: 'Analytics',
            description: 'Check throughput, bounce trends, and recent delivery issues.',
            href: '/analytics',
            icon: BarChart3,
        },
        {
            title: 'Infrastructure',
            description: 'Verify domains, manage keys, and keep compliance in order.',
            href: '/infrastructure',
            icon: ServerCog,
        },
    ];

    return (
        <div className="space-y-8 pb-8">
            {isNearQuota && billing && (
                <InlineAlert
                    variant="warning"
                    title="Approaching monthly limit"
                    description={`You have used ${(billing.usage.emails_sent_this_cycle / billing.plan_details.max_monthly_emails * 100).toFixed(0)}% of your monthly send capacity on the ${billing.plan_details.name} plan.`}
                    icon={<AlertTriangle className="mt-0.5 h-5 w-5" />}
                    action={<Link href="/settings/billing"><Button variant="secondary" size="sm">Review billing</Button></Link>}
                />
            )}

            <PageHeader
                title={isOnboardingCompleted ? 'Operational Overview' : 'Set up your workspace'}
                subtitle={isOnboardingCompleted
                    ? 'A calm summary of sending health, audience readiness, and infrastructure posture.'
                    : 'Complete the core setup tasks once so campaigns, analytics, and infrastructure stay aligned.'}
                action={
                    isOnboardingCompleted ? (
                        <div className="flex gap-3">
                            <Link href="/campaigns/new">
                                <Button>New campaign</Button>
                            </Link>
                            <Link href="/analytics">
                                <Button variant="outline">View analytics</Button>
                            </Link>
                        </div>
                    ) : (
                        <Badge variant="accent">{progressPercent}% complete</Badge>
                    )
                }
            />

            {isOnboardingCompleted && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryMetrics.map((metric) => (
                        <StatCard key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} />
                    ))}
                </div>
            )}

            {!isOnboardingCompleted && (
                <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
                    <div className="rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--bg-card)] p-6">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">Launch readiness</p>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">
                                    The first five steps create the minimum viable operating posture for ShrFlow.
                                </p>
                            </div>
                            <div className="min-w-[120px]">
                                <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                                    <span>{completedSteps}/{totalSteps} complete</span>
                                    <span>{progressPercent}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                                    <div className="h-full bg-[var(--accent)] transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <ChecklistItem isCompleted title="Workspace created" />
                            <ChecklistItem isCompleted={hasDomain} title={hasDomain ? 'Domain verified' : 'Authenticate your sending domain'} description="Improve deliverability and unlock branded sending by verifying DNS records." href="/settings/domain" actionLabel="Verify domain" />
                            <ChecklistItem isCompleted={hasSender} title={hasSender ? 'Sender identity verified' : 'Verify a sender identity'} description="Protect against spoofing and confirm who can send from your workspace." href="/settings/senders" actionLabel="Verify sender" />
                            <ChecklistItem isCompleted={hasContacts} title={hasContacts ? 'Audience imported' : 'Import your audience'} description="Bring in contacts so segmentation, suppressions, and delivery safeguards can start working." href="/contacts" actionLabel="Import contacts" />
                            <ChecklistItem isCompleted={hasCampaigns} title={hasCampaigns ? 'First campaign created' : 'Create your first campaign'} description="Use a template, select a segment, and run a preflight before sending." href="/campaigns/new" actionLabel="Create campaign" />
                        </div>
                    </div>

                    <SectionCard
                        title="What this unlocks"
                        description="The first completed setup steps unlock safer sending, better diagnostics, and stronger delivery posture."
                        action={<Sparkles className="h-4 w-4 text-[var(--ai-accent)]" />}
                    >
                        <div className="space-y-4 text-sm leading-6 text-[var(--text-muted)]">
                            <p>Verified infrastructure raises inbox trust and keeps analytics meaningful.</p>
                            <p>Imported contacts feed the segmentation and suppression engine from day one.</p>
                            <p>Your first campaign becomes the baseline for future deliverability and performance insights.</p>
                        </div>
                        <div className="mt-6">
                            <KeyValueList
                                columns={1}
                                items={[
                                    { label: 'Recommended order', value: '1. Verify domain', helper: '2. Verify sender  3. Import contacts  4. Create campaign' },
                                ]}
                            />
                        </div>
                    </SectionCard>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <SectionCard
                    title="Product Areas"
                    description="Each area stays focused, but the dashboard keeps the whole platform legible."
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        {quickLinks.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href} className="group rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-5 transition hover:border-[var(--accent-border)] hover:bg-[var(--bg-hover)]">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{item.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
                                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                                        Open
                                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </SectionCard>

                <SectionCard
                    title="Sender Health"
                    action={
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
                            {health?.overall && (
                                <Badge variant={getHealthTone(health.overall as HealthStatus) as 'success' | 'warning' | 'danger'}>
                                    {health.overall === 'green' ? 'Healthy' : health.overall === 'yellow' ? 'Watch' : 'At Risk'}
                                </Badge>
                            )}
                        </div>
                    }
                >
                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="h-16 animate-pulse rounded-[var(--radius)] bg-[var(--bg-secondary)]" />
                            <div className="h-16 animate-pulse rounded-[var(--radius)] bg-[var(--bg-secondary)]" />
                            <div className="h-16 animate-pulse rounded-[var(--radius)] bg-[var(--bg-secondary)]" />
                        </div>
                    ) : health?.health ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4 text-sm">
                                <div>
                                    <p className="text-[var(--text-muted)]">Sent</p>
                                    <p className="mt-1 font-semibold text-[var(--text-primary)]">{health?.sent?.toLocaleString() ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[var(--text-muted)]">Opens</p>
                                    <p className="mt-1 font-semibold text-[var(--text-primary)]">{health?.opens?.toLocaleString() ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[var(--text-muted)]">Clicks</p>
                                    <p className="mt-1 font-semibold text-[var(--text-primary)]">{health?.clicks?.toLocaleString() ?? '—'}</p>
                                </div>
                            </div>

                            {[
                                { label: 'Bounce Rate', value: health.rates.bounce_rate, status: health.health.bounce.status as HealthStatus, target: 'Target under 2%' },
                                { label: 'Spam Rate', value: health.rates.spam_rate, status: health.health.spam.status as HealthStatus, target: 'Keep below 0.1%' },
                                { label: 'Open Rate', value: health.rates.open_rate, status: health.health.open.status as HealthStatus, target: 'Healthy above 20%' },
                            ].map((item) => (
                                <div key={item.label} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">{item.target}</p>
                                        </div>
                                        <Badge variant={getHealthTone(item.status) as 'success' | 'warning' | 'danger'}>{item.value.toFixed(1)}%</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--bg-primary)] p-6 text-center">
                            <p className="text-sm text-[var(--text-muted)]">Send your first campaign to unlock sender health diagnostics.</p>
                        </div>
                    )}
                </SectionCard>
            </div>

            {isOnboardingCompleted && (
                <SectionCard
                    title="Current Operating Posture"
                    action={<Activity className="h-4 w-4 text-[var(--ai-accent)]" />}
                >
                    <div className="flex flex-wrap gap-3">
                        <StatusBadge status={hasDomain ? 'verified' : 'pending'} />
                        <StatusBadge status={hasSender ? 'active' : 'pending'} />
                        <Badge variant={hasContacts ? 'success' : 'warning'}>{hasContacts ? 'Audience loaded' : 'Audience missing'}</Badge>
                        <Badge variant={hasCampaigns ? 'success' : 'info'}>{hasCampaigns ? 'Campaigns created' : 'No campaigns yet'}</Badge>
                    </div>
                </SectionCard>
            )}
        </div>
    );
}

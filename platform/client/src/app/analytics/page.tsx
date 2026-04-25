'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, ArrowRight, BarChart3, Mail, MousePointer, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, EmptyState, InlineAlert, PageHeader, SectionCard, StatCard } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function formatPercent(value: number) {
    return `${value.toFixed(1)}%`;
}

export default function AnalyticsPage() {
    const { token } = useAuth();
    const [health, setHealth] = useState<any>(null);
    const [eventsSummary, setEventsSummary] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [campaignMeta, setCampaignMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const load = async () => {
        if (!token) return;
        setLoading(true);
        setLoadError('');
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [healthRes, eventsRes, campaignsRes] = await Promise.all([
                fetch(`${API_BASE}/analytics/sender-health`, { headers }),
                fetch(`${API_BASE}/events/summary`, { headers }),
                fetch(`${API_BASE}/campaigns/?page=1&limit=10`, { headers }),
            ]);

            const [healthJson, eventsJson, campaignsJson] = await Promise.all([
                healthRes.ok ? healthRes.json() : null,
                eventsRes.ok ? eventsRes.json() : null,
                campaignsRes.ok ? campaignsRes.json() : null,
            ]);

            setHealth(healthJson);
            setEventsSummary(eventsJson);
            setCampaigns(campaignsJson?.campaigns || []);
            setCampaignMeta(campaignsJson?.meta || null);
        } catch (error) {
            console.error(error);
            setLoadError('Failed to load analytics summary.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [token]);

    const sent = Number(health?.sent || 0);
    const opens = Number(health?.opens || 0);
    const clicks = Number(health?.clicks || 0);
    const bounces = Number(health?.bounces || 0);
    const spam = Number(health?.spam || 0);
    const totalDispatch = Number(eventsSummary?.total || 0);
    const delivered = Number(eventsSummary?.sent || 0);
    const failed = Number(eventsSummary?.failed || 0);
    const pending = Number(eventsSummary?.pending || 0);
    
    // Safety caps for rates
    const clickRate = sent > 0 ? Math.min((clicks / sent) * 100, 100) : 0;
    const deliveryRate = totalDispatch > 0 ? Math.min((delivered / totalDispatch) * 100, 100) : 0;
    const bounceRate = sent > 0 ? Math.min(Number(health?.rates?.bounce_rate || 0), 100) : 0;
    const openRate = sent > 0 ? Math.min(Number(health?.rates?.open_rate || 0), 100) : 0;
    
    const campaignsTotal = Number(campaignMeta?.total || 0);

    const summaryMetrics = [
        { label: 'Delivered', value: delivered.toLocaleString(), trend: Math.round(deliveryRate), trendLabel: 'delivery rate', icon: <Activity className="h-5 w-5" /> },
        { label: 'Bounces', value: bounces.toLocaleString(), trend: Math.round(bounceRate), trendLabel: 'bounce rate', icon: <AlertTriangle className="h-5 w-5" /> },
        { label: 'Unique Opens', value: opens.toLocaleString(), trend: Math.round(openRate), trendLabel: 'open rate', icon: <Mail className="h-5 w-5" /> },
        { label: 'Clicks', value: clicks.toLocaleString(), trend: Math.round(clickRate), trendLabel: 'click rate', icon: <MousePointer className="h-5 w-5" /> },
    ];

    const liveAlerts = useMemo(() => {
        const alerts: { tone: 'warning' | 'danger' | 'info' | 'success'; text: string }[] = [];

        if (bounceRate > 2) {
            alerts.push({ tone: 'warning', text: `Bounce rate is high (${formatPercent(bounceRate)}) and should stay under 2%.` });
        }
        if (pending > 0) {
            alerts.push({ tone: 'info', text: `${pending.toLocaleString()} dispatches are still queued or processing.` });
        }
        if (campaignsTotal === 0) {
            alerts.push({ tone: 'info', text: 'No campaigns have been created yet, so analytics are still sparse.' });
        }
        if (sent > 0 && openRate === 0) {
            alerts.push({ tone: 'warning', text: 'Messages were sent, but open tracking has not produced human opens yet.' });
        }
        if (alerts.length === 0) {
            alerts.push({ tone: 'success', text: 'No urgent deliverability issues detected in the current workspace summary.' });
        }

        return alerts;
    }, [bounceRate, pending, campaignsTotal, sent, openRate]);

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Analytics"
                subtitle="A live command view for performance, deliverability, and engagement."
                action={
                    <Button variant="secondary" onClick={load}>
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                }
            />

            {loadError && (
                <InlineAlert
                    variant="danger"
                    title="Analytics unavailable"
                    description={loadError}
                />
            )}

            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-32 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)]" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryMetrics.map((metric) => (
                        <StatCard
                            key={metric.label}
                            label={metric.label}
                            value={metric.value}
                            trend={metric.trend}
                            trendLabel={metric.trendLabel}
                            icon={metric.icon}
                        />
                    ))}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <div className="space-y-6">
                    <SectionCard
                        title="Recent Campaigns"
                        description="Click a campaign to view its detailed delivery and engagement report."
                    >
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-12 animate-pulse rounded-[var(--radius)] bg-[var(--bg-primary)]" />
                                ))}
                            </div>
                        ) : campaigns.length > 0 ? (
                            <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)]">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[var(--bg-muted)] text-[var(--text-muted)]">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Campaign</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-card)]">
                                        {campaigns.map((camp) => (
                                            <tr key={camp.id} className="group hover:bg-[var(--bg-hover)]">
                                                <td className="px-4 py-4">
                                                    <Link href={`/campaigns/${camp.id}/analytics`} className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)]">
                                                        {camp.name}
                                                        <span className="block text-xs font-normal text-[var(--text-muted)]">{camp.subject}</span>
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge variant={
                                                        camp.status === 'sent' ? 'success' : 
                                                        camp.status === 'sending' ? 'info' : 
                                                        camp.status === 'paused' ? 'warning' : 'default'
                                                    }>
                                                        {camp.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-[var(--text-muted)]">
                                                    {new Date(camp.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <Link href={`/campaigns/${camp.id}/analytics`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--accent)]">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-[var(--text-muted)]">
                                No campaigns found. Send a campaign to see data here.
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Analytics Areas"
                        description="Jump into the right level of detail for platform-wide metrics."
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <Link
                                href="/reports"
                                className="group rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-5 transition hover:border-[var(--accent-border)] hover:bg-[var(--bg-hover)]"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-semibold text-[var(--text-primary)]">Overview Reports</h3>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                                    Review workspace-level throughput across {campaignsTotal.toLocaleString()} campaigns.
                                </p>
                                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                                    Open
                                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                </div>
                            </Link>

                            <Link
                                href="/events"
                                className="group rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-5 transition hover:border-[var(--accent-border)] hover:bg-[var(--bg-hover)]"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-semibold text-[var(--text-primary)]">Delivery Events</h3>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                                    Inspect {totalDispatch.toLocaleString()} total dispatch rows, including failed deliveries.
                                </p>
                                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                                    Open
                                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                </div>
                            </Link>
                        </div>
                    </SectionCard>
                </div>

                <div className="space-y-6">
                    <SectionCard
                        title="Status Signals"
                        action={
                            !loading && health?.overall ? (
                                <Badge variant={health.overall === 'green' ? 'success' : health.overall === 'yellow' ? 'warning' : 'danger'}>
                                    {health.overall === 'green' ? 'Healthy' : health.overall === 'yellow' ? 'Watch' : 'At Risk'}
                                </Badge>
                            ) : null
                        }
                    >
                        {loading ? (
                            <div className="space-y-4">
                                <div className="h-20 animate-pulse rounded-[var(--radius)] bg-[var(--bg-primary)]" />
                                <div className="h-20 animate-pulse rounded-[var(--radius)] bg-[var(--bg-primary)]" />
                            </div>
                        ) : liveAlerts.length > 0 ? (
                            <div className="space-y-4">
                                {liveAlerts.map((alert, index) => (
                                    <InlineAlert
                                        key={`${alert.text}-${index}`}
                                        variant={alert.tone}
                                        description={alert.text}
                                    />
                                ))}

                                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                        <MousePointer className="h-4 w-4 text-[var(--ai-accent)]" />
                                        Recommended next move
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                                        Click a campaign in the list to see its individual performance metrics.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                title="No analytics yet"
                                description="Send a campaign to start seeing live performance and deliverability signals here."
                            />
                        )}
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}

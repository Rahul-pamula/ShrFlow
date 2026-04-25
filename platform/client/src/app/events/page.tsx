'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Loader2, RefreshCw, Send, XCircle, Zap } from 'lucide-react';
import { Badge, Button, EmptyState, PageHeader, SectionCard, StatCard, TableToolbar, useToast } from '@/components/ui';

const API_BASE = 'http://127.0.0.1:8000';

function timeAgo(ts: string) {
    if (!ts) return '—';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function EventsPage() {
    const { token } = useAuth();
    const { error } = useToast();
    const [summary, setSummary] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [dispatchMap, setDispatchMap] = useState<Record<string, any[]>>({});
    const [dispatchLoading, setDispatchLoading] = useState<string | null>(null);

    const load = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [sumRes, campRes] = await Promise.all([
                fetch(`${API_BASE}/events/summary`, { headers }),
                fetch(`${API_BASE}/campaigns/?page=1&limit=50`, { headers }),
            ]);
            if (sumRes.ok) setSummary(await sumRes.json());
            if (campRes.ok) {
                const payload = await campRes.json();
                setCampaigns(payload.campaigns || []);
            }
        } catch (loadError) {
            console.error(loadError);
            error('Failed to load delivery activity.');
        } finally {
            setLoading(false);
        }
    };

    const loadDispatch = async (campaignId: string) => {
        if (dispatchMap[campaignId] || !token) return;
        setDispatchLoading(campaignId);
        try {
            const res = await fetch(`${API_BASE}/campaigns/${campaignId}/dispatch`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const payload = await res.json();
            setDispatchMap((current) => ({ ...current, [campaignId]: payload.data || [] }));
        } catch (dispatchError) {
            console.error(dispatchError);
            error('Failed to load dispatch details.');
        } finally {
            setDispatchLoading(null);
        }
    };

    const toggleExpand = async (id: string) => {
        if (expanded === id) {
            setExpanded(null);
            return;
        }
        setExpanded(id);
        await loadDispatch(id);
    };

    useEffect(() => { load(); }, [token]);

    const statCards = summary ? [
        { label: 'Total Emails', value: (summary.total ?? 0).toLocaleString(), icon: <Zap className="h-5 w-5" /> },
        { label: 'Delivered', value: (summary.sent ?? 0).toLocaleString(), icon: <Send className="h-5 w-5" /> },
        { label: 'Failed', value: (summary.failed ?? 0).toLocaleString(), icon: <XCircle className="h-5 w-5" /> },
        { label: 'Queued', value: (summary.pending ?? 0).toLocaleString(), icon: <Clock className="h-5 w-5" /> },
    ] : [];

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Events"
                subtitle="Review campaign delivery activity, inspect failed recipients, and keep dispatch behavior visible without opening every campaign individually."
                action={<Button variant="secondary" onClick={load}><RefreshCw className="h-4 w-4" />Refresh</Button>}
            />

            {summary && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((card) => (
                        <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} />
                    ))}
                </div>
            )}

            <SectionCard title="Campaign Delivery Activity" description="Expand a campaign to inspect recent failed deliveries and queue behavior.">
                <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)]">
                    <TableToolbar
                        title="Recent Campaigns"
                        description="Activity is derived from dispatch rows and campaign status so you can quickly investigate delivery issues."
                        trailing={<Badge variant="outline">{campaigns.length} campaigns</Badge>}
                        className="rounded-none border-0 border-b border-[var(--border)]"
                    />

                    {loading ? (
                        <div className="p-12 text-center text-sm text-[var(--text-muted)]">Loading delivery activity...</div>
                    ) : campaigns.length === 0 ? (
                        <EmptyState
                            icon={<Zap className="h-10 w-10" />}
                            title="No campaigns yet"
                            description="Launch a campaign to start seeing delivery activity here."
                        />
                    ) : (
                        <div className="divide-y divide-[var(--border)]">
                            {campaigns.map((campaign) => {
                                const rows = dispatchMap[campaign.id] || [];
                                const delivered = rows.filter((row: any) => row.status === 'DISPATCHED').length;
                                const failed = rows.filter((row: any) => row.status === 'FAILED').length;
                                const pending = rows.filter((row: any) => ['PENDING', 'PROCESSING'].includes(row.status)).length;
                                const isExpanded = expanded === campaign.id;
                                const isLoadingThis = dispatchLoading === campaign.id;
                                const statusVariant = campaign.status === 'sent' ? 'success' : campaign.status === 'sending' ? 'info' : campaign.status === 'paused' ? 'warning' : 'outline';

                                return (
                                    <div key={campaign.id}>
                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(campaign.id)}
                                            className="grid w-full grid-cols-[minmax(0,2fr)_120px_90px_90px_90px_110px_40px] items-center gap-3 px-5 py-4 text-left transition hover:bg-[var(--bg-hover)]"
                                        >
                                            <div>
                                                <Link href={`/campaigns/${campaign.id}`} onClick={(e) => e.stopPropagation()} className="text-sm font-medium text-[var(--accent)] transition hover:opacity-80">
                                                    {campaign.name}
                                                </Link>
                                                <p className="mt-1 text-xs text-[var(--text-muted)]">{campaign.subject}</p>
                                            </div>
                                            <Badge variant={statusVariant as any}>{campaign.status}</Badge>
                                            <span className="text-sm font-medium text-[var(--success)]">{isLoadingThis ? '…' : rows.length ? delivered.toLocaleString() : '—'}</span>
                                            <span className={`text-sm ${failed > 0 ? 'font-medium text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>{isLoadingThis ? '…' : rows.length ? failed.toLocaleString() : '—'}</span>
                                            <span className={`text-sm ${pending > 0 ? 'font-medium text-[var(--warning)]' : 'text-[var(--text-muted)]'}`}>{isLoadingThis ? '…' : rows.length ? pending.toLocaleString() : '—'}</span>
                                            <span className="text-sm text-[var(--text-muted)]">{timeAgo(campaign.updated_at || campaign.created_at)}</span>
                                            <span className="flex justify-center text-[var(--text-muted)]">{isLoadingThis ? <Loader2 className="h-4 w-4 animate-spin" /> : isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
                                        </button>

                                        {isExpanded && rows.length > 0 && (
                                            <div className="border-t border-[var(--border)] bg-[var(--bg-hover)] px-6 py-4">
                                                <div className="mb-3 flex flex-wrap gap-4 text-xs">
                                                    <span className="text-[var(--success)]">Delivered: {delivered}</span>
                                                    <span className="text-[var(--danger)]">Failed: {failed}</span>
                                                    <span className="text-[var(--warning)]">Queued: {pending}</span>
                                                    <span className="text-[var(--text-muted)]">Total recipients: {rows.length}</span>
                                                </div>
                                                {failed > 0 ? (
                                                    <div className="space-y-2">
                                                        {rows.filter((row: any) => row.status === 'FAILED').slice(0, 5).map((row: any) => (
                                                            <div key={row.id} className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--danger-border)] bg-[var(--danger-bg)]/40 px-3 py-2 text-sm">
                                                                <XCircle className="mt-0.5 h-4 w-4 text-[var(--danger)]" />
                                                                <div>
                                                                    <p className="font-medium text-[var(--text-primary)]">Recipient {row.subscriber_id}</p>
                                                                    <p className="text-[var(--danger)]">{row.error_log || 'Unknown delivery error'}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--success-border)] bg-[var(--success-bg)]/40 px-3 py-2 text-sm text-[var(--success)]">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        All emails delivered successfully.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SectionCard>
        </div>
    );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, History, Shield, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, PageHeader, SectionCard, StatCard, TableToolbar, useToast } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type AuditFilter = 'all' | 'team.' | 'franchise.';

interface AuditActor {
    user_id?: string | null;
    email?: string | null;
    full_name?: string | null;
}

interface AuditEntry {
    id: string;
    action: string;
    user_id?: string | null;
    resource_type?: string | null;
    resource_id?: string | null;
    metadata?: Record<string, unknown> | null;
    created_at: string;
    actor?: AuditActor | null;
}

const FILTERS: Array<{ label: string; value: AuditFilter }> = [
    { label: 'All Activity', value: 'all' },
    { label: 'Team Actions', value: 'team.' },
    { label: 'Franchise Actions', value: 'franchise.' },
];

function summarizeAction(action: string) {
    switch (action) {
        case 'team.invite_sent':
            return 'Invitation sent';
        case 'team.invite_resent':
            return 'Invitation resent';
        case 'team.invite_canceled':
            return 'Invitation canceled';
        case 'team.invite_accepted':
            return 'Invitation accepted';
        case 'team.member_removed':
            return 'Member removed';
        case 'team.member_left':
            return 'Member left workspace';
        case 'team.member_updated':
            return 'Member permissions updated';
        case 'team.ownership_transferred':
            return 'Ownership transferred';
        case 'team.export':
            return 'Team members exported';
        case 'franchise.created':
            return 'Franchise created';
        case 'franchise.suspended':
            return 'Franchise suspended';
        case 'franchise.reactivated':
            return 'Franchise reactivated';
        case 'franchise.deleted':
            return 'Franchise deleted';
        default:
            return action;
    }
}

export default function AuditHistoryPage() {
    const { token } = useAuth();
    const { error } = useToast();

    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<AuditFilter>('all');

    useEffect(() => {
        if (token) fetchAuditHistory(filter);
    }, [token, filter]);

    const fetchAuditHistory = async (nextFilter: AuditFilter) => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (nextFilter !== 'all') params.set('action_prefix', nextFilter);
            const res = await fetch(`${API_BASE}/settings/audit?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to load audit history.');
            }
            const data = await res.json();
            setEntries(data.data || []);
        } catch (fetchError: any) {
            console.error(fetchError);
            error(fetchError.message || 'Could not load audit history.');
        } finally {
            setLoading(false);
        }
    };

    const metrics = useMemo(() => ([
        { label: 'Audit Events', value: entries.length.toString(), icon: <History className="h-5 w-5" /> },
        { label: 'Team Events', value: entries.filter((entry) => entry.action.startsWith('team.')).length.toString(), icon: <Users className="h-5 w-5" /> },
        { label: 'Franchise Events', value: entries.filter((entry) => entry.action.startsWith('franchise.')).length.toString(), icon: <Shield className="h-5 w-5" /> },
    ]), [entries]);

    const handleExportAudit = () => {
        const header = ['Timestamp', 'Action', 'Actor', 'Resource Type', 'Resource ID'];
        const rows = entries.map((entry) => [
            entry.created_at,
            entry.action,
            entry.actor?.full_name || entry.actor?.email || 'Unknown actor',
            entry.resource_type || '',
            entry.resource_id || '',
        ]);
        const csv = [header, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'workspace_audit_history.csv';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return <div className="p-12 text-sm text-[var(--text-muted)]">Loading audit history...</div>;
    }

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Audit History"
                subtitle="Review team, franchise, and export activity so workspace governance stays visible and traceable."
                action={
                    <Button variant="secondary" onClick={handleExportAudit} disabled={!entries.length}>
                        <Download className="h-4 w-4" />
                        Export Audit
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {metrics.map((metric) => (
                    <StatCard key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} />
                ))}
            </div>

            <SectionCard title="Governance Events" description="This feed is append-only history for team administration, franchise lifecycle, and team export actions.">
                <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)]">
                    <TableToolbar
                        title="Workspace Audit Trail"
                        description="Use filters to narrow the feed down to team or franchise activity."
                        trailing={
                            <div className="flex flex-wrap gap-2">
                                {FILTERS.map((option) => (
                                    <Button
                                        key={option.value}
                                        variant={filter === option.value ? 'primary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setFilter(option.value)}
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        }
                        className="rounded-none border-0 border-b border-[var(--border)]"
                    />

                    <div className="divide-y divide-[var(--border)]">
                        {entries.length === 0 ? (
                            <div className="p-6 text-sm text-[var(--text-muted)]">No audit events available for this filter.</div>
                        ) : (
                            entries.map((entry) => (
                                <div key={entry.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{summarizeAction(entry.action)}</p>
                                            <Badge variant="outline">{entry.action}</Badge>
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            {entry.actor?.full_name || entry.actor?.email || 'Unknown actor'}
                                        </p>
                                        {entry.resource_type && (
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {entry.resource_type}{entry.resource_id ? ` • ${entry.resource_id}` : ''}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)]">
                                        {new Date(entry.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}

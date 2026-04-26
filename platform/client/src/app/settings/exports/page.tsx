'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock3, Download, FileDown, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, PageHeader, SectionCard, StatCard, TableToolbar, useToast } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface ExportActor {
    user_id?: string | null;
    email?: string | null;
    full_name?: string | null;
}

interface ExportHistoryItem {
    id: string;
    kind: 'team_members' | 'contacts';
    status: string;
    progress?: number;
    created_at: string;
    updated_at?: string;
    download_url?: string | null;
    actor?: ExportActor | null;
    meta?: Record<string, unknown>;
}

function kindLabel(kind: ExportHistoryItem['kind']) {
    return kind === 'team_members' ? 'Team Members' : 'Contacts';
}

export default function ExportHistoryPage() {
    const { token } = useAuth();
    const { error, success, warning } = useToast();

    const [entries, setEntries] = useState<ExportHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) fetchExportHistory();
    }, [token]);

    const fetchExportHistory = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/settings/exports/history?limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to load export history.');
            }
            const data = await res.json();
            setEntries(data.data || []);
        } catch (fetchError: any) {
            console.error(fetchError);
            error(fetchError.message || 'Could not load export history.');
        } finally {
            setLoading(false);
        }
    };

    const metrics = useMemo(() => ([
        { label: 'Exports', value: entries.length.toString(), icon: <FileDown className="h-5 w-5" /> },
        { label: 'Team Exports', value: entries.filter((entry) => entry.kind === 'team_members').length.toString(), icon: <Users className="h-5 w-5" /> },
        { label: 'Contact Jobs', value: entries.filter((entry) => entry.kind === 'contacts').length.toString(), icon: <Clock3 className="h-5 w-5" /> },
    ]), [entries]);

    const handleDownload = (entry: ExportHistoryItem) => {
        if (entry.kind === 'team_members') {
            warning('Team member exports download immediately from the Team Members page. This history entry confirms the export event.');
            return;
        }
        if (!entry.download_url) {
            warning('This export is not ready yet.');
            return;
        }
        const anchor = document.createElement('a');
        anchor.href = entry.download_url;
        anchor.target = '_blank';
        anchor.rel = 'noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        success('Opening export download.');
    };

    if (loading) {
        return <div className="p-12 text-sm text-[var(--text-muted)]">Loading export history...</div>;
    }

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Export History"
                subtitle="Track team member exports and contact export jobs from one workspace-level timeline."
                action={<Button variant="secondary" onClick={fetchExportHistory}>Refresh</Button>}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {metrics.map((metric) => (
                    <StatCard key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} />
                ))}
            </div>

            <SectionCard title="Workspace Export Timeline" description="This combines immediate team exports with background contact export jobs so export activity stays visible in one place.">
                <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)]">
                    <TableToolbar
                        title="Recent Exports"
                        description="Completed team exports appear instantly; contact exports show job state and download readiness."
                        trailing={<Badge variant="outline">{entries.length} items</Badge>}
                        className="rounded-none border-0 border-b border-[var(--border)]"
                    />

                    <div className="divide-y divide-[var(--border)]">
                        {entries.length === 0 ? (
                            <div className="p-6 text-sm text-[var(--text-muted)]">No exports have been recorded yet.</div>
                        ) : (
                            entries.map((entry) => (
                                <div key={entry.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{kindLabel(entry.kind)}</p>
                                            <Badge variant={entry.status === 'completed' ? 'success' : entry.status === 'failed' ? 'danger' : 'outline'}>
                                                {entry.status}
                                            </Badge>
                                            {entry.kind === 'contacts' && typeof entry.progress === 'number' && entry.status !== 'completed' && (
                                                <Badge variant="outline">{entry.progress}%</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            {entry.actor?.full_name || entry.actor?.email || (entry.kind === 'contacts' ? 'Background contact export' : 'Workspace export')}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Created {new Date(entry.created_at).toLocaleString()}
                                        </p>
                                        {entry.kind === 'team_members' && entry.meta?.count !== undefined && (
                                            <p className="text-xs text-[var(--text-muted)]">Rows exported: {String(entry.meta.count)}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownload(entry)}
                                            disabled={entry.kind === 'contacts' && !entry.download_url}
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            {entry.kind === 'team_members' ? 'View Info' : 'Download'}
                                        </Button>
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

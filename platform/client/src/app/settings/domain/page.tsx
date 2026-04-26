"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Copy, Plus, Activity, RefreshCw, Globe, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { can } from '@/utils/permissions';
import { useRouter } from 'next/navigation';
import { useToast, Badge, Button, ConfirmModal, EmptyState, InlineAlert, InspectorPanel, KeyValueList, PageHeader, SectionCard, StatCard } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function CodeRow({ value, onCopy }: { value: string; onCopy: (value: string) => void }) {
    return (
        <div className="flex min-w-[180px] items-start justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-hover)] px-3 py-2 font-mono text-xs leading-5 text-[var(--text-primary)]">
            <span className="min-w-0 break-all whitespace-pre-wrap">{value}</span>
            <button
                onClick={() => onCopy(value)}
                className="flex-shrink-0 rounded-[var(--radius)] p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
            >
                <Copy className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

function DnsTable({
    rows,
    includePriority = false,
    onCopy,
}: {
    rows: Array<{ type: string; host: string; value: string; priority?: string }>;
    includePriority?: boolean;
    onCopy: (value: string) => void;
}) {
    return (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-primary)]">
            <table className="min-w-[760px] w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Host / Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Value / Target</th>
                        {includePriority && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Priority</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={`${row.type}-${row.host}-${index}`} className="border-b border-[var(--border)] last:border-b-0">
                            <td className="whitespace-nowrap px-4 py-4 text-[var(--text-primary)]">{row.type}</td>
                            <td className="px-4 py-4 align-top"><CodeRow value={row.host} onCopy={onCopy} /></td>
                            <td className="px-4 py-4 align-top"><CodeRow value={row.value} onCopy={onCopy} /></td>
                            {includePriority && <td className="whitespace-nowrap px-4 py-4 text-[var(--text-primary)]">{row.priority ?? '-'}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function DomainSettingsPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const { success, error, info } = useToast();

    useEffect(() => {
        if (user && !can(user, 'VIEW_DOMAIN')) {
            router.replace('/dashboard');
        }
    }, [user, router]);
    const [domains, setDomains] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [adding, setAdding] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<any>(null);
    const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

    useEffect(() => {
        if (token) fetchDomains();
    }, [token]);

    const fetchDomains = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/domains/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const nextDomains = data.data || [];
                setDomains(nextDomains);
                setSelectedDomain((current: any) => current ? nextDomains.find((entry: any) => entry.id === current.id) || nextDomains[0] || null : nextDomains[0] || null);
            }
        } catch {
            error('Failed to load domains');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain.includes('.')) {
            error("Please enter a valid domain (e.g., example.com)");
            return;
        }
        setAdding(true);
        try {
            const res = await fetch(`${API_BASE}/domains/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ domain_name: newDomain.toLowerCase() }),
            });
            const data = await res.json();
            if (res.ok) {
                success('Domain registered with AWS');
                setShowAddModal(false);
                setNewDomain('');
                await fetchDomains();
                setSelectedDomain(data.data);
            } else {
                error(data.detail || 'Failed to add domain');
            }
        } catch {
            error('Network error');
        } finally {
            setAdding(false);
        }
    };

    const handleVerify = async (domain: any) => {
        info('Checking DNS records globally...');
        try {
            const res = await fetch(`${API_BASE}/domains/${domain.id}/verify`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                if (data.verification_status === 'verified') {
                    success('Domain verified successfully');
                } else if (data.verification_status === 'failed') {
                    error('AWS rejected the records. Check your DNS.');
                } else {
                    info('Records not found yet. DNS propagation can take time.');
                }
                await fetchDomains();
            } else {
                error(data.detail || 'Verification error');
            }
        } catch {
            error('Network error during verification');
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await fetch(`${API_BASE}/domains/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            success('Domain removed');
            if (selectedDomain?.id === id) setSelectedDomain(null);
            await fetchDomains();
        } catch {
            error('Failed to remove domain');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        success('Copied to clipboard');
    };

    const summaryMetrics = [
        { label: 'Domains', value: domains.length.toString() },
        { label: 'Verified', value: domains.filter((domain) => domain.status === 'verified').length.toString() },
        { label: 'Pending', value: domains.filter((domain) => domain.status !== 'verified').length.toString() },
        { label: 'DKIM Tokens', value: selectedDomain?.dkim_tokens?.length?.toString() || '0' },
    ];

    const selectedStatusVariant = selectedDomain?.status === 'verified' ? 'success' : selectedDomain?.status === 'failed' ? 'danger' : 'warning';

    if (!user || !can(user, 'VIEW_DOMAIN')) {
        return null;
    }

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Sending Domains"
                subtitle="Verify infrastructure once, then reuse it everywhere across campaigns, templates, and analytics."
                action={
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="h-4 w-4" />
                        Add Domain
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryMetrics.map((metric) => (
                    <StatCard key={metric.label} label={metric.label} value={metric.value} />
                ))}
            </div>

            {loading ? (
                <div className="py-16 text-center text-sm text-[var(--text-muted)]">Loading domains...</div>
            ) : domains.length === 0 ? (
                <EmptyState
                    icon={<Globe className="h-10 w-10" />}
                    title="No domains connected"
                    description="Add your custom domain to authenticate mail, improve inbox placement, and remove provider branding."
                    action={<Button onClick={() => setShowAddModal(true)}>Connect a Domain</Button>}
                />
            ) : (
                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-3">
                        {domains.map((domain) => (
                            <button
                                key={domain.id}
                                onClick={() => setSelectedDomain(domain)}
                                className={`w-full rounded-[var(--radius-lg)] border p-4 text-left transition ${
                                    selectedDomain?.id === domain.id
                                        ? 'border-[var(--accent-border)] bg-[var(--accent)]/8'
                                        : 'border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]'
                                }`}
                            >
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <strong className="text-sm text-[var(--text-primary)]">{domain.domain_name}</strong>
                                    {domain.status === 'verified' ? (
                                        <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                                    ) : domain.status === 'failed' ? (
                                        <ShieldAlert className="h-4 w-4 text-[var(--danger)]" />
                                    ) : (
                                        <Activity className="h-4 w-4 text-[var(--warning)]" />
                                    )}
                                </div>
                                <Badge variant={domain.status === 'verified' ? 'success' : domain.status === 'failed' ? 'danger' : 'warning'}>
                                    {domain.status === 'pending' ? 'Pending Validation' : domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
                                </Badge>
                            </button>
                        ))}
                    </div>

                    {selectedDomain && (
                        <div className="space-y-6">
                            <InspectorPanel
                                title={selectedDomain.domain_name}
                                badge={<Badge variant={selectedStatusVariant}>{selectedDomain.status === 'pending' ? 'Pending' : selectedDomain.status}</Badge>}
                                subtitle="Add these records with your DNS provider to authenticate sending, improve deliverability, and align return-path behavior."
                                action={selectedDomain.status !== 'verified' ? (
                                    <Button variant="outline" onClick={() => handleVerify(selectedDomain)}>
                                        <RefreshCw className="h-4 w-4" />
                                        Check Status
                                    </Button>
                                ) : undefined}
                            >
                                <KeyValueList
                                items={[
                                    {
                                        label: 'Verification state',
                                        value: selectedDomain.status === 'pending' ? 'Pending validation' : selectedDomain.status,
                                        helper: 'Re-check after your DNS provider finishes propagation.',
                                    },
                                    {
                                        label: 'DKIM records',
                                        value: `${selectedDomain?.dkim_tokens?.length || 0} required`,
                                        helper: 'Each selector must be published exactly as shown below.',
                                    },
                                    {
                                        label: 'Workspace reuse',
                                        value: 'Available across campaigns',
                                        helper: 'Once authenticated, this domain can be reused across sending flows without repeating setup.',
                                    },
                                    {
                                        label: 'Return-path',
                                        value: 'Optional enhancement',
                                        helper: 'Recommended when you want stronger DMARC alignment and more polished inbox presentation.',
                                    },
                                ]}
                            />
                            </InspectorPanel>

                            {selectedDomain.status === 'verified' ? (
                                <InlineAlert
                                    variant="success"
                                    title="Domain authenticated"
                                    description="DKIM and SPF are in place, so you are ready to send branded email from this domain."
                                    icon={<CheckCircle2 className="h-5 w-5" />}
                                />
                            ) : (
                                <InlineAlert
                                    variant="warning"
                                    title="Verification pending"
                                    description="DNS propagation can take 10-45 minutes depending on your provider. Keep this page open and re-check status after records are added."
                                />
                            )}

                            {selectedDomain.status !== 'verified' && (
                                <div className="space-y-8">
                                    <SectionCard
                                        title="1. DKIM Records"
                                        description="Add these CNAME records to prove messages were signed by your infrastructure."
                                        action={<Badge variant="info">Required</Badge>}
                                    >
                                        <DnsTable
                                            rows={(selectedDomain.dkim_tokens || []).map((token: string) => ({
                                                type: 'CNAME',
                                                host: `${token}._domainkey`,
                                                value: `${token}.dkim.amazonses.com`,
                                            }))}
                                            onCopy={copyToClipboard}
                                        />
                                    </SectionCard>

                                    <SectionCard
                                        title="2. SPF Record"
                                        description="Authorize Amazon SES as a valid sender for this domain."
                                        action={<Badge variant="info">Required</Badge>}
                                    >
                                        <DnsTable
                                            rows={[{
                                                type: 'TXT',
                                                host: '@',
                                                value: 'v=spf1 include:amazonses.com ~all',
                                            }]}
                                            onCopy={copyToClipboard}
                                        />
                                    </SectionCard>

                                    <SectionCard
                                        title="3. Custom Return-Path"
                                        description="Configure MAIL FROM records to improve DMARC alignment and reduce “via amazonses.com” presentation."
                                        action={<Badge variant="warning">Recommended</Badge>}
                                    >
                                        <DnsTable
                                            includePriority
                                            rows={[
                                                {
                                                    type: 'MX',
                                                    host: 'bounces',
                                                    value: 'feedback-smtp.us-east-1.amazonses.com',
                                                    priority: '10',
                                                },
                                                {
                                                    type: 'TXT',
                                                    host: 'bounces',
                                                    value: 'v=spf1 include:amazonses.com ~all',
                                                    priority: '-',
                                                },
                                            ]}
                                            onCopy={copyToClipboard}
                                        />
                                    </SectionCard>
                                </div>
                            )}

                            <SectionCard tone="danger">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-[var(--danger)]">Danger Zone</h3>
                                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                                            Remove this domain and disable sending from it across the workspace.
                                        </p>
                                    </div>
                                    <Button variant="danger" onClick={() => setPendingRemoveId(selectedDomain.id)}>
                                        Remove Domain
                                    </Button>
                                </div>
                            </SectionCard>
                        </div>
                    )}
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Connect Domain</h3>
                            <button onClick={() => setShowAddModal(false)} className="rounded-[var(--radius)] p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddDomain} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm text-[var(--text-muted)]">Domain Name</label>
                                <input
                                    type="text"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    placeholder="example.com"
                                    className="h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" disabled={adding} fullWidth>
                                {adding ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate Verification Records'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!pendingRemoveId}
                onClose={() => setPendingRemoveId(null)}
                onConfirm={() => {
                    if (!pendingRemoveId) return;
                    const current = pendingRemoveId;
                    setPendingRemoveId(null);
                    void handleRemove(current);
                }}
                title="Remove Domain?"
                message="You will no longer be able to send mail from this domain until it is added and verified again."
                confirmLabel="Remove Domain"
                variant="danger"
            />
        </div>
    );
}

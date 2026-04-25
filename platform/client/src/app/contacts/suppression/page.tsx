'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCcw, ShieldOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, EmptyState, PageHeader, SectionCard, StatCard, TableToolbar, useToast } from '@/components/ui';

const API_BASE = 'http://localhost:8000';

function apiHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
}

interface SuppressedContact {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    status: string;
    bounce_reason?: string;
    created_at: string;
}

export default function SuppressionListPage() {
    const { token } = useAuth();
    const { error } = useToast();

    const [contacts, setContacts] = useState<SuppressedContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchSuppressionList = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/contacts/suppression?page=${page}&limit=50`, {
                headers: apiHeaders(token),
            });
            if (res.ok) {
                const data = await res.json();
                setContacts(data.data || []);
                setTotalPages(data.meta?.total_pages || 1);
                setTotal(data.meta?.total || 0);
            } else {
                throw new Error('Failed to fetch suppression list.');
            }
        } catch (fetchError) {
            console.error('Failed to fetch suppression list', fetchError);
            error('Failed to load the suppression list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppressionList();
    }, [page, token]);

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Suppression List"
                subtitle="Review bounced, complained, and unsubscribed contacts before they affect future deliverability or segment quality."
                breadcrumb={
                    <Link href="/contacts" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Contacts
                    </Link>
                }
                action={<Button variant="secondary" onClick={fetchSuppressionList}><RefreshCcw className="h-4 w-4" />Refresh</Button>}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Suppressed Contacts" value={total.toLocaleString()} icon={<ShieldOff className="h-5 w-5" />} />
                <StatCard label="Current Page" value={page.toString()} icon={<ShieldOff className="h-5 w-5" />} />
                <StatCard label="Pages" value={totalPages.toString()} icon={<ShieldOff className="h-5 w-5" />} />
            </div>

            <SectionCard title="Suppressed Recipients" description="These contacts are disabled because of bounces, complaints, or unsubscribe activity.">
                <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)]">
                    <TableToolbar
                        title="Deliverability Protection"
                        description="Keep this list clean to reduce repeat bounces and preserve sender reputation."
                        trailing={<Badge variant="outline">{total} total records</Badge>}
                        className="rounded-none border-0 border-b border-[var(--border)]"
                    />
                    {loading && contacts.length === 0 ? (
                        <div className="p-12 text-center text-sm text-[var(--text-muted)]">Loading suppression list...</div>
                    ) : contacts.length === 0 ? (
                        <EmptyState
                            icon={<ShieldOff className="h-10 w-10" />}
                            title="No suppressed contacts"
                            description="Your suppression list is currently clear."
                        />
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Date Added</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((contact) => (
                                    <tr key={contact.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-hover)]">
                                        <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">{contact.email}</td>
                                        <td className="px-6 py-4 text-sm text-[var(--text-muted)]">{[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                title={contact.bounce_reason || 'No bounce reason recorded'}
                                                className="inline-flex items-center gap-1 rounded-full border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-1 text-xs font-medium text-[var(--warning)]"
                                            >
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                {contact.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[var(--text-muted)]">{new Date(contact.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </SectionCard>

            {totalPages > 1 && (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <span className="text-sm text-[var(--text-muted)]">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
                        <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

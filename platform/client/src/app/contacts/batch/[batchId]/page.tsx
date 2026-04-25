'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, FileSpreadsheet, Globe2, Search, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, EmptyState, FilterBar, InlineAlert, Input, PageHeader, SectionCard, StatCard, TableToolbar, useToast } from '@/components/ui';

const API_BASE = 'http://127.0.0.1:8000';

interface DomainStat {
    domain: string;
    count: number;
    suggested_domain?: string;
    reason?: string;
}

export default function BatchDetailPage() {
    const { batchId } = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const { error } = useToast();

    const [contacts, setContacts] = useState<any[]>([]);
    const [batch, setBatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [domainFilters, setDomainFilters] = useState<string[]>([]);
    const [domainStats, setDomainStats] = useState<DomainStat[]>([]);
    const [domainLoading, setDomainLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const typoDomains = useMemo(() => domainStats.filter((entry) => entry.suggested_domain), [domainStats]);

    const fetchBatch = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/contacts/batches`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            const found = (json.data || []).find((item: any) => item.id === batchId);
            setBatch(found || null);
        } catch (fetchError) {
            console.error(fetchError);
            error('Failed to load batch details.');
        }
    };

    const fetchContacts = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20',
                batch_id: batchId as string,
                ...(deferredSearch ? { search: deferredSearch } : {}),
                ...(domainFilters.length > 0 ? { domains: domainFilters.join(',') } : {}),
            });
            const res = await fetch(`${API_BASE}/contacts/?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setContacts(json.data || []);
            setTotal(json.meta?.total || 0);
            setTotalPages(json.meta?.total_pages || 0);
        } catch (fetchError) {
            console.error(fetchError);
            setContacts([]);
            error('Failed to load batch contacts.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDomains = async () => {
        if (!token) return;
        setDomainLoading(true);
        try {
            const params = new URLSearchParams({
                limit: '12',
                batch_id: batchId as string,
            });
            const res = await fetch(`${API_BASE}/contacts/domains?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setDomainStats(json.data || []);
        } catch (fetchError) {
            console.error(fetchError);
            setDomainStats([]);
        } finally {
            setDomainLoading(false);
        }
    };

    useEffect(() => { fetchBatch(); }, [token, batchId]);
    useEffect(() => { fetchContacts(); }, [token, batchId, page, deferredSearch, domainFilters]);
    useEffect(() => { fetchDomains(); }, [token, batchId]);

    const toggleDomainFilter = (domain: string) => {
        setPage(1);
        setDomainFilters((current) => current.includes(domain) ? current.filter((item) => item !== domain) : [...current, domain]);
    };

    const metrics = [
        { label: 'Visible Contacts', value: total.toLocaleString() },
        { label: 'Batch Domains', value: domainStats.length.toString() },
        { label: 'Possible Typos', value: typoDomains.length.toString() },
    ];

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title={batch ? batch.file_name : 'Batch Details'}
                subtitle={batch ? `${batch.imported_count.toLocaleString()} contacts imported on ${new Date(batch.created_at).toLocaleDateString()}.` : 'Inspect imported contacts, filter by domain, and review possible typo domains.'}
                breadcrumb={
                    <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Contacts
                    </button>
                }
                action={
                    <Badge variant="outline">
                        <Users className="mr-1 h-3.5 w-3.5" />
                        {total.toLocaleString()} contacts
                    </Badge>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {metrics.map((metric) => (
                    <StatCard key={metric.label} label={metric.label} value={metric.value} icon={<FileSpreadsheet className="h-5 w-5" />} />
                ))}
            </div>

            <SectionCard title="Batch Domains" description="Use domain filters to inspect subsets of the import and catch suspicious patterns before campaigns are sent.">
                <FilterBar>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px_auto]">
                        <Input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by email..."
                            icon={<Search className="h-4 w-4" />}
                        />
                        <select
                            value={domainFilters[0] || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                setPage(1);
                                setDomainFilters(value ? [value] : []);
                            }}
                            className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                        >
                            <option value="">All batch domains</option>
                            {domainStats.map((domain) => (
                                <option key={domain.domain} value={domain.domain}>{domain.domain} ({domain.count})</option>
                            ))}
                        </select>
                        {domainFilters.length > 0 && (
                            <Button variant="ghost" onClick={() => { setDomainFilters([]); setPage(1); }}>Clear</Button>
                        )}
                    </div>
                </FilterBar>

                <div className="mt-4 flex flex-wrap gap-2">
                    {domainLoading && domainStats.length === 0 ? (
                        <span className="text-sm text-[var(--text-muted)]">Loading domains...</span>
                    ) : domainStats.map((entry) => (
                        <button
                            key={entry.domain}
                            onClick={() => toggleDomainFilter(entry.domain)}
                            className={`rounded-[var(--radius)] border px-3 py-2 text-left transition ${domainFilters.includes(entry.domain) ? 'border-[var(--accent)] bg-[var(--info-bg)]/40' : 'border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)]'}`}
                        >
                            <div className="text-sm font-medium text-[var(--text-primary)]">{entry.domain}</div>
                            <div className="text-xs text-[var(--text-muted)]">{entry.count} contacts</div>
                        </button>
                    ))}
                </div>

                {typoDomains.length > 0 && (
                    <InlineAlert
                        variant="warning"
                        title="Possible typo domains found"
                        description={`Review entries like ${typoDomains.slice(0, 2).map((entry) => `${entry.domain} -> ${entry.suggested_domain}`).join(', ')} before using this batch in campaigns.`}
                        icon={<AlertTriangle className="mt-0.5 h-4 w-4" />}
                        className="mt-4"
                    />
                )}
            </SectionCard>

            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)]">
                <TableToolbar
                    title="Imported Contacts"
                    description="Batch members stay linked back to their original import so you can audit and remediate quickly."
                    trailing={domainFilters.length > 0 ? <Badge variant="outline">{domainFilters.join(', ')}</Badge> : null}
                    className="rounded-none border-0 border-b border-[var(--border)]"
                />
                {loading ? (
                    <div className="p-12 text-center text-sm text-[var(--text-muted)]">Loading contacts...</div>
                ) : contacts.length === 0 ? (
                    <EmptyState
                        icon={<FileSpreadsheet className="h-10 w-10" />}
                        title="No contacts found"
                        description="Try clearing the search or domain filters to see the full batch again."
                    />
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Added</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map((contact) => (
                                <tr key={contact.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-hover)]">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <Link href={`/contacts/${contact.id}`} className="text-sm font-medium text-[var(--accent)] transition hover:opacity-80">
                                                {contact.email}
                                            </Link>
                                            {contact.email_domain && <Badge variant="outline">{contact.email_domain}</Badge>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[var(--text-primary)]">
                                        {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={contact.status === 'subscribed' ? 'success' : 'danger'}>{contact.status}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[var(--text-muted)]">{new Date(contact.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/contacts/${contact.id}`}>
                                            <Button variant="ghost" size="sm">Edit Contact</Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <span className="text-sm text-[var(--text-muted)]">
                        Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
                    </span>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</Button>
                        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

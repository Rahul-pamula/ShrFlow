'use client';

import { useEffect, useMemo, useState } from 'react';
import { MailCheck, Plus, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { can } from '@/utils/permissions';
import { Badge, Button, ConfirmModal, EmptyState, InlineAlert, Input, KeyValueList, PageHeader, SectionCard, StatCard, TableToolbar, useToast } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface SenderIdentity {
    id: string;
    email: string;
    status: 'pending' | 'verified';
    created_at: string;
}

interface Domain {
    id: string;
    domain_name: string;
    status: 'pending' | 'verified' | 'failed';
}

const selectClassName = 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20';

export default function SenderIdentitiesPage() {
    const { token, user } = useAuth();
    const { success, error, info } = useToast();

    const [senders, setSenders] = useState<SenderIdentity[]>([]);
    const [domains, setDomains] = useState<Domain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [prefixInput, setPrefixInput] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [pendingDelete, setPendingDelete] = useState<SenderIdentity | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const verifiedDomains = useMemo(() => domains.filter((domain) => domain.status === 'verified'), [domains]);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        try {
            const [sendersRes, domainsRes] = await Promise.all([
                fetch(`${API_BASE}/senders`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/domains`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            if (sendersRes.ok) {
                const senderData = await sendersRes.json();
                setSenders(senderData.data || []);
            }
            if (domainsRes.ok) {
                const domainData = await domainsRes.json();
                const allDomains = domainData.data || [];
                setDomains(allDomains);

                const firstVerified = allDomains.find((domain: Domain) => domain.status === 'verified');
                if (firstVerified) {
                    setSelectedDomain((current) => current || firstVerified.domain_name);
                }
            }
        } catch (fetchError) {
            console.error(fetchError);
            error('Failed to load sender identities.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSender = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!prefixInput || !selectedDomain) {
            setErrorMessage('Please enter a prefix and select a verified domain.');
            return;
        }

        setErrorMessage('');
        setIsSubmitting(true);

        const fullEmail = `${prefixInput}@${selectedDomain}`;

        try {
            const res = await fetch(`${API_BASE}/senders`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: fullEmail }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || 'Failed to add sender. Please ensure the domain is verified.');
            }

            setPrefixInput('');
            success(`Verification started for ${fullEmail}.`);
            await fetchData();
        } catch (submitError: any) {
            setErrorMessage(submitError.message || 'Failed to add sender.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async (email: string) => {
        try {
            const res = await fetch(`${API_BASE}/senders`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                if (data.detail !== 'Sender email already registered in your workspace.') {
                    throw new Error(data.detail || 'Failed to resend verification.');
                }
            }

            info('AWS SES limits resend timing internally. If nothing arrives, remove the sender and add it again.');
        } catch (resendError: any) {
            error(resendError.message || 'An error occurred while resending verification.');
        }
    };

    const handleDelete = async () => {
        if (!pendingDelete) return;

        setDeletingId(pendingDelete.id);
        try {
            const res = await fetch(`${API_BASE}/senders/${pendingDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to delete sender identity.');
            }

            success(`Removed ${pendingDelete.email}.`);
            setPendingDelete(null);
            await fetchData();
        } catch (deleteError: any) {
            error(deleteError.message || 'An error occurred while deleting the sender.');
        } finally {
            setDeletingId(null);
        }
    };

    const checkStatus = async (id: string) => {
        try {
            await fetch(`${API_BASE}/senders/${id}/verify`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchData();
        } catch (statusError) {
            console.error(statusError);
            error('Could not refresh sender status.');
        }
    };

    const metrics = [
        { label: 'Verified Senders', value: senders.filter((sender) => sender.status === 'verified').length.toString() },
        { label: 'Pending Verification', value: senders.filter((sender) => sender.status === 'pending').length.toString() },
        { label: 'Verified Domains', value: verifiedDomains.length.toString() },
    ];

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Sender Identities"
                subtitle="Verify individual inboxes before using them as a FROM address. This helps prevent spoofing, supports trust, and keeps your sending setup explicit."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {metrics.map((metric) => (
                    <StatCard key={metric.label} label={metric.label} value={metric.value} icon={<MailCheck className="h-5 w-5" />} />
                ))}
            </div>

            {verifiedDomains.length === 0 && (
                <InlineAlert
                    variant="warning"
                    title="A verified domain is required first"
                    description="You need at least one verified sending domain before you can register sender identities."
                    icon={<ShieldAlert className="mt-0.5 h-4 w-4" />}
                />
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
                <div className="space-y-6">
                    {can(user, 'ADD_SENDER') && (
                        <SectionCard
                            title="Add New Sender"
                            description="Create sender addresses from verified domains so campaigns use deliberate, auditable FROM identities."
                        >
                            {errorMessage && (
                                <InlineAlert
                                    variant="danger"
                                    title="Could not add sender"
                                    description={errorMessage}
                                    icon={<ShieldAlert className="mt-0.5 h-4 w-4" />}
                                    className="mb-4"
                                />
                            )}
                            <form onSubmit={handleAddSender} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Input
                                        label="Sender Prefix"
                                        value={prefixInput}
                                        onChange={(e) => setPrefixInput(e.target.value.replace(/[^a-zA-Z0-9.\-_]/g, ''))}
                                        placeholder="hello"
                                        helperText="Use safe mailbox characters only."
                                        required
                                    />
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-[var(--text-primary)]">Verified Domain</label>
                                        <select
                                            value={selectedDomain}
                                            onChange={(e) => setSelectedDomain(e.target.value)}
                                            className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                                            required
                                        >
                                            {verifiedDomains.length === 0 ? (
                                                <option value="">No verified domains found</option>
                                            ) : (
                                                verifiedDomains.map((domain) => (
                                                    <option key={domain.id} value={domain.domain_name}>@{domain.domain_name}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="submit" isLoading={isSubmitting} disabled={!prefixInput || !selectedDomain || verifiedDomains.length === 0}>
                                        <Plus className="h-4 w-4" />
                                        Add Sender
                                    </Button>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Resulting address: <span className="font-medium text-[var(--text-primary)]">{prefixInput || 'prefix'}@{selectedDomain || 'domain.com'}</span>
                                    </p>
                                </div>
                            </form>
                        </SectionCard>
                    )}

                    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)]">
                        <TableToolbar
                            title="Verified Senders"
                            description="Keep sender identities limited and intentional so ownership and verification status stay easy to audit."
                            trailing={<Badge variant="outline">{senders.length} records</Badge>}
                            className="rounded-none border-0 border-b border-[var(--border)]"
                        />
                        {isLoading ? (
                            <div className="p-12 text-center text-sm text-[var(--text-muted)]">Loading sender identities...</div>
                        ) : senders.length === 0 ? (
                            <EmptyState
                                icon={<MailCheck className="h-10 w-10" />}
                                title="No sender identities yet"
                                description="Add a sender address to start sending campaigns from a verified inbox."
                            />
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Sender Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Date Added</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {senders.map((sender) => (
                                        <tr key={sender.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-hover)]">
                                            <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">{sender.email}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={sender.status === 'verified' ? 'success' : 'warning'}>
                                                        {sender.status === 'verified' ? 'Verified' : 'Pending'}
                                                    </Badge>
                                                    {sender.status === 'pending' && (
                                                        <button
                                                            onClick={() => checkStatus(sender.id)}
                                                            className="text-xs font-medium text-[var(--accent)] transition hover:opacity-80"
                                                        >
                                                            Check Status
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                                                {new Date(sender.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {sender.status === 'pending' && (
                                                        <Button variant="ghost" size="sm" onClick={() => handleResend(sender.email)}>
                                                            <RefreshCw className="h-3.5 w-3.5" />
                                                            Resend
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" className="text-[var(--danger)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]" onClick={() => setPendingDelete(sender)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionCard
                        title="Verification Model"
                        description="AWS SES verifies the exact inbox, not just the domain, so each sender must confirm ownership individually."
                    >
                        <KeyValueList
                            columns={1}
                            items={[
                                { label: 'Inbox Ownership', value: 'Required', helper: 'Open the verification email and click the SES confirmation link.' },
                                { label: 'FROM Address Eligibility', value: 'Unlocked after verification', helper: 'Only verified senders can be used in campaign sending settings.' },
                                { label: 'Retry Guidance', value: 'Remove and recreate if mail never arrives', helper: 'SES throttles resend timing internally.' },
                            ]}
                        />
                    </SectionCard>

                    <SectionCard tone="subtle" title="Adding new senders" description="Once you add an email prefix, AWS SES sends a verification email to that exact address.">
                        <p className="text-sm leading-6 text-[var(--text-muted)]">
                            Open that inbox and click the AWS verification link before the sender can move from pending to verified. After that, the address becomes available in campaign sending flows.
                        </p>
                    </SectionCard>
                </div>
            </div>

            <ConfirmModal
                isOpen={Boolean(pendingDelete)}
                onClose={() => setPendingDelete(null)}
                onConfirm={handleDelete}
                title="Remove sender identity?"
                message={pendingDelete ? `You will no longer be able to send from ${pendingDelete.email} until it is re-verified.` : 'Remove this sender identity.'}
                confirmLabel="Remove Sender"
                isLoading={deletingId !== null}
            />
        </div>
    );
}

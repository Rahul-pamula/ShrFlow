'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle, CheckCircle2, ClipboardList, Clock, CreditCard, Store, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
    Badge, Button, ConfirmModal, InlineAlert, Input, ModalShell,
    PageHeader, SectionCard, StatCard, TableToolbar, useToast,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type RequestStatus = 'pending' | 'approved' | 'rejected';
type RequestType = 'billing_change' | 'franchise_request';

interface WorkspaceRequest {
    id: string;
    request_type: RequestType;
    notes?: string | null;
    payload?: Record<string, unknown>;
    status: RequestStatus;
    created_at: string;
    resolved_at?: string | null;
    requester_email?: string | null;
    requester_name?: string | null;
}

const TYPE_LABELS: Record<RequestType, string> = {
    billing_change: 'Billing Change',
    franchise_request: 'Franchise Request',
};

const TYPE_ICONS: Record<RequestType, React.ReactNode> = {
    billing_change: <CreditCard className="h-4 w-4" />,
    franchise_request: <Store className="h-4 w-4" />,
};

function StatusBadge({ status }: { status: RequestStatus }) {
    if (status === 'approved') return <Badge variant="success">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="danger">Rejected</Badge>;
    return <Badge variant="outline">Pending</Badge>;
}

export default function WorkspaceRequestsPage() {
    const { token, user } = useAuth();
    const { success, error } = useToast();

    const isOwner = user?.role === 'MAIN_OWNER' || user?.role === 'FRANCHISE_OWNER';
    const isManager = user?.role === 'MANAGER';

    const [requests, setRequests] = useState<WorkspaceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createType, setCreateType] = useState<RequestType>('billing_change');
    const [createNotes, setCreateNotes] = useState('');
    const [createBusy, setCreateBusy] = useState(false);

    const [pendingApprove, setPendingApprove] = useState<WorkspaceRequest | null>(null);
    const [pendingReject, setPendingReject] = useState<WorkspaceRequest | null>(null);
    const [actionBusy, setActionBusy] = useState(false);

    const stats = useMemo(() => ([
        { label: 'Total Requests', value: requests.length.toString(), icon: <ClipboardList className="h-5 w-5" /> },
        { label: 'Pending', value: requests.filter((r) => r.status === 'pending').length.toString(), icon: <Clock className="h-5 w-5" /> },
        { label: 'Approved', value: requests.filter((r) => r.status === 'approved').length.toString(), icon: <CheckCircle2 className="h-5 w-5" /> },
    ]), [requests]);

    useEffect(() => {
        if (token) fetchRequests();
    }, [token]);

    const fetchRequests = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/team/workspace-requests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to load requests.');
            }
            setRequests(await res.json());
        } catch (fetchError: any) {
            console.error(fetchError);
            error(fetchError.message || 'Could not load workspace requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateBusy(true);
        try {
            const res = await fetch(`${API_BASE}/team/workspace-requests`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ request_type: createType, notes: createNotes }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to submit request.');
            }
            success('Request submitted. The owner will review it.');
            setShowCreateModal(false);
            setCreateNotes('');
            fetchRequests();
        } catch (createError: any) {
            console.error(createError);
            error(createError.message || 'Could not submit request.');
        } finally {
            setCreateBusy(false);
        }
    };

    const handleApprove = async () => {
        if (!pendingApprove) return;
        setActionBusy(true);
        try {
            const res = await fetch(`${API_BASE}/team/workspace-requests/${pendingApprove.id}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to approve request.');
            }
            success('Request approved.');
            setPendingApprove(null);
            fetchRequests();
        } catch (approveError: any) {
            error(approveError.message || 'Could not approve request.');
        } finally {
            setActionBusy(false);
        }
    };

    const handleReject = async () => {
        if (!pendingReject) return;
        setActionBusy(true);
        try {
            const res = await fetch(`${API_BASE}/team/workspace-requests/${pendingReject.id}/reject`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to reject request.');
            }
            success('Request rejected.');
            setPendingReject(null);
            fetchRequests();
        } catch (rejectError: any) {
            error(rejectError.message || 'Could not reject request.');
        } finally {
            setActionBusy(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-sm text-[var(--text-muted)]">Loading workspace requests...</div>;
    }

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Workspace Requests"
                subtitle="Managers submit billing or franchise requests here. Owners review and approve or reject each one before any action is taken."
                action={
                    isManager ? (
                        <Button onClick={() => setShowCreateModal(true)}>
                            <ClipboardList className="h-4 w-4" />
                            New Request
                        </Button>
                    ) : null
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                    <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
                ))}
            </div>

            {isOwner && requests.filter((r) => r.status === 'pending').length > 0 && (
                <InlineAlert
                    variant="warning"
                    title={`${requests.filter((r) => r.status === 'pending').length} pending request${requests.filter((r) => r.status === 'pending').length !== 1 ? 's' : ''} awaiting your review`}
                    description="Review the requests below and approve or reject each one."
                    icon={<AlertTriangle className="mt-0.5 h-4 w-4" />}
                />
            )}

            <SectionCard
                title={isOwner ? 'All Workspace Requests' : 'My Requests'}
                description={isOwner
                    ? 'Review requests from managers and take action. Approved requests must still be executed manually (billing changes via Billing page, franchises via Franchise Accounts).'
                    : 'Track requests you have submitted to the workspace owner.'}
            >
                <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)]">
                    <TableToolbar
                        title="Request Queue"
                        description={isOwner ? 'Approve or reject pending requests from your managers.' : 'Submitted requests are reviewed by the owner.'}
                        trailing={<Badge variant="outline">{requests.length} total</Badge>}
                        className="rounded-none border-0 border-b border-[var(--border)]"
                    />

                    <div className="divide-y divide-[var(--border)]">
                        {requests.length === 0 ? (
                            <div className="p-6 text-sm text-[var(--text-muted)]">No requests yet.</div>
                        ) : (
                            requests.map((req) => (
                                <div key={req.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[var(--text-muted)]">{TYPE_ICONS[req.request_type]}</span>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{TYPE_LABELS[req.request_type]}</p>
                                            <StatusBadge status={req.status} />
                                        </div>
                                        {req.notes && (
                                            <p className="text-sm text-[var(--text-muted)]">{req.notes}</p>
                                        )}
                                        {isOwner && req.requester_name && (
                                            <p className="text-xs text-[var(--text-muted)]">
                                                From: {req.requester_name} ({req.requester_email})
                                            </p>
                                        )}
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Submitted {new Date(req.created_at).toLocaleDateString()}
                                            {req.resolved_at ? ` · Resolved ${new Date(req.resolved_at).toLocaleDateString()}` : ''}
                                        </p>
                                    </div>

                                    {isOwner && req.status === 'pending' && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                size="sm"
                                                onClick={() => setPendingApprove(req)}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Approve
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[var(--danger)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                                                onClick={() => setPendingReject(req)}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </SectionCard>

            {/* ── Create Request Modal ─────────────────────────────── */}
            <ModalShell
                isOpen={showCreateModal}
                onClose={() => { if (!createBusy) { setShowCreateModal(false); setCreateNotes(''); } }}
                title="Submit a Request"
                description="Requests are sent to the workspace owner for review. No changes are made until the owner approves."
                maxWidthClass="max-w-lg"
            >
                <form onSubmit={handleCreate} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-[var(--text-primary)]">Request Type</label>
                        <select
                            value={createType}
                            onChange={(e) => setCreateType(e.target.value as RequestType)}
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                        >
                            <option value="billing_change">Billing Change Request</option>
                            <option value="franchise_request">Franchise Workspace Request</option>
                        </select>
                    </div>
                    <Input
                        label="Notes (optional)"
                        value={createNotes}
                        onChange={(e) => setCreateNotes(e.target.value)}
                        placeholder={createType === 'billing_change' ? 'e.g. We need to upgrade to Pro for the next campaign.' : 'e.g. We need a child workspace for the Dallas team.'}
                    />
                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => { setShowCreateModal(false); setCreateNotes(''); }} disabled={createBusy}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={createBusy}>Submit Request</Button>
                    </div>
                </form>
            </ModalShell>

            {/* ── Approve Confirm ──────────────────────────────────── */}
            <ConfirmModal
                isOpen={Boolean(pendingApprove)}
                onClose={() => setPendingApprove(null)}
                onConfirm={handleApprove}
                title="Approve this request?"
                message={`Approving the ${pendingApprove ? TYPE_LABELS[pendingApprove.request_type] : 'request'} will mark it resolved. You will need to execute the actual change manually.`}
                confirmLabel="Approve"
                isLoading={actionBusy && Boolean(pendingApprove)}
                variant="warning"
            />

            {/* ── Reject Confirm ───────────────────────────────────── */}
            <ConfirmModal
                isOpen={Boolean(pendingReject)}
                onClose={() => setPendingReject(null)}
                onConfirm={handleReject}
                title="Reject this request?"
                message={`Rejecting the ${pendingReject ? TYPE_LABELS[pendingReject.request_type] : 'request'} will mark it resolved with no action taken.`}
                confirmLabel="Reject"
                isLoading={actionBusy && Boolean(pendingReject)}
            />
        </div>
    );
}

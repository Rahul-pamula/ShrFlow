'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, PauseCircle, PlayCircle, Store, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { can } from '@/utils/permissions';
import { useRouter } from 'next/navigation';
import { Badge, Button, ConfirmModal, InlineAlert, Input, ModalShell, PageHeader, SectionCard, StatCard, useToast } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface FranchiseOwner {
    user_id: string;
    email?: string | null;
    full_name?: string | null;
}

interface PendingInvite {
    id: string;
    email: string;
    expires_at: string;
}

interface Franchise {
    id: string;
    workspace_name: string;
    status: 'pending_invite' | 'active' | 'suspended' | 'deleted';
    created_at: string;
    owner?: FranchiseOwner | null;
    pending_invite?: PendingInvite | null;
}

export default function FranchiseSettingsPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const { success, error } = useToast();

    useEffect(() => {
        if (user && !can(user, 'franchise:manage')) {
            router.replace('/dashboard');
        }
    }, [user, router]);

    const [franchises, setFranchises] = useState<Franchise[]>([]);
    const [domains, setDomains] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [workspaceName, setWorkspaceName] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [selectedDomainId, setSelectedDomainId] = useState('');
    const [createStatus, setCreateStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [pendingSuspend, setPendingSuspend] = useState<Franchise | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Franchise | null>(null);
    const [actionBusy, setActionBusy] = useState(false);

    const stats = useMemo(() => ([
        { label: 'Franchises', value: franchises.length.toString(), icon: <Store className="h-5 w-5" /> },
        { label: 'Active', value: franchises.filter((item) => item.status === 'active').length.toString(), icon: <CheckCircle2 className="h-5 w-5" /> },
        { label: 'Pending Invites', value: franchises.filter((item) => item.status === 'pending_invite').length.toString(), icon: <UserPlus className="h-5 w-5" /> },
    ]), [franchises]);

    useEffect(() => {
        if (token) {
            fetchFranchises();
            fetchDomains();
        }
    }, [token]);

    const fetchFranchises = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/team/franchises`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to load franchises.');
            }
            setFranchises(await res.json());
        } catch (fetchError: any) {
            console.error(fetchError);
            error(fetchError.message || 'Could not load franchise accounts.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDomains = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/domains/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const verified = data.filter((d: any) => d.status === 'verified');
                setDomains(verified);
                if (verified.length > 0) {
                    setSelectedDomainId(verified[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch domains', err);
        }
    };

    const resetCreateForm = () => {
        setWorkspaceName('');
        setOwnerEmail('');
        setCreateStatus('idle');
    };

    const handleCreateFranchise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDomainId) {
            error('You must select a verified domain for the franchise.');
            return;
        }
        setCreateStatus('saving');
        try {
            const res = await fetch(`${API_BASE}/team/franchises`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    workspace_name: workspaceName, 
                    email: ownerEmail,
                    domain_id: selectedDomainId 
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to create franchise.');
            }
            setCreateStatus('success');
            success(`Franchise ${workspaceName} created.`);
            setTimeout(() => {
                setShowCreateModal(false);
                resetCreateForm();
                fetchFranchises();
            }, 700);
        } catch (createError: any) {
            console.error(createError);
            setCreateStatus('error');
            error(createError.message || 'Could not create franchise.');
        }
    };

    const handleSuspendOrReactivate = async () => {
        if (!pendingSuspend) return;
        setActionBusy(true);
        try {
            const endpoint = pendingSuspend.status === 'suspended' ? 'reactivate' : 'suspend';
            const res = await fetch(`${API_BASE}/team/franchises/${pendingSuspend.id}/${endpoint}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to update franchise.');
            }
            success(`Franchise ${pendingSuspend.status === 'suspended' ? 'reactivated' : 'suspended'}.`);
            setPendingSuspend(null);
            fetchFranchises();
        } catch (actionError: any) {
            console.error(actionError);
            error(actionError.message || 'Could not update franchise status.');
        } finally {
            setActionBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!pendingDelete) return;
        setActionBusy(true);
        try {
            const res = await fetch(`${API_BASE}/team/franchises/${pendingDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to delete franchise.');
            }
            success(`Franchise ${pendingDelete.workspace_name} deleted.`);
            setPendingDelete(null);
            fetchFranchises();
        } catch (deleteError: any) {
            console.error(deleteError);
            error(deleteError.message || 'Could not delete franchise.');
        } finally {
            setActionBusy(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-sm text-[var(--text-muted)]">Loading franchise accounts...</div>;
    }

    if (!user || !can(user, 'franchise:manage')) {
        return null;
    }

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Franchise Accounts"
                subtitle="Create and govern child workspaces while keeping campaigns, contacts, and member access isolated from the parent workspace."
                action={
                    <Button onClick={() => setShowCreateModal(true)}>
                        <UserPlus className="h-4 w-4" />
                        Add Franchise
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                    <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
                ))}
            </div>

            <InlineAlert
                variant="warning"
                title="Franchise workspaces are isolated"
                description="Each franchise is its own workspace. Suspending or deleting it affects its internal members, campaigns, contacts, and settings without changing the parent workspace."
                icon={<AlertTriangle className="mt-0.5 h-4 w-4" />}
            />

            <SectionCard title="Child Workspaces" description="Every franchise has its own owner and operating boundary. The parent workspace governs lifecycle, not day-to-day data access.">
                <div className="divide-y divide-[var(--border)] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)]">
                    {franchises.length === 0 ? (
                        <div className="p-6 text-sm text-[var(--text-muted)]">No franchise accounts yet.</div>
                    ) : (
                        franchises.map((franchise) => (
                            <div key={franchise.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{franchise.workspace_name}</p>
                                        <Badge variant={franchise.status === 'suspended' ? 'warning' : franchise.status === 'pending_invite' ? 'outline' : 'success'}>
                                            {franchise.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">Created {new Date(franchise.created_at).toLocaleDateString()}</p>
                                    {franchise.owner?.email ? (
                                        <p className="text-xs text-[var(--text-muted)]">Owner: {franchise.owner.full_name || franchise.owner.email}</p>
                                    ) : franchise.pending_invite ? (
                                        <p className="text-xs text-[var(--text-muted)]">Pending owner invite: {franchise.pending_invite.email}</p>
                                    ) : (
                                        <p className="text-xs text-[var(--text-muted)]">Owner not assigned yet.</p>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setPendingSuspend(franchise)}
                                    >
                                        {franchise.status === 'suspended' ? <PlayCircle className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}
                                        {franchise.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[var(--danger)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                                        onClick={() => setPendingDelete(franchise)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </SectionCard>

            <ModalShell
                isOpen={showCreateModal}
                onClose={() => {
                    if (createStatus === 'saving') return;
                    setShowCreateModal(false);
                    resetCreateForm();
                }}
                title="Add Franchise Workspace"
                description="This creates a child workspace and sends an owner invitation to the franchise lead."
                maxWidthClass="max-w-xl"
            >
                <form onSubmit={handleCreateFranchise} className="space-y-5">
                    <Input
                        label="Franchise Workspace Name"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="ShrFlow Dallas"
                        required
                        autoFocus
                    />
                    <Input
                        label="Franchise Owner Email"
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="owner@franchise.com"
                        required
                    />

                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-[var(--text-primary)]">
                            Allocate Sending Domain
                        </label>
                        <select
                            value={selectedDomainId}
                            onChange={(e) => setSelectedDomainId(e.target.value)}
                            className="flex w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            required
                        >
                            {domains.length === 0 ? (
                                <option value="" disabled>No verified domains available</option>
                            ) : (
                                domains.map(d => (
                                    <option key={d.id} value={d.id}>{d.domain_name}</option>
                                ))
                            )}
                        </select>
                        <p className="text-[10px] text-[var(--text-muted)]">
                            Select a verified domain from your workspace to allocate to this franchise.
                        </p>
                    </div>

                    {createStatus === 'error' && (
                        <InlineAlert
                            variant="danger"
                            title="Could not create franchise"
                            description="Check whether an active invite already exists or the workspace name is incomplete."
                        />
                    )}

                    {createStatus === 'success' && (
                        <InlineAlert
                            variant="success"
                            title="Franchise created"
                            description="The child workspace is ready and the owner invitation has been sent."
                        />
                    )}

                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => { setShowCreateModal(false); resetCreateForm(); }} disabled={createStatus === 'saving'}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={createStatus === 'saving'} disabled={createStatus === 'success'}>
                            Create Franchise
                        </Button>
                    </div>
                </form>
            </ModalShell>

            <ConfirmModal
                isOpen={Boolean(pendingSuspend)}
                onClose={() => setPendingSuspend(null)}
                onConfirm={handleSuspendOrReactivate}
                title={pendingSuspend?.status === 'suspended' ? 'Reactivate franchise?' : 'Suspend franchise?'}
                message={
                    pendingSuspend?.status === 'suspended'
                        ? `This will restore access to ${pendingSuspend?.workspace_name}.`
                        : `This will pause access and operations for ${pendingSuspend?.workspace_name} until it is reactivated.`
                }
                confirmLabel={pendingSuspend?.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                isLoading={actionBusy && Boolean(pendingSuspend)}
                variant="warning"
            />

            <ConfirmModal
                isOpen={Boolean(pendingDelete)}
                onClose={() => setPendingDelete(null)}
                onConfirm={handleDelete}
                title="Delete franchise?"
                message={pendingDelete ? `Deleting ${pendingDelete.workspace_name} will remove the child workspace and its related access records.` : 'Delete this franchise.'}
                confirmLabel="Delete Franchise"
                isLoading={actionBusy && Boolean(pendingDelete)}
            />
        </div>
    );
}

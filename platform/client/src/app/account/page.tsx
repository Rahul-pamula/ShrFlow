'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Box, 
    Building2, 
    ChevronRight, 
    Layout, 
    Loader2, 
    Mail, 
    MailPlus, 
    Plus, 
    Rocket, 
    Users, 
    Zap,
    X 
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Button, InlineAlert, Input, ModalShell, UserAvatar, useToast } from '@/components/ui';
import { AccountWorkspace, fetchAccountWorkspaces } from '@/lib/account';

interface Invitation {
    id: string;
    tenant_id: string;
    role: string;
    workspace_name: string;
    workspace_status: string;
    inviter_name?: string;
    token: string;
    expires_at: string;
}

export default function AccountPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { token, user, handleAuthSuccess, switchWorkspace } = useAuth();
    const { success, error } = useToast();
    
    const [workspaces, setWorkspaces] = useState<AccountWorkspace[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [createError, setCreateError] = useState('');
    const [createName, setCreateName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [busyWorkspaceId, setBusyWorkspaceId] = useState<string | null>(null);
    const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
    const [decliningInviteId, setDecliningInviteId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const createInputRef = useRef<HTMLInputElement | null>(null);
    const shouldOpenCreateFlow = searchParams.get('create') === 'true';

    useEffect(() => {
        if (!token) return;
        loadAccountData();
    }, [token]);

    useEffect(() => {
        if (!shouldOpenCreateFlow) return;
        setIsCreateModalOpen(true);
        setTimeout(() => createInputRef.current?.focus(), 150);
    }, [shouldOpenCreateFlow]);

    const loadAccountData = async () => {
        const authToken = token || localStorage.getItem('auth_token');
        if (!authToken) return;
        setLoading(true);
        try {
            const [workspaceData, invitationRes] = await Promise.all([
                fetchAccountWorkspaces(authToken),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/invitations`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                }),
            ]);
            const invitationData = invitationRes.ok ? await invitationRes.json() : [];
            setWorkspaces(Array.isArray(workspaceData) ? workspaceData : []);
            setInvitations(Array.isArray(invitationData) ? invitationData : []);
        } catch (err: any) {
            setPageError(err.message || 'Failed to load account details.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkspace = async () => {
        const authToken = token || localStorage.getItem('auth_token');
        if (!authToken || !createName.trim()) return;
        setIsCreating(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/workspaces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                body: JSON.stringify({ company_name: createName.trim() }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to create workspace.');
            handleAuthSuccess(data);
            setIsCreateModalOpen(false);
            router.push('/onboarding/workspace');
        } catch (err: any) {
            setCreateError(err.message || 'Failed to create workspace.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinInvitation = async (invitation: Invitation) => {
        const authToken = token || localStorage.getItem('auth_token');
        if (!authToken) return;
        setBusyInviteId(invitation.id);
        try {
            const acceptRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/team/invites/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                body: JSON.stringify({ token: invitation.token }),
            });
            const data = await acceptRes.json();
            if (!acceptRes.ok) throw new Error(data.detail || 'Failed to accept invitation.');
            if (data.new_token) localStorage.setItem('auth_token', data.new_token);
            await switchWorkspace(invitation.tenant_id);
        } catch (err: any) {
            setPageError(err.message);
            setBusyInviteId(null);
            loadAccountData();
        }
    };

    const handleOpenWorkspace = async (workspace: AccountWorkspace) => {
        if (busyWorkspaceId) return;
        if (workspace.tenant_id === user?.tenantId) {
            router.push(workspace.status === 'onboarding' ? '/onboarding/workspace' : '/dashboard');
            return;
        }
        setBusyWorkspaceId(workspace.tenant_id);
        try {
            await switchWorkspace(workspace.tenant_id);
        } catch (err: any) {
            setPageError(err.message);
            setBusyWorkspaceId(null);
        }
    };

    const handleDeclineInvitation = async (invitationId: string) => {
        const authToken = token || localStorage.getItem('auth_token');
        if (!authToken) return;
        setDecliningInviteId(invitationId);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/invitations/${invitationId}/decline`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!response.ok) throw new Error('Failed to decline invitation.');
            setInvitations(curr => curr.filter(i => i.id !== invitationId));
        } catch (err: any) {
            setPageError(err.message);
        } finally {
            setDecliningInviteId(null);
        }
    };

    const roleLabel = (role: string) => (role || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    const workspaceIconMap: Record<string, any> = {
        'default': { icon: Building2, color: 'bg-blue-500/10 text-blue-500' },
        'mail': { icon: Mail, color: 'bg-emerald-500/10 text-emerald-500' },
        'rocket': { icon: Rocket, color: 'bg-amber-500/10 text-amber-500' },
        'zap': { icon: Zap, color: 'bg-purple-500/10 text-purple-500' },
        'box': { icon: Box, color: 'bg-indigo-500/10 text-indigo-500' },
        'layout': { icon: Layout, color: 'bg-rose-500/10 text-rose-500' },
    };

    const getWorkspaceVisuals = (name: string, index: number) => {
        const keys = Object.keys(workspaceIconMap).filter(k => k !== 'default');
        const key = keys[index % keys.length];
        return workspaceIconMap[key];
    };

    return (
        <div className="max-w-[1280px] mx-auto space-y-16">
            {pageError && <InlineAlert variant="danger" title="Error" description={pageError} />}

            {/* Profile Header Section */}
            <div className="flex items-center gap-8 py-4">
                <UserAvatar email={user?.email} name={user?.fullName} size="xl" className="shadow-lg" />
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                        {user?.fullName}
                    </h1>
                    <p className="text-base text-[var(--text-muted)] opacity-80">{user?.email}</p>
                </div>
            </div>

            {/* Workspaces Section */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Workspaces</h2>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-sm font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" /> Create Workspace
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-32 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/30 animate-pulse" />
                        ))
                    ) : (workspaces.length === 0 && !pageError) ? (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-[var(--border)] rounded-2xl">
                            <Building2 className="w-12 h-12 text-[var(--text-muted)] opacity-20" />
                            <p className="text-sm text-[var(--text-muted)]">No workspaces yet. Create one to get started.</p>
                        </div>
                    ) : (
                        workspaces.map((workspace, idx) => {
                            const { icon: Icon, color } = getWorkspaceVisuals(workspace.workspace_name, idx);
                            return (
                                <button
                                    key={workspace.tenant_id}
                                    onClick={() => handleOpenWorkspace(workspace)}
                                    disabled={busyWorkspaceId === workspace.tenant_id}
                                    className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)]/40 hover:border-[var(--accent)]/30 hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                                >
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${color} shadow-sm group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-bold text-[var(--text-primary)] truncate text-base leading-tight">
                                                {workspace.workspace_name}
                                            </p>
                                            {busyWorkspaceId === workspace.tenant_id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)] truncate opacity-70 group-hover:opacity-100 transition-opacity mt-0.5">
                                            {roleLabel(workspace.plan)} plan • {roleLabel(workspace.role || 'viewer')}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Invitations Section */}
            <section className="space-y-8">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Invitations</h2>
                
                {invitations.length === 0 && !loading && !pageError ? (
                    <div className="p-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-between gap-8 group overflow-hidden relative">
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                <Users className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">No pending invitations</h3>
                                <p className="text-sm text-[var(--text-muted)] max-w-md">
                                    You're all caught up! There are no outstanding invitations at the moment.
                                </p>
                            </div>
                        </div>
                        {/* Decorative illustration-like elements (CSS circles) */}
                        <div className="hidden md:block absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
                            <div className="absolute top-1/2 right-10 w-24 h-24 bg-indigo-500 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute bottom-10 right-32 w-16 h-16 bg-blue-500 rounded-full blur-2xl" />
                        </div>
                    </div>
                ) : invitations.length > 0 ? (
                    <div className="space-y-4">
                        {invitations.map(invitation => (
                            <div key={invitation.id} className="flex items-center justify-between p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)]/40 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <MailPlus className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-[var(--text-primary)] text-base">{invitation.workspace_name}</p>
                                        <p className="text-sm text-[var(--text-muted)] opacity-70 group-hover:opacity-100 transition-opacity">
                                            Join as {roleLabel(invitation.role)} {invitation.inviter_name ? ` • invited by ${invitation.inviter_name}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => handleDeclineInvitation(invitation.id)}
                                        disabled={decliningInviteId === invitation.id || busyInviteId === invitation.id}
                                        className="text-sm font-bold text-[var(--text-muted)] hover:text-red-500 px-4 py-2 rounded-xl hover:bg-red-500/5 transition-all"
                                    >
                                        Decline
                                    </button>
                                    <Button 
                                        onClick={() => handleJoinInvitation(invitation)}
                                        isLoading={busyInviteId === invitation.id}
                                        disabled={decliningInviteId === invitation.id}
                                        className="px-6"
                                    >
                                        Accept
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : loading && (
                    <div className="h-32 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/30 animate-pulse" />
                )}
            </section>

            <ModalShell isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Workspace" maxWidthClass="max-w-md">
                <div className="space-y-6">
                    {createError && <InlineAlert variant="danger" title="Error" description={createError} />}
                    <Input
                        ref={createInputRef}
                        label="Workspace Name"
                        value={createName}
                        onChange={e => setCreateName(e.target.value)}
                        placeholder="e.g. Acme Corp"
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateWorkspace} isLoading={isCreating} disabled={!createName.trim()}>Create</Button>
                    </div>
                </div>
            </ModalShell>
        </div>
    );
}

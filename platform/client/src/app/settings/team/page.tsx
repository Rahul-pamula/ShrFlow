'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowUp, CheckCircle2, Download, Mail, RefreshCcw, Shield, Trash2, UserCog, UserPlus, Users, X, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { can } from '@/utils/permissions';
import { useRouter } from 'next/navigation';
import { Badge, Button, ConfirmModal, InlineAlert, Input, KeyValueList, ModalShell, PageHeader, SectionCard, StatCard, TableToolbar, useToast } from '@/components/ui';


const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type Role = 'owner' | 'manager' | 'member';
type IsolationModel = 'team' | 'agency';

interface Member {
    user_id: string;
    email: string;
    full_name: string | null;
    role: Role;
    joined_at: string;
}

interface Invite {
    id: string;
    email: string;
    role: Role;
    expires_at: string;
    created_at: string;
    inviter_id?: string;
    inviter_name?: string | null;
}

const selectClassName = 'rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20';

function RoleBadge({ role, isCurrentUser = false }: { role: Role; isCurrentUser?: boolean }) {
    const variant = role === 'owner' ? 'warning' : role === 'manager' ? 'info' : 'outline';
    return <Badge variant={variant}>{role}{isCurrentUser ? ' (You)' : ''}</Badge>;
}

export default function TeamSettingsPage() {
    const { token, user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const { success, error } = useToast();

    const [members, setMembers] = useState<Member[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'manager' | 'member'>('member');
    const [inviteIsolation, setInviteIsolation] = useState<IsolationModel>('team');
    const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [pendingRemoveMember, setPendingRemoveMember] = useState<Member | null>(null);
    const [pendingCancelInvite, setPendingCancelInvite] = useState<Invite | null>(null);
    const [pendingTransferMember, setPendingTransferMember] = useState<Member | null>(null);
    const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
    const [confirmBusy, setConfirmBusy] = useState(false);
    const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
    const [exportBusy, setExportBusy] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportRole, setExportRole] = useState<'all' | 'manager' | 'member'>('all');
    const [exportInvitedBy, setExportInvitedBy] = useState<string>('all');
    const [validationResult, setValidationResult] = useState<any>(null);
    const [isValidating, setIsValidating] = useState(false);

    const membersAbortRef = useRef<AbortController | null>(null);
    const invitesAbortRef = useRef<AbortController | null>(null);

    const myRole = members.find((member) => member.user_id === user?.userId)?.role || 'member';
    const isManagerOrOwner = myRole === 'manager' || myRole === 'owner';

    const metrics = useMemo(() => {
        const baseMetrics = [
            { label: 'Active Members', value: members.length.toString() },
            { label: 'Pending Invites', value: invites.length.toString() },
            { label: 'Owners / Managers', value: members.filter((member) => member.role !== 'member').length.toString() },
        ];
        if (validationResult && validationResult.limit !== -1) {
            baseMetrics.push({ 
                label: 'Seats Used', 
                value: `${validationResult.used} / ${validationResult.limit}` 
            });
        }
        return baseMetrics;
    }, [members, invites, validationResult]);

    useEffect(() => {
        if (!authLoading) {
            if (user && !can(user, 'VIEW_TEAM')) {
                router.replace('/dashboard');
            } else if (token) {
                fetchTeam();
            }
        }
        return () => {
            membersAbortRef.current?.abort();
            invitesAbortRef.current?.abort();
        };
    }, [authLoading, token, user]);

    if (authLoading || (user && !can(user, 'VIEW_TEAM'))) {
        return null;
    }


    const fetchTeam = async () => {
        if (!token) return;
        setLoading(true);
        try {
            membersAbortRef.current?.abort();
            invitesAbortRef.current?.abort();

            const memberController = new AbortController();
            const inviteController = new AbortController();
            membersAbortRef.current = memberController;
            invitesAbortRef.current = inviteController;

            const [memberResponse, inviteResponse] = await Promise.all([
                fetch(`${API_BASE}/team/members`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: memberController.signal,
                }),
                fetch(`${API_BASE}/team/invites`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: inviteController.signal,
                }),
            ]);

            if (memberResponse.ok) setMembers(await memberResponse.json());
            if (inviteResponse.ok) setInvites(await inviteResponse.json());
        } catch (fetchError: any) {
            if (fetchError.name !== 'AbortError') {
                console.error(fetchError);
                error('Failed to load team settings.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchValidation = async () => {
        if (!token) return;
        setIsValidating(true);
        try {
            const res = await fetch(`${API_BASE}/team/invites/validate`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setValidationResult(await res.json());
            }
        } catch (err) {
            console.error('Validation fetch failed:', err);
        } finally {
            setIsValidating(false);
        }
    };

    useEffect(() => {
        if (token) fetchValidation();
    }, [token]);

    useEffect(() => {
        // Restore pending invite if returning from an upgrade
        const savedInvite = localStorage.getItem('pending_team_invite');
        if (savedInvite && typeof window !== 'undefined') {
            try {
                const parsed = JSON.parse(savedInvite);
                // Check TTL (30 minutes)
                const now = Date.now();
                if (parsed.timestamp && now - parsed.timestamp > 30 * 60 * 1000) {
                    localStorage.removeItem('pending_team_invite');
                } else {
                    setInviteEmail(parsed.email || '');
                    setInviteRole(parsed.role || 'member');
                    setShowInviteModal(true);
                }
            } catch (e) {
                console.error("Failed to parse pending invite", e);
                localStorage.removeItem('pending_team_invite');
            }
        }
    }, []);

    const handleUpgradeClick = () => {
        if (inviteEmail || inviteRole !== 'member') {
            localStorage.setItem('pending_team_invite', JSON.stringify({ 
                email: inviteEmail, 
                role: inviteRole,
                timestamp: Date.now()
            }));
            localStorage.setItem('upgrade_return_path', '/settings/team');
        }
        router.push('/settings/billing');
    };

    const resetInviteForm = () => {
        setInviteEmail('');
        setInviteRole('member');
        setInviteStatus('idle');
        localStorage.removeItem('pending_team_invite');
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !inviteEmail.trim()) return;

        setInviteStatus('sending');
        try {
            const res = await fetch(`${API_BASE}/team/invites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole,
                }),
            });

            if (!res.ok) throw new Error(await res.text());

            setInviteStatus('success');
            success(`Invitation sent to ${inviteEmail}.`);
            setTimeout(() => {
                setShowInviteModal(false);
                resetInviteForm();
                fetchTeam();
                fetchValidation();
            }, 900);
        } catch (inviteError) {
            console.error(inviteError);
            setInviteStatus('error');
        }
    };

    const handleRemoveMember = async () => {
        if (!pendingRemoveMember) return;
        setConfirmBusy(true);
        try {
            const res = await fetch(`${API_BASE}/team/members/${pendingRemoveMember.user_id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to remove member.');
            success(`Removed ${pendingRemoveMember.email} from the workspace.`);
            setPendingRemoveMember(null);
            fetchTeam();
            fetchValidation();
        } catch (removeError) {
            console.error(removeError);
            error('Could not remove that member.');
        } finally {
            setConfirmBusy(false);
        }
    };

    const handleLeaveWorkspace = async () => {
        setConfirmBusy(true);
        try {
            const res = await fetch(`${API_BASE}/team/members/me/leave`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_data');
                window.location.href = '/login';
                return;
            }

            const data = await res.json();
            throw new Error(data.detail || 'Failed to leave workspace.');
        } catch (leaveError: any) {
            console.error(leaveError);
            error(leaveError.message || 'An error occurred while leaving the workspace.');
        } finally {
            setConfirmBusy(false);
            setConfirmLeaveOpen(false);
        }
    };

    const handleCancelInvite = async () => {
        if (!pendingCancelInvite) return;
        setConfirmBusy(true);
        try {
            const res = await fetch(`${API_BASE}/team/invites/${pendingCancelInvite.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to cancel invitation.');
            success(`Canceled invitation for ${pendingCancelInvite.email}.`);
            setPendingCancelInvite(null);
            fetchTeam();
        } catch (cancelError) {
            console.error(cancelError);
            error('Could not cancel that invitation.');
        } finally {
            setConfirmBusy(false);
        }
    };

    const handleResendInvite = async (invite: Invite) => {
        setResendingInviteId(invite.id);
        try {
            const res = await fetch(`${API_BASE}/team/invites/${invite.id}/resend`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to resend invitation.');
            }
            success(`Invitation resent to ${invite.email}.`);
            fetchTeam();
        } catch (resendError: any) {
            console.error(resendError);
            error(resendError.message || 'Could not resend that invitation.');
        } finally {
            setResendingInviteId(null);
        }
    };

    const handleExportMembers = async (e: React.FormEvent) => {
        e.preventDefault();
        setExportBusy(true);
        try {
            const params = new URLSearchParams();
            if (exportRole !== 'all') params.append('role', exportRole);
            if (exportInvitedBy !== 'all') params.append('invited_by', exportInvitedBy);
            
            const res = await fetch(`${API_BASE}/team/members/export?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to export members.');
            }

            const blob = await res.blob();
            const disposition = res.headers.get('Content-Disposition') || '';
            const match = disposition.match(/filename="?([^"]+)"?/i);
            const filename = match?.[1] || 'workspace_team_members.csv';
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setShowExportModal(false);
            success('Team member export downloaded.');
        } catch (exportError: any) {
            console.error(exportError);
            error(exportError.message || 'Could not export workspace members.');
        } finally {
            setExportBusy(false);
        }
    };

    const handleTransferOwnership = async () => {
        if (!pendingTransferMember) return;
        setConfirmBusy(true);
        try {
            const res = await fetch(`${API_BASE}/team/members/${pendingTransferMember.user_id}/transfer-ownership`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ new_owner_role_for_current_user: 'manager' }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to transfer ownership.');
            }
            success(`Ownership transferred to ${pendingTransferMember.email}.`);
            setPendingTransferMember(null);
            fetchTeam();
        } catch (transferError: any) {
            console.error(transferError);
            error(transferError.message || 'Could not transfer ownership.');
        } finally {
            setConfirmBusy(false);
        }
    };

    const handleChangeMember = async (userId: string, field: 'role', value: string) => {
        try {
            const res = await fetch(`${API_BASE}/team/members/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ [field]: value }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Update failed.');
            }
            success('Member permissions updated.');
            fetchTeam();
        } catch (updateError: any) {
            error(updateError.message || 'Failed to update member.');
        }
    };

    const pendingInviteError = inviteStatus === 'error';

    if (loading) {
        return <div className="p-12 text-sm text-[var(--text-muted)]">Loading team settings...</div>;
    }

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Team Members"
                subtitle="Manage workspace access and roles so campaign work and infrastructure control stay appropriately separated."
                action={
                    isManagerOrOwner ? (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
                                <Download className="mr-2 h-4 w-4" />
                                 Export
                            </Button>
                            {validationResult?.status === 'LIMIT_EXCEEDED' ? (
                                <Button size="sm" variant="primary" onClick={handleUpgradeClick} className="bg-gradient-to-r from-[var(--accent)] to-[#6366f1] hover:opacity-90">
                                    <ArrowUp className="mr-2 h-4 w-4" />
                                    Upgrade to Add Members
                                </Button>
                            ) : (
                                <Button size="sm" onClick={() => setShowInviteModal(true)} isLoading={isValidating}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite Member
                                </Button>
                            )}
                        </div>
                    ) : undefined
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <StatCard key={metric.label} label={metric.label} value={metric.value} icon={<Users className="h-5 w-5" />} />
                ))}
            </div>

            {!isManagerOrOwner && (
                <InlineAlert
                    variant="info"
                    title="Workspace management is limited"
                    description="Only owners and managers can invite members, remove users, or change workspace-level permissions."
                />
            )}

            <SectionCard title="Active Members" description="Use roles for administrative scope boundaries.">
                <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)]">
                    <TableToolbar
                        title="Workspace Access"
                        description="The person with owner access can control role changes."
                        trailing={<Badge variant="outline">{members.length} active</Badge>}
                        className="rounded-none border-0 border-b border-[var(--border)]"
                    />
                    <div className="divide-y divide-[var(--border)]">
                        {members.map((member) => {
                            const isCurrentUser = member.user_id === user?.userId;
                            const canEditMember = myRole === 'owner' && !isCurrentUser;
                            return (
                                <div key={member.user_id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-hover)] font-semibold text-[var(--text-primary)]">
                                            {(member.full_name || member.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{member.full_name || 'No name provided'}</p>
                                            <p className="text-sm text-[var(--text-muted)]">{member.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 lg:items-end">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {canEditMember ? (
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleChangeMember(member.user_id, 'role', e.target.value)}
                                                    className={selectClassName}
                                                >
                                                    <option value="owner">Owner</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="member">Member</option>
                                                </select>
                                            ) : (
                                                <RoleBadge role={member.role} isCurrentUser={isCurrentUser} />
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-[var(--text-muted)]">Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                                            {isCurrentUser && member.role !== 'owner' && (
                                                <Button variant="ghost" size="sm" className="text-[var(--danger)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]" onClick={() => setConfirmLeaveOpen(true)}>
                                                    <Shield className="h-3.5 w-3.5" />
                                                    Leave
                                                </Button>
                                            )}
                                            {myRole === 'owner' && member.role !== 'owner' && !isCurrentUser && (
                                                <Button variant="ghost" size="sm" onClick={() => setPendingTransferMember(member)}>
                                                    <UserCog className="h-3.5 w-3.5" />
                                                    Make Owner
                                                </Button>
                                            )}
                                            {isManagerOrOwner && member.role !== 'owner' && !isCurrentUser && (
                                                <Button variant="ghost" size="sm" className="text-[var(--danger)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]" onClick={() => setPendingRemoveMember(member)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SectionCard>

            {invites.length > 0 && (
                <SectionCard title="Pending Invites" description="Keep an eye on expiring invitations so access doesn’t stall during onboarding.">
                    <div className="divide-y divide-[var(--border)] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)]">
                        {invites.map((invite) => {
                            const isExpired = new Date(invite.expires_at) < new Date();
                            return (
                                <div key={invite.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-hover)]">
                                            <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{invite.email}</p>
                                            <p className="text-sm text-[var(--text-muted)]">Invited as {invite.role}</p>
                                            {invite.inviter_name && <p className="text-xs text-[var(--text-muted)]">Sent by {invite.inviter_name}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isExpired ? (
                                            <Badge variant="danger">Expired</Badge>
                                        ) : (
                                            <span className="text-xs text-[var(--text-muted)]">Expires {new Date(invite.expires_at).toLocaleDateString()}</span>
                                        )}
                                        {(isManagerOrOwner || invite.inviter_id === user?.userId) && (
                                            <Button variant="ghost" size="sm" onClick={() => handleResendInvite(invite)} isLoading={resendingInviteId === invite.id}>
                                                <RefreshCcw className="h-3.5 w-3.5" />
                                                Resend
                                            </Button>
                                        )}
                                        {(isManagerOrOwner || invite.inviter_id === user?.userId) && (
                                            <Button variant="ghost" size="sm" className="text-[var(--danger)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]" onClick={() => setPendingCancelInvite(invite)}>
                                                <X className="h-3.5 w-3.5" />
                                                Cancel Invite
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>
            )}

            <SectionCard title="Roles & Permissions" description="This matrix keeps administrative control boundaries explicit across the workspace.">
                <KeyValueList
                    columns={2}
                    items={[
                        { label: 'Owner', value: 'Full access', helper: 'Can manage roles, domains, and billing.' },
                        { label: 'Manager', value: 'Operational manager', helper: 'Can manage domains, invites, and shared workspace operations.' },
                        { label: 'Team Member', value: 'Shared workspace contributor', helper: 'Can create campaigns and import contacts.' },
                    ]}
                />
                <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4 text-sm text-[var(--text-muted)]">
                    Owners and managers can manage sending domains and members.
                </div>
            </SectionCard>

            <ModalShell
                isOpen={showInviteModal}
                onClose={() => {
                    if (inviteStatus === 'sending') return;
                    setShowInviteModal(false);
                    resetInviteForm();
                }}
                title="Invite Team Member"
                description="An invitation link will be sent to their email. Choose the workspace role before sending."
                maxWidthClass="max-w-md"
            >
                <form onSubmit={handleSendInvite} className="space-y-6">
                    {validationResult?.status === 'LIMIT_EXCEEDED' ? (
                        <div className="space-y-6">
                            <div className="rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg)]/20 p-6">
                                <div className="flex items-center gap-3 text-[var(--danger)]">
                                    <AlertTriangle className="h-6 w-6" />
                                    <h3 className="text-base font-bold">Team Limit Reached</h3>
                                </div>
                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">Your plan allows:</span>
                                        <span className="font-semibold text-[var(--text-primary)]">{validationResult.limit} user{validationResult.limit !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">Current total:</span>
                                        <span className="font-semibold text-[var(--text-primary)]">{validationResult.current} member{validationResult.current !== 1 ? 's' : ''}</span>
                                    </div>
                                    <p className="mt-3 text-xs italic text-[var(--text-muted)] border-t border-[var(--danger-border)] pt-3">
                                        🚫 Upgrade your plan to add managers and members.
                                    </p>
                                </div>
                            </div>

                            {validationResult.recommended_plan && (
                                <div className="rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--accent)]/5 p-6">
                                    <div className="flex items-center gap-3 text-[var(--accent)]">
                                        <Zap className="h-5 w-5" />
                                        <h4 className="text-sm font-bold uppercase tracking-wider">Recommended Plan</h4>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-bold text-[var(--text-primary)]">{validationResult.recommended_plan.name}</p>
                                            <p className="text-xs text-[var(--text-muted)]">Allows up to {validationResult.recommended_plan.limit === -1 ? 'Unlimited' : validationResult.recommended_plan.limit} users</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{validationResult.recommended_plan.price}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button type="button" onClick={handleUpgradeClick} fullWidth className="bg-gradient-to-r from-[var(--accent)] to-[#6366f1]">
                                    Upgrade Plan
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => { setShowInviteModal(false); resetInviteForm(); }} fullWidth>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Input
                                label="Email Address"
                                type="email"
                                required
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="colleague@company.com"
                                autoFocus
                            />

                            <div className="grid grid-cols-1 gap-6">
                                <SectionCard title="Workspace Role" description="Controls administrative permissions inside the workspace." noPadding className="border-0 bg-transparent">
                                    <div className="grid gap-3">
                                        {(user?.role === 'MANAGER' ? ['member'] as const : ['member', 'manager'] as const).map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => setInviteRole(role)}
                                                disabled={validationResult?.used >= validationResult?.limit && validationResult?.limit !== -1}
                                                className={`rounded-[var(--radius)] border p-4 text-left transition ${inviteRole === role ? 'border-[var(--accent)] bg-[var(--info-bg)]/40' : 'border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)]'} disabled:opacity-50`}
                                            >
                                                <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">{role}</p>
                                                <p className="mt-1 text-xs text-[var(--text-muted)]">{role === 'manager' ? 'Manage domains, invites, and member access.' : 'Build campaigns and work with audience data.'}</p>
                                            </button>
                                        ))}
                                    </div>
                                </SectionCard>
                            </div>

                            {pendingInviteError && (
                                <InlineAlert
                                    variant="danger"
                                    title="Failed to send invite"
                                    description="The user may already exist in an isolated state or the invitation could not be created."
                                    icon={<AlertTriangle className="mt-0.5 h-4 w-4" />}
                                />
                            )}

                            {inviteStatus === 'success' && (
                                <InlineAlert
                                    variant="success"
                                    title="Invite sent"
                                    description="The invitation email has been issued successfully."
                                    icon={<CheckCircle2 className="mt-0.5 h-4 w-4" />}
                                />
                            )}

                            <div className="flex items-center justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => { setShowInviteModal(false); resetInviteForm(); }} disabled={inviteStatus === 'sending'}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={inviteStatus === 'sending'} disabled={inviteStatus === 'success' || (validationResult?.used >= validationResult?.limit && validationResult?.limit !== -1)}>
                                    Send Invitation Link
                                </Button>
                            </div>
                        </>
                    )}
                </form>
            </ModalShell>

            <ConfirmModal
                isOpen={Boolean(pendingRemoveMember)}
                onClose={() => setPendingRemoveMember(null)}
                onConfirm={handleRemoveMember}
                title="Remove team member?"
                message={pendingRemoveMember ? `${pendingRemoveMember.email} will lose access to campaigns, contacts, and workspace history.` : 'Remove this member.'}
                confirmLabel="Remove Member"
                isLoading={confirmBusy && Boolean(pendingRemoveMember)}
            />

            <ConfirmModal
                isOpen={Boolean(pendingCancelInvite)}
                onClose={() => setPendingCancelInvite(null)}
                onConfirm={handleCancelInvite}
                title="Cancel invitation?"
                message={pendingCancelInvite ? `This will invalidate the invite sent to ${pendingCancelInvite.email}.` : 'Cancel this invitation.'}
                confirmLabel="Cancel Invitation"
                isLoading={confirmBusy && Boolean(pendingCancelInvite)}
                variant="warning"
            />

            <ConfirmModal
                isOpen={Boolean(pendingTransferMember)}
                onClose={() => setPendingTransferMember(null)}
                onConfirm={handleTransferOwnership}
                title="Transfer ownership?"
                message={pendingTransferMember ? `${pendingTransferMember.email} will become the new owner of this workspace, and you will become a manager.` : 'Transfer ownership.'}
                confirmLabel="Transfer Ownership"
                isLoading={confirmBusy && Boolean(pendingTransferMember)}
                variant="warning"
            />

            <ConfirmModal
                isOpen={confirmLeaveOpen}
                onClose={() => setConfirmLeaveOpen(false)}
                onConfirm={handleLeaveWorkspace}
                title="Leave workspace?"
                message="Are you sure you want to leave this workspace? You will lose access immediately."
                confirmLabel="Leave Workspace"
                isLoading={confirmBusy}
            >
                <div className="rounded-[var(--radius)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2 text-sm text-[var(--text-primary)]">
                    You will need a fresh invitation to regain access later.
                </div>
            </ConfirmModal>

            <ModalShell
                isOpen={showExportModal}
                onClose={() => !exportBusy && setShowExportModal(false)}
                title="Export Workspace Members"
                description="Download a CSV file of members in this workspace."
            >
                <form onSubmit={handleExportMembers} className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                                Filter by Role
                            </label>
                            <select
                                value={exportRole}
                                onChange={(e) => setExportRole(e.target.value as any)}
                                className={selectClassName + ' w-full'}
                                disabled={exportBusy}
                            >
                                <option value="all">All Roles</option>
                                <option value="manager">Managers Only</option>
                                <option value="member">Members Only</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                                Filter by Inviter
                            </label>
                            <select
                                value={exportInvitedBy}
                                onChange={(e) => setExportInvitedBy(e.target.value)}
                                className={selectClassName + ' w-full'}
                                disabled={exportBusy || myRole === 'manager'}
                            >
                                <option value="all">All Members</option>
                                {myRole === 'manager' ? (
                                    <option value={user?.userId || 'me'}>Invited by Me</option>
                                ) : (
                                    <>
                                        <option value={user?.userId || 'me'}>Invited by Me</option>
                                        {members
                                            .filter(m => m.role === 'manager' && m.user_id !== user?.userId)
                                            .map(m => (
                                                <option key={m.user_id} value={m.user_id}>
                                                    Invited by {m.full_name || m.email}
                                                </option>
                                            ))
                                        }
                                    </>
                                )}
                            </select>
                            {myRole === 'manager' && (
                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    As a Manager, you can only export members you invited.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowExportModal(false)} disabled={exportBusy}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={exportBusy}>
                            Download CSV
                        </Button>
                    </div>
                </form>
            </ModalShell>
        </div>
    );
}

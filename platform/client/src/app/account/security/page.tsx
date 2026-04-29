'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Eye, EyeOff, Lock, Shield, Smartphone, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { Button, InlineAlert, Input, KeyValueList, ModalShell, PageHeader, SectionCard, StatCard, useToast } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface DeletionBlockingReason {
    code: string;
    tenant_id: string;
    workspace_name: string;
    role: string;
    message: string;
}

interface DeletionAction {
    type: string;
    tenant_id: string;
    workspace_name: string;
    cta_label: string;
    cta_href: string;
}

interface WorkspaceImpact {
    tenant_id: string;
    workspace_name: string;
    role: string;
    member_count: number;
    admin_count: number;
    workspace_status: string;
    outcome: string;
}

interface DeletionPreflight {
    account_status: string;
    deletion_scheduled_at?: string | null;
    can_request_deletion: boolean;
    blocking_reasons: DeletionBlockingReason[];
    actions_required: DeletionAction[];
    workspace_impacts: WorkspaceImpact[];
}

export default function AccountSecurityPage() {
    const { token, user } = useAuth();
    const { success, error } = useToast();

    const [current, setCurrent] = useState('');
    const [nextPassword, setNextPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [deletionState, setDeletionState] = useState<DeletionPreflight | null>(null);
    const [deletionError, setDeletionError] = useState('');
    const [isDeletionLoading, setIsDeletionLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [confirmDeleteText, setConfirmDeleteText] = useState('');
    const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
    const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);

    useEffect(() => {
        if (!token) return;
        void loadDeletionPreflight();
    }, [token]);

    const pendingDeletionDate = useMemo(() => {
        if (!deletionState?.deletion_scheduled_at) return null;
        try {
            return new Date(deletionState.deletion_scheduled_at).toLocaleString();
        } catch {
            return deletionState.deletion_scheduled_at;
        }
    }, [deletionState?.deletion_scheduled_at]);

    const loadDeletionPreflight = async () => {
        if (!token) return;

        setIsDeletionLoading(true);
        setDeletionError('');
        try {
            const response = await fetch(`${API_BASE}/account/delete/preflight`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to load account deletion checks.');
            }

            setDeletionState(data);
        } catch (preflightError: any) {
            setDeletionError(preflightError.message || 'Failed to load account deletion checks.');
            error(preflightError.message || 'Failed to load account deletion checks.');
        } finally {
            setIsDeletionLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setFormError('');
        setFormSuccess('');

        if (!current || !nextPassword || !confirm) {
            setFormError('All password fields are required.');
            return;
        }
        if (nextPassword.length < 8) {
            setFormError('New password must be at least 8 characters.');
            return;
        }
        if (nextPassword !== confirm) {
            setFormError('New passwords do not match.');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`${API_BASE}/auth/change-password`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_password: current,
                    new_password: nextPassword,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to update password.');
            }

            setCurrent('');
            setNextPassword('');
            setConfirm('');
            setFormSuccess('Password updated successfully.');
            success('Password updated successfully.');
        } catch (changeError: any) {
            setFormError(changeError.message || 'Could not update password.');
            error(changeError.message || 'Could not update password.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRequestDeletion = async () => {
        if (!token) return;

        setIsSubmittingDeletion(true);
        setDeletionError('');
        try {
            const response = await fetch(`${API_BASE}/account/delete`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to request account deletion.');
            }

            setIsDeleteModalOpen(false);
            setConfirmDeleteText('');
            success('Account deletion scheduled. You can cancel it during the grace period.');
            await loadDeletionPreflight();
        } catch (requestError: any) {
            setDeletionError(requestError.message || 'Failed to request account deletion.');
            error(requestError.message || 'Failed to request account deletion.');
        } finally {
            setIsSubmittingDeletion(false);
        }
    };

    const handleCancelDeletion = async () => {
        if (!token) return;

        setIsCancellingDeletion(true);
        setDeletionError('');
        try {
            const response = await fetch(`${API_BASE}/account/cancel-deletion`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to cancel account deletion.');
            }

            success('Account deletion cancelled.');
            await loadDeletionPreflight();
        } catch (cancelError: any) {
            setDeletionError(cancelError.message || 'Failed to cancel account deletion.');
            error(cancelError.message || 'Failed to cancel account deletion.');
        } finally {
            setIsCancellingDeletion(false);
        }
    };

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Account Security"
                subtitle="Manage password hygiene and future account-protection controls at the identity layer, separate from workspace operations."
                action={
                    <Link href="/account">
                        <Button variant="secondary">Back to Account</Button>
                    </Link>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Account Email" value={user?.email || 'Unknown'} icon={<Lock className="h-5 w-5" />} />
                <StatCard label="Password" value="Managed" icon={<Shield className="h-5 w-5" />} />
                <StatCard label="Two-Factor Auth" value="Coming Soon" icon={<Smartphone className="h-5 w-5" />} />
            </div>

            {deletionState?.account_status === 'pending_deletion' && (
                <InlineAlert
                    variant="warning"
                    title="Account deletion scheduled"
                    description={`Your account is scheduled for anonymization${pendingDeletionDate ? ` on ${pendingDeletionDate}` : ''}. Workspace memberships and refresh tokens will be revoked when the grace period ends.`}
                    icon={<AlertTriangle className="mt-0.5 h-4 w-4" />}
                    action={
                        <Button variant="secondary" onClick={handleCancelDeletion} isLoading={isCancellingDeletion}>
                            Cancel Deletion
                        </Button>
                    }
                />
            )}

            <SectionCard
                title="Identity Access"
                description="These controls affect how you sign in to ShrFlow itself, regardless of which workspace you enter."
            >
                <KeyValueList
                    columns={2}
                    items={[
                        { label: 'Primary Email', value: user?.email || 'Not available', helper: 'Used for sign-in, recovery, and invitations.' },
                        { label: 'Security Scope', value: 'Account-wide', helper: 'Password and future MFA settings apply to your identity, not one workspace.' },
                    ]}
                />
            </SectionCard>

            <SectionCard
                title="Password & Recovery"
                description="Password changes and recovery access belong here, but they should stay one step deeper than the main security landing view."
            >
                <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Password access</p>
                        <p className="text-sm text-[var(--text-muted)]">
                            Change your password, keep recovery access healthy, and manage sign-in hygiene without mixing these controls into workspace settings.
                        </p>
                    </div>
                    <Button variant="secondary" onClick={() => setIsPasswordModalOpen(true)}>
                        Change Password
                    </Button>
                </div>

                {formSuccess && <InlineAlert variant="success" title="Password updated" description={formSuccess} />}
            </SectionCard>

            <SectionCard
                tone="subtle"
                title="Two-Factor Authentication"
                description="Authenticator-app protection belongs here as an account-level control. The product scaffolding can point here even before the full TOTP flow ships."
            >
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-muted)]">
                    <Smartphone className="h-4 w-4" />
                    Coming Soon
                </div>
            </SectionCard>

            <SectionCard
                tone="danger"
                title="Delete Account"
                description="Delete the account identity, not the historical workspace records. Personal identifiers are anonymized after a 30-day grace period while campaigns, contacts, templates, audit logs, and analytics stay intact."
            >
                <div className="space-y-5">
                    {deletionError && (
                        <InlineAlert
                            variant="danger"
                            title="Deletion flow unavailable"
                            description={deletionError}
                        />
                    )}

                    {isDeletionLoading ? (
                        <p className="text-sm text-[var(--text-muted)]">Loading deletion checks...</p>
                    ) : deletionState ? (
                        <>
                            <KeyValueList
                                columns={2}
                                items={[
                                    { label: 'Grace Period', value: '30 days', helper: 'The account can be restored before anonymization runs.' },
                                    { label: 'Current Status', value: deletionState.account_status.replace(/_/g, ' '), helper: 'Active accounts can request deletion. Pending deletion accounts can still cancel.' },
                                ]}
                            />

                            {deletionState.blocking_reasons.length > 0 ? (
                                <div className="space-y-3">
                                    <InlineAlert
                                        variant="warning"
                                        title="Deletion is currently blocked"
                                        description="Resolve the workspace ownership or admin coverage issues below before trying again."
                                    />
                                    <div className="space-y-3">
                                        {deletionState.blocking_reasons.map((reason) => (
                                            <div key={`${reason.code}-${reason.tenant_id}`} className="rounded-[var(--radius)] border border-[var(--warning)]/20 bg-[var(--warning)]/5 p-4">
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">{reason.workspace_name}</p>
                                                <p className="mt-1 text-sm text-[var(--text-muted)]">{reason.message}</p>
                                                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Role: {reason.role}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <InlineAlert
                                    variant="info"
                                    title="Deletion is available"
                                    description="No ownership or admin blockers were found. Solo-owned workspaces will be marked pending deletion alongside your account."
                                />
                            )}

                            {deletionState.actions_required.length > 0 && (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {deletionState.actions_required.map((action) => (
                                        <div key={`${action.type}-${action.tenant_id}`} className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                                            <div className="pr-4">
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">{action.workspace_name}</p>
                                                <p className="mt-1 text-sm text-[var(--text-muted)]">
                                                    {action.type === 'transfer_ownership' ? 'Transfer ownership before deleting the account.' : 'Promote another admin before deleting the account.'}
                                                </p>
                                            </div>
                                            <Link href={action.cta_href}>
                                                <Button variant="secondary">
                                                    {action.cta_label}
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">Workspace impact</p>
                                <div className="mt-3 space-y-3">
                                    {deletionState.workspace_impacts.map((impact) => (
                                        <div key={impact.tenant_id} className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-sm font-medium text-[var(--text-primary)]">{impact.workspace_name}</span>
                                                <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{impact.role}</span>
                                            </div>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                {impact.outcome === 'pending_deletion'
                                                    ? 'This solo-owned workspace will be marked pending deletion.'
                                                    : impact.outcome === 'blocked'
                                                        ? 'This workspace is currently blocking account deletion.'
                                                        : 'Your membership will be removed when anonymization runs.'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">Schedule account deletion</p>
                                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                                        This revokes refresh tokens immediately and queues anonymization after the grace period.
                                    </p>
                                </div>
                                <Button
                                    variant="danger"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    disabled={!deletionState.can_request_deletion || deletionState.account_status === 'pending_deletion'}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Account
                                </Button>
                            </div>
                        </>
                    ) : null}
                </div>
            </SectionCard>

            <ModalShell
                isOpen={isPasswordModalOpen}
                onClose={() => {
                    if (isSaving) return;
                    setIsPasswordModalOpen(false);
                    setFormError('');
                    setCurrent('');
                    setNextPassword('');
                    setConfirm('');
                }}
                title="Change Password"
                description="Update your account password here. Forgot-password and recovery flows remain public identity flows outside workspace settings."
                maxWidthClass="max-w-xl"
            >
                <div className="space-y-4">
                    <div className="relative">
                        <Input
                            type={showCurrent ? 'text' : 'password'}
                            label="Current Password"
                            value={current}
                            onChange={(event) => setCurrent(event.target.value)}
                            className="pr-11"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent((value) => !value)}
                            className="absolute right-3 top-[37px] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                        >
                            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    <div className="relative">
                        <Input
                            type={showNext ? 'text' : 'password'}
                            label="New Password"
                            helperText="Minimum 8 characters."
                            value={nextPassword}
                            onChange={(event) => setNextPassword(event.target.value)}
                            className="pr-11"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNext((value) => !value)}
                            className="absolute right-3 top-[37px] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                        >
                            {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    <Input
                        type="password"
                        label="Confirm New Password"
                        value={confirm}
                        onChange={(event) => setConfirm(event.target.value)}
                    />

                    {formError && <InlineAlert variant="danger" title="Password update failed" description={formError} />}

                    <div className="flex items-center justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsPasswordModalOpen(false);
                                setFormError('');
                                setCurrent('');
                                setNextPassword('');
                                setConfirm('');
                            }}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleChangePassword} isLoading={isSaving}>
                            Update Password
                        </Button>
                    </div>
                </div>
            </ModalShell>

            <ModalShell
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setConfirmDeleteText('');
                }}
                title="Delete Account"
                description="Type DELETE to confirm. Your account enters a 30-day grace period before anonymization."
                maxWidthClass="max-w-xl"
            >
                <div className="space-y-5">
                    <InlineAlert
                        variant="danger"
                        title="This is an account-level action"
                        description="Campaign history, contacts, templates, analytics, and audit logs stay intact, but your personal identity fields and workspace memberships will be anonymized after the grace period."
                    />

                    <Input
                        label='Type "DELETE" to confirm'
                        value={confirmDeleteText}
                        onChange={(event) => setConfirmDeleteText(event.target.value)}
                        autoFocus
                    />

                    <div className="flex items-center justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setConfirmDeleteText('');
                            }}
                            disabled={isSubmittingDeletion}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleRequestDeletion}
                            isLoading={isSubmittingDeletion}
                            disabled={confirmDeleteText !== 'DELETE'}
                        >
                            <Trash2 className="h-4 w-4" />
                            Confirm Deletion
                        </Button>
                    </div>
                </div>
            </ModalShell>
        </div>
    );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
    AlertTriangle, 
    ArrowLeft, 
    ChevronRight, 
    Eye, 
    EyeOff, 
    Lock, 
    Shield, 
    Smartphone, 
    Trash2, 
    LogOut,
    Mail,
    Key,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, InlineAlert, Input, ModalShell, useToast } from '@/components/ui';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface DeletionPreflight {
    account_status: string;
    deletion_scheduled_at?: string | null;
    can_request_deletion: boolean;
    blocking_reasons: any[];
    actions_required: any[];
    workspace_impacts: any[];
}

export default function AccountSecurityPage() {
    const { token, user, logout } = useAuth();
    const { success, error } = useToast();

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [current, setCurrent] = useState('');
    const [nextPassword, setNextPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [deletionState, setDeletionState] = useState<DeletionPreflight | null>(null);
    const [deletionError, setDeletionError] = useState('');
    const [isDeletionLoading, setIsDeletionLoading] = useState(true);
    const [confirmDeleteText, setConfirmDeleteText] = useState('');
    const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
    const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);

    useEffect(() => {
        if (token) loadDeletionPreflight();
    }, [token]);

    const loadDeletionPreflight = async () => {
        setIsDeletionLoading(true);
        try {
            const res = await fetch(`${API_BASE}/account/delete/preflight`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to load deletion checks.');
            setDeletionState(data);
        } catch (err: any) {
            setDeletionError(err.message);
        } finally {
            setIsDeletionLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setFormError('');
        if (!current || !nextPassword || !confirm) return setFormError('All fields required.');
        if (nextPassword.length < 8) return setFormError('Minimum 8 characters required.');
        if (nextPassword !== confirm) return setFormError('Passwords do not match.');

        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE}/auth/change-password`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_password: current, new_password: nextPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to update password.');
            success('Password updated.');
            setIsPasswordModalOpen(false);
            setCurrent(''); setNextPassword(''); setConfirm('');
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleForgotPassword = async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user?.email }),
            });
            if (!res.ok) throw new Error('Failed to send reset email.');
            success('Reset email sent.');
        } catch (err: any) {
            error(err.message);
        }
    };

    const handleRequestDeletion = async () => {
        setIsSubmittingDeletion(true);
        try {
            const res = await fetch(`${API_BASE}/account/delete`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to request deletion.');
            success('Deletion scheduled.');
            setIsDeleteModalOpen(false);
            loadDeletionPreflight();
        } catch (err: any) {
            error(err.message);
        } finally {
            setIsSubmittingDeletion(false);
        }
    };

    const handleCancelDeletion = async () => {
        setIsCancellingDeletion(true);
        try {
            const res = await fetch(`${API_BASE}/account/cancel-deletion`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to cancel deletion.');
            success('Deletion cancelled.');
            loadDeletionPreflight();
        } catch (err: any) {
            error(err.message);
        } finally {
            setIsCancellingDeletion(false);
        }
    };

    return (
        <div className="max-w-[1280px] mx-auto space-y-12">
            {/* Top Bar */}
            <div className="flex items-center gap-4">
                <Link 
                    href="/account" 
                    className="p-2 -ml-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Security</h1>
            </div>

            {deletionState?.account_status === 'pending_deletion' && (
                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-3">
                        <div>
                            <p className="text-lg font-bold text-amber-500 leading-none">Account deletion scheduled</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl leading-relaxed">
                                Your account is scheduled for anonymization. All your personal data will be removed. You can cancel this request at any time before the deadline.
                            </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={handleCancelDeletion} isLoading={isCancellingDeletion}>
                            Cancel Deletion
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password Card */}
                <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                                <Key className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">Password</h3>
                                <p className="text-sm text-[var(--text-muted)] mt-1 opacity-80 leading-relaxed">
                                    Last updated recently. Ensure your password is at least 8 characters long.
                                </p>
                            </div>
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="border border-[var(--border)] px-6"
                            >
                                Change Password
                            </Button>
                        </div>
                    </div>
                    {/* Decorative glow */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                </div>

                {/* Recovery Card */}
                <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                                <Mail className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">Recovery</h3>
                                <p className="text-sm text-[var(--text-muted)] mt-1 opacity-80 leading-relaxed">
                                    Lost access to your account? We'll send a secure link to your registered email.
                                </p>
                            </div>
                            <Button 
                                variant="ghost" 
                                onClick={handleForgotPassword}
                                className="text-[var(--accent)] hover:text-[var(--accent-hover)] hover:bg-[var(--accent)]/5 px-6"
                            >
                                Reset via Email
                            </Button>
                        </div>
                    </div>
                    {/* Decorative glow */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
                </div>

                {/* 2FA Card */}
                <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-4">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-sm group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">Two-Factor Auth</h3>
                                <p className="text-sm text-[var(--text-muted)] mt-1 opacity-80 leading-relaxed">
                                    Add an extra layer of security by requiring more than just a password to sign in.
                                </p>
                            </div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                Coming Soon
                            </div>
                        </div>
                    </div>
                    {/* Decorative glow */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
                </div>

                {/* Sign Out Card */}
                <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-4">
                            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm group-hover:scale-110 transition-transform">
                                <LogOut className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">Active Session</h3>
                                <p className="text-sm text-[var(--text-muted)] mt-1 opacity-80 leading-relaxed">
                                    Signing out will terminate your current session on this device.
                                </p>
                            </div>
                            <Button 
                                variant="ghost" 
                                onClick={() => void logout()}
                                className="text-red-500 hover:bg-red-500/10 px-6"
                            >
                                Sign Out
                            </Button>
                        </div>
                    </div>
                    {/* Decorative glow */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors" />
                </div>
            </div>

            {/* Danger Zone Section */}
            <div className="pt-12">
                <div className="p-8 rounded-2xl border border-red-500/20 bg-red-500/5 relative overflow-hidden group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-red-500">Danger Zone</h3>
                            <p className="text-sm text-[var(--text-muted)] opacity-80 max-w-xl">
                                Permanently delete your account and all associated data. This action is irreversible.
                            </p>
                        </div>
                        <Button 
                            variant="danger"
                            onClick={() => setIsDeleteModalOpen(true)}
                            disabled={isDeletionLoading || deletionState?.account_status === 'pending_deletion'}
                            className="px-8 shadow-lg shadow-red-500/20"
                        >
                            Delete Account
                        </Button>
                    </div>
                    {/* Decorative stripes/background for danger zone */}
                    <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-red-500/5 to-transparent opacity-50" />
                </div>
            </div>

            {/* Password Modal */}
            <ModalShell isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Update Password" maxWidthClass="max-w-md">
                <div className="space-y-4">
                    <div className="relative">
                        <Input
                            type={showCurrent ? 'text' : 'password'}
                            label="Current Password"
                            value={current}
                            onChange={e => setCurrent(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-[37px] text-[var(--text-muted)]">
                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="relative">
                        <Input
                            type={showNext ? 'text' : 'password'}
                            label="New Password"
                            helperText="Minimum 8 characters"
                            value={nextPassword}
                            onChange={e => setNextPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowNext(!showNext)} className="absolute right-3 top-[37px] text-[var(--text-muted)]">
                            {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <Input
                        type="password"
                        label="Confirm New Password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                    />
                    {formError && <p className="text-xs text-red-500">{formError}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleChangePassword} isLoading={isSaving}>Update</Button>
                    </div>
                </div>
            </ModalShell>

            {/* Delete Modal */}
            <ModalShell isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Account" maxWidthClass="max-w-md">
                <div className="space-y-6">
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        Your account will be scheduled for anonymization. Workspace records remain intact, but your identity will be removed.
                    </p>
                    <Input
                        label='Type "DELETE" to confirm'
                        value={confirmDeleteText}
                        onChange={e => setConfirmDeleteText(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleRequestDeletion} isLoading={isSubmittingDeletion} disabled={confirmDeleteText !== 'DELETE'}>
                            Confirm Deletion
                        </Button>
                    </div>
                </div>
            </ModalShell>
        </div>
    );
}

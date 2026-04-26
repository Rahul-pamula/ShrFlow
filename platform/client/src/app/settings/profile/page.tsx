'use client';

import { useEffect, useMemo, useState } from 'react';
import { Camera, LogOut, Mail, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, ConfirmModal, InlineAlert, Input, KeyValueList, PageHeader, SectionCard, StatCard, useToast } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const TIMEZONES = [
    { value: 'UTC', label: 'UTC (Default)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT+0)' },
    { value: 'Europe/Paris', label: 'Central Europe (CET)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Tokyo', label: 'Japan (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

const selectClassName =
    'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20';

export default function ProfileSettingsPage() {
    const { token, updateUserContext, user, logout } = useAuth();
    const { success, error, info } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [timezone, setTimezone] = useState('UTC');
    const [email, setEmail] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
    const [leaveBusy, setLeaveBusy] = useState(false);

    const isGoogleAuth = false;
    const isOwner = user?.role === 'MAIN_OWNER' || user?.role === 'FRANCHISE_OWNER';
    const initials = useMemo(() => (fullName || email || 'U').charAt(0).toUpperCase(), [fullName, email]);

    useEffect(() => {
        if (token) fetchProfile();
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setFullName(data.full_name || '');
                setTimezone(data.timezone || 'UTC');
                setEmail(data.email || '');
            }
        } catch (fetchError) {
            console.error('Failed to fetch profile', fetchError);
            error('Failed to load your profile.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE}/settings/profile`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ full_name: fullName, timezone }),
            });
            if (!res.ok) throw new Error('Failed to save profile.');
            const data = await res.json();
            if (updateUserContext && data.data) updateUserContext({ fullName: data.data.full_name });
            setIsEditingProfile(false);
            success('Profile updated.');
        } catch (saveError) {
            console.error('Error saving profile', saveError);
            error('Could not save your profile changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLeaveWorkspace = async () => {
        setLeaveBusy(true);
        try {
            const res = await fetch(`${API_BASE}/team/members/me/leave`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to leave workspace.');
            }
            success('You have left the workspace.');
            setConfirmLeaveOpen(false);
            setTimeout(() => logout(), 800);
        } catch (leaveError: any) {
            console.error(leaveError);
            error(leaveError.message || 'Could not leave workspace.');
        } finally {
            setLeaveBusy(false);
        }
    };

    if (isLoading) {
        return <div className="p-12 text-sm text-[var(--text-muted)]">Loading profile settings...</div>;
    }

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Profile Settings"
                subtitle="Manage your identity, default timezone, and personal account preferences for day-to-day work inside Sh_R_Mail."
                action={!isEditingProfile ? <Button onClick={() => setIsEditingProfile(true)}>Edit Profile</Button> : null}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Profile Status" value={fullName ? 'Configured' : 'Needs Name'} icon={<User className="h-5 w-5" />} />
                <StatCard label="Sign-In Email" value={email ? 'Verified' : 'Missing'} icon={<Mail className="h-5 w-5" />} />
                <StatCard label="Timezone" value={timezone.split('/').pop() || timezone} icon={<ShieldCheck className="h-5 w-5" />} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
                <div className="space-y-6">
                    {/* ── Basic Information ─────────────────────────── */}
                    <SectionCard
                        title="Basic Information"
                        description="Update the name and timezone shown throughout approvals, activity history, and team collaboration surfaces."
                        action={!isEditingProfile ? <Button variant="secondary" size="sm" onClick={() => setIsEditingProfile(true)}>Edit</Button> : null}
                    >
                        {isEditingProfile ? (
                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Input
                                        label="Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="John Doe"
                                        autoFocus
                                    />
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-[var(--text-primary)]">Timezone</label>
                                        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={selectClassName}>
                                            {TIMEZONES.map((zone) => (
                                                <option key={zone.value} value={zone.value}>{zone.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <Button type="submit" isLoading={isSaving}>Save Changes</Button>
                                    <Button type="button" variant="ghost" onClick={() => { setIsEditingProfile(false); fetchProfile(); }}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <KeyValueList
                                columns={2}
                                items={[
                                    { label: 'Display Name', value: fullName || 'Not set' },
                                    { label: 'Primary Email', value: email || 'Not set' },
                                    { label: 'Account Status', value: 'Active', helper: 'This account currently has access to the workspace.' },
                                    { label: 'Default Timezone', value: timezone },
                                ]}
                            />
                        )}
                    </SectionCard>

                    {/* ── Security ─────────────────────────────────── */}
                    <SectionCard title="Security & Login" description="Keep sign-in details clear and reduce account risk when working across devices or teams.">
                        <div className="space-y-5">
                            <KeyValueList
                                columns={2}
                                items={[
                                    { label: 'Account Email', value: email || 'Not set', helper: 'Used for sign-in and verification.' },
                                    { label: 'Email Verification', value: 'Verified', helper: 'Your primary email is confirmed.' },
                                ]}
                            />
                            {isGoogleAuth ? (
                                <InlineAlert
                                    variant="info"
                                    title="Signed in with Google"
                                    description="Password updates are managed by your Google account rather than directly in Sh_R_Mail."
                                />
                            ) : isChangingPassword ? (
                                <div className="space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                                    <Input type="password" placeholder="Current Password" label="Current Password" />
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <Input type="password" placeholder="New Password" label="New Password" />
                                        <Input type="password" placeholder="Confirm New Password" label="Confirm Password" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button type="button" onClick={() => info('Password change flow is not wired yet.')}>Update Password</Button>
                                        <Button type="button" variant="ghost" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text-primary)]">Password</p>
                                        <p className="mt-1 text-sm text-[var(--text-muted)]">Use a strong password and rotate it if you suspect shared access.</p>
                                    </div>
                                    <Button variant="secondary" size="sm" onClick={() => setIsChangingPassword(true)}>Change Password</Button>
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    {/* ── Leave Workspace ───────────────────────────── */}
                    <SectionCard
                        title="Leave Workspace"
                        description="Remove your own access from this workspace. Your campaigns, contacts, and templates will stay with the workspace."
                    >
                        {isOwner ? (
                            <InlineAlert
                                variant="warning"
                                title="Owners cannot leave"
                                description="You are the workspace owner. Transfer ownership to another member before leaving, or delete the workspace."
                            />
                        ) : (
                            <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--danger)]/25 bg-[var(--danger-bg)]/40 p-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">Leave this workspace</p>
                                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                                        You will lose access immediately. Content you created stays with the workspace.
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 text-[var(--danger)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                                    onClick={() => setConfirmLeaveOpen(true)}
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Leave Workspace
                                </Button>
                            </div>
                        )}
                    </SectionCard>
                </div>

                <div className="space-y-6">
                    {/* ── Avatar ───────────────────────────────────── */}
                    <SectionCard title="Avatar" description="A clearer profile makes approvals, ownership, and audit trails easier to scan.">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-4xl font-bold text-white shadow-lg">
                                    {initials}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => info('Avatar uploads are not wired yet.')}
                                    className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/55 opacity-0 transition hover:opacity-100"
                                >
                                    <Camera className="h-6 w-6 text-white" />
                                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">Change</span>
                                </button>
                            </div>
                            <p className="text-lg font-semibold text-[var(--text-primary)]">{fullName || 'Unknown User'}</p>
                            <p className="text-sm text-[var(--text-muted)]">{email}</p>
                            <p className="mt-4 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-muted)]">
                                Avatars should be at least 300x300px.
                            </p>
                        </div>
                    </SectionCard>

                    {/* ── Need Help ────────────────────────────────── */}
                    <SectionCard title="Need Help?" description="If you're locked out or need recovery support, our team can help restore access safely.">
                        <a href="mailto:support@emailengine.com" className="text-sm font-medium text-[var(--info)] transition hover:opacity-80">
                            Contact support
                        </a>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                            Reach out for login issues, password resets, or 2FA recovery.
                        </p>
                    </SectionCard>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmLeaveOpen}
                onClose={() => setConfirmLeaveOpen(false)}
                onConfirm={handleLeaveWorkspace}
                title="Leave this workspace?"
                message="You will lose access immediately. All campaigns, contacts, and templates you created will remain with the workspace. This action cannot be undone."
                confirmLabel="Leave Workspace"
                isLoading={leaveBusy}
                variant="danger"
            />
        </div>
    );
}

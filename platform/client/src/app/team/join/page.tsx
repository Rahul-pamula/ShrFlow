'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, AlertTriangle, Loader2, UserX, LogIn } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type Status = 'validating' | 'wrong_account' | 'loading' | 'success' | 'error';

interface InviteInfo {
    invited_email: string;
    role: string;
    workspace_name: string;
}

export default function TeamJoinPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { token: authToken, isAuthenticated, isLoading: authLoading, user, logout } = useAuth();

    // Guard against React StrictMode double-firing
    const hasAttempted = useRef(false);
    // Safety: don't let authLoading hang forever
    const [authTimedOut, setAuthTimedOut] = useState(false);

    const [status, setStatus] = useState<Status>('validating');
    const [errorMessage, setErrorMessage] = useState('');
    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);

    const inviteToken = searchParams.get('token');

    // 5-second safety timeout so authLoading never hangs the page forever
    useEffect(() => {
        const t = setTimeout(() => setAuthTimedOut(true), 5000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (authLoading && !authTimedOut) return;
        if (hasAttempted.current) return;

        if (!inviteToken) {
            hasAttempted.current = true;
            setStatus('error');
            setErrorMessage('No invitation token provided.');
            return;
        }

        // Step 1: Pre-validate the invite to find out who it was meant for
        const validateAndAccept = async () => {
            hasAttempted.current = true;

            try {
                // Check the invite target email without consuming the token
                const validateRes = await fetch(`${API_BASE}/team/invites/validate?token=${inviteToken}`);
                if (!validateRes.ok) {
                    const err = await validateRes.json().catch(() => ({}));
                    setStatus('error');
                    setErrorMessage(
                        err.detail ||
                        'This invitation link is invalid or has expired. Please ask the workspace owner to resend the invitation.'
                    );
                    return;
                }

                const info: InviteInfo = await validateRes.json();
                setInviteInfo(info);

                // Step 2: Session mismatch check
                if (!isAuthenticated) {
                    // Not logged in at all → redirect to login, preserving the invite token
                    const currentUrl = encodeURIComponent(`/team/join?token=${inviteToken}`);
                    router.push(`/login?redirect=${currentUrl}`);
                    return;
                }

                // Logged in, but as the wrong person?
                if (user?.email?.toLowerCase() !== info.invited_email.toLowerCase()) {
                    setStatus('wrong_account');
                    return;
                }

                // Step 3: Everything looks correct — accept the invite
                setStatus('loading');
                const res = await fetch(`${API_BASE}/team/invites/accept`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ token: inviteToken })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.detail || 'Failed to accept invitation');
                }

                // 🔑 Update the session with the fresh JWT for the new workspace
                if (data.new_token) {
                    localStorage.setItem('auth_token', data.new_token);
                    document.cookie = `auth_token=${data.new_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

                    // Update the stored user_data to reflect the new tenant
                    const rawUserData = localStorage.getItem('user_data');
                    if (rawUserData) {
                        const parsed = JSON.parse(rawUserData);
                        parsed.tenantId = data.tenant_id;
                        parsed.tenantStatus = 'active';
                        parsed.role = data.role === 'admin' ? 'manager' : (data.role || 'member');
                        localStorage.setItem('user_data', JSON.stringify(parsed));
                    }
                }

                setStatus('success');

                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);

            } catch (err: any) {
                console.error(err);
                setStatus('error');
                setErrorMessage(err.message);
            }
        };

        validateAndAccept();
    }, [authLoading, authTimedOut, isAuthenticated, inviteToken, authToken, user, router]);

    const handleSwitchAccount = () => {
        logout(); // clears session
        const currentUrl = encodeURIComponent(`/team/join?token=${inviteToken}`);
        router.push(`/login?redirect=${currentUrl}`);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-panel p-8 text-center animate-fade-in relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />

                <div className="relative z-10">
                    {/* Validating / Loading */}
                    {(status === 'validating' || status === 'loading') && (
                        <>
                            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">
                                {status === 'validating' ? 'Verifying Invitation...' : 'Joining Workspace...'}
                            </h1>
                            <p className="text-[var(--text-muted)] text-sm">Please wait while we verify your invitation.</p>
                        </>
                    )}

                    {/* Wrong account */}
                    {status === 'wrong_account' && inviteInfo && (
                        <>
                            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-400">
                                <UserX className="w-8 h-8" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Wrong Account</h1>
                            <p className="text-[var(--text-muted)] text-sm mb-2">
                                This invitation was sent to:
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm">
                                {inviteInfo.invited_email}
                            </div>
                            <p className="text-[var(--text-muted)] text-sm mb-8">
                                You are currently signed in as <strong className="text-white">{user?.email}</strong>.
                                Please switch to the correct account to accept this invitation.
                            </p>
                            <button
                                onClick={handleSwitchAccount}
                                className="btn-primary w-full justify-center flex items-center gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                Switch Account & Accept
                            </button>
                        </>
                    )}

                    {/* Success */}
                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Invitation Accepted!</h1>
                            <p className="text-[var(--text-muted)] text-sm mb-2">
                                You have joined <strong className="text-white">{inviteInfo?.workspace_name}</strong>.
                            </p>
                            <p className="text-xs text-indigo-400 font-medium">Redirecting to your dashboard...</p>
                        </>
                    )}

                    {/* Error */}
                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
                            <p className="text-[var(--text-muted)] text-sm mb-8">{errorMessage}</p>

                            <button
                                onClick={() => router.push('/dashboard')}
                                className="btn-secondary w-full justify-center"
                            >
                                Return to Dashboard
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

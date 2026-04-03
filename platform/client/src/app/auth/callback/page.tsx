'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import Link from 'next/link';

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [error, setError] = useState('');

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(errorParam);
            return;
        }

                const token = searchParams.get('token');
                const tenantStatus = searchParams.get('tenant_status');
                const emailVerified = searchParams.get('email_verified') || 'true';

                if (token) {
                    try {
                        // Instantly log the user into the browser session
                        localStorage.setItem('auth_token', token);
                        document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
                        document.cookie = `email_verified=${emailVerified}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

                if (tenantStatus) {
                    document.cookie = `tenant_status=${tenantStatus}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
                }

                // Construct User Data
                const email = searchParams.get('email') || '';
                const fullName = searchParams.get('full_name') || email.split('@')[0];

                const userData = {
                    userId: searchParams.get('user_id'),
                    email: email,
                    fullName: fullName,
                    tenantId: searchParams.get('tenant_id'),
                    tenantStatus: tenantStatus,
                    role: searchParams.get('role') || 'owner',
                    emailVerified: emailVerified === 'true',
                };
                localStorage.setItem('user_data', JSON.stringify(userData));

                // Hard navigation to force AuthContext to pick up the new tokens naturally
                if (tenantStatus === 'onboarding') {
                    window.location.href = '/onboarding/workspace';
                } else {
                    window.location.href = '/dashboard';
                }
            } catch (err) {
                console.error("Failed to parse social login response", err);
                setError('Failed to securely establish session.');
            }
        } else {
            setError('Invalid callback response from provider');
        }
    }, [searchParams]);

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-4">
                <div className="text-center p-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10 mb-6 border border-[var(--danger)]/20 shadow-inner">
                        <AlertCircle className="h-8 w-8 text-[var(--danger)]" />
                    </div>

                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Authentication Failed</h2>

                    <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
                        {error === 'GoogleNotConfigured' || error === 'GitHubNotConfigured'
                            ? "The administrator has not yet configured API keys for this social provider."
                            : error === 'NoEmailFound'
                                ? "We could not securely retrieve your email address from the social provider."
                                : error === 'AccountDisabled'
                                    ? "This account has been disabled by the administrator."
                                    : 'There was a problem signing you in with the social provider. Please try again or use standard email login.'}
                    </p>

                    <Link href="/login" className="block w-full">
                        <Button className="w-full" size="lg">Back to Login</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
            <div className="text-center p-8 space-y-6">
                <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)] absolute" />
                    <div className="w-16 h-16 border-4 border-[var(--accent)]/20 rounded-full absolute"></div>
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
                        Completing secure sign in...
                    </h2>
                    <p className="text-sm text-[var(--text-muted)]">
                        Please wait while we redirect you to your dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
                <Loader2 className="w-12 h-12 animate-spin text-[var(--accent)]" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}

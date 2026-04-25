'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { OnboardingShell } from '@/components/onboarding';
import { Button, InlineAlert } from '@/components/ui';

export default function OnboardingComplete() {
    const { refreshUserStatus } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let mounted = true;

        const completeOnboarding = async () => {
            const userDataStr = localStorage.getItem('user_data');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (userData.tenant_status === 'active' || userData.tenantStatus === 'active') {
                    if (mounted) setStatus('success');
                    return;
                }
            }

            try {
                const token = localStorage.getItem('auth_token');
                if (!token) return;

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/complete`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to complete onboarding');
                }

                await refreshUserStatus();
                document.cookie = `tenant_status=active; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

                if (mounted) setStatus('success');
            } catch (error) {
                console.error('Error completing onboarding:', error);
                if (mounted) setStatus('error');
            }
        };

        if (status === 'loading') {
            completeOnboarding();
        }

        return () => {
            mounted = false;
        };
    }, [refreshUserStatus, status]);

    const handleGoToDashboard = () => {
        setSubmitting(true);
        window.location.href = '/dashboard';
    };

    if (status === 'loading') {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-[var(--accent)]" />
                    <p className="mt-4 text-sm text-[var(--text-muted)]">Finalizing your workspace...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <OnboardingShell
                icon={<CheckCircle2 className="h-6 w-6" />}
                title="We hit a problem finishing setup"
                description="Your workspace details are saved, but activation did not complete. Try again and we’ll pick up from here."
            >
                <InlineAlert
                    variant="danger"
                    title="Workspace activation failed"
                    description="We couldn’t activate your workspace yet. Please try again or contact support if this keeps happening."
                />

                <Button variant="secondary" size="lg" onClick={() => window.location.reload()} className="w-full">
                    Try Again
                </Button>
            </OnboardingShell>
        );
    }

    return (
        <OnboardingShell
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="You’re all set"
            description="Your workspace is ready. You can start sending, managing contacts, and setting up infrastructure right away."
        >
            <InlineAlert
                variant="success"
                title="Workspace activated"
                description="Everything needed for the initial setup is complete. You can fine-tune details later from Settings."
            />

            <div className="space-y-3 text-center">
                <Button onClick={handleGoToDashboard} size="lg" isLoading={submitting} className="w-full">
                    {submitting ? 'Loading...' : 'Go to Dashboard'}
                    {!submitting && <ArrowRight className="h-5 w-5" />}
                </Button>

                <p className="text-sm text-[var(--text-muted)]">
                    You can update these settings anytime later.
                </p>
            </div>
        </OnboardingShell>
    );
}

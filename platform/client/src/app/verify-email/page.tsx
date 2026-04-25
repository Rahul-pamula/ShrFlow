'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { AuthShell } from '@/components/auth';
import { Button, InlineAlert } from '@/components/ui';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing verification link.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${token}`, {
                    method: 'GET',
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.detail || 'Verification failed');
                }

                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Something went wrong. Please request a new verification link.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <AuthShell
            title="Verify your email"
            description="We’re checking your verification link and updating your account state."
            asideTitle="Identity checks that stay readable"
            asideDescription="Even technical account moments should feel calm and trustworthy, especially when someone is trying to get started."
        >
            <div className="space-y-6 text-center">
                {status === 'loading' && (
                    <>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Verifying your email</h3>
                            <p className="text-sm leading-6 text-[var(--text-muted)]">
                                Please wait while we confirm your email address.
                            </p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <InlineAlert
                            variant="success"
                            title="Email verified"
                            description={message}
                            className="text-left"
                        />
                        <Link href="/login">
                            <Button size="lg" className="w-full">
                                Go to login
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
                            <XCircle className="h-8 w-8" />
                        </div>
                        <InlineAlert
                            variant="danger"
                            title="Verification failed"
                            description={message}
                            className="text-left"
                        />
                        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
                            Back to login
                        </Link>
                    </>
                )}
            </div>
        </AuthShell>
    );
}

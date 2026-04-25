'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/auth';
import { Button, InlineAlert, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            // Always show success — prevents email enumeration
            setIsSubmitted(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthShell
            title={isSubmitted ? 'Check your email' : 'Forgot your password?'}
            description={isSubmitted ? 'If the address exists, a reset link is on the way.' : 'Enter your email and we’ll send a secure reset link.'}
            asideTitle="Recovery that stays safe"
            asideDescription="We keep the recovery flow straightforward while avoiding signals that could expose whether an address is registered."
        >
            {isSubmitted ? (
                <div className="space-y-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <p className="text-sm leading-6 text-[var(--text-muted)]">
                        If <strong>{email}</strong> is registered, you&apos;ll receive a reset link shortly. It expires in <strong>1 hour</strong>.
                    </p>
                    <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
                        <ArrowLeft className="h-4 w-4" />
                        Back to login
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <InlineAlert
                            variant="danger"
                            title="Couldn’t send reset link"
                            description={error}
                        />
                    )}

                    <Input
                        id="email"
                        type="email"
                        label="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="you@company.com"
                        icon={<Mail className="h-4 w-4" />}
                        className="border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />

                    <Button type="submit" size="lg" isLoading={isLoading} disabled={!email} className="w-full">
                        Send reset link
                    </Button>

                    <div className="text-center">
                        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">
                            <ArrowLeft className="h-4 w-4" />
                            Back to login
                        </Link>
                    </div>
                </form>
            )}
        </AuthShell>
    );
}

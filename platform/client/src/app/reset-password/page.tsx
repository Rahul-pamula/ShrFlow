'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/auth';
import { Button, InlineAlert, Input } from '@/components/ui';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token.');
        }
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (!token) {
            setError('Invalid or missing reset token.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || 'Failed to reset password.');
            }

            setIsSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthShell
            title={isSuccess ? 'Password updated' : 'Set a new password'}
            description={isSuccess ? 'Your password has been updated successfully.' : 'Choose a new password for your workspace account.'}
            asideTitle="Secure access, without friction"
            asideDescription="We keep identity flows clear and predictable so teams can recover access without unnecessary confusion."
        >
            {isSuccess ? (
                <div className="space-y-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <p className="text-sm leading-6 text-[var(--text-muted)]">
                        Your password has been successfully updated. Redirecting to login...
                    </p>
                    <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
                        Click here if not redirected
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <InlineAlert
                            variant="danger"
                            title="Couldn’t reset password"
                            description={error}
                        />
                    )}

                    <Input
                        id="password"
                        type="password"
                        label="New password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="Min 8 characters"
                        className="border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />
                    <Input
                        id="confirmPassword"
                        type="password"
                        label="Confirm new password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="Min 8 characters"
                        className="border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />

                    <Button type="submit" size="lg" isLoading={isLoading} disabled={!token} className="w-full">
                        Reset password
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

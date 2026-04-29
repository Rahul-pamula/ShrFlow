'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Building2, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth';
import { Button, InlineAlert, Input } from '@/components/ui';
import { useSearchParams } from 'next/navigation';

export default function SignupPage() {
    const { signup } = useAuth();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect'); // e.g. /team/join?token=xxx
    const isInviteFlow = !!redirectPath;
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        tenant_name: '',
        first_name: '',
        last_name: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        if (!formData.email || !formData.password || (!formData.tenant_name && !isInviteFlow)) {
            setError('Please fill in all required fields');
            setIsSubmitting(false);
            return;
        }

        try {
            await signup(
                formData.email,
                formData.password,
                // If this is an invite flow, we don't create a new workspace
                isInviteFlow ? '' : formData.tenant_name,
                formData.first_name,
                formData.last_name,
                redirectPath || undefined
            );
            // Auth context handles the redirect (back to /team/join if invite flow)
        } catch (err: any) {
            setError(err.message || 'Error creating account');
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <AuthShell
            title={isInviteFlow ? 'Create your member account' : 'Create your account'}
            description={isInviteFlow ? 'Join the workspace you were invited to and finish your setup.' : 'Start with a calm, production-ready email workspace from day one.'}
            asideTitle="Build with infrastructure you can trust"
            asideDescription="From sending domains to analytics and compliance, ShrFlow is designed to make sophisticated email operations feel organized."
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                    <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google/login`} className="flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </a>
                    <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github/login`} className="flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        GitHub
                    </a>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[var(--border)]" />
                    </div>
                    <div className="relative flex justify-center text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        <span className="bg-[var(--bg-card)] px-3">Or register with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <InlineAlert
                            variant="danger"
                            title="Couldn’t create account"
                            description={error}
                        />
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            id="first_name"
                            name="first_name"
                            label="First name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Jane"
                            icon={<User className="h-4 w-4" />}
                            className="border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        />
                        <Input
                            id="last_name"
                            name="last_name"
                            label="Last name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Smith"
                            className="border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        />
                    </div>

                    {!isInviteFlow && (
                        <Input
                            id="tenant_name"
                            name="tenant_name"
                            type="text"
                            required={!isInviteFlow}
                            label="Company or workspace name"
                            value={formData.tenant_name}
                            onChange={handleChange}
                            placeholder="Acme Corp"
                            icon={<Building2 className="h-4 w-4" />}
                            className="border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        />
                    )}

                    <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        label="Work email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="jane@acme.com"
                        icon={<Mail className="h-4 w-4" />}
                        className="border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />

                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        label="Password"
                        helperText="Use at least 8 characters."
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 8 characters"
                        icon={<Lock className="h-4 w-4" />}
                        className="border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />

                    <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
                        Create account
                        {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                    </Button>
                </form>

                <p className="text-center text-sm text-[var(--text-muted)]">
                    Already have an account?{' '}
                    <Link href={`/login${isInviteFlow ? `?redirect=${encodeURIComponent(redirectPath as string)}` : ''}`} className="font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]">
                        Sign in here
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}

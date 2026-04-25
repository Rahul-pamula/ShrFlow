'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, Mail, RotateCcw, XCircle } from 'lucide-react';
import { Button, InlineAlert, Input, SectionCard } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function UnsubscribeContent() {
    const params = useSearchParams();
    const status = params.get('status');

    const [resubStatus, setResubStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
    const [email, setEmail] = useState('');
    const [showResubForm, setShowResubForm] = useState(false);

    useEffect(() => {
        if (status === 'success' && !showResubForm && resubStatus === 'idle') {
            const timer = setTimeout(() => window.close(), 3000);
            return () => clearTimeout(timer);
        }
    }, [status, showResubForm, resubStatus]);

    const handleResub = async () => {
        if (!email.trim()) return;
        setResubStatus('loading');
        try {
            const res = await fetch(`${API_BASE}/resubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error('Failed');
            setResubStatus('done');
            setTimeout(() => window.close(), 3000);
        } catch {
            setResubStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <SectionCard className="w-full max-w-lg" title="You've been unsubscribed" description="You won't receive any more marketing emails from this sender. The change takes effect immediately.">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--success-border)] bg-[var(--success-bg)]">
                        <CheckCircle2 className="h-8 w-8 text-[var(--success)]" />
                    </div>

                    {!showResubForm && resubStatus === 'idle' && (
                        <Button variant="outline" onClick={() => window.close()} className="mb-6">Close window</Button>
                    )}

                    <div className="w-full border-t border-[var(--border)] pt-6">
                        <p className="mb-4 text-sm text-[var(--text-muted)]">Unsubscribed by mistake?</p>

                        {!showResubForm ? (
                            <Button variant="outline" onClick={() => setShowResubForm(true)}><RotateCcw className="h-4 w-4" />Re-subscribe</Button>
                        ) : resubStatus !== 'done' ? (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    <Button onClick={handleResub} disabled={!email.trim() || resubStatus === 'loading'}>
                                        {resubStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                        {resubStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                                    </Button>
                                </div>
                                {resubStatus === 'error' && (
                                    <InlineAlert variant="danger" title="Re-subscribe failed" description="Something went wrong. Please contact support." />
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <InlineAlert variant="success" title="You're re-subscribed" description="Welcome back. This window will close automatically." />
                                <Button variant="outline" onClick={() => window.close()}>Close window</Button>
                            </div>
                        )}
                    </div>
                </div>
            </SectionCard>
        );
    }

    return (
        <SectionCard className="w-full max-w-lg" title="Invalid Link" description="This unsubscribe link is invalid or has already been used. Your subscription status has not changed.">
            <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--danger-border)] bg-[var(--danger-bg)]">
                    <XCircle className="h-8 w-8 text-[var(--danger)]" />
                </div>
                <InlineAlert
                    variant="warning"
                    title="Need help?"
                    description={<span>If you believe this is a mistake, contact <a href="mailto:support@emailengine.com" className="font-medium text-[var(--info)]">support@emailengine.com</a>.</span>}
                    icon={<AlertCircle className="h-4 w-4" />}
                />
            </div>
        </SectionCard>
    );
}

export default function UnsubscribePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
            <Suspense fallback={<div className="text-sm text-[var(--text-muted)]">Loading...</div>}>
                <UnsubscribeContent />
            </Suspense>
        </div>
    );
}

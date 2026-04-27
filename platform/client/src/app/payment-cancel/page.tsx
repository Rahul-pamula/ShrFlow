'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CreditCard } from 'lucide-react';
import { Button, PageHeader, SectionCard } from '@/components/ui';

export default function PaymentCancelPage() {
    const router = useRouter();
    const [returnPath, setReturnPath] = React.useState<string>('/contacts');

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedPath = localStorage.getItem('upgrade_return_path');
            if (savedPath) {
                setReturnPath(savedPath);
            }
        }
    }, []);

    const isTeamFlow = returnPath.includes('/team');

    return (
        <div className="mx-auto max-w-xl space-y-8 pt-12">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--danger-bg)]/20">
                    <AlertTriangle className="h-8 w-8 text-[var(--danger)]" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Payment Cancelled</h1>
                <p className="mt-2 text-[var(--text-muted)]">
                    Your upgrade was not completed. Your current plan limits still apply.
                </p>
            </div>

            <SectionCard>
                <div className="space-y-4">
                    <div className="rounded-[var(--radius)] border border-[var(--danger-border)] bg-[var(--danger-bg)]/10 p-4">
                        <p className="text-sm font-medium text-[var(--danger)]">
                            👉 {isTeamFlow ? 'Invite failed due to plan limit' : 'Upload failed due to plan limit'}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Your current plan limits still apply.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button onClick={() => router.push('/settings/billing')} fullWidth className="gap-2">
                            <CreditCard className="h-4 w-4" /> Try Again (Go to Plans)
                        </Button>
                        <Button onClick={() => { localStorage.removeItem('upgrade_return_path'); router.push(returnPath); }} variant="outline" fullWidth className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to {isTeamFlow ? 'Team Settings' : 'Import'}
                        </Button>
                    </div>
                </div>
            </SectionCard>

            <div className="text-center text-xs text-[var(--text-muted)]">
                If you believe this is an error, please contact support.
            </div>
        </div>
    );
}

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Zap } from 'lucide-react';
import { Button, SectionCard } from '@/components/ui';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const [returnPath, setReturnPath] = React.useState<string>('/contacts');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedPath = localStorage.getItem('upgrade_return_path');
            if (savedPath) {
                setReturnPath(savedPath);
                localStorage.removeItem('upgrade_return_path');
            }
        }
    }, []);

    const isTeamFlow = returnPath.includes('/team');

    return (
        <div className="mx-auto max-w-xl space-y-8 pt-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-bg)]/20">
                <CheckCircle2 className="h-8 w-8 text-[var(--success)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Upgrade Successful!</h1>
            <p className="mt-2 text-[var(--text-muted)]">
                Your plan has been updated. Your new {isTeamFlow ? 'team' : 'contact'} limits are now active.
            </p>

            <SectionCard>
                <div className="space-y-4">
                    <div className="rounded-[var(--radius)] border border-[var(--accent-border)] bg-[var(--accent)]/5 p-4 text-left">
                        <div className="flex items-center gap-2 text-[var(--accent)]">
                            <Zap className="h-4 w-4" />
                            <span className="text-sm font-bold uppercase tracking-wider">Plan Activated</span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--text-primary)]">
                            You can now resume your {isTeamFlow ? 'team invitations' : 'contact import'}.
                        </p>
                    </div>

                    <Button onClick={() => router.push(`${returnPath}?upgrade=success`)} fullWidth size="lg">
                        Continue to {isTeamFlow ? 'Team Settings' : 'Import'}
                    </Button>
                </div>
            </SectionCard>
        </div>
    );
}

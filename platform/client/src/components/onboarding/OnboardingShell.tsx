import { ReactNode } from 'react';

import { SectionCard } from '@/components/ui';

interface OnboardingShellProps {
    step?: number;
    totalSteps?: number;
    icon: ReactNode;
    title: string;
    description: string;
    children: ReactNode;
    footer?: ReactNode;
}

function OnboardingShell({
    step,
    totalSteps,
    icon,
    title,
    description,
    children,
    footer,
}: OnboardingShellProps) {
    const progress = step && totalSteps ? Math.max(0, Math.min(100, (step / totalSteps) * 100)) : null;

    return (
        <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
            <SectionCard
                className="overflow-hidden border-[var(--border-strong)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)]"
                noPadding
                footer={footer}
            >
                <div className="space-y-8 p-6 sm:p-8">
                    {progress !== null && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                <span>Setup Flow</span>
                                <span>Step {step} of {totalSteps}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
                                <div
                                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--accent)]/15 bg-[var(--accent)]/10 text-[var(--accent)]">
                            {icon}
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                                {title}
                            </h1>
                            <p className="mx-auto max-w-xl text-sm leading-6 text-[var(--text-muted)] sm:text-base">
                                {description}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {children}
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}

export { OnboardingShell };

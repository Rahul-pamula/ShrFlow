import Link from 'next/link';
import { ReactNode } from 'react';
import { Mail } from 'lucide-react';

import { SectionCard } from '@/components/ui';

interface AuthShellProps {
    title: string;
    description: string;
    children: ReactNode;
    asideTitle?: string;
    asideDescription?: string;
    asideContent?: ReactNode;
}

function AuthShell({
    title,
    description,
    children,
    asideTitle = 'Built for modern email teams',
    asideDescription = 'Run campaigns, manage deliverability, and scale infrastructure from one calm control surface.',
    asideContent,
}: AuthShellProps) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-12rem] top-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[var(--accent)]/10 blur-3xl" />
                <div className="absolute bottom-[-14rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[var(--accent-secondary)]/10 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
                <section className="hidden lg:block">
                    <div className="max-w-xl space-y-8">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-[var(--shadow-lg)]">
                            <Mail className="h-7 w-7" />
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                Sh_R_Mail
                            </p>
                            <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)] xl:text-5xl">
                                {asideTitle}
                            </h1>
                            <p className="max-w-lg text-base leading-7 text-[var(--text-muted)]">
                                {asideDescription}
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <SectionCard
                                title="Operational clarity"
                                description="One product grammar across contacts, campaigns, analytics, and infrastructure."
                                className="bg-[var(--bg-card)]/90"
                            />
                            <SectionCard
                                title="Trusted delivery"
                                description="Built to help teams move fast without losing control of sending quality."
                                className="bg-[var(--bg-card)]/90"
                            />
                        </div>

                        {asideContent}
                    </div>
                </section>

                <section className="mx-auto w-full max-w-lg">
                    <SectionCard
                        className="border-[var(--border-strong)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)]"
                    >
                        <div className="mb-8 text-center sm:text-left">
                            <Link href="/" className="mb-6 inline-flex items-center gap-3 text-[var(--text-primary)]">
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-[var(--shadow-md)]">
                                    <Mail className="h-5 w-5" />
                                </span>
                                <span className="text-lg font-semibold tracking-tight">Sh_R_Mail</span>
                            </Link>
                            <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                                {title}
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                                {description}
                            </p>
                        </div>

                        {children}
                    </SectionCard>
                </section>
            </div>
        </div>
    );
}

export { AuthShell };

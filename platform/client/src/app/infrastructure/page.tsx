'use client';

import Link from 'next/link';
import { ArrowRight, Globe, KeyRound, MailCheck, Shield, Webhook } from 'lucide-react';
import { PageHeader, Button, KeyValueList, SectionCard } from '@/components/ui';

const infrastructureAreas = [
    {
        title: 'Sending Domains',
        description: 'Verify DNS, monitor authentication, and improve inbox placement.',
        href: '/settings/domain',
        icon: Globe,
    },
    {
        title: 'Sender Identities',
        description: 'Control who can send from each domain and keep spoofing protections in place.',
        href: '/settings/senders',
        icon: MailCheck,
    },
    {
        title: 'API Keys',
        description: 'Issue scoped credentials for internal tools, automation, and customer integrations.',
        href: '/settings/api-keys',
        icon: KeyRound,
    },
    {
        title: 'Compliance',
        description: 'Manage consent, data handling, and workspace compliance controls.',
        href: '/settings/compliance',
        icon: Shield,
    },
];

const nextSteps = [
    'Verify at least one domain before your first production campaign.',
    'Create separate API keys for production, staging, and partner integrations.',
    'Review compliance defaults before enabling large-volume sending.',
];

export default function InfrastructurePage() {
    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Infrastructure"
                subtitle="The trust layer for sending, authentication, integrations, and compliance."
                action={
                    <Link href="/settings/domain">
                        <Button>Verify sending domain</Button>
                    </Link>
                }
            />

            <div className="grid gap-4 md:grid-cols-2">
                {infrastructureAreas.map((area) => {
                    const Icon = area.icon;
                    return (
                        <Link
                            key={area.href}
                            href={area.href}
                            className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition hover:border-[var(--accent-border)] hover:bg-[var(--bg-hover)]"
                        >
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                                <Icon className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{area.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{area.description}</p>
                            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                                Manage
                                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <SectionCard
                    title="Operating Model"
                    description="Infrastructure is intentionally separated from campaign creation so high-frequency work stays fast, while trust-critical setup stays discoverable and calm."
                >
                    <KeyValueList
                        items={[
                            {
                                label: 'System readiness',
                                value: (
                                    <span className="inline-flex items-center gap-2">
                                        <Webhook className="h-4 w-4 text-[var(--ai-accent)]" />
                                        Shared delivery foundation
                                    </span>
                                ),
                                helper: 'Domains, senders, and API credentials should be configured here once, then reused everywhere else in the product.',
                            },
                            {
                                label: 'Compliance posture',
                                value: (
                                    <span className="inline-flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-[var(--accent)]" />
                                        Audit-friendly admin controls
                                    </span>
                                ),
                                helper: 'Keep legal, consent, and key-management controls grouped together so administrative users can audit them quickly.',
                            },
                        ]}
                    />
                </SectionCard>

                <SectionCard title="Recommended Setup Order">
                    <ol className="space-y-4">
                        {nextSteps.map((step, index) => (
                            <li key={step} className="flex gap-3">
                                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xs font-semibold text-[var(--accent)]">
                                    {index + 1}
                                </div>
                                <p className="text-sm leading-6 text-[var(--text-muted)]">{step}</p>
                            </li>
                        ))}
                    </ol>
                </SectionCard>
            </div>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CheckCircle2, HelpCircle, ShieldCheck } from 'lucide-react';

import { InlineAlert, PageHeader, SectionCard } from '@/components/ui';

const providers = [
    {
        id: 'namecheap',
        title: 'Namecheap setup',
        sections: [
            {
                title: 'DKIM records (3 CNAME records)',
                body: 'Namecheap appends your base domain automatically, so only paste the prefix shown in ShrFlow into the host field.',
                steps: [
                    'Open the Namecheap dashboard and click Manage for your domain.',
                    'Go to Advanced DNS and choose Add New Record.',
                    'Create a CNAME record and paste only the host prefix, such as xxx._domainkey.',
                    'Paste the exact DKIM target value from ShrFlow.',
                    'Repeat the process for all three DKIM records.',
                ],
            },
            {
                title: 'SPF record (TXT)',
                body: 'Use the root domain host and paste the SPF value exactly as shown in the app.',
                steps: [
                    'Add a TXT record in the same DNS area.',
                    'Set Host to @.',
                    'Paste the SPF value exactly as provided by ShrFlow.',
                ],
            },
            {
                title: 'Custom return-path and bounce records',
                body: 'These records keep bounce routing aligned and remove the “via amazonses.com” style fallback behavior.',
                steps: [
                    'Add the MX record using the bounces prefix shown in the app.',
                    'Use the exact priority and target shown in the domain panel.',
                    'Add the matching TXT record for the same bounce host.',
                ],
            },
        ],
    },
    {
        id: 'godaddy',
        title: 'GoDaddy setup',
        sections: [
            {
                title: 'Record entry guidance',
                body: 'GoDaddy also appends your domain automatically, so only paste the host prefix, not the full domain.',
                steps: [
                    'Open your domain in the GoDaddy control center.',
                    'Choose Manage DNS and then Add New Record.',
                    'Select the type shown in ShrFlow: CNAME, TXT, or MX.',
                    'Paste only the host prefix such as bounces or xxx._domainkey.',
                    'Paste the value from ShrFlow exactly and save.',
                ],
            },
        ],
    },
];

export default function DomainHelpPage() {
    return (
        <div className="mx-auto max-w-5xl space-y-8 px-4 pb-20 pt-6 sm:px-6">
            <PageHeader
                title="Domain verification guide"
                subtitle="Use this guide when you need a calmer explanation of why the DNS records matter and how to enter them correctly."
                action={(
                    <Link
                        href="/settings/domain"
                        className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to domains
                    </Link>
                )}
            />

            <SectionCard
                title="Why these records are required"
                description="Each record exists to prove identity, authorize sending, or keep bounce handling aligned with your domain."
            >
                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        {
                            title: 'DKIM',
                            body: 'Adds a cryptographic signature so inbox providers can verify your mail was really sent by your domain.',
                            icon: HelpCircle,
                            tone: 'text-[var(--accent)]',
                        },
                        {
                            title: 'SPF',
                            body: 'Tells inbox providers which infrastructure is allowed to send on your behalf.',
                            icon: ShieldCheck,
                            tone: 'text-[var(--ai-accent)]',
                        },
                        {
                            title: 'Return-path and bounces',
                            body: 'Routes bounce handling correctly and helps keep alignment clean for DMARC-sensitive providers.',
                            icon: CheckCircle2,
                            tone: 'text-[var(--success)]',
                        },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.title} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-primary)] p-5">
                                <Icon className={`mb-4 h-5 w-5 ${item.tone}`} />
                                <h3 className="text-base font-semibold text-[var(--text-primary)]">{item.title}</h3>
                                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{item.body}</p>
                            </div>
                        );
                    })}
                </div>
            </SectionCard>

            <InlineAlert
                variant="danger"
                title="If one record is wrong, verification will fail"
                description="Every DNS record needs to be present and copied exactly. Even one missing character can keep the domain unverified and block sending."
            />

            <div className="space-y-6">
                {providers.map((provider, providerIndex) => (
                    <SectionCard
                        key={provider.id}
                        title={`${providerIndex + 1}. ${provider.title}`}
                        description="Follow the provider-specific notes below, then compare what you entered against the exact values shown in the app."
                    >
                        <div className="space-y-4">
                            {provider.sections.map((section) => (
                                <div key={section.title} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-primary)] p-5">
                                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{section.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{section.body}</p>
                                    <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--text-primary)]">
                                        {section.steps.map((step) => (
                                            <li key={step} className="pl-1">{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                ))}
            </div>

            <InlineAlert
                variant="success"
                title="What to do next"
                description={(
                    <>
                        Go back to <strong>Settings → Domains</strong> and use <strong>Check Status</strong> on the pending domain.
                        DNS changes often take 15 to 45 minutes to propagate, and some providers can take longer.
                    </>
                )}
                icon={<CheckCircle2 className="h-4 w-4" />}
            />

            <InlineAlert
                variant="warning"
                title="Common failure pattern"
                description={(
                    <>
                        If verification stays stuck, compare the <strong>host</strong> and <strong>value</strong> fields character-by-character.
                        The most common issue is pasting the full domain into providers that already append it automatically.
                    </>
                )}
                icon={<AlertTriangle className="h-4 w-4" />}
            />
        </div>
    );
}

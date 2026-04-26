'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarClock, CheckCircle2, CreditCard, TrendingUp, Users, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { can } from '@/utils/permissions';
import { useRouter } from 'next/navigation';
import { Badge, Button, ConfirmModal, EmptyState, InlineAlert, PageHeader, SectionCard, StatCard, useToast } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const PLAN_FEATURES: Record<string, string[]> = {
    Free: ['500 contacts', '3,000 emails/mo', 'Shared IPs', '1 user', 'Community support'],
    Starter: ['5,000 contacts', '10,000 emails/mo', 'Shared IPs', '3 users', 'Email support', 'Unsubscribe page'],
    Pro: ['50,000 contacts', '100,000 emails/mo', 'Custom domain (DKIM)', 'Unlimited users', 'Priority support', 'API access', 'Advanced analytics'],
    Enterprise: ['500,000 contacts', '1,000,000 emails/mo', 'Dedicated IPs', 'SLA 99.9%', '24/7 Support', 'Custom contracts', 'SSO / SAML'],
};

const PLAN_PRICE_INR: Record<string, string> = {
    Free: '0',
    Starter: '999',
    Pro: '3,499',
    Enterprise: '24,999',
};

type Plan = {
    id: string;
    name: string;
    price_monthly: number;
    max_monthly_emails: number;
    max_contacts: number;
    allow_custom_domain: boolean;
};

type BillingData = {
    plan_id: string;
    plan_details: Plan;
    billing_cycle_start: string;
    billing_cycle_end: string;
    scheduled_plan: Plan | null;
    scheduled_plan_effective_at: string | null;
    usage: { emails_sent_this_cycle: number; contacts_used: number };
    all_plans: Plan[];
};

type DialogState = { type: 'upgrade' | 'downgrade' | 'cancel'; plan?: Plan } | null;

function ProgressBar({ percent }: { percent: number }) {
    const safePercent = Math.min(100, Math.max(0, percent));
    const toneClass = safePercent >= 100 ? 'bg-[var(--danger)]' : safePercent >= 80 ? 'bg-[var(--warning)]' : 'bg-[var(--accent)]';

    return (
        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-hover)]">
            <div className={`h-full rounded-full transition-all duration-500 ${toneClass}`} style={{ width: `${safePercent}%` }} />
        </div>
    );
}

export default function BillingPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const { success, error: toastError } = useToast();

    useEffect(() => {
        if (user && !can(user, 'VIEW_BILLING')) {
            router.replace('/dashboard');
        }
    }, [user, router]);

    const [data, setData] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [dialog, setDialog] = useState<DialogState>(null);

    const fetchBilling = async () => {
        if (!token) return;
        setLoading(true);
        setPageError('');
        try {
            const res = await fetch(`${API_BASE}/billing/plan`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to load billing info.');
            setData(await res.json());
        } catch (fetchError) {
            console.error(fetchError);
            setPageError('Failed to load billing info.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBilling(); }, [token]);

    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const handleChangePlan = async () => {
        if (!dialog?.plan) return;
        setProcessing(true);
        try {
            const res = await fetch(`${API_BASE}/billing/change-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ plan_id: dialog.plan.id }),
            });
            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.detail || 'Failed to change plan.');
            success(responseData.message || 'Plan updated.');
            await fetchBilling();
        } catch (changeError: any) {
            toastError(changeError.message || 'Failed to change plan.');
        } finally {
            setProcessing(false);
            setDialog(null);
        }
    };

    const handleCancelDowngrade = async () => {
        setProcessing(true);
        try {
            const res = await fetch(`${API_BASE}/billing/cancel-downgrade`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.detail || 'Failed to cancel downgrade.');
            success(responseData.message || 'Scheduled downgrade canceled.');
            await fetchBilling();
        } catch (cancelError: any) {
            toastError(cancelError.message || 'Failed to cancel downgrade.');
        } finally {
            setProcessing(false);
            setDialog(null);
        }
    };

    const openDialog = (plan: Plan) => {
        if (!data) return;
        const type = plan.price_monthly > data.plan_details.price_monthly ? 'upgrade' : 'downgrade';
        setDialog({ type, plan });
    };

    const metrics = useMemo(() => {
        if (!data) return [];
        const { plan_details, usage } = data;
        return [
            { label: 'Current Plan', value: plan_details.name, icon: <CreditCard className="h-5 w-5" /> },
            { label: 'Emails Used', value: `${usage.emails_sent_this_cycle.toLocaleString()}/${plan_details.max_monthly_emails.toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" /> },
            { label: 'Contacts Used', value: `${usage.contacts_used.toLocaleString()}/${plan_details.max_contacts.toLocaleString()}`, icon: <Users className="h-5 w-5" /> },
        ];
    }, [data]);

    if (loading) {
        return <div className="p-12 text-sm text-[var(--text-muted)]">Loading billing information...</div>;
    }

    if (!user || !can(user, 'VIEW_BILLING')) {
        return null;
    }

    if (pageError || !data) {
        return (
            <div className="space-y-6 pb-8">
                <PageHeader title="Plan & Billing" subtitle="Manage your subscription, usage, and scheduled plan changes." />
                <InlineAlert variant="danger" title="Billing unavailable" description={pageError || 'No billing data found.'} />
            </div>
        );
    }

    const { plan_details, usage, billing_cycle_end, scheduled_plan, scheduled_plan_effective_at, all_plans } = data;
    const emailsPct = Math.min(100, Math.round((usage.emails_sent_this_cycle / plan_details.max_monthly_emails) * 100));
    const contactsPct = Math.min(100, Math.round((usage.contacts_used / plan_details.max_contacts) * 100));

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Plan & Billing"
                subtitle="Monitor usage, understand upgrade and downgrade timing, and keep your workspace within healthy operating limits."
                action={<Button variant="secondary" onClick={fetchBilling}>Refresh</Button>}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {metrics.map((metric) => (
                    <StatCard key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} />
                ))}
            </div>

            {scheduled_plan && scheduled_plan_effective_at && (
                <InlineAlert
                    variant="warning"
                    title="Downgrade scheduled"
                    description={`Your plan will change from ${plan_details.name} to ${scheduled_plan.name} on ${fmtDate(scheduled_plan_effective_at)}. Current limits remain active until then.`}
                >
                    <Button variant="secondary" size="sm" onClick={() => setDialog({ type: 'cancel' })}>Cancel Downgrade</Button>
                </InlineAlert>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
                <SectionCard title="Current Subscription" description="Your workspace stays on the current plan until the billing cycle ends, even when a downgrade is scheduled.">
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{plan_details.name}</h2>
                            <Badge variant="success">Active</Badge>
                        </div>
                        <p className="text-sm text-[var(--text-muted)]">
                            ₹{PLAN_PRICE_INR[plan_details.name] ?? plan_details.price_monthly}/month
                            {billing_cycle_end ? <> · Renews <span className="font-medium text-[var(--text-primary)]">{fmtDate(billing_cycle_end)}</span></> : null}
                        </p>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Cycle End</p>
                                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{billing_cycle_end ? fmtDate(billing_cycle_end) : '—'}</p>
                            </div>
                            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Plan Type</p>
                                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{plan_details.allow_custom_domain ? 'Custom-domain capable' : 'Shared infrastructure'}</p>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Usage" description="Watch email and contact usage so throttling, overages, or plan pressure never surprise the team.">
                    <div className="space-y-5">
                        <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-medium text-[var(--text-primary)]">Emails Sent</span>
                                <span className="text-[var(--text-muted)]">{usage.emails_sent_this_cycle.toLocaleString()} / {plan_details.max_monthly_emails.toLocaleString()}</span>
                            </div>
                            <ProgressBar percent={emailsPct} />
                            <p className="mt-2 text-xs text-[var(--text-muted)]">{emailsPct}% used this cycle</p>
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-medium text-[var(--text-primary)]">Contacts</span>
                                <span className="text-[var(--text-muted)]">{usage.contacts_used.toLocaleString()} / {plan_details.max_contacts.toLocaleString()}</span>
                            </div>
                            <ProgressBar percent={contactsPct} />
                            <p className="mt-2 text-xs text-[var(--text-muted)]">{contactsPct}% of contact capacity used</p>
                        </div>
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="Available Plans" description="Upgrades apply immediately. Downgrades are scheduled for the next renewal so you keep the limits you already paid for.">
                {all_plans.length === 0 ? (
                    <EmptyState title="No plans available" description="Billing plans will appear here once the backend returns available plan options." />
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {all_plans.map((plan) => {
                            const isCurrent = plan.id === data.plan_id;
                            const isScheduled = plan.id === scheduled_plan?.id;
                            const isUpgrade = plan.price_monthly > plan_details.price_monthly;
                            const features = PLAN_FEATURES[plan.name] || [];

                            return (
                                <div key={plan.id} className={`relative flex flex-col rounded-[var(--radius-lg)] border p-5 ${isCurrent ? 'border-[var(--accent)] bg-[var(--info-bg)]/20' : 'border-[var(--border)] bg-[var(--bg-primary)]'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-[var(--text-primary)]">{plan.name}</h3>
                                            <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">₹{PLAN_PRICE_INR[plan.name] ?? plan.price_monthly}<span className="ml-1 text-xs font-normal text-[var(--text-muted)]">/mo</span></p>
                                        </div>
                                        {isCurrent ? <Badge variant="accent">Current</Badge> : isScheduled ? <Badge variant="warning">Scheduled</Badge> : null}
                                    </div>

                                    <ul className="mt-5 flex-1 space-y-2">
                                        {features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--success)]" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-5">
                                        {isCurrent ? (
                                            <Button variant="secondary" fullWidth disabled>Current Plan</Button>
                                        ) : isScheduled ? (
                                            <Button variant="secondary" fullWidth disabled>Downgrade Scheduled</Button>
                                        ) : (
                                            <Button fullWidth variant={isUpgrade ? 'primary' : 'secondary'} onClick={() => openDialog(plan)}>
                                                {isUpgrade ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                                                {isUpgrade ? 'Upgrade' : 'Downgrade'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </SectionCard>

            <SectionCard tone="subtle" title="How plan changes work" description="The billing model is designed to be predictable for operators and finance teams.">
                <div className="space-y-3 text-sm text-[var(--text-muted)]">
                    <p><span className="font-medium text-[var(--text-primary)]">Upgrades</span> take effect immediately, so the new contact and sending limits are available right away.</p>
                    <p><span className="font-medium text-[var(--text-primary)]">Downgrades</span> are scheduled for the end of the current billing cycle, so you keep the capacity you already paid for until renewal.</p>
                    <p><span className="font-medium text-[var(--text-primary)]">Scheduled downgrades</span> can be canceled any time before they take effect.</p>
                </div>
            </SectionCard>

            <ConfirmModal
                isOpen={Boolean(dialog)}
                onClose={() => setDialog(null)}
                onConfirm={dialog?.type === 'cancel' ? handleCancelDowngrade : handleChangePlan}
                title={dialog?.type === 'upgrade' ? `Upgrade to ${dialog.plan?.name}` : dialog?.type === 'downgrade' ? `Downgrade to ${dialog.plan?.name}` : 'Cancel scheduled downgrade'}
                message={
                    dialog?.type === 'upgrade' && dialog.plan
                        ? `Move to ${dialog.plan.name} immediately at ₹${PLAN_PRICE_INR[dialog.plan.name] ?? dialog.plan.price_monthly}/month.`
                        : dialog?.type === 'downgrade' && dialog.plan
                            ? `Schedule a move to ${dialog.plan.name}. Your current ${plan_details.name} limits stay active until ${billing_cycle_end ? fmtDate(billing_cycle_end) : 'the end of the cycle'}.`
                            : scheduled_plan
                                ? `Cancel the scheduled downgrade to ${scheduled_plan.name} and remain on ${plan_details.name}.`
                                : 'Confirm this billing change.'
                }
                confirmLabel={dialog?.type === 'upgrade' ? 'Upgrade Now' : dialog?.type === 'cancel' ? 'Keep Current Plan' : 'Schedule Downgrade'}
                variant={dialog?.type === 'upgrade' ? 'primary' : dialog?.type === 'cancel' ? 'warning' : 'warning'}
                isLoading={processing}
            >
                <div className="space-y-2 text-sm text-[var(--text-muted)]">
                    {dialog?.type === 'upgrade' && dialog.plan ? (
                        <>
                            <p className="flex items-center gap-2"><Zap className="h-4 w-4 text-[var(--info)]" /> Takes effect immediately</p>
                            <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--success)]" /> New limit: {dialog.plan.max_contacts.toLocaleString()} contacts</p>
                        </>
                    ) : null}
                    {dialog?.type === 'downgrade' && dialog.plan ? (
                        <>
                            <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[var(--warning)]" /> Takes effect on {billing_cycle_end ? fmtDate(billing_cycle_end) : 'renewal'}</p>
                            <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--success)]" /> Current {plan_details.name} limits stay active until then</p>
                        </>
                    ) : null}
                    {dialog?.type === 'cancel' && scheduled_plan ? (
                        <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--success)]" /> You will remain on {plan_details.name} and continue with the current billing level.</p>
                    ) : null}
                </div>
            </ConfirmModal>
        </div>
    );
}

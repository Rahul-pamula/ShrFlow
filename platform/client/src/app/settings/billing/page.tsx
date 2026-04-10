'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    CreditCard, ArrowLeft, Loader2, TrendingUp, Users,
    AlertTriangle, Check, Zap, ArrowUp, ArrowDown, X,
    CalendarClock, CheckCircle2
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

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

const PLAN_COLOR: Record<string, { ring: string; badge: string; text: string; bg: string }> = {
    Free: { ring: 'border-white/10', badge: 'bg-white/10 text-[var(--text-muted)]', text: 'text-[var(--text-muted)]', bg: '' },
    Starter: { ring: 'border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-400', text: 'text-emerald-400', bg: 'rgba(16,185,129,0.04)' },
    Pro: { ring: 'border-blue-500/40', badge: 'bg-blue-500/15 text-blue-400', text: 'text-blue-400', bg: 'rgba(59,130,246,0.05)' },
    Enterprise: { ring: 'border-violet-500/40', badge: 'bg-violet-500/15 text-violet-400', text: 'text-violet-400', bg: 'rgba(139,92,246,0.05)' },
};

type Plan = { id: string; name: string; price_monthly: number; max_monthly_emails: number; max_contacts: number; allow_custom_domain: boolean };
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

type DialogType = 'upgrade' | 'downgrade' | 'cancel' | null;

export default function BillingPage() {
    const { token } = useAuth();
    const [data, setData] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [dialog, setDialog] = useState<{ type: DialogType; plan?: Plan } | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const fetchBilling = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/billing/plan`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setData(await res.json());
            else setError('Failed to load billing info.');
        } catch { setError('Network error.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBilling(); }, [token]);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 5000);
    };

    const handleChangePlan = async () => {
        if (!dialog?.plan) return;
        setProcessing(true);
        try {
            const res = await fetch(`${API_BASE}/billing/change-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ plan_id: dialog.plan.id }),
            });
            const d = await res.json();
            if (res.ok) {
                showToast(d.message);
                await fetchBilling();
            } else {
                showToast(d.detail || 'Failed to change plan.', false);
            }
        } catch { showToast('Network error.', false); }
        finally { setProcessing(false); setDialog(null); }
    };

    const handleCancelDowngrade = async () => {
        setProcessing(true);
        try {
            const res = await fetch(`${API_BASE}/billing/cancel-downgrade`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` },
            });
            const d = await res.json();
            if (res.ok) { showToast(d.message); await fetchBilling(); }
            else showToast(d.detail || 'Failed', false);
        } catch { showToast('Network error.', false); }
        finally { setProcessing(false); setDialog(null); }
    };

    const openDialog = (plan: Plan) => {
        if (!data) return;
        const currentPrice = data.plan_details.price_monthly;
        const type = plan.price_monthly > currentPrice ? 'upgrade' : 'downgrade';
        setDialog({ type, plan });
    };

    if (loading) return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
    );
    if (error || !data) return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-8">
            <div className="max-w-3xl mx-auto p-5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400">{error || 'No data'}</div>
        </div>
    );

    const { plan_details, usage, billing_cycle_end, scheduled_plan, scheduled_plan_effective_at, all_plans } = data;
    const emailsPct = Math.min(100, Math.round((usage.emails_sent_this_cycle / plan_details.max_monthly_emails) * 100));
    const contactsPct = Math.min(100, Math.round((usage.contacts_used / plan_details.max_contacts) * 100));
    const barColor = (p: number) => p >= 100 ? '#EF4444' : p >= 80 ? '#F59E0B' : '#3B82F6';

    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-8 lg:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" /> Back to Settings
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Plan & Billing</h1>
                        <p className="text-sm text-[var(--text-muted)]">Manage your subscription and usage limits.</p>
                    </div>
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 text-sm ${toast.ok ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-400'}`}>
                        {toast.ok ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                        {toast.msg}
                    </div>
                )}

                {/* Scheduled downgrade warning */}
                {scheduled_plan && scheduled_plan_effective_at && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <CalendarClock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-400">Downgrade scheduled</p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                    Your plan will change from <strong className="text-[var(--text-secondary)]">{plan_details.name}</strong> to{' '}
                                    <strong className="text-[var(--text-secondary)]">{scheduled_plan.name}</strong> on{' '}
                                    <strong className="text-[var(--text-secondary)]">{fmtDate(scheduled_plan_effective_at)}</strong>.
                                    You keep your current limits until then.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setDialog({ type: 'cancel' })}
                            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                            Cancel downgrade
                        </button>
                    </div>
                )}

                {/* Current plan + billing cycle */}
                <div className="glass-panel p-6 mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{plan_details.name} Plan</h2>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Active</span>
                        </div>
                        <p className="text-sm text-[var(--text-muted)]">
                            ₹{PLAN_PRICE_INR[plan_details.name] ?? plan_details.price_monthly}/month
                            {billing_cycle_end && <> · Renews <strong className="text-[var(--text-secondary)]">{fmtDate(billing_cycle_end)}</strong></>}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-[var(--text-muted)] mb-0.5">Current cycle ends</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{billing_cycle_end ? fmtDate(billing_cycle_end) : '—'}</p>
                    </div>
                </div>

                {/* Usage */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {[
                        { label: 'Emails Sent', icon: TrendingUp, used: usage.emails_sent_this_cycle, max: plan_details.max_monthly_emails, pct: emailsPct },
                        { label: 'Total Contacts', icon: Users, used: usage.contacts_used, max: plan_details.max_contacts, pct: contactsPct },
                    ].map(m => {
                        const Icon = m.icon;
                        const color = barColor(m.pct);
                        return (
                            <div key={m.label} className="glass-panel p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{m.label}</p>
                                    {m.pct >= 80 ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <Icon className="w-4 h-4 text-[var(--text-muted)]" />}
                                </div>
                                <div className="flex items-baseline gap-1.5 mb-3">
                                    <span className="text-2xl font-bold text-[var(--text-primary)]">{m.used.toLocaleString()}</span>
                                    <span className="text-sm text-[var(--text-muted)]">/ {m.max.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-1.5">
                                    <div className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${m.pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
                                </div>
                                <p className="text-xs" style={{ color }}>{m.pct}% used</p>
                            </div>
                        );
                    })}
                </div>

                {/* All 4 plans */}
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3 px-1">All Plans</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {all_plans.map(plan => {
                            const isCurrent = plan.id === data.plan_id;
                            const isScheduled = plan.id === scheduled_plan?.id;
                            const c = PLAN_COLOR[plan.name] || PLAN_COLOR.Free;
                            const currentPrice = plan_details.price_monthly;
                            const isUpgrade = plan.price_monthly > currentPrice;
                            const isDowngrade = plan.price_monthly < currentPrice;
                            const features = PLAN_FEATURES[plan.name] || [];

                            return (
                                <div
                                    key={plan.id}
                                    className={`glass-panel p-5 flex flex-col relative border ${isCurrent ? 'border-[var(--accent)]/40' : c.ring}`}
                                    style={{ background: isCurrent ? 'rgba(59,130,246,0.05)' : c.bg || undefined }}
                                >
                                    {/* Current badge */}
                                    {isCurrent && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--accent)] text-white shadow-lg whitespace-nowrap">
                                                Current Plan
                                            </span>
                                        </div>
                                    )}
                                    {isScheduled && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500 text-white shadow-lg whitespace-nowrap">
                                                Scheduled
                                            </span>
                                        </div>
                                    )}
                                    {plan.name === 'Pro' && !isCurrent && !isScheduled && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg whitespace-nowrap">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mt-3 mb-0.5">{plan.name}</h4>
                                    <p className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                                        ₹{PLAN_PRICE_INR[plan.name] ?? plan.price_monthly}
                                        <span className="text-xs font-normal text-[var(--text-muted)]">/mo</span>
                                    </p>

                                    <ul className="space-y-1.5 mb-6 flex-1">
                                        {features.map(f => (
                                            <li key={f} className="flex items-start gap-1.5 text-xs text-[var(--text-muted)]">
                                                <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${c.text}`} />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Action button */}
                                    {isCurrent ? (
                                        <div className="w-full py-2 rounded-lg border border-white/10 text-xs font-medium text-[var(--text-muted)] text-center">
                                            Current Plan
                                        </div>
                                    ) : isScheduled ? (
                                        <div className="w-full py-2 rounded-lg border border-amber-500/20 text-xs font-medium text-amber-400 text-center bg-amber-500/5">
                                            Downgrade scheduled
                                        </div>
                                    ) : isUpgrade ? (
                                        <button
                                            onClick={() => openDialog(plan)}
                                            className="w-full py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" /> Upgrade
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => openDialog(plan)}
                                            className="w-full py-2 rounded-lg border border-white/10 text-xs font-medium text-[var(--text-muted)] hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" /> Downgrade
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* FAQ blurb */}
                <div className="mt-6 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        <span className="font-medium text-[var(--text-secondary)]">How plan changes work: </span>
                        <span className="text-blue-400">Upgrades</span> take effect immediately — your new limits are active right now.
                        {' '}<span className="text-amber-400">Downgrades</span> are scheduled for the end of your current billing period so you always get what you paid for.
                        You can cancel a pending downgrade at any time before it takes effect.
                    </p>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {dialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-panel p-7 w-full max-w-md">
                        <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dialog.type === 'upgrade' ? 'bg-blue-500/10 border border-blue-500/25' : dialog.type === 'cancel' ? 'bg-amber-500/10 border border-amber-500/25' : 'bg-orange-500/10 border border-orange-500/25'}`}>
                                    {dialog.type === 'upgrade' ? <ArrowUp className="w-5 h-5 text-blue-400" /> :
                                        dialog.type === 'cancel' ? <CalendarClock className="w-5 h-5 text-amber-400" /> :
                                            <ArrowDown className="w-5 h-5 text-orange-400" />}
                                </div>
                                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                                    {dialog.type === 'upgrade' ? `Upgrade to ${dialog.plan?.name}` :
                                        dialog.type === 'cancel' ? 'Cancel scheduled downgrade' :
                                            `Downgrade to ${dialog.plan?.name}`}
                                </h3>
                            </div>
                            <button onClick={() => setDialog(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 rounded-xl mb-5 text-sm leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            {dialog.type === 'upgrade' && dialog.plan && (
                                <>
                                    <p className="text-[var(--text-secondary)] mb-2">
                                        You'll be upgraded to <strong>{dialog.plan.name}</strong> at <strong>₹{PLAN_PRICE_INR[dialog.plan.name] ?? dialog.plan.price_monthly}/month</strong>.
                                    </p>
                                    <ul className="space-y-1 text-xs text-[var(--text-muted)]">
                                        <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-blue-400" /> Takes effect <strong className="text-blue-400">immediately</strong></li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> New limits active right now ({dialog.plan.max_contacts.toLocaleString()} contacts)</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Billing cycle resets today</li>
                                    </ul>
                                </>
                            )}
                            {dialog.type === 'downgrade' && dialog.plan && billing_cycle_end && (
                                <>
                                    <p className="text-[var(--text-secondary)] mb-2">
                                        Your plan will change to <strong>{dialog.plan.name}</strong> at ₹{PLAN_PRICE_INR[dialog.plan.name] ?? dialog.plan.price_monthly}/month.
                                    </p>
                                    <ul className="space-y-1 text-xs text-[var(--text-muted)]">
                                        <li className="flex items-center gap-2"><CalendarClock className="w-3.5 h-3.5 text-amber-400" /> Takes effect on <strong className="text-amber-400">{fmtDate(billing_cycle_end)}</strong></li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> You keep {plan_details.name} limits until then</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> You can cancel this downgrade anytime</li>
                                    </ul>
                                </>
                            )}
                            {dialog.type === 'cancel' && (
                                <p className="text-[var(--text-secondary)]">
                                    The scheduled downgrade to <strong>{scheduled_plan?.name}</strong> will be cancelled.
                                    You will remain on <strong>{plan_details.name}</strong> and continue to be billed at ₹{PLAN_PRICE_INR[plan_details.name] ?? plan_details.price_monthly}/month.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setDialog(null)} className="flex-1 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-muted)] hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={dialog.type === 'cancel' ? handleCancelDowngrade : handleChangePlan}
                                disabled={processing}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${dialog.type === 'upgrade' ? 'bg-[var(--accent)] hover:bg-blue-500 text-white' :
                                    dialog.type === 'cancel' ? 'bg-amber-500 hover:bg-amber-400 text-white' :
                                        'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30'
                                    }`}
                            >
                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                    dialog.type === 'upgrade' ? <><ArrowUp className="w-4 h-4" /> Upgrade Now</> :
                                        dialog.type === 'cancel' ? 'Keep Current Plan' :
                                            <><ArrowDown className="w-4 h-4" /> Schedule Downgrade</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

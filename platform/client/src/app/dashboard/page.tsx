'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Mail, Settings, ArrowRight, Zap, TrendingUp, Users, AlertTriangle, Eye, MousePointer } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE = 'http://127.0.0.1:8000';

type HealthStatus = 'green' | 'yellow' | 'red';

const HEALTH_COLORS: Record<HealthStatus, string> = {
    green: '#10B981',
    yellow: '#F59E0B',
    red: '#EF4444',
};

const HEALTH_LABELS: Record<HealthStatus, string> = {
    green: '🟢',
    yellow: '🟡',
    red: '🔴',
};

function HealthRow({ label, value, status, unit = '%' }: {
    label: string; value: number; status: HealthStatus; unit?: string
}) {
    const color = HEALTH_COLORS[status];
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(63,63,70,0.2)' }}>
            <span style={{ fontSize: 13, color: '#A1A1AA' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>
                {HEALTH_LABELS[status]} {value.toFixed(1)}{unit}
            </span>
        </div>
    );
}

export default function DashboardPage() {
    const { token } = useAuth();
    const [billing, setBilling] = useState<any>(null);
    const [health, setHealth] = useState<any>(null);

    useEffect(() => {
        if (!token) return;

        // Fetch health stats
        fetch(`${API_BASE}/analytics/sender-health`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : null).then(data => {
            if (data) setHealth(data);
        }).catch(() => { });

        // Fetch billing quota
        fetch(`${API_BASE}/billing/plan`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : null).then(data => {
            if (data) setBilling(data);
        }).catch(() => { });

    }, [token]);

    const isNearQuota = () => {
        if (!billing) return false;
        const limit = billing.plan_details.max_monthly_emails;
        const used = billing.usage.emails_sent_this_cycle;
        if (!limit || limit === 0) return false;
        return (used / limit) >= 0.8;
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-8 lg:p-12">
            <div className="max-w-6xl mx-auto">
                {/* Dashboard Banner for Quota Exceeded */}
                {isNearQuota() && (
                    <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 animate-fade-in shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-500">Approaching Monthly Limit</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                You have used <strong>{(billing.usage.emails_sent_this_cycle / billing.plan_details.max_monthly_emails * 100).toFixed(0)}%</strong> of your {billing.plan_details.max_monthly_emails.toLocaleString()} monthly email limit on the {billing.plan_details.name} plan.
                            </p>
                        </div>
                        <Link href="/settings/billing">
                            <button className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                                Upgrade Plan
                            </button>
                        </Link>
                    </div>
                )}

                {/* Header Section */}
                <div className="mb-12 animate-slide-up stagger-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-[var(--accent-glow)] border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-semibold uppercase tracking-wider">
                        <Zap className="w-3.5 h-3.5" /> Workspace Active
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-4">
                        Welcome to <span className="text-gradient">Email Engine</span>
                    </h1>
                    <p className="text-lg text-[var(--text-muted)] max-w-2xl leading-relaxed">
                        Your command center for automated communications. Connect your data sources, design beautiful templates, and launch triggered campaigns.
                    </p>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Card 1 - Events */}
                    <div className="glass-panel p-8 flex flex-col hover-lift animate-slide-up stagger-2 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Activity className="w-32 h-32" />
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-6 border border-[var(--accent)]/20 shadow-[var(--shadow-glow)]">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Event Stream</h2>
                        <p className="text-[var(--text-muted)] mb-8 flex-grow leading-relaxed">
                            Monitor incoming data from your applications or APIs in real-time.
                        </p>
                        <Link href="/events" className="w-full">
                            <button className="w-full py-3 px-4 bg-[var(--bg-hover)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group-hover:border-[var(--accent)]/50 group-hover:text-[var(--accent)]">
                                View Event Logs <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </Link>
                    </div>

                    {/* Card 2 - Campaigns */}
                    <div className="glass-panel p-8 flex flex-col hover-lift animate-slide-up stagger-3 group relative overflow-hidden border-[var(--accent)]/30">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent)] rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3 relative z-10">Campaigns</h2>
                        <p className="text-[var(--text-muted)] mb-8 flex-grow leading-relaxed relative z-10">
                            Design and launch email campaigns. Schedule sends, track opens and clicks.
                        </p>
                        <Link href="/campaigns" className="w-full relative z-10">
                            <button className="btn-premium w-full group">
                                Go to Campaigns <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </Link>
                    </div>

                    {/* Card 3 - Contacts */}
                    <div className="glass-panel p-8 flex flex-col hover-lift animate-slide-up stagger-4 group relative overflow-hidden">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Contacts</h2>
                        <p className="text-[var(--text-muted)] mb-8 flex-grow leading-relaxed">
                            Import, manage, and segment your audience. View bounce and unsubscribe status.
                        </p>
                        <Link href="/contacts" className="w-full">
                            <button className="w-full py-3 px-4 bg-[var(--bg-hover)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group-hover:border-emerald-500/50 group-hover:text-emerald-400">
                                Manage Contacts <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </Link>
                    </div>

                </div>

                {/* Sender Health Card */}
                <div style={{
                    marginTop: 32, background: 'rgba(24,24,27,0.6)', border: '1px solid rgba(63,63,70,0.35)',
                    borderRadius: 16, padding: '24px 28px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TrendingUp size={18} color="#6366F1" />
                            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#E4E4E7', margin: 0 }}>Sender Health</h2>
                            {health?.overall && (
                                <span style={{
                                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                                    background: HEALTH_COLORS[health.overall as HealthStatus] + '20',
                                    color: HEALTH_COLORS[health.overall as HealthStatus],
                                    border: `1px solid ${HEALTH_COLORS[health.overall as HealthStatus]}40`,
                                }}>
                                    {health.overall === 'green' ? 'Healthy' : health.overall === 'yellow' ? 'Warning' : 'At Risk'}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#71717A' }}>
                            <span>Sent: <strong style={{ color: '#E4E4E7' }}>{health?.sent?.toLocaleString() ?? '—'}</strong></span>
                            <span>Opens: <strong style={{ color: '#E4E4E7' }}>{health?.opens?.toLocaleString() ?? '—'}</strong></span>
                            <span>Clicks: <strong style={{ color: '#E4E4E7' }}>{health?.clicks?.toLocaleString() ?? '—'}</strong></span>
                        </div>
                    </div>

                    {health ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
                            <div>
                                <HealthRow label="Bounce Rate" value={health.rates.bounce_rate} status={health.health.bounce.status} />
                                <p style={{ fontSize: 11, color: '#52525B', marginTop: 6 }}>Target: &lt;2% · Above 5% = critical</p>
                            </div>
                            <div>
                                <HealthRow label="Spam Rate" value={health.rates.spam_rate} status={health.health.spam.status} />
                                <p style={{ fontSize: 11, color: '#52525B', marginTop: 6 }}>Target: &lt;0.1% · Gmail threshold: 0.3%</p>
                            </div>
                            <div>
                                <HealthRow label="Open Rate" value={health.rates.open_rate} status={health.health.open.status} />
                                <p style={{ fontSize: 11, color: '#52525B', marginTop: 6 }}>Target: &gt;20% · Below 10% = low engagement</p>
                            </div>
                        </div>
                    ) : (
                        <p style={{ fontSize: 13, color: '#52525B', textAlign: 'center', padding: '16px 0' }}>
                            Send your first campaign to see sender health metrics here.
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
}



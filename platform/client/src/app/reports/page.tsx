'use client';

import { Calendar, Download, Info } from 'lucide-react';
import { Badge, Button, PageHeader, SectionCard, StatCard } from '@/components/ui';

const summaryMetrics = [
    { label: 'Emails Sent', value: '245.2k', trend: 12, trendLabel: 'from last period' },
    { label: 'Avg Open Rate', value: '42.3%', trend: 2.1, trendLabel: 'from last period' },
    { label: 'Avg Click Rate', value: '8.7%', trend: -0.5, trendLabel: 'from last period' },
    { label: 'Bounces', value: '1.2%', trend: 0.1, trendLabel: 'from last period' },
];

const ispPerformance = [
    { name: 'Gmail', sent: '120k', openRate: '45%', clickRate: '9.2%', complaint: '0.01%' },
    { name: 'Outlook', sent: '85k', openRate: '38%', clickRate: '7.8%', complaint: '0.03%' },
    { name: 'Yahoo', sent: '25k', openRate: '41%', clickRate: '8.1%', complaint: '0.02%' },
    { name: 'iCloud', sent: '15k', openRate: '48%', clickRate: '10.5%', complaint: '0.00%' },
];

export default function ReportsPage() {
    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Reports"
                subtitle="Operational reporting and deliverability summaries across send volume, engagement quality, and provider-level performance."
                action={
                    <div className="flex gap-3">
                        <Button variant="outline"><Calendar className="mr-2 h-4 w-4" />Last 30 Days</Button>
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export</Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryMetrics.map((metric) => (
                    <StatCard key={metric.label} label={metric.label} value={metric.value} trend={metric.trend} trendLabel={metric.trendLabel} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
                <SectionCard title="Email Performance" description="A snapshot of send volume and engagement movement across the current reporting window.">
                    <div className="mb-6 flex items-center justify-end gap-4 text-xs text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)]" /> Sent</span>
                        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--info)]/60" /> Opens</span>
                    </div>
                    <div className="flex h-[220px] items-end justify-between gap-2 border-b border-[var(--border)] pb-6">
                        {[60, 45, 75, 50, 80, 65, 90, 55, 70, 40, 60, 85].map((height, index) => (
                            <div key={index} className="flex w-full max-w-[22px] flex-col items-center gap-0.5">
                                <div className="w-full rounded-[var(--radius)] bg-[var(--info)]/45" style={{ height: `${height * 0.4}%` }} />
                                <div className="w-full rounded-[var(--radius)] bg-[var(--accent)]" style={{ height: `${height}%` }} />
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex justify-between text-xs text-[var(--text-muted)]">
                        <span>Jan 1</span>
                        <span>Jan 7</span>
                        <span>Jan 14</span>
                        <span>Jan 21</span>
                        <span>Jan 28</span>
                    </div>
                </SectionCard>

                <SectionCard title="Bot Filtering" description="Automated filtering removes bot opens and clicks so reported engagement better reflects human interaction.">
                    <div className="space-y-6">
                        {[
                            { label: 'Bot Opens Blocked', value: '12.4k', width: '35%' },
                            { label: 'Bot Clicks Blocked', value: '4.1k', width: '18%' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                                    <span className="font-semibold text-[var(--text-primary)]">{item.value}</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: item.width }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex items-start gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-xs text-[var(--text-muted)]">
                        <Info className="mt-0.5 h-4 w-4 text-[var(--accent)]" />
                        Accuracy rate of 99.8% based on heuristic analysis.
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="ISP Performance" description="Track how major mailbox providers are performing across send volume, engagement, and complaint rates.">
                <div className="hidden overflow-hidden rounded-[var(--radius)] border border-[var(--border)] md:block">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                                {['ISP', 'Emails Sent', 'Open Rate', 'Click Rate', 'Complaint Rate'].map((heading) => (
                                    <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{heading}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ispPerformance.map((isp) => (
                                <tr key={isp.name} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-hover)]">
                                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">{isp.name}</td>
                                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{isp.sent}</td>
                                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{isp.openRate}</td>
                                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{isp.clickRate}</td>
                                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{isp.complaint}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid gap-4 md:hidden">
                    {ispPerformance.map((isp) => (
                        <div key={isp.name} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                            <div className="mb-2 text-sm font-semibold text-[var(--text-primary)]">{isp.name}</div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-[var(--text-secondary)]">
                                <div>Sent: {isp.sent}</div>
                                <div>Open: {isp.openRate}</div>
                                <div>Click: {isp.clickRate}</div>
                                <div>Complaint: {isp.complaint}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}

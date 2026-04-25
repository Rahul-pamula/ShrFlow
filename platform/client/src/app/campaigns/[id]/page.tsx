"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    AlertTriangle,
    Copy,
    Eye,
    Loader2,
    Mail,
    Pause,
    Play,
    RotateCcw,
    Send,
    Settings,
    TrendingUp,
    X,
    XOctagon,
} from "lucide-react";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button, InlineAlert, ModalShell, SectionCard, StatCard } from "@/components/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const STATUS_STYLES: Record<string, string> = {
    draft: "border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)]",
    sending: "border-[var(--info-border)] bg-[var(--info-bg)]/50 text-[var(--info)]",
    sent: "border-[var(--success-border)] bg-[var(--success-bg)]/50 text-[var(--success)]",
    paused: "border-[var(--warning-border)] bg-[var(--warning-bg)]/50 text-[var(--warning)]",
    scheduled: "border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]",
    cancelled: "border-[var(--danger-border)] bg-[var(--danger-bg)]/50 text-[var(--danger)]",
};

export default function CampaignDetailsPage() {
    const { id } = useParams();
    const { token } = useAuth();
    const router = useRouter();

    const [campaign, setCampaign] = useState<any>(null);
    const [dispatch, setDispatch] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const loadCampaign = async () => {
        if (!token || !id) return;
        const headers = { Authorization: `Bearer ${token}` };

        const [camp, disp] = await Promise.all([
            fetch(`${API_BASE}/campaigns/${id}`, { headers }).then((r) => r.json()),
            fetch(`${API_BASE}/campaigns/${id}/dispatch`, { headers })
                .then((r) => (r.ok ? r.json() : { data: [] }))
                .catch(() => ({ data: [] })),
        ]);

        setCampaign(camp);
        setDispatch(disp.data || []);
        setLoading(false);
    };

    const handleAction = async (action: "pause" | "resume" | "cancel") => {
        if (!token) return;

        setActionLoading(action);
        try {
            await fetch(`${API_BASE}/campaigns/${id}/${action}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            await loadCampaign();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDuplicate = async () => {
        if (!token || !campaign) return;
        setActionLoading("duplicate");

        try {
            const res = await fetch(`${API_BASE}/campaigns/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: `${campaign.name} (Copy)`,
                    subject: campaign.subject,
                    body_html: campaign.body_html,
                    status: "draft",
                    from_name: campaign.from_name,
                    from_prefix: campaign.from_prefix,
                    domain_id: campaign.domain_id,
                }),
            });

            if (res.ok) {
                const newCampaign = await res.json();
                router.push(`/campaigns/new?edit=${newCampaign.id}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    useEffect(() => {
        loadCampaign();
        const interval = setInterval(loadCampaign, 5000);
        return () => clearInterval(interval);
    }, [token, id]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    if (!campaign || campaign.detail) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <p className="text-sm text-[var(--text-muted)]">Campaign not found.</p>
                <Link href="/campaigns" className="mt-4 inline-flex text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
                    Back to campaigns
                </Link>
            </div>
        );
    }

    const statusClass = STATUS_STYLES[campaign.status] || STATUS_STYLES.draft;
    const total = dispatch.length;
    const delivered = dispatch.filter((item: any) => item.status === "DISPATCHED").length;
    const failed = dispatch.filter((item: any) => item.status === "FAILED").length;
    const pending = dispatch.filter((item: any) => ["PENDING", "PROCESSING"].includes(item.status)).length;
    const failedDispatch = dispatch.filter((item: any) => item.status === "FAILED");

    const metrics = [
        {
            title: "Total recipients",
            value: total.toLocaleString(),
            change: total === 0 ? "No dispatches yet" : "Current dispatch volume",
            changeType: "neutral" as const,
        },
        {
            title: "Delivered",
            value: delivered.toLocaleString(),
            change: total ? `${((delivered / total) * 100).toFixed(1)}% success` : "Waiting to send",
            changeType: delivered > 0 ? "positive" as const : "neutral" as const,
        },
        {
            title: "Pending",
            value: pending.toLocaleString(),
            change: pending > 0 ? "Still processing" : "No pending jobs",
            changeType: pending > 0 ? "neutral" as const : "positive" as const,
        },
        {
            title: "Failed",
            value: failed.toLocaleString(),
            change: total ? `${((failed / total) * 100).toFixed(1)}% failure rate` : "No failures",
            changeType: failed > 0 ? "negative" as const : "positive" as const,
        },
    ];

    const activityBars = [
        { label: "Delivered", pct: total ? (delivered / total) * 100 : 0, color: "bg-[var(--success)]", text: "text-[var(--success)]", value: delivered },
        { label: "Failed", pct: total ? (failed / total) * 100 : 0, color: "bg-[var(--danger)]", text: "text-[var(--danger)]", value: failed },
        { label: "Pending", pct: total ? (pending / total) * 100 : 0, color: "bg-[var(--warning)]", text: "text-[var(--warning)]", value: pending },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-8 px-4 pt-0 pb-8 sm:px-6">
            <Breadcrumb
                items={[
                    { label: "Campaigns", href: "/campaigns" },
                    { label: campaign.name },
                ]}
            />

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mt-0">
                        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] leading-none mt-0">{campaign.name}</h1>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusClass}`}>
                            {campaign.status}
                        </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                        {campaign.scheduled_at
                            ? `Scheduled or sent on ${new Date(campaign.scheduled_at).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}`
                            : `Created ${new Date(campaign.created_at).toLocaleDateString()}`}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {["sent", "sending", "paused", "cancelled"].includes(campaign.status) && (
                        <Link href={`/campaigns/${id}/analytics`}>
                            <Button variant="secondary">
                                <TrendingUp className="h-4 w-4" />
                                Analytics
                            </Button>
                        </Link>
                    )}

                    {campaign.status === "sending" && (
                        <>
                            <Button variant="secondary" onClick={() => handleAction("pause")} isLoading={actionLoading === "pause"}>
                                <Pause className="h-4 w-4" />
                                Pause
                            </Button>
                            <Button variant="danger" onClick={() => handleAction("cancel")} isLoading={actionLoading === "cancel"}>
                                <XOctagon className="h-4 w-4" />
                                Cancel
                            </Button>
                        </>
                    )}

                    {campaign.status === "paused" && (
                        <>
                            <Button variant="success" onClick={() => handleAction("resume")} isLoading={actionLoading === "resume"}>
                                <Play className="h-4 w-4" />
                                Resume
                            </Button>
                            <Button variant="danger" onClick={() => handleAction("cancel")} isLoading={actionLoading === "cancel"}>
                                <XOctagon className="h-4 w-4" />
                                Cancel
                            </Button>
                        </>
                    )}

                    <Button variant="secondary" onClick={handleDuplicate} isLoading={actionLoading === "duplicate"}>
                        <Copy className="h-4 w-4" />
                        Duplicate
                    </Button>

                    <Button onClick={() => setShowPreview(true)}>
                        <Eye className="h-4 w-4" />
                        View preview
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <StatCard
                        key={metric.title}
                        label={metric.title}
                        value={metric.value}
                        trend={metric.changeType === "positive" ? 1 : metric.changeType === "negative" ? -1 : 0}
                        trendLabel={metric.change}
                    />
                ))}
            </div>

            {total === 0 && (
                <InlineAlert
                    variant="info"
                    title="No dispatch activity yet"
                    description="This campaign has not produced recipient-level dispatch records yet. Once sending begins, delivery activity will appear here automatically."
                />
            )}

            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                <div className="space-y-6">
                    <SectionCard
                        title="Activity timeline"
                        description="A quick operational view of delivery progress across the current dispatch set."
                    >
                        <div className="space-y-5">
                            {activityBars.map((bar) => (
                                <div key={bar.label}>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-[var(--text-secondary)]">{bar.label}</span>
                                        <span className={`${bar.text} font-medium`}>
                                            {bar.value.toLocaleString()} <span className="text-[var(--text-muted)]">({bar.pct.toFixed(1)}%)</span>
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                                        <div className={`h-full ${bar.color} transition-all duration-500`} style={{ width: `${bar.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Failed deliveries"
                        description="Recent failed recipient dispatches. This helps with quick triage before you drill into deeper analytics."
                    >
                        {failedDispatch.length === 0 ? (
                            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--success-border)] bg-[var(--success-bg)]/35 px-6 py-10 text-center">
                                <p className="text-sm font-medium text-[var(--success)]">No failed deliveries</p>
                                <p className="mt-2 text-sm text-[var(--text-muted)]">Everything processed so far has cleared this surface.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border-separate border-spacing-0 text-sm">
                                    <thead>
                                        <tr className="text-left text-[var(--text-muted)]">
                                            <th className="border-b border-[var(--border)] py-3 pr-4 font-medium">Email</th>
                                            <th className="border-b border-[var(--border)] py-3 pr-4 font-medium">Reason</th>
                                            <th className="border-b border-[var(--border)] py-3 text-right font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {failedDispatch.slice(0, 10).map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="border-b border-[var(--border)] py-3 pr-4 text-[var(--text-primary)]">
                                                    {item.subscriber_email || item.subscriber_id}
                                                </td>
                                                <td className="border-b border-[var(--border)] py-3 pr-4 text-[var(--danger)]">
                                                    {item.error_log || "Unknown"}
                                                </td>
                                                <td className="border-b border-[var(--border)] py-3 text-right">
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-2 rounded-[var(--radius)] px-3 py-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                                                        title="Retry"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </SectionCard>
                </div>

                <SectionCard
                    title="Campaign details"
                    description="Core metadata and quick access to follow-up actions."
                    action={(
                        <Button variant="secondary">
                            <Settings className="h-4 w-4" />
                            Configure
                        </Button>
                    )}
                >
                    <div className="space-y-4">
                        {[
                            { label: "Subject line", value: campaign.subject || "—" },
                            { label: "Status", value: campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) },
                            {
                                label: "Created",
                                value: new Date(campaign.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                }),
                            },
                            { label: "From name", value: campaign.from_name || "—" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{item.label}</p>
                                <p className="mt-2 text-sm text-[var(--text-primary)]">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>

            {showPreview && (
                <ModalShell
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    title="Email preview"
                    description={`Subject: ${campaign.subject || "No subject"}`}
                    maxWidthClass="max-w-5xl"
                >
                    <div className="h-[70vh] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
                        <iframe
                            srcDoc={campaign.body_html || "<p>No content</p>"}
                            className="h-full w-full border-none"
                            title="Email Preview"
                        />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button variant="secondary" onClick={() => setShowPreview(false)}>
                            <X className="h-4 w-4" />
                            Close preview
                        </Button>
                    </div>
                </ModalShell>
            )}
        </div>
    );
}

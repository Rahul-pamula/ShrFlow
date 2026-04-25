"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    Archive,
    ArchiveRestore,
    ChevronLeft,
    ChevronRight,
    Copy,
    Loader2,
    Megaphone,
    Pause,
    PlayCircle,
    Plus,
    Search,
    StopCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button, ConfirmModal, EmptyState, FilterBar, InlineAlert, PageHeader, SectionCard, TableToolbar, StatusBadge, useToast } from "@/components/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type CampaignStatus = "all" | "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled" | "archived";

const STATUS_TABS: { key: CampaignStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "scheduled", label: "Scheduled" },
    { key: "sending", label: "Sending" },
    { key: "sent", label: "Sent" },
    { key: "paused", label: "Paused" },
    { key: "archived", label: "Archived" },
];

function actionButtonClass(tone: "default" | "success" | "warning" | "danger" = "default") {
    if (tone === "success") return "border-[var(--success-border)] bg-[var(--success-bg)]/50 text-[var(--success)] hover:bg-[var(--success-bg)]";
    if (tone === "warning") return "border-[var(--warning-border)] bg-[var(--warning-bg)]/50 text-[var(--warning)] hover:bg-[var(--warning-bg)]";
    if (tone === "danger") return "border-[var(--danger-border)] bg-[var(--danger-bg)]/50 text-[var(--danger)] hover:bg-[var(--danger-bg)]";
    return "border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]";
}

export default function CampaignsPage() {
    const { token } = useAuth();
    const router = useRouter();
    const { success, error: toastError, info } = useToast();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [localDrafts, setLocalDrafts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<CampaignStatus>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<{ kind: "discard_local" | "campaign"; id: string; action?: "cancel" | "archive" | "unarchive" | "delete"; title: string; message: string; confirmLabel: string; variant: "danger" | "warning" | "primary"; } | null>(null);

    const fetchCampaigns = async (background = false) => {
        if (!token) return;
        try {
            const params = new URLSearchParams({ page: String(page), limit: "15" });
            if (activeTab !== "all") params.set("status", activeTab);
            const res = await fetch(`${API_BASE}/campaigns/?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            setCampaigns(json.campaigns || []);
            setTotal(json.meta?.total || 0);
            setTotalPages(json.meta?.total_pages || 0);
            setError("");
        } catch {
            if (!background) setError("Failed to load campaigns.");
        } finally {
            if (!background) setLoading(false);
        }
    };

    useEffect(() => {
        try {
            const raw = localStorage.getItem("campaign_local_sessions");
            if (raw) {
                const sessions = JSON.parse(raw);
                const drafts = Object.entries(sessions)
                    .filter(([, s]: any) => s?.data?.name || s?.data?.subject)
                    .map(([id, s]: any) => ({ id, ...s.data, updatedAt: s.updatedAt }))
                    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                setLocalDrafts(drafts);
            }
        } catch { }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchCampaigns(false);
        const iv = setInterval(() => fetchCampaigns(true), 8000);
        return () => clearInterval(iv);
    }, [token, page, activeTab]);

    const filtered = useMemo(() => campaigns.filter((campaign) => campaign.name?.toLowerCase().includes(search.toLowerCase())), [campaigns, search]);

    const handleCreateNew = () => {
        const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
        router.push(`/campaigns/new?draft_id=${id}`);
    };

    const handleAction = async (id: string, action: "pause" | "resume" | "cancel" | "delete" | "archive" | "unarchive" | "duplicate") => {
        setActionLoading(id + action);
        try {
            if (action === "duplicate") {
                const res = await fetch(`${API_BASE}/campaigns/${id}/duplicate`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error();
                await fetchCampaigns(false);
                return;
            }

            if (action === "archive" || action === "unarchive") {
                const res = await fetch(`${API_BASE}/campaigns/${id}/${action}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error();
                if (action === "archive") {
                    setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id));
                    success("Campaign archived.");
                } else {
                    await fetchCampaigns(false);
                    success("Campaign restored.");
                }
                return;
            }

            const isDelete = action === "delete";
            const res = await fetch(
                isDelete ? `${API_BASE}/campaigns/${id}` : `${API_BASE}/campaigns/${id}/${action}`,
                { method: isDelete ? "DELETE" : "POST", headers: { Authorization: `Bearer ${token}` } },
            );
            if (!res.ok) throw new Error();

            if (isDelete) {
                setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id));
                success("Draft deleted.");
            } else {
                setCampaigns((prev) => prev.map((campaign) => (
                    campaign.id !== id ? campaign : {
                        ...campaign,
                        status: action === "pause" ? "paused" : action === "resume" ? "sending" : action === "cancel" ? "cancelled" : campaign.status,
                    }
                )));
                if (action === "pause") success("Campaign paused.");
                if (action === "resume") success("Campaign resumed.");
                if (action === "cancel") success("Campaign cancelled.");
            }
        } catch {
            toastError(`Could not ${action} campaign.`);
        } finally {
            setActionLoading(null);
        }
    };

    const discardLocalDraft = (draftId: string) => {
        try {
            const raw = localStorage.getItem("campaign_local_sessions");
            if (raw) {
                const sessions = JSON.parse(raw);
                delete sessions[draftId];
                localStorage.setItem("campaign_local_sessions", JSON.stringify(sessions));
            }
        } catch { }
        setLocalDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
        info("Unsaved browser session discarded");
    };

    const showEmpty = !loading && !error && filtered.length === 0 && localDrafts.length === 0;
    const showingRangeStart = total === 0 ? 0 : (page - 1) * 15 + 1;
    const showingRangeEnd = Math.min(page * 15, total);

    return (
        <div className="space-y-6 pb-8">
            <PageHeader
                title="Campaigns"
                subtitle="Create, schedule, pause, and archive outbound campaigns from one place."
                action={
                    <Button onClick={handleCreateNew}>
                        <Plus className="h-4 w-4" />
                        Create Campaign
                    </Button>
                }
            />

            <FilterBar
                leading={
                    <div className="flex flex-wrap items-center gap-2">
                        {STATUS_TABS.map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setActiveTab(tab.key);
                                        setPage(1);
                                    }}
                                    className={`rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition ${
                                        isActive ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                }
                trailing={activeTab === "archived" ? (
                    <div className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-muted)]">
                        <Archive className="h-3.5 w-3.5" />
                        Archived campaigns stay out of the active workflow, but analytics remain available.
                    </div>
                ) : null}
            >
                <div className="relative w-full max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                    />
                </div>
            </FilterBar>

            {error && (
                <InlineAlert
                    variant="danger"
                    title="Campaign data unavailable"
                    description={error}
                    icon={<AlertCircle className="mt-0.5 h-4 w-4" />}
                />
            )}

            {(activeTab === "all" || activeTab === "draft") && localDrafts.length > 0 && (
                <SectionCard
                    tone="subtle"
                    title="Unsaved browser sessions"
                    action={<Megaphone className="h-4 w-4 text-[var(--accent)]" />}
                >
                    <div className="space-y-3">
                        {localDrafts.map((draft) => (
                            <div key={draft.id} className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--accent-border)] bg-[var(--bg-card)] p-4 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{draft.name || "Untitled Session"}</p>
                                        <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">Unsaved</span>
                                    </div>
                                    <p className="mt-1 truncate text-sm text-[var(--text-muted)]">{draft.subject || "No subject yet"}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/campaigns/new?action=resume&draft_id=${draft.id}`}>
                                        <Button variant="outline" size="sm">Resume</Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setPendingAction({
                                            kind: "discard_local",
                                            id: draft.id,
                                            title: "Discard Unsaved Session?",
                                            message: "This local browser draft will be removed. Saved database drafts are unaffected.",
                                            confirmLabel: "Discard",
                                            variant: "warning",
                                        })}
                                    >
                                        Discard
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {loading && (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-[var(--accent)]" />
                </div>
            )}

            {showEmpty && (
                <EmptyState
                    icon={activeTab === "archived" ? <Archive className="h-10 w-10" /> : <Megaphone className="h-10 w-10" />}
                    title={activeTab === "archived" ? "No archived campaigns" : activeTab === "all" ? "No campaigns yet" : `No ${activeTab} campaigns`}
                    description={activeTab === "archived" ? "Archived campaigns will appear here for later reference." : "Create your first campaign to start sending and tracking performance."}
                    action={activeTab !== "archived" ? <Button onClick={handleCreateNew}>Create Campaign</Button> : undefined}
                />
            )}

            {!loading && !showEmpty && (
                <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)]">
                    <TableToolbar
                        title="Campaign List"
                        description="Active, scheduled, paused, and archived campaigns in one operational view."
                        trailing={<span className="text-xs text-[var(--text-muted)]">{filtered.length} visible</span>}
                        className="rounded-none border-0 border-b border-[var(--border)]"
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                                    {["Campaign", "Status", "Recipients", "Created", "Actions"].map((heading, index) => (
                                        <th
                                            key={heading}
                                            className={`px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] ${index >= 2 ? 'text-right' : 'text-left'}`}
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((campaign, index) => {
                                    const isWorking = actionLoading ? actionLoading.startsWith(campaign.id) : false;
                                    return (
                                        <tr key={campaign.id} className={`border-b border-[var(--border)] transition hover:bg-[var(--bg-hover)] ${index === filtered.length - 1 ? 'border-b-0' : ''}`}>
                                            <td className="px-5 py-4">
                                                <Link href={`/campaigns/${campaign.id}`} className="block">
                                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{campaign.name}</p>
                                                    <p className="mt-1 max-w-[360px] truncate text-sm text-[var(--text-muted)]">{campaign.subject || "No subject"}</p>
                                                </Link>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={(campaign.status === "completed" ? "sent" : campaign.status) as any} />
                                            </td>
                                            <td className="px-5 py-4 text-right text-sm text-[var(--text-muted)]">
                                                {campaign.stats?.[0]?.count ? campaign.stats[0].count.toLocaleString() : "—"}
                                            </td>
                                            <td className="px-5 py-4 text-right text-sm text-[var(--text-muted)]">
                                                {new Date(campaign.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    {campaign.status === "paused" && (
                                                        <button disabled={isWorking} onClick={() => handleAction(campaign.id, "resume")} className={`inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5 text-xs font-medium transition ${actionButtonClass("success")}`}>
                                                            <PlayCircle className="h-3.5 w-3.5" />
                                                            Resume
                                                        </button>
                                                    )}
                                                    {(campaign.status === "sending" || campaign.status === "processing") && (
                                                        <button disabled={isWorking} onClick={() => handleAction(campaign.id, "pause")} className={`inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5 text-xs font-medium transition ${actionButtonClass("warning")}`}>
                                                            <Pause className="h-3.5 w-3.5" />
                                                            Pause
                                                        </button>
                                                    )}
                                                    {["sending", "processing", "paused", "scheduled"].includes(campaign.status) && (
                                                        <button
                                                            disabled={isWorking}
                                                            onClick={() => setPendingAction({
                                                                kind: "campaign",
                                                                id: campaign.id,
                                                                action: "cancel",
                                                                title: "Cancel Campaign?",
                                                                message: "This campaign will stop progressing and no further messages will be sent.",
                                                                confirmLabel: "Cancel Campaign",
                                                                variant: "danger",
                                                            })}
                                                            className={`inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5 text-xs font-medium transition ${actionButtonClass("danger")}`}
                                                        >
                                                            <StopCircle className="h-3.5 w-3.5" />
                                                            Cancel
                                                        </button>
                                                    )}
                                                    {(campaign.status === "draft" || campaign.status === "paused") && (
                                                        <Link href={`/campaigns/new?edit=${campaign.id}`} className={`inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5 text-xs font-medium transition ${actionButtonClass()}`}>
                                                            Edit
                                                        </Link>
                                                    )}
                                                    <button
                                                        disabled={isWorking}
                                                        onClick={() => handleAction(campaign.id, "duplicate")}
                                                        title="Duplicate campaign"
                                                        className={`inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5 text-xs font-medium transition ${actionButtonClass()}`}
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                    {campaign.status === "archived" ? (
                                                        <button
                                                            disabled={isWorking}
                                                            onClick={() => setPendingAction({
                                                                kind: "campaign",
                                                                id: campaign.id,
                                                                action: "unarchive",
                                                                title: "Restore Campaign?",
                                                                message: "This campaign will return to the active workflow and become easier to find again.",
                                                                confirmLabel: "Restore",
                                                                variant: "primary",
                                                            })}
                                                            className={`inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5 text-xs font-medium transition ${actionButtonClass("success")}`}
                                                        >
                                                            <ArchiveRestore className="h-3.5 w-3.5" />
                                                            Restore
                                                        </button>
                                                    ) : campaign.status === "draft" ? (
                                                        <button
                                                            disabled={isWorking}
                                                            onClick={() => setPendingAction({
                                                                kind: "campaign",
                                                                id: campaign.id,
                                                                action: "delete",
                                                                title: "Delete Draft?",
                                                                message: "This draft will be permanently removed.",
                                                                confirmLabel: "Delete Draft",
                                                                variant: "danger",
                                                            })}
                                                            className={`inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5 text-xs font-medium transition ${actionButtonClass("danger")}`}
                                                        >
                                                            Delete
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled={isWorking}
                                                            onClick={() => setPendingAction({
                                                                kind: "campaign",
                                                                id: campaign.id,
                                                                action: "archive",
                                                                title: "Archive Campaign?",
                                                                message: "This campaign will move out of the active workflow. You can restore it from the Archived tab later.",
                                                                confirmLabel: "Archive",
                                                                variant: "warning",
                                                            })}
                                                            className={`inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5 text-xs font-medium transition ${actionButtonClass()}`}
                                                        >
                                                            <Archive className="h-3.5 w-3.5" />
                                                            Archive
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg-hover)] px-5 py-4">
                            <span className="text-sm text-[var(--text-muted)]">
                                Showing {showingRangeStart}-{showingRangeEnd} of {total} campaigns
                            </span>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                    Prev
                                </Button>
                                <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={!!pendingAction}
                onClose={() => setPendingAction(null)}
                onConfirm={() => {
                    if (!pendingAction) return;
                    const current = pendingAction;
                    setPendingAction(null);
                    if (current.kind === "discard_local") {
                        discardLocalDraft(current.id);
                        return;
                    }
                    if (current.kind === "campaign" && current.action) {
                        void handleAction(current.id, current.action);
                    }
                }}
                title={pendingAction?.title}
                message={pendingAction?.message || ""}
                confirmLabel={pendingAction?.confirmLabel}
                variant={pendingAction?.variant}
            />
        </div>
    );
}

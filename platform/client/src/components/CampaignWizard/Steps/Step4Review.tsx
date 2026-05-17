"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Send,
    CheckCircle2,
    FileText,
    Users,
    LayoutTemplate,
    AlertTriangle,
    Mail,
    CheckCheck,
    XCircle,
    Calendar,
    Clock,
    Zap,
    Bell,
    Monitor,
    Smartphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/utils/permissions";
import { Button, InlineAlert, Input, KeyValueList, ModalShell, SectionCard } from "@/components/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const STORAGE_KEY = "campaign_local_sessions";

function ReviewMetric({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-3 border-b border-[var(--border)] py-3 last:border-b-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--bg-hover)] text-[var(--text-muted)]">
                {icon}
            </div>
            <div>
                <p className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)]">{label}</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{value || "—"}</p>
            </div>
        </div>
    );
}

export default function Step4Review({ data, onBack, editId }: any) {
    const router = useRouter();
    const { token, user } = useAuth();

    // Roles: Creators request review. Admins/Owners launch directly.
    const canSend = can(user, "campaign:send");

    const [status, setStatus] = useState<"idle" | "creating" | "sending" | "success" | "error" | "review_requested">("idle");
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [errorMsg, setErrorMsg] = useState<string | Record<string, unknown>>("");
    const [sendMode, setSendMode] = useState<"now" | "later">("now");
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleTime, setScheduleTime] = useState("");
    const scheduledAt = scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : "";
    const [scheduledMsg, setScheduledMsg] = useState("");
    const [showTestModal, setShowTestModal] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [testStatus, setTestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

    // Track if review is already requested (persisted status from DB)
    const [requestedReview, setRequestedReview] = useState(data.status === "awaiting_review");

    const buildCampaignPayload = () => ({
        name: data.name || "Untitled Draft",
        subject: data.subject || "",
        body_html: data.htmlContent || "",
        status: "draft",
        from_name: data.from_name || "",
        from_prefix: data.from_prefix || "",
        domain_id: data.domain_id || null,
        // Admins set schedule; Creators don't touch this
        scheduled_at: canSend && sendMode === "later" ? new Date(scheduledAt).toISOString() : null,
        audience_target: data.listId || "all",
    });

    useEffect(() => {
        if (canSend && sendMode === "later" && !scheduleDate && !scheduleTime) {
            const d = new Date(Date.now() + 5 * 60 * 1000);
            const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
            setScheduleDate(localISO.split("T")[0]);
            setScheduleTime(localISO.split("T")[1].slice(0, 5));
        }
    }, [canSend, sendMode, scheduleDate, scheduleTime]);

    const checks = [
        { label: "Campaign name set", ok: !!data.name?.trim() },
        { label: "Sender identity configured", ok: !!(data.from_name && data.from_prefix && data.domain_id) },
        { label: "Subject line filled", ok: !!data.subject?.trim() },
        { label: "Content written", ok: !!data.htmlContent?.trim() },
        { label: "Audience selected", ok: !!data.listId },
    ];
    const allChecksPass = checks.every((c) => c.ok);

    // ─── Clean up local storage after any successful action ──────────────────
    const cleanLocalDraft = () => {
        try {
            const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            Object.keys(sessions).forEach((sessionId) => {
                if (
                    sessions[sessionId]?.data?.name === data.name &&
                    sessions[sessionId]?.data?.subject === data.subject
                ) {
                    delete sessions[sessionId];
                }
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        } catch { }
    };

    // ─── Save draft to DB (used by both flows before any state transition) ───
    const saveDraftToDb = async (): Promise<string> => {
        if (editId) {
            const updateRes = await fetch(`${API_BASE}/campaigns/${editId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...buildCampaignPayload(), status: "draft" }),
            });
            if (!updateRes.ok) {
                const err = await updateRes.json().catch(() => ({ detail: "Failed to save changes." }));
                throw new Error(err.detail || "Failed to save changes.");
            }
            return editId;
        } else {
            const createRes = await fetch(`${API_BASE}/campaigns/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...buildCampaignPayload(), status: "draft" }),
            });
            if (!createRes.ok) {
                const err = await createRes.json().catch(() => ({ detail: "Failed to create draft." }));
                throw new Error(err.detail || "Failed to create draft.");
            }
            const result = await createRes.json();
            return result.id;
        }
    };

    // ─── CREATOR: Request Admin Review ───────────────────────────────────────
    const handleRequestReview = async () => {
        if (!token) return;
        setStatus("creating");
        setErrorMsg("");

        try {
            // Step 1: Sync the latest content to DB so Admin sees the most current version
            const campaignId = await saveDraftToDb();

            // Step 2: Transition status to awaiting_review + notify Admins
            const res = await fetch(`${API_BASE}/campaigns/${campaignId}/request-review`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ detail: "Failed to submit review request." }));
                throw new Error(errData.detail || "Failed to submit review request.");
            }

            cleanLocalDraft();
            setRequestedReview(true);
            setStatus("review_requested");
        } catch (err: any) {
            setErrorMsg(err.message);
            setStatus("error");
        }
    };

    // ─── ADMIN / OWNER: Direct Launch ────────────────────────────────────────
    const handleLaunch = async () => {
        if (!token || !allChecksPass) return;

        if (sendMode === "later") {
            if (!scheduleDate || !scheduleTime) {
                setErrorMsg("Please choose both a date and time to schedule.");
                return;
            }
            const chosenDate = new Date(`${scheduleDate}T${scheduleTime}`);
            if (chosenDate.getTime() <= Date.now()) {
                setErrorMsg("Scheduled date and time must be in the future.");
                return;
            }
        }

        setStatus("creating");
        setErrorMsg("");

        try {
            const campaignId = await saveDraftToDb();
            setStatus("sending");

            // STATE MACHINE: draft → approved → sending
            // Admins/Owners must approve their own campaigns before dispatch
            const approveRes = await fetch(`${API_BASE}/campaigns/${campaignId}/approve`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!approveRes.ok) {
                const err = await approveRes.json().catch(() => ({ detail: "Failed to approve campaign." }));
                throw new Error(err.detail || "Failed to approve campaign.");
            }

            if (sendMode === "now") {
                const sendRes = await fetch(`${API_BASE}/campaigns/${campaignId}/send`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ target_list_id: data.listId }),
                });
                if (!sendRes.ok) {
                    const err = await sendRes.json().catch(() => ({ detail: "Failed to launch campaign" }));
                    throw new Error(err.detail || "Failed to launch campaign");
                }
            } else {
                const utcIso = new Date(scheduledAt).toISOString();
                const schedRes = await fetch(`${API_BASE}/campaigns/${campaignId}/schedule`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ scheduled_at: utcIso, target_list_id: data.listId }),
                });
                if (!schedRes.ok) {
                    const err = await schedRes.json().catch(() => ({ detail: "Failed to schedule campaign" }));
                    throw new Error(err.detail || "Failed to schedule campaign");
                }
                const j = await schedRes.json();
                setScheduledMsg(j.message || "Campaign scheduled.");
            }

            cleanLocalDraft();
            setStatus("success");
            setTimeout(() => router.push("/campaigns"), 3000);
        } catch (err: any) {
            setStatus("error");
            try {
                const parsedDetail = JSON.parse(err.message);
                setErrorMsg(parsedDetail);
            } catch {
                setErrorMsg(err.message);
            }
        }
    };

    // ─── Send Test Email ──────────────────────────────────────────────────────
    const handleSendTest = async () => {
        if (!token || !testEmail) return;
        setTestStatus("sending");
        let temporaryCampaignId: string | null = null;
        try {
            let campaignId = editId;

            if (!campaignId) {
                const createRes = await fetch(`${API_BASE}/campaigns/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        ...buildCampaignPayload(),
                        name: `[TEST] ${data.name || "Untitled Draft"}`,
                    }),
                });
                if (!createRes.ok) {
                    const error = await createRes.json().catch(() => ({ detail: "Failed to create temporary test draft" }));
                    throw new Error(error.detail || "Failed to create temporary test draft");
                }
                const created = await createRes.json();
                campaignId = created.id;
                temporaryCampaignId = created.id;
            } else {
                const updateRes = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(buildCampaignPayload()),
                });
                if (!updateRes.ok) {
                    const error = await updateRes.json().catch(() => ({ detail: "Failed to sync campaign before test send" }));
                    throw new Error(error.detail || "Failed to sync campaign before test send");
                }
            }

            const testRes = await fetch(`${API_BASE}/campaigns/${campaignId}/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipient_email: testEmail }),
            });
            if (!testRes.ok) {
                const error = await testRes.json().catch(() => ({ detail: "Failed to send test email" }));
                throw new Error(error.detail || "Failed to send test email");
            }
            setTestStatus("sent");
            setTimeout(() => {
                setShowTestModal(false);
                setTestStatus("idle");
                setTestEmail("");
            }, 2000);
        } catch {
            setTestStatus("error");
        } finally {
            if (temporaryCampaignId) {
                try {
                    await fetch(`${API_BASE}/campaigns/${temporaryCampaignId}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                } catch { }
            }
        }
    };

    // ─── Success: Admin launched campaign ────────────────────────────────────
    if (status === "success") {
        const isScheduled = sendMode === "later";
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-16 text-center">
                <div className={`mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full border ${
                    isScheduled
                        ? "border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)]"
                        : "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.1)]"
                }`}>
                    {isScheduled ? <Calendar className="h-9 w-9 text-[var(--accent)]" /> : <CheckCircle2 className="h-9 w-9 text-[var(--success)]" />}
                </div>
                <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
                    {isScheduled ? "Campaign Scheduled" : "Campaign Launched"}
                </h2>
                <p className="max-w-[420px] text-sm text-[var(--text-muted)]">
                    {isScheduled
                        ? scheduledMsg || "Your campaign has been scheduled. Redirecting..."
                        : `${data.name} has been queued. Workers are now sending emails.`}
                </p>
            </div>
        );
    }

    // ─── Success: Creator submitted for review ────────────────────────────────
    if (status === "review_requested") {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)]">
                    <Bell className="h-9 w-9 text-[var(--accent)]" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
                    Review Requested!
                </h2>
                <p className="max-w-[440px] text-sm text-[var(--text-muted)] mb-6">
                    Your campaign <strong className="text-[var(--text-primary)]">{data.name}</strong> has been submitted for review. Admins have been notified by email and will verify and send it on your behalf.
                </p>
                <Button variant="outline" onClick={() => router.push("/campaigns")}>
                    Back to Campaigns
                </Button>
            </div>
        );
    }

    const errorIsQuota =
        errorMsg != null &&
        typeof errorMsg === "object" &&
        "code" in errorMsg &&
        (errorMsg as Record<string, unknown>).code === "QUOTA_EXCEEDED";

    return (
        <div className="p-9">
            <div className="mb-7 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent-glow)]">
                    <Send className="h-[18px] w-[18px] text-[var(--accent)]" />
                </div>
                <div>
                    <h2 className="m-0 text-lg font-semibold text-[var(--text-primary)]">
                        {canSend ? "Review & Launch" : "Review & Submit"}
                    </h2>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                        {canSend
                            ? "Double-check the campaign before sending."
                            : "Review your campaign and request admin approval to send."}
                    </p>
                </div>
            </div>

            <div className="mb-5 grid gap-6 lg:grid-cols-2">
                <SectionCard title="Campaign Summary">
                    <ReviewMetric icon={<FileText className="h-4 w-4" />} label="Campaign" value={`${data.name || "Untitled"} — ${data.subject || "No subject"}`} />
                    <ReviewMetric icon={<Mail className="h-4 w-4" />} label="Sender" value={`${data.from_name || "—"} <${data.from_prefix || "sender"}@${data.domain_name || "your-domain"}>`} />
                    <ReviewMetric icon={<Users className="h-4 w-4" />} label="Audience" value={data.listName || "—"} />
                    <ReviewMetric icon={<LayoutTemplate className="h-4 w-4" />} label="Content Source" value={data.templateName || "Composed Email"} />
                </SectionCard>

                <SectionCard 
                    title="Campaign Preview" 
                    description="Audit responsiveness by switching between desktop and mobile previews."
                >
                    <div className="flex flex-col gap-4">
                        {/* Device Toggle Header */}
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.05em]">Device Preview</span>
                            <div className="flex rounded-[var(--radius)] bg-[var(--bg-primary)] p-0.5 border border-[var(--border)]">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode("desktop")}
                                    className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-all ${
                                        previewMode === "desktop"
                                            ? "bg-white text-[var(--accent)] shadow-sm border border-[var(--border)]"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    }`}
                                >
                                    <Monitor className="h-3.5 w-3.5" />
                                    Desktop
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode("mobile")}
                                    className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-all ${
                                        previewMode === "mobile"
                                            ? "bg-white text-[var(--accent)] shadow-sm border border-[var(--border)]"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    }`}
                                >
                                    <Smartphone className="h-3.5 w-3.5" />
                                    Mobile
                                </button>
                            </div>
                        </div>

                        {/* Live Sandbox Preview Viewport */}
                        <div className="flex items-center justify-center bg-[var(--bg-primary)] rounded-[var(--radius-lg)] border border-[var(--border)] p-4 min-h-[460px] overflow-hidden transition-all duration-300">
                            {previewMode === "desktop" ? (
                                /* Bulletproof Full-Width Desktop Iframe */
                                <div className="w-full h-[420px] rounded-[var(--radius)] overflow-hidden border border-[var(--border)] bg-white shadow-sm">
                                    <iframe
                                        srcDoc={data.htmlContent}
                                        title="Desktop Preview"
                                        className="w-full h-full border-0"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            ) : (
                                /* Sleek iPhone-style Device Shell Mockup */
                                <div className="relative mx-auto w-[340px] h-[440px] rounded-[40px] border-[12px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden transition-all duration-300">
                                    {/* Speaker notch / capsule pill */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 rounded-full bg-slate-950 z-10 flex items-center justify-center">
                                        <div className="w-8 h-1 rounded-full bg-slate-800" />
                                    </div>
                                    {/* Isolated scrolling mobile template iframe */}
                                    <div className="w-full h-full pt-6 bg-white overflow-hidden rounded-[28px]">
                                        <iframe
                                            srcDoc={data.htmlContent}
                                            title="Mobile Preview"
                                            className="w-full h-full border-0 bg-white"
                                            sandbox="allow-same-origin"
                                        />
                                    </div>
                                    {/* Home swipe indicator line at the bottom */}
                                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full bg-slate-400 z-10" />
                                </div>
                            )}
                        </div>
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="Pre-send Checklist" className="mb-5">
                <div className="grid gap-2 md:grid-cols-2">
                    {checks.map((c) => (
                        <div key={c.label} className={`flex items-center gap-2 text-sm ${c.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                            {c.ok ? <CheckCheck className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            <span className={c.ok ? "text-[var(--text-secondary)]" : "text-[var(--danger)]"}>{c.label}</span>
                        </div>
                    ))}
                </div>
                {!allChecksPass && (
                    <p className="mt-3 text-xs text-[var(--danger)]">Fix the items above before {canSend ? "launching" : "submitting"}.</p>
                )}
            </SectionCard>

            {/* Send Mode — ADMIN / OWNER ONLY. Creators do not dispatch. */}
            {canSend && (
                <SectionCard title="Send Mode" className="mb-5">
                    <div className="mb-4 grid grid-cols-2 gap-2">
                        {(["now", "later"] as const).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => {
                                    setSendMode(mode);
                                    setErrorMsg("");
                                }}
                                className={`flex items-center justify-center gap-2 rounded-[var(--radius)] border px-4 py-3 text-sm font-semibold transition ${
                                    sendMode === mode
                                        ? mode === "now"
                                            ? "border-[var(--success-border)] bg-[var(--success-bg)]/40 text-[var(--success)]"
                                            : "border-[var(--accent-border)] bg-[var(--accent)]/10 text-[var(--accent)]"
                                        : "border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                                }`}
                            >
                                {mode === "now" ? <><Zap className="h-4 w-4" /> Send Now</> : <><Calendar className="h-4 w-4" /> Schedule for Later</>}
                            </button>
                        ))}
                    </div>

                    {sendMode === "later" && (
                        <div className="space-y-4 border-t border-[var(--border)] pt-4">
                            <p className="text-xs text-[var(--text-muted)]">Choose a date and time. It will be converted to UTC automatically.</p>
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                                <div className="grid flex-1 gap-3 md:grid-cols-[1fr_1fr]">
                                    <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                                    <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                                </div>
                            </div>
                            {scheduledAt && (
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Sends: {new Date(scheduledAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
                                </p>
                            )}
                        </div>
                    )}
                </SectionCard>
            )}

            {/* Already submitted banner for Creators */}
            {!canSend && requestedReview && (
                <div className="mb-5 flex items-center gap-3 rounded-[var(--radius)] border border-[var(--accent-border)] bg-[var(--accent)]/10 px-4 py-3">
                    <Bell className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                    <p className="text-sm text-[var(--text-secondary)]">
                        Review request already submitted. An admin will review and send this campaign.
                    </p>
                </div>
            )}

            {(status === "error" || errorMsg) && (
                <div className="mb-5">
                    <InlineAlert
                        variant="danger"
                        title={
                            errorIsQuota
                                ? "Monthly Sending Limit Reached"
                                : canSend
                                ? "Launch Failed"
                                : "Submission Failed"
                        }
                        description={
                            errorMsg != null && typeof errorMsg === "object" && "message" in errorMsg
                                ? (errorMsg as Record<string, unknown>).message as string
                                : String(errorMsg ?? "")
                        }
                        icon={<AlertTriangle className="h-5 w-5" />}
                        action={
                            errorIsQuota
                                ? <Button variant="danger" size="sm" onClick={() => router.push("/settings/billing")}>Upgrade to Pro</Button>
                                : undefined
                        }
                    />
                </div>
            )}

            <div className="flex items-center justify-between border-t border-[var(--border)] pt-5">
                <Button onClick={onBack} variant="ghost" disabled={status === "creating" || status === "sending"}>
                    ← Back
                </Button>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setShowTestModal(true)} variant="outline">
                        <Mail className="h-4 w-4" /> Send Test
                    </Button>

                    {canSend ? (
                        /* Admin / Owner — Direct Launch Button */
                        <Button
                            onClick={handleLaunch}
                            disabled={!allChecksPass || status === "creating" || status === "sending" || (sendMode === "later" && !scheduledAt)}
                        >
                            {status === "creating" ? (
                                <>Saving...</>
                            ) : status === "sending" ? (
                                <>{sendMode === "now" ? "Queuing emails..." : "Scheduling..."}</>
                            ) : sendMode === "later" ? (
                                <><Calendar className="h-4 w-4" /> Schedule Campaign</>
                            ) : (
                                <><Send className="h-4 w-4" /> Launch Campaign</>
                            )}
                        </Button>
                    ) : requestedReview ? (
                        /* Creator — Already submitted */
                        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--success-border)] bg-[var(--success-bg)]/40 px-4 py-2 text-sm font-medium text-[var(--success)]">
                            <CheckCheck className="h-4 w-4" /> Review Requested
                        </div>
                    ) : (
                        /* Creator — Request Approval */
                        <div className="flex flex-col items-end gap-1">
                            <Button
                                onClick={handleRequestReview}
                                isLoading={status === "creating"}
                                disabled={!allChecksPass || status === "creating"}
                            >
                                <Bell className="h-4 w-4" /> Request Approval
                            </Button>
                            <span className="text-[10px] text-[var(--text-muted)]">An admin must verify before sending.</span>
                        </div>
                    )}
                </div>
            </div>

            <ModalShell
                isOpen={showTestModal}
                onClose={() => {
                    setShowTestModal(false);
                    setTestStatus("idle");
                }}
                title="Send Test Email"
                description="Send a preview of this campaign to any email address to check how it looks."
                maxWidthClass="max-w-md"
            >
                <div className="space-y-4">
                    <Input
                        type="email"
                        placeholder="your@email.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                    />
                    {testStatus === "sent" && (
                        <InlineAlert variant="success" description={`Test email sent to ${testEmail}.`} />
                    )}
                    {testStatus === "error" && (
                        <InlineAlert variant="danger" description="Failed to send test email. Try again." />
                    )}
                    <Button onClick={handleSendTest} disabled={!testEmail || testStatus === "sending"} fullWidth isLoading={testStatus === "sending"}>
                        {!(testStatus === "sending") && <Mail className="h-4 w-4" />}
                        {testStatus === "sending" ? "Sending..." : "Send Test"}
                    </Button>
                </div>
            </ModalShell>
        </div>
    );
}

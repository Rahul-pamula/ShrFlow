"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    ArrowLeft, Copy, Settings, MoreHorizontal,
    Mail, Users, MousePointer, AlertTriangle, RotateCcw,
    Send, Eye, Loader2, TrendingUp, Pause, Play, XOctagon
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
    draft: { bg: "rgba(113,113,122,0.15)", color: "#A1A1AA", border: "rgba(113,113,122,0.3)" },
    sending: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", border: "rgba(59,130,246,0.3)" },
    sent: { bg: "rgba(34,197,94,0.12)", color: "#4ADE80", border: "rgba(34,197,94,0.3)" },
    paused: { bg: "rgba(234,179,8,0.12)", color: "#FDE047", border: "rgba(234,179,8,0.3)" },
    scheduled: { bg: "rgba(139,92,246,0.12)", color: "#A78BFA", border: "rgba(139,92,246,0.3)" },
    cancelled: { bg: "rgba(239,68,68,0.12)", color: "#F87171", border: "rgba(239,68,68,0.3)" },
};

export default function CampaignDetailsPage() {
    const { id } = useParams();
    const { token } = useAuth();
    const [campaign, setCampaign] = useState<any>(null);
    const [dispatch, setDispatch] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadCampaign = async () => {
        if (!token || !id) return;
        const headers = { Authorization: `Bearer ${token}` };
        const [camp, disp] = await Promise.all([
            fetch(`${API_BASE}/campaigns/${id}`, { headers }).then(r => r.json()),
            fetch(`${API_BASE}/campaigns/${id}/dispatch`, { headers }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
        ]);
        setCampaign(camp);
        setDispatch(disp.data || []);
        setLoading(false);
    };

    const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
        if (!token) return;
        setActionLoading(action);
        try {
            await fetch(`${API_BASE}/campaigns/${id}/${action}`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }
            });
            await loadCampaign(); // refresh
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    useEffect(() => { loadCampaign(); }, [token, id]);

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
            <Loader2 size={32} color="#3B82F6" style={{ animation: "spin 1s linear infinite" }} />
        </div>
    );

    if (!campaign || campaign.detail) return (
        <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "#71717A", fontSize: "14px" }}>Campaign not found.</p>
            <Link href="/campaigns" style={{ color: "#3B82F6", fontSize: "13px" }}>← Back to Campaigns</Link>
        </div>
    );

    const statusStyle = STATUS_STYLES[campaign.status] || STATUS_STYLES.draft;

    // Compute real metrics from dispatch table
    const total = dispatch.length;
    const dispatched = dispatch.filter((d: any) => d.status === "DISPATCHED").length;
    const failed = dispatch.filter((d: any) => d.status === "FAILED").length;
    const pending = dispatch.filter((d: any) => ["PENDING", "PROCESSING"].includes(d.status)).length;

    const metrics = [
        { label: "Total Sent", value: total, icon: Send, color: "#3B82F6", sub: "" },
        { label: "Delivered", value: dispatched, icon: Mail, color: "#4ADE80", sub: total ? `${((dispatched / total) * 100).toFixed(1)}%` : "—" },
        { label: "Pending", value: pending, icon: Loader2, color: "#FDE047", sub: "" },
        { label: "Failed", value: failed, icon: AlertTriangle, color: "#F87171", sub: total ? `${((failed / total) * 100).toFixed(1)}%` : "—" },
    ];

    const failedDispatch = dispatch.filter((d: any) => d.status === "FAILED");

    return (
        <div style={{ padding: "24px 32px", maxWidth: "1100px" }}>
            {/* Back */}
            <Link href="/campaigns" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#71717A", textDecoration: "none", marginBottom: "20px" }}>
                <ArrowLeft size={14} /> Back to Campaigns
            </Link>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#FAFAFA", margin: 0 }}>{campaign.name}</h1>
                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
                            {campaign.status}
                        </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#71717A", margin: 0 }}>
                        {campaign.scheduled_at ? `Sent on ${new Date(campaign.scheduled_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : `Created ${new Date(campaign.created_at).toLocaleDateString()}`}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    {/* Analytics link — shown for sent/sending campaigns */}
                    {["sent", "sending", "paused", "cancelled"].includes(campaign.status) && (
                        <Link
                            href={`/campaigns/${id}/analytics`}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "8px 16px", borderRadius: "8px", fontSize: "13px",
                                fontWeight: 500, textDecoration: "none", cursor: "pointer",
                                background: "rgba(99,102,241,0.12)",
                                border: "1px solid rgba(99,102,241,0.3)",
                                color: "#818CF8"
                            }}
                        >
                            <TrendingUp size={14} /> Analytics
                        </Link>
                    )}
                    {/* Pause/Resume/Cancel — only shown during active sends */}
                    {campaign.status === "sending" && (
                        <>
                            <button onClick={() => handleAction('pause')} disabled={!!actionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '8px', color: '#FDE047', fontSize: '13px', cursor: 'pointer' }}>
                                {actionLoading === 'pause' ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Pause size={13} />}
                                Pause
                            </button>
                            <button onClick={() => handleAction('cancel')} disabled={!!actionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#F87171', fontSize: '13px', cursor: 'pointer' }}>
                                {actionLoading === 'cancel' ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <XOctagon size={13} />}
                                Cancel
                            </button>
                        </>
                    )}
                    {campaign.status === "paused" && (
                        <>
                            <button onClick={() => handleAction('resume')} disabled={!!actionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', color: '#4ADE80', fontSize: '13px', cursor: 'pointer' }}>
                                {actionLoading === 'resume' ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={13} />}
                                Resume
                            </button>
                            <button onClick={() => handleAction('cancel')} disabled={!!actionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#F87171', fontSize: '13px', cursor: 'pointer' }}>
                                {actionLoading === 'cancel' ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <XOctagon size={13} />}
                                Cancel
                            </button>
                        </>
                    )}
                    <button style={{ padding: "8px 14px", background: "rgba(24,24,27,0.6)", border: "1px solid rgba(63,63,70,0.4)", borderRadius: "8px", color: "#A1A1AA", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Copy size={13} /> Duplicate
                    </button>
                    <button className="btn-premium" style={{ fontSize: "13px" }}>
                        <Eye size={13} style={{ display: "inline", marginRight: "6px" }} />View Preview
                    </button>
                </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
                {metrics.map((m) => {
                    const Icon = m.icon;
                    return (
                        <div key={m.label} style={{ padding: "18px 20px", background: "rgba(24,24,27,0.5)", border: "1px solid rgba(63,63,70,0.35)", borderRadius: "10px", backdropFilter: "blur(8px)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 500, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</span>
                                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `${m.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Icon size={13} color={m.color} />
                                </div>
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: 700, color: "#FAFAFA", lineHeight: 1 }}>{m.value.toLocaleString()}</div>
                            {m.sub && <div style={{ fontSize: "12px", color: m.color, marginTop: "4px", fontWeight: 500 }}>{m.sub}</div>}
                        </div>
                    );
                })}
            </div>

            {/* Two-column layout */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>

                {/* Left: Activity + Failed */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* Activity Timeline placeholder */}
                    <div style={{ padding: "20px 22px", background: "rgba(24,24,27,0.5)", border: "1px solid rgba(63,63,70,0.35)", borderRadius: "10px" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#E4E4E7", margin: "0 0 16px" }}>Activity Timeline</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            {[
                                { label: "Delivered", pct: total ? (dispatched / total) * 100 : 0, color: "#4ADE80", val: dispatched },
                                { label: "Failed", pct: total ? (failed / total) * 100 : 0, color: "#F87171", val: failed },
                                { label: "Pending", pct: total ? (pending / total) * 100 : 0, color: "#FDE047", val: pending },
                            ].map(bar => (
                                <div key={bar.label}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                        <span style={{ fontSize: "12px", color: "#A1A1AA" }}>{bar.label}</span>
                                        <span style={{ fontSize: "12px", color: bar.color, fontWeight: 600 }}>{bar.val.toLocaleString()} <span style={{ color: "#52525B", fontWeight: 400 }}>({bar.pct.toFixed(1)}%)</span></span>
                                    </div>
                                    <div style={{ height: "6px", background: "rgba(63,63,70,0.3)", borderRadius: "3px", overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${bar.pct}%`, background: bar.color, borderRadius: "3px", transition: "width 0.6s ease" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {total === 0 && (
                            <p style={{ color: "#52525B", fontSize: "13px", textAlign: "center", padding: "16px 0 0", margin: 0 }}>No dispatch data yet — launch the campaign first</p>
                        )}
                    </div>

                    {/* Failed Deliveries */}
                    <div style={{ padding: "20px 22px", background: "rgba(24,24,27,0.5)", border: "1px solid rgba(63,63,70,0.35)", borderRadius: "10px" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#E4E4E7", margin: "0 0 14px" }}>
                            Failed Deliveries
                            {failedDispatch.length > 0 && <span style={{ marginLeft: "8px", padding: "2px 7px", borderRadius: "10px", fontSize: "11px", background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>{failedDispatch.length}</span>}
                        </h3>
                        {failedDispatch.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "24px 0", color: "#52525B", fontSize: "13px" }}>
                                <div style={{ fontSize: "20px", marginBottom: "6px" }}>✅</div>
                                No failed deliveries
                            </div>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(63,63,70,0.3)" }}>
                                        <th style={{ padding: "8px 0", textAlign: "left", fontWeight: 500, color: "#71717A" }}>Email</th>
                                        <th style={{ padding: "8px 0", textAlign: "left", fontWeight: 500, color: "#71717A" }}>Reason</th>
                                        <th style={{ padding: "8px 0", width: "40px" }} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {failedDispatch.slice(0, 10).map((d: any) => (
                                        <tr key={d.id} style={{ borderBottom: "1px solid rgba(63,63,70,0.2)" }}>
                                            <td style={{ padding: "9px 0", color: "#E4E4E7" }}>{d.subscriber_email || d.subscriber_id}</td>
                                            <td style={{ padding: "9px 0", color: "#F87171", fontSize: "12px" }}>{d.error_log || "Unknown"}</td>
                                            <td style={{ padding: "9px 0", textAlign: "right" }}>
                                                <button title="Retry" style={{ background: "none", border: "none", cursor: "pointer", color: "#71717A", padding: "2px" }}>
                                                    <RotateCcw size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right: Details Panel */}
                <div style={{ padding: "20px 22px", background: "rgba(24,24,27,0.5)", border: "1px solid rgba(63,63,70,0.35)", borderRadius: "10px", height: "fit-content" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#E4E4E7", margin: "0 0 18px" }}>Campaign Details</h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {[
                            { label: "Subject Line", value: campaign.subject },
                            { label: "Status", value: campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) },
                            { label: "Created", value: new Date(campaign.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                        ].map(item => (
                            <div key={item.label}>
                                <label style={{ fontSize: "11px", fontWeight: 500, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>{item.label}</label>
                                <div style={{ fontSize: "13px", color: "#E4E4E7", lineHeight: 1.5 }}>{item.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(63,63,70,0.3)" }}>
                        <button style={{ width: "100%", padding: "9px", background: "transparent", border: "1px solid rgba(63,63,70,0.4)", borderRadius: "8px", color: "#A1A1AA", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                            <Settings size={13} /> Configure
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

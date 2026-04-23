"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
    Zap, Send, AlertTriangle, Clock, RefreshCw,
    Loader2, ChevronDown, ChevronUp, CheckCircle2, XCircle
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
    sent: { color: "var(--success)", bg: "var(--success-bg)", border: "var(--success-border)" },
    sending: { color: "var(--info)", bg: "var(--info-bg)", border: "var(--border)" },
    paused: { color: "var(--warning)", bg: "var(--warning-bg)", border: "var(--warning-border)" },
    cancelled: { color: "var(--text-muted)", bg: "var(--bg-hover)", border: "var(--border)" },
    draft: { color: "var(--text-muted)", bg: "var(--bg-hover)", border: "var(--border)" },
};

function timeAgo(ts: string) {
    if (!ts) return "—";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function EventsPage() {
    const { token } = useAuth();
    const [summary, setSummary] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [dispatchMap, setDispatchMap] = useState<Record<string, any[]>>({});
    const [dispatchLoading, setDispatchLoading] = useState<string | null>(null);

    const load = async () => {
        if (!token) return;
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [sumRes, campRes] = await Promise.all([
                fetch(`${API_BASE}/events/summary`, { headers }),
                fetch(`${API_BASE}/campaigns/?page=1&limit=50`, { headers }),
            ]);
            if (sumRes.ok) setSummary(await sumRes.json());
            if (campRes.ok) {
                const j = await campRes.json();
                setCampaigns(j.campaigns || []);
            }
        } finally { setLoading(false); }
    };

    const loadDispatch = async (campaignId: string) => {
        if (dispatchMap[campaignId]) return; // already loaded
        if (!token) return;
        setDispatchLoading(campaignId);
        const res = await fetch(`${API_BASE}/campaigns/${campaignId}/dispatch`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const j = await res.json();
        setDispatchMap(prev => ({ ...prev, [campaignId]: j.data || [] }));
        setDispatchLoading(null);
    };

    const toggleExpand = async (id: string) => {
        if (expanded === id) { setExpanded(null); return; }
        setExpanded(id);
        await loadDispatch(id);
    };

    useEffect(() => { load(); }, [token]);

    // Compute per-campaign dispatch stats from summary data
    const statCards = summary ? [
        { label: "Total Emails", value: summary.total, color: "var(--accent)", icon: Zap },
        { label: "Delivered", value: summary.sent, color: "var(--success)", icon: Send },
        { label: "Failed", value: summary.failed, color: "var(--danger)", icon: AlertTriangle },
        { label: "Queued", value: summary.pending, color: "var(--warning)", icon: Clock },
    ] : [];

    return (
        <div style={{ padding: "24px 32px", maxWidth: "1100px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Zap size={18} color="#8B5CF6" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Events</h1>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Campaign delivery activity</p>
                    </div>
                </div>
                <button onClick={load} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
                    {statCards.map(c => {
                        const Icon = c.icon;
                        return (
                            <div key={c.label} style={{ padding: "16px 18px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</span>
                                    <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: `${c.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Icon size={12} color={c.color} />
                                    </div>
                                </div>
                                <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{(c.value ?? 0).toLocaleString()}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Campaign Activity Table */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                {/* Table header */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 110px 80px 80px 80px 90px 40px", gap: "8px", padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--bg-hover)" }}>
                    {["Campaign", "Status", "Sent", "Failed", "Pending", "Last Activity", ""].map(h => (
                        <span key={h} style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
                        <Loader2 size={24} color="#8B5CF6" style={{ animation: "spin 1s linear infinite" }} />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px" }}>
                        <Zap size={28} color="var(--text-muted)" style={{ margin: "0 auto 10px", display: "block" }} />
                        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>No campaigns yet. Launch one to see activity here.</p>
                    </div>
                ) : campaigns.map((camp, idx) => {
                    const ss = STATUS_STYLES[camp.status] || STATUS_STYLES.draft;
                    const rows = dispatchMap[camp.id] || [];
                    const dispatched = rows.filter((r: any) => r.status === "DISPATCHED").length;
                    const failed = rows.filter((r: any) => r.status === "FAILED").length;
                    const pending = rows.filter((r: any) => ["PENDING", "PROCESSING"].includes(r.status)).length;
                    const isExpanded = expanded === camp.id;
                    const isLoadingThis = dispatchLoading === camp.id;

                    return (
                        <div key={camp.id} style={{ borderBottom: idx < campaigns.length - 1 ? "1px solid var(--border)" : "none" }}>
                            {/* Campaign row */}
                            <div
                                onClick={() => toggleExpand(camp.id)}
                                style={{ display: "grid", gridTemplateColumns: "2fr 110px 80px 80px 80px 90px 40px", gap: "8px", padding: "13px 18px", cursor: "pointer", transition: "background 0.15s", alignItems: "center" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                                <div>
                                    <Link href={`/campaigns/${camp.id}`} onClick={e => e.stopPropagation()}
                                        style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}
                                        onMouseEnter={e => (e.currentTarget.style.color = "#60A5FA")}
                                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>
                                        {camp.name}
                                    </Link>
                                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>{camp.subject}</p>
                                </div>
                                <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, textTransform: "capitalize", background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, width: "fit-content" }}>
                                    {camp.status}
                                </span>
                                <span style={{ fontSize: "13px", color: "#4ADE80", fontWeight: 600 }}>
                                    {isLoadingThis ? "…" : rows.length > 0 ? dispatched.toLocaleString() : "—"}
                                </span>
                                <span style={{ fontSize: "13px", color: failed > 0 ? "#F87171" : "var(--text-muted)", fontWeight: failed > 0 ? 600 : 400 }}>
                                    {isLoadingThis ? "…" : rows.length > 0 ? failed.toLocaleString() : "—"}
                                </span>
                                <span style={{ fontSize: "13px", color: pending > 0 ? "#FDE047" : "var(--text-muted)" }}>
                                    {isLoadingThis ? "…" : rows.length > 0 ? pending.toLocaleString() : "—"}
                                </span>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{timeAgo(camp.updated_at || camp.created_at)}</span>
                                <span style={{ color: "var(--text-muted)", display: "flex", justifyContent: "center" }}>
                                    {isLoadingThis ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </span>
                            </div>

                            {/* Expanded dispatch rows */}
                            {isExpanded && rows.length > 0 && (
                                <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-hover)", padding: "8px 18px 12px 36px" }}>
                                    <div style={{ display: "flex", gap: "16px", marginBottom: "10px", paddingTop: "8px" }}>
                                        <span style={{ fontSize: "12px", color: "#4ADE80" }}>✔ {dispatched} delivered</span>
                                        {failed > 0 && <span style={{ fontSize: "12px", color: "#F87171" }}>✖ {failed} failed</span>}
                                        {pending > 0 && <span style={{ fontSize: "12px", color: "#FDE047" }}>⏳ {pending} queued</span>}
                                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>· {rows.length} total recipients</span>
                                    </div>
                                    {rows.filter((r: any) => r.status === "FAILED").slice(0, 5).map((r: any) => (
                                        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0", borderTop: "1px solid var(--border)" }}>
                                            <XCircle size={12} color="#F87171" />
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{r.subscriber_id}</span>
                                            <span style={{ fontSize: "11px", color: "#F87171" }}>{r.error_log || "Unknown error"}</span>
                                        </div>
                                    ))}
                                    {failed === 0 && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                                            <CheckCircle2 size={12} color="#4ADE80" />
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>All emails delivered successfully</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

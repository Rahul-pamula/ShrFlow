"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
    ArrowLeft, Mail, Eye, MousePointer, AlertTriangle,
    UserMinus, TrendingUp, Loader2, Users, CheckCircle2, XCircle
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

type Health = "green" | "yellow" | "red";

interface Stats {
    sent: number;
    failed: number;
    opens: number;
    unique_opens: number;
    clicks: number;
    unique_clicks: number;
    bounces: number;
    unsubscribes: number;
    open_rate: number;
    click_rate: number;
    click_to_open: number;
    bounce_rate: number;
    unsubscribe_rate: number;
}

interface Recipient {
    dispatch_id: string;
    contact_id: string;
    email: string;
    name: string;
    status: string;
    opened: boolean;
    clicked: boolean;
    bounced: boolean;
    unsubscribed: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const statusDot = (active: boolean, color: string) => (
    <span style={{
        display: "inline-block", width: 8, height: 8, borderRadius: "50%",
        background: active ? color : "rgba(113,113,122,0.3)",
        flexShrink: 0
    }} />
);

function StatCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
    return (
        <div style={{
            background: "rgba(24,24,27,0.6)", border: "1px solid rgba(63,63,70,0.35)",
            borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#71717A", fontSize: 13 }}>
                <span style={{ color }}>{icon}</span> {label}
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#FAFAFA", lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: 12, color: "#52525B" }}>{sub}</div>}
        </div>
    );
}

function RateBar({ label, value, health }: { label: string; value: number; health: Health }) {
    const colors: Record<Health, string> = { green: "#10B981", yellow: "#F59E0B", red: "#EF4444" };
    const color = colors[health];
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "#A1A1AA" }}>{label}</span>
                <span style={{ color, fontWeight: 700 }}>{value.toFixed(1)}%</span>
            </div>
            <div style={{ height: 6, background: "rgba(63,63,70,0.4)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                    height: "100%", borderRadius: 3, background: color,
                    width: `${Math.min(value * 5, 100)}%`,
                    transition: "width 0.6s ease"
                }} />
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CampaignAnalyticsPage() {
    const { id } = useParams();
    const { token } = useAuth();
    const [campaign, setCampaign] = useState<any>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [loading, setLoading] = useState(true);
    const [recipientFilter, setRecipientFilter] = useState<"all" | "opened" | "clicked" | "bounced">("all");

    useEffect(() => {
        if (!token || !id) return;
        const h = { Authorization: `Bearer ${token}` };
        Promise.all([
            fetch(`${API_BASE}/analytics/campaigns/${id}`, { headers: h }).then(r => r.json()),
            fetch(`${API_BASE}/analytics/campaigns/${id}/recipients`, { headers: h }).then(r => r.json()),
        ]).then(([analyticsData, recipData]) => {
            setCampaign(analyticsData.campaign);
            setStats(analyticsData.stats);
            setRecipients(recipData.recipients || []);
        }).finally(() => setLoading(false));
    }, [token, id]);

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <Loader2 size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
    );

    if (!stats) return null;

    const filtered = recipients.filter(r => {
        if (recipientFilter === "opened") return r.opened;
        if (recipientFilter === "clicked") return r.clicked;
        if (recipientFilter === "bounced") return r.bounced;
        return true;
    });

    const openHealth: Health = stats.open_rate > 20 ? "green" : stats.open_rate > 10 ? "yellow" : "red";
    const clickHealth: Health = stats.click_rate > 3 ? "green" : stats.click_rate > 1 ? "yellow" : "red";
    const bounceHealth: Health = stats.bounce_rate < 2 ? "green" : stats.bounce_rate < 5 ? "yellow" : "red";
    const unsubHealth: Health = stats.unsubscribe_rate < 0.5 ? "green" : stats.unsubscribe_rate < 1 ? "yellow" : "red";

    return (
        <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <Link href={`/campaigns/${id}`} style={{ color: "#A1A1AA", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <ArrowLeft size={14} /> Back to Campaign
                </Link>
            </div>

            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#FAFAFA", margin: 0 }}>
                    {campaign?.name || "Campaign Analytics"}
                </h1>
                <p style={{ fontSize: 13, color: "#71717A", margin: "6px 0 0" }}>
                    Subject: <em>{campaign?.subject}</em> · Status: <span style={{ color: "#A78BFA" }}>{campaign?.status}</span>
                </p>
            </div>

            {/* Stat Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                <StatCard icon={<Mail size={16} />} label="Sent" value={stats.sent.toLocaleString()} color="#6366F1" />
                <StatCard icon={<Eye size={16} />} label="Unique Opens" value={stats.unique_opens.toLocaleString()} sub={`${stats.open_rate}% open rate`} color="#10B981" />
                <StatCard icon={<MousePointer size={16} />} label="Unique Clicks" value={stats.unique_clicks.toLocaleString()} sub={`${stats.click_rate}% click rate`} color="#3B82F6" />
                <StatCard icon={<AlertTriangle size={16} />} label="Bounces" value={stats.bounces.toLocaleString()} sub={`${stats.bounce_rate}% bounce rate`} color="#EF4444" />
                <StatCard icon={<UserMinus size={16} />} label="Unsubscribes" value={stats.unsubscribes.toLocaleString()} sub={`${stats.unsubscribe_rate}% unsub rate`} color="#F59E0B" />
                <StatCard icon={<TrendingUp size={16} />} label="Click-to-Open" value={`${stats.click_to_open}%`} sub="of openers who clicked" color="#8B5CF6" />
            </div>

            {/* Rates Panel */}
            <div style={{
                background: "rgba(24,24,27,0.6)", border: "1px solid rgba(63,63,70,0.35)",
                borderRadius: 12, padding: "24px 28px", marginBottom: 32
            }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "#E4E4E7", margin: "0 0 20px" }}>Performance Rates</h2>
                <RateBar label="Open Rate" value={stats.open_rate} health={openHealth} />
                <RateBar label="Click Rate" value={stats.click_rate} health={clickHealth} />
                <RateBar label="Bounce Rate" value={stats.bounce_rate} health={bounceHealth} />
                <RateBar label="Unsubscribe Rate" value={stats.unsubscribe_rate} health={unsubHealth} />
            </div>

            {/* Recipient Table */}
            <div style={{
                background: "rgba(24,24,27,0.6)", border: "1px solid rgba(63,63,70,0.35)",
                borderRadius: 12, padding: "24px 28px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: "#E4E4E7", margin: 0 }}>
                        Recipients <span style={{ color: "#52525B", fontWeight: 400, fontSize: 13 }}>({filtered.length})</span>
                    </h2>
                    <div style={{ display: "flex", gap: 8 }}>
                        {(["all", "opened", "clicked", "bounced"] as const).map(f => (
                            <button key={f} onClick={() => setRecipientFilter(f)} style={{
                                padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                                background: recipientFilter === f ? "rgba(99,102,241,0.15)" : "transparent",
                                border: recipientFilter === f ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(63,63,70,0.3)",
                                color: recipientFilter === f ? "#818CF8" : "#71717A",
                            }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                        ))}
                    </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid rgba(63,63,70,0.3)" }}>
                                {["Contact", "Status", "Opened", "Clicked", "Bounced", "Unsubscribed"].map(h => (
                                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#52525B", fontWeight: 500 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: "32px 12px", textAlign: "center", color: "#52525B" }}>
                                        <Users size={24} style={{ margin: "0 auto 8px", display: "block" }} />
                                        No recipients match this filter.
                                    </td>
                                </tr>
                            ) : filtered.slice(0, 100).map(r => (
                                <tr key={r.dispatch_id} style={{ borderBottom: "1px solid rgba(63,63,70,0.15)" }}>
                                    <td style={{ padding: "10px 12px" }}>
                                        <div style={{ color: "#E4E4E7", fontWeight: 500 }}>{r.name || "—"}</div>
                                        <div style={{ color: "#71717A", fontSize: 12 }}>{r.email}</div>
                                    </td>
                                    <td style={{ padding: "10px 12px" }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                                            background: r.status === "DISPATCHED" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                                            color: r.status === "DISPATCHED" ? "#10B981" : "#EF4444",
                                        }}>{r.status}</span>
                                    </td>
                                    <td style={{ padding: "10px 12px" }}>{statusDot(r.opened, "#10B981")}</td>
                                    <td style={{ padding: "10px 12px" }}>{statusDot(r.clicked, "#3B82F6")}</td>
                                    <td style={{ padding: "10px 12px" }}>{statusDot(r.bounced, "#EF4444")}</td>
                                    <td style={{ padding: "10px 12px" }}>{statusDot(r.unsubscribed, "#F59E0B")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length > 100 && (
                        <p style={{ textAlign: "center", color: "#52525B", fontSize: 12, marginTop: 12 }}>
                            Showing first 100 of {filtered.length} recipients. Export CSV for full list.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Stats = {
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
};

type Recipient = {
  dispatch_id: string;
  contact_id: string;
  email: string;
  name: string;
  status: string;
  opened: boolean;
  clicked: boolean;
  bounced: boolean;
  unsubscribed: boolean;
};

export default function CampaignAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [stats, setStats] = useState<Stats | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      setLoading(true);
      try {
        const [sRes, rRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/campaigns/${id}`, { headers }),
          fetch(`${API_BASE}/analytics/campaigns/${id}/recipients`, { headers }),
        ]);
        if (!sRes.ok) throw new Error((await sRes.json()).detail || "Failed to load stats");
        if (!rRes.ok) throw new Error((await rRes.json()).detail || "Failed to load recipients");
        const sJson = await sRes.json();
        const rJson = await rRes.json();
        setStats(sJson.stats);
        setRecipients(rJson.recipients || []);
        setError("");
      } catch (e: any) {
        setError(e.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, id, API_BASE]);

  const statCards = stats
    ? [
        { label: "Sent", value: stats.sent },
        { label: "Opens (unique)", value: stats.unique_opens, sub: `${stats.open_rate}%` },
        { label: "Clicks (unique)", value: stats.unique_clicks, sub: `${stats.click_rate}%` },
        { label: "Bounce rate", value: `${stats.bounce_rate}%` },
        { label: "Unsubscribes", value: stats.unsubscribes },
      ]
    : [];

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      <button
        onClick={() => router.back()}
        style={{ color: "#8B5CF6", fontSize: "13px", marginBottom: "14px" }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#FAFAFA", marginBottom: "16px" }}>
        Campaign Analytics
      </h1>

      {error && (
        <div style={{ padding: "12px 14px", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#F87171", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: "#A1A1AA" }}>Loading analytics…</p>}

      {!loading && stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {statCards.map((s) => (
              <div key={s.label} style={{ padding: "14px", border: "1px solid rgba(63,63,70,0.35)", borderRadius: "10px", background: "rgba(24,24,27,0.5)" }}>
                <div style={{ fontSize: "12px", color: "#A1A1AA", marginBottom: "6px" }}>{s.label}</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#FAFAFA" }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: "12px", color: "#8B5CF6" }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ marginTop: "6px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#E4E4E7", marginBottom: "10px" }}>
              Recipient Activity
            </h2>
            <div style={{ overflowX: "auto", border: "1px solid rgba(63,63,70,0.35)", borderRadius: "10px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "rgba(24,24,27,0.6)", color: "#A1A1AA" }}>
                    <th style={{ textAlign: "left", padding: "10px" }}>Email</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Name</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Status</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Opened</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Clicked</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Bounced</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Unsubscribed</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r) => (
                    <tr key={r.dispatch_id} style={{ borderTop: "1px solid rgba(63,63,70,0.25)" }}>
                      <td style={{ padding: "10px", color: "#E4E4E7" }}>{r.email}</td>
                      <td style={{ padding: "10px", color: "#A1A1AA" }}>{r.name || "—"}</td>
                      <td style={{ padding: "10px", color: "#A1A1AA", textTransform: "lowercase" }}>{r.status}</td>
                      <td style={{ padding: "10px", color: r.opened ? "#22C55E" : "#71717A" }}>{r.opened ? "Yes" : "No"}</td>
                      <td style={{ padding: "10px", color: r.clicked ? "#22C55E" : "#71717A" }}>{r.clicked ? "Yes" : "No"}</td>
                      <td style={{ padding: "10px", color: r.bounced ? "#F87171" : "#71717A" }}>{r.bounced ? "Yes" : "No"}</td>
                      <td style={{ padding: "10px", color: r.unsubscribed ? "#F59E0B" : "#71717A" }}>{r.unsubscribed ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                  {recipients.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "12px", textAlign: "center", color: "#71717A" }}>No recipient activity yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

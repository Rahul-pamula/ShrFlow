"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import { InlineAlert, PageHeader, SectionCard, StatCard } from "@/components/ui";

type Stats = {
  sent: number;
  failed: number;
  opens: number;
  unique_opens: number;
  bounces: number;
  unsubscribes: number;
  open_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  view?: string;
};

type Recipient = {
  dispatch_id: string;
  contact_id: string;
  email: string;
  name: string;
  status: string;
  opened: boolean;
  bounced: boolean;
  unsubscribed: boolean;
  sources?: string[];
};

export default function CampaignAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [stats, setStats] = useState<Stats | null>(null);
  const [sources, setSources] = useState<Record<string, number>>({});
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
        setSources(sJson.sources || {});
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
      { title: "Sent", value: stats.sent.toLocaleString(), change: `${stats.failed} failed`, changeType: stats.failed > 0 ? "negative" as const : "neutral" as const },
      { title: "Unique opens", value: stats.unique_opens.toLocaleString(), change: `${stats.open_rate}% rate`, changeType: "positive" as const },
      { title: "Total opens", value: stats.opens.toLocaleString(), change: stats.view || "Campaign view", changeType: "neutral" as const },
      { title: "Bounce rate", value: `${stats.bounce_rate}%`, change: `${stats.bounces} bounces`, changeType: stats.bounces > 0 ? "negative" as const : "neutral" as const },
      { title: "Unsubscribes", value: stats.unsubscribes.toLocaleString(), change: `${stats.unsubscribe_rate}% rate`, changeType: stats.unsubscribes > 0 ? "negative" as const : "neutral" as const },
    ]
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6">
      <PageHeader
        title="Campaign analytics"
        subtitle="Monitor delivery, engagement, and recipient-level signals for this campaign."
        action={(
          <button
            onClick={() => router.back()}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
          >
            Back
          </button>
        )}
      />

      {error && (
        <InlineAlert
          variant="danger"
          title="Analytics couldn’t be loaded"
          description={error}
        />
      )}

      {loading && (
        <SectionCard>
          <p className="text-sm text-[var(--text-muted)]">Loading analytics…</p>
        </SectionCard>
      )}

      {!loading && stats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {statCards.map((stat) => (
              <StatCard
                key={stat.title}
                label={stat.title}
                value={stat.value}
                trend={stat.changeType === "positive" ? 1 : stat.changeType === "negative" ? -1 : 0}
                trendLabel={stat.change}
              />
            ))}
          </div>

          <SectionCard
            title="Proxy and scanner signals"
            description="Signals detected during campaign activity, grouped by source type."
          >
            <div className="flex flex-wrap gap-3">
              {Object.keys(sources).length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No signal data yet.</p>
              ) : (
                Object.entries(sources).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]"
                  >
                    <span className="mr-2 text-[var(--text-muted)]">{key.replace("_", " ")}</span>
                    <strong>{value}</strong>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Recipient activity"
            description="Recipient-level outcomes and engagement signals for the current campaign."
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-[var(--bg-hover)] text-left text-[var(--text-muted)]">
                    {["Email", "Name", "Status", "Opened", "Bounced", "Unsubscribed", "Signals"].map((label) => (
                      <th key={label} className="border-b border-[var(--border)] px-4 py-3 font-medium">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recipients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">
                        No recipient activity yet.
                      </td>
                    </tr>
                  ) : (
                    recipients.map((recipient) => (
                      <tr key={recipient.dispatch_id} className="border-t border-[var(--border)]">
                        <td className="border-b border-[var(--border)] px-4 py-3 text-[var(--text-primary)]">{recipient.email}</td>
                        <td className="border-b border-[var(--border)] px-4 py-3 text-[var(--text-muted)]">{recipient.name || "—"}</td>
                        <td className="border-b border-[var(--border)] px-4 py-3 capitalize text-[var(--text-muted)]">{recipient.status}</td>
                        <td className={`border-b border-[var(--border)] px-4 py-3 ${recipient.opened ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                          {recipient.opened ? "Yes" : "No"}
                        </td>
                        <td className={`border-b border-[var(--border)] px-4 py-3 ${recipient.bounced ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
                          {recipient.bounced ? "Yes" : "No"}
                        </td>
                        <td className={`border-b border-[var(--border)] px-4 py-3 ${recipient.unsubscribed ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'}`}>
                          {recipient.unsubscribed ? "Yes" : "No"}
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-3 text-[var(--text-muted)]">
                          {(recipient.sources || ["—"]).join(", ")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

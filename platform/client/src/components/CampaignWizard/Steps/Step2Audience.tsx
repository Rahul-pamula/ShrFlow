"use client";

import { useState, useEffect } from "react";
import { Check, Users, Loader2, AlertCircle, FileSpreadsheet, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button, InlineAlert, SectionCard } from "@/components/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function AudienceCard({
    id,
    name,
    count,
    subtitle,
    icon,
    isSelected,
    onSelect,
}: {
    id: string;
    name: string;
    count: number;
    subtitle: string;
    icon: React.ReactNode;
    isSelected: boolean;
    onSelect: (id: string, name: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(id, name)}
            className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius-lg)] border p-4 text-left transition ${
                isSelected
                    ? "border-[var(--accent-border)] bg-[var(--accent)]/8"
                    : "border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-hover)]"
            }`}
        >
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius)] ${
                        isSelected ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                    }`}
                >
                    {icon}
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{name}</h3>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                        <span className={`font-semibold ${isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}>
                            {count.toLocaleString()}
                        </span>{" "}
                        {subtitle}
                    </p>
                </div>
            </div>
            <div className="flex-shrink-0">
                {isSelected ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                        <Check className="h-3.5 w-3.5" />
                    </div>
                ) : (
                    <div className="h-6 w-6 rounded-full border border-[var(--border)]" />
                )}
            </div>
        </button>
    );
}

export default function Step2Audience({ data, updateData, onNext, onBack }: any) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [totalContacts, setTotalContacts] = useState(0);
    const [batches, setBatches] = useState<any[]>([]);
    const [lists, setLists] = useState<any[]>([]);
    const [batchDomains, setBatchDomains] = useState<any[]>([]);
    const [domainsLoading, setDomainsLoading] = useState(false);
    const [error, setError] = useState("");

    const selectedBatchId =
        typeof data.listId === "string" && data.listId.startsWith("batch:")
            ? data.listId.replace("batch:", "")
            : typeof data.listId === "string" && data.listId.startsWith("batch_domain:")
                ? data.listId.split(":")[1]
                : typeof data.listId === "string" && data.listId.startsWith("batch_domains:")
                    ? data.listId.split(":")[1]
                    : "";

    const selectedBatchDomains =
        typeof data.listId === "string" && data.listId.startsWith("batch_domains:")
            ? data.listId.split(":")[2]?.split(",").filter(Boolean) || []
            : typeof data.listId === "string" && data.listId.startsWith("batch_domain:")
                ? [data.listId.split(":")[2]].filter(Boolean)
                : [];

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const [statsRes, batchRes, listsRes] = await Promise.all([
                    fetch(`${API_BASE}/contacts/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE}/contacts/batches`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE}/lists`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                if (!statsRes.ok || !batchRes.ok) throw new Error("Failed to fetch audience data");

                const stats = await statsRes.json();
                const batchData = await batchRes.json();
                const listsData = listsRes.ok ? await listsRes.json() : { lists: [] };

                setTotalContacts(stats.total_contacts || 0);
                setBatches((batchData.data || []).filter((b: any) => b.status === "completed" && b.imported_count > 0));
                setLists(listsData.lists || []);
            } catch {
                setError("Could not load audience data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    useEffect(() => {
        const fetchBatchDomains = async () => {
            if (!token || !selectedBatchId) {
                setBatchDomains([]);
                return;
            }
            setDomainsLoading(true);
            try {
                const params = new URLSearchParams({ batch_id: selectedBatchId, limit: "20" });
                const res = await fetch(`${API_BASE}/contacts/domains?${params}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const payload = res.ok ? await res.json() : { data: [] };
                setBatchDomains(payload.data || []);
            } catch {
                setBatchDomains([]);
            } finally {
                setDomainsLoading(false);
            }
        };
        fetchBatchDomains();
    }, [token, selectedBatchId]);

    const select = (id: string, name: string) => {
        updateData({ listId: id, listName: name });
    };

    const toggleBatchDomain = (domain: string) => {
        const batch = batches.find((b: any) => b.id === selectedBatchId);
        if (!batch) return;

        const nextDomains = selectedBatchDomains.includes(domain)
            ? selectedBatchDomains.filter((value: string) => value !== domain)
            : [...selectedBatchDomains, domain];

        if (nextDomains.length === 0) {
            select(`batch:${batch.id}`, batch.file_name.replace(/\.[^.]+$/, ""));
            return;
        }

        select(
            `batch_domains:${selectedBatchId}:${nextDomains.join(",")}`,
            `${batch.file_name.replace(/\.[^.]+$/, "")} - ${nextDomains.length} domain${nextDomains.length > 1 ? "s" : ""}`
        );
    };

    const canContinue = !!data.listId && totalContacts > 0;

    return (
        <div className="p-9">
            <div className="mb-7 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent-glow)]">
                    <Users className="h-[18px] w-[18px] text-[var(--accent)]" />
                </div>
                <div>
                    <h2 className="m-0 text-lg font-semibold text-[var(--text-primary)]">Select Audience</h2>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Choose who receives this campaign.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-7 w-7 animate-spin text-[var(--accent)]" />
                </div>
            ) : error ? (
                <InlineAlert
                    variant="danger"
                    description={error}
                    icon={<AlertCircle className="h-4 w-4" />}
                />
            ) : totalContacts === 0 ? (
                <SectionCard>
                    <div className="py-8 text-center">
                        <Users className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
                        <p className="text-sm text-[var(--text-muted)]">No contacts in your account yet.</p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            Go to <strong className="text-[var(--text-muted)]">Contacts</strong> and upload a CSV first.
                        </p>
                    </div>
                </SectionCard>
            ) : (
                <div className="space-y-6">
                    <div className="max-h-[420px] space-y-5 overflow-y-auto pr-1">
                        <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Entire List</p>
                            <AudienceCard
                                id="all"
                                name="All Contacts"
                                count={totalContacts}
                                subtitle="subscribers in your account"
                                icon={<Globe className="h-[18px] w-[18px]" />}
                                isSelected={data.listId === "all"}
                                onSelect={select}
                            />
                        </div>

                        {lists.length > 0 && (
                            <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Your Lists</p>
                                <div className="space-y-2">
                                    {lists.map((list: any) => (
                                        <AudienceCard
                                            key={list.id}
                                            id={list.id}
                                            name={list.name}
                                            count={list.subscriber_count ?? 0}
                                            subtitle="contacts in this list"
                                            icon={<Users className="h-[18px] w-[18px]" />}
                                            isSelected={data.listId === list.id}
                                            onSelect={select}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {batches.length > 0 && (
                            <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Import Batches</p>
                                <div className="space-y-2">
                                    {batches.map((batch) => (
                                        <AudienceCard
                                            key={batch.id}
                                            id={`batch:${batch.id}`}
                                            name={batch.file_name.replace(/\.[^.]+$/, "")}
                                            count={batch.imported_count}
                                            subtitle={`contacts · Imported ${new Date(batch.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                                            icon={<FileSpreadsheet className="h-[18px] w-[18px]" />}
                                            isSelected={data.listId === `batch:${batch.id}` || data.listId?.startsWith(`batch_domain:${batch.id}:`) || data.listId?.startsWith(`batch_domains:${batch.id}:`)}
                                            onSelect={select}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedBatchId && (
                        <SectionCard
                            title="Optional domain filter"
                            description="Narrow the selected batch to one or more domains without changing the overall audience flow."
                        >
                            {domainsLoading ? (
                                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading batch domains...
                                </div>
                            ) : batchDomains.length === 0 ? (
                                <p className="text-sm text-[var(--text-muted)]">No domain breakdown available for this batch yet.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const batch = batches.find((b: any) => b.id === selectedBatchId);
                                            if (batch) select(`batch:${batch.id}`, batch.file_name.replace(/\.[^.]+$/, ""));
                                        }}
                                        className={`rounded-full px-3 py-2 text-xs transition ${
                                            data.listId === `batch:${selectedBatchId}`
                                                ? "border border-[var(--accent-border)] bg-[var(--accent)]/12 text-[var(--text-primary)]"
                                                : "border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                                        }`}
                                    >
                                        Entire batch
                                    </button>
                                    {batchDomains.map((entry: any) => (
                                        <button
                                            key={entry.domain}
                                            type="button"
                                            onClick={() => toggleBatchDomain(entry.domain)}
                                            className={`rounded-full px-3 py-2 text-xs transition ${
                                                selectedBatchDomains.includes(entry.domain)
                                                    ? "border border-[var(--accent-border)] bg-[var(--accent)]/12 text-[var(--text-primary)]"
                                                    : "border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                                            }`}
                                        >
                                            {entry.domain} ({entry.count})
                                        </button>
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    )}
                </div>
            )}

            <div className="mt-8 flex justify-between border-t border-[var(--border)] pt-6">
                <Button onClick={onBack} variant="ghost">
                    ← Back
                </Button>
                <Button onClick={onNext} disabled={!canContinue}>
                    Next Step →
                </Button>
            </div>
        </div>
    );
}

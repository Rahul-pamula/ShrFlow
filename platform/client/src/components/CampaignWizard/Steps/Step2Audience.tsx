"use client";

import { useState, useEffect } from "react";
import { Check, Users, Loader2, AlertCircle, FileSpreadsheet, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Step2Audience({ data, updateData, onNext, onBack }: any) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [totalContacts, setTotalContacts] = useState(0);
    const [batches, setBatches] = useState<any[]>([]);
    const [lists, setLists] = useState<any[]>([]);
    const [batchDomains, setBatchDomains] = useState<any[]>([]);
    const [domainsLoading, setDomainsLoading] = useState(false);
    const [error, setError] = useState("");

    const selectedBatchId = typeof data.listId === "string" && data.listId.startsWith("batch:")
        ? data.listId.replace("batch:", "")
        : (typeof data.listId === "string" && data.listId.startsWith("batch_domain:")
            ? data.listId.split(":")[1]
            : (typeof data.listId === "string" && data.listId.startsWith("batch_domains:")
                ? data.listId.split(":")[1]
                : ""));

    const selectedBatchDomains = typeof data.listId === "string" && data.listId.startsWith("batch_domains:")
        ? data.listId.split(":")[2]?.split(",").filter(Boolean) || []
        : (typeof data.listId === "string" && data.listId.startsWith("batch_domain:")
            ? [data.listId.split(":")[2]].filter(Boolean)
            : []);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const [statsRes, batchRes, listsRes] = await Promise.all([
                    fetch(`${API_BASE}/contacts/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE}/contacts/batches`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE}/lists`, { headers: { 'Authorization': `Bearer ${token}` } }),
                ]);
                if (!statsRes.ok || !batchRes.ok) throw new Error("Failed to fetch audience data");

                const stats = await statsRes.json();
                const batchData = await batchRes.json();
                const listsData = listsRes.ok ? await listsRes.json() : { lists: [] };

                setTotalContacts(stats.total_contacts || 0);
                setBatches((batchData.data || []).filter((b: any) => b.status === 'completed' && b.imported_count > 0));
                setLists(listsData.lists || []);
            } catch (err) {
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
                const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const params = new URLSearchParams({ batch_id: selectedBatchId, limit: "20" });
                const res = await fetch(`${API_BASE}/contacts/domains?${params}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
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

    const AudienceCard = ({ id, name, count, subtitle, icon }: any) => {
        const isSelected = data.listId === id;
        return (
            <div
                onClick={() => select(id, name)}
                style={{
                    padding: '18px 20px', borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.5)' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(59, 130, 246, 0.07)' : 'var(--bg-primary)',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {icon}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{name}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                            <span style={{ color: isSelected ? '#60A5FA' : '#A1A1AA', fontWeight: 600 }}>
                                {count.toLocaleString()}
                            </span>
                            {' '}{subtitle}
                        </p>
                    </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                    {isSelected ? (
                        <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Check size={13} color="white" />
                        </div>
                    ) : (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(63,63,70,0.4)' }} />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '36px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Users size={18} color="#3B82F6" />
                </div>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Select Audience</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Choose who receives this campaign — all contacts or a specific import batch</p>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                    <Loader2 size={28} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : error ? (
                <div style={{ padding: '14px 16px', background: 'rgba(69, 10, 10, 0.3)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontSize: '13px' }}>
                    <AlertCircle size={15} /> {error}
                </div>
            ) : totalContacts === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--border)', borderRadius: '10px' }}>
                    <Users size={32} color="#52525B" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>No contacts in your account yet.</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Go to <strong style={{ color: 'var(--text-muted)' }}>Contacts</strong> → Upload CSV first.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>

                    {/* === ALL CONTACTS === */}
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Entire List</p>
                    <AudienceCard
                        id="all"
                        name="All Contacts"
                        count={totalContacts}
                        subtitle="subscribers in your account"
                        icon={<Globe size={18} color={data.listId === 'all' ? '#3B82F6' : 'var(--text-muted)'} />}
                    />

                    {/* === LISTS === */}
                    {lists.length > 0 && (
                        <>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 4px' }}>Your Lists</p>
                            {lists.map((list: any) => (
                                <AudienceCard
                                    key={list.id}
                                    id={list.id}
                                    name={list.name}
                                    count={list.subscriber_count ?? 0}
                                    subtitle="contacts in this list"
                                    icon={<Users size={18} color={data.listId === list.id ? '#3B82F6' : 'var(--text-muted)'} />}
                                />
                            ))}
                        </>
                    )}

                    {/* === IMPORT BATCHES === */}
                    {batches.length > 0 && (
                        <>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 4px' }}>Import Batches</p>
                            {batches.map(batch => (
                                <AudienceCard
                                    key={batch.id}
                                    id={`batch:${batch.id}`}
                                    name={batch.file_name.replace(/\.[^.]+$/, '')}
                                    count={batch.imported_count}
                                    subtitle={`contacts · Imported ${new Date(batch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                    icon={<FileSpreadsheet size={18} color={(data.listId === `batch:${batch.id}` || data.listId?.startsWith(`batch_domain:${batch.id}:`)) ? '#3B82F6' : 'var(--text-muted)'} />}
                                />
                            ))}
                        </>
                    )}

                    {selectedBatchId && (
                        <div style={{
                            marginTop: '12px',
                            padding: '14px',
                            borderRadius: '10px',
                            border: '1px solid rgba(63, 63, 70, 0.35)',
                            background: 'var(--bg-primary)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <Globe size={16} color="#60A5FA" />
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Optional domain filter inside this batch</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Narrow the selected batch to one domain without changing the overall audience flow.</p>
                                </div>
                            </div>
                            {domainsLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                    <Loader2 size={14} className="animate-spin" /> Loading batch domains...
                                </div>
                            ) : batchDomains.length === 0 ? (
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>No domain breakdown available for this batch yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    <button
                                        onClick={() => {
                                            const batch = batches.find((b: any) => b.id === selectedBatchId);
                                            if (batch) select(`batch:${batch.id}`, batch.file_name.replace(/\.[^.]+$/, ''));
                                        }}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: '999px',
                                            border: `1px solid ${data.listId === `batch:${selectedBatchId}` ? 'rgba(59,130,246,0.45)' : 'rgba(63,63,70,0.35)'}`,
                                            background: data.listId === `batch:${selectedBatchId}` ? 'rgba(59,130,246,0.12)' : 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Entire batch
                                    </button>
                                    {batchDomains.map((entry: any) => (
                                        <button
                                            key={entry.domain}
                                            onClick={() => toggleBatchDomain(entry.domain)}
                                            style={{
                                                padding: '8px 10px',
                                                borderRadius: '999px',
                                                border: `1px solid ${selectedBatchDomains.includes(entry.domain) ? 'rgba(59,130,246,0.45)' : 'rgba(63,63,70,0.35)'}`,
                                                background: selectedBatchDomains.includes(entry.domain) ? 'rgba(59,130,246,0.12)' : 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {entry.domain} ({entry.count})
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer', padding: '8px 4px' }}>
                    ← Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!data.listId || totalContacts === 0}
                    className={data.listId && totalContacts > 0 ? 'btn-premium' : ''}
                    style={(!data.listId || totalContacts === 0) ? { padding: '10px 20px', background: 'var(--bg-hover)', border: '1px solid rgba(63,63,70,0.4)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'not-allowed' } : {}}
                >
                    Next Step →
                </button>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Play,
    Pause,
    MoreHorizontal,
    Plus,
    Search,
    Filter,
    Loader2,
    AlertCircle,
    PlayCircle,
    StopCircle,
    Send,
    Megaphone,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/* ============================================================
   CAMPAIGNS - Dark Glassmorphism Theme (matching app design)
   ============================================================ */

function StatusBadge({ status }: { status: string }) {
    const getStyle = (s: string) => {
        switch (s) {
            case 'sent': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: 'rgba(16, 185, 129, 0.25)' };
            case 'sending':
            case 'processing': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.25)' };
            case 'scheduled': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.25)' };
            case 'paused': return { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.25)' };
            case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.25)' };
            default: return { bg: 'rgba(63, 63, 70, 0.3)', text: '#71717A', border: 'rgba(63, 63, 70, 0.4)' };
        }
    };
    const { bg, text, border } = getStyle(status);
    const isPulsing = status === 'sending' || status === 'processing';

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: 500,
            backgroundColor: bg, color: text, border: `1px solid ${border}`,
        }}>
            {isPulsing && (
                <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    backgroundColor: text, animation: 'pulse 2s infinite',
                }} />
            )}
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

export default function CampaignsPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<any[]>([]);

    // Pagination states
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);

    // Browser local multi-draft state
    const [localDrafts, setLocalDrafts] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const fetchCampaigns = async (isBackground = false) => {
        if (!token) return;
        try {
            const params = new URLSearchParams({ page: String(page), limit: '15' });
            const res = await fetch(`${API_BASE}/campaigns/?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch campaigns");
            const json = await res.json();
            setCampaigns(json.campaigns || []);
            setTotal(json.meta?.total || 0);
            setTotalPages(json.meta?.total_pages || 0);
            setError(""); // Clear error if recovered
        } catch (err) {
            if (!isBackground) setError("Failed to load campaigns.");
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        // Load browser local multi-drafts
        try {
            const raw = localStorage.getItem('campaign_local_sessions');
            if (raw) {
                const sessions = JSON.parse(raw);
                const drafts = [];
                for (const [id, session] of Object.entries(sessions)) {
                    if (session && (session as any).data && ((session as any).data.name || (session as any).data.subject)) {
                        drafts.push({ id, ...(session as any).data, updatedAt: (session as any).updatedAt });
                    }
                }
                // Sort by updatedAt descending
                drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                setLocalDrafts(drafts);
            }
        } catch { }

        fetchCampaigns(false);

        // Auto-refresh the campaigns list every 5 seconds 
        // so the "Sending" status updates to "Sent" automatically
        const interval = setInterval(() => {
            fetchCampaigns(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [token, page]); // Re-fetch when page changes

    const filtered = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    const handleCreateNew = () => {
        const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        router.push(`/campaigns/new?draft_id=${newId}`);
    };

    const handleAction = async (id: string, action: 'pause' | 'resume' | 'cancel' | 'delete') => {
        try {
            const isDelete = action === 'delete';
            const url = isDelete
                ? `${API_BASE}/campaigns/${id}`
                : `${API_BASE}/campaigns/${id}/${action}`;

            const res = await fetch(url, {
                method: isDelete ? 'DELETE' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Failed to ${action} campaign`);

            if (isDelete) {
                // Remove from list regardless of whether it was permanently deleted or just archived
                setCampaigns(prev => prev.filter(c => c.id !== id));
            } else {
                setCampaigns(prev => prev.map(c => {
                    if (c.id === id) {
                        let newStatus = c.status;
                        if (action === 'pause') newStatus = 'paused';
                        if (action === 'resume') newStatus = 'processing';
                        if (action === 'cancel') newStatus = 'cancelled';
                        return { ...c, status: newStatus };
                    }
                    return c;
                }));
            }
        } catch (err) {
            alert(`Error: Could not ${action} campaign.`);
        }
    };

    return (
        <>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                        Campaigns
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        Create and manage your email campaigns
                    </p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="btn-premium"
                    style={{ textDecoration: 'none', fontSize: '13px', cursor: 'pointer', border: 'none' }}
                >
                    <Plus size={15} />
                    Create Campaign
                </button>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={14} style={{
                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '9px 12px 9px 34px',
                            background: 'var(--bg-input)', border: '1px solid var(--border)',
                            borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
                        }}
                    />
                </div>
                <button style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px',
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
                }}>
                    <Filter size={14} />
                    Filter
                </button>
            </div>

            {/* ERROR STATE */}
            {error && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '13px' }}>
                    <AlertCircle size={15} /> {error}
                </div>
            )}

            {/* LOADING STATE */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Loader2 size={28} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !error && filtered.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '64px 24px',
                    background: 'var(--bg-card)', border: '1px dashed var(--border)',
                    borderRadius: '12px'
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 16px',
                        background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Megaphone size={24} color="#3B82F6" />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        No campaigns yet
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        Create your first campaign and start sending emails.
                    </p>
                    <button
                        onClick={handleCreateNew}
                        className="btn-premium"
                        style={{ textDecoration: 'none', fontSize: '13px', display: 'inline-flex', cursor: 'pointer', border: 'none' }}
                    >
                        <Plus size={14} /> Create Campaign
                    </button>
                </div>
            )}

            {/* DATA TABLE */}
            {!loading && filtered.length > 0 && (
                <div style={{
                    background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
                    border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {['Campaign', 'Status', 'Contacts', 'Created', 'Actions'].map((h, i) => (
                                    <th key={h} style={{
                                        padding: '12px 20px', fontSize: '11px', fontWeight: 500,
                                        textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)',
                                        textAlign: i >= 2 && i < 4 ? 'right' : i === 4 ? 'right' : 'left',
                                        background: 'var(--bg-hover)'
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {localDrafts.map(draft => (
                                <tr
                                    key={`localdraft-${draft.id}`}
                                    style={{
                                        borderBottom: '1px solid var(--border)',
                                        transition: 'background 0.15s ease',
                                        background: 'rgba(59, 130, 246, 0.04)'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.04)')}
                                >
                                    <td style={{ padding: '16px 20px' }}>
                                        <Link href={`/campaigns/new?action=resume&draft_id=${draft.id}`} style={{ textDecoration: 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#60A5FA', margin: 0 }}>
                                                    {draft.name || 'Untitled Session'}
                                                </p>
                                                <span style={{ fontSize: '10px', fontWeight: 600, background: 'rgba(59,130,246,0.1)', color: '#60A5FA', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.2)', textTransform: 'uppercase' }}>Unsaved Browser Session</span>
                                            </div>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{draft.subject || '—'}</p>
                                        </Link>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <StatusBadge status="draft" />
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right' }}>
                                        —
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right' }}>
                                        Just now
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                                            <Link href={`/campaigns/new?action=resume&draft_id=${draft.id}`} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', color: '#60A5FA', fontSize: '12px', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                                                Resume
                                            </Link>
                                            <button onClick={() => {
                                                if (window.confirm('Discard this unsaved browser session?')) {
                                                    try {
                                                        const raw = localStorage.getItem('campaign_local_sessions');
                                                        if (raw) {
                                                            const sessions = JSON.parse(raw);
                                                            delete sessions[draft.id];
                                                            localStorage.setItem('campaign_local_sessions', JSON.stringify(sessions));
                                                            setLocalDrafts(prev => prev.filter(d => d.id !== draft.id));
                                                        }
                                                    } catch { }
                                                }
                                            }} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#EF4444', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                                                Discard
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.map((c, idx) => (
                                <tr
                                    key={c.id}
                                    style={{
                                        borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                                        transition: 'background 0.15s ease',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    {/* Name + Subject */}
                                    <td style={{ padding: '16px 20px' }}>
                                        <Link href={`/campaigns/${c.id}`} style={{ textDecoration: 'none' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{c.name}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{c.subject}</p>
                                        </Link>
                                    </td>

                                    {/* Status */}
                                    <td style={{ padding: '16px 20px' }}>
                                        <StatusBadge status={c.status} />
                                    </td>

                                    {/* Count */}
                                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                        {c.stats?.[0]?.count ? c.stats[0].count.toLocaleString() : '—'}
                                    </td>

                                    {/* Date */}
                                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right' }}>
                                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>

                                    {/* Actions */}
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                                            {c.status === 'paused' && (
                                                <button onClick={() => handleAction(c.id, 'resume')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', color: '#10B981', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                                                    <PlayCircle size={12} /> Resume
                                                </button>
                                            )}
                                            {(c.status === 'sending' || c.status === 'processing') && (
                                                <button onClick={() => handleAction(c.id, 'pause')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px', color: '#F59E0B', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                                                    <Pause size={12} /> Pause
                                                </button>
                                            )}
                                            {['sending', 'processing', 'paused', 'scheduled'].includes(c.status) && (
                                                <button onClick={() => window.confirm('Cancel this campaign?') && handleAction(c.id, 'cancel')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#EF4444', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                                                    <StopCircle size={12} /> Cancel
                                                </button>
                                            )}
                                            {(c.status === 'draft' || c.status === 'paused') && (
                                                <Link href={`/campaigns/new?edit=${c.id}`} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '6px', color: '#A1A1AA', fontSize: '12px', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                                                    Edit
                                                </Link>
                                            )}
                                            {c.status === 'draft' ? (
                                                <button onClick={() => window.confirm('Permanently delete this draft?') && handleAction(c.id, 'delete')} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#EF4444', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                                                    Delete
                                                </button>
                                            ) : (
                                                <button onClick={() => window.confirm('Archive this campaign? It will be removed from this list but analytics will be saved.') && handleAction(c.id, 'delete')} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '6px', color: '#A1A1AA', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                                                    Archive
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                            <span style={{ fontSize: "13px", color: 'var(--text-muted)' }}>
                                Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total} campaigns
                            </span>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                    style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 500, color: 'var(--text-primary)', backgroundColor: "transparent", border: `1px solid var(--border)`, borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: page <= 1 ? 0.4 : 1 }}>
                                    <ChevronLeft size={14} /> Prev
                                </button>
                                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                                    style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 500, color: 'var(--text-primary)', backgroundColor: "transparent", border: `1px solid var(--border)`, borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: page >= totalPages ? 0.4 : 1 }}>
                                    Next <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

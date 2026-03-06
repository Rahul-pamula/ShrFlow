"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    Megaphone
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchCampaigns = async () => {
            if (!token) return;
            try {
                const res = await fetch('http://127.0.0.1:8000/campaigns/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch campaigns");
                const json = await res.json();
                setCampaigns(json.campaigns || []);
            } catch (err) {
                setError("Failed to load campaigns.");
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, [token]);

    const filtered = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    const handleAction = async (id: string, action: 'pause' | 'resume' | 'cancel' | 'delete') => {
        try {
            const isDelete = action === 'delete';
            const url = isDelete
                ? `http://127.0.0.1:8000/campaigns/${id}`
                : `http://127.0.0.1:8000/campaigns/${id}/${action}`;

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
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FAFAFA', margin: 0, letterSpacing: '-0.02em' }}>
                        Campaigns
                    </h1>
                    <p style={{ fontSize: '13px', color: '#71717A', margin: '4px 0 0' }}>
                        Create and manage your email campaigns
                    </p>
                </div>
                <Link
                    href="/campaigns/new"
                    className="btn-premium"
                    style={{ textDecoration: 'none', fontSize: '13px' }}
                >
                    <Plus size={15} />
                    Create Campaign
                </Link>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={14} style={{
                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                        color: '#52525B'
                    }} />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '9px 12px 9px 34px',
                            background: 'rgba(9, 9, 11, 0.8)', border: '1px solid rgba(63, 63, 70, 0.4)',
                            borderRadius: '8px', fontSize: '13px', color: '#FAFAFA', outline: 'none',
                        }}
                    />
                </div>
                <button style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px',
                    background: 'rgba(9, 9, 11, 0.8)', border: '1px solid rgba(63, 63, 70, 0.4)',
                    borderRadius: '8px', color: '#A1A1AA', fontSize: '13px', cursor: 'pointer',
                }}>
                    <Filter size={14} />
                    Filter
                </button>
            </div>

            {/* ERROR STATE */}
            {error && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(69, 10, 10, 0.3)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontSize: '13px' }}>
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
                    background: 'rgba(24, 24, 27, 0.4)', border: '1px dashed rgba(63, 63, 70, 0.4)',
                    borderRadius: '12px'
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 16px',
                        background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Megaphone size={24} color="#3B82F6" />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#E4E4E7', marginBottom: '8px' }}>
                        No campaigns yet
                    </h3>
                    <p style={{ fontSize: '13px', color: '#71717A', marginBottom: '20px' }}>
                        Create your first campaign and start sending emails.
                    </p>
                    <Link
                        href="/campaigns/new"
                        className="btn-premium"
                        style={{ textDecoration: 'none', fontSize: '13px', display: 'inline-flex' }}
                    >
                        <Plus size={14} /> Create Campaign
                    </Link>
                </div>
            )}

            {/* DATA TABLE */}
            {!loading && filtered.length > 0 && (
                <div style={{
                    background: 'rgba(24, 24, 27, 0.6)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '12px', overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(63, 63, 70, 0.3)' }}>
                                {['Campaign', 'Status', 'Contacts', 'Created', 'Actions'].map((h, i) => (
                                    <th key={h} style={{
                                        padding: '12px 20px', fontSize: '11px', fontWeight: 500,
                                        textTransform: 'uppercase', letterSpacing: '0.06em', color: '#52525B',
                                        textAlign: i >= 2 && i < 4 ? 'right' : i === 4 ? 'right' : 'left',
                                        background: 'rgba(9, 9, 11, 0.3)'
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c, idx) => (
                                <tr
                                    key={c.id}
                                    style={{
                                        borderBottom: idx < filtered.length - 1 ? '1px solid rgba(63, 63, 70, 0.2)' : 'none',
                                        transition: 'background 0.15s ease',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(39, 39, 42, 0.3)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    {/* Name + Subject */}
                                    <td style={{ padding: '16px 20px' }}>
                                        <Link href={`/campaigns/${c.id}`} style={{ textDecoration: 'none' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>{c.name}</p>
                                            <p style={{ fontSize: '12px', color: '#71717A', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{c.subject}</p>
                                        </Link>
                                    </td>

                                    {/* Status */}
                                    <td style={{ padding: '16px 20px' }}>
                                        <StatusBadge status={c.status} />
                                    </td>

                                    {/* Count */}
                                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#A1A1AA', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                        {c.stats?.[0]?.count ? c.stats[0].count.toLocaleString() : '—'}
                                    </td>

                                    {/* Date */}
                                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#71717A', textAlign: 'right' }}>
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
                                                <button style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '6px', color: '#A1A1AA', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                                                    Edit
                                                </button>
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
                </div>
            )}
        </>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, ShieldOff, RefreshCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = "http://localhost:8000";

function apiHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
}

// ===== Light Mode Colors =====
const colors = {
    bgPrimary: 'var(--bg-primary)',
    bgSecondary: '#f8fafc',
    bgCard: 'var(--bg-card)',
    bgHover: 'var(--bg-hover)',
    border: 'var(--border)',
    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-muted)',
    accentBlue: '#2563eb',
    statusWarning: '#ca8a04',
    statusError: '#dc2626',
};

interface SuppressedContact {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    status: string;
    bounce_reason?: string;
    created_at: string;
}

export default function SuppressionListPage() {
    const { token } = useAuth();

    const [contacts, setContacts] = useState<SuppressedContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchSuppressionList = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/contacts/suppression?page=${page}&limit=50`, {
                headers: apiHeaders(token)
            });
            if (res.ok) {
                const data = await res.json();
                setContacts(data.data || []);
                setTotalPages(data.meta?.total_pages || 1);
                setTotal(data.meta?.total || 0);
            }
        } catch (e) {
            console.error("Failed to fetch suppression list", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSuppressionList();
    }, [page, token]);

    return (
        <div style={{ padding: "32px 40px", maxWidth: "1200px" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <Link href="/contacts" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: colors.textSecondary, textDecoration: 'none', marginBottom: '16px' }}>
                    <ArrowLeft style={{ width: '16px', height: '16px' }} />
                    Back to Contacts
                </Link>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ fontSize: "28px", fontWeight: 600, color: colors.textPrimary, margin: "0 0 8px 0" }}>
                            Suppression List
                        </h1>
                        <p style={{ color: colors.textSecondary, margin: 0, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <ShieldOff style={{ width: "16px", height: "16px" }} />
                            {total} contacts disabled due to bounces, complaints, or unsubscribes.
                        </p>
                    </div>
                    <button onClick={fetchSuppressionList} style={{
                        padding: "8px 16px", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
                        borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                        color: colors.textPrimary, fontSize: "14px", fontWeight: 500
                    }}>
                        <RefreshCcw style={{ width: "16px", height: "16px" }} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "12px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "var(--bg-hover)", borderBottom: `1px solid ${colors.border}` }}>
                            <th style={{ padding: "16px 24px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: colors.textSecondary }}>Email</th>
                            <th style={{ padding: "16px 24px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: colors.textSecondary }}>Name</th>
                            <th style={{ padding: "16px 24px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: colors.textSecondary }}>Reason</th>
                            <th style={{ padding: "16px 24px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: colors.textSecondary }}>Date Added</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && contacts.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: "48px", textAlign: "center", color: colors.textSecondary, fontSize: "14px" }}>
                                    Loading suppression list...
                                </td>
                            </tr>
                        ) : contacts.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: "48px", textAlign: "center", color: colors.textSecondary }}>
                                    <ShieldOff style={{ width: "32px", height: "32px", margin: "0 auto 12px", opacity: 0.5 }} />
                                    <div style={{ fontSize: "15px", fontWeight: 500, color: colors.textPrimary, marginBottom: "4px" }}>No suppressed contacts</div>
                                    <div style={{ fontSize: "14px" }}>Your list is clean!</div>
                                </td>
                            </tr>
                        ) : (
                            contacts.map(c => (
                                <tr key={c.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: "background 150ms" }}>
                                    <td style={{ padding: "16px 24px", color: colors.textPrimary, fontWeight: 500, fontSize: "14px" }}>
                                        {c.email}
                                    </td>
                                    <td style={{ padding: "16px 24px", color: colors.textSecondary, fontSize: "14px" }}>
                                        {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
                                    </td>
                                    <td style={{ padding: "16px 24px" }}>
                                        <span 
                                            title={c.bounce_reason || "No bounce reason recorded"}
                                            style={{
                                                padding: "4px 10px", borderRadius: "16px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize",
                                                backgroundColor: c.status === "bounced" ? `${colors.statusError}15` : `${colors.statusWarning}15`,
                                                color: c.status === "bounced" ? colors.statusError : colors.statusWarning,
                                                display: "inline-flex", alignItems: "center", gap: "4px",
                                                cursor: c.bounce_reason ? "help" : "default"
                                            }}
                                        >
                                            <AlertTriangle style={{ width: "12px", height: "12px" }} />
                                            {c.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px 24px", color: colors.textSecondary, fontSize: "14px" }}>
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.bgPrimary, borderTop: `1px solid ${colors.border}` }}>
                        <span style={{ fontSize: "14px", color: colors.textSecondary }}>
                            Page {page} of {totalPages}
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ padding: "6px 12px", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "6px", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1, color: colors.textPrimary }}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{ padding: "6px 12px", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "6px", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1, color: colors.textPrimary }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

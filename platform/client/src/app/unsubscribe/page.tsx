"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { CheckCircle2, XCircle, AlertCircle, RotateCcw, Mail, Loader2 } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

function UnsubscribeContent() {
    const params = useSearchParams();
    const status = params.get("status");   // "success" when redirected from API
    const token = params.get("token");    // present if user lands directly with token

    const [resubStatus, setResubStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
    const [email, setEmail] = useState("");
    const [showResubForm, setShowResubForm] = useState(false);

    const handleResub = async () => {
        if (!email.trim()) return;
        setResubStatus('loading');
        try {
            const res = await fetch(`${API_BASE}/resubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error("Failed");
            setResubStatus('done');
        } catch {
            setResubStatus('error');
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────
    const cardStyle: React.CSSProperties = {
        textAlign: "center", padding: "48px 40px", maxWidth: "460px", width: "100%",
        background: "rgba(24,24,27,0.7)", border: "1px solid rgba(63,63,70,0.4)",
        borderRadius: "16px", backdropFilter: "blur(16px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
    };

    const iconCircle = (bg: string, border: string, children: React.ReactNode) => (
        <div style={{
            width: "68px", height: "68px", borderRadius: "50%",
            background: bg, border: `1px solid ${border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px", boxShadow: `0 0 30px ${bg}`
        }}>
            {children}
        </div>
    );

    // ── Success state (redirected from backend) ────────────────────────
    if (status === "success") {
        return (
            <div style={cardStyle}>
                {iconCircle("rgba(16,185,129,0.12)", "rgba(16,185,129,0.3)", <CheckCircle2 size={30} color="#10B981" />)}
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#FAFAFA", margin: "0 0 10px" }}>
                    You&apos;ve been unsubscribed
                </h1>
                <p style={{ fontSize: "14px", color: "#71717A", lineHeight: 1.7, margin: "0 0 32px" }}>
                    You won&apos;t receive any more marketing emails from this sender.
                    This takes effect immediately.
                </p>

                <div style={{ borderTop: "1px solid rgba(63,63,70,0.3)", paddingTop: "24px" }}>
                    <p style={{ fontSize: "13px", color: "#52525B", margin: "0 0 16px" }}>
                        Unsubscribed by mistake?
                    </p>

                    {!showResubForm ? (
                        <button
                            onClick={() => setShowResubForm(true)}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: "6px",
                                padding: "9px 18px", background: "transparent",
                                border: "1px solid rgba(63,63,70,0.5)", borderRadius: "8px",
                                color: "#A1A1AA", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(63,63,70,0.5)")}
                        >
                            <RotateCcw size={13} /> Re-subscribe
                        </button>
                    ) : resubStatus !== 'done' ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    style={{
                                        flex: 1, padding: "8px 12px", fontSize: "13px",
                                        background: "rgba(9,9,11,0.6)", border: "1px solid rgba(63,63,70,0.4)",
                                        borderRadius: "8px", color: "#FAFAFA", outline: "none"
                                    }}
                                />
                                <button
                                    onClick={handleResub}
                                    disabled={!email.trim() || resubStatus === 'loading'}
                                    style={{
                                        padding: "8px 14px", background: "#6366F1", border: "none",
                                        borderRadius: "8px", color: "white", fontSize: "13px",
                                        fontWeight: 600, cursor: email.trim() ? "pointer" : "not-allowed",
                                        opacity: email.trim() ? 1 : 0.5,
                                        display: "flex", alignItems: "center", gap: "6px"
                                    }}
                                >
                                    {resubStatus === 'loading'
                                        ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Subscribing...</>
                                        : <><Mail size={13} /> Subscribe</>
                                    }
                                </button>
                            </div>
                            {resubStatus === 'error' && (
                                <p style={{ fontSize: "12px", color: "#F87171", margin: 0 }}>
                                    ❌ Something went wrong. Please contact support.
                                </p>
                            )}
                        </div>
                    ) : (
                        <p style={{ fontSize: "13px", color: "#4ADE80", margin: 0 }}>
                            ✅ You&apos;ve been re-subscribed. Welcome back!
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ── Invalid / error state ──────────────────────────────────────────
    return (
        <div style={cardStyle}>
            {iconCircle("rgba(239,68,68,0.1)", "rgba(239,68,68,0.25)", <XCircle size={30} color="#EF4444" />)}
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#FAFAFA", margin: "0 0 10px" }}>
                Invalid Link
            </h1>
            <p style={{ fontSize: "14px", color: "#71717A", lineHeight: 1.7, margin: "0 0 24px" }}>
                This unsubscribe link is invalid or has already been used.
                Your subscription status has not changed.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", textAlign: "left" }}>
                <AlertCircle size={16} color="#F59E0B" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: "12px", color: "#A1A1AA", margin: 0, lineHeight: 1.5 }}>
                    If you believe this is a mistake, please contact{" "}
                    <a href="mailto:support@emailengine.com" style={{ color: "#60A5FA" }}>
                        support@emailengine.com
                    </a>
                </p>
            </div>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #09090B 0%, #0F0F14 100%)",
            fontFamily: "'Inter', sans-serif", padding: "24px"
        }}>
            <Suspense fallback={<div style={{ color: "#71717A" }}>Loading...</div>}>
                <UnsubscribeContent />
            </Suspense>
        </div>
    );
}

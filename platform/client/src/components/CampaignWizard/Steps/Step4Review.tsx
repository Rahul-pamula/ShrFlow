"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Send, CheckCircle2, FileText, Users, LayoutTemplate,
    AlertTriangle, Loader2, Mail, CheckCheck, XCircle, X, Calendar, Clock, Zap
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = "http://127.0.0.1:8000";

export default function Step4Review({ data, onBack }: any) {
    const router = useRouter();
    const { token, user } = useAuth();
    const [status, setStatus] = useState<'idle' | 'creating' | 'sending' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | Record<string, unknown>>("");

    // Send mode: instant or scheduled
    const [sendMode, setSendMode] = useState<'now' | 'later'>('now');
    const [scheduledAt, setScheduledAt] = useState(""); // datetime-local value
    const [scheduledMsg, setScheduledMsg] = useState("");

    // Test email modal
    const [showTestModal, setShowTestModal] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    // Minimum datetime (now + 5 mins) for the schedule picker
    const minDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

    // Pre-send checklist
    const checks = [
        { label: "Campaign name set", ok: !!(data.name?.trim()) },
        { label: "Subject line filled", ok: !!(data.subject?.trim()) },
        { label: "Content written", ok: !!(data.htmlContent?.trim()) },
        { label: "Audience selected", ok: !!(data.listId) },
    ];
    const allChecksPass = checks.every(c => c.ok);

    const handleLaunch = async () => {
        if (!token || !allChecksPass) return;

        // For scheduled mode, validate a date is chosen and it's in the future
        if (sendMode === 'later') {
            if (!scheduledAt) { setErrorMsg("Please choose a date and time to schedule."); return; }
            const chosenDate = new Date(scheduledAt);
            if (chosenDate <= new Date()) { setErrorMsg("Scheduled time must be in the future."); return; }
        }

        setStatus('creating');
        setErrorMsg("");
        try {
            // Step 1: Create the campaign as a draft
            const createRes = await fetch(`${API_BASE}/campaigns/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: data.name, subject: data.subject,
                    body_html: data.htmlContent, status: 'draft',
                })
            });
            if (!createRes.ok) throw new Error((await createRes.json()).detail || "Failed to create campaign");
            const { id: campaignId } = await createRes.json();

            setStatus('sending');

            if (sendMode === 'now') {
                // Step 2a: Send immediately via /send
                const sendRes = await fetch(`${API_BASE}/campaigns/${campaignId}/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ target_list_id: data.listId })
                });
                if (!sendRes.ok) throw new Error((await sendRes.json()).detail || "Failed to launch campaign");
            } else {
                // Step 2b: Schedule via /schedule — convert local datetime to UTC ISO string
                const utcIso = new Date(scheduledAt).toISOString();
                const schedRes = await fetch(`${API_BASE}/campaigns/${campaignId}/schedule`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ scheduled_at: utcIso, target_list_id: data.listId })
                });
                if (!schedRes.ok) throw new Error((await schedRes.json()).detail || "Failed to schedule campaign");
                const j = await schedRes.json();
                setScheduledMsg(j.message || `Campaign scheduled.`);
            }

            setStatus('success');
            localStorage.removeItem("campaign_wizard_draft");
            setTimeout(() => router.push("/campaigns"), 3000);
        } catch (err: any) {
            setStatus('error');
            // Check if the backend sent our structured JSON detail for Quota exceeded
            try {
                const parsedDetail = JSON.parse(err.message);
                setErrorMsg(parsedDetail);
            } catch {
                setErrorMsg(err.message);
            }
        }
    };

    const handleSendTest = async () => {
        if (!token || !testEmail) return;
        setTestStatus('sending');
        try {
            // We need a campaign ID for test. Create a temp draft if no id, or just log
            const res = await fetch(`${API_BASE}/campaigns/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: `[TEST] ${data.name}`, subject: data.subject, body_html: data.htmlContent, status: 'draft' })
            });
            if (!res.ok) throw new Error("Failed");
            const { id } = await res.json();
            await fetch(`${API_BASE}/campaigns/${id}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ recipient_email: testEmail })
            });
            setTestStatus('sent');
        } catch {
            setTestStatus('error');
        }
    };

    if (status === 'success') {
        const isScheduled = sendMode === 'later';
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', minHeight: '400px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: isScheduled ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${isScheduled ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: `0 0 30px ${isScheduled ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                    {isScheduled ? <Calendar size={36} color="#3B82F6" /> : <CheckCircle2 size={36} color="#10B981" />}
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FAFAFA', marginBottom: '8px' }}>
                    {isScheduled ? 'Campaign Scheduled! 📅' : 'Campaign Launched! 🚀'}
                </h2>
                <p style={{ color: '#71717A', fontSize: '14px', maxWidth: '420px' }}>
                    {isScheduled
                        ? <>{scheduledMsg || 'Your campaign has been scheduled.'} Redirecting...</>
                        : <><strong style={{ color: '#A1A1AA' }}>{data.name}</strong> has been queued. Workers are now sending emails.</>}
                </p>
            </div>
        );
    }

    const summaryRow = (icon: any, label: string, value: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 0', borderBottom: '1px solid rgba(63,63,70,0.25)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(63,63,70,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
            <div>
                <p style={{ fontSize: '11px', color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
                <p style={{ fontSize: '14px', color: '#E4E4E7', fontWeight: 500, margin: 0 }}>{value || '—'}</p>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '36px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={18} color="#3B82F6" />
                </div>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>Review & Launch</h2>
                    <p style={{ fontSize: '13px', color: '#71717A', margin: 0 }}>Double-check before sending</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                {/* Summary */}
                <div style={{ background: 'rgba(9,9,11,0.4)', borderRadius: '10px', padding: '4px 16px', border: '1px solid rgba(63,63,70,0.3)' }}>
                    {summaryRow(<FileText size={15} color="#71717A" />, 'Campaign', `${data.name} — ${data.subject}`)}
                    {summaryRow(<Users size={15} color="#71717A" />, 'Audience', data.listName)}
                    {summaryRow(<LayoutTemplate size={15} color="#71717A" />, 'Template', data.templateName)}
                </div>

                {/* Preview */}
                <div style={{ border: '1px solid rgba(63,63,70,0.3)', borderRadius: '10px', overflow: 'hidden', background: 'white' }}>
                    <div style={{ background: 'rgba(24,24,27,0.9)', padding: '8px 12px', borderBottom: '1px solid rgba(63,63,70,0.4)', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#71717A' }}>Preview</span>
                        <span style={{ fontSize: '11px', color: '#52525B' }}>Desktop</span>
                    </div>
                    <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '8px', background: '#ffffff' }}>
                        <div dangerouslySetInnerHTML={{ __html: data.htmlContent }} style={{ pointerEvents: 'none', fontSize: '10px', transform: 'scale(0.9)', transformOrigin: 'top left' }} />
                    </div>
                </div>
            </div>

            {/* Pre-send checklist */}
            <div style={{ padding: '16px 18px', background: 'rgba(9,9,11,0.4)', border: '1px solid rgba(63,63,70,0.3)', borderRadius: '10px', marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Pre-send Checklist</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {checks.map(c => (
                        <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: c.ok ? '#4ADE80' : '#F87171' }}>
                            {c.ok ? <CheckCheck size={14} /> : <XCircle size={14} />}
                            <span style={{ color: c.ok ? '#A1A1AA' : '#F87171' }}>{c.label}</span>
                        </div>
                    ))}
                </div>
                {!allChecksPass && (
                    <p style={{ fontSize: '12px', color: '#F87171', margin: '10px 0 0' }}>⚠ Fix the items above before launching.</p>
                )}
            </div>

            {/* Send Mode Selector */}
            <div style={{ marginBottom: '20px', background: 'rgba(9,9,11,0.4)', border: '1px solid rgba(63,63,70,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    {(['now', 'later'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => { setSendMode(mode); setErrorMsg(''); }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '14px 0', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                background: sendMode === mode ? (mode === 'now' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)') : 'transparent',
                                color: sendMode === mode ? (mode === 'now' ? '#10B981' : '#3B82F6') : '#71717A',
                                borderBottom: sendMode === mode ? `2px solid ${mode === 'now' ? '#10B981' : '#3B82F6'}` : '2px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            {mode === 'now' ? <><Zap size={14} /> Send Now</> : <><Calendar size={14} /> Schedule for Later</>}
                        </button>
                    ))}
                </div>

                {sendMode === 'later' && (
                    <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(63,63,70,0.3)' }}>
                        <p style={{ fontSize: '12px', color: '#71717A', margin: '0 0 10px' }}>Choose a date and time (will convert to UTC):</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Clock size={14} color="#71717A" />
                            <input
                                type="datetime-local"
                                min={minDateTime}
                                value={scheduledAt}
                                onChange={e => setScheduledAt(e.target.value)}
                                style={{
                                    flex: 1, padding: '8px 12px', background: 'rgba(24,24,27,0.6)',
                                    border: '1px solid rgba(63,63,70,0.4)', borderRadius: '8px',
                                    color: '#FAFAFA', fontSize: '13px', outline: 'none', colorScheme: 'dark'
                                }}
                            />
                        </div>
                        {scheduledAt && (
                            <p style={{ fontSize: '11px', color: '#52525B', margin: '8px 0 0' }}>
                                Sends: {new Date(scheduledAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Error / Quota Blocker */}
            {(status === 'error' || errorMsg) && (
                <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(69,10,10,0.3)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#EF4444' }}>
                    <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-red-500" />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#FCA5A5' }}>
                            {errorMsg != null && typeof errorMsg === 'object' && 'code' in errorMsg && (errorMsg as Record<string, unknown>).code === 'QUOTA_EXCEEDED' ? 'Monthly Sending Limit Reached' : 'Launch Failed'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#FECACA', lineHeight: 1.5 }}>
                            {errorMsg != null && typeof errorMsg === 'object' && 'message' in errorMsg ? (errorMsg as Record<string, unknown>).message as string : String(errorMsg ?? '')}
                        </p>
                        {errorMsg != null && typeof errorMsg === 'object' && 'code' in errorMsg && (errorMsg as Record<string, unknown>).code === 'QUOTA_EXCEEDED' && (
                            <div style={{ marginTop: '16px' }}>
                                <button
                                    onClick={() => router.push('/settings/billing')}
                                    style={{ padding: '8px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#DC2626'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#EF4444'}
                                >
                                    Upgrade to Pro
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Footer actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid rgba(63,63,70,0.3)' }}>
                <button onClick={onBack} disabled={status === 'creating' || status === 'sending'}
                    style={{ background: 'none', border: 'none', color: '#71717A', fontSize: '14px', cursor: 'pointer', padding: '8px 4px' }}>
                    ← Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Send Test Email button */}
                    <button onClick={() => setShowTestModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(24,24,27,0.6)', border: '1px solid rgba(63,63,70,0.4)', borderRadius: '8px', color: '#A1A1AA', fontSize: '13px', cursor: 'pointer' }}>
                        <Mail size={13} /> Send Test
                    </button>
                    <button
                        onClick={handleLaunch}
                        disabled={!allChecksPass || status === 'creating' || status === 'sending' || (sendMode === 'later' && !scheduledAt)}
                        className="btn-premium"
                        style={(!allChecksPass || status === 'creating' || status === 'sending' || (sendMode === 'later' && !scheduledAt)) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        {status === 'creating' ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</>
                            : status === 'sending' ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {sendMode === 'now' ? 'Queuing emails...' : 'Scheduling...'}</>
                                : sendMode === 'later'
                                    ? <><Calendar size={15} /> Schedule Campaign</>
                                    : <><Send size={15} /> Launch Campaign</>}
                    </button>
                </div>
            </div>

            {/* Test Email Modal */}
            {showTestModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: '#18181B', border: '1px solid rgba(63,63,70,0.5)', borderRadius: '12px', padding: '28px', width: '380px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>Send Test Email</h3>
                            <button onClick={() => { setShowTestModal(false); setTestStatus('idle'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A' }}><X size={18} /></button>
                        </div>
                        <p style={{ fontSize: '13px', color: '#71717A', margin: '0 0 16px' }}>Send a preview of this campaign to any email address to check how it looks.</p>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={testEmail}
                            onChange={e => setTestEmail(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: 'rgba(24,24,27,0.4)', border: '1px solid rgba(63,63,70,0.4)', borderRadius: '8px', color: '#FAFAFA', boxSizing: 'border-box', outline: 'none', marginBottom: '14px' }}
                        />
                        {testStatus === 'sent' && <p style={{ color: '#4ADE80', fontSize: '13px', margin: '0 0 12px' }}>✅ Test email sent to {testEmail}!</p>}
                        {testStatus === 'error' && <p style={{ color: '#F87171', fontSize: '13px', margin: '0 0 12px' }}>❌ Failed to send. Try again.</p>}
                        <button
                            onClick={handleSendTest}
                            disabled={!testEmail || testStatus === 'sending'}
                            style={{ width: '100%', padding: '9px', background: '#3B82F6', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: testEmail ? 'pointer' : 'not-allowed', opacity: testEmail ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            {testStatus === 'sending' ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : <><Mail size={13} /> Send Test</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

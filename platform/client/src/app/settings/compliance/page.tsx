'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, ArrowLeft, Download, Trash2, AlertTriangle, Loader2, Check } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

export default function ComplianceSettings() {
    const { token } = useAuth();
    const [eraseEmail, setEraseEmail] = useState('');
    const [erasing, setErasing] = useState(false);
    const [erased, setErased] = useState(false);
    const [eraseError, setEraseError] = useState('');
    const [exporting, setExporting] = useState(false);

    const handleGdprErase = async () => {
        if (!eraseEmail.trim()) return;
        if (!confirm(`Are you sure you want to permanently erase all PII for "${eraseEmail}"? This cannot be undone.`)) return;

        setErasing(true);
        setEraseError('');
        try {
            // Find contact by email first
            const searchRes = await fetch(`${API_BASE}/contacts?search=${encodeURIComponent(eraseEmail)}&limit=1`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const searchData = await searchRes.json();
            const contacts = searchData.contacts || searchData.data || [];
            if (!contacts.length) {
                setEraseError('No contact found with that email address.');
                return;
            }
            const contactId = contacts[0].id;
            const eraseRes = await fetch(`${API_BASE}/settings/gdpr/erase-contact/${contactId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!eraseRes.ok) throw new Error((await eraseRes.json()).detail || 'Erase failed');
            setErased(true);
            setEraseEmail('');
            setTimeout(() => setErased(false), 5000);
        } catch (e: any) {
            setEraseError(e.message);
        } finally {
            setErasing(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch(`${API_BASE}/contacts/export/async`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to start export');
            const data = await res.json();
            if (!data.job_id) throw new Error('No job ID returned');
            
            const poll = setInterval(async () => {
                try {
                    const jr = await fetch(`${API_BASE}/contacts/jobs/${data.job_id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (jr.ok) {
                        const job = await jr.json();
                        if (job.status === 'completed') {
                            clearInterval(poll);
                            setExporting(false);
                            let url = '';
                            try {
                                const errorLog = JSON.parse(job.error_log);
                                url = errorLog.result_url;
                            } catch (e) {}
                            if (url) {
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `contacts_export_${new Date().toISOString().split('T')[0]}.csv.gz`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            } else {
                                alert('Export completed but no download URL found.');
                            }
                        } else if (job.status === 'failed') {
                            clearInterval(poll);
                            setExporting(false);
                            alert('Export failed.');
                        }
                    }
                } catch (e) {}
            }, 2000);
        } catch (e: any) {
            setExporting(false);
            alert(e.message);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-8 lg:p-12">
            <div className="max-w-2xl mx-auto">
                <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" /> Back to Settings
                </Link>

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-amber-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Compliance & GDPR</h1>
                    </div>
                    <p className="text-[var(--text-muted)] text-sm">Data privacy tools required by GDPR, CCPA, and CASL regulations.</p>
                </div>

                <div className="space-y-6">
                    {/* Data Export */}
                    <div className="glass-panel p-6">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Data Portability Export</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-4">
                            Download a CSV of all your contacts including their status, subscription history, and custom fields. Required for GDPR Article 20.
                        </p>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-primary)] hover:bg-white/5 transition-colors disabled:opacity-60"
                        >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {exporting ? 'Generating export…' : 'Download All Contacts (CSV)'}
                        </button>
                    </div>

                    {/* Right to Erasure */}
                    <div className="glass-panel p-6">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Right to Erasure (GDPR Art. 17)</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-4">
                            Enter a subscriber's email address to anonymize all their personal data. Analytics history is preserved but all PII is replaced with anonymized placeholders.
                        </p>

                        <div className="flex gap-3">
                            <input
                                type="email"
                                value={eraseEmail}
                                onChange={e => setEraseEmail(e.target.value)}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:border-red-500/50 transition-colors outline-none"
                                placeholder="subscriber@example.com"
                            />
                            <button
                                onClick={handleGdprErase}
                                disabled={erasing || !eraseEmail.trim()}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors disabled:opacity-60"
                            >
                                {erasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {erasing ? 'Erasing…' : 'Erase Contact'}
                            </button>
                        </div>

                        {eraseError && (
                            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {eraseError}
                            </div>
                        )}
                        {erased && (
                            <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                                <Check className="w-4 h-4 flex-shrink-0" /> Contact PII has been anonymized. Campaign metrics are preserved.
                            </div>
                        )}

                        <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                            <p className="text-xs text-[var(--text-muted)]">
                                <span className="text-amber-400 font-medium">⚠ Irreversible:</span> This action replaces the email, name and other PII with <code className="bg-black/20 px-1 rounded">deleted_xxx@gdpr.invalid</code>. It cannot be undone.
                            </p>
                        </div>
                    </div>

                    {/* Compliance Info */}
                    <div className="glass-panel p-6">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Compliance Checklist</h3>
                        <ul className="space-y-3">
                            {[
                                { label: 'Unsubscribe link in every email', done: true },
                                { label: 'Physical postal address in email footer', done: true },
                                { label: 'Bounce handling (auto-suppression)', done: true },
                                { label: 'Spam complaint suppression', done: true },
                                { label: 'Data export available', done: true },
                                { label: 'Right to erasure available', done: true },
                                { label: 'Custom domain verification (SPF/DKIM)', done: false, note: 'Set up in Sending Domain' },
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${item.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {item.done ? '✓' : '!'}
                                    </span>
                                    <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                                    {item.note && <span className="text-xs text-[var(--text-muted)]">← {item.note}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

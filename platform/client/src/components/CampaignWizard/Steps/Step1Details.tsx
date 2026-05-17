"use client";

import { useState, useEffect } from "react";
import { FileText, Loader2, AlertTriangle, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from 'next/link';
import { Button } from "@/components/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function Step1Details({ data, updateData, onNext }: any) {
    const { token } = useAuth();
    const [errors, setErrors] = useState<any>({});
    const [domains, setDomains] = useState<any[]>([]);
    const [senders, setSenders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const [domRes, sendRes] = await Promise.all([
                    fetch(`${API_BASE}/domains/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE}/senders/`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                let verifiedDomains = [];
                let verifiedSenders = [];

                if (domRes.ok) {
                    const json = await domRes.json();
                    verifiedDomains = (json.data || []).filter((d: any) => d.status === 'verified');
                    setDomains(verifiedDomains);
                }

                if (sendRes.ok) {
                    const json = await sendRes.json();
                    verifiedSenders = (json.data || []).filter((s: any) => s.status === 'verified');
                    setSenders(verifiedSenders);
                }

                // Validate existing domain_id or Auto-select
                const isDomainStale = data.domain_id && !verifiedDomains.find((d: any) => d.id === data.domain_id);

                if (isDomainStale || (!data.domain_id && verifiedSenders.length > 0 && verifiedDomains.length > 0)) {
                    const firstSender = verifiedSenders[0].email;
                    const [prefix, domainStr] = firstSender.split('@');
                    const domainObj = verifiedDomains.find((d: any) => d.domain_name === domainStr);
                    if (domainObj) {
                        updateData({ from_prefix: prefix, domain_id: domainObj.id, domain_name: domainObj.domain_name });
                    } else if (isDomainStale) {
                        // Fallback clear if even the first sender's domain is mysteriously gone
                        updateData({ from_prefix: '', domain_id: '', domain_name: '' });
                    }
                } else if (data.domain_id && !data.domain_name) {
                    // Backfill domain_name into context for Step4Review if missing
                    const domainObj = verifiedDomains.find((d: any) => d.id === data.domain_id);
                    if (domainObj) updateData({ domain_name: domainObj.domain_name });
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, data.domain_id, data.domain_name, updateData]);

    const validate = () => {
        const e: any = {};
        if (!data.name?.trim()) e.name = "Campaign name is required";
        if (!data.subject?.trim()) e.subject = "Subject line is required";
        if (!data.from_name?.trim()) e.from_name = "Sender name is required";
        if (!data.from_prefix?.trim()) e.from_prefix = "Sender email prefix is required";
        else if (!/^[a-zA-Z0-9._%+-]+$/.test(data.from_prefix)) e.from_prefix = "Invalid email prefix format";
        if (!data.domain_id) e.domain_id = "You must select a verified sending domain";
        return e;
    };

    const handleNext = () => {
        const e = validate();
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        onNext();
    };

    const inputClasses = (hasError: boolean) => `
        w-full px-3.5 py-2.5 bg-[var(--bg-input)] border rounded-[var(--radius)] text-sm text-[var(--text-primary)] focus:outline-none transition-colors
        ${hasError ? 'border-[var(--danger)] focus:ring-1 focus:ring-[var(--danger)]' : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]'}
    `;

    const labelClasses = "block text-sm font-medium text-[var(--text-muted)] mb-1.5";

    return (
        <div className="p-9">
            <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--accent-glow)] border border-[var(--accent)] flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] m-0">Campaign Details</h2>
                    <p className="text-sm text-[var(--text-secondary)] m-0 mt-0.5">Set the basic information and sender identity</p>
                </div>
            </div>

            <div className="flex flex-col gap-6">

                {/* Core Campaign Info */}
                <div className="p-5 bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)]">
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[var(--accent)]" /> General Information
                    </h3>

                    <div className="flex flex-col gap-5">
                        <div>
                            <label className={labelClasses}>Internal Campaign Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Q3 Summer Spectacular"
                                value={data.name || ''}
                                onChange={(e) => { updateData({ name: e.target.value }); setErrors((p: any) => ({ ...p, name: '' })); }}
                                className={inputClasses(!!errors.name)}
                            />
                            {errors.name && <p className="text-xs text-[var(--danger)] mt-1">{errors.name}</p>}
                            <p className="text-xs text-[var(--text-muted)] mt-1">Only you and your team will see this name.</p>
                        </div>
                    </div>
                </div>

                {/* Sender Identity Section */}
                <div className="p-5 bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)]">
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[var(--accent-purple)]" /> Sender Identity
                    </h3>

                    <div className="flex flex-col gap-5">
                        <div>
                            <label className={labelClasses}>Sender Name (From Name) *</label>
                            <input
                                type="text"
                                placeholder="e.g. Krishna from Dwaraka Corp"
                                value={data.from_name || ''}
                                onChange={(e) => { updateData({ from_name: e.target.value }); setErrors((p: any) => ({ ...p, from_name: '' })); }}
                                className={inputClasses(!!errors.from_name)}
                            />
                            {errors.from_name && <p className="text-xs text-[var(--danger)] mt-1">{errors.from_name}</p>}
                        </div>

                        <div>
                            <label className={labelClasses}>Sender Email Address *</label>

                            {loading ? (
                                <div className="flex items-center gap-2 p-3 rounded-[var(--radius)] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)] text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading verified senders...
                                </div>
                            ) : senders.length === 0 ? (
                                <div className="flex flex-col gap-2 p-4 rounded-[var(--radius)] bg-[var(--warning-bg)] border border-[var(--warning-border)] text-[var(--warning)] text-sm">
                                    <div className="flex items-center gap-2 font-medium">
                                        <AlertTriangle className="w-4 h-4" /> No Verified Senders Found
                                    </div>
                                    <p className="opacity-80">You must verify an email inbox ownership before launching campaigns.</p>
                                    <Link href="/settings/senders" className="text-[var(--accent)] hover:underline mt-1 w-fit">
                                        Go to Sender Settings →
                                    </Link>
                                </div>
                            ) : (
                                <div className="relative">
                                    <select
                                        value={
                                            data.from_prefix && data.domain_id
                                                ? `${data.from_prefix}@${domains.find(d => d.id === data.domain_id)?.domain_name || ''}`
                                                : ''
                                        }
                                        onChange={(e) => {
                                            const fullEmail = e.target.value;
                                            const [prefix, domainStr] = fullEmail.split('@');
                                            const domainObj = domains.find(d => d.domain_name === domainStr);
                                            if (domainObj) {
                                                updateData({ from_prefix: prefix, domain_id: domainObj.id, domain_name: domainObj.domain_name });
                                            }
                                            setErrors((p: any) => ({ ...p, from_prefix: '', domain_id: '' }));
                                        }}
                                        className={`${inputClasses(!!(errors.from_prefix || errors.domain_id))} appearance-none cursor-pointer`}
                                    >
                                        <option value="" disabled>Select Verified Sender</option>
                                        {senders.map(sender => (
                                            <option key={sender.id} value={sender.email}>{sender.email}</option>
                                        ))}
                                    </select>

                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
                                        <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>

                                    {errors.from_prefix && <p className="text-xs text-[var(--danger)] mt-1">{errors.from_prefix}</p>}
                                </div>
                            )}
                        </div>

                        <div className="pt-5 border-t border-[var(--border)]">
                            <label className={labelClasses}>Email Subject Line *</label>
                            <input
                                type="text"
                                placeholder="e.g. Don't miss our biggest sale of the year!"
                                value={data.subject || ''}
                                onChange={(e) => { updateData({ subject: e.target.value }); setErrors((p: any) => ({ ...p, subject: '' })); }}
                                className={inputClasses(!!errors.subject)}
                            />
                            {errors.subject && <p className="text-xs text-[var(--danger)] mt-1">{errors.subject}</p>}
                            <p className="text-xs text-[var(--text-muted)] mt-1">This is the main headline recipients will see in their inbox.</p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-[var(--border)]">
                <Button
                    onClick={handleNext}
                    variant="primary"
                    disabled={loading || senders.length === 0}
                >
                    Next Step →
                </Button>
            </div>
        </div>
    );
}

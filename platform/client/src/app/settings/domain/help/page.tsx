"use client";
import React from 'react';
import { ArrowLeft, ShieldCheck, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const colors = {
    bg: 'var(--bg-primary)',
    card: 'var(--bg-card)',
    border: 'var(--border)',
    text: 'var(--text-primary)',
    textSecondary: 'var(--text-muted)',
    primary: '#3B82F6',
    warning: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
};

export default function DomainHelpPage() {
    return (
        <div style={{ maxWidth: '800px', paddingBottom: '80px', paddingTop: '20px' }}>
            <Link href="/settings/domain" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: colors.textSecondary, textDecoration: 'none', marginBottom: '32px', fontSize: '14px', transition: 'color 0.2s', fontWeight: 500 }}>
                <ArrowLeft size={16} /> Back to Domains
            </Link>

            <h1 style={{ fontSize: '32px', fontWeight: 600, color: colors.text, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Domain Verification Guide</h1>
            <p style={{ color: colors.textSecondary, margin: '0 0 40px', fontSize: '16px', lineHeight: 1.6 }}>
                To send emails on behalf of your domain, you need to prove ownership by adding DKIM, SPF, and Custom Return-Path records to your DNS provider.
            </p>

            {/* Why is this required */}
            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', color: colors.text, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HelpCircle size={20} color={colors.primary} /> Why are these steps required?
                </h2>
                <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ backgroundColor: colors.card, padding: '20px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                        <h3 style={{ fontSize: '15px', color: colors.text, margin: '0 0 8px' }}>1. DKIM (3 CNAME records)</h3>
                        <p style={{ color: colors.textSecondary, margin: 0, fontSize: '14px', lineHeight: 1.5 }}>Acts as a cryptographic signature. This proves to inbox providers (like Gmail and Outlook) that your emails actually came from you and weren't forged by a spammer.</p>
                    </div>
                    <div style={{ backgroundColor: colors.card, padding: '20px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                        <h3 style={{ fontSize: '15px', color: colors.text, margin: '0 0 8px' }}>2. SPF (TXT record)</h3>
                        <p style={{ color: colors.textSecondary, margin: 0, fontSize: '14px', lineHeight: 1.5 }}>A public list of approved senders. This explicitly tells receiving inboxes that Amazon SES (our backend infrastructure) is legally authorized to send emails on your behalf.</p>
                    </div>
                    <div style={{ backgroundColor: colors.card, padding: '20px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                        <h3 style={{ fontSize: '15px', color: colors.text, margin: '0 0 8px' }}>3. Custom Return-Path / Bounces (MX & TXT records)</h3>
                        <p style={{ color: colors.textSecondary, margin: 0, fontSize: '14px', lineHeight: 1.5 }}>Ensures that bounce messages are routed correctly to Amazon SES, achieving Strict DMARC alignment. Without this, Gmail will tag your emails with an ugly "via amazonses.com" label. This removes that tag!</p>
                    </div>
                </div>
            </section>

            {/* What if I miss one? */}
            <div style={{ padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: `1px solid rgba(239, 68, 68, 0.3)`, borderRadius: '12px', display: 'flex', gap: '16px', marginBottom: '56px' }}>
                <AlertTriangle color={colors.danger} size={24} style={{ flexShrink: 0 }} />
                <div>
                    <h4 style={{ color: '#FCA5A5', margin: '0 0 8px', fontSize: '16px' }}>What happens if I make a mistake or miss a record?</h4>
                    <p style={{ color: '#F87171', margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
                        Domain verification will <strong>fail</strong>. Every single record must be present and perfectly copied. If even one character is off, your domain will remain in an unverified state, and you will be completely prevented from sending campaigns. Take your time and copy the values exactly!
                    </p>
                </div>
            </div>

            {/* Namecheap Section */}
            <section style={{ marginBottom: '56px' }}>
                <h2 id="namecheap" style={{ fontSize: '24px', color: colors.text, margin: '0 0 16px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '12px' }}>
                    1. Namecheap Setup
                </h2>
                <div style={{ padding: '24px', backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', color: colors.text, margin: '0 0 12px' }}>DKIM Records (CNAME)</h3>
                    <p style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '16px' }}>
                        Namecheap implicitly adds your base domain to the host field. <strong>You must strip your domain off the host value we provide.</strong>
                    </p>
                    <ol style={{ color: colors.text, margin: 0, paddingLeft: '20px', fontSize: '15px', lineHeight: 2 }}>
                        <li>Log in to your <strong>Namecheap Dashboard</strong>.</li>
                        <li>Click <strong>Manage</strong> next to your domain.</li>
                        <li>Navigate to the <strong>Advanced DNS</strong> tab.</li>
                        <li>Under "Host Records", click <strong>Add New Record</strong>.</li>
                        <li>Select <strong>CNAME Record</strong>.</li>
                        <li>Paste the <strong>Host</strong> name copied from your dashboard, removing your domain name (e.g. <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>xxx._domainkey</code>).</li>
                        <li>Paste the exact <strong>Value</strong> (<code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>xxx.dkim.amazonses.com</code>).</li>
                        <li>Save the record. Repeat for all 3 DKIM records.</li>
                    </ol>
                </div>

                <div style={{ padding: '24px', backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', color: colors.text, margin: '0 0 12px' }}>SPF Record (TXT)</h3>
                    <ol style={{ color: colors.text, margin: 0, paddingLeft: '20px', fontSize: '15px', lineHeight: 2 }}>
                        <li>In the same "Host Records" section, click <strong>Add New Record</strong>.</li>
                        <li>Select <strong>TXT Record</strong>.</li>
                        <li>Set the Host field to exactly <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>@</code> (representing the root domain).</li>
                        <li>Set the Value field to <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>v=spf1 include:amazonses.com ~all</code>.</li>
                        <li>Save the record.</li>
                    </ol>
                </div>

                <div style={{ padding: '24px', backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '16px', color: colors.text, margin: '0 0 12px' }}>Custom Return-Path (MX & TXT Bounces)</h3>
                    <ol style={{ color: colors.text, margin: 0, paddingLeft: '20px', fontSize: '15px', lineHeight: 2 }}>
                        <li>For the MX record: Under "Mail Settings" (or Host Records depending on your setup), select <strong>Custom MX</strong>.</li>
                        <li>Select <strong>Add New Record</strong>.</li>
                        <li>Set Host to <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>bounces</code> (or exactly what is shown in the app).</li>
                        <li>Set Value to <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>feedback-smtp.us-east-1.amazonses.com</code> with a priority of <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>10</code>.</li>
                        <li>For the TXT record: Add a standard TXT record with Host <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>bounces</code> and Value <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>v=spf1 include:amazonses.com ~all</code>.</li>
                        <li>Save both records.</li>
                    </ol>
                </div>
            </section>

            {/* GoDaddy Section */}
            <section style={{ marginBottom: '56px' }}>
                <h2 id="godaddy" style={{ fontSize: '24px', color: colors.text, margin: '0 0 16px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '12px' }}>
                    2. GoDaddy Setup
                </h2>
                <div style={{ padding: '24px', backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                    <ol style={{ color: colors.text, margin: 0, paddingLeft: '20px', fontSize: '15px', lineHeight: 2 }}>
                        <li>Log in to your <strong>GoDaddy Control Center</strong>.</li>
                        <li>Select your domain to access the Domain Settings page.</li>
                        <li>Select <strong>Manage DNS</strong>.</li>
                        <li>Select <strong>Add New Record</strong>.</li>
                        <li>Depending on the table in our dashboard, select <strong>CNAME</strong>, <strong>TXT</strong>, or <strong>MX</strong>.</li>
                        <li>GoDaddy also automatically appends your domain name. Ensure you are only pasting the prefix (like <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>bounces</code> or <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>_domainkey</code>) into the Host/Name field.</li>
                        <li>Paste the exact Value/Data provided in our app.</li>
                        <li>Click <strong>Save</strong>.</li>
                    </ol>
                </div>
            </section>

            {/* What to do Next Box */}
            <div style={{ padding: '24px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: `1px solid rgba(16, 185, 129, 0.3)`, borderRadius: '12px', display: 'flex', gap: '16px' }}>
                <CheckCircle2 color={colors.success} size={28} style={{ flexShrink: 0 }} />
                <div>
                    <h4 style={{ color: '#34D399', margin: '0 0 8px', fontSize: '16px' }}>What to do next?</h4>
                    <p style={{ color: '#6EE7B7', margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
                        Head back to the <strong>Settings &rarr; Domains</strong> page and click the <strong>Check Status</strong> icon next to your pending domain. DNS propagation can take 15 to 45 minutes on average, though GoDaddy occasionally takes longer. Once your badge turns green and says "Authenticated", you are immediately ready to start creating Campaigns using this domain!
                    </p>
                </div>
            </div>

        </div>
    );
}

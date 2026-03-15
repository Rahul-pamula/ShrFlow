"use client";

import { useState, useEffect, useRef } from "react";
import {
    LayoutTemplate, PenLine,
    Check, Search, Loader2, X, Paperclip, Upload
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type ContentMode = 'compose' | 'template';

const MODES = [
    {
        id: 'compose' as ContentMode,
        icon: PenLine,
        label: 'Compose Email',
        description: 'Write text, add attachments — like Gmail',
    },
    {
        id: 'template' as ContentMode,
        icon: LayoutTemplate,
        label: 'Use a Template',
        description: 'Pick a saved design from your library',
    },
];

export default function Step3Content({ data, updateData, onNext, onBack }: any) {
    const { token } = useAuth();
    const [mode, setMode] = useState<ContentMode>(data.contentMode || 'compose');
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [search, setSearch] = useState("");
    const [bodyText, setBodyText] = useState(data.bodyText || "");
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mode !== 'template' || !token) return;
        setLoadingTemplates(true);
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        fetch(`${API_BASE}/templates/`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : { data: [] })
            .then(json => setTemplates(Array.isArray(json.data) ? json.data : []))
            .catch(() => setTemplates([]))
            .finally(() => setLoadingTemplates(false));
    }, [mode, token]);

    const handleModeChange = (m: ContentMode) => {
        setMode(m);
        updateData({ contentMode: m, templateId: '', templateName: '', htmlContent: '', bodyText: '' });
        setBodyText('');
    };

    const handleBodyChange = (val: string) => {
        setBodyText(val);
        const html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#111;">${val.replace(/\n/g, '<br/>')}</div>`;
        updateData({ bodyText: val, htmlContent: html, contentMode: 'compose', templateName: 'Composed Email', attachments });
    };

    const handleTemplateSelect = (t: any) => {
        updateData({ templateId: t.id, templateName: t.name, htmlContent: t.compiled_html, contentMode: 'template' });
    };

    const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const updated = [...attachments, ...files].slice(0, 5);
        setAttachments(updated);
        updateData({ attachments: updated });
    };

    const removeFile = (idx: number) => {
        const updated = attachments.filter((_, i) => i !== idx);
        setAttachments(updated);
        updateData({ attachments: updated });
    };

    const canProceed = () => {
        if (mode === 'compose') return bodyText.trim().length > 10;
        if (mode === 'template') return !!data.templateId;
        return false;
    };

    const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={{ padding: '36px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PenLine size={18} color="#8B5CF6" />
                </div>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>Email Content</h2>
                    <p style={{ fontSize: '13px', color: '#71717A', margin: 0 }}>How do you want to write this campaign?</p>
                </div>
            </div>

            {/* Mode Toggle — 2 options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                {MODES.map(m => {
                    const Icon = m.icon;
                    const isActive = mode === m.id;
                    return (
                        <button
                            key={m.id}
                            onClick={() => handleModeChange(m.id)}
                            style={{
                                padding: '16px 18px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                                border: `1px solid ${isActive ? 'rgba(139, 92, 246, 0.5)' : 'rgba(63, 63, 70, 0.35)'}`,
                                background: isActive ? 'rgba(139, 92, 246, 0.08)' : 'rgba(24, 24, 27, 0.4)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Icon size={15} color={isActive ? '#8B5CF6' : '#71717A'} />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#FAFAFA' : '#A1A1AA' }}>{m.label}</span>
                                {isActive && (
                                    <span style={{ marginLeft: 'auto', width: '16px', height: '16px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Check size={10} color="white" />
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '11px', color: '#52525B', margin: 0 }}>{m.description}</p>
                        </button>
                    );
                })}
            </div>

            {/* ── COMPOSE MODE (plain text + optional file attach) ── */}
            {mode === 'compose' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#71717A', marginBottom: '7px' }}>Email Body</label>
                        <textarea
                            placeholder={"Hi {{first_name}},\n\nWrite your message here...\n\nBest regards,\nYour Team"}
                            value={bodyText}
                            onChange={e => handleBodyChange(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 14px',
                                background: 'rgba(9, 9, 11, 0.8)', border: '1px solid rgba(63, 63, 70, 0.4)',
                                borderRadius: '8px', color: '#FAFAFA', fontSize: '13px', outline: 'none',
                                resize: 'vertical', minHeight: '160px', lineHeight: '1.7', fontFamily: 'inherit'
                            }}
                        />
                        <p style={{ fontSize: '11px', color: '#52525B', marginTop: '5px' }}>
                            Use <code style={{ color: '#8B5CF6', background: 'rgba(139,92,246,0.1)', padding: '1px 5px', borderRadius: '3px' }}>{'{{first_name}}'}</code> &nbsp;
                            <code style={{ color: '#8B5CF6', background: 'rgba(139,92,246,0.1)', padding: '1px 5px', borderRadius: '3px' }}>{'{{last_name}}'}</code> for personalization
                        </p>
                    </div>

                    {/* Attachment Section */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#71717A', marginBottom: '7px' }}>
                            <Paperclip size={11} style={{ display: 'inline', marginRight: '4px' }} />
                            Attachments <span style={{ color: '#52525B' }}>(optional, max 5)</span>
                        </label>
                        <div
                            onClick={() => fileRef.current?.click()}
                            style={{
                                border: '1px dashed rgba(63, 63, 70, 0.4)', borderRadius: '8px', padding: '16px',
                                textAlign: 'center', cursor: 'pointer', background: 'rgba(9, 9, 11, 0.3)',
                                transition: 'border-color 0.2s ease'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(63, 63, 70, 0.4)')}
                        >
                            <Upload size={16} color="#52525B" style={{ margin: '0 auto 6px' }} />
                            <p style={{ color: '#71717A', fontSize: '12px', margin: 0 }}>Click to attach files — PDF, PNG, JPG, DOCX</p>
                            <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv"
                                onChange={handleFilePick} style={{ display: 'none' }} />
                        </div>

                        {attachments.length > 0 && (
                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {attachments.map((file, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: 'rgba(24,24,27,0.4)', border: '1px solid rgba(63,63,70,0.3)', borderRadius: '7px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Paperclip size={12} color="#8B5CF6" />
                                            <span style={{ fontSize: '12px', color: '#E4E4E7' }}>{file.name}</span>
                                            <span style={{ fontSize: '11px', color: '#52525B' }}>({(file.size / 1024).toFixed(0)} KB)</span>
                                        </div>
                                        <button onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525B', display: 'flex', padding: '2px' }}>
                                            <X size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TEMPLATE MODE ── */}
            {mode === 'template' && (
                <div>
                    <div style={{ position: 'relative', maxWidth: '340px', marginBottom: '14px' }}>
                        <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#52525B' }} />
                        <input type="text" placeholder="Search templates..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px 9px 32px', background: 'rgba(9,9,11,0.8)', border: '1px solid rgba(63,63,70,0.4)', borderRadius: '8px', color: '#FAFAFA', fontSize: '13px', outline: 'none' }}
                        />
                    </div>

                    {loadingTemplates ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <Loader2 size={24} color="#8B5CF6" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', border: '1px dashed rgba(63,63,70,0.35)', borderRadius: '10px' }}>
                            <LayoutTemplate size={26} color="#52525B" style={{ margin: '0 auto 10px' }} />
                            <p style={{ color: '#71717A', fontSize: '13px', marginBottom: '4px' }}>No templates found.</p>
                            <p style={{ color: '#52525B', fontSize: '12px' }}>Build one in <strong style={{ color: '#A1A1AA' }}>Templates → Editor</strong>, or switch to Compose mode.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                            {filtered.map(t => {
                                const isSelected = data.templateId === t.id;
                                return (
                                    <div key={t.id} onClick={() => handleTemplateSelect(t)}
                                        style={{ borderRadius: '8px', cursor: 'pointer', overflow: 'hidden', border: `1px solid ${isSelected ? 'rgba(139,92,246,0.5)' : 'rgba(63,63,70,0.3)'}`, background: isSelected ? 'rgba(139,92,246,0.08)' : 'rgba(24,24,27,0.4)', transition: 'all 0.2s', position: 'relative' }}
                                    >
                                        <div style={{ aspectRatio: '16/9', background: 'rgba(9,9,11,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <LayoutTemplate size={20} color="#52525B" />
                                            {isSelected && (
                                                <div style={{ position: 'absolute', top: '6px', right: '6px', width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Check size={10} color="white" />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '8px 10px' }}>
                                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#E4E4E7', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                                            <p style={{ fontSize: '10px', color: '#52525B', margin: '2px 0 0' }}>{new Date(t.updated_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(63, 63, 70, 0.3)' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#71717A', fontSize: '14px', cursor: 'pointer', padding: '8px 4px' }}>
                    ← Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!canProceed()}
                    className={canProceed() ? 'btn-premium' : ''}
                    style={!canProceed() ? { padding: '10px 20px', background: 'rgba(63,63,70,0.3)', border: '1px solid rgba(63,63,70,0.4)', borderRadius: '8px', color: '#52525B', fontSize: '14px', cursor: 'not-allowed' } : {}}
                >
                    Next Step →
                </button>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { FileText, Calendar } from "lucide-react";

export default function Step1Details({ data, updateData, onNext }: any) {
    const [errors, setErrors] = useState<any>({});

    const validate = () => {
        const e: any = {};
        if (!data.name.trim()) e.name = "Campaign name is required";
        if (!data.subject.trim()) e.subject = "Subject line is required";
        return e;
    };

    const handleNext = () => {
        const e = validate();
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        onNext();
    };

    const inputStyle = (hasError: boolean) => ({
        width: '100%',
        padding: '10px 14px',
        background: 'rgba(9, 9, 11, 0.8)',
        border: `1px solid ${hasError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(63, 63, 70, 0.4)'}`,
        borderRadius: '8px',
        color: '#FAFAFA',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
    });

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: 500,
        color: '#A1A1AA',
        marginBottom: '6px',
    };

    return (
        <div style={{ padding: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <FileText size={18} color="#3B82F6" />
                </div>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>Campaign Details</h2>
                    <p style={{ fontSize: '13px', color: '#71717A', margin: 0 }}>Set the name and subject line</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={labelStyle}>Campaign Name *</label>
                    <input
                        type="text"
                        placeholder="e.g. Summer Sale 2024"
                        value={data.name}
                        onChange={(e) => { updateData({ name: e.target.value }); setErrors((p: any) => ({ ...p, name: '' })); }}
                        style={inputStyle(!!errors.name)}
                    />
                    {errors.name && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{errors.name}</p>}
                </div>

                <div>
                    <label style={labelStyle}>Email Subject Line *</label>
                    <input
                        type="text"
                        placeholder="e.g. Don't miss our biggest sale of the year!"
                        value={data.subject}
                        onChange={(e) => { updateData({ subject: e.target.value }); setErrors((p: any) => ({ ...p, subject: '' })); }}
                        style={inputStyle(!!errors.subject)}
                    />
                    {errors.subject && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{errors.subject}</p>}
                    <p style={{ fontSize: '12px', color: '#52525B', marginTop: '4px' }}>This is what recipients will see in their inbox</p>
                </div>

                <div>
                    <label style={labelStyle}><Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />Schedule (optional)</label>
                    <input
                        type="datetime-local"
                        value={data.scheduledAt || ''}
                        onChange={(e) => updateData({ scheduledAt: e.target.value || null })}
                        style={{ ...inputStyle(false), colorScheme: 'dark' }}
                    />
                    <p style={{ fontSize: '12px', color: '#52525B', marginTop: '4px' }}>Leave empty to send immediately</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(63, 63, 70, 0.3)' }}>
                <button
                    onClick={handleNext}
                    className="btn-premium"
                >
                    Next Step →
                </button>
            </div>
        </div>
    );
}

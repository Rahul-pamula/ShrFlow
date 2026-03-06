"use client";

import { useState, useEffect } from "react";
import { Check, Users, Loader2, AlertCircle, FileSpreadsheet, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Step2Audience({ data, updateData, onNext, onBack }: any) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [totalContacts, setTotalContacts] = useState(0);
    const [batches, setBatches] = useState<any[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const [statsRes, batchRes] = await Promise.all([
                    fetch('http://127.0.0.1:8000/contacts/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://127.0.0.1:8000/contacts/batches', { headers: { 'Authorization': `Bearer ${token}` } }),
                ]);
                if (!statsRes.ok || !batchRes.ok) throw new Error("Failed to fetch audience data");

                const stats = await statsRes.json();
                const batchData = await batchRes.json();

                setTotalContacts(stats.total_contacts || 0);
                // Only show completed batches with at least 1 import
                setBatches((batchData.data || []).filter((b: any) => b.status === 'completed' && b.imported_count > 0));
            } catch (err) {
                setError("Could not load audience data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const select = (id: string, name: string) => {
        updateData({ listId: id, listName: name });
    };

    const AudienceCard = ({ id, name, count, subtitle, icon }: any) => {
        const isSelected = data.listId === id;
        return (
            <div
                onClick={() => select(id, name)}
                style={{
                    padding: '18px 20px', borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(63, 63, 70, 0.35)'}`,
                    background: isSelected ? 'rgba(59, 130, 246, 0.07)' : 'rgba(24, 24, 27, 0.4)',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(63, 63, 70, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {icon}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>{name}</h3>
                        <p style={{ fontSize: '12px', color: '#71717A', margin: '2px 0 0' }}>
                            <span style={{ color: isSelected ? '#60A5FA' : '#A1A1AA', fontWeight: 600 }}>
                                {count.toLocaleString()}
                            </span>
                            {' '}{subtitle}
                        </p>
                    </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                    {isSelected ? (
                        <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Check size={13} color="white" />
                        </div>
                    ) : (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(63,63,70,0.4)' }} />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '36px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Users size={18} color="#3B82F6" />
                </div>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>Select Audience</h2>
                    <p style={{ fontSize: '13px', color: '#71717A', margin: 0 }}>Choose who receives this campaign — all contacts or a specific import batch</p>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                    <Loader2 size={28} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : error ? (
                <div style={{ padding: '14px 16px', background: 'rgba(69, 10, 10, 0.3)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontSize: '13px' }}>
                    <AlertCircle size={15} /> {error}
                </div>
            ) : totalContacts === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed rgba(63, 63, 70, 0.4)', borderRadius: '10px' }}>
                    <Users size={32} color="#52525B" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: '#71717A', fontSize: '14px', marginBottom: '4px' }}>No contacts in your account yet.</p>
                    <p style={{ color: '#52525B', fontSize: '12px' }}>Go to <strong style={{ color: '#A1A1AA' }}>Contacts</strong> → Upload CSV first.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>

                    {/* === ALL CONTACTS === */}
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Entire List</p>
                    <AudienceCard
                        id="all"
                        name="All Contacts"
                        count={totalContacts}
                        subtitle="subscribers in your account"
                        icon={<Globe size={18} color={data.listId === 'all' ? '#3B82F6' : '#71717A'} />}
                    />

                    {/* === IMPORT BATCHES === */}
                    {batches.length > 0 && (
                        <>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 4px' }}>Import Batches</p>
                            {batches.map(batch => (
                                <AudienceCard
                                    key={batch.id}
                                    id={`batch:${batch.id}`}
                                    name={batch.file_name.replace(/\.[^.]+$/, '')}
                                    count={batch.imported_count}
                                    subtitle={`contacts · Imported ${new Date(batch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                    icon={<FileSpreadsheet size={18} color={data.listId === `batch:${batch.id}` ? '#3B82F6' : '#71717A'} />}
                                />
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(63, 63, 70, 0.3)' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#71717A', fontSize: '14px', cursor: 'pointer', padding: '8px 4px' }}>
                    ← Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!data.listId || totalContacts === 0}
                    className={data.listId && totalContacts > 0 ? 'btn-premium' : ''}
                    style={(!data.listId || totalContacts === 0) ? { padding: '10px 20px', background: 'rgba(63,63,70,0.3)', border: '1px solid rgba(63,63,70,0.4)', borderRadius: '8px', color: '#52525B', fontSize: '14px', cursor: 'not-allowed' } : {}}
                >
                    Next Step →
                </button>
            </div>
        </div>
    );
}

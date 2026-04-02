"use client";

import { useState, useEffect } from "react";
import {
    ChevronRight,
    Check,
    LayoutTemplate,
    Users,
    FileText,
    Send,
    Save,
    Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import Step1Details from "./Steps/Step1Details";
import Step2Audience from "./Steps/Step2Audience";
import Step3Content from "./Steps/Step3Content";
import Step4Review from "./Steps/Step4Review";
import { useAuth } from "@/context/AuthContext";

const steps = [
    { id: 1, title: "Details", icon: FileText },
    { id: 2, title: "Audience", icon: Users },
    { id: 3, title: "Content", icon: LayoutTemplate },
    { id: 4, title: "Review", icon: Send },
];

const STORAGE_KEY = "campaign_local_sessions";

type ContentMode = 'compose' | 'template';

const defaultData = {
    name: "", subject: "", listId: "", listName: "",
    templateId: "", templateName: "", htmlContent: "",
    bodyText: "", contentMode: "compose", scheduledAt: null, attachments: [],
    from_name: "", from_prefix: "", domain_id: "", domain_name: ""
};

interface Props {
    editCampaignId?: string | null;
    draftCampaignId?: string | null;
}

export default function CampaignWizard({ editCampaignId, draftCampaignId }: Props) {
    const { token } = useAuth();
    const router = useRouter();
    const [editId, setEditId] = useState<string | null>(editCampaignId || null);

    // Cleanly use props for initializers, NO side effects here!
    const [draftId] = useState(() => {
        if (typeof window === 'undefined') return null;
        if (editCampaignId) return null; // DB logic, don't use local storage
        return draftCampaignId || null;
    });

    const [currentStep, setCurrentStep] = useState(() => {
        if (typeof window === 'undefined') return 1;
        if (editCampaignId) return 1;
        if (!draftId) return 1;

        try {
            const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            return sessions[draftId]?.step ?? 1;
        } catch { return 1; }
    });

    const [campaignData, setCampaignData] = useState(() => {
        if (typeof window === 'undefined') return defaultData;
        if (editCampaignId) return defaultData;
        if (!draftId) return defaultData;

        try {
            const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            const existingData = sessions[draftId]?.data;
            if (existingData) return { ...defaultData, ...existingData };
            return defaultData;
        } catch { return defaultData; }
    });

    const [loadingDraft, setLoadingDraft] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);

    // Fetch existing campaign data when editing
    useEffect(() => {
        const loadDraft = async () => {
            if (!token || !editCampaignId) return;
            try {
                setLoadingDraft(true);
                const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const res = await fetch(`${API_BASE}/campaigns/${editCampaignId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) {
                    setLoadingDraft(false);
                    return;
                }
                const data = await res.json();
                const campaign = data.campaign || data;

                let text = campaign.body_html || "";
                let mode: ContentMode = "compose";

                // If it looks like our compose wrapper, strip it back to plain text
                if (text.startsWith('<div style="font-family:sans-serif;')) {
                    text = text.replace(/^<div[^>]*>/i, '').replace(/<\/div>$/i, '');
                    text = text.replace(/<br\s*\/?>/gi, '\n');
                } else if (text.includes('<html') || text.includes('<table')) {
                    // It's a full HTML template
                    mode = "template";
                }

                setCampaignData((prev: any) => ({
                    ...prev,
                    name: campaign.name || "",
                    subject: campaign.subject || "",
                    htmlContent: campaign.body_html || "",
                    bodyText: text,
                    contentMode: mode,
                    from_name: campaign.from_name || "",
                    from_prefix: campaign.from_prefix || "",
                    domain_id: campaign.domain_id || ""
                }));
                // Force step 1 and overwrite any garbage in localStorage from a previous session
                setCurrentStep(1);
                setEditId(editCampaignId);
            } catch (err) {
                console.error("Failed to load campaign for editing:", err);
            } finally {
                setLoadingDraft(false);
            }
        };
        loadDraft();
    }, [editCampaignId, token]);

    // Save to localStorage map on every step/data change ONLY IF we are purely local
    useEffect(() => {
        if (loadingDraft || !draftId) return;
        try {
            const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            sessions[draftId] = {
                step: currentStep,
                data: campaignData,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        } catch { }
    }, [currentStep, campaignData, loadingDraft, draftId]);

    const updateData = (data: any) => {
        setCampaignData((prev: any) => ({ ...prev, ...data }));
    };

    const nextStep = () => setCurrentStep((prev: number) => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep((prev: number) => Math.max(prev - 1, 1));

    const handleSaveDraftToDB = async () => {
        if (!token) return;
        try {
            setSavingDraft(true);
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const payload = {
                name: campaignData.name || "Untitled Draft",
                subject: campaignData.subject || "",
                body_html: campaignData.htmlContent || "",
                status: 'draft',
                from_name: campaignData.from_name || "",
                from_prefix: campaignData.from_prefix || "",
                domain_id: campaignData.domain_id || null // if empty string, backend should tolerate null
            };

            if (payload.domain_id === "") payload.domain_id = null as any;

            if (editId) {
                const res = await fetch(`${API_BASE}/campaigns/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const errorMsg = await res.json().catch(() => ({ detail: "Failed to update draft" }));
                    let parsedErr = errorMsg.detail;
                    if (Array.isArray(parsedErr)) parsedErr = parsedErr.map(e => `${e.loc?.join('.')} ${e.msg}`).join(', ');
                    else if (typeof parsedErr === 'object') parsedErr = JSON.stringify(parsedErr);

                    throw new Error(parsedErr || "Server rejected the draft update.");
                }
            } else {
                const res = await fetch(`${API_BASE}/campaigns/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const errorMsg = await res.json().catch(() => ({ detail: "Failed to create draft" }));
                    let parsedErr = errorMsg.detail;
                    if (Array.isArray(parsedErr)) parsedErr = parsedErr.map(e => `${e.loc?.join('.')} ${e.msg}`).join(', ');
                    else if (typeof parsedErr === 'object') parsedErr = JSON.stringify(parsedErr);

                    throw new Error(parsedErr || "Server rejected the new draft.");
                }
            }

            // Clean up the specific browser local storage UUID slot since it's now safely in the DB
            if (draftId) {
                try {
                    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
                    delete sessions[draftId];
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
                } catch { }
            }
            router.push('/campaigns');
            // Force a router refresh to bust Next.js cache so the new row appears immediately
            router.refresh();
        } catch (err: any) {
            console.error("Failed to save draft to DB:", err);
            alert(`Could not save draft to database: ${err.message || 'Unknown error. Please check if you have selected a Sender Domain.'}\n\nYour work is still saved securely in your browser session.`);
        } finally {
            setSavingDraft(false);
        }
    };



    if (loadingDraft) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
                <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                <p>Loading draft from database...</p>
            </div>
        );
    }

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1Details data={campaignData} updateData={updateData} onNext={nextStep} />;
            case 2: return <Step2Audience data={campaignData} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
            case 3: return <Step3Content data={campaignData} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
            case 4: return <Step4Review data={campaignData} onBack={prevStep} editId={editId} />;
            default: return null;
        }
    };

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px' }}>

            {/* Header / Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>{editId ? 'Edit Campaign Draft' : 'Create New Campaign'}</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Follow the steps to design and launch your email.</p>
                </div>
                <button
                    onClick={handleSaveDraftToDB}
                    disabled={savingDraft || (!campaignData.name && !campaignData.subject)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500,
                        cursor: (savingDraft || (!campaignData.name && !campaignData.subject)) ? 'not-allowed' : 'pointer',
                        opacity: (savingDraft || (!campaignData.name && !campaignData.subject)) ? 0.5 : 1,
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={e => { if (!savingDraft && (campaignData.name || campaignData.subject)) e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                    {savingDraft ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Draft & Exit
                </button>
            </div>

            {/* Step Progress Header */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    {/* Progress Bar Track */}
                    <div style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        width: '100%', height: '2px', background: 'var(--border)', zIndex: 0
                    }} />
                    {/* Active Progress Bar */}
                    <div style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        height: '2px', zIndex: 1, borderRadius: '2px',
                        background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                        width: `${((currentStep - 1) / 3) * 100}%`,
                        transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} />

                    {steps.map((step) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, background: 'var(--bg-primary)', padding: '0 12px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: isCompleted ? 'none' : `2px solid ${isActive ? '#3B82F6' : 'var(--border)'}`,
                                    background: isCompleted
                                        ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                                        : isActive
                                            ? 'rgba(59, 130, 246, 0.1)'
                                            : 'var(--bg-card)',
                                    color: isCompleted ? 'white' : isActive ? '#3B82F6' : 'var(--text-muted)',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isActive ? '0 0 20px rgba(59, 130, 246, 0.4)' : 'none'
                                }}>
                                    {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                                </div>
                                <span style={{
                                    marginTop: '8px', fontSize: '12px', fontWeight: 500,
                                    color: isActive ? '#3B82F6' : isCompleted ? 'var(--text-muted)' : 'var(--text-secondary)',
                                    transition: 'color 0.3s ease'
                                }}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content Card */}
            <div className="glass-panel" style={{ minHeight: '420px' }}>
                {renderStep()}
            </div>
        </div>
    );
}

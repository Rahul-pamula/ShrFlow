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
import { Button, PageHeader, SectionCard } from "@/components/ui";

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
            <div className="flex min-h-[400px] flex-col items-center justify-center text-[var(--text-muted)]">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-[var(--accent)]" />
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
        <div className="mx-auto max-w-[860px] space-y-8 px-4 py-8">
            <PageHeader
                title={editId ? 'Edit Campaign Draft' : 'Create New Campaign'}
                subtitle="Follow the steps to design, review, and launch your email."
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveDraftToDB}
                        disabled={savingDraft || (!campaignData.name && !campaignData.subject)}
                        isLoading={savingDraft}
                    >
                        {!savingDraft && <Save className="h-4 w-4" />}
                        Save Draft & Exit
                    </Button>
                }
            />

            {/* Step Progress Header */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-6 sm:px-6">
                <div className="relative flex items-center justify-between">
                    <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-[var(--border)]" />
                    <div
                        className="absolute left-0 top-1/2 z-[1] h-0.5 -translate-y-1/2 rounded-full bg-[var(--accent)] transition-all duration-300"
                        style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                    />

                    {steps.map((step) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="relative z-[2] flex flex-col items-center bg-[var(--bg-card)] px-2 sm:px-3">
                                <div
                                    className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
                                        isCompleted
                                            ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                            : isActive
                                                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] shadow-[0_0_20px_rgba(37,99,235,0.18)]'
                                                : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)]'
                                    }`}
                                >
                                    {isCompleted ? <Check className="h-4.5 w-4.5" /> : <Icon className="h-4.5 w-4.5" />}
                                </div>
                                <span className={`mt-2 text-xs font-medium transition-colors ${
                                    isActive ? 'text-[var(--accent)]' : isCompleted ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'
                                }`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content Card */}
            <SectionCard noPadding className="overflow-hidden">
                {renderStep()}
            </SectionCard>
        </div>
    );
}

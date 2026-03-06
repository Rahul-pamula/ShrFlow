"use client";

import { useState, useEffect } from "react";
import {
    ChevronRight,
    Check,
    LayoutTemplate,
    Users,
    FileText,
    Send
} from "lucide-react";
import Step1Details from "./Steps/Step1Details";
import Step2Audience from "./Steps/Step2Audience";
import Step3Content from "./Steps/Step3Content";
import Step4Review from "./Steps/Step4Review";

const steps = [
    { id: 1, title: "Details", icon: FileText },
    { id: 2, title: "Audience", icon: Users },
    { id: 3, title: "Content", icon: LayoutTemplate },
    { id: 4, title: "Review", icon: Send },
];

const STORAGE_KEY = "campaign_wizard_draft";

const defaultData = {
    name: "", subject: "", listId: "", listName: "",
    templateId: "", templateName: "", htmlContent: "",
    bodyText: "", contentMode: "compose", scheduledAt: null, attachments: []
};

export default function CampaignWizard() {
    const [currentStep, setCurrentStep] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").step ?? 1; }
        catch { return 1; }
    });
    const [campaignData, setCampaignData] = useState(() => {
        try { return { ...defaultData, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").data }; }
        catch { return defaultData; }
    });

    // Save to localStorage on every step/data change
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: currentStep, data: campaignData })); }
        catch { }
    }, [currentStep, campaignData]);

    const updateData = (data: any) => {
        setCampaignData((prev: any) => ({ ...prev, ...data }));
    };

    const nextStep = () => setCurrentStep((prev: number) => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep((prev: number) => Math.max(prev - 1, 1));


    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1Details data={campaignData} updateData={updateData} onNext={nextStep} />;
            case 2: return <Step2Audience data={campaignData} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
            case 3: return <Step3Content data={campaignData} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
            case 4: return <Step4Review data={campaignData} onBack={prevStep} />;
            default: return null;
        }
    };

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px' }}>

            {/* Step Progress Header */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    {/* Progress Bar Track */}
                    <div style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        width: '100%', height: '2px', background: 'rgba(63, 63, 70, 0.4)', zIndex: 0
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
                            <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, background: '#09090B', padding: '0 12px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: isCompleted ? 'none' : `2px solid ${isActive ? '#3B82F6' : 'rgba(63,63,70,0.5)'}`,
                                    background: isCompleted
                                        ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                                        : isActive
                                            ? 'rgba(59, 130, 246, 0.1)'
                                            : 'rgba(24, 24, 27, 0.6)',
                                    color: isCompleted ? 'white' : isActive ? '#3B82F6' : '#71717A',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isActive ? '0 0 20px rgba(59, 130, 246, 0.4)' : 'none'
                                }}>
                                    {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                                </div>
                                <span style={{
                                    marginTop: '8px', fontSize: '12px', fontWeight: 500,
                                    color: isActive ? '#3B82F6' : isCompleted ? '#A1A1AA' : '#52525B',
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

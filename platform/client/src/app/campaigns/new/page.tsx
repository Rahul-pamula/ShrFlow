"use client";

import CampaignWizard from "@/components/CampaignWizard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CampaignPageContent() {
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");
    const draftId = searchParams.get("draft_id");

    return (
        <div className="max-w-5xl mx-auto px-4 pt-0 pb-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Link
                    href="/campaigns"
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 leading-none mt-0">
                        {editId ? "Edit Campaign" : "Create New Campaign"}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {editId ? "Update your campaign details." : "Follow the steps to design and launch your email."}
                    </p>
                </div>
            </div>

            {/* Wizard Container */}
            <CampaignWizard editCampaignId={editId} draftCampaignId={draftId} />
        </div>
    );
}

export default function NewCampaignPage() {
    return (
        <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#71717A' }}>Loading...</div>}>
            <CampaignPageContent />
        </Suspense>
    );
}

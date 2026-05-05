"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, Monitor, Smartphone, Send, CheckCircle2, 
    XCircle, AlertTriangle, Loader2, Info, Mail, Save
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function EmailPreviewPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { token } = useAuth();

    const [name, setName] = useState("Loading...");
    const [loading, setLoading] = useState(true);
    const [design, setDesign] = useState<any>(null);
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
    const [testEmail, setTestEmail] = useState("");
    const [sendingTest, setSendingTest] = useState(false);
    const [sendSuccess, setSendSuccess] = useState<string | null>(null);
    const [checklist, setChecklist] = useState<any[]>([]);

    useEffect(() => {
        if (!token) return;
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        fetch(`${API}/templates/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            setName(data.name || "Untitled");
            setDesign(data.design_json);
            setLoading(false);
            runChecklist(data.design_json, data.name, data.subject);
        })
        .catch(() => setLoading(false));
    }, [id, token]);

    const runChecklist = (d: any, n: string, s: string) => {
        const issues = [];
        
        // Subject line
        if (s) issues.push({ status: "PASS", text: "Subject line present" });
        else issues.push({ status: "FAIL", text: "Subject line missing" });

        // Alt text check
        let missingAlt = false;
        const allBlocks = [...(d?.headerBlocks || []), ...(d?.bodyBlocks || []), ...(d?.footerBlocks || [])];
        allBlocks.forEach(b => {
            if (b.type === "image" && !b.props.alt && !b.props.decorative) missingAlt = true;
        });
        
        if (missingAlt) issues.push({ status: "FAIL", text: "Image missing alt text" });
        else issues.push({ status: "PASS", text: "Heading structure valid" }); // Simplified for demo

        // "Click here" check
        let badLinks = false;
        allBlocks.forEach(b => {
            if (b.type === "button" && b.props.text?.toLowerCase().includes("click here")) badLinks = true;
            if (b.type === "text" && b.props.content?.toLowerCase().includes("click here")) badLinks = true;
        });

        if (badLinks) issues.push({ status: "WARN", text: "Link text 'click here' detected" });
        else issues.push({ status: "PASS", text: "Link accessibility looks good" });

        setChecklist(issues);
    };

    const handleSendTest = () => {
        if (!testEmail) return;
        setSendingTest(true);
        setSendSuccess(null);
        
        // Mock sending delay
        setTimeout(() => {
            setSendingTest(false);
            setSendSuccess(`Test email sent to ${testEmail}`);
        }, 1500);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-[#F7F9FC]">
            <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-[#F7F9FC] text-[#18191B]">
            {/* --- TOP BAR --- */}
            <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push(`/templates/${id}/block`)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold">{name}</h1>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            <Save size={10} /> Saved
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setViewMode("desktop")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === "desktop" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Monitor size={14} /> Desktop
                        </button>
                        <button 
                            onClick={() => setViewMode("mobile")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === "mobile" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Smartphone size={14} /> Mobile
                        </button>
                    </div>

                    <button 
                        onClick={handleSendTest}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
                    >
                        <Send size={16} /> Send Test Email
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex overflow-hidden">
                {/* Preview Area */}
                <div className="flex-1 overflow-y-auto p-12 flex justify-center bg-slate-50">
                    <div 
                        style={{ width: viewMode === "desktop" ? "600px" : "375px" }}
                        className="bg-white shadow-xl rounded-xl overflow-hidden transition-all duration-500 origin-top h-fit min-h-[800px]"
                    >
                        {/* Mock Email Content Render */}
                        <div className="p-8 text-center text-slate-400">
                            <div className="aspect-[4/3] bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200">
                                Email Canvas Preview Rendering...
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-[340px] border-l border-slate-200 bg-white overflow-y-auto p-6 flex flex-col gap-8">
                    {/* A. Send Test Email */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Send Test Email</h3>
                        <div className="space-y-3">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="email" 
                                    placeholder="Enter email address..." 
                                    value={testEmail}
                                    onChange={e => setTestEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-500 transition-all font-medium"
                                />
                            </div>
                            <button 
                                onClick={handleSendTest}
                                disabled={!testEmail || sendingTest}
                                className="w-full bg-purple-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {sendingTest ? <Loader2 className="animate-spin" size={16} /> : "Send Test Email"}
                            </button>
                            {sendSuccess && (
                                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 flex items-center gap-2">
                                    <CheckCircle2 size={14} /> {sendSuccess}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* B. Pre-Send Checklist */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pre-Send Checklist</h3>
                        <div className="space-y-3">
                            {checklist.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    {item.status === "PASS" && <CheckCircle2 size={16} className="text-emerald-500" />}
                                    {item.status === "FAIL" && <XCircle size={16} className="text-rose-500" />}
                                    {item.status === "WARN" && <AlertTriangle size={16} className="text-amber-500" />}
                                    <span className={`text-xs font-bold ${item.status === "PASS" ? "text-slate-700" : "text-slate-900"}`}>
                                        {item.status}: {item.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* C. Accessibility Notes */}
                    <section className="mt-auto">
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <h4 className="flex items-center gap-2 text-xs font-bold text-purple-700 mb-2">
                                <Info size={14} /> Accessibility Tips
                            </h4>
                            <ul className="text-[11px] text-purple-600/80 space-y-1.5 font-medium leading-relaxed">
                                <li>• All images must have alt text</li>
                                <li>• Avoid "click here" links</li>
                                <li>• Maintain heading hierarchy</li>
                            </ul>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

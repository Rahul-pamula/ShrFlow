"use client";
import React from "react";
import { ArrowLeft, Monitor, Smartphone, Undo2, Redo2, Eye, Save, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface BuilderTopBarProps {
    name: string;
    setName: (val: string) => void;
    viewMode: "desktop" | "mobile";
    setViewMode: (val: "desktop" | "mobile") => void;
    undo: () => void;
    redo: () => void;
    history: any[];
    future: any[];
    compileForPreview: () => void;
    handleSave: () => void;
    saving: boolean;
    saveSuccess: boolean;
    onCreateNew: () => void;
}

export const BuilderTopBar = ({
    name, setName, viewMode, setViewMode, undo, redo, history, future, compileForPreview, handleSave, saving, saveSuccess, onCreateNew
}: BuilderTopBarProps) => {
    const router = useRouter();
    const iconBtn = {
        padding: "8px",
        borderRadius: "8px",
        border: "1px solid #E2E8F0",
        background: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s"
    };

    return (
        <div style={{
            height: 64, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between",
            padding: "0 24px", background: "#ffffff", borderBottom: "1px solid #E2E8F0", flexShrink: 0, zIndex: 50,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button onClick={() => router.push("/templates")} style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "8px 12px", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                    <ArrowLeft size={16} /> <span>Back</span>
                </button>
                <div style={{ width: 1, height: 24, background: "#E2E8F0" }} />
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input value={name} onChange={e => setName(e.target.value)} style={{ border: "none", fontSize: 16, fontWeight: 600, color: "#0F172A", outline: "none", background: "transparent", width: 260 }} />
                    <button 
                        onClick={onCreateNew}
                        title="Create New Blank Template"
                        style={{
                            width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E8F0",
                            background: "#F8FAFC", color: "#6366F1", display: "flex",
                            alignItems: "center", justifyContent: "center", cursor: "pointer",
                            transition: "all 0.2s", marginLeft: 8
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#6366F1"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#6366F1"; }}
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                {(["desktop", "mobile"] as const).map(m => (
                    <button key={m} onClick={() => setViewMode(m)} style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                        background: viewMode === m ? "#fff" : "transparent", color: viewMode === m ? "#0F172A" : "#64748B",
                        boxShadow: viewMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s ease",
                    }}>{m === "desktop" ? <Monitor size={16} /> : <Smartphone size={16} />} {m.charAt(0).toUpperCase() + m.slice(1)}</button>
                ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={undo} disabled={!history.length} style={{ ...iconBtn, color: history.length ? "#64748B" : "#CBD5E1" }}><Undo2 size={18} /></button>
                <button onClick={redo} disabled={!future.length} style={{ ...iconBtn, color: future.length ? "#64748B" : "#CBD5E1" }}><Redo2 size={18} /></button>
                <div style={{ width: 1, height: 24, background: "#E2E8F0", margin: "0 8px" }} />
                <button onClick={compileForPreview} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}><Eye size={16} /> Preview</button>
                <button onClick={handleSave} disabled={saving} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", border: "none", borderRadius: 10,
                    background: "#6366F1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
                    opacity: saving ? 0.8 : 1, transition: "all 0.15s ease", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                }}>
                    <Save size={16} /> {saving ? "Saving…" : saveSuccess ? "Changes Saved!" : "Save Changes"}
                </button>
            </div>
        </div>
    );
};

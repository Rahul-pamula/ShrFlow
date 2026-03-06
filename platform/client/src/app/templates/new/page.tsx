"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeft, Layout, Loader2 } from "lucide-react";

const API_BASE = "http://localhost:8000";

// ── Starter design JSON (empty canvas with one row) ────────────────────────
const EMPTY_DESIGN = {
    theme: {
        background: "#f3f4f6",
        contentWidth: 600,
        fontFamily: "Arial, sans-serif",
        primaryColor: "#4f46e5",
    },
    rows: [
        {
            id: "row-1",
            settings: { backgroundColor: "#ffffff", paddingTop: 30, paddingBottom: 30 },
            columns: [
                {
                    id: "col-1",
                    width: 100,
                    blocks: [
                        { id: "blk-1", type: "text", props: { content: "Start editing your email here…", fontSize: 16, align: "center", color: "#6B7280" } },
                    ],
                },
            ],
        },
    ],
};

export default function NewTemplatePage() {
    const { token, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const res = await fetch(`${API_BASE}/templates`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Untitled Template",
                    subject: "",
                    category: "marketing",
                    design_json: EMPTY_DESIGN,
                    compiled_html: "<p>Loading…</p>",
                    template_type: "block",
                    schema_version: "2.0.0",
                }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/templates/${data.id}/block`);
            } else {
                alert("Failed to create template");
            }
        } catch (err) {
            console.error(err);
            alert("Error creating template");
        } finally {
            setCreating(false);
        }
    };

    const colors = {
        primary: "#4f46e5",
        bg: "#0A0A0B",
        text: "#F3F4F6",
        textSecondary: "#9CA3AF",
        border: "#374151",
        cardBg: "#111113",
    };

    if (authLoading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#666" }}><Loader2 size={24} /></div>;

    return (
        <div style={{ maxWidth: "600px", margin: "60px auto", fontFamily: "Inter, sans-serif", padding: "0 20px" }}>
            <button
                onClick={() => router.back()}
                style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: colors.textSecondary, marginBottom: 24 }}
            >
                <ChevronLeft size={16} /> Back
            </button>

            <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(79,70,229,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Layout size={28} color={colors.primary} />
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 10, color: colors.text }}>Create New Template</h1>
                <p style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
                    Build beautiful, responsive emails with our structured drag &amp; drop editor. Add rows, columns, and content blocks visually.
                </p>
            </div>

            <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    width: "100%", padding: "16px 32px",
                    background: `linear-gradient(135deg, ${colors.primary}, #7c3aed)`,
                    color: "#fff", border: "none", borderRadius: 10,
                    fontSize: 16, fontWeight: 600, cursor: creating ? "default" : "pointer",
                    opacity: creating ? 0.7 : 1, transition: "opacity 0.2s",
                }}
            >
                {creating ? <><Loader2 size={18} /> Creating…</> : "Create & Open Editor"}
            </button>

            <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#4B5563" }}>
                Row → Column → Block structured editor with live preview
            </p>
        </div>
    );
}

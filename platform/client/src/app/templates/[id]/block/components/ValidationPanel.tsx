"use client";

import React from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { AlertCircle, CheckCircle2, Info, ChevronRight } from "lucide-react";

export function ValidationPanel() {
    const { validationErrors, selectNode, design } = useEditorStore();
    
    const allBlocks = [...design.headerBlocks, ...design.bodyBlocks, ...design.footerBlocks];
    const errorCount = Object.keys(validationErrors).reduce((acc, id) => acc + validationErrors[id].length, 0);
    const hasErrors = errorCount > 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>
            <div style={{ padding: 20, borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    {hasErrors ? (
                        <AlertCircle size={20} style={{ color: "#EF4444" }} />
                    ) : (
                        <CheckCircle2 size={20} style={{ color: "#10B981" }} />
                    )}
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                        {hasErrors ? "Action Required" : "Ready to Send"}
                    </h3>
                </div>
                <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                    {hasErrors 
                        ? `Found ${errorCount} issue${errorCount > 1 ? "s" : ""} to fix before sending.`
                        : "Your email looks great and is ready for delivery."}
                </p>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                {hasErrors ? (
                    Object.entries(validationErrors).map(([blockId, errors]) => {
                        const block = allBlocks.find(b => b.id === blockId);
                        return (
                            <div key={blockId} style={{ marginBottom: 12 }}>
                                <div 
                                    onClick={() => selectNode({ type: "block", id: blockId })}
                                    style={{
                                        padding: "12px",
                                        borderRadius: 12,
                                        border: "1px solid #FEE2E2",
                                        background: "#FEF2F2",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = "#FCA5A5"}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = "#FEE2E2"}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", textTransform: "uppercase" }}>
                                            {block?.type || "Unknown"} Block
                                        </span>
                                        <ChevronRight size={14} style={{ color: "#FCA5A5" }} />
                                    </div>
                                    {errors.map((err, i) => (
                                        <div key={i} style={{ fontSize: 13, color: "#B91C1C", display: "flex", gap: 6, marginBottom: 4 }}>
                                            <div style={{ marginTop: 3 }}>•</div>
                                            <span>{err}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{ 
                            width: 56, height: 56, borderRadius: "50%", background: "#ECFDF5", 
                            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" 
                        }}>
                            <CheckCircle2 size={28} style={{ color: "#10B981" }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>No issues found</div>
                        <div style={{ fontSize: 12, color: "#94A3B8" }}>We checked links, alt text, and design best practices.</div>
                    </div>
                )}
            </div>

            <div style={{ padding: 16, borderTop: "1px solid #F1F5F9", background: "#F8FAFC" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Info size={14} style={{ color: "#6366F1", marginTop: 2, flexShrink: 0 }} />
                    <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                        Validation runs automatically as you edit. Some checks require a final pre-send scan.
                    </div>
                </div>
            </div>
        </div>
    );
}

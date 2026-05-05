"use client";
import React from "react";
import { GripVertical } from "lucide-react";

export const SectionLabel = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
    <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, ...style }}>
        {children}
        <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
    </div>
);

export const FormGroup = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
    <div style={{ marginBottom: 20, ...style }}>{children}</div>
);

export const Label = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8, ...style }}>{children}</div>
);

export const TabsContainer = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
    <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 20, ...style }}>
        {children}
    </div>
);

export const Tab = ({ active, onClick, children, style }: { active: boolean, onClick: () => void, children: React.ReactNode, style?: React.CSSProperties }) => (
    <button
        onClick={onClick}
        style={{
            flex: 1, padding: "8px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s",
            background: active ? "#fff" : "transparent",
            color: active ? "#0F172A" : "#64748B",
            boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            ...style
        }}
    >
        {children}
    </button>
);

export const DraggableItem = ({ type, label, icon, props, children, restriction, onClick }: { type: string; label?: string; icon?: React.ReactNode; props?: any; children?: React.ReactNode, restriction?: string; onClick?: () => void }) => (
    <div
        draggable
        onDragStart={e => {
            e.dataTransfer.setData("blockType", type);
            if (props) e.dataTransfer.setData("blockProps", JSON.stringify(props));
            if (restriction) {
                e.dataTransfer.setData("restriction", restriction);
                e.dataTransfer.setData("x-restriction/" + restriction, "true");
            }
        }}
        onClick={onClick}
        className="block-card"
        style={{
            background: "#ffffff", borderRadius: 12, border: "1px solid #F1F5F9",
            cursor: onClick ? "pointer" : "grab", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)", color: "#475569",
            overflow: "hidden"
        }}
    >
        {children ? children : (
            <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8, background: "#F1F5F9", color: "#6366F1",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>{icon}</div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#334155", textAlign: "left" }}>{label}</div>
                <GripVertical size={14} style={{ color: "#CBD5E1" }} />
            </div>
        )}
    </div>
);

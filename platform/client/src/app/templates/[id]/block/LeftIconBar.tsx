"use client";
import React from "react";
import { LayoutTemplate, Shapes, Type, Palette, UploadCloud, Folder, Sparkles, Mail, Tag, ShieldCheck } from "lucide-react";

interface LeftIconBarProps {
    activeSidebarTab: string;
    setActiveSidebarTab: (val: string) => void;
}

export const LeftIconBar = ({ activeSidebarTab, setActiveSidebarTab }: LeftIconBarProps) => {
    const tabs = [
        { id: "design", icon: <LayoutTemplate size={24} strokeWidth={1.5} />, label: "Templates" },
        { id: "elements", icon: <Shapes size={24} strokeWidth={1.5} />, label: "Elements" },
        { id: "brand", icon: <Palette size={24} strokeWidth={1.5} />, label: "Brand" },
        { id: "uploads", icon: <UploadCloud size={24} strokeWidth={1.5} />, label: "Uploads" },
        { id: "tokens", icon: <Tag size={24} strokeWidth={1.5} />, label: "Tokens" },
        { id: "check", icon: <ShieldCheck size={24} strokeWidth={1.5} />, label: "Check" },
        { id: "ai", icon: <Sparkles size={24} strokeWidth={1.5} />, label: "AI" },
    ];

    return (
        <div style={{
            width: 72, background: "#FFFFFF", display: "flex", flexDirection: "column",
            alignItems: "center", padding: "16px 0", gap: 4, flexShrink: 0, zIndex: 60,
            borderRight: "1px solid #E4E4E7"
        }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "linear-gradient(135deg, #00C4CC 0%, #7D2AE8 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, cursor: "pointer", boxShadow: "0 4px 12px rgba(125, 42, 232, 0.2)" }}>
                <Mail size={22} color="#fff" />
            </div>

            {tabs.map(tab => {
                const isActive = activeSidebarTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSidebarTab(tab.id)}
                        style={{
                            width: "60px", height: 60, display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center", border: "none",
                            background: isActive ? "#F4F4F5" : "transparent", cursor: "pointer", gap: 6,
                            borderRadius: 8, transition: "background 0.15s ease",
                            color: isActive ? "#7D2AE8" : "#52525B",
                        }}
                        onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.background = "#F4F4F5";
                            e.currentTarget.style.color = isActive ? "#7D2AE8" : "#18191B";
                        }}
                        onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = isActive ? "#7D2AE8" : "#52525B";
                        }}
                    >
                        {tab.icon}
                        <div style={{ fontSize: 10, fontWeight: isActive ? 600 : 500 }}>{tab.label}</div>
                    </button>
                )
            })}
        </div>
    );
};

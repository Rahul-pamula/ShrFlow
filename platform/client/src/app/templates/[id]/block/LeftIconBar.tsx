"use client";
import React from "react";
import { Home, Shapes, Folder, Layout as LayoutIcon, Palette, Sparkles, MoreHorizontal, Mail } from "lucide-react";

interface LeftIconBarProps {
    activeSidebarTab: string;
    setActiveSidebarTab: (val: string) => void;
}

export const LeftIconBar = ({ activeSidebarTab, setActiveSidebarTab }: LeftIconBarProps) => {
    const tabs = [
        { id: "home", icon: <Home size={22} />, label: "HOME" },
        { id: "projects", icon: <Folder size={22} />, label: "PROJECTS" },
        { id: "templates", icon: <LayoutIcon size={22} />, label: "TEMPLATES" },
        { id: "brand", icon: <Palette size={22} />, label: "BRAND" },
        { id: "ai", icon: <Sparkles size={22} />, label: "AI" },
    ];

    return (
        <div style={{
            width: 80, background: "#0F172A", display: "flex", flexDirection: "column",
            alignItems: "center", padding: "20px 0", gap: 12, flexShrink: 0, zIndex: 60
        }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, cursor: "pointer", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)" }}>
                <Mail size={22} color="#fff" />
            </div>

            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveSidebarTab(tab.id)}
                    style={{
                        width: "100%", height: 72, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", border: "none",
                        background: "transparent", cursor: "pointer", gap: 4,
                        transition: "all 0.2s ease",
                        color: activeSidebarTab === tab.id ? "#fff" : "#94A3B8",
                        position: "relative"
                    }}
                >
                    {activeSidebarTab === tab.id && (
                        <div style={{ position: "absolute", left: 0, width: 4, height: 32, background: "#6366F1", borderRadius: "0 4px 4px 0" }} />
                    )}
                    {tab.icon}
                    <div style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>{tab.label}</div>
                </button>
            ))}

            <div style={{ flex: 1 }} />

            <button
                onClick={() => setActiveSidebarTab("more")}
                style={{
                    width: "100%", height: 72, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", border: "none",
                    background: "transparent", cursor: "pointer", gap: 4,
                    color: activeSidebarTab === "more" ? "#fff" : "#94A3B8"
                }}
            >
                <MoreHorizontal size={22} />
                <div style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>MORE</div>
            </button>
        </div>
    );
};

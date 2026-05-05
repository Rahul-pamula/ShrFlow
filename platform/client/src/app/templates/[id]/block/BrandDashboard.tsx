"use client";
import React, { useState, useRef } from "react";
import { Plus, Check, Search, Trash2, Palette, Type, Image as ImageIcon, LayoutTemplate, BookOpen, Settings, Lock, Upload, Copy, Download, Sparkles, X, ChevronDown } from "lucide-react";
import { BrandKit, BrandColor, BrandTypography, BrandAsset, BrandComponent, BrandGuidelines, uid, clone } from "./types";
import { DEFAULT_BRAND_KITS } from "./types";

const PRESET_COLORS = [
    "#EF4444", "#F97316", "#F59E0B", "#84CC16", "#22C55E", "#10B981", 
    "#14B8A6", "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", 
    "#A855F7", "#D946EF", "#F43F5E", "#0F172A", "#64748B", "#FFFFFF"
];

const FormGroup = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => <div style={{ marginBottom: 20, ...style }}>{children}</div>;
const Label = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8, ...style }}>{children}</div>;

const ComponentMiniPreview = ({ block }: { block: any }) => {
    // Basic recursion to find meaningful preview content
    const findPreviewItems = (b: any): any[] => {
        if (!b) return [];
        if (b.type === "image") return [b];
        if (b.type === "button") return [b];
        if (b.type === "text" && b.props.content?.includes("h1")) return [b];
        if (b.type === "layout") {
            return b.props.columns?.flatMap((c: any) => c.blocks?.flatMap(findPreviewItems)) || [];
        }
        return [];
    };

    const items = findPreviewItems(block).slice(0, 3);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", width: "100%", padding: 12 }}>
            {items.map((item, i) => (
                <div key={i} style={{ width: "100%", textAlign: "center" }}>
                    {item.type === "image" && (
                        <img src={item.props.src} alt="" style={{ maxHeight: 40, maxWidth: "80%", objectFit: "contain", borderRadius: 4 }} />
                    )}
                    {item.type === "text" && (
                        <div style={{ fontSize: 10, fontWeight: 800, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.props.content.replace(/<[^>]*>/g, '')}
                        </div>
                    )}
                    {item.type === "button" && (
                        <div style={{ padding: "4px 12px", background: "#4F46E5", color: "#fff", borderRadius: 4, fontSize: 8, fontWeight: 700, display: "inline-block" }}>
                            {item.props.text}
                        </div>
                    )}
                </div>
            ))}
            {items.length === 0 && <LayoutTemplate size={32} color="#CBD5E1" />}
        </div>
    );
};

interface BrandDashboardProps {
    brandKits: BrandKit[];
    setBrandKits: React.Dispatch<React.SetStateAction<BrandKit[]>>;
    activeBrandId: string;
    setActiveBrandId: (id: string) => void;
    applyBrandToDesign: () => void;
    setActiveSidebarTab: (tab: string) => void;
    onUseComponent?: (component: BrandComponent) => void;
    mode?: "fullscreen" | "sidebar";
}

export const BrandDashboard = ({
    brandKits, setBrandKits, activeBrandId, setActiveBrandId, applyBrandToDesign, setActiveSidebarTab, onUseComponent, mode = "fullscreen"
}: BrandDashboardProps) => {
    const [activeTab, setActiveTab] = useState<"colors" | "typography" | "assets" | "components" | "guidelines" | "settings">("assets");
    const [previewComponent, setPreviewComponent] = useState<BrandComponent | null>(null);
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [openPicker, setOpenPicker] = useState<{id: string, group?: "Primary" | "Secondary" | "Accent"} | null>(null);
    const [showSaveMessage, setShowSaveMessage] = useState(false);
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const [newBrandName, setNewBrandName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const activeBrand = brandKits.find(b => b.id === activeBrandId) || brandKits[0];

    const handleApply = () => {
        applyBrandToDesign();
        setActiveSidebarTab("projects");
    };

    const handleSavePalette = () => {
        setShowSaveMessage(true);
        setTimeout(() => setShowSaveMessage(false), 3000);
    };

    const updateActiveBrand = (updater: (brand: BrandKit) => BrandKit) => {
        setBrandKits(prev => prev.map(b => b.id === activeBrandId ? updater(b) : b));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target?.result as string;
            const newAsset: BrandAsset = {
                id: uid(),
                name: file.name.split('.')[0],
                url: url,
                type: "image",
                variant: "primary",
                suggestedFor: ["body"]
            };
            updateActiveBrand(b => ({
                ...b,
                assets: [newAsset, ...b.assets]
            }));
        };
        reader.readAsDataURL(file);
    };

    const addColor = (group: "Primary" | "Secondary" | "Accent", hex: string = "#000000") => {
        updateActiveBrand(b => ({
            ...b,
            colors: [...b.colors, { id: uid(), name: `New ${group}`, hex, group }]
        }));
    };

    const updateColor = (id: string, hex: string) => {
        updateActiveBrand(b => ({
            ...b,
            colors: b.colors.map(c => c.id === id ? { ...c, hex } : c)
        }));
    };

    const removeColor = (id: string) => {
        updateActiveBrand(b => ({
            ...b,
            colors: b.colors.filter(c => c.id !== id)
        }));
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeBrand, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${activeBrand.name.toLowerCase().replace(/\s+/g, '-')}-brand-kit.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        setShowSaveMessage(true);
        setTimeout(() => setShowSaveMessage(false), 3000);
    };

    const handleDuplicate = () => {
        const newBrand = {
            ...clone(activeBrand),
            id: uid(),
            name: `${activeBrand.name} (Copy)`
        };
        setBrandKits(prev => [...prev, newBrand]);
        setActiveBrandId(newBrand.id);
        
        setShowSaveMessage(true);
        setTimeout(() => setShowSaveMessage(false), 3000);
    };

    const ColorGroup = ({ title, group }: { title: string, group: "Primary" | "Secondary" | "Accent" }) => (
        <div style={{ marginBottom: mode === "sidebar" ? 16 : 32 }}>
            <div style={{ fontSize: mode === "sidebar" ? 11 : 13, fontWeight: 900, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: mode === "sidebar" ? 8 : 16 }}>{title}</div>
            <div style={{ display: "flex", gap: mode === "sidebar" ? 8 : 16, flexWrap: "wrap" }}>
                {activeBrand.colors.filter(c => c.group === group).map(color => (
                    <div key={color.id} className="color-swatch" style={{ width: mode === "sidebar" ? 40 : 80, position: "relative" }}>
                        <div 
                            draggable
                            onDragStart={e => {
                                e.dataTransfer.setData("styleType", "color");
                                e.dataTransfer.setData("value", color.hex);
                            }}
                            onClick={() => setOpenPicker(openPicker?.id === color.id ? null : { id: color.id, group })}
                            style={{ 
                                width: mode === "sidebar" ? 40 : 80, 
                                height: mode === "sidebar" ? 40 : 80, 
                                borderRadius: 8, 
                                background: color.hex, 
                                border: "1px solid #E2E8F0", 
                                marginBottom: mode === "sidebar" ? 0 : 8, 
                                position: "relative", 
                                cursor: "grab" 
                            }}
                        >
                            {mode !== "sidebar" && (
                                <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeColor(color.id); setOpenPicker(null); }} 
                                    style={{ position: "absolute", top: -8, right: -8, background: "#EF4444", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                        {openPicker?.id === color.id && (
                            <div style={{ position: "absolute", top: 90, left: 0, width: 204, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 50, display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {PRESET_COLORS.map(pc => (
                                    <div key={pc} onClick={() => { updateColor(color.id, pc); setOpenPicker(null); }} style={{ width: 24, height: 24, borderRadius: 4, background: pc, cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)" }} />
                                ))}
                                <div style={{ width: "100%", height: 1, background: "#F1F5F9", margin: "4px 0" }} />
                                <input type="text" value={color.hex} onChange={e => updateColor(color.id, e.target.value)} style={{ width: "100%", padding: "6px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #E2E8F0", outline: "none", fontFamily: "monospace" }} />
                            </div>
                        )}
                    </div>
                ))}
                <div style={{ position: "relative" }}>
                    <div 
                        onClick={() => setOpenPicker(openPicker?.id === `new-${group}` ? null : { id: `new-${group}`, group })}
                        style={{ width: mode === "sidebar" ? 40 : 80, height: mode === "sidebar" ? 40 : 80, borderRadius: 8, border: "2px dashed #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#F8FAFC", color: "#94A3B8", transition: "all 0.2s" }}
                    >
                        <Plus size={mode === "sidebar" ? 16 : 24} />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", height: mode === "sidebar" ? "100%" : "100vh", background: mode === "sidebar" ? "#fff" : "#F1F5F9", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── MINIMALIST HEADER ── */}
            {mode === "fullscreen" && (
                <div style={{ height: 64, background: "#fff", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                            <Palette size={18} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>{activeBrand.name}</div>
                            <div style={{ padding: "2px 8px", background: "#EEF2FF", borderRadius: 6, fontSize: 10, fontWeight: 800, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.02em" }}>Brand Kit</div>
                        </div>
                        <div style={{ width: 1, height: 24, background: "#E2E8F0", margin: "0 8px" }} />
                        <div style={{ position: "relative" }}>
                            <select 
                                value={activeBrandId}
                                onChange={e => setActiveBrandId(e.target.value)}
                                style={{ 
                                    padding: "8px 36px 8px 12px", borderRadius: 10, border: "1px solid #E2E8F0", 
                                    background: "#F8FAFC", fontSize: 13, fontWeight: 700, color: "#475569", 
                                    appearance: "none", cursor: "pointer", outline: "none", transition: "all 0.2s"
                                }}
                            >
                                {brandKits.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <Settings size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94A3B8" }} />
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button 
                            onClick={handleDuplicate}
                            title="Duplicate Identity"
                            style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                            className="header-tool-btn"
                        ><Copy size={18} /></button>
                        <button 
                            onClick={handleExport}
                            title="Export Brand JSON"
                            style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                            className="header-tool-btn"
                        ><Download size={18} /></button>
                        <div style={{ width: 1, height: 28, background: "#E2E8F0", margin: "0 8px" }} />
                        <button 
                            onClick={() => { setNewBrandName(""); setShowNamePrompt(true); }}
                            style={{ padding: "10px 20px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                        >
                            <Plus size={16} /> New Identity
                        </button>
                        <button 
                            onClick={handleApply}
                            style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: "#6366F1", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)", transition: "all 0.2s" }}
                        >
                            Apply to Design
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                
                {/* ── LEFT SIDEBAR (NAVIGATION) ── */}
                {mode === "fullscreen" && (
                    <div style={{ width: 260, background: "#fff", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", padding: "24px 16px" }}>
                        <div style={{ padding: "0 8px 16px", fontSize: 11, fontWeight: 900, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em" }}>My Organizations</div>
                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                            {brandKits.map(b => (
                                <div 
                                    key={b.id} 
                                    onClick={() => setActiveBrandId(b.id)}
                                    style={{ 
                                        padding: "10px 12px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                                        background: activeBrandId === b.id ? "#F5F3FF" : "transparent",
                                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        position: "relative"
                                    }}
                                    className="brand-nav-item"
                                >
                                    {activeBrandId === b.id && <div style={{ position: "absolute", left: 0, top: 12, bottom: 12, width: 3, background: "#6366F1", borderRadius: "0 4px 4px 0" }} />}
                                    <div style={{ 
                                        width: 32, height: 32, borderRadius: 8, 
                                        background: b.colors[0]?.hex || "#E2E8F0", 
                                        display: "flex", alignItems: "center", justifyContent: "center", 
                                        color: "#fff", fontSize: 12, fontWeight: 800
                                    }}>
                                        {b.name.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: activeBrandId === b.id ? "#4C1D95" : "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                                    {activeBrandId === b.id && <Check size={14} color="#6366F1" />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── CONTENT CANVAS ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", height: "100%", overflow: "hidden" }}>
                    {/* TOP HEADER: BRAND SWITCHER */}
                    <div style={{ padding: "16px", borderBottom: "1px solid #F1F5F9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ 
                                width: 32, height: 32, borderRadius: 8, 
                                background: activeBrand.colors[0]?.hex || "#6366F1", 
                                display: "flex", alignItems: "center", justifyContent: "center", 
                                color: "#fff", fontSize: 13, fontWeight: 900, flexShrink: 0,
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }}>
                                {activeBrand.name.charAt(0)}
                            </div>
                            <div style={{ position: "relative", flex: 1 }}>
                                <select 
                                    value={activeBrandId}
                                    onChange={e => setActiveBrandId(e.target.value)}
                                    style={{ 
                                        width: "100%", padding: "8px 32px 8px 12px", borderRadius: 10, border: "1px solid #E2E8F0", 
                                        background: "#F8FAFC", fontSize: 13, fontWeight: 700, color: "#1e293b", 
                                        appearance: "none", cursor: "pointer", outline: "none"
                                    }}
                                >
                                    {brandKits.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94A3B8" }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                        {/* VERTICAL SUB-NAV */}
                        <div style={{ 
                            width: mode === "sidebar" ? 75 : 200, 
                            borderRight: "1px solid #F1F5F9", 
                            background: "#fff",
                            display: "flex",
                            flexDirection: "column",
                            padding: "12px 6px"
                        }}>
                            {[
                                { id: "assets", label: "Assets", icon: <ImageIcon size={16} /> },
                                { id: "colors", label: "Colors", icon: <Palette size={16} /> },
                                { id: "typography", label: "Fonts", icon: <Type size={16} /> },
                                { id: "components", label: "UI Kit", icon: <LayoutTemplate size={16} /> },
                                { id: "guidelines", label: "Guide", icon: <BookOpen size={16} /> },
                                { id: "settings", label: "Conf", icon: <Settings size={16} /> }
                            ].map(t => (
                                <div 
                                    key={t.id} 
                                    onClick={() => setActiveTab(t.id as any)}
                                    style={{ 
                                        padding: "10px 8px", 
                                        borderRadius: 8,
                                        marginBottom: 4,
                                        cursor: "pointer",
                                        background: activeTab === t.id ? "#F1F5F9" : "transparent",
                                        color: activeTab === t.id ? "#6366F1" : "#64748B",
                                        display: "flex", 
                                        flexDirection: mode === "sidebar" ? "column" : "row",
                                        alignItems: "center", 
                                        gap: mode === "sidebar" ? 4 : 12,
                                        transition: "all 0.2s ease",
                                        textAlign: "center"
                                    }}
                                >
                                    <div style={{ opacity: activeTab === t.id ? 1 : 0.7 }}>{t.icon}</div>
                                    <span style={{ 
                                        fontSize: mode === "sidebar" ? 9 : 13, 
                                        fontWeight: activeTab === t.id ? 800 : 600,
                                        whiteSpace: "nowrap"
                                    }}>
                                        {t.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CONTENT AREA */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }} className="no-scrollbar">
                            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                            
                            {activeTab === "assets" && (
                                <div style={{ animation: "fadeSlideUp 0.4s ease-out" }}>
                                    {/* Assets grouped by type */}
                                    {["logo", "icon", "image"].map(type => {
                                        const typeAssets = activeBrand.assets.filter(a => a.type === type);
                                        if (typeAssets.length === 0) return null;
                                        return (
                                            <div key={type} style={{ marginBottom: 32 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                                    <h3 style={{ fontSize: 12, fontWeight: 900, color: "#0F172A", textTransform: "capitalize", margin: 0 }}>{type}s</h3>
                                                    {type === "logo" && mode === "sidebar" && (
                                                        <button 
                                                            onClick={() => fileInputRef.current?.click()}
                                                            style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#EEF2FF", color: "#6366F1", fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                                                        >
                                                            <Plus size={12} /> Add
                                                        </button>
                                                    )}
                                                </div>
                                                <div style={{ 
                                                    display: "grid", 
                                                    gridTemplateColumns: type === "logo" ? "1fr 1fr" : "1fr 1fr 1fr", 
                                                    gap: 8 
                                                }}>
                                                    {typeAssets.map(asset => (
                                                        <div 
                                                            key={asset.id} 
                                                            draggable
                                                            onDragStart={e => {
                                                                e.dataTransfer.setData("blockType", "image");
                                                                e.dataTransfer.setData("blockProps", JSON.stringify({ src: asset.url, alt: asset.name }));
                                                            }}
                                                            style={{ 
                                                                border: "1px solid #E2E8F0", 
                                                                borderRadius: 12, 
                                                                padding: "4px", 
                                                                background: "#fff", 
                                                                cursor: "grab",
                                                                transition: "all 0.2s ease"
                                                            }} 
                                                            onMouseEnter={e => e.currentTarget.style.borderColor = "#6366F1"}
                                                            onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}
                                                        >
                                                            <div style={{ height: type === "logo" ? 60 : 50, display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", borderRadius: 8, marginBottom: 4, overflow: "hidden", position: "relative" }}>
                                                                <img src={asset.url} alt={asset.name} style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} />
                                                            </div>
                                                            <div style={{ fontSize: 9, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center", padding: "0 2px" }}>{asset.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === "colors" && (
                                <div style={{ animation: "fadeSlideUp 0.4s ease-out" }}>
                                    {mode === "sidebar" && <h3 style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>Brand Palette</h3>}
                                    <div style={{ display: "flex", flexDirection: "column", gap: mode === "sidebar" ? 16 : 48 }}>
                                        <ColorGroup title="Primary" group="Primary" />
                                        <ColorGroup title="Secondary" group="Secondary" />
                                        <ColorGroup title="Accent" group="Accent" />
                                    </div>
                                </div>
                            )}

                            {activeTab === "typography" && (
                                <div style={{ display: "flex", flexDirection: mode === "sidebar" ? "column" : "row", gap: mode === "sidebar" ? 16 : 40, animation: "fadeSlideUp 0.4s ease-out" }}>
                                    <div style={{ flex: mode === "sidebar" ? "none" : 1.5, display: "flex", flexDirection: "column", gap: mode === "sidebar" ? 12 : 24 }}>
                                        <div style={{ background: "#fff", borderRadius: mode === "sidebar" ? 12 : 24, border: "1px solid #E2E8F0", padding: mode === "sidebar" ? 16 : 32, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                                            <h3 style={{ fontSize: mode === "sidebar" ? 13 : 18, fontWeight: 800, color: "#0F172A", marginBottom: mode === "sidebar" ? 16 : 24 }}>Styles</h3>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                {[
                                                    { name: "Headline 1", font: activeBrand.typography.headingFont, size: mode === "sidebar" ? 18 : activeBrand.typography.h1Size, weight: activeBrand.typography.headingWeight },
                                                    { name: "Subheadline", font: activeBrand.typography.headingFont, size: mode === "sidebar" ? 14 : activeBrand.typography.h2Size, weight: activeBrand.typography.headingWeight },
                                                    { name: "Body Text", font: activeBrand.typography.bodyFont, size: mode === "sidebar" ? 12 : activeBrand.typography.bodySize, weight: "normal" },
                                                    { name: "Small Print", font: activeBrand.typography.bodyFont, size: mode === "sidebar" ? 10 : activeBrand.typography.smallSize, weight: "normal" }
                                                ].map((style, i) => (
                                                    <div key={i} 
                                                        draggable
                                                        onDragStart={e => {
                                                            e.dataTransfer.setData("styleType", "font");
                                                            e.dataTransfer.setData("value", JSON.stringify({ 
                                                                fontFamily: style.font, 
                                                                fontWeight: style.weight,
                                                                fontSize: style.size 
                                                            }));
                                                        }}
                                                        style={{ 
                                                            padding: "12px", borderRadius: 8, border: "1px solid #F1F5F9", cursor: "grab",
                                                            transition: "all 0.2s"
                                                        }} onMouseEnter={e => e.currentTarget.style.borderColor = "#6366F1"}>
                                                        <div style={{ fontSize: 9, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", marginBottom: 4 }}>{style.name}</div>
                                                        <div style={{ fontFamily: style.font, fontSize: style.size, fontWeight: style.weight as any, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {activeBrand.name} Brand Voice
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "components" && (
                                <div style={{ animation: "fadeSlideUp 0.4s ease-out" }}>
                                    <div style={{ marginBottom: mode === "sidebar" ? 20 : 32 }}>
                                        <h2 style={{ fontSize: mode === "sidebar" ? 18 : 24, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>Reusable UI Blocks</h2>
                                        {mode !== "sidebar" && <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>Standardized sections and components to accelerate design workflows.</p>}
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: mode === "sidebar" ? "1fr 1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: mode === "sidebar" ? 12 : 32 }}>
                                        {activeBrand.components.map(comp => (
                                            <div key={comp.id} 
                                                draggable
                                                onDragStart={e => {
                                                    e.dataTransfer.setData("blockType", "component");
                                                    e.dataTransfer.setData("blockProps", JSON.stringify((comp as any).block));
                                                }}
                                                style={{ border: "1px solid #E2E8F0", borderRadius: mode === "sidebar" ? 16 : 24, overflow: "hidden", background: "#fff", transition: "all 0.3s", cursor: "grab" }} className="comp-card"
                                            >
                                                <div style={{ height: mode === "sidebar" ? 100 : 160, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", padding: mode === "sidebar" ? 10 : 20 }}>
                                                    <ComponentMiniPreview block={(comp as any).block} />
                                                </div>
                                                <div style={{ padding: mode === "sidebar" ? 8 : 16, borderTop: "1px solid #E2E8F0" }}>
                                                    <div style={{ fontSize: mode === "sidebar" ? 11 : 14, fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{comp.name}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === "guidelines" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: mode === "sidebar" ? 24 : 40, animation: "fadeSlideUp 0.4s ease-out" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                                        <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #E2E8F0", padding: 32 }}>
                                            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 24 }}>Voice & Tone</h3>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                                {activeBrand.guidelines.tone.rules.map((rule, i) => (
                                                    <div key={i} style={{ padding: "8px 16px", background: "#F5F3FF", color: "#6366F1", borderRadius: 12, fontSize: 13, fontWeight: 700, border: "1px solid #DDD6FE" }}>{rule}</div>
                                                ))}
                                                <button style={{ padding: "8px 16px", background: "#fff", border: "2px dashed #E2E8F0", color: "#94A3B8", borderRadius: 12, fontSize: 13, fontWeight: 700 }}>+ Add Marker</button>
                                            </div>
                                        </div>

                                        <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #E2E8F0", padding: 32 }}>
                                            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 24 }}>Structural Compliance</h3>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                {activeBrand.guidelines.designRules.map((rule, i) => (
                                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, background: "#F8FAFC", borderRadius: 16, border: "1px solid #F1F5F9" }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: rule.severity === "error" ? "#FEE2E2" : "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: rule.severity === "error" ? "#EF4444" : "#F59E0B" }}>
                                                            <Settings size={18} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{rule.rule}</div>
                                                            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>{rule.severity.toUpperCase()} ALERT</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ background: "#0F172A", borderRadius: 24, padding: 40, color: "#fff", boxShadow: "0 20px 40px rgba(15, 23, 42, 0.2)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                                                <Sparkles size={24} color="#6366F1" />
                                                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>AI Training Kit</h3>
                                            </div>
                                            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#94A3B8", marginBottom: 32 }}>{activeBrand.guidelines.instructions}</p>
                                            <div style={{ padding: 20, background: "rgba(99, 102, 241, 0.1)", borderRadius: 16, border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: "#A5B4FC", marginBottom: 8 }}>Injected Context</div>
                                                <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineHeight: 1.5 }}>These rules are used to bias the AI model when generating content or designs for this brand kit.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "settings" && (
                                <div style={{ animation: "fadeSlideUp 0.4s ease-out" }}>
                                    <h2 style={{ fontSize: mode === "sidebar" ? 18 : 24, fontWeight: 800, color: "#0F172A", marginBottom: 24 }}>Kit Configuration</h2>
                                    <div style={{ maxWidth: mode === "sidebar" ? "100%" : 600, background: "#fff", borderRadius: mode === "sidebar" ? 16 : 24, border: "1px solid #E2E8F0", padding: mode === "sidebar" ? 20 : 40 }}>
                                        <FormGroup>
                                            <Label>Brand Identity Name</Label>
                                            <input 
                                                type="text" 
                                                value={activeBrand.name} 
                                                onChange={e => updateActiveBrand(b => ({ ...b, name: e.target.value }))} 
                                                style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 15, background: "#F8FAFC", fontWeight: 600, outline: "none" }} 
                                            />
                                        </FormGroup>
                                        
                                        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 40 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "#F8FAFC", borderRadius: 16, border: "1px solid #F1F5F9" }}>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Default Organization Kit</div>
                                                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Use this kit automatically for all new designs.</div>
                                                </div>
                                                <div onClick={() => updateActiveBrand(b => ({ ...b, isDefault: !(b as any).isDefault }))} style={{ width: 48, height: 26, borderRadius: 13, background: (activeBrand as any).isDefault ? "#6366F1" : "#E2E8F0", position: "relative", cursor: "pointer", transition: "all 0.3s" }}>
                                                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: (activeBrand as any).isDefault ? 25 : 3, transition: "all 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "#F8FAFC", borderRadius: 16, border: "1px solid #F1F5F9" }}>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Immutable Styles</div>
                                                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Lock the structure to prevent accidental edits.</div>
                                                </div>
                                                <div onClick={() => updateActiveBrand(b => ({ ...b, isLocked: !(b as any).isLocked }))} style={{ width: 48, height: 26, borderRadius: 13, background: (activeBrand as any).isLocked ? "#6366F1" : "#E2E8F0", position: "relative", cursor: "pointer", transition: "all 0.3s" }}>
                                                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: (activeBrand as any).isLocked ? 25 : 3, transition: "all 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALS & EXTRAS --- */}
            {previewComponent && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
                    background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000,
                    padding: 40
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 24, width: "100%", maxWidth: 1000, height: "100%",
                        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
                    }}>
                        {/* Header */}
                        <div style={{ padding: "20px 32px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{previewComponent.name}</div>
                                <div style={{ fontSize: 12, color: "#6366F1", fontWeight: 700, textTransform: "uppercase" }}>{previewComponent.category} PREVIEW</div>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <div style={{ background: "#E2E8F0", padding: 4, borderRadius: 10, display: "flex", gap: 4 }}>
                                    <button 
                                        onClick={() => setPreviewMode("desktop")}
                                        style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: previewMode === "desktop" ? "#fff" : "transparent", cursor: "pointer", fontSize: 12, fontWeight: 700, color: previewMode === "desktop" ? "#4F46E5" : "#64748B", boxShadow: previewMode === "desktop" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}
                                    >Desktop</button>
                                    <button 
                                        onClick={() => setPreviewMode("mobile")}
                                        style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: previewMode === "mobile" ? "#fff" : "transparent", cursor: "pointer", fontSize: 12, fontWeight: 700, color: previewMode === "mobile" ? "#4F46E5" : "#64748B", boxShadow: previewMode === "mobile" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}
                                    >Mobile</button>
                                </div>
                                <button 
                                    onClick={() => setPreviewComponent(null)}
                                    style={{ width: 40, height: 40, borderRadius: 20, background: "#fff", color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E2E8F0" }}
                                ><X size={20} /></button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div style={{ flex: 1, overflowY: "auto", background: "#F1F5F9", padding: "40px 20px", display: "flex", justifyContent: "center" }}>
                            <div style={{ 
                                width: previewMode === "desktop" ? 600 : 375, 
                                minHeight: 200, 
                                background: "#fff", 
                                borderRadius: previewMode === "mobile" ? 20 : 0,
                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                overflow: "hidden",
                                border: previewMode === "mobile" ? "8px solid #334155" : "none"
                            }}>
                                <div style={{ padding: 24 }}>
                                    <ComponentMiniPreview block={(previewComponent as any).block} />
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{ padding: "20px 32px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end", gap: 12, background: "#F8FAFC" }}>
                            <button onClick={() => setPreviewComponent(null)} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontWeight: 700, cursor: "pointer" }}>Close</button>
                            <button 
                                onClick={() => {
                                    if (onUseComponent && previewComponent) {
                                        onUseComponent(previewComponent);
                                        setPreviewComponent(null);
                                    }
                                }}
                                style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#4F46E5", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                            >
                                Use Component
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .brand-item:hover { background: #F8FAFC !important; }
                .asset-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); border-color: #6366F1 !important; }
                .comp-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border-color: #6366F1 !important; }
                .action-row:hover { border-color: #6366F1 !important; transform: translateX(4px); }
                input:focus, select:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important; }
            `}} />

            {/* New Brand Name Prompt Modal */}
            {showNamePrompt && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(8px)", zIndex: 10000, display: "flex",
                    alignItems: "center", justifyContent: "center", padding: 24,
                    animation: "fadeIn 0.2s ease-out"
                }}>
                    <div style={{
                        width: "100%", maxWidth: 400, background: "#fff", borderRadius: 24,
                        padding: 32, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                        animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}>
                        <div style={{ textAlign: "center", marginBottom: 24 }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#EEF2FF", color: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                <Palette size={28} />
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: 0 }}>Create New Brand</h3>
                            <p style={{ fontSize: 14, color: "#64748B", marginTop: 8 }}>Give your brand identity a unique name.</p>
                        </div>

                        <FormGroup>
                            <Label>Brand Name</Label>
                            <input 
                                autoFocus
                                value={newBrandName}
                                onChange={e => setNewBrandName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && newBrandName.trim()) {
                                        const id = uid();
                                        setBrandKits(prev => [...prev, {
                                            ...DEFAULT_BRAND_KITS[0],
                                            id,
                                            name: newBrandName.trim()
                                        }]);
                                        setActiveBrandId(id);
                                        setShowNamePrompt(false);
                                    }
                                }}
                                placeholder="e.g. Acme Corp"
                                style={{
                                    width: "100%", padding: "14px 16px", borderRadius: 12,
                                    border: "1px solid #E2E8F0", background: "#F8FAFC",
                                    fontSize: 14, fontWeight: 600, color: "#0F172A", outline: "none"
                                }}
                            />
                        </FormGroup>

                        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                            <button 
                                onClick={() => setShowNamePrompt(false)}
                                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                            >Cancel</button>
                            <button 
                                onClick={() => {
                                    if (newBrandName.trim()) {
                                        const id = uid();
                                        setBrandKits(prev => [...prev, {
                                            ...DEFAULT_BRAND_KITS[0],
                                            id,
                                            name: newBrandName.trim()
                                        }]);
                                        setActiveBrandId(id);
                                        setShowNamePrompt(false);
                                    }
                                }}
                                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#6366F1", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                            >Create Brand</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

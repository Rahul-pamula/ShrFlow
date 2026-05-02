"use client";
import React, { useState, useRef } from "react";
import { Plus, Check, Search, Trash2, Palette, Type, Image as ImageIcon, LayoutTemplate, BookOpen, Settings, Lock, Upload, Copy, Download, Sparkles, X } from "lucide-react";
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
}

export const BrandDashboard = ({
    brandKits, setBrandKits, activeBrandId, setActiveBrandId, applyBrandToDesign, setActiveSidebarTab, onUseComponent
}: BrandDashboardProps) => {
    const [activeTab, setActiveTab] = useState<"colors" | "typography" | "assets" | "components" | "guidelines">("assets");
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
        <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 16 }}>{title}</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {activeBrand.colors.filter(c => c.group === group).map(color => (
                    <div key={color.id} className="color-swatch" style={{ width: 80, position: "relative" }}>
                        <div 
                            onClick={() => setOpenPicker(openPicker?.id === color.id ? null : { id: color.id })}
                            style={{ display: "block", width: 80, height: 80, borderRadius: 8, background: color.hex, border: "1px solid #E2E8F0", marginBottom: 8, position: "relative", cursor: "pointer" }}
                        >
                            <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeColor(color.id); setOpenPicker(null); }} 
                                style={{ position: "absolute", top: -8, right: -8, background: "#EF4444", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}
                            >
                                <Trash2 size={12} />
                            </button>
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
                        <input 
                            type="text" 
                            value={color.hex} 
                            onChange={e => updateColor(color.id, e.target.value)} 
                            style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", textAlign: "center", outline: "none" }}
                        />
                    </div>
                ))}
                <div style={{ position: "relative" }}>
                    <div 
                        onClick={() => setOpenPicker(openPicker?.id === `new-${group}` ? null : { id: `new-${group}`, group })}
                        style={{ width: 80, height: 80, borderRadius: 8, border: "2px dashed #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#F8FAFC", color: "#94A3B8", transition: "all 0.2s" }}
                    >
                        <Plus size={24} />
                    </div>
                    {openPicker?.id === `new-${group}` && (
                        <div style={{ position: "absolute", top: 90, left: 0, width: 204, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 50, display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {PRESET_COLORS.map(pc => (
                                <div key={pc} onClick={() => { addColor(group, pc); setOpenPicker(null); }} style={{ width: 24, height: 24, borderRadius: 4, background: pc, cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)" }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#F8FAFC", overflow: "hidden" }}>
            
            <div style={{ height: 80, background: "#fff", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)" }}>
                        <Palette size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>Brand Dashboard</div>
                        <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>Manage identities and design systems</div>
                    </div>
                    <div style={{ width: 1, height: 24, background: "#E2E8F0", margin: "0 8px" }} />
                    <select 
                        value={activeBrandId}
                        onChange={e => setActiveBrandId(e.target.value)}
                        style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F1F5F9", fontSize: 14, fontWeight: 600, color: "#334155", outline: "none", cursor: "pointer" }}
                    >
                        {brandKits.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button 
                        onClick={() => {
                            setNewBrandName("");
                            setShowNamePrompt(true);
                        }}
                        style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", fontSize: 14, fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                    >
                        <Plus size={16} /> New Brand
                    </button>
                    <button 
                        onClick={handleApply}
                        style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#4F46E5", color: "#fff", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)" }}
                    >
                        Apply Brand to Design
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                
                <div style={{ width: 240, background: "#fff", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "24px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>My Brands</div>
                    </div>
                    <div style={{ padding: "0 12px", flex: 1, overflowY: "auto" }}>
                        {brandKits.map(b => (
                            <div 
                                key={b.id} 
                                onClick={() => setActiveBrandId(b.id)}
                                style={{ 
                                    padding: "12px 16px", borderRadius: 8, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                                    background: activeBrandId === b.id ? "#EEF2FF" : "transparent",
                                    border: `1px solid ${activeBrandId === b.id ? "#C7D2FE" : "transparent"}`
                                }}
                            >
                                <div style={{ width: 24, height: 24, borderRadius: 6, background: b.colors[0]?.hex || "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 800 }}>
                                    {b.name.charAt(0)}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: activeBrandId === b.id ? "#4F46E5" : "#475569" }}>{b.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
                    <div style={{ display: "flex", borderBottom: "2px solid #E2E8F0", marginBottom: 32 }}>
                        {[
                            { id: "colors", label: "Colors" },
                            { id: "typography", label: "Typography" },
                            { id: "assets", label: "Assets" },
                            { id: "components", label: "Components" },
                            { id: "guidelines", label: "Guidelines" }
                        ].map(t => (
                            <div 
                                key={t.id} 
                                onClick={() => setActiveTab(t.id as any)}
                                style={{ 
                                    padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                                    color: activeTab === t.id ? "#4F46E5" : "#64748B",
                                    borderBottom: activeTab === t.id ? "2px solid #4F46E5" : "2px solid transparent",
                                    marginBottom: -2
                                }}
                            >
                                {t.label}
                            </div>
                        ))}
                    </div>

                    {activeTab === "colors" && (
                        <div style={{ display: "flex", gap: 32 }}>
                            <div style={{ flex: 2, background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 32 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Color Palette</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        {showSaveMessage && <div style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}>Success!</div>}
                                        <button onClick={handleSavePalette} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#4F46E5", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save Palette</button>
                                    </div>
                                </div>
                                <ColorGroup title="Primary Colors" group="Primary" />
                                <ColorGroup title="Secondary Colors" group="Secondary" />
                                <ColorGroup title="Accent Colors" group="Accent" />
                            </div>
                            <div style={{ flex: 1, background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 32 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 24, background: "#F1F5F9", padding: "4px 8px", borderRadius: 4, display: "inline-block" }}>Preview</div>
                                <div style={{ color: activeBrand.colors.find(c => c.group === "Primary")?.hex || "#4F46E5", fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Heading 1</div>
                                <div style={{ color: activeBrand.colors.find(c => c.group === "Secondary")?.hex || "#0F172A", fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Heading 2</div>
                                <div style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>Brand preview area.</div>
                                <button style={{ width: "100%", padding: 14, borderRadius: 8, border: "none", background: activeBrand.colors.find(c => c.group === "Primary")?.hex || "#4F46E5", color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Primary Button</button>
                                <button style={{ width: "100%", padding: 14, borderRadius: 8, border: `1px solid ${activeBrand.colors.find(c => c.group === "Primary")?.hex || "#4F46E5"}`, background: "transparent", color: activeBrand.colors.find(c => c.group === "Primary")?.hex || "#4F46E5", fontSize: 14, fontWeight: 600 }}>Secondary Button</button>
                                <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                                    {activeBrand.colors.slice(0, 6).map(c => (
                                        <div key={c.id} style={{ width: 32, height: 32, borderRadius: "50%", background: c.hex, border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "typography" && (
                        <div style={{ display: "flex", gap: 32, animation: "fadeSlideUp 0.3s ease-out" }}>
                            <div style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: 24 }}>
                                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 32 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 24 }}>Font Selection</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                                        <FormGroup>
                                            <Label>Heading Font</Label>
                                            <select 
                                                value={activeBrand.typography.headingFont} 
                                                onChange={e => updateActiveBrand(b => ({ ...b, typography: { ...b.typography, headingFont: e.target.value } }))}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 14, background: "#F8FAFC" }}
                                            >
                                                <option value="Inter, sans-serif">Inter</option>
                                                <option value="Arial, sans-serif">Arial</option>
                                                <option value="'Times New Roman', serif">Times New Roman</option>
                                                <option value="Georgia, serif">Georgia</option>
                                                <option value="'Montserrat', sans-serif">Montserrat</option>
                                                <option value="'Playfair Display', serif">Playfair Display</option>
                                            </select>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Body Font</Label>
                                            <select 
                                                value={activeBrand.typography.bodyFont} 
                                                onChange={e => updateActiveBrand(b => ({ ...b, typography: { ...b.typography, bodyFont: e.target.value } }))}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 14, background: "#F8FAFC" }}
                                            >
                                                <option value="Inter, sans-serif">Inter</option>
                                                <option value="Arial, sans-serif">Arial</option>
                                                <option value="'Times New Roman', serif">Times New Roman</option>
                                                <option value="Roboto, sans-serif">Roboto</option>
                                                <option value="'Open Sans', sans-serif">Open Sans</option>
                                            </select>
                                        </FormGroup>
                                    </div>
                                </div>

                                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 32 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Hierarchy & Scale</div>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                                            <input 
                                                type="checkbox" 
                                                checked={activeBrand.typography.autoScale} 
                                                onChange={e => updateActiveBrand(b => ({ ...b, typography: { ...b.typography, autoScale: e.target.checked } }))}
                                            /> Auto Scale
                                        </label>
                                    </div>
                                    <FormGroup>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                            <Label>H1 Size: {activeBrand.typography.h1Size}px</Label>
                                        </div>
                                        <input 
                                            type="range" min="24" max="72" 
                                            value={activeBrand.typography.h1Size} 
                                            onChange={e => {
                                                const val = parseInt(e.target.value);
                                                if (activeBrand.typography.autoScale) {
                                                    const ratio = val / activeBrand.typography.h1Size;
                                                    updateActiveBrand(b => ({
                                                        ...b,
                                                        typography: {
                                                            ...b.typography,
                                                            h1Size: val,
                                                            h2Size: Math.round(b.typography.h2Size * ratio),
                                                            h3Size: Math.round(b.typography.h3Size * ratio),
                                                            bodySize: Math.round(b.typography.bodySize * ratio),
                                                            smallSize: Math.round(b.typography.smallSize * ratio),
                                                        }
                                                    }));
                                                } else {
                                                    updateActiveBrand(b => ({ ...b, typography: { ...b.typography, h1Size: val } }));
                                                }
                                            }}
                                            style={{ width: "100%", accentColor: "#4F46E5" }} 
                                        />
                                    </FormGroup>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                                        <FormGroup><Label>H2</Label><input type="number" value={activeBrand.typography.h2Size} onChange={e => updateActiveBrand(b => ({ ...b, typography: { ...b.typography, h2Size: +e.target.value } }))} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #E2E8F0" }} /></FormGroup>
                                        <FormGroup><Label>H3</Label><input type="number" value={activeBrand.typography.h3Size} onChange={e => updateActiveBrand(b => ({ ...b, typography: { ...b.typography, h3Size: +e.target.value } }))} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #E2E8F0" }} /></FormGroup>
                                        <FormGroup><Label>Body</Label><input type="number" value={activeBrand.typography.bodySize} onChange={e => updateActiveBrand(b => ({ ...b, typography: { ...b.typography, bodySize: +e.target.value } }))} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #E2E8F0" }} /></FormGroup>
                                        <FormGroup><Label>Small</Label><input type="number" value={activeBrand.typography.smallSize} onChange={e => updateActiveBrand(b => ({ ...b, typography: { ...b.typography, smallSize: +e.target.value } }))} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #E2E8F0" }} /></FormGroup>
                                    </div>
                                </div>

                                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 32 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 24 }}>Readability & Spacing</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                                        <FormGroup>
                                            <Label>Line Height: {activeBrand.typography.baseLineHeight}</Label>
                                            <input type="range" min="1" max="2.5" step="0.1" value={activeBrand.typography.baseLineHeight} onChange={e => updateActiveBrand(b => ({ ...b, typography: { ...b.typography, baseLineHeight: parseFloat(e.target.value) } }))} style={{ width: "100%", accentColor: "#4F46E5" }} />
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Letter Spacing: {activeBrand.typography.letterSpacing}px</Label>
                                            <input type="range" min="-2" max="10" step="0.5" value={activeBrand.typography.letterSpacing} onChange={e => updateActiveBrand(b => ({ ...b, typography: { ...b.typography, letterSpacing: parseFloat(e.target.value) } }))} style={{ width: "100%", accentColor: "#4F46E5" }} />
                                        </FormGroup>
                                    </div>
                                </div>
                            </div>

                            <div style={{ flex: 1, position: "sticky", top: 0 }}>
                                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 32, boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 24, background: "#F1F5F9", padding: "4px 8px", borderRadius: 4, display: "inline-block" }}>System Preview</div>
                                    
                                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", marginBottom: 4 }}>HEADING 1</div>
                                            <div style={{ 
                                                fontFamily: activeBrand.typography.headingFont, 
                                                fontSize: activeBrand.typography.h1Size, 
                                                fontWeight: activeBrand.typography.headingWeight,
                                                textTransform: activeBrand.typography.headingTransform,
                                                lineHeight: activeBrand.typography.baseLineHeight,
                                                letterSpacing: `${activeBrand.typography.letterSpacing}px`,
                                                color: activeBrand.colors.find(c => c.group === "Primary")?.hex || "#1e293b" 
                                            }}>The quick brown fox jumps over the lazy dog.</div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", marginBottom: 4 }}>HEADING 2</div>
                                            <div style={{ 
                                                fontFamily: activeBrand.typography.headingFont, 
                                                fontSize: activeBrand.typography.h2Size, 
                                                fontWeight: activeBrand.typography.headingWeight,
                                                textTransform: activeBrand.typography.headingTransform,
                                                color: "#334155" 
                                            }}>Modern design meets efficient delivery.</div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", marginBottom: 4 }}>BODY TEXT</div>
                                            <div style={{ 
                                                fontFamily: activeBrand.typography.bodyFont, 
                                                fontSize: activeBrand.typography.bodySize, 
                                                fontWeight: activeBrand.typography.bodyWeight,
                                                lineHeight: activeBrand.typography.baseLineHeight,
                                                color: "#475569" 
                                            }}>Our brand voice is confident yet approachable. We use this typography system to ensure consistency across every email campaign we send.</div>
                                        </div>

                                        <div style={{ marginTop: 12 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", marginBottom: 8 }}>INTERACTIVE PREVIEW</div>
                                            <button style={{ 
                                                padding: "12px 24px", borderRadius: 8, border: "none", 
                                                background: activeBrand.colors.find(c => c.group === "Primary")?.hex || "#4F46E5", 
                                                color: "#fff", fontSize: activeBrand.typography.bodySize, 
                                                fontFamily: activeBrand.typography.bodyFont,
                                                fontWeight: activeBrand.typography.buttonWeight,
                                                textTransform: activeBrand.typography.buttonTransform,
                                                cursor: "pointer",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                            }}>Primary Action</button>
                                        </div>

                                        <div style={{ 
                                            marginTop: 24, padding: 16, background: "#F8FAFC", borderRadius: 8, border: "1px dashed #E2E8F0"
                                        }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Mobile View Simulation</div>
                                            <div style={{ 
                                                fontSize: activeBrand.typography.h1Size * activeBrand.typography.mobileScale,
                                                fontFamily: activeBrand.typography.headingFont,
                                                fontWeight: activeBrand.typography.headingWeight,
                                                color: "#94A3B8"
                                            }}>Scaled H1 Title</div>
                                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Reduced to {Math.round(activeBrand.typography.mobileScale * 100)}% on mobile devices</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "assets" && (
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 32, animation: "fadeSlideUp 0.3s ease-out" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Brand Assets</div>
                                    <div style={{ fontSize: 13, color: "#64748B" }}>Logos, icons, and approved photography</div>
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#4F46E5", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                                >
                                    <Upload size={16} /> Upload Asset
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    style={{ display: "none" }} 
                                    accept="image/*"
                                />
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 24 }}>
                                {activeBrand.assets.map(asset => (
                                    <div key={asset.id} style={{ border: "1px solid #F1F5F9", borderRadius: 12, padding: 16, textAlign: "center", background: "#F8FAFC", transition: "all 0.2s" }}>
                                        <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", borderRadius: 8, marginBottom: 12, border: "1px solid #E2E8F0" }}>
                                            <img src={asset.url} alt={asset.name} style={{ maxWidth: "80%", maxHeight: "80%" }} />
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{asset.name}</div>
                                        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: "#EEF2FF", color: "#4F46E5", borderRadius: 4, textTransform: "uppercase" }}>{asset.type}</span>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: "#F1F5F9", color: "#64748B", borderRadius: 4, textTransform: "uppercase" }}>{asset.variant}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "components" && (
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 32, animation: "fadeSlideUp 0.3s ease-out" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Reusable Components</div>
                                    <div style={{ fontSize: 13, color: "#64748B" }}>Saved blocks and sections for quick email building</div>
                                </div>
                                <div style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>Save components directly from the editor</div>
                            </div>

                            {activeBrand.components.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "64px 0", color: "#94A3B8" }}>
                                    <LayoutTemplate size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                                    <p>No components saved yet. Select a block on the canvas to save it.</p>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                                    {activeBrand.components.map(comp => (
                                        <div key={comp.id} style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", transition: "all 0.2s" }}>
                                            <div style={{ height: 140, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #E2E8F0", padding: 12 }}>
                                                <ComponentMiniPreview block={(comp as any).block} />
                                            </div>
                                            <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{comp.name}</div>
                                                    <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase" }}>{comp.category} {comp.isLocked && "• Locked Structure"}</div>
                                                </div>
                                                <button 
                                                    onClick={() => setPreviewComponent(comp)}
                                                    style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#F1F5F9", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                                                >
                                                    Preview
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "guidelines" && (
                        <div style={{ display: "flex", gap: 32, animation: "fadeSlideUp 0.3s ease-out" }}>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
                                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 32 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 24 }}>Brand Voice & Tone</div>
                                    <FormGroup>
                                        <Label>Tone: {activeBrand.guidelines.tone.name}</Label>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                            {activeBrand.guidelines.tone.rules.map((rule, i) => (
                                                <div key={i} style={{ padding: "6px 12px", background: "#EEF2FF", color: "#4F46E5", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1px solid #C7D2FE" }}>{rule}</div>
                                            ))}
                                            <button style={{ padding: "6px 12px", background: "#fff", border: "1px dashed #C7D2FE", color: "#4F46E5", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>+ Add Rule</button>
                                        </div>
                                    </FormGroup>
                                </div>

                                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 32 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 24 }}>Design Compliance Rules</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        {activeBrand.guidelines.designRules.map((rule, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, background: "#F8FAFC", borderRadius: 10, border: "1px solid #F1F5F9" }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: rule.severity === "error" ? "#FEE2E2" : "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: rule.severity === "error" ? "#EF4444" : "#F59E0B" }}>
                                                    <Settings size={16} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{rule.rule}</div>
                                                    <div style={{ fontSize: 11, color: "#64748B" }}>Enforced as {rule.severity} during brand application</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ background: "#0F172A", borderRadius: 12, padding: 32, color: "#fff" }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Special Instructions</div>
                                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "#94A3B8", marginBottom: 32 }}>{activeBrand.guidelines.instructions}</div>
                                    
                                    <div style={{ padding: 20, background: "rgba(255,255,255,0.05)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                            <Sparkles size={18} color="#6366F1" />
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>AI Brand Assistant</div>
                                        </div>
                                        <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>These guidelines are automatically injected into the AI generation prompt to ensure your brand's unique voice is always maintained.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ width: 320, background: "#fff", borderLeft: "1px solid #E2E8F0", display: "flex", flexDirection: "column", padding: 24, overflowY: "auto" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Brand Actions</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                        <div onClick={handleApply} style={{ padding: 16, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }} className="hover-action">
                            <div style={{ color: "#4F46E5" }}><Palette size={20} /></div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Apply Brand to Design</div>
                        </div>
                        <div onClick={handleExport} style={{ padding: 16, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }} className="hover-action">
                            <div style={{ color: "#64748B" }}><Download size={20} /></div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Export Brand Kit</div>
                        </div>
                        <div onClick={handleDuplicate} style={{ padding: 16, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }} className="hover-action">
                            <div style={{ color: "#64748B" }}><Copy size={20} /></div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Duplicate Brand</div>
                        </div>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Brand Settings</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <FormGroup>
                            <Label>Brand Name</Label>
                            <input type="text" value={activeBrand.name} onChange={e => updateActiveBrand(b => ({ ...b, name: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, background: "#F8FAFC" }} />
                        </FormGroup>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Default Brand</div>
                            <div onClick={() => updateActiveBrand(b => ({ ...b, isDefault: !(b as any).isDefault }))} style={{ width: 36, height: 20, borderRadius: 10, background: (activeBrand as any).isDefault ? "#4F46E5" : "#CBD5E1", position: "relative", cursor: "pointer" }}>
                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: (activeBrand as any).isDefault ? 18 : 2 }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Lock Brand Styles</div>
                            <div onClick={() => updateActiveBrand(b => ({ ...b, isLocked: !(b as any).isLocked }))} style={{ width: 36, height: 20, borderRadius: 10, background: (activeBrand as any).isLocked ? "#4F46E5" : "#CBD5E1", position: "relative", cursor: "pointer" }}>
                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: (activeBrand as any).isLocked ? 18 : 2 }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* --- COMPONENT PREVIEW MODAL --- */}
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
                .hover-action:hover {
                    border-color: #4F46E5 !important;
                    background: #EEF2FF !important;
                }
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
                                    width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #E2E8F0",
                                    background: "#F8FAFC", fontSize: 15, fontWeight: 500, outline: "none",
                                    transition: "all 0.2s"
                                }}
                            />
                        </FormGroup>

                        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                            <button 
                                onClick={() => setShowNamePrompt(false)}
                                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontWeight: 700, cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    if (!newBrandName.trim()) return;
                                    const id = uid();
                                    setBrandKits(prev => [...prev, {
                                        ...DEFAULT_BRAND_KITS[0],
                                        id,
                                        name: newBrandName.trim()
                                    }]);
                                    setActiveBrandId(id);
                                    setShowNamePrompt(false);
                                }}
                                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#4F46E5", color: "#fff", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }}
                            >
                                Create Brand
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

"use client";
import React from "react";
import { 
    Mail, ChevronLeft, ChevronDown, Share2, Star, Clock, Terminal, 
    Shapes, Search, History, Palette, Sparkles, Plus, Settings2, 
    HelpCircle, LogOut, Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle
} from "lucide-react";
import { SectionLabel, FormGroup, Label, TabsContainer, Tab, DraggableItem } from "./BuilderComponents";
import ScaledPreview from "@/components/editor/ScaledPreview";

interface SecondaryDrawerProps {
    activeSidebarTab: string;
    setActiveSidebarTab: (val: string) => void;
    sidebarWidth: number;
    activeSubMenu: "social" | "icons" | "advanced" | null;
    setActiveSubMenu: (val: "social" | "icons" | "advanced" | null) => void;
    showElements: boolean;
    setShowElements: (val: boolean) => void;
    photoSearchInput: string;
    setPhotoSearchInput: (val: string) => void;
    photoSearch: string;
    setPhotoSearch: (val: string) => void;
    iconSearch: string;
    setIconSearch: (val: string) => void;
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    loadTemplate: (preset: any) => void;
    design: any;
    pushDesign: (fn: (d: any) => any) => void;
    BLOCK_DEFAULTS: any;
    BLOCK_ICONS: any;
    TEMPLATE_PRESETS: any[];
    COMMON_ICONS: string[];
    token: string | null;
    onCreateNew: () => void;
}

export const SecondaryDrawer = ({
    activeSidebarTab, setActiveSidebarTab, sidebarWidth, activeSubMenu, setActiveSubMenu,
    showElements, setShowElements, photoSearchInput, setPhotoSearchInput,
    photoSearch, setPhotoSearch, iconSearch, setIconSearch,
    searchTerm, setSearchTerm, loadTemplate, design, pushDesign,
    BLOCK_DEFAULTS, BLOCK_ICONS, TEMPLATE_PRESETS, COMMON_ICONS,
    token, onCreateNew
}: SecondaryDrawerProps) => {

    const [projectTab, setProjectTab] = React.useState<"components" | "library">("components");
    const [gallerySearch, setGallerySearch] = React.useState("");

    const inputStyle = {
        width: "100%", padding: "10px 12px", borderRadius: 10,
        border: "1px solid #E2E8F0", fontSize: 14, outline: "none",
        background: "#F8FAFC", transition: "all 0.2s"
    };

    const renderElementsTab = () => {
        if (activeSubMenu === "social") {
            return (
                <div style={{ padding: 12, animation: "fadeSlideUp 0.3s ease-out" }}>
                    <button onClick={() => setActiveSubMenu(null)} style={{
                        display: "flex", alignItems: "center", gap: 8, background: "none", border: "none",
                        color: "#6366F1", cursor: "pointer", fontSize: 14, fontWeight: 700, marginBottom: 20, padding: 0
                    }}><ChevronLeft size={18} /> Back</button>
                    <SectionLabel>Social Platforms</SectionLabel>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                        <DraggableItem type="social" label="Facebook" icon={<Facebook size={16} />} props={{ icons: [{ platform: "facebook", url: "#" }], align: "center" }} />
                        <DraggableItem type="social" label="Instagram" icon={<Instagram size={16} />} props={{ icons: [{ platform: "instagram", url: "#" }], align: "center" }} />
                        <DraggableItem type="social" label="Twitter" icon={<Twitter size={16} />} props={{ icons: [{ platform: "twitter", url: "#" }], align: "center" }} />
                        <DraggableItem type="social" label="LinkedIn" icon={<Linkedin size={16} />} props={{ icons: [{ platform: "linkedin", url: "#" }], align: "center" }} />
                        <DraggableItem type="social" label="YouTube" icon={<Youtube size={16} />} props={{ icons: [{ platform: "youtube", url: "#" }], align: "center" }} />
                        <DraggableItem type="social" label="WhatsApp" icon={<MessageCircle size={16} />} props={{ icons: [{ platform: "whatsapp", url: "#" }], align: "center" }} />
                    </div>
                </div>
            );
        }

        if (showElements) {
            return (
                <div style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <button onClick={() => setShowElements(false)} style={{
                            width: 32, height: 32, borderRadius: "50%", border: "none", background: "#F1F5F9",
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B"
                        }}>
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Integrated Assets</span>
                    </div>

                    <TabsContainer>
                        <Tab active={activeSubMenu !== "icons"} onClick={() => setActiveSubMenu(null)}>Photos</Tab>
                        <Tab active={activeSubMenu === "icons"} onClick={() => setActiveSubMenu("icons")}>Icons</Tab>
                    </TabsContainer>

                    {activeSubMenu !== "icons" ? (
                        <>
                            <div style={{ position: "relative", marginBottom: 16 }}>
                                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#64748B", pointerEvents: "none", zIndex: 1 }} />
                                <input
                                    placeholder="Search stock photos..."
                                    value={photoSearchInput}
                                    onChange={e => setPhotoSearchInput(e.target.value)}
                                    onKeyDown={e => {
                                        e.stopPropagation();
                                        if (e.key === "Enter") {
                                            setPhotoSearch(photoSearchInput);
                                        }
                                    }}
                                    style={{
                                        ...inputStyle,
                                        padding: "10px 10px 10px 34px",
                                        fontSize: 12,
                                        background: "#fff"
                                    }}
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {(photoSearch ? Array(8).fill(0) : ["business", "nature", "tech", "work", "minimal", "startup"]).map((kw, i) => {
                                    const url = `https://images.unsplash.com/photo-${1500000000000 + (i * 100000)}?w=300&h=200&fit=crop&q=80&sig=${photoSearch || kw}-${i}`;
                                    return (
                                        <div key={i} draggable onDragStart={e => { e.dataTransfer.setData("blockType", "image"); e.dataTransfer.setData("blockProps", JSON.stringify({ src: url, borderRadius: 8 })); }} style={{ height: 80, borderRadius: 8, backgroundImage: `url(${url})`, backgroundSize: "cover", cursor: "grab", border: "1px solid #E2E8F0" }} />
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ position: "relative", marginBottom: 16 }}>
                                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#64748B", pointerEvents: "none" }} />
                                <input
                                    placeholder="Search icons..."
                                    value={iconSearch}
                                    onChange={e => setIconSearch(e.target.value)}
                                    onKeyDown={e => e.stopPropagation()}
                                    style={{
                                        ...inputStyle,
                                        padding: "10px 10px 10px 34px",
                                        fontSize: 12,
                                        background: "#fff"
                                    }}
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                                {COMMON_ICONS.filter(n => n.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 32).map(name => {
                                    const kebabName = name.replace(/([a-z])([A-Z0-9])/g, "$1-$2").toLowerCase();
                                    const iconUrl = `https://api.iconify.design/lucide/${kebabName}.svg?color=%236366F1`;
                                    return (
                                        <div key={name} draggable onDragStart={e => { e.dataTransfer.setData("blockType", "image"); e.dataTransfer.setData("blockProps", JSON.stringify({ src: iconUrl, width: 20, align: "center" })); }} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", borderRadius: 8, border: "1px solid #F1F5F9", cursor: "grab" }}>
                                            <img src={iconUrl} style={{ width: 20, height: 20 }} alt={name} />
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            );
        }


        return (
            <div style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
                <SectionLabel>Content Blocks</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    {["text", "image", "button", "divider", "spacer", "hero", "footer", "layout"].map(type => (
                        <DraggableItem key={type} type={type} label={BLOCK_DEFAULTS[type].label} icon={BLOCK_ICONS[type]} />
                    ))}

                    <div onClick={() => setActiveSubMenu("social")} className="block-card" style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                        borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
                        background: "#fff", border: "1px solid #F1F5F9", color: "#475569",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                    }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F1F5F9", color: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Share2 size={16} />
                        </div>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#334155" }}>Social Media</div>
                        <ChevronLeft size={14} style={{ color: "#CBD5E1" }} />
                    </div>

                    <div onClick={() => setActiveSubMenu("advanced")} className="block-card" style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                        borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
                        background: "#fff", border: "1px solid #F1F5F9", color: "#475569",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                    }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F1F5F9", color: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Sparkles size={16} />
                        </div>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#334155" }}>Advanced Blocks</div>
                        <ChevronLeft size={14} style={{ color: "#CBD5E1" }} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            width: sidebarWidth, background: "#ffffff", borderRight: "1px solid #E2E8F0",
            display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 10, position: "relative"
        }}>
            <div style={{ flex: 1, overflow: "auto", padding: "24px 20px" }}>
                {/* --- HOME TAB --- */}
                {activeSidebarTab === "home" && (
                    <div style={{ animation: "fadeSlideUp 0.3s ease-out", display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
                        <div style={{ textAlign: "center", marginBottom: 32 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", lineHeight: 1.3, marginBottom: 12 }}>
                                \"Design is intelligence made visible.\"
                            </h2>
                            <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, padding: "0 16px" }}>
                                Start fresh on a blank canvas or choose a proven template to get going fast.
                            </p>
                        </div>
                        
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button onClick={() => setActiveSidebarTab("projects")} style={{
                                padding: "12px 24px", borderRadius: 12, background: "#6366F1", color: "#fff",
                                border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14,
                                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)"
                            }}>New Project</button>
                            <button onClick={() => setActiveSidebarTab("templates")} style={{
                                padding: "12px 24px", borderRadius: 12, background: "#fff", color: "#64748B",
                                border: "1px solid #E2E8F0", fontWeight: 700, cursor: "pointer", fontSize: 14
                            }}>Browse Templates</button>
                        </div>
                    </div>
                )}

                {/* --- PROJECTS TAB --- */}
                {activeSidebarTab === "projects" && (
                    <div style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
                        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 4, marginBottom: 24 }}>
                            <button onClick={() => setProjectTab("components")} style={{
                                flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer",
                                fontSize: 13, fontWeight: 600,
                                background: projectTab === "components" ? "#fff" : "transparent",
                                color: projectTab === "components" ? "#6366F1" : "#64748B",
                                boxShadow: projectTab === "components" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                transition: "all 0.2s"
                            }}>Components</button>
                            <button onClick={() => setProjectTab("library")} style={{
                                flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer",
                                fontSize: 13, fontWeight: 600,
                                background: projectTab === "library" ? "#fff" : "transparent",
                                color: projectTab === "library" ? "#6366F1" : "#64748B",
                                boxShadow: projectTab === "library" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                transition: "all 0.2s"
                            }}>Template Gallery</button>
                        </div>

                        {projectTab === "components" ? renderElementsTab() : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {/* Blank Canvas */}
                                <button
                                    onClick={onCreateNew}
                                    style={{
                                        padding: "14px", borderRadius: 14, border: "2px dashed #E2E8F0",
                                        background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                                        justifyContent: "center", gap: 10, color: "#6366F1", fontWeight: 700,
                                        fontSize: 13, transition: "all 0.2s", flexShrink: 0
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = "#6366F1"}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}
                                >
                                    <Plus size={18} /> Blank Canvas
                                </button>

                                {/* Search */}
                                <div style={{ position: "relative" }}>
                                    <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
                                    <input
                                        placeholder="Search templates..."
                                        value={gallerySearch}
                                        onChange={e => setGallerySearch(e.target.value)}
                                        onKeyDown={e => e.stopPropagation()}
                                        style={{
                                            width: "100%", padding: "9px 10px 9px 30px", borderRadius: 10,
                                            border: "1px solid #E2E8F0", fontSize: 12, outline: "none",
                                            background: "#F8FAFC", boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                {/* Template Grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                                    {TEMPLATE_PRESETS
                                        .filter(p => p.name.toLowerCase().includes(gallerySearch.toLowerCase()))
                                        .map((preset) => (
                                            <div
                                                key={preset.id}
                                                onClick={() => loadTemplate(preset)}
                                                className="template-card"
                                                style={{
                                                    borderRadius: 12, border: "1px solid #E2E8F0",
                                                    background: "#fff", cursor: "pointer", transition: "all 0.2s",
                                                    overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                                                }}
                                            >
                                                {/* Thumbnail */}
                                                <div style={{
                                                    width: "100%", height: 100, overflow: "hidden",
                                                    background: "#F1F5F9", borderBottom: "1px solid #F1F5F9",
                                                    display: "flex", alignItems: "center", justifyContent: "center"
                                                }}>
                                                    {preset.thumbnail ? (
                                                        <img
                                                            src={preset.thumbnail}
                                                            alt={preset.name}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        <Sparkles size={20} style={{ color: "#CBD5E1" }} />
                                                    )}
                                                </div>
                                                {/* Info */}
                                                <div style={{ padding: "10px 12px" }}>
                                                    <div style={{
                                                        fontSize: 12, fontWeight: 700, color: "#0F172A",
                                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                                    }}>{preset.name}</div>
                                                    {preset.description && (
                                                        <div style={{
                                                            fontSize: 10, color: "#94A3B8", marginTop: 2,
                                                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                                        }}>{preset.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    }
                                    {TEMPLATE_PRESETS.filter(p => p.name.toLowerCase().includes(gallerySearch.toLowerCase())).length === 0 && (
                                        <div style={{ textAlign: "center", padding: "24px 16px", border: "1px solid #F1F5F9", borderRadius: 12, background: "#F8FAFC" }}>
                                            <Search size={20} style={{ color: "#CBD5E1", marginBottom: 8 }} />
                                            <p style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>No templates found</p>
                                            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Try a different search term.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

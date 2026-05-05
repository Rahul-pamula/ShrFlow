"use client";
import React from "react";
import { 
    ChevronLeft, Share2, Shapes, Search, Sparkles, Plus, Mic, Layout, ChevronDown, Minus,
    Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle, Type, Image as ImageIcon, 
    LayoutTemplate, UploadCloud, Tag, Wand2, Languages, Type as TypeIcon
} from "lucide-react";
import { BrandDashboard } from "./BrandDashboard";
import { SectionLabel, TabsContainer, Tab, DraggableItem } from "./BuilderComponents";

import { ValidationPanel } from "./components/ValidationPanel";

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
    onAddBlock: (zone: "header" | "body" | "footer", type: string, props?: any) => void;
    BLOCK_DEFAULTS: any;
    BLOCK_ICONS: any;
    TEMPLATE_PRESETS: any[];
    COMMON_ICONS: string[];
    token: string | null;
    onCreateNew: () => void;
    brandKits: any[];
    setBrandKits: any;
    activeBrandId: string;
    setActiveBrandId: (id: string) => void;
    applyBrandToDesign: () => void;
    onUseBrandComponent: (comp: any) => void;
}

export const SecondaryDrawer = ({
    activeSidebarTab, setActiveSidebarTab, sidebarWidth, activeSubMenu, setActiveSubMenu,
    showElements, setShowElements, photoSearchInput, setPhotoSearchInput,
    photoSearch, setPhotoSearch, iconSearch, setIconSearch,
    searchTerm, setSearchTerm, loadTemplate, design, pushDesign,
    onAddBlock,
    BLOCK_DEFAULTS, BLOCK_ICONS, TEMPLATE_PRESETS, COMMON_ICONS,
    token, onCreateNew,
    brandKits, setBrandKits, activeBrandId, setActiveBrandId, applyBrandToDesign, onUseBrandComponent
}: SecondaryDrawerProps) => {

    const [gallerySearch, setGallerySearch] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

    const HEADER_TEMPLATES = [
        { name: "The Signature", type: "hero", props: { logoUrl: "https://placehold.jp/24/6366f1/ffffff/150x50.png?text=BRAND", bgColor: "#ffffff", textColor: "#1E293B", padding: "40px" } },
        { name: "Midnight Modern", type: "hero", props: { headline: "EXCLUSIVE ACCESS", logoUrl: "https://placehold.jp/24/ffffff/1e293b/150x50.png?text=LOGO", bgColor: "#1e293b", textColor: "#ffffff", fontSize: 18, fontWeight: 800 } },
        { name: "Vibrant Wave", type: "hero", props: { headline: "FRESH FLAVOR", logoUrl: "https://placehold.jp/24/000000/fde047/150x50.png?text=LOGO", bgColor: "#FDE047", textColor: "#000000", fontSize: 16, fontWeight: 900 } },
        { name: "Minimalist Stripe", type: "hero", props: { logoUrl: "https://placehold.jp/16/64748b/f8f9fb/100x30.png?text=MINIMAL", bgColor: "#f8f9fb", textColor: "#64748B", padding: "10px" } },
        { name: "Bold Accent", type: "hero", props: { headline: "WEEKLY UPDATE", logoUrl: "https://placehold.jp/20/ffffff/4f46e5/150x50.png?text=LOGO", bgColor: "#6366F1", textColor: "#ffffff", fontSize: 20 } }
    ];

    const FOOTER_TEMPLATES = [
        { name: "Corporate Clean", type: "footer", props: { logoUrl: "https://placehold.jp/18/475569/ffffff/120x40.png?text=LOGO", align: "center", content: "123 Main St, New York\nUnsubscribe from this list", bgColor: "#ffffff" } },
        { name: "Midnight Footer", type: "footer", props: { logoUrl: "https://placehold.jp/18/94a3b8/1e293b/120x40.png?text=LOGO", logoGray: true, align: "center", content: "© 2026 Brand Inc. All Rights Reserved.", bgColor: "#1e293b", color: "#94a3b8" } },
        { name: "Social Hub", type: "social", props: { align: "center", platform: "instagram" } },
        { name: "Minimalist Link", type: "footer", props: { align: "center", content: "View in browser · Unsubscribe · Privacy Policy", color: "#94a3b8" } },
        { name: "Split Brand", type: "footer", props: { logoUrl: "https://placehold.jp/18/475569/f8f9fb/100x30.png?text=LOGO", align: "left", content: "© 2026 Brand Inc.", bgColor: "#f8f9fb" } }
    ];

    const inputStyle = {
        width: "100%", padding: "10px 12px", borderRadius: 8,
        border: "1px solid #E4E4E7", fontSize: 13, outline: "none",
        background: "#F4F4F5", transition: "all 0.2s"
    };

    return (
        <div style={{
            width: sidebarWidth, background: "#ffffff", borderRight: "1px solid #E4E4E7",
            display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 10, position: "relative",
            boxShadow: "4px 0 24px rgba(0,0,0,0.02)"
        }}>
            <div style={{ flex: 1, overflow: activeSidebarTab === "brand" ? "hidden" : "auto", padding: activeSidebarTab === "brand" ? 0 : "20px" }}>
                
                {/* --- DESIGN TAB (Templates & Blank Canvas) --- */}
                {activeSidebarTab === "design" && (
                    <div style={{ animation: "fadeSlideUp 0.2s ease-out" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#18191B", marginBottom: 16 }}>Design Templates</h3>
                        
                        <div style={{ position: "relative", marginBottom: 20 }}>
                            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#A1A1AA", pointerEvents: "none" }} />
                            <input
                                placeholder="Search templates..."
                                value={gallerySearch}
                                onChange={e => setGallerySearch(e.target.value)}
                                onKeyDown={e => e.stopPropagation()}
                                style={{
                                    ...inputStyle,
                                    padding: "10px 10px 10px 36px",
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                            <div>
                                <h4 style={{ fontSize: 12, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Featured Designs</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    {TEMPLATE_PRESETS
                                        .filter(p => p.name.toLowerCase().includes(gallerySearch.toLowerCase()))
                                        .slice(0, 12)
                                        .map((preset) => (
                                            <div
                                                key={preset.id}
                                                onClick={() => loadTemplate(preset)}
                                                style={{
                                                    borderRadius: 12, border: "1px solid #E4E4E7",
                                                    background: "#fff", cursor: "pointer", transition: "all 0.2s",
                                                    overflow: "hidden", position: "relative"
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = "#6366F1"}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = "#E4E4E7"}
                                            >
                                                <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", background: "#F4F4F5" }}>
                                                    {preset.thumbnail ? (
                                                        <img src={preset.thumbnail} alt={preset.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    ) : (
                                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><LayoutTemplate size={24} style={{ color: "#D4D4D8" }} /></div>
                                                    )}
                                                </div>
                                                <div style={{ padding: "8px", background: "#fff", borderTop: "1px solid #F4F4F5" }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#18191B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{preset.name}</div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: 12, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Full Library ({TEMPLATE_PRESETS.length})</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    {TEMPLATE_PRESETS
                                        .filter(p => p.name.toLowerCase().includes(gallerySearch.toLowerCase()))
                                        .slice(12)
                                        .map((preset) => (
                                            <div
                                                key={preset.id}
                                                onClick={() => loadTemplate(preset)}
                                                style={{
                                                    borderRadius: 12, border: "1px solid #E4E4E7",
                                                    background: "#fff", cursor: "pointer", transition: "all 0.2s",
                                                    overflow: "hidden", position: "relative"
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = "#6366F1"}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = "#E4E4E7"}
                                            >
                                                <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", background: "#F4F4F5" }}>
                                                    {preset.thumbnail ? (
                                                        <img src={preset.thumbnail} alt={preset.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    ) : (
                                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><LayoutTemplate size={24} style={{ color: "#D4D4D8" }} /></div>
                                                    )}
                                                </div>
                                                <div style={{ padding: "8px", background: "#fff", borderTop: "1px solid #F4F4F5" }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#18191B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{preset.name}</div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ELEMENTS TAB (Canva Style) --- */}
                {activeSidebarTab === "elements" && (
                    <div style={{ animation: "fadeSlideUp 0.2s ease-out" }}>
                        {/* Search Bar */}
                        <div style={{ 
                            position: "relative", marginBottom: 12, 
                            display: "flex", alignItems: "center",
                            border: "1px solid #E4E4E7", borderRadius: 8, padding: "8px 12px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)", background: "#fff"
                        }}>
                            <Plus size={16} color="#52525B" />
                            <input
                                placeholder="Describe your ideal element"
                                value={iconSearch}
                                onChange={e => setIconSearch(e.target.value)}
                                style={{ 
                                    flex: 1, border: "none", outline: "none", 
                                    padding: "0 8px", fontSize: 13, background: "transparent", color: "#18191B"
                                }}
                            />
                            <Mic size={16} color="#52525B" />
                        </div>

                        {/* Generate / Search buttons */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                            <button style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "8px 12px", background: "#fff", border: "1px solid #E4E4E7",
                                borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#18191B", cursor: "pointer",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                            }}>
                                <Sparkles size={14} color="#8B3DFF" /> Generate <ChevronDown size={14} color="#A1A1AA" />
                            </button>
                            <button style={{
                                flex: 1, padding: "8px", background: "#8B3DFF", color: "#fff",
                                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer"
                            }}>
                                Search
                            </button>
                        </div>

                        {/* Canvas & Zone Backgrounds */}
                        <div style={{ marginTop: 40, borderTop: "1px solid #F1F5F9", paddingTop: 24 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Document Layout</h3>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {[
                                    { label: "Header Background", key: "headerBackground" },
                                    { label: "Body Background", key: "bodyBackground" },
                                    { label: "Footer Background", key: "footerBackground" },
                                    { label: "Outer Canvas", key: "background" }
                                ].map(field => (
                                    <div key={field.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{field.label}</span>
                                        <input 
                                            type="color" 
                                            value={design.theme[field.key] || "#ffffff"} 
                                            onChange={e => pushDesign(d => { d.theme[field.key] = e.target.value; return d; })}
                                            style={{ width: 32, height: 32, border: "1px solid #E2E8F0", borderRadius: 6, background: "none", cursor: "pointer" }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3-Column Grid for Categories */}
                        <div style={{ marginTop: 40 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Block Library</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px 8px" }}>
                                {[
                                    { id: "headers", name: "Headers", icon: <LayoutTemplate size={20} color="#fff" strokeWidth={2.5} />, bg: "linear-gradient(135deg, #B565F2, #8B3DFF)", shadow: "rgba(139, 61, 255, 0.2)" },
                                    { id: "footers", name: "Footers", icon: <LayoutTemplate size={20} color="#fff" strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />, bg: "linear-gradient(135deg, #FF6B6B, #E03131)", shadow: "rgba(224, 49, 49, 0.2)" },
                                    { id: "text-boxes", name: "Text box", icon: <Type size={20} color="#fff" strokeWidth={2.5} />, bg: "linear-gradient(135deg, #47ADFF, #0077FF)", shadow: "rgba(0, 119, 255, 0.2)" },
                                    { id: "images", name: "Images", icon: <ImageIcon size={20} color="#fff" strokeWidth={2.5} />, bg: "linear-gradient(135deg, #F59E0B, #D97706)", shadow: "rgba(217, 119, 6, 0.2)" },
                                    { id: "shapes", name: "Shapes", icon: <Shapes size={20} color="#fff" strokeWidth={2.5} />, bg: "linear-gradient(135deg, #10B981, #059669)", shadow: "rgba(5, 150, 105, 0.2)" },
                                    { id: "buttons", name: "Buttons", icon: <Plus size={20} color="#fff" strokeWidth={2.5} />, bg: "linear-gradient(135deg, #22B8CF, #0B7285)", shadow: "rgba(11, 114, 133, 0.2)" },
                                    { id: "icon-blocks", name: "Icon blocks", icon: <Shapes size={20} color="#fff" strokeWidth={2.5} />, bg: "linear-gradient(135deg, #E599F7, #AE3EC9)", shadow: "rgba(174, 62, 201, 0.2)" },
                                ].map((cat, i) => (
                                    <div key={i} onClick={() => setSelectedCategory(cat.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
                                        <div style={{ 
                                            width: 64, height: 64, borderRadius: 16, background: cat.bg, 
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            marginBottom: 8, boxShadow: `0 8px 16px ${cat.shadow}`,
                                            position: "relative", overflow: "hidden"
                                        }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)" }} />
                                            {cat.icon}
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 500, color: "#3F3F46", textAlign: "center" }}>{cat.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Sub-category View */}
                        {selectedCategory && (
                            <div style={{ 
                                position: "absolute", inset: 0, background: "#fff", zIndex: 100, padding: 20,
                                animation: "fadeSlideRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                                    <button onClick={() => setSelectedCategory(null)} style={{ border: "none", background: "#8B3DFF", color: "#fff", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(139, 61, 255, 0.3)" }}>
                                        <ChevronLeft size={18} strokeWidth={3} />
                                    </button>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#18191B", textTransform: "capitalize" }}>{selectedCategory.replace("-", " ")}</h3>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {selectedCategory === "text-boxes" && (
                                        <>
                                            <DraggableItem type="text" label="Primary Heading" icon={<Type size={20} />} props={{ content: "<h1>Add a heading</h1>", fontSize: 32, fontWeight: 800 }} onClick={() => onAddBlock("body", "text", { content: "<h1>Add a heading</h1>", fontSize: 32, fontWeight: 800 })} />
                                            <DraggableItem type="text" label="Subheading" icon={<Type size={20} />} props={{ content: "<h2>Add a subheading</h2>", fontSize: 20, fontWeight: 600 }} onClick={() => onAddBlock("body", "text", { content: "<h2>Add a subheading</h2>", fontSize: 20, fontWeight: 600 })} />
                                            <DraggableItem type="text" label="Body Text" icon={<Type size={20} />} props={{ content: "<p>Add a little bit of body text</p>", fontSize: 14, fontWeight: 400 }} onClick={() => onAddBlock("body", "text", { content: "<p>Add a little bit of body text</p>", fontSize: 14, fontWeight: 400 })} />
                                        </>
                                    )}
                                    {(selectedCategory === "headers" ? HEADER_TEMPLATES : (selectedCategory === "footers" ? FOOTER_TEMPLATES : [])).map((temp, i) => (
                                        <DraggableItem 
                                            key={i}
                                            type={temp.type as any}
                                            label={temp.name}
                                            icon={selectedCategory === "headers" ? <LayoutTemplate size={20} /> : <Minus size={20} />}
                                            props={temp.props}
                                            restriction={selectedCategory}
                                            onClick={() => onAddBlock(
                                                selectedCategory === "headers" ? "header" : "footer",
                                                temp.type,
                                                temp.props
                                            )}
                                        />
                                    ))}
                                    {selectedCategory === "images" && (
                                        <>
                                            <DraggableItem type="image" label="Basic Image" icon={<ImageIcon size={20} />} props={{ src: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop", width: "100%", borderRadius: 12 }} onClick={() => onAddBlock("body", "image", { src: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop" })} />
                                            <DraggableItem type="image" label="Rounded Image" icon={<ImageIcon size={20} />} props={{ src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop", width: "100%", borderRadius: "50%" }} onClick={() => onAddBlock("body", "image", { src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop", borderRadius: "50%" })} />
                                        </>
                                    )}
                                    {selectedCategory === "shapes" && (
                                        <>
                                            <DraggableItem type="shape" label="Square" icon={<Shapes size={20} />} props={{ backgroundColor: "#8B3DFF", width: 100, height: 100 }} onClick={() => onAddBlock("body", "shape", { backgroundColor: "#8B3DFF", width: 100, height: 100 })} />
                                            <DraggableItem type="shape" label="Circle" icon={<Shapes size={20} />} props={{ backgroundColor: "#F59E0B", width: 100, height: 100, borderRadius: "50%" }} onClick={() => onAddBlock("body", "shape", { backgroundColor: "#F59E0B", width: 100, height: 100, borderRadius: "50%" })} />
                                            <DraggableItem type="divider" label="Divider Line" icon={<Minus size={20} />} props={{ color: "#E2E8F0", height: 2 }} onClick={() => onAddBlock("body", "divider", { color: "#E2E8F0", height: 2 })} />
                                        </>
                                    )}
                                    {selectedCategory === "buttons" && (
                                        <>
                                            <DraggableItem type="button" label="Primary Button" props={{ backgroundColor: "#6366F1", color: "#ffffff", borderRadius: 8 }} onClick={() => onAddBlock("body", "button", { backgroundColor: "#6366F1", color: "#ffffff", borderRadius: 8 })} />
                                            <DraggableItem type="button" label="Outline Button" props={{ backgroundColor: "transparent", color: "#6366F1", border: "2px solid #6366F1", borderRadius: 8 }} onClick={() => onAddBlock("body", "button", { backgroundColor: "transparent", color: "#6366F1", borderRadius: 8 })} />
                                            <DraggableItem type="button" label="Pill Button" props={{ backgroundColor: "#10B981", color: "#ffffff", borderRadius: 50 }} onClick={() => onAddBlock("body", "button", { backgroundColor: "#10B981", color: "#ffffff", borderRadius: 50 })} />
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TEXT TAB --- */}
                {activeSidebarTab === "text" && (
                    <div style={{ animation: "fadeSlideUp 0.2s ease-out" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#18191B", marginBottom: 16 }}>Text</h3>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <button
                                draggable
                                onDragStart={e => {
                                    e.dataTransfer.setData("blockType", "text");
                                    e.dataTransfer.setData("blockProps", JSON.stringify({ content: "<h1>Add a heading</h1>", fontSize: 32, fontWeight: 800 }));
                                }}
                                style={{
                                    padding: "20px 16px", background: "#F4F4F5", borderRadius: 8, border: "none", cursor: "grab",
                                    textAlign: "left", transition: "all 0.15s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#E4E4E7"}
                                onMouseLeave={e => e.currentTarget.style.background = "#F4F4F5"}
                            >
                                <span style={{ fontSize: 24, fontWeight: 800, color: "#18191B" }}>Add a heading</span>
                            </button>

                            <button
                                draggable
                                onDragStart={e => {
                                    e.dataTransfer.setData("blockType", "text");
                                    e.dataTransfer.setData("blockProps", JSON.stringify({ content: "<h2>Add a subheading</h2>", fontSize: 20, fontWeight: 600 }));
                                }}
                                style={{
                                    padding: "16px", background: "#F4F4F5", borderRadius: 8, border: "none", cursor: "grab",
                                    textAlign: "left", transition: "all 0.15s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#E4E4E7"}
                                onMouseLeave={e => e.currentTarget.style.background = "#F4F4F5"}
                            >
                                <span style={{ fontSize: 18, fontWeight: 600, color: "#18191B" }}>Add a subheading</span>
                            </button>

                            <button
                                draggable
                                onDragStart={e => {
                                    e.dataTransfer.setData("blockType", "text");
                                    e.dataTransfer.setData("blockProps", JSON.stringify({ content: "<p>Add a little bit of body text</p>", fontSize: 14, fontWeight: 400 }));
                                }}
                                style={{
                                    padding: "12px 16px", background: "#F4F4F5", borderRadius: 8, border: "none", cursor: "grab",
                                    textAlign: "left", transition: "all 0.15s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#E4E4E7"}
                                onMouseLeave={e => e.currentTarget.style.background = "#F4F4F5"}
                            >
                                <span style={{ fontSize: 14, fontWeight: 400, color: "#3F3F46" }}>Add a little bit of body text</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* --- UPLOADS TAB --- */}
                {activeSidebarTab === "uploads" && (
                    <div style={{ animation: "fadeSlideUp 0.2s ease-out" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#18191B", marginBottom: 16 }}>Uploads</h3>
                        
                        <button style={{
                            width: "100%", padding: "12px", background: "#7D2AE8", color: "#fff", border: "none", borderRadius: 8,
                            fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            marginBottom: 24, boxShadow: "0 4px 12px rgba(125,42,232,0.2)"
                        }}>
                            <UploadCloud size={16} /> Upload files
                        </button>

                        <div style={{ textAlign: "center", padding: "40px 20px", background: "#F4F4F5", borderRadius: 8, border: "1px dashed #D4D4D8" }}>
                            <ImageIcon size={32} style={{ color: "#A1A1AA", marginBottom: 12, margin: "0 auto" }} />
                            <p style={{ fontSize: 12, color: "#52525B", fontWeight: 500 }}>No uploads yet</p>
                            <p style={{ fontSize: 11, color: "#A1A1AA", marginTop: 4 }}>Files you upload will appear here.</p>
                        </div>
                    </div>
                )}

                {/* --- TOKENS TAB --- */}
                {activeSidebarTab === "tokens" && (
                    <div style={{ animation: "fadeSlideUp 0.2s ease-out" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#18191B", marginBottom: 8 }}>Personalization</h3>
                        <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>Click a tag to insert it at your cursor position inside a text block.</p>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {[
                                { label: "First Name", token: "{{first_name}}" },
                                { label: "Last Name", token: "{{last_name}}" },
                                { label: "Email Address", token: "{{email}}" },
                                { label: "City", token: "{{city}}" },
                                { label: "Company", token: "{{company}}" },
                                { label: "Unsubscribe Link", token: "{{unsubscribe_url}}" }
                            ].map(t => (
                                <button
                                    key={t.token}
                                    onClick={() => {
                                        // Insert at cursor in active contentEditable, else copy to clipboard
                                        const active = document.activeElement as HTMLElement;
                                        if (active && active.isContentEditable) {
                                            document.execCommand("insertText", false, t.token);
                                        } else {
                                            navigator.clipboard.writeText(t.token);
                                        }
                                    }}
                                    style={{
                                        padding: "12px 16px", background: "#fff", borderRadius: 8, border: "1px solid #E2E8F0",
                                        display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = "#6366F1"}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <Tag size={14} color="#64748B" />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{t.label}</span>
                                    </div>
                                    <code style={{ fontSize: 11, background: "#F1F5F9", padding: "2px 6px", borderRadius: 4, color: "#6366F1" }}>{t.token}</code>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- AI PANEL --- */}
                {activeSidebarTab === "ai" && (
                    <div style={{ animation: "fadeSlideUp 0.2s ease-out" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #00C4CC, #7D2AE8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                                <Wand2 size={18} />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#18191B" }}>AI Content Assistant</h3>
                        </div>
                        <p style={{ fontSize: 13, color: "#64748B", marginBottom: 24 }}>Select text in your email and use these tools to refine it.</p>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[
                                { label: "Improve Writing", icon: <Sparkles size={16} />, desc: "Fix grammar and polish the tone" },
                                { label: "Rewrite", icon: <Languages size={16} />, desc: "Say the same thing differently" },
                                { label: "Shorten", icon: <TypeIcon size={16} />, desc: "Make it more concise" },
                                { label: "Expand", icon: <TypeIcon size={16} />, desc: "Add more detail and depth" }
                            ].map(tool => (
                                <button
                                    key={tool.label}
                                    style={{
                                        padding: "16px", background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0",
                                        display: "flex", flexDirection: "column", gap: 4, cursor: "pointer",
                                        transition: "all 0.2s", textAlign: "left"
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#7D2AE8"; e.currentTarget.style.background = "#FDFBFF"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "#fff"; }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7D2AE8" }}>
                                        {tool.icon}
                                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{tool.label}</span>
                                    </div>
                                    <span style={{ fontSize: 12, color: "#64748B" }}>{tool.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- VALIDATION TAB --- */}
                {activeSidebarTab === "check" && (
                    <ValidationPanel />
                )}

                {/* --- BRAND TAB --- */}
                {activeSidebarTab === "brand" && (
                    <div style={{ height: "100%", animation: "fadeSlideUp 0.2s ease-out" }}>
                        <BrandDashboard 
                            mode="sidebar"
                            brandKits={brandKits}
                            setBrandKits={setBrandKits}
                            activeBrandId={activeBrandId}
                            setActiveBrandId={setActiveBrandId}
                            applyBrandToDesign={applyBrandToDesign}
                            setActiveSidebarTab={setActiveSidebarTab}
                            onUseComponent={onUseBrandComponent}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    Type, ImageIcon, Square, Minus, Layout, Loader2, ArrowLeft,
    GripVertical, Save, Plus, Undo2, Redo2, Eye,
    Share2, Settings2, Monitor, Smartphone, Layers, Blocks,
    Trash2, Copy, ChevronDown, Shapes, Youtube, MessageCircle, ChevronLeft,
    Facebook, Instagram, Twitter, Linkedin, Search, X, Star, Clock, Terminal,
    Mail, Link, Info, Shield, Activity, Tag, Lock, Unlock, Globe, HelpCircle, ToggleLeft, ChevronRight, User, MousePointer2
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import EditorCanvas from "./EditorCanvas";
import {
    DesignJSON, DesignBlock, BlockType,
    SelectedNode, DEFAULT_THEME, DEFAULT_SETTINGS, BLOCK_DEFAULTS, uid, clone,
    BrandKit, DEFAULT_BRAND_KITS, BrandComponent
} from "./types";
import ImageUploadModal from "./ImageUploadModal";
import { TEMPLATE_PRESETS, TemplatePreset } from "./templates_library";
import { LeftIconBar } from "./LeftIconBar";
import { SecondaryDrawer } from "./SecondaryDrawer";
import { ProjectsDashboard } from "./ProjectsDashboard";
import { BrandDashboard } from "./BrandDashboard";
// ── BLOCK ICONS ────────────────────────────────────────────────────────────
const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
    text: <Type size={20} />, image: <ImageIcon size={20} />, button: <Square size={20} />,
    divider: <Minus size={20} />, spacer: <Layout size={20} opacity={.4} />,
    social: <Share2 size={20} />, hero: <Monitor size={20} />, footer: <Settings2 size={20} />,
    shape: <Shapes size={20} />, line: <Minus size={20} style={{ transform: "rotate(-45deg)" }} />,
    "floating-text": <Layers size={20} />,
    "floating-image": <ImageIcon size={20} />,
    layout: <Layout size={20} />,
    rating: <Star size={20} />,
    countdown: <Clock size={20} />,
    html: <Terminal size={20} />,
};

// ── HELPER COMPONENTS & STYLES ─────────────────────────────────────────────
const iconBtn: React.CSSProperties = { width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 10, background: "none", cursor: "pointer", transition: "all 0.15s ease" };

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E2E8F0",
    background: "#F8FAFC", color: "#0F172A", fontSize: 13, outline: "none",
    transition: "all 0.15s ease", boxSizing: "border-box", fontWeight: 500,
};

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16, ...style }}>{children}</div>;
}

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #E2E8F0" }}>{title}</div>
            {children}
        </div>
    );
}

function FormGroup({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return <div style={{ marginBottom: 24, ...style }}>{children}</div>;
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8, ...style }}>{children}</div>;
}

function CollapsibleSection({ title, icon, children, isOpen, onToggle }: { title: string; icon: React.ReactNode; children: React.ReactNode; isOpen: boolean; onToggle: () => void }) {
    return (
        <div style={{ borderBottom: "1px solid #F1F5F9", overflow: "hidden" }}>
            <button
                onClick={onToggle}
                style={{
                    width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
                    background: "none", border: "none", cursor: "pointer", transition: "all 0.2s"
                }}
            >
                <div style={{ color: isOpen ? "#6366F1" : "#64748B", transition: "color 0.2s" }}>{icon}</div>
                <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 700, color: isOpen ? "#0F172A" : "#475569", transition: "color 0.2s" }}>{title}</span>
                <div style={{ color: "#94A3B8", transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                    <ChevronDown size={16} />
                </div>
            </button>
            <div style={{
                maxHeight: isOpen ? "1000px" : "0px", overflow: "hidden",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: isOpen ? 1 : 0, paddingBottom: isOpen ? 24 : 0
            }}>
                <div style={{ padding: "0 20px" }}>{children}</div>
            </div>
        </div>
    );
}

const COMMON_ICONS = ["Type", "Image", "Square", "Minus", "Layout", "Share2", "Facebook", "Instagram", "Twitter", "Linkedin", "Youtube", "MessageCircle", "Shapes", "Eye", "Save", "Trash2", "Copy", "History", "Settings", "Search", "X", "Check", "Info", "AlertCircle", "Bell", "Calendar", "Mail", "Phone", "Video", "MapPin", "Gift", "Star", "Heart", "Smile", "ThumbsUp", "Clock", "Download", "ExternalLink", "Globe", "HelpCircle", "Lock", "Unlock", "Maximize", "Minimize", "Menu", "MoreHorizontal", "MoreVertical", "Play", "Pause", "RefreshCw", "RotateCcw", "Send", "Tag", "Terminal", "User", "Users", "Briefcase", "Home", "Trophy", "Award", "Music", "Mic", "Camera", "Smartphone", "Monitor", "Coffee", "ShoppingCart", "FastForward", "Rewind"];

function TabsContainer({ children }: { children: React.ReactNode }) {
    return <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>{children}</div>;
}

function Tab({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
    return <button onClick={onClick} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #E2E8F0", background: active ? "#6366F1" : "#fff", color: active ? "#fff" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{children}</button>;
}

// ── HELPER: CLEAN URL OPENING ──────────────────────────────────────────────
const cleanOpen = (url: string) => {
    const u = (url || "").trim().replace(/^#/, "");
    if (!u || u === "") return;
    if (typeof window !== "undefined") {
        window.open(u.startsWith("http") ? u : `https://${u}`, "_blank");
    }
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function PremiumEmailBuilder() {
    const params = useParams();
    const router = useRouter();
    const { token, isLoading: authLoading } = useAuth();
    const templateId = params.id as string;

    const [name, setName] = useState("Untitled Template");
    const [subject, setSubject] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [design, setDesign] = useState<DesignJSON>({ theme: DEFAULT_THEME, settings: DEFAULT_SETTINGS, headerBlocks: [], bodyBlocks: [], footerBlocks: [] });
    const [history, setHistory] = useState<DesignJSON[]>([]);
    const [future, setFuture] = useState<DesignJSON[]>([]);
    const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
    const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
    // Use tab query param if present
    const [activeSidebarTab, setActiveSidebarTab] = useState<string>("projects");
    
    useEffect(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get("tab");
            if (tab) {
                setActiveSidebarTab(tab);
            }
        }
    }, []);
    const [showElements, setShowElements] = useState(false);
    const [inspectorTab, setInspectorTab] = useState<"content" | "style" | "settings">("content");
    const [showPreview, setShowPreview] = useState(false);
    const [compiledHtml, setCompiledHtml] = useState("");
    const [pendingImageCol, setPendingImageCol] = useState<string | null>(null);
    const [activeSubMenu, setActiveSubMenu] = useState<"social" | "icons" | "advanced" | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [photoSearch, setPhotoSearch] = useState("");
    const [photoSearchInput, setPhotoSearchInput] = useState("");
    const [iconSearch, setIconSearch] = useState("");

    // Brand Kit State
    const [brandKits, setBrandKits] = useState<BrandKit[]>(DEFAULT_BRAND_KITS);
    const [activeBrandId, setActiveBrandId] = useState<string>(DEFAULT_BRAND_KITS[0].id);

    // Sidebar Resizer State (Left)
    const [sidebarWidth, setSidebarWidth] = useState(280);
    const [isResizingLeft, setIsResizingLeft] = useState(false);

    // Inspector Resizer State (Right)
    const [inspectorWidth, setInspectorWidth] = useState(340);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ general: true });

    const startResizingLeft = useCallback(() => setIsResizingLeft(true), []);
    const stopResizingLeft = useCallback(() => setIsResizingLeft(false), []);

    const startResizingRight = useCallback(() => setIsResizingRight(true), []);
    const stopResizingRight = useCallback(() => setIsResizingRight(false), []);

    const resizeLeft = useCallback((e: MouseEvent) => {
        if (isResizingLeft) {
            let newWidth = e.clientX;
            if (newWidth < 200) newWidth = 200;
            if (newWidth > 600) newWidth = 600;
            setSidebarWidth(newWidth);
        }
    }, [isResizingLeft]);

    const resizeRight = useCallback((e: MouseEvent) => {
        if (isResizingRight) {
            let newWidth = window.innerWidth - e.clientX;
            if (newWidth < 280) newWidth = 280;
            if (newWidth > 600) newWidth = 600;
            setInspectorWidth(newWidth);
        }
    }, [isResizingRight]);

    useEffect(() => {
        if (isResizingLeft) {
            window.addEventListener("mousemove", resizeLeft);
            window.addEventListener("mouseup", stopResizingLeft);
        } else if (isResizingRight) {
            window.addEventListener("mousemove", resizeRight);
            window.addEventListener("mouseup", stopResizingRight);
        }

        return () => {
            window.removeEventListener("mousemove", resizeLeft);
            window.removeEventListener("mouseup", stopResizingLeft);
            window.removeEventListener("mousemove", resizeRight);
            window.removeEventListener("mouseup", stopResizingRight);
        };
    }, [isResizingLeft, isResizingRight, resizeLeft, resizeRight, stopResizingLeft, stopResizingRight]);

    const pushDesign = useCallback((modifier: (d: DesignJSON) => DesignJSON) => {
        setDesign((prev) => {
            const next = modifier(clone(prev));
            setHistory((h) => [...h, clone(prev)].slice(-20));
            setFuture([]);
            return next;
        });
    }, []);

    const applyBrandToDesign = useCallback(() => {
        const activeBrand = brandKits.find(b => b.id === activeBrandId);
        if (!activeBrand) return;

        pushDesign(d => {
            const primaryColor = activeBrand.colors.find(c => c.group === "Primary")?.hex || d.theme.primaryColor;
            const secondaryColor = activeBrand.colors.find(c => c.group === "Secondary")?.hex || d.theme.background;
            const ty = activeBrand.typography;

            d.theme.primaryColor = primaryColor;
            d.theme.background = secondaryColor;
            d.theme.fontFamily = ty.bodyFont;
            
            const updateBlocks = (blocks: DesignBlock[]) => {
                blocks.forEach(block => {
                    // Universal spacing application
                    if (["text", "button", "hero", "footer", "floating-text"].includes(block.type)) {
                        block.props.lineHeight = ty.baseLineHeight;
                        block.props.letterSpacing = ty.letterSpacing;
                    }

                    if (block.type === "button") {
                        block.props.backgroundColor = primaryColor;
                        block.props.fontFamily = ty.bodyFont;
                        block.props.fontWeight = ty.buttonWeight;
                        block.props.textTransform = ty.buttonTransform;
                        block.props.fontSize = ty.bodySize;
                    }

                    if (block.type === "text" || block.type === "floating-text") {
                        const currentSize = block.props.fontSize || 16;
                        if (currentSize > 28) {
                            block.props.fontSize = ty.h1Size;
                            block.props.fontFamily = ty.headingFont;
                            block.props.fontWeight = ty.headingWeight;
                            block.props.textTransform = ty.headingTransform;
                            block.props.color = primaryColor;
                        } else if (currentSize > 20) {
                            block.props.fontSize = ty.h2Size;
                            block.props.fontFamily = ty.headingFont;
                            block.props.fontWeight = ty.headingWeight;
                            block.props.textTransform = ty.headingTransform;
                        } else if (currentSize > 17) {
                            block.props.fontSize = ty.h3Size;
                            block.props.fontFamily = ty.headingFont;
                            block.props.fontWeight = ty.headingWeight;
                        } else if (currentSize < 13) {
                            block.props.fontSize = ty.smallSize;
                            block.props.fontFamily = ty.bodyFont;
                            block.props.fontWeight = ty.bodyWeight;
                        } else {
                            block.props.fontSize = ty.bodySize;
                            block.props.fontFamily = ty.bodyFont;
                            block.props.fontWeight = ty.bodyWeight;
                        }
                    }

                    if (block.type === "hero") {
                        block.props.bgColor = primaryColor;
                        block.props.fontFamily = ty.headingFont;
                        block.props.fontWeight = ty.headingWeight;
                        block.props.textTransform = ty.headingTransform;
                    }

                    if (block.type === "footer") {
                        block.props.fontSize = ty.smallSize;
                        block.props.fontFamily = ty.bodyFont;
                        block.props.fontWeight = ty.bodyWeight;
                        block.props.color = "#94A3B8";
                    }

                    if (block.type === "shape" && block.props.backgroundColor !== "transparent") {
                        block.props.backgroundColor = primaryColor;
                    }
                });
            };

            updateBlocks(d.headerBlocks);
            updateBlocks(d.bodyBlocks);
            updateBlocks(d.footerBlocks);

            return d;
        });
    }, [brandKits, activeBrandId, pushDesign]);

    const useBrandComponent = useCallback((comp: BrandComponent) => {
        pushDesign(d => {
            const newBlock = clone(comp.block);
            const refreshIds = (b: DesignBlock) => {
                b.id = `blk-${uid()}`;
                if (b.type === "layout" && b.props.columns) {
                    b.props.columns.forEach((c: any) => c.blocks?.forEach(refreshIds));
                }
            };
            refreshIds(newBlock);
            d.bodyBlocks.push(newBlock);
            return d;
        });
        setActiveSidebarTab("projects");
    }, [pushDesign]);

    const updateSetting = useCallback((section: keyof typeof DEFAULT_SETTINGS, key: string, value: any) => {
        pushDesign(d => {
            if (!d.settings) d.settings = clone(DEFAULT_SETTINGS);
            if (!d.settings[section]) d.settings[section] = clone(DEFAULT_SETTINGS[section]) as any;
            (d.settings[section] as any)[key] = value;
            return d;
        });
    }, [pushDesign]);

    const undo = () => { if (!history.length) return; setFuture((f) => [clone(design), ...f]); setDesign(history[history.length - 1]); setHistory((h) => h.slice(0, -1)); };
    const redo = () => { if (!future.length) return; setHistory((h) => [...h, clone(design)]); setDesign(future[0]); setFuture((f) => f.slice(1)); };

    // ── AUTOSAVE LOGIC ────────────────────────────────────────────────────────
    const extractMetadata = useCallback((d: DesignJSON) => {
        const allBlocks = [...d.headerBlocks, ...d.bodyBlocks, ...d.footerBlocks];
        const firstText = allBlocks.find(b => b.type === "text")?.props.content || "";
        const cleanText = firstText.replace(/<[^>]*>/g, "").trim();
        return {
            subject: cleanText.slice(0, 30),
            preview: cleanText.slice(0, 100)
        };
    }, []);

    const autoSave = useCallback(async () => {
        if (loading || authLoading || !token || !templateId || templateId === "new") return;
        
        setIsSaving(true);
        const metadata = extractMetadata(design);
        
        // Auto-rename if still "Untitled" and we have a subject
        let finalName = name;
        if (name === "Untitled" && metadata.subject) {
            finalName = metadata.subject;
            setName(finalName);
        }

        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
            await fetch(`${API}/templates/${templateId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ 
                    name: finalName, 
                    subject: subject || metadata.subject, 
                    preview: metadata.preview,
                    design_json: design,
                    template_type: "block",
                    schema_version: "2.0.0"
                }),
            });
            setLastSavedAt(new Date());
        } catch (err) {
            console.error("Autosave failed", err);
        } finally {
            setIsSaving(false);
        }
    }, [design, name, subject, token, templateId, loading, authLoading, extractMetadata]);

    useEffect(() => {
        if (loading || authLoading || !token || templateId === "new") return;
        const timeout = setTimeout(() => {
            autoSave();
        }, 1500);
        return () => clearTimeout(timeout);
    }, [design, name, subject, autoSave, loading, authLoading, token, templateId]);

    const handleSave = useCallback(async () => {
        if (!token) {
            alert("No authentication token found. Please log in again.");
            return;
        }
        setSaving(true);
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
            const res = await fetch(`${API}/templates/${templateId}`, {
                method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, subject, design_json: design, template_type: "block", schema_version: "2.0.0" }),
            });
            if (res.status === 401) {
                alert("Session expired (401). Please log in again to save your changes.");
                return;
            }
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(`Error saving template: ${data.detail || "Unknown error"}`);
                return;
            }
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Save error:", err);
            alert("Connection error. Could not save changes.");
        } finally { setSaving(false); }
    }, [templateId, token, name, subject, design]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isEditing = target.isContentEditable || ["INPUT", "TEXTAREA"].includes(target.tagName);

            // Undo/Redo
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
                if (isEditing && !target.closest('.no-native-undo')) return; 
                e.preventDefault();
                if (e.shiftKey) redo(); else undo();
            }

            // Save shortcut (Ctrl/Cmd + S)
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                // If focus is in an input, blur it first to trigger any pending changes
                if (isEditing) {
                    (target as any).blur();
                }
                handleSave();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleSave, redo, undo]);

    const compileForPreview = () => {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        fetch(`${API}/templates/compile/preview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ design_json: design }) })
            .then(r => r.json()).then(d => { if (d.html) { setCompiledHtml(d.html); setShowPreview(true); } });
    };

    useEffect(() => {
        if (authLoading || !token) return;
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        fetch(`${API}/templates/${templateId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (res.status === 401) {
                    alert("Unauthorized (401). Your session may have expired. Please log in again.");
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (!data) return;
                setName(data.name || "Untitled");
                setSubject(data.subject || "");
                if (data.design_json) {
                    const d = data.design_json;
                    // Migration: support old templates that had rows/columns
                    const migrate = (rows: any[] = []) => {
                        const blocks: DesignBlock[] = [];
                        rows.forEach(r => r.columns?.forEach((c: any) => c.blocks?.forEach((b: any) => blocks.push(b))));
                        return blocks;
                    };

                    setDesign({
                        theme: d.theme || DEFAULT_THEME,
                        settings: d.settings || DEFAULT_SETTINGS,
                        headerBlocks: d.headerBlocks || migrate(d.headerRows),
                        bodyBlocks: d.bodyBlocks || migrate(d.bodyRows || d.rows || []),
                        footerBlocks: d.footerBlocks || migrate(d.footerRows),
                    });
                }
                setLoading(false);
            }).catch(() => setLoading(false));
    }, [templateId]);


    const addBlockToZone = (zone: "header" | "body" | "footer", blockType: BlockType = "text", customProps?: any, destIndex?: number) => {
        if (blockType === "image" && !customProps?.src) {
            setPendingImageCol(zone);
            return;
        }
        const newBlockId = `blk-${uid()}`;
        const newBlock = { id: newBlockId, type: blockType, props: { ...BLOCK_DEFAULTS[blockType].defaults, ...customProps } };

        pushDesign(d => {
            const key = zone === "header" ? "headerBlocks" : zone === "footer" ? "footerBlocks" : "bodyBlocks";
            if (typeof destIndex === "number") {
                d[key].splice(destIndex, 0, newBlock);
            } else {
                d[key].push(newBlock);
            }
            return d;
        });

        // Auto-select for immediate typing
        setSelectedNode({ type: "block", id: newBlockId });
    };

    const moveBlock = (blockId: string, sourceZone: string, destZone: string, destIndex?: number) => {
        pushDesign(d => {
            const sKey = sourceZone === "header" ? "headerBlocks" : sourceZone === "footer" ? "footerBlocks" : "bodyBlocks";
            const dKey = destZone === "header" ? "headerBlocks" : destZone === "footer" ? "footerBlocks" : "bodyBlocks";

            const sourceIndex = d[sKey].findIndex(b => b.id === blockId);
            if (sourceIndex === -1) return d;

            const [moved] = d[sKey].splice(sourceIndex, 1);

            // Adjust index if moving within the same zone and moving from before to after
            let finalDestIndex = typeof destIndex === "number" ? destIndex : d[dKey].length;

            // Note: If EditorCanvas already pre-calculated the index based on otherNodes (contracted list),
            // then we don't need to decrement. But if it calculated based on full indices, we do.
            // Let's make it robust by capping it.
            if (finalDestIndex > d[dKey].length) finalDestIndex = d[dKey].length;

            d[dKey].splice(finalDestIndex, 0, moved);
            return d;
        });
    };

    const duplicateBlock = (blockId: string) => {
        pushDesign(d => {
            const zones = [d.headerBlocks, d.bodyBlocks, d.footerBlocks];
            for (const list of zones) {
                const idx = list.findIndex(b => b.id === blockId);
                if (idx !== -1) { list.splice(idx + 1, 0, { ...clone(list[idx]), id: `blk-${uid()}` }); break; }
            }
            return d;
        });
    };

    const deleteBlock = (blockId: string) => {
        pushDesign(d => {
            d.headerBlocks = d.headerBlocks.filter(b => b.id !== blockId);
            d.bodyBlocks = d.bodyBlocks.filter(b => b.id !== blockId);
            d.footerBlocks = d.footerBlocks.filter(b => b.id !== blockId);
            return d;
        });
        if (selectedNode?.id === blockId) setSelectedNode(null);
    };

    const handleCreateNew = async (preset?: TemplatePreset) => {
        if (!token) return;
        const initialDesign = preset ? preset.design : { theme: DEFAULT_THEME, settings: DEFAULT_SETTINGS, headerBlocks: [], bodyBlocks: [], footerBlocks: [] };
        const initialName = preset ? preset.name : "Untitled";
        
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
            const res = await fetch(`${API}/templates/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ 
                    name: initialName, 
                    design_json: initialDesign,
                    template_type: "block",
                    schema_version: "2.0.0"
                }),
            });
            const data = await res.json();
            if (data.id) {
                router.push(`/templates/${data.id}/block`);
            }
        } catch (err) {
            console.error("Failed to create template", err);
        }
    };

    const loadTemplate = (preset: TemplatePreset) => {
        handleCreateNew(preset);
    };

    const updateBlockProp = (blockId: string, key: string, val: any) => {
        pushDesign(d => {
            const allBlocks = [...d.headerBlocks, ...d.bodyBlocks, ...d.footerBlocks];
            const b = allBlocks.find(b => b.id === blockId);
            if (b) b.props[key] = val;
            return d;
        });
    };

    const mirrorExternalImage = async (url: string, blockId: string) => {
        if (!url || !url.startsWith("http") || url.includes("supabase.co") || url.includes("localhost:8000")) return;
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
            console.log("DEBUG: Mirroring external image:", url);
            const res = await fetch(`${API}/assets/mirror`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            if (res.ok) {
                const data = await res.json();
                console.log("DEBUG: Mirroring successful, new URL:", data.url);
                updateBlockProp(blockId, "src", data.url);
            }
        } catch (err) {
            console.error("Mirroring failed:", err);
        }
    };

    const mirrorTextAssets = async (text: string, blockId: string) => {
        if (!text) return;
        const urls = text.match(/https?:\/\/[^\s"'<>;)]+/g) || [];
        if (!urls.length) return;

        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        let newWebText = text;
        let changed = false;

        for (const url of urls) {
            if (url.includes("supabase.co") || url.includes("localhost:8000")) continue;

            try {
                const res = await fetch(`${API}/assets/mirror`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                });
                if (res.ok) {
                    const data = await res.json();
                    newWebText = newWebText.split(url).join(data.url);
                    changed = true;
                }
            } catch (err) {
                console.error("Text asset mirroring failed:", url, err);
            }
        }

        if (changed) updateBlockProp(blockId, "content", newWebText);
    };

    const bulkUpdateBlock = (blockId: string, updates: Record<string, any>, newType?: BlockType) => {
        pushDesign(d => {
            const allBlocks = [...d.headerBlocks, ...d.bodyBlocks, ...d.footerBlocks];
            const b = allBlocks.find(b => b.id === blockId);
            if (b) {
                Object.assign(b.props, updates);
                if (newType) b.type = newType;
            }
            return d;
        });
    };


    const getSelected = () => {
        if (!selectedNode) return {};
        const allBlocks = [...design.headerBlocks, ...design.bodyBlocks, ...design.footerBlocks];
        const block = allBlocks.find(b => b.id === selectedNode.id);
        return block ? { block } : {};
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8FAFC" }}>
            <Loader2 size={32} style={{ color: "#6366F1", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    const sel = getSelected();

    const DraggableItem = ({ type, label, icon, props, children }: { type: BlockType; label?: string; icon?: React.ReactNode; props?: any; children?: React.ReactNode }) => (
        <div draggable onDragStart={e => {
            e.dataTransfer.setData("blockType", type);
            if (props) e.dataTransfer.setData("blockProps", JSON.stringify(props));
        }}
            className="block-card" style={{
                background: "#ffffff", borderRadius: 12, border: "1px solid #F1F5F9",
                cursor: "grab", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)", color: "#475569",
                overflow: "hidden"
            }}>
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

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc", overflow: "hidden" }}>
            {/* ════ TOP BAR ════ */}
            <div style={{
                height: 64, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between",
                padding: "0 24px", background: "#ffffff", borderBottom: "1px solid #E2E8F0", flexShrink: 0, zIndex: 50,
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button onClick={async () => {
                        await handleSave();
                        router.push("/templates");
                    }} style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "8px 12px", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                        <ArrowLeft size={16} /> <span>Back</span>
                    </button>
                    <div style={{ width: 1, height: 24, background: "#E2E8F0" }} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input value={name} onChange={e => setName(e.target.value)} style={{ border: "none", fontSize: 16, fontWeight: 700, color: "#0F172A", outline: "none", background: "transparent", width: "auto", minWidth: 120, padding: 0 }} />
                            <button 
                                onClick={() => handleCreateNew()}
                                title="Create New Blank Template"
                                style={{
                                    width: 24, height: 24, borderRadius: 6, border: "1px solid #E2E8F0",
                                    background: "#F8FAFC", color: "#6366F1", display: "flex",
                                    alignItems: "center", justifyContent: "center", cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#6366F1"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#6366F1"; }}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            {isSaving ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#6366F1", fontSize: 11, fontWeight: 600 }}>
                                    <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                                    <span>Saving to cloud...</span>
                                </div>
                            ) : lastSavedAt ? (
                                <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 500 }}>
                                    Saved at {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            ) : null}
                        </div>
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

            <div style={{ display: "flex", flex: 1, overflow: "hidden", cursor: (isResizingLeft || isResizingRight) ? "col-resize" : "default" }}>
                {/* ════ LEFT SIDEBAR (Icon Bar + Secondary Drawer) ════ */}
                <LeftIconBar activeSidebarTab={activeSidebarTab} setActiveSidebarTab={setActiveSidebarTab} />
                {activeSidebarTab === "home" ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        {/* Background Image Layer */}
                        <div style={{
                            position: "absolute", inset: 0, zIndex: 0,
                            backgroundImage: "url('/images/home-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center"
                        }} />
                        {/* Dark Gradient Overlay for text readability */}
                        <div style={{
                            position: "absolute", inset: 0, zIndex: 0,
                            background: "linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7))"
                        }} />
                        
                         <div style={{ textAlign: "center", maxWidth: 600, animation: "fadeSlideUp 0.4s ease-out", zIndex: 1, position: "relative" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 20, background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#FFFFFF", marginBottom: 24, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" }}>
                                <Shapes size={32} />
                            </div>
                            <h1 style={{ fontSize: 44, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2, marginBottom: 16, textShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                                "Design is intelligence made visible."
                            </h1>
                            <p style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.9)", fontWeight: 500, marginBottom: 40, lineHeight: 1.6, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                                Start fresh on a blank canvas or choose a proven template to get going fast. The email builder gives you full control over your brand.
                            </p>
                            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                                <button onClick={() => setActiveSidebarTab("projects")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 32px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)", transition: "transform 0.2s" }}>
                                    <Plus size={20} /> Start Designing
                                </button>
                                <button onClick={() => setActiveSidebarTab("templates")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 32px", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.3)", background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(12px)", color: "#FFFFFF", fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)" }}>
                                    <Layout size={20} /> Browse Templates
                                </button>
                            </div>
                         </div>
                    </div>
                ) : activeSidebarTab === "templates" ? (
                    <ProjectsDashboard setActiveSidebarTab={setActiveSidebarTab} loadTemplate={loadTemplate} token={token} />
                ) : activeSidebarTab === "brand" ? (
                    <BrandDashboard 
                        brandKits={brandKits}
                        setBrandKits={setBrandKits}
                        activeBrandId={activeBrandId}
                        setActiveBrandId={setActiveBrandId}
                        applyBrandToDesign={applyBrandToDesign}
                        setActiveSidebarTab={setActiveSidebarTab}
                        onUseComponent={useBrandComponent}
                    />
                ) : (
                    <>
                    <SecondaryDrawer
                        activeSidebarTab={activeSidebarTab}
                        setActiveSidebarTab={setActiveSidebarTab}
                        sidebarWidth={sidebarWidth}
                        activeSubMenu={activeSubMenu}
                        setActiveSubMenu={setActiveSubMenu}
                        showElements={showElements}
                        setShowElements={setShowElements}
                        photoSearchInput={photoSearchInput}
                        setPhotoSearchInput={setPhotoSearchInput}
                        photoSearch={photoSearch}
                        setPhotoSearch={setPhotoSearch}
                        iconSearch={iconSearch}
                        setIconSearch={setIconSearch}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        loadTemplate={loadTemplate}
                        design={design}
                        pushDesign={pushDesign}
                        BLOCK_DEFAULTS={BLOCK_DEFAULTS}
                        BLOCK_ICONS={BLOCK_ICONS}
                        TEMPLATE_PRESETS={TEMPLATE_PRESETS}
                        COMMON_ICONS={COMMON_ICONS}
                        token={token}
                        onCreateNew={() => handleCreateNew()}
                    />

                {/* ════ RESIZER DIVIDER ════ */}
                <div
                    onMouseDown={startResizingLeft}
                    style={{
                        width: 8,
                        cursor: "col-resize",
                        position: "relative",
                        zIndex: 100,
                        marginLeft: -4,
                        marginRight: -4,
                        display: "flex",
                        alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            background: isResizingLeft ? "rgba(99, 102, 241, 0.08)" : "transparent"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(99, 102, 241, 0.04)"}
                        onMouseLeave={e => { if (!isResizingLeft) e.currentTarget.style.background = "transparent" }}
                    >
                        <div style={{
                            width: 2,
                            height: isResizingLeft ? "100%" : 40,
                            background: isResizingLeft ? "#6366F1" : "#E2E8F0",
                            borderRadius: 4,
                            transition: "all 0.2s ease",
                            opacity: isResizingLeft ? 1 : 0.6
                        }} />
                    </div>
    
                    {/* ════ CANVAS ════ */}
                    <EditorCanvas
                        design={design}
                        brandTypography={brandKits.find(b => b.id === activeBrandId)?.typography}
                        selectedNode={selectedNode}
                        hoveredBlock={hoveredBlock}
                        viewMode={viewMode}
                        onSelectNode={setSelectedNode}
                        onHoverBlock={setHoveredBlock}
                        onLeaveBlock={() => setHoveredBlock(null)}
                        onUpdateBlockProp={updateBlockProp}
                        onBulkUpdateBlock={bulkUpdateBlock}
                        onAddBlockToZone={addBlockToZone}
                        onMoveBlock={moveBlock}
                        onDuplicateBlock={duplicateBlock}
                        onDeleteBlock={deleteBlock}
                    />
    
                    {/* ════ RESIZER DIVIDER (RIGHT) ════ */}
                    <div
                        onMouseDown={startResizingRight}
                        style={{
                            width: 10,
                            cursor: "col-resize",
                            position: "relative",
                            zIndex: 100,
                            marginLeft: -5,
                            marginRight: -5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            background: isResizingRight ? "rgba(99, 102, 241, 0.08)" : "transparent"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(99, 102, 241, 0.04)"}
                        onMouseLeave={e => { if (!isResizingRight) e.currentTarget.style.background = "transparent" }}
                    >
                        <div style={{
                            width: 2,
                            height: isResizingRight ? "100%" : 40,
                            background: isResizingRight ? "#6366F1" : "#E2E8F0",
                            borderRadius: 4,
                            transition: "all 0.2s ease",
                            opacity: isResizingRight ? 1 : 0.6
                        }} />
                    </div>
    
                    {/* ════ RIGHT INSPECTOR ════ */}
                    <div style={{ width: inspectorWidth, background: "#ffffff", borderLeft: "1px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "-2px 0 8px rgba(0,0,0,0.02)", zIndex: 10 }}>
                        <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", padding: "8px 16px 0" }}>
                            {(["content", "style", "settings"] as const).map(t => (
                                <button key={t} onClick={() => setInspectorTab(t)} style={{
                                    flex: 1, padding: "14px 0", border: "none", background: "none", cursor: "pointer",
                                    fontSize: 13, fontWeight: 600, color: inspectorTab === t ? "#6366F1" : "#94A3B8",
                                    borderBottom: inspectorTab === t ? "2px solid #6366F1" : "2px solid transparent", transition: "all 0.2s ease", textTransform: "capitalize",
                                }}>{t}</button>
                            ))}
                        </div>
    
                        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
                            {!selectedNode && (
                                <div style={{ textAlign: "center", padding: "64px 24px" }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                        <Settings2 size={24} color="#94A3B8" />
                                    </div>
                                    <p style={{ fontSize: 15, color: "#334155", fontWeight: 600 }}>Select a block to style</p>
                                    <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 8, lineHeight: 1.5 }}>Click on any block on the canvas or in the layers tab to adjust properties.</p>
                                </div>
                            )}
    
                            {inspectorTab === "content" && selectedNode?.type === "block" && sel.block && (
                                <InspectorSection title={BLOCK_DEFAULTS[sel.block.type]?.label || "Block Content"}>
                                    {sel.block.type === "text" && (
                                        <>
                                            <FormGroup>
                                                <Label>Content</Label>
                                                <textarea value={sel.block.props.content || ""}
                                                    onChange={e => updateBlockProp(sel.block!.id, "content", e.target.value)}
                                                    onBlur={e => mirrorTextAssets(e.target.value, sel.block!.id)}
                                                    style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Block Link (Double-click to open)</Label>
                                                <input value={sel.block.props.linkUrl || ""} onChange={e => updateBlockProp(sel.block!.id, "linkUrl", e.target.value)} style={inputStyle} placeholder="https://..." />
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "image" && (
                                        <>
                                            <FormGroup>
                                                <Label>Image URL</Label>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <input value={sel.block.props.src || ""}
                                                        onChange={e => updateBlockProp(sel.block!.id, "src", e.target.value)}
                                                        onBlur={e => mirrorExternalImage(e.target.value, sel.block!.id)}
                                                        style={{ ...inputStyle, flex: 1 }} placeholder="https://..." />
                                                    <button onClick={() => setPendingImageCol(sel.block!.id)} style={{
                                                        padding: "0 12px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", color: "#6366F1"
                                                    }} title="Upload Image"><Plus size={18} /></button>
                                                </div>
                                                {sel.block.props.src && <img src={sel.block.props.src} alt="" style={{ width: "100%", borderRadius: 10, marginTop: 12, border: "1px solid #E2E8F0" }} />}
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Alt Text</Label>
                                                <input value={sel.block.props.alt || ""} onChange={e => updateBlockProp(sel.block!.id, "alt", e.target.value)} style={inputStyle} />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Link URL</Label>
                                                <input value={sel.block.props.linkUrl || ""} onChange={e => updateBlockProp(sel.block!.id, "linkUrl", e.target.value)} style={inputStyle} placeholder="https://..." />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>{(sel.block.props.src || "").includes("iconify.design") ? "Icon Size" : "Image Width"}</Label>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    {(() => {
                                                        const src = sel.block?.props.src || "";
                                                        const isIcon = src.includes("iconify.design") || src.includes("api.iconify.design");
                                                        const currentWidth = sel.block?.props.width;
    
                                                        // Determine if we are using pixel or percentage
                                                        // Icons use px by default, photos use % by default
                                                        const isPercent = typeof currentWidth === "string" && currentWidth.endsWith("%");
                                                        const numericValue = parseInt(currentWidth) || (isIcon ? 20 : 100);
    
                                                        return (
                                                            <>
                                                                <input
                                                                    type="range"
                                                                    min={isIcon ? 8 : 10}
                                                                    max={isIcon ? 256 : 100}
                                                                    value={numericValue}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        // If it was a percent, keep it percent. If it was px (or icon), keep it px.
                                                                        const finalVal = isPercent ? `${val}%` : parseInt(val);
                                                                        updateBlockProp(sel.block!.id, "width", finalVal);
                                                                    }}
                                                                    style={{ flex: 1, accentColor: "#6366F1" }}
                                                                />
                                                                <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 50, textAlign: "right" }}>
                                                                    {numericValue}{isPercent ? "%" : "px"}
                                                                </span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "button" && (
                                        <>
                                            <FormGroup>
                                                <Label>Button Style</Label>
                                                <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                                                    {[
                                                        { id: "primary", label: "Primary" },
                                                        { id: "secondary", label: "Secondary" }
                                                    ].map(s => (
                                                        <button 
                                                            key={s.id} 
                                                            onClick={() => {
                                                                const isPrimary = s.id === "primary";
                                                                bulkUpdateBlock(sel.block!.id, { 
                                                                    buttonStyle: s.id,
                                                                    backgroundColor: isPrimary ? design.theme.primaryColor : "#ffffff",
                                                                    color: isPrimary ? "#ffffff" : design.theme.primaryColor,
                                                                    borderWidth: isPrimary ? 0 : 2,
                                                                    borderColor: isPrimary ? "transparent" : design.theme.primaryColor
                                                                });
                                                            }} 
                                                            style={{
                                                                flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                                                                background: (sel.block!.props.buttonStyle || "primary") === s.id ? "#fff" : "transparent", 
                                                                color: (sel.block!.props.buttonStyle || "primary") === s.id ? "#6366F1" : "#64748B",
                                                                boxShadow: (sel.block!.props.buttonStyle || "primary") === s.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                                            }}
                                                        >
                                                            {s.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </FormGroup>
                                            <FormGroup><Label>Button Text</Label><input value={sel.block.props.text || ""} onChange={e => updateBlockProp(sel.block!.id, "text", e.target.value)} style={inputStyle} /></FormGroup>
                                            <FormGroup><Label>Link URL</Label><input value={sel.block.props.url || ""} onChange={e => updateBlockProp(sel.block!.id, "url", e.target.value)} style={inputStyle} placeholder="https://..." /></FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "spacer" && (
                                        <FormGroup><Label>Height</Label>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <input type="range" min={8} max={120} value={sel.block.props.height || 32} onChange={e => updateBlockProp(sel.block!.id, "height", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.block.props.height || 32}px</span>
                                            </div>
                                        </FormGroup>
                                    )}
                                    {sel.block.type === "hero" && (
                                        <>
                                            <FormGroup><Label>Headline</Label><input value={sel.block.props.headline || ""} onChange={e => updateBlockProp(sel.block!.id, "headline", e.target.value)} style={inputStyle} /></FormGroup>
                                            <FormGroup><Label>Subheadline</Label><input value={sel.block.props.subheadline || ""} onChange={e => updateBlockProp(sel.block!.id, "subheadline", e.target.value)} style={inputStyle} /></FormGroup>
                                            <FormGroup><Label>Button Text (Optional)</Label><input value={sel.block.props.btnText || ""} onChange={e => updateBlockProp(sel.block!.id, "btnText", e.target.value)} style={inputStyle} /></FormGroup>
                                            <FormGroup><Label>Button URL</Label><input value={sel.block.props.btnUrl || ""} onChange={e => updateBlockProp(sel.block!.id, "btnUrl", e.target.value)} style={inputStyle} /></FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "divider" && (
                                        <FormGroup><Label>Thickness</Label>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <input type="range" min={1} max={10} value={sel.block.props.thickness || 1} onChange={e => updateBlockProp(sel.block!.id, "thickness", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.block.props.thickness || 1}px</span>
                                            </div>
                                        </FormGroup>
                                    )}
                                    {sel.block.type === "social" && (
                                        <>
                                            <SectionLabel>Profiles</SectionLabel>
                                            {(sel.block.props.icons || []).map((icon: any, i: number) => (
                                                <FormGroup key={i}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                                        <Label style={{ margin: 0, textTransform: "capitalize" }}>{icon.platform}</Label>
                                                        <div style={{ display: "flex", gap: 8 }}>
                                                            <button onClick={() => cleanOpen(icon.url)} style={{
                                                                border: "none", background: "#F1F5F9", color: "#6366F1", padding: "4px 8px",
                                                                borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 700
                                                            }}>Test</button>
                                                            <button onClick={() => {
                                                                const newIcons = [...sel.block!.props.icons];
                                                                newIcons.splice(i, 1);
                                                                updateBlockProp(sel.block!.id, "icons", newIcons);
                                                            }} style={{ border: "none", background: "none", color: "#EF4444", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Remove</button>
                                                        </div>
                                                    </div>
                                                    <input value={icon.url || ""} onChange={e => {
                                                        const newIcons = [...sel.block!.props.icons];
                                                        newIcons[i] = { ...newIcons[i], url: e.target.value };
                                                        updateBlockProp(sel.block!.id, "icons", newIcons);
                                                    }} style={inputStyle} placeholder="https://..." />
                                                </FormGroup>
                                            ))}
                                            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                                {["facebook", "instagram", "twitter", "linkedin", "youtube", "whatsapp"].filter(p => !sel.block!.props.icons?.some((i: any) => i.platform === p)).map(p => (
                                                    <button key={p} onClick={() => {
                                                        const newIcons = [...(sel.block!.props.icons || []), { platform: p, url: "" }];
                                                        updateBlockProp(sel.block!.id, "icons", newIcons);
                                                    }} style={{
                                                        flex: 1, padding: "8px", border: "1px dashed #E2E8F0", borderRadius: 8,
                                                        background: "#F8FAFC", color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer",
                                                        textTransform: "capitalize"
                                                    }}>+ {p}</button>
                                                ))}
                                            </div>
                                            <FormGroup style={{ marginTop: 24 }}>
                                                <Label>Alignment</Label>
                                                <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                                                    {["left", "center", "right"].map(a => (
                                                        <button key={a} onClick={() => updateBlockProp(sel.block!.id, "align", a)} style={{
                                                            flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                                                            background: sel.block!.props.align === a ? "#fff" : "transparent", color: sel.block!.props.align === a ? "#6366F1" : "#64748B",
                                                            boxShadow: sel.block!.props.align === a ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                                        }}>{a}</button>
                                                    ))}
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "footer" && (
                                        <FormGroup><Label>Footer Content</Label>
                                            <textarea value={sel.block.props.content || ""} onChange={e => updateBlockProp(sel.block!.id, "content", e.target.value)}
                                                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                                        </FormGroup>
                                    )}
                                    {sel.block.type === "shape" && (
                                        <>
                                            <FormGroup>
                                                <Label>Shape Type</Label>
                                                <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                                                    {["rect", "circle", "triangle"].map(t => (
                                                        <button key={t} onClick={() => updateBlockProp(sel.block!.id, "shapeType", t)} style={{
                                                            flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                                                            background: sel.block!.props.shapeType === t ? "#fff" : "transparent", color: sel.block!.props.shapeType === t ? "#6366F1" : "#64748B",
                                                            boxShadow: sel.block!.props.shapeType === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                                        }}>{t}</button>
                                                    ))}
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Dimensions</Label>
                                                <div style={{ display: "flex", gap: 12 }}>
                                                    <div style={{ flex: 1 }}><Label>Width</Label><input type="number" value={sel.block.props.width || 100} onChange={e => updateBlockProp(sel.block!.id, "width", +e.target.value)} style={inputStyle} /></div>
                                                    <div style={{ flex: 1 }}><Label>Height</Label><input type="number" value={sel.block.props.height || 100} onChange={e => updateBlockProp(sel.block!.id, "height", +e.target.value)} style={inputStyle} /></div>
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "line" && (
                                        <>
                                            <FormGroup>
                                                <Label>Line Style</Label>
                                                <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                                                    {["solid", "dashed", "dotted"].map(t => (
                                                        <button key={t} onClick={() => updateBlockProp(sel.block!.id, "lineType", t)} style={{
                                                            flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                                                            background: sel.block!.props.lineType === t ? "#fff" : "transparent", color: sel.block!.props.lineType === t ? "#6366F1" : "#64748B",
                                                        }}>{t}</button>
                                                    ))}
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Thickness</Label>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <input type="range" min={1} max={20} value={sel.block.props.thickness || 2} onChange={e => updateBlockProp(sel.block!.id, "thickness", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                    <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.block.props.thickness || 2}px</span>
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "floating-text" && (
                                        <>
                                            <FormGroup>
                                                <Label>Content</Label>
                                                <textarea value={sel.block.props.content || ""}
                                                    onChange={e => updateBlockProp(sel.block!.id, "content", e.target.value)}
                                                    onBlur={e => mirrorTextAssets(e.target.value, sel.block!.id)}
                                                    style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Position (X, Y)</Label>
                                                <div style={{ display: "flex", gap: 12 }}>
                                                    <div style={{ flex: 1 }}><Label>X</Label><input type="number" value={sel.block.props.x || 0} onChange={e => updateBlockProp(sel.block!.id, "x", +e.target.value)} style={inputStyle} /></div>
                                                    <div style={{ flex: 1 }}><Label>Y</Label><input type="number" value={sel.block.props.y || 0} onChange={e => updateBlockProp(sel.block!.id, "y", +e.target.value)} style={inputStyle} /></div>
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Dimensions</Label>
                                                <div style={{ display: "flex", gap: 12 }}>
                                                    <div style={{ flex: 1 }}><Label>Width</Label><input type="number" value={sel.block.props.width || 200} onChange={e => updateBlockProp(sel.block!.id, "width", +e.target.value)} style={inputStyle} /></div>
                                                    <div style={{ flex: 1 }}><Label>Padding</Label><input type="number" value={sel.block.props.padding || 12} onChange={e => updateBlockProp(sel.block!.id, "padding", +e.target.value)} style={inputStyle} /></div>
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "floating-image" && (
                                        <>
                                            <FormGroup>
                                                <Label>Image Source</Label>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <input value={sel.block.props.src || ""}
                                                        onChange={e => updateBlockProp(sel.block!.id, "src", e.target.value)}
                                                        onBlur={e => mirrorExternalImage(e.target.value, sel.block!.id)}
                                                        style={{ ...inputStyle, flex: 1 }} placeholder="https://..." />
                                                    <button onClick={() => setPendingImageCol(sel.block!.id)} style={{
                                                        padding: "0 12px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", color: "#6366F1"
                                                    }} title="Upload Image"><Plus size={18} /></button>
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Alt Text & Link</Label>
                                                <input value={sel.block.props.alt || ""} onChange={e => updateBlockProp(sel.block!.id, "alt", e.target.value)}
                                                    style={{ ...inputStyle, marginBottom: 8 }} placeholder="Alt Text" />
                                                <input value={sel.block.props.linkUrl || ""} onChange={e => updateBlockProp(sel.block!.id, "linkUrl", e.target.value)}
                                                    style={inputStyle} placeholder="Link URL (Optional)" />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Position (X, Y)</Label>
                                                <div style={{ display: "flex", gap: 12 }}>
                                                    <div style={{ flex: 1 }}><Label>X</Label><input type="number" value={sel.block.props.x || 0} onChange={e => updateBlockProp(sel.block!.id, "x", +e.target.value)} style={inputStyle} /></div>
                                                    <div style={{ flex: 1 }}><Label>Y</Label><input type="number" value={sel.block.props.y || 0} onChange={e => updateBlockProp(sel.block!.id, "y", +e.target.value)} style={inputStyle} /></div>
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Dimensions</Label>
                                                <div style={{ display: "flex", gap: 12 }}>
                                                    <div style={{ flex: 1 }}><Label>Width</Label><input type="number" value={sel.block.props.width || 200} onChange={e => updateBlockProp(sel.block!.id, "width", +e.target.value)} style={inputStyle} /></div>
                                                    <div style={{ flex: 1 }}><Label>Padding</Label><input type="number" value={sel.block.props.padding || 0} onChange={e => updateBlockProp(sel.block!.id, "padding", +e.target.value)} style={inputStyle} /></div>
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "layout" && (
                                        <>
                                            <FormGroup>
                                                <Label>Column Layout</Label>
                                                <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                                                    {[
                                                        { id: "1-col", label: "1 Col", cols: 1 },
                                                        { id: "2-col", label: "2 Col", cols: 2 },
                                                        { id: "3-col", label: "3 Col", cols: 3 },
                                                    ].map(l => (
                                                        <button key={l.id} onClick={() => {
                                                            const newCols = Array.from({ length: l.cols }, (_, i) => sel.block!.props.columns[i] || { blocks: [] });
                                                            updateBlockProp(sel.block!.id, "layoutType", l.id);
                                                            updateBlockProp(sel.block!.id, "columns", newCols);
                                                        }} style={{
                                                            flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                                                            background: sel.block!.props.layoutType === l.id ? "#fff" : "transparent", color: sel.block!.props.layoutType === l.id ? "#6366F1" : "#64748B",
                                                            boxShadow: sel.block!.props.layoutType === l.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                                        }}>{l.label}</button>
                                                    ))}
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Spacing & Padding</Label>
                                                <div style={{ display: "flex", gap: 12 }}>
                                                    <div style={{ flex: 1 }}><Label>Gap</Label><input type="number" value={sel.block.props.gap || 20} onChange={e => updateBlockProp(sel.block!.id, "gap", +e.target.value)} style={inputStyle} /></div>
                                                    <div style={{ flex: 1 }}><Label>Padding</Label><input type="number" value={sel.block.props.padding || 20} onChange={e => updateBlockProp(sel.block!.id, "padding", +e.target.value)} style={inputStyle} /></div>
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #F1F5F9" }}>
                                        <FormGroup>
                                            <Label>Visibility</Label>
                                            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                                                <input type="checkbox" checked={!!sel.block!.props.hideOnMobile} onChange={e => updateBlockProp(sel.block!.id, "hideOnMobile", e.target.checked)} style={{ width: 18, height: 18, accentColor: "#6366F1" }} />
                                                <span style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Hide on Mobile Devices</span>
                                            </label>
                                        </FormGroup>
                                    </div>
                                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #F1F5F9" }}>
                                        <button onClick={() => deleteBlock(sel.block!.id)} style={{
                                            width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #FEE2E2",
                                            background: "#FEF2F2", color: "#EF4444", fontSize: 13, fontWeight: 700,
                                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                            transition: "all 0.2s"
                                        }}>
                                            <Trash2 size={16} /> Delete Block
                                        </button>
                                    </div>
                                </InspectorSection>
                            )}
    
                            {inspectorTab === "style" && selectedNode?.type === "block" && sel.block && (
                                <InspectorSection title="Design Values">
                                    {["text", "button", "hero"].includes(sel.block.type) && (
                                        <>
                                            <FormGroup>
                                                <Label>Font Size</Label>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <input type="range" min={10} max={72} value={sel.block.props.fontSize || 16} onChange={e => updateBlockProp(sel.block!.id, "fontSize", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                    <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.block.props.fontSize || 16}px</span>
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Text Color</Label>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                                        <input type="color" value={sel.block.props.color || "#000000"} onChange={e => updateBlockProp(sel.block!.id, "color", e.target.value)} style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer" }} />
                                                    </div>
                                                    <input value={sel.block.props.color || "#000000"} onChange={e => updateBlockProp(sel.block!.id, "color", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Alignment</Label>
                                                <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                                                    {["left", "center", "right"].map(a => (
                                                        <button key={a} onClick={() => updateBlockProp(sel.block!.id, "align", a)} style={{
                                                            flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                                                            background: sel.block!.props.align === a ? "#fff" : "transparent", color: sel.block!.props.align === a ? "#6366F1" : "#64748B",
                                                            boxShadow: sel.block!.props.align === a ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s ease",
                                                        }}>{a}</button>
                                                    ))}
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "button" && (
                                        <>
                                            <FormGroup>
                                                <Label>Button Color</Label>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                                        <input type="color" value={sel.block.props.backgroundColor || "#6366F1"} onChange={e => updateBlockProp(sel.block!.id, "backgroundColor", e.target.value)} style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer" }} />
                                                    </div>
                                                    <input value={sel.block.props.backgroundColor || "#6366F1"} onChange={e => updateBlockProp(sel.block!.id, "backgroundColor", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Border Radius</Label>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <input type="range" min={0} max={40} value={sel.block.props.borderRadius || 8} onChange={e => updateBlockProp(sel.block!.id, "borderRadius", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                    <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.block.props.borderRadius || 8}px</span>
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    {(sel.block.type === "shape" || sel.block.type === "line") && (
                                        <>
                                            <FormGroup>
                                                <Label>{sel.block.type === "shape" ? "Shape Color" : "Line Color"}</Label>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                                        <input type="color" value={sel.block.props.backgroundColor || sel.block.props.color || "#6366F1"}
                                                            onChange={e => updateBlockProp(sel.block!.id, sel.block!.type === "shape" ? "backgroundColor" : "color", e.target.value)}
                                                            style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer" }} />
                                                    </div>
                                                    <input value={sel.block.props.backgroundColor || sel.block.props.color || "#6366F1"}
                                                        onChange={e => updateBlockProp(sel.block!.id, sel.block!.type === "shape" ? "backgroundColor" : "color", e.target.value)}
                                                        style={{ ...inputStyle, marginBottom: 0 }} />
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Alignment</Label>
                                                <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                                                    {["left", "center", "right"].map(a => (
                                                        <button key={a} onClick={() => updateBlockProp(sel.block!.id, "align", a)} style={{
                                                            flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                                                            background: sel.block!.props.align === a ? "#fff" : "transparent", color: sel.block!.props.align === a ? "#6366F1" : "#64748B",
                                                            boxShadow: sel.block!.props.align === a ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                                        }}>{a}</button>
                                                    ))}
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "floating-text" && (
                                        <>
                                            <FormGroup>
                                                <Label>Font Size</Label>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <input type="range" min={10} max={72} value={sel.block.props.fontSize || 16} onChange={e => updateBlockProp(sel.block!.id, "fontSize", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                    <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.block.props.fontSize || 16}px</span>
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Text Color</Label>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                                        <input type="color" value={sel.block.props.color || "#374151"} onChange={e => updateBlockProp(sel.block!.id, "color", e.target.value)} style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer" }} />
                                                    </div>
                                                    <input value={sel.block.props.color || "#374151"} onChange={e => updateBlockProp(sel.block!.id, "color", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Background Color</Label>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                                        <input type="color" value={sel.block.props.backgroundColor || "#ffffff"} onChange={e => updateBlockProp(sel.block!.id, "backgroundColor", e.target.value)} style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer" }} />
                                                    </div>
                                                    <input value={sel.block.props.backgroundColor || "#ffffff"} onChange={e => updateBlockProp(sel.block!.id, "backgroundColor", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Border</Label>
                                                <div style={{ display: "flex", gap: 12 }}>
                                                    <div style={{ flex: 1 }}><Label>Width</Label><input type="number" value={sel.block.props.borderWidth || 0} onChange={e => updateBlockProp(sel.block!.id, "borderWidth", +e.target.value)} style={inputStyle} /></div>
                                                    <div style={{ flex: 2 }}><Label>Color</Label>
                                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                            <input type="color" value={sel.block.props.borderColor || "#E2E8F0"} onChange={e => updateBlockProp(sel.block!.id, "borderColor", e.target.value)} style={{ width: 24, height: 24, padding: 0, border: "none", background: "none" }} />
                                                            <input value={sel.block.props.borderColor || "#E2E8F0"} onChange={e => updateBlockProp(sel.block!.id, "borderColor", e.target.value)} style={{ ...inputStyle, padding: "8px" }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "floating-image" && (
                                        <>
                                            <FormGroup>
                                                <Label>Border Radius</Label>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <input type="range" min={0} max={100} value={sel.block.props.borderRadius || 0} onChange={e => updateBlockProp(sel.block!.id, "borderRadius", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                    <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.block.props.borderRadius || 0}px</span>
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Border Styling</Label>
                                                <div style={{ display: "flex", gap: 12 }}>
                                                    <div style={{ flex: 1 }}><Label>Width</Label><input type="number" value={sel.block.props.borderWidth || 0} onChange={e => updateBlockProp(sel.block!.id, "borderWidth", +e.target.value)} style={inputStyle} /></div>
                                                    <div style={{ flex: 2 }}><Label>Color</Label>
                                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                            <input type="color" value={sel.block.props.borderColor || "transparent"} onChange={e => updateBlockProp(sel.block!.id, "borderColor", e.target.value)} style={{ width: 24, height: 24, padding: 0, border: "none", background: "none" }} />
                                                            <input value={sel.block.props.borderColor || "transparent"} onChange={e => updateBlockProp(sel.block!.id, "borderColor", e.target.value)} style={{ ...inputStyle, padding: "8px" }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "divider" && (
                                        <FormGroup>
                                            <Label>Divider Color</Label>
                                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                                    <input type="color" value={sel.block.props.color || "#E5E7EB"} onChange={e => updateBlockProp(sel.block!.id, "color", e.target.value)} style={{ position: "absolute", top: -8, left: -8, width: 56, height: 56, cursor: "pointer" }} />
                                                </div>
                                                <input value={sel.block.props.color || "#E5E7EB"} onChange={e => updateBlockProp(sel.block!.id, "color", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                                            </div>
                                        </FormGroup>
                                    )}
                                    {sel.block.type === "footer" && (
                                        <FormGroup>
                                            <Label>Alignment</Label>
                                            <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                                                {["left", "center", "right"].map(a => (
                                                    <button key={a} onClick={() => updateBlockProp(sel.block!.id, "align", a)} style={{
                                                        flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                                                        background: sel.block!.props.align === a ? "#fff" : "transparent", color: sel.block!.props.align === a ? "#6366F1" : "#64748B",
                                                        boxShadow: sel.block!.props.align === a ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                                    }}>{a}</button>
                                                ))}
                                            </div>
                                        </FormGroup>
                                    )}
                                    {sel.block.type === "shape" && (
                                        <FormGroup>
                                            <Label>Border Width</Label>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <input type="range" min={0} max={20} value={sel.block.props.borderWidth || 0} onChange={e => updateBlockProp(sel.block!.id, "borderWidth", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", width: 40, textAlign: "right" }}>{sel.block.props.borderWidth || 0}px</span>
                                            </div>
                                        </FormGroup>
                                    )}
                                    {sel.block.type === "rating" && (
                                        <>
                                            <FormGroup>
                                                <Label>Star Count</Label>
                                                <input type="number" min={1} max={10} value={sel.block.props.count || 5} onChange={e => updateBlockProp(sel.block!.id, "count", +e.target.value)} style={inputStyle} />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Star Color</Label>
                                                <input type="color" value={sel.block.props.color || "#FFD700"} onChange={e => updateBlockProp(sel.block!.id, "color", e.target.value)} style={{ ...inputStyle, height: 44, padding: 4 }} />
                                            </FormGroup>
                                        </>
                                    )}
                                    {sel.block.type === "countdown" && (
                                        <FormGroup>
                                            <Label>End Date/Time</Label>
                                            <input type="datetime-local" value={sel.block.props.endTime || ""} onChange={e => updateBlockProp(sel.block!.id, "endTime", e.target.value)} style={inputStyle} />
                                        </FormGroup>
                                    )}
                                    {sel.block.type === "html" && (
                                        <FormGroup>
                                            <Label>Custom MJML/HTML Code</Label>
                                            <textarea value={sel.block.props.content || ""} onChange={e => updateBlockProp(sel.block!.id, "content", e.target.value)}
                                                style={{ ...inputStyle, minHeight: 180, fontFamily: "monospace", fontSize: 12, resize: "vertical" }} />
                                        </FormGroup>
                                    )}
    
                                </InspectorSection>
                            )}
    
                            {inspectorTab === "style" && selectedNode?.type === "block" && sel.block && (
                                <InspectorSection title="Visual Styles">
                                    {["text", "button", "hero", "footer", "floating-text", "layout"].includes(sel.block.type) && (
                                        <div style={{ marginBottom: 24 }}>
                                            <SectionLabel>Typography & Spacing</SectionLabel>
                                            <FormGroup>
                                                <Label>Line Height</Label>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <input type="range" min={1} max={3} step={0.1} value={sel.block.props.lineHeight || 1.6} onChange={e => updateBlockProp(sel.block!.id, "lineHeight", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", width: 30, textAlign: "right" }}>{sel.block.props.lineHeight || 1.6}</span>
                                                </div>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Letter Spacing</Label>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <input type="range" min={-2} max={10} step={0.5} value={sel.block.props.letterSpacing || 0} onChange={e => updateBlockProp(sel.block!.id, "letterSpacing", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", width: 30, textAlign: "right" }}>{sel.block.props.letterSpacing || 0}</span>
                                                </div>
                                            </FormGroup>
                                        </div>
                                    )}
    
                                    {["image", "button", "shape", "floating-text", "floating-image"].includes(sel.block.type) && (
                                        <div>
                                            <SectionLabel>Visual Effects</SectionLabel>
                                            <FormGroup>
                                                <Label>Shadow Intensity</Label>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <input type="range" min={0} max={40} value={sel.block.props.shadow || 0} onChange={e => updateBlockProp(sel.block!.id, "shadow", +e.target.value)} style={{ flex: 1, accentColor: "#6366F1" }} />
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", width: 30, textAlign: "right" }}>{sel.block.props.shadow || 0}</span>
                                                </div>
                                            </FormGroup>
                                            {sel.block.props.shadow > 0 && (
                                                <FormGroup>
                                                    <Label>Shadow Color</Label>
                                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                        <div style={{ position: "relative", width: 32, height: 32, borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                                            <input type="color" value={sel.block.props.shadowColor || "rgba(0,0,0,0.1)"} onChange={e => updateBlockProp(sel.block!.id, "shadowColor", e.target.value)} style={{ position: "absolute", top: -8, left: -8, width: 48, height: 48, cursor: "pointer" }} />
                                                        </div>
                                                        <input value={sel.block.props.shadowColor || "rgba(0,0,0,0.1)"} onChange={e => updateBlockProp(sel.block!.id, "shadowColor", e.target.value)} style={{ ...inputStyle, padding: "8px", fontSize: 12, marginBottom: 0 }} />
                                                    </div>
                                                </FormGroup>
                                            )}
                                        </div>
                                    )}
                                </InspectorSection>
                            )}
    
                            {inspectorTab === "settings" && (
                                <div style={{ margin: "-24px" }}>
                                    <CollapsibleSection title="General" icon={<Info size={18} />} isOpen={openSections.general} onToggle={() => setOpenSections(s => ({ ...s, general: !s.general }))}>
                                        <FormGroup>
                                            <Label>Template Name</Label>
                                            <input value={design.settings.general.name} onChange={e => updateSetting("general", "name", e.target.value)} style={inputStyle} />
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Description</Label>
                                            <textarea value={design.settings.general.description} onChange={e => updateSetting("general", "description", e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Category</Label>
                                            <select value={design.settings.general.category} onChange={e => updateSetting("general", "category", e.target.value)} style={inputStyle}>
                                                <option>Email</option><option>Landing Page</option><option>Notification</option>
                                            </select>
                                        </FormGroup>
                                    </CollapsibleSection>
    
                                    <CollapsibleSection title="Responsive Settings" icon={<Monitor size={18} />} isOpen={openSections.responsive} onToggle={() => setOpenSections(s => ({ ...s, responsive: !s.responsive }))}>
                                        <SectionLabel style={{ marginBottom: 12 }}>Device Visibility</SectionLabel>
                                        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                                            {(["desktop", "tablet", "mobile"] as const).map(d => (
                                                <button key={d} onClick={() => updateSetting("responsive", d, !design.settings.responsive[d])} style={{
                                                    flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #E2E8F0",
                                                    background: design.settings.responsive[d] ? "#6366F1" : "#F8FAFC",
                                                    color: design.settings.responsive[d] ? "#fff" : "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer"
                                                }}>{d.toUpperCase()}</button>
                                            ))}
                                        </div>
                                        <FormGroup>
                                            <Label>Breakpoints</Label>
                                            <div style={{ display: "flex", gap: 10 }}>
                                                <div style={{ flex: 1 }}><Label style={{ fontSize: 11, color: "#94A3B8" }}>Tablet</Label><input value={design.settings.responsive.breakpoints.tablet} onChange={e => updateSetting("responsive", "breakpoints", { ...design.settings.responsive.breakpoints, tablet: +e.target.value })} style={{ ...inputStyle, textAlign: "center" }} /></div>
                                                <div style={{ flex: 1 }}><Label style={{ fontSize: 11, color: "#94A3B8" }}>Mobile</Label><input value={design.settings.responsive.breakpoints.mobile} onChange={e => updateSetting("responsive", "breakpoints", { ...design.settings.responsive.breakpoints, mobile: +e.target.value })} style={{ ...inputStyle, textAlign: "center" }} /></div>
                                            </div>
                                        </FormGroup>
                                        <FormGroup>
                                            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                                                <input type="checkbox" checked={design.settings.responsive.stackOnMobile} onChange={e => updateSetting("responsive", "stackOnMobile", e.target.checked)} />
                                                <span style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Stack columns on Mobile</span>
                                            </label>
                                        </FormGroup>
                                    </CollapsibleSection>
    
                                    {sel.block && (
                                        <CollapsibleSection title="Actions & Links" icon={<Link size={18} />} isOpen={openSections.actions} onToggle={() => setOpenSections(s => ({ ...s, actions: !s.actions }))}>
                                            <FormGroup>
                                                <Label>Link URL</Label>
                                                <input value={sel.block.props.linkUrl || ""} onChange={e => updateBlockProp(sel.block!.id, "linkUrl", e.target.value)} style={inputStyle} placeholder="https://..." />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Open In</Label>
                                                <select value={sel.block.props.linkTarget || "_blank"} onChange={e => updateBlockProp(sel.block!.id, "linkTarget", e.target.value)} style={inputStyle}>
                                                    <option value="_blank">New Tab</option><option value="_self">Same Tab</option>
                                                </select>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Click Action</Label>
                                                <select value={sel.block.props.actionType || "none"} onChange={e => updateBlockProp(sel.block!.id, "actionType", e.target.value)} style={inputStyle}>
                                                    <option value="none">None</option><option value="link">Open Link</option><option value="scroll">Scroll to Section</option><option value="modal">Open Modal</option>
                                                </select>
                                            </FormGroup>
                                        </CollapsibleSection>
                                    )}
    
                                    <CollapsibleSection title="Dynamic Data" icon={<Activity size={18} />} isOpen={openSections.variables} onToggle={() => setOpenSections(s => ({ ...s, variables: !s.variables }))}>
                                        <SectionLabel style={{ marginBottom: 12 }}>Merge Tags</SectionLabel>
                                        {(design.settings.variables || []).map((v, i) => (
                                            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                                                <div style={{ flex: 1 }}>
                                                    <input value={v.name} onChange={e => { const vn = [...design.settings.variables]; vn[i].name = e.target.value; updateSetting("variables", "" as any, vn); }} placeholder="var_name" style={{ ...inputStyle, padding: "8px", fontSize: 12, marginBottom: 4 }} />
                                                    <input value={v.defaultValue} onChange={e => { const vn = [...design.settings.variables]; vn[i].defaultValue = e.target.value; updateSetting("variables", "" as any, vn); }} placeholder="Default val" style={{ ...inputStyle, padding: "8px", fontSize: 11, background: "#fff" }} />
                                                </div>
                                                <button onClick={() => { const vn = design.settings.variables.filter((_, idx) => idx !== i); updateSetting("variables", "" as any, vn); }} style={{ ...iconBtn, color: "#EF4444" }}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => updateSetting("variables", "" as any, [...design.settings.variables, { name: "variable_name", defaultValue: "" }])} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "2px dashed #E2E8F0", color: "#6366F1", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "#fff" }}>+ Add Variable</button>
                                    </CollapsibleSection>
    
                                    <CollapsibleSection title="Email Settings" icon={<Mail size={18} />} isOpen={openSections.email} onToggle={() => setOpenSections(s => ({ ...s, email: !s.email }))}>
                                        <FormGroup><Label>Subject Line</Label><input value={design.settings.email.subject} onChange={e => updateSetting("email", "subject", e.target.value)} style={inputStyle} /></FormGroup>
                                        <FormGroup><Label>Preheader Text</Label><textarea value={design.settings.email.preheader} onChange={e => updateSetting("email", "preheader", e.target.value)} style={{ ...inputStyle, minHeight: 60 }} /></FormGroup>
                                        <FormGroup><Label>Sender Name</Label><input value={design.settings.email.senderName} onChange={e => updateSetting("email", "senderName", e.target.value)} style={inputStyle} /></FormGroup>
                                        <FormGroup><Label>Sender Email</Label><input value={design.settings.email.senderEmail} onChange={e => updateSetting("email", "senderEmail", e.target.value)} style={inputStyle} /></FormGroup>
                                    </CollapsibleSection>
    
                                    {sel.block && (
                                        <CollapsibleSection title="Permissions" icon={<Shield size={18} />} isOpen={openSections.permissions} onToggle={() => setOpenSections(s => ({ ...s, permissions: !s.permissions }))}>
                                            <FormGroup>
                                                <label style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Lock Element</span>
                                                    <input type="checkbox" checked={sel.block.props.locked || false} onChange={e => updateBlockProp(sel.block!.id, "locked", e.target.checked)} />
                                                </label>
                                                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Locked elements cannot be moved or deleted.</div>
                                            </FormGroup>
                                        </CollapsibleSection>
                                    )}
    
                                    <CollapsibleSection title="Global Settings" icon={<Globe size={18} />} isOpen={openSections.global} onToggle={() => setOpenSections(s => ({ ...s, global: !s.global }))}>
                                        <FormGroup>
                                            <Label>Primary Brand Color</Label>
                                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                <div style={{ position: "relative", width: 44, height: 44, borderRadius: 10, overflow: "hidden", border: "1px solid #E2E8F0" }}>
                                                    <input type="color" value={design.settings.global.primaryColor} onChange={e => updateSetting("global", "primaryColor", e.target.value)} style={{ position: "absolute", top: -8, left: -8, width: 64, height: 64, cursor: "pointer" }} />
                                                </div>
                                                <input value={design.settings.global.primaryColor} onChange={e => updateSetting("global", "primaryColor", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                            </div>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Font Family</Label>
                                            <select value={design.settings.global.fontFamily} onChange={e => updateSetting("global", "fontFamily", e.target.value)} style={inputStyle}>
                                                <option value="'Inter', sans-serif">Inter (Modern)</option>
                                                <option value="'Roboto', sans-serif">Roboto (Clean)</option>
                                                <option value="'Playfair Display', serif">Playfair (Elegant)</option>
                                                <option value="monospace">Monospace (Code)</option>
                                            </select>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Dark Mode Logic</Label>
                                            <button onClick={() => updateSetting("global", "darkMode", !design.settings.global.darkMode)} style={{
                                                width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0",
                                                background: design.settings.global.darkMode ? "#0F172A" : "#fff",
                                                color: design.settings.global.darkMode ? "#fff" : "#0F172A", fontSize: 13, fontWeight: 700, cursor: "pointer"
                                            }}>
                                                {design.settings.global.darkMode ? "Disable" : "Enable"} Preview Reverse Dark Mode
                                            </button>
                                        </FormGroup>
                                    </CollapsibleSection>
    
                                    <CollapsibleSection title="Analytics" icon={<Activity size={18} />} isOpen={openSections.analytics} onToggle={() => setOpenSections(s => ({ ...s, analytics: !s.analytics }))}>
                                        <FormGroup>
                                            <Label>Tracking Code (Pixel/Script)</Label>
                                            <textarea value={design.settings.analytics.trackingCode} onChange={e => updateSetting("analytics", "trackingCode", e.target.value)} style={{ ...inputStyle, minHeight: 120, fontFamily: "monospace", fontSize: 12 }} placeholder="<script>...</script>" />
                                        </FormGroup>
                                    </CollapsibleSection>
    
                                    <CollapsibleSection title="Advanced" icon={<HelpCircle size={18} />} isOpen={openSections.advanced} onToggle={() => setOpenSections(s => ({ ...s, advanced: !s.advanced }))}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                            <button onClick={handleSave} style={{ width: "100%", padding: "12px", borderRadius: 10, background: "#6366F1", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Save Template State</button>
                                            <SectionLabel style={{ margin: "12px 0 8px" }}>Developer Options</SectionLabel>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button onClick={() => { const blob = new Blob([JSON.stringify(design, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `template-${templateId}.json`; a.click(); }} style={{ flex: 1, padding: "10px", background: "#F1F5F9", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Export JSON</button>
                                                <button onClick={compileForPreview} style={{ flex: 1, padding: "10px", background: "#F1F5F9", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Export HTML</button>
                                            </div>
                                        </div>
                                    </CollapsibleSection>
                                </div>
                            )}
                        </div>
                    </div>
                    </>
                )}
            </div>

            {/* ════ PREVIEW MODAL ════ */}
            {showPreview && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowPreview(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ width: 680, maxHeight: "90vh", background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>Live Email Render</span>
                            <button onClick={() => setShowPreview(false)} style={{ border: "1px solid #E2E8F0", background: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>Close Preview</button>
                        </div>
                        <iframe srcDoc={compiledHtml} style={{ width: "100%", height: "70vh", border: "none" }} title="Preview" />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg) } }
                * { box-sizing: border-box; }
                .block-card:hover { background-color: #F8FAFC !important; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05) !important; border-color: #E2E8F0 !important; }
                .row-card:hover { background-color: #F8FAFC !important; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important; border-color: #E2E8F0 !important; }
                .search-input:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important; background: #fff !important; }
            `}</style>
            <ImageUploadModal
                isOpen={!!pendingImageCol}
                onClose={() => setPendingImageCol(null)}
                token={token}
                onUpload={(url) => {
                    if (pendingImageCol) {
                        if (typeof pendingImageCol === "string" && pendingImageCol.startsWith("blk-")) {
                            updateBlockProp(pendingImageCol, "src", url);
                        } else {
                            addBlockToZone(pendingImageCol as any, "image", { src: url });
                        }
                        setPendingImageCol(null);
                    }
                }}
            />
        </div>
    );
}

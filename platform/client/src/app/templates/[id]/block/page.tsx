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
    Mail, Link, Info, Shield, Activity, Tag, Lock, Unlock, Globe, HelpCircle, ToggleLeft, ChevronRight, User, MousePointer2, List, ListOrdered, Wand2, Paintbrush, Eraser, LineChart, MoreHorizontal, ShieldCheck
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
import { InspectorPanel } from "./InspectorPanel";
import { ValidationPanel } from "./components/ValidationPanel";
import { useEditorStore } from "@/store/useEditorStore";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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

    const {
        design, setDesign, pushDesign, undo, redo,
        addBlock, updateBlock, updateBlockProp, bulkUpdateBlock, moveBlock, duplicateBlock, deleteBlock,
        updateTheme, updateSetting,
        history, future,
        selectedNode, selectNode,
        hoveredBlockId, setHoveredBlockId,
        viewMode, setViewMode
    } = useEditorStore();

    const canUndo = history.length > 0;
    const canRedo = future.length > 0;
    // Use tab query param if present
    const [activeSidebarTab, setActiveSidebarTab] = useState<string>("design");
    
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
    const [showValidation, setShowValidation] = useState(false);
    const { validationErrors } = useEditorStore();
    const errorCount = Object.keys(validationErrors).length;

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
        if (loading || authLoading) return;
        
        const timeout = setTimeout(() => {
            const errors: Record<string, string[]> = {};
            const allBlocks = [...design.headerBlocks, ...design.bodyBlocks, ...design.footerBlocks];
            
            allBlocks.forEach(block => {
                const blockErrors: string[] = [];
                const p = block.props;
                
                if (block.type === "image" && !p.alt) {
                    blockErrors.push("Missing alt text for image");
                }
                if ((block.type === "button" || block.type === "text") && p.linkUrl === "") {
                    // blockErrors.push("Invalid or missing link URL");
                }
                if (block.type === "button" && !p.text) {
                    blockErrors.push("Button has no text");
                }
                
                if (blockErrors.length > 0) {
                    errors[block.id] = blockErrors;
                }
            });
            
            useEditorStore.getState().setValidationErrors(errors);
        }, 500);
        
        return () => clearTimeout(timeout);
    }, [design, loading, authLoading]);

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

    const [isCompiling, setIsCompiling] = useState(false);
    const [compileError, setCompileError] = useState("");
    const [previewViewMode, setPreviewViewMode] = useState<"desktop" | "mobile">("desktop");
    const [showSendTest, setShowSendTest] = useState(false);
    const [sendTestEmail, setSendTestEmail] = useState("");
    const [sendTestPersona, setSendTestPersona] = useState("{\"first_name\": \"Test User\"}");
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [sendTestResult, setSendTestResult] = useState<"sent" | "error" | null>(null);

    const compileForPreview = async () => {
        if (!token) return;
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        setIsCompiling(true);
        setCompileError("");
        setShowPreview(true); // open modal immediately — shows loading state
        try {
            const r = await fetch(`${API}/templates/compile/preview`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ design_json: design })
            });
            if (!r.ok) { setCompileError(`Compile failed (${r.status})`); return; }
            const d = await r.json();
            if (d.html) { setCompiledHtml(d.html); }
        } catch (e) {
            setCompileError("Connection error — is the template service running?");
        } finally {
            setIsCompiling(false);
        }
    };

    const handleSendTest = async () => {
        if (!token || !sendTestEmail) return;
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        setIsSendingTest(true);
        setSendTestResult(null);
        try {
            let persona: Record<string, any> = {};
            try { persona = JSON.parse(sendTestPersona); } catch { /* use empty */ }
            const r = await fetch(`${API}/templates/send-test`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ design_json: design, to_email: sendTestEmail, persona, subject: name })
            });
            setSendTestResult(r.ok ? "sent" : "error");
        } catch {
            setSendTestResult("error");
        } finally {
            setIsSendingTest(false);
        }
    };


    useEffect(() => {
        const resizeLeft = (e: MouseEvent) => {
            if (isResizingLeft) {
                let newWidth = e.clientX;
                if (newWidth < 200) newWidth = 200;
                if (newWidth > 600) newWidth = 600;
                setSidebarWidth(newWidth);
            }
        };
        const resizeRight = (e: MouseEvent) => {
            if (isResizingRight) {
                let newWidth = window.innerWidth - e.clientX;
                if (newWidth < 280) newWidth = 280;
                if (newWidth > 600) newWidth = 600;
                setInspectorWidth(newWidth);
            }
        };

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
    }, [isResizingLeft, isResizingRight]);

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

    useEffect(() => {
        if (authLoading || !token) return;
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        fetch(`${API}/templates/${templateId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return;
                setName(data.name || "Untitled");
                setSubject(data.subject || "");
                if (data.design_json) {
                    const d = data.design_json;
                    const migrate = (rows: any[] = []) => {
                        const blocks: DesignBlock[] = [];
                        rows.forEach(r => r.columns?.forEach((c: any) => c.blocks?.forEach((b: any) => blocks.push(b))));
                        return blocks;
                    };
                    setDesign({
                        theme: d.theme || DEFAULT_THEME,
                        settings: d.settings || DEFAULT_SETTINGS,
                        rows: d.rows || [],
                        headerBlocks: d.headerBlocks || migrate(d.headerRows),
                        bodyBlocks: d.bodyBlocks || migrate(d.bodyRows || d.rows || []),
                        footerBlocks: d.footerBlocks || migrate(d.footerRows),
                    });
                }
                setLoading(false);
            }).catch(() => setLoading(false));
    }, [templateId, token, authLoading, setDesign]);

    const handleCreateNew = async (preset?: TemplatePreset) => {
        if (!token) return;
        const initialDesign = preset ? preset.design : { 
            theme: DEFAULT_THEME, 
            settings: DEFAULT_SETTINGS, 
            rows: [],
            headerBlocks: [], 
            bodyBlocks: [], 
            footerBlocks: [] 
        };
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
                updateBlock(blockId, { src: data.url });
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

        if (changed) updateBlock(blockId, { content: newWebText });
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
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#F4F4F5", overflow: "hidden" }}>
            {/* ════ TOP BAR (Canva Style) ════ */}
            <div style={{
                height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 16px", background: "linear-gradient(90deg, #00C4CC 0%, #7D2AE8 100%)", flexShrink: 0, zIndex: 50,
                color: "#ffffff"
            }}>
                {/* Left Section */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button onClick={async () => {
                        await handleSave();
                        router.push("/templates");
                    }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, border: "none", background: "rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", borderRadius: 8, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}>
                        <ArrowLeft size={18} />
                    </button>
                    
                    <button style={{ background: "none", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 10px", borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        File
                    </button>

                    <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: 2 }}>
                        {(["desktop", "mobile"] as const).map(m => (
                            <button key={m} onClick={() => setViewMode(m)} style={{
                                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600,
                                background: viewMode === m ? "#fff" : "transparent", color: viewMode === m ? "#7D2AE8" : "#fff",
                                transition: "all 0.15s ease",
                            }}>{m === "desktop" ? <Monitor size={14} /> : <Smartphone size={14} />} <span style={{ display: "none" }}>{m}</span></button>
                        ))}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                        <button onClick={undo} disabled={!canUndo} style={{ ...iconBtn, color: canUndo ? "#fff" : "rgba(255,255,255,0.4)" }}><Undo2 size={16} /></button>
                        <button onClick={redo} disabled={!canRedo} style={{ ...iconBtn, color: canRedo ? "#fff" : "rgba(255,255,255,0.4)" }}><Redo2 size={16} /></button>
                    </div>
                </div>

                {/* Center Section: Title */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <input 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        style={{ 
                            border: "none", fontSize: 14, fontWeight: 600, color: "#ffffff", outline: "none", 
                            background: "transparent", textAlign: "center", minWidth: 200, padding: "4px 8px",
                            borderRadius: 4, cursor: "text"
                        }} 
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        onFocus={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                        onBlur={e => e.currentTarget.style.background = "transparent"}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        {isSaving ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 500 }}>
                                <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                                <span>Saving...</span>
                            </div>
                        ) : lastSavedAt ? (
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                                <Save size={10} /> Saved
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Right Section */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={compileForPreview} disabled={isCompiling} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, cursor: isCompiling ? "wait" : "pointer", fontSize: 13, fontWeight: 600, color: "#fff", transition: "background 0.2s" }} onMouseEnter={e => !isCompiling && (e.currentTarget.style.background = "rgba(255,255,255,0.25)")} onMouseLeave={e => !isCompiling && (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}>
                        {isCompiling ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Eye size={16} />} <span style={{ display: "inline" }}>Preview</span>
                    </button>
                    
                    <button onClick={() => { setShowSendTest(true); setSendTestResult(null); }} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8,
                        background: "transparent", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
                        transition: "all 0.15s ease",
                    }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <Mail size={16} /> Send test email
                    </button>

                    <button 
                        onClick={() => setShowValidation(!showValidation)} 
                        style={{ 
                            display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", 
                            background: showValidation ? "#fff" : "rgba(255,255,255,0.15)", 
                            border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, 
                            color: showValidation ? "#7D2AE8" : "#fff", transition: "all 0.2s" 
                        }}
                    >
                        {errorCount > 0 ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                        <span>{errorCount > 0 ? `${errorCount} Issues` : "No Issues"}</span>
                    </button>

                    <button onClick={handleSave} disabled={saving} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", border: "none", borderRadius: 8,
                        background: "#fff", color: "#7D2AE8", cursor: "pointer", fontSize: 13, fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}>
                        <Share2 size={16} /> Share
                    </button>
                </div>
            </div>

            {/* ════ SEND TEST EMAIL MODAL ════ */}
            {showSendTest && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowSendTest(false)}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Send Test Email</div>
                        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 24 }}>Preview this template in a real inbox to verify rendering.</div>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Recipient Email</div>
                            <input value={sendTestEmail} onChange={e => setSendTestEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", padding: "10px 14px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Persona Data (JSON)</div>
                            <textarea value={sendTestPersona} onChange={e => setSendTestPersona(e.target.value)} rows={3} style={{ width: "100%", padding: "10px 14px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 12, fontFamily: "monospace", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Replaces merge tags like {'{{first_name}}'} in the email</div>
                        </div>
                        {sendTestResult === "sent" && <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: "10px 14px", color: "#166534", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>✅ Email sent successfully!</div>}
                        {sendTestResult === "error" && <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", color: "#991B1B", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>❌ Send failed. Check the template service logs.</div>}
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={() => setShowSendTest(false)} style={{ flex: 1, padding: "10px", border: "1px solid #E2E8F0", borderRadius: 10, background: "#fff", color: "#64748B", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                            <button onClick={handleSendTest} disabled={isSendingTest || !sendTestEmail} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, background: isSendingTest || !sendTestEmail ? "#A5B4FC" : "#6366F1", color: "#fff", fontSize: 14, fontWeight: 700, cursor: isSendingTest || !sendTestEmail ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                {isSendingTest ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Sending...</> : "Send Email"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", flex: 1, overflow: "hidden", cursor: (isResizingLeft || isResizingRight) ? "col-resize" : "default" }}>
                <LeftIconBar activeSidebarTab={activeSidebarTab} setActiveSidebarTab={setActiveSidebarTab} />
                
                {activeSidebarTab === "home" ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <div style={{ position: "absolute", inset: 0, zIndex: 0, backgroundImage: "url('/images/home-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
                        <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7))" }} />
                        
                        <div style={{ textAlign: "center", maxWidth: 600, animation: "fadeSlideUp 0.4s ease-out", zIndex: 1, position: "relative" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 20, background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#FFFFFF", marginBottom: 24, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" }}>
                                <Shapes size={32} />
                            </div>
                            <h1 style={{ fontSize: 44, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2, marginBottom: 16, textShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>"Elevate your brand with premium designs."</h1>
                            <p style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.9)", fontWeight: 500, marginBottom: 40, lineHeight: 1.6, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                                Choose from our curated library of high-performance templates and customize them to fit your brand identity.
                            </p>
                            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                                <button onClick={() => setActiveSidebarTab("templates")} style={{ padding: "16px 40px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)" }}><Layout size={20} /> Browse Templates</button>
                            </div>
                        </div>
                    </div>
                ) : activeSidebarTab === "templates" ? (
                    <ProjectsDashboard setActiveSidebarTab={setActiveSidebarTab} loadTemplate={loadTemplate} token={token} />
                ) : (
                    <>
                        <SecondaryDrawer
                            activeSidebarTab={activeSidebarTab} setActiveSidebarTab={setActiveSidebarTab}
                            sidebarWidth={sidebarWidth} activeSubMenu={activeSubMenu} setActiveSubMenu={setActiveSubMenu}
                            showElements={showElements} setShowElements={setShowElements}
                            photoSearchInput={photoSearchInput} setPhotoSearchInput={setPhotoSearchInput}
                            photoSearch={photoSearch} setPhotoSearch={setPhotoSearch}
                            iconSearch={iconSearch} setIconSearch={setIconSearch}
                            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                            loadTemplate={loadTemplate} design={design} pushDesign={pushDesign}
                            onAddBlock={(zone, type, props) => {
                                const id = addBlock(zone, type as any, props);
                                if (id) selectNode({ type: "block", id });
                            }}
                            BLOCK_DEFAULTS={BLOCK_DEFAULTS} BLOCK_ICONS={BLOCK_ICONS}
                            TEMPLATE_PRESETS={TEMPLATE_PRESETS} COMMON_ICONS={COMMON_ICONS}
                            token={token} onCreateNew={() => handleCreateNew()}
                            brandKits={brandKits} setBrandKits={setBrandKits}
                            activeBrandId={activeBrandId} setActiveBrandId={setActiveBrandId}
                            applyBrandToDesign={applyBrandToDesign}
                            onUseBrandComponent={useBrandComponent}
                        />

                        <div
                            onMouseDown={startResizingLeft}
                            style={{
                                width: 8, cursor: "col-resize", position: "relative", zIndex: 100, marginLeft: -4, marginRight: -4,
                                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease",
                                background: isResizingLeft ? "rgba(99, 102, 241, 0.08)" : "transparent"
                            }}
                        >
                            <div style={{ width: 2, height: isResizingLeft ? "100%" : 40, background: isResizingLeft ? "#6366F1" : "#E2E8F0", borderRadius: 4, transition: "all 0.2s ease", opacity: isResizingLeft ? 1 : 0.6 }} />
                        </div>

                        <div 
                            style={{ 
                                flex: 1, 
                                overflow: "auto", 
                                background: "#F1F5F9", 
                                display: "flex", 
                                justifyContent: "center",
                                alignItems: "flex-start",
                                padding: viewMode === "mobile" ? "40px 0" : "0"
                            }}
                        >
                            <div style={{
                                width: viewMode === "mobile" ? 375 : "100%",
                                transition: "all 0.3s ease-in-out",
                                transform: viewMode === "mobile" ? "scale(0.85)" : "none",
                                transformOrigin: "top center",
                                background: "#fff",
                                boxShadow: viewMode === "mobile" ? "0 20px 50px rgba(0,0,0,0.1)" : "none",
                                borderRadius: viewMode === "mobile" ? 20 : 0,
                                overflow: "hidden",
                                height: viewMode === "mobile" ? "812px" : "100%"
                            }}>
                                <EditorCanvas
                                    brandTypography={brandKits.find(b => b.id === activeBrandId)?.typography}
                                />
                            </div>
                        </div>

                        {/* RIGHT INSPECTOR — only show for theme/page settings, hide for blocks as toolbar handles it */}
                        {selectedNode && selectedNode.type === "page" && (
                            <InspectorPanel
                                selectedNode={selectedNode}
                                design={design}
                                onUpdateBlockProp={updateBlockProp}
                                onUpdateTheme={updateTheme}
                                onDuplicateBlock={duplicateBlock}
                                onDeleteBlock={deleteBlock}
                                onOpenUpload={(blockId) => setPendingImageCol(blockId)}
                                width={300}
                            />
                        )}
                        {/* RIGHT VALIDATION PANEL */}
                        {showValidation && (
                            <div style={{
                                width: 320, background: "#fff", borderLeft: "1px solid #E4E4E7",
                                display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 40
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #F1F5F9" }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Validation Gateway</span>
                                    <button onClick={() => setShowValidation(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748B" }}>✕</button>
                                </div>
                                <ValidationPanel />
                            </div>
                        )}
                    </>
                )}
            </div>

            {showPreview && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowPreview(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ width: previewViewMode === "mobile" ? 420 : 720, maxHeight: "92vh", background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 32px 64px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Email Preview</span>
                                {isCompiling && <Loader2 size={14} style={{ color: "#6366F1", animation: "spin 1s linear infinite" }} />}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 8, padding: 3, gap: 2 }}>
                                    <button onClick={() => setPreviewViewMode("desktop")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, background: previewViewMode === "desktop" ? "#fff" : "transparent", color: previewViewMode === "desktop" ? "#6366F1" : "#64748B", boxShadow: previewViewMode === "desktop" ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
                                        <Monitor size={13} /> Desktop
                                    </button>
                                    <button onClick={() => setPreviewViewMode("mobile")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, background: previewViewMode === "mobile" ? "#fff" : "transparent", color: previewViewMode === "mobile" ? "#6366F1" : "#64748B", boxShadow: previewViewMode === "mobile" ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
                                        <Smartphone size={13} /> Mobile
                                    </button>
                                </div>
                                <button onClick={() => setShowPreview(false)} style={{ border: "1px solid #E2E8F0", background: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#475569" }}>Close</button>
                            </div>
                        </div>
                        {compileError && <div style={{ background: "#FEF2F2", padding: "10px 20px", fontSize: 13, color: "#991B1B", fontWeight: 500, borderBottom: "1px solid #FECACA" }}>❌ {compileError}</div>}
                        <div style={{ flex: 1, overflowY: "auto", background: "#F8F9FB", display: "flex", justifyContent: "center", padding: previewViewMode === "mobile" ? "20px 0" : 0 }}>
                            {isCompiling ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 16 }}>
                                    <Loader2 size={32} style={{ color: "#6366F1", animation: "spin 1s linear infinite" }} />
                                    <span style={{ fontSize: 13, color: "#64748B" }}>Compiling email...</span>
                                </div>
                            ) : compiledHtml ? (
                                <iframe
                                    srcDoc={compiledHtml}
                                    style={{ width: previewViewMode === "mobile" ? 375 : "100%", minHeight: 500, border: previewViewMode === "mobile" ? "1px solid #E2E8F0" : "none", borderRadius: previewViewMode === "mobile" ? 12 : 0, background: "#fff" }}
                                    title="Email Preview"
                                    sandbox="allow-same-origin"
                                />
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: "#94A3B8", fontSize: 14 }}>No preview available — add some blocks first.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg) } }
                @keyframes fadeSlideRight { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
                * { box-sizing: border-box; }
                .block-card:hover { background-color: #F8FAFC !important; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05) !important; border-color: #E2E8F0 !important; }
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
                            addBlock(pendingImageCol as any, "image", { src: url });
                        }
                        setPendingImageCol(null);
                    }
                }}
            />
        </div>
    );
}

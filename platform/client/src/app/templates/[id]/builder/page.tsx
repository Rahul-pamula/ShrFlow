"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, Save, Loader2, Monitor, Smartphone, 
    Layers, MousePointer2, Type, Image as ImageIcon, 
    Square, Trash2, Copy, AlertCircle, CheckCircle2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import "grapesjs/dist/css/grapes.min.css";

import { GjsMapper } from "./GjsMapper";
import { TipTapGjsPlugin } from "./TipTapGjsPlugin";
import { TipTapOverlay } from "./components/TipTapOverlay";
import { DesignJSON, DEFAULT_THEME, DEFAULT_SETTINGS } from "../block/types";

const API_BASE = "http://localhost:8000";

export default function TemplateBuilderPage({ params }: { params: { id: string } }) {
    const { token } = useAuth();
    const router = useRouter();
    const editorRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState<any>(null);
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
    const [activeTab, setActiveTab] = useState<"blocks" | "settings">("blocks");
    const [selectedComponent, setSelectedComponent] = useState<any>(null);
    const [designJson, setDesignJson] = useState<DesignJSON | null>(null);
    
    // TipTap State
    const [tiptapActive, setTiptapActive] = useState<{ el: HTMLElement, component: any } | null>(null);

    // Fetch template
    useEffect(() => {
        if (!token) return;
        const fetchTemplate = async () => {
            try {
                const res = await fetch(`${API_BASE}/templates/${params.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTemplate(data);
                    setDesignJson(data.design_json || { 
                        rows: [], 
                        theme: DEFAULT_THEME, 
                        settings: DEFAULT_SETTINGS, 
                        headerBlocks: [], 
                        bodyBlocks: [], 
                        footerBlocks: [] 
                    });
                } else {
                    router.push("/templates");
                }
            } catch (e) {
                console.error("Failed to load", e);
            }
            setLoading(false);
        };
        fetchTemplate();
    }, [params.id, token, router]);

    // Initialize GrapesJS
    useEffect(() => {
        if (loading || !containerRef.current || !designJson) return;

        const grapesjs = require("grapesjs");
        const presetMjml = require("grapesjs-mjml");

        const editor = grapesjs.init({
            container: containerRef.current,
            height: '100%',
            width: '100%',
            storageManager: false,
            plugins: [presetMjml, TipTapGjsPlugin],
            canvas: {
                styles: [
                    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
                    'body { font-family: "Inter", sans-serif; background: #fff; }'
                ]
            },
            panels: { defaults: [] }, // Remove default UI
            blockManager: { custom: true }, // We build our own
        });

        // Load initial data via Mapper
        const gjsComponents = GjsMapper.toGjs(designJson);
        editor.setComponents(gjsComponents);

        // Sync changes back to DesignJSON
        const syncToState = () => {
            const currentData = {
                components: editor.getComponents().toJSON(),
                theme: designJson.theme, // Simplified for now
                settings: designJson.settings
            };
            const newDesign = GjsMapper.fromJson(currentData);
            setDesignJson(newDesign);
        };

        editor.on('component:update', syncToState);
        editor.on('component:add', syncToState);
        editor.on('component:remove', syncToState);

        // TipTap Events
        editor.on('tiptap:enable', (data: any) => setTiptapActive(data));
        editor.on('tiptap:disable', () => setTiptapActive(null));

        // Selection Events for Settings
        editor.on('component:selected', () => {
            setSelectedComponent(editor.getSelected());
            setActiveTab("settings");
        });
        editor.on('component:deselected', () => {
            setSelectedComponent(null);
            setActiveTab("blocks");
        });

        // Validation Highlighting Helper
        const highlightErrors = (errors: any[]) => {
            const wrapper = editor.getWrapper();
            wrapper.view.$el.find('.gjs-error-pulse').removeClass('gjs-error-pulse'); // Clear old
            
            errors.forEach(err => {
                const comp = editor.getWrapper().find(`[data-block-id="${err.blockId}"]`)[0];
                if (comp) {
                    comp.addClass('gjs-error-pulse');
                    comp.set('badgename', 'Invalid'); // Show validation text
                }
            });
        };

        editor.on('validation:trigger', highlightErrors);

        editorRef.current = editor;

        return () => {
            if (editorRef.current) {
                editorRef.current.destroy();
            }
        };
    }, [loading]);

    const handleSave = async () => {
        if (!editorRef.current || !token || !designJson) return;
        setSaving(true);

        try {
            // Get HTML for preview cache
            const mjml = editorRef.current.getHtml(); // mjml-preset returns MJML from getHtml()
            
            // Compile MJML to HTML via API for accurate storage
            const compileRes = await fetch(`${API_BASE}/templates/compile/preview`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(designJson)
            });
            const compiledHtml = await compileRes.text();

            const res = await fetch(`${API_BASE}/templates/${params.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: template.name,
                    design_json: designJson,
                    compiled_html: compiledHtml
                })
            });

            if (res.ok) router.push("/templates");
        } catch (e) {
            console.error("Save error", e);
        }
        setSaving(false);
    };

    if (loading) return (
        <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-primary)]">
            <Loader2 className="animate-spin text-[var(--text-muted)]" size={32} />
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden font-sans">
            {/* Top Toolbar */}
            <header className="h-14 border-b border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push("/templates")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold">{template?.name || "Untitled"}</h1>
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Source of Truth: DesignJSON</p>
                            <span className="w-1 h-1 bg-[var(--text-muted)] rounded-full"></span>
                            <p className="text-[10px] text-[var(--accent)] font-bold">STRICT SCHEMA</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center bg-[var(--bg-secondary)] rounded-lg p-1 gap-1">
                    <button 
                        onClick={() => { setViewMode("desktop"); editorRef.current?.setDevice("Desktop"); }}
                        className={`p-1.5 rounded-md transition-all ${viewMode === "desktop" ? "bg-white shadow-sm text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                    >
                        <Monitor size={16} />
                    </button>
                    <button 
                        onClick={() => { setViewMode("mobile"); editorRef.current?.setDevice("Mobile"); }}
                        className={`p-1.5 rounded-md transition-all ${viewMode === "mobile" ? "bg-white shadow-sm text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                    >
                        <Smartphone size={16} />
                    </button>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-9 px-4 bg-[var(--accent)] text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Template
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Custom Sidebar */}
                <aside className="w-72 border-r border-[var(--border)] bg-[var(--bg-card)] flex flex-col overflow-hidden">
                    <div className="flex border-b border-[var(--border)]">
                        <button 
                            onClick={() => setActiveTab("blocks")}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "blocks" ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--text-muted)]"}`}
                        >
                            Blocks
                        </button>
                        <button 
                            onClick={() => setActiveTab("settings")}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "settings" ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--text-muted)]"}`}
                        >
                            Settings
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {activeTab === "blocks" ? (
                            <div className="flex flex-col">
                                <div className="p-4 border-b border-[var(--border)]">
                                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Elements</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <BlockIcon icon={<Type size={18}/>} label="Text" onDrag={() => editorRef.current?.runCommand('mjml-get-text')} />
                                        <BlockIcon icon={<ImageIcon size={18}/>} label="Image" onDrag={() => editorRef.current?.runCommand('mjml-get-image')} />
                                        <BlockIcon icon={<Square size={18}/>} label="Button" onDrag={() => editorRef.current?.runCommand('mjml-get-button')} />
                                        <BlockIcon icon={<Layers size={18}/>} label="Row" onDrag={() => editorRef.current?.runCommand('mjml-get-section')} />
                                    </div>
                                </div>
                                <div className="p-4 border-b border-[var(--border)]">
                                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Columns</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <BlockIcon icon={<Layers size={18} className="rotate-90"/>} label="1 Column" onDrag={() => editorRef.current?.runCommand('mjml-get-column')} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4">
                                {selectedComponent ? (
                                    <div className="space-y-6">
                                        <div className="pb-4 border-b border-[var(--border)]">
                                            <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">Selected</h4>
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Layers size={14} className="text-[var(--accent)]" />
                                                {selectedComponent.get('type').replace('mj-', '').toUpperCase()}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <PropertyInput 
                                                label="Background" 
                                                value={selectedComponent.getAttributes()['background-color'] || "#ffffff"}
                                                onChange={(val) => selectedComponent.addAttributes({'background-color': val})}
                                            />
                                            <PropertyInput 
                                                label="Padding" 
                                                value={selectedComponent.getAttributes()['padding'] || "10"}
                                                onChange={(val) => selectedComponent.addAttributes({'padding': val})}
                                            />
                                        </div>
                                        
                                        <button 
                                            onClick={() => { editorRef.current?.runCommand('core:component-delete'); }}
                                            className="w-full py-2 bg-red-50 text-red-500 rounded-lg text-xs font-semibold border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={14} /> Delete Element
                                        </button>
                                    </div>
                                ) : (
                                    <div className="h-40 flex flex-col items-center justify-center text-center opacity-40">
                                        <MousePointer2 size={32} className="mb-2" />
                                        <p className="text-xs">Select an element<br/>to edit properties</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Status</span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Live Sync</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Canvas Area */}
                <main className="flex-1 bg-[#F1F5F9] relative flex justify-center p-12 overflow-y-auto custom-scrollbar">
                    <div 
                        className="transition-all duration-500 ease-in-out relative"
                        style={{ 
                            width: viewMode === "mobile" ? 375 : 600,
                            minHeight: "100%",
                            backgroundColor: "#fff",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
                            borderRadius: viewMode === "mobile" ? 24 : 4,
                            overflow: "hidden",
                            border: viewMode === "mobile" ? "8px solid #1e293b" : "1px solid transparent"
                        }}
                    >
                        <div ref={containerRef} className="h-full w-full"></div>
                    </div>
                    
                    {/* TipTap Overlay */}
                    {tiptapActive && (
                        <TipTapOverlay 
                            element={tiptapActive.el} 
                            content={tiptapActive.component.get('content')} 
                            onSave={(html) => {
                                tiptapActive.component.set('content', html);
                                // editorRef.current.trigger('component:update'); 
                            }}
                            onClose={() => setTiptapActive(null)}
                        />
                    )}
                </main>
            </div>

            <style jsx global>{`
                .gjs-cv-canvas { background-color: transparent !important; }
                .gjs-frame { box-shadow: none !important; }
                .gjs-highlighter { 
                    outline: 2px solid var(--accent) !important; 
                    outline-offset: -2px; 
                    border: none !important; 
                    background: rgba(99, 102, 241, 0.05) !important;
                    pointer-events: none;
                }
                .gjs-badge { 
                    background-color: var(--accent) !important; 
                    font-size: 10px !important; 
                    padding: 4px 8px !important; 
                    border-radius: 4px !important; 
                    font-weight: bold !important;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) !important;
                }
                .gjs-error-pulse {
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3), 0 0 20px rgba(239, 68, 68, 0.2) !important;
                    animation: gjs-pulse-red 2s infinite;
                    border-radius: 4px;
                }
                @keyframes gjs-pulse-red {
                    0% { box-shadow: 0 0 0 0px rgba(239, 68, 68, 0.5); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0px rgba(239, 68, 68, 0); }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
            `}</style>
        </div>
    );
}

function BlockIcon({ icon, label, onDrag }: { icon: React.ReactNode, label: string, onDrag?: () => void }) {
    return (
        <div 
            draggable 
            onDragStart={onDrag}
            className="flex flex-col items-center justify-center p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl cursor-grab hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all group active:scale-95"
        >
            <div className="mb-2 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">{icon}</div>
            <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
        </div>
    );
}

function PropertyInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</label>
            <div className="flex gap-2">
                <input 
                    type={label === "Background" ? "color" : "text"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 h-9 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 text-xs focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                />
            </div>
        </div>
    );
}

import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Copy, Plus, Search, Loader2, X } from "lucide-react";

import { TEMPLATE_PRESETS, MY_TEMPLATE_PRESETS, TemplatePreset } from "./templates_library";

interface ProjectsDashboardProps {
    setActiveSidebarTab: (val: string) => void;
    loadTemplate: (preset: TemplatePreset) => void;
    token: string | null;
}

const ProjectCard = ({ preset, onUse, onPreview }: { preset: TemplatePreset, onUse: (preset: TemplatePreset) => void, onPreview: (preset: TemplatePreset) => void }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            style={{ 
                minWidth: 260, 
                width: 260, 
                borderRadius: 16, 
                overflow: "hidden", 
                background: "#fff", 
                border: "1px solid #E2E8F0", 
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: isHovered ? "translateY(-4px)" : "none",
                boxShadow: isHovered ? "0 12px 24px -10px rgba(0,0,0,0.15)" : "0 4px 6px -4px rgba(0,0,0,0.05)",
                position: "relative"
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{ position: "relative", width: "100%", height: 160 }}>
                <img src={preset.thumbnail} alt={preset.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                
                {/* Hover Overlay */}
                <div style={{ 
                    position: "absolute", 
                    inset: 0, 
                    background: "rgba(15, 23, 42, 0.6)", 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center",
                    gap: 12,
                    opacity: isHovered ? 1 : 0,
                    transition: "opacity 0.2s ease"
                }}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onUse(preset); }}
                        style={{
                            background: "#6366F1", color: "#fff", border: "none", borderRadius: 8,
                            padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6,
                            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)"
                        }}
                    >
                        <Copy size={16} /> Use this Template
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPreview(preset); }}
                        style={{
                            background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8,
                            padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                            backdropFilter: "blur(4px)"
                        }}
                    >
                        Preview
                    </button>
                </div>
            </div>
            <div style={{ padding: "16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                    Template
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {preset.name}
                </div>
            </div>
        </div>
    );
};

const HorizontalScrollRow = ({ title, presets, onUse, onPreview }: { title: string, presets: TemplatePreset[], onUse: (preset: TemplatePreset) => void, onPreview: (preset: TemplatePreset) => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === "left" ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    return (
        <div style={{ marginBottom: 48, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 40px" }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>{title}</h2>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => scroll("left")} style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}>
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => scroll("right")} style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
            
            <div 
                ref={scrollRef}
                style={{ 
                    display: "flex", 
                    gap: 20, 
                    overflowX: "auto", 
                    padding: "10px 40px 20px 40px", 
                    scrollbarWidth: "none", // Firefox
                    msOverflowStyle: "none", // IE
                }}
            >
                <style>{`
                    /* Hide scrollbar for Chrome, Safari and Opera */
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                {presets.map(preset => (
                    <ProjectCard key={preset.id} preset={preset} onUse={onUse} onPreview={onPreview} />
                ))}
            </div>
        </div>
    );
};

export const ProjectsDashboard = ({ setActiveSidebarTab, loadTemplate, token }: ProjectsDashboardProps) => {
    const [viewMode, setViewMode] = useState<"starter" | "my_projects">("starter");
    const [searchTerm, setSearchTerm] = useState("");
    const [previewPreset, setPreviewPreset] = useState<TemplatePreset | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const handlePreview = async (preset: TemplatePreset) => {
        setPreviewPreset(preset);
        setPreviewHtml("");
        setIsPreviewLoading(true);
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
            const res = await fetch(`${API}/templates/compile/preview`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ design_json: preset.design })
            });
            if (!res.ok) throw new Error("Failed to compile preview");
            const data = await res.json();
            setPreviewHtml(data.html);
        } catch (err) {
            console.error("Preview error:", err);
            setPreviewHtml("<p style='padding: 20px; text-align: center; color: #ef4444;'>Failed to generate preview.</p>");
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleUseTemplate = (preset: TemplatePreset) => {
        loadTemplate(preset);
    };

    const CATEGORY_MAP: Record<string, string[]> = {
        "E-Commerce & Sales": [
                "tpl_kn14pla1",
                "tpl_9ilkvptn",
                "tpl_cnxj11rh",
                "tpl_mkm716yc",
                "tpl_cmdwf88w",
                "tpl_ra6sd46v",
                "tpl_537bpc2j",
                "tpl_8q3fbeap",
                "tpl_upkxu6bh",
                "tpl_vvwbl6n5",
                "tpl_it4iesqj",
                "tpl_idk02cc3",
                "tpl_qym1ad10",
                "tpl_5jfcj20l",
                "tpl_y7o950lx",
                "tpl_f7dbnpb2",
                "tpl_4qv64v4s",
                "tpl_k1ogp7ak",
                "tpl_ewpgffwf",
                "tpl_livrzte3"
        ],
        "Newsletters & Updates": [
                "tpl_mq365bbk",
                "tpl_gapuucb6",
                "tpl_mntwm50w",
                "tpl_49hkxpi8",
                "tpl_d6095mgd",
                "tpl_pe293n4e",
                "tpl_1s46y8rv",
                "tpl_hjbvhfr1",
                "tpl_i0xgzb7n",
                "tpl_0f10v8a5",
                "tpl_o7geix8n",
                "tpl_m5odyw1a",
                "tpl_2pxgif0b",
                "tpl_ba5ows2m",
                "tpl_ri6pqqhq",
                "tpl_xxrf7zbl",
                "tpl_v62y2qem",
                "tpl_fsb43o0w",
                "tpl_kaer4u1d",
                "tpl_rr9svo36"
        ],
        "Business & Professional": [
                "tpl_spvk02uo",
                "tpl_9t5h13k7",
                "tpl_01ad4rzp",
                "tpl_bslnlmxz",
                "tpl_x872r3s2",
                "tpl_i8mffbf9",
                "tpl_fh6sv4ff",
                "tpl_wovin3id",
                "tpl_ivzl66av",
                "tpl_u7xyg28x",
                "tpl_we15us62",
                "tpl_bysmklwn",
                "tpl_vfer99bi",
                "tpl_djq6k9dq",
                "tpl_f7dfezap",
                "tpl_89ixo0vr",
                "tpl_x19thd02",
                "tpl_3ko0okv3",
                "tpl_ruqkz5fi",
                "tpl_ut4m2y3o"
        ],
        "Events & Announcements": [
                "tpl_g35k5frj",
                "tpl_ybn13v6p",
                "tpl_2jtwuzo3",
                "tpl_6wy980kc",
                "tpl_u70gkdi5",
                "tpl_mglmij29",
                "tpl_q6u64g5i",
                "tpl_yglolmpe",
                "tpl_1t2oh7nj",
                "tpl_bk1a8syj",
                "tpl_8j3z0s2z",
                "tpl_u4til2t9",
                "tpl_ptb0sqok",
                "tpl_qida3g5u",
                "tpl_7w7uen7p",
                "tpl_e1h614dh",
                "tpl_rbvzmo08",
                "tpl_jb6dvvvl",
                "tpl_z4y09l7c",
                "tpl_75b681zu"
        ],
        "Milestones & Rewards": [
                "tpl_0h51pc3m",
                "tpl_oil4dpd3",
                "tpl_wishy25e",
                "tpl_llj6wmdl",
                "tpl_lzmxllye",
                "tpl_fzrru3mq",
                "tpl_axo1jgdv",
                "tpl_7a7505uz",
                "tpl_umcpay8p",
                "tpl_q1prggtm",
                "tpl_61qovo0i",
                "tpl_lw2oie46",
                "tpl_ea0gdad7",
                "tpl_6yeokr1m",
                "tpl_gn79og1h",
                "tpl_pya86yhr",
                "tpl_d1jvqdtq",
                "tpl_f29hsbmt",
                "tpl_4xuqjn7l",
                "tpl_2tqph0km"
        ]
,
        "Welcome Emails": [
                "tpl_7mxq517y",
                "tpl_d0lm6u76",
                "tpl_v563k3fq",
                "tpl_t30c524l",
                "tpl_437ho8gq",
                "tpl_dxwdu8pg",
                "tpl_hvi1ka21",
                "tpl_u1dtvhuv",
                "tpl_7dnhuma9",
                "tpl_kq5qkr70",
                "tpl_whe4h81d",
                "tpl_2yq48vqk",
                "tpl_yt0hv1lw",
                "tpl_yaxcwu9j",
                "tpl_0vk5jrgr"
        ],
        "Order & Transactional": [
                "tpl_f5oieb7j",
                "tpl_oum2z435",
                "tpl_uj6w9hd7",
                "tpl_7x6j8lxd",
                "tpl_a0zvz2ks",
                "tpl_s7e1wuqk",
                "tpl_k5bm4mnc",
                "tpl_csn6q2h2",
                "tpl_k864cs0j",
                "tpl_m5ju0xqn",
                "tpl_kz2plzo2",
                "tpl_qhij0yow",
                "tpl_kizk4yf2",
                "tpl_ennnhh3w",
                "tpl_n7vdujwx"
        ],
        "Product Launch": [
                "tpl_1spgtf5b",
                "tpl_1ofnmsyw",
                "tpl_krkgrd90",
                "tpl_hfmpmn30",
                "tpl_vr6e1l45",
                "tpl_27ni7kko",
                "tpl_zli4jmg9",
                "tpl_bzuj2qu5",
                "tpl_itsq01wx",
                "tpl_kpunm9w9",
                "tpl_uxxve0ew",
                "tpl_jy25efgk",
                "tpl_uhyjcyr7",
                "tpl_npcj818a",
                "tpl_5fshcv23"
        ],
        "Holiday & Seasonal": [
                "tpl_l4xd6aew",
                "tpl_fgpg0l9s",
                "tpl_ncyqwwc5",
                "tpl_isyr9iyy",
                "tpl_w1u7e9nl",
                "tpl_wapvbknl",
                "tpl_ea6pb2qa",
                "tpl_sxv4zgqo",
                "tpl_702iksyf",
                "tpl_6u8vyaou",
                "tpl_gjvw06u8",
                "tpl_tvycfcbe",
                "tpl_ksl4lu7u",
                "tpl_v4o5u7gu",
                "tpl_nzyz35ru"
        ],
        "SaaS & Tech": [
                "tpl_iajg1tq4",
                "tpl_o848kj8p",
                "tpl_pj8cedqa",
                "tpl_nqbotjm7",
                "tpl_dw0penb1",
                "tpl_oaurpynv",
                "tpl_eceex5w5",
                "tpl_3rm9f6yk",
                "tpl_iqdzttz8",
                "tpl_spjoif3d",
                "tpl_t8ojtduf",
                "tpl_v1wxbuzw",
                "tpl_m0z0y6l1",
                "tpl_zngbqm5q",
                "tpl_wo3sjuko"
        ]
};

    const dynamicCategories = Object.entries(CATEGORY_MAP).map(([title, ids]) => {
        const presets = ids.map(id => TEMPLATE_PRESETS.find(p => p.id === id)).filter(Boolean) as TemplatePreset[];
        return {
            title,
            presets: presets.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()))
        };
    }).filter(cat => cat.presets.length > 0);

    const dynamicMyProjects = MY_TEMPLATE_PRESETS.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F8FAFC", overflow: "hidden", animation: "fadeSlideUp 0.3s ease-out" }}>
            {/* Top Navigation */}
            <div style={{ padding: "40px 40px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: 36, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Templates</h1>
                    <p style={{ fontSize: 15, color: "#64748B" }}>Browse professionally designed templates to kickstart your email.</p>
                </div>
                
                <div style={{ display: "flex", background: "#E2E8F0", padding: 4, borderRadius: 12 }}>
                    <button 
                        onClick={() => setViewMode("starter")}
                        style={{
                            padding: "8px 24px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
                            background: viewMode === "starter" ? "#fff" : "transparent",
                            color: viewMode === "starter" ? "#0F172A" : "#64748B",
                            boxShadow: viewMode === "starter" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                            transition: "all 0.2s"
                        }}
                    >
                        Starter Templates
                    </button>
                    <button 
                        onClick={() => setViewMode("my_projects")}
                        style={{
                            padding: "8px 24px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
                            background: viewMode === "my_projects" ? "#fff" : "transparent",
                            color: viewMode === "my_projects" ? "#0F172A" : "#64748B",
                            boxShadow: viewMode === "my_projects" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                            transition: "all 0.2s"
                        }}
                    >
                        My Templates
                    </button>
                </div>
            </div>
            
            <div style={{ padding: "0 40px 24px" }}>
                <div style={{ position: "relative", maxWidth: 400 }}>
                    <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                    <input
                        placeholder="Search templates by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%", padding: "12px 16px 12px 48px", borderRadius: 12, border: "1px solid #E2E8F0",
                            fontSize: 15, outline: "none", background: "#fff", color: "#0F172A",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                        }}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: 60 }}>
                {viewMode === "starter" ? (
                    <div>
                        {dynamicCategories.map(category => (
                            <HorizontalScrollRow key={category.title} title={category.title} presets={category.presets} onUse={handleUseTemplate} onPreview={handlePreview} />
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: "0 40px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
                            <div 
                                style={{ 
                                    height: 250, borderRadius: 16, border: "2px dashed #CBD5E1", display: "flex", flexDirection: "column", 
                                    alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B", transition: "all 0.2s" 
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = "#6366F1"}
                                onMouseLeave={e => e.currentTarget.style.borderColor = "#CBD5E1"}
                                onClick={() => setActiveSidebarTab("projects")}
                            >
                                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                                    <Plus size={24} color="#6366F1" />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Create Blank</span>
                            </div>
                            
                            {dynamicMyProjects.map(preset => (
                                <ProjectCard key={preset.id} preset={preset} onUse={handleUseTemplate} onPreview={handlePreview} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Modal Overlay */}
            {previewPreset && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(8px)", zIndex: 9999, display: "flex",
                    alignItems: "center", justifyContent: "center", padding: 40,
                    animation: "fadeIn 0.2s ease-out"
                }}>
                    <div style={{
                        width: "100%", maxWidth: 1000, height: "100%", maxHeight: 800,
                        background: "#fff", borderRadius: 24, overflow: "hidden",
                        display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                        animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: "20px 32px", borderBottom: "1px solid #F1F5F9",
                            display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>{previewPreset.name}</h3>
                                <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0 0" }}>Previewing template layout</p>
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <button 
                                    onClick={() => { loadTemplate(previewPreset); setPreviewPreset(null); }}
                                    style={{
                                        background: "#6366F1", color: "#fff", border: "none", borderRadius: 12,
                                        padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
                                    }}
                                >
                                    <Copy size={18} /> Use Template
                                </button>
                                <button 
                                    onClick={() => setPreviewPreset(null)}
                                    style={{
                                        background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 12,
                                        width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                                        cursor: "pointer", transition: "all 0.2s"
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div style={{ flex: 1, background: "#F8FAFC", position: "relative", overflow: "hidden" }}>
                            {isPreviewLoading ? (
                                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                                    <Loader2 size={32} className="animate-spin" style={{ color: "#6366F1" }} />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Generating high-fidelity preview...</span>
                                </div>
                            ) : (
                                <iframe 
                                    srcDoc={previewHtml}
                                    style={{ width: "100%", height: "100%", border: "none" }}
                                    title="Template Preview"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

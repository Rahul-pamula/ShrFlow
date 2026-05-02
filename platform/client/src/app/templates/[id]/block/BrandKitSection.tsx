"use client";
import React, { useState } from "react";
import { Palette, Type, Image as ImageIcon, LayoutTemplate, BookOpen, Plus, Trash2, Check, Settings, Search, Upload } from "lucide-react";
import { SectionLabel, FormGroup, Label, TabsContainer, Tab } from "./BuilderComponents";
import { BrandKit, BrandColor, BrandTypography, BrandAsset, BrandComponent, BrandGuidelines, DesignJSON, uid } from "./types";

interface BrandKitSectionProps {
    brandKits: BrandKit[];
    setBrandKits: React.Dispatch<React.SetStateAction<BrandKit[]>>;
    activeBrandId: string;
    setActiveBrandId: (id: string) => void;
    applyBrandToDesign: () => void;
}

export const BrandKitSection = ({ brandKits, setBrandKits, activeBrandId, setActiveBrandId, applyBrandToDesign }: BrandKitSectionProps) => {
    const [activeTab, setActiveTab] = useState<"colors" | "typography" | "assets" | "components" | "guidelines">("colors");

    const activeBrand = brandKits.find(b => b.id === activeBrandId) || brandKits[0];

    const updateActiveBrand = (updater: (brand: BrandKit) => BrandKit) => {
        setBrandKits(prev => prev.map(b => b.id === activeBrandId ? updater(b) : b));
    };

    const addColor = (group: "Primary" | "Secondary" | "Accent") => {
        updateActiveBrand(b => ({
            ...b,
            colors: [...b.colors, { id: uid(), name: `New ${group}`, hex: "#000000", group }]
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

    const updateTypography = (field: keyof BrandTypography, value: any) => {
        updateActiveBrand(b => ({
            ...b,
            typography: { ...b.typography, [field]: value }
        }));
    };

    const inputStyle = {
        width: "100%", padding: "10px 12px", borderRadius: 10,
        border: "1px solid #E2E8F0", fontSize: 13, outline: "none",
        background: "#F8FAFC"
    };

    return (
        <div style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <SectionLabel style={{ margin: 0 }}>Brand Manager</SectionLabel>
            </div>

            <FormGroup>
                <select
                    value={activeBrandId}
                    onChange={e => setActiveBrandId(e.target.value)}
                    style={{ ...inputStyle, fontWeight: "bold", background: "#fff", border: "1px solid #CBD5E1" }}
                >
                    {brandKits.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </FormGroup>

            <button
                onClick={applyBrandToDesign}
                style={{
                    width: "100%", padding: "10px", background: "#4F46E5", color: "#fff",
                    border: "none", borderRadius: 10, fontSize: 13, fontWeight: "bold",
                    cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)"
                }}
            >
                <Check size={16} /> Apply Brand to Design
            </button>

            <TabsContainer style={{ marginBottom: 16, background: "#F1F5F9", padding: 4, borderRadius: 12, display: "flex", flexWrap: "wrap", gap: 4 }}>
                <Tab active={activeTab === "colors"} onClick={() => setActiveTab("colors")} style={{ flex: "1 1 calc(50% - 4px)", padding: "8px" }}><Palette size={14} /> Colors</Tab>
                <Tab active={activeTab === "typography"} onClick={() => setActiveTab("typography")} style={{ flex: "1 1 calc(50% - 4px)", padding: "8px" }}><Type size={14} /> Text</Tab>
                <Tab active={activeTab === "assets"} onClick={() => setActiveTab("assets")} style={{ flex: "1 1 calc(33% - 4px)", padding: "8px" }}><ImageIcon size={14} /> Assets</Tab>
                <Tab active={activeTab === "components"} onClick={() => setActiveTab("components")} style={{ flex: "1 1 calc(33% - 4px)", padding: "8px" }}><LayoutTemplate size={14} /> Comps</Tab>
                <Tab active={activeTab === "guidelines"} onClick={() => setActiveTab("guidelines")} style={{ flex: "1 1 calc(33% - 4px)", padding: "8px" }}><BookOpen size={14} /> Guide</Tab>
            </TabsContainer>

            {activeTab === "colors" && (
                <div>
                    {["Primary", "Secondary", "Accent"].map(group => (
                        <div key={group} style={{ marginBottom: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <Label style={{ margin: 0, fontSize: 12 }}>{group} Colors</Label>
                                <button onClick={() => addColor(group as any)} style={{ background: "none", border: "none", color: "#4F46E5", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                                {activeBrand.colors.filter(c => c.group === group).map(color => (
                                    <div key={color.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 6, background: color.hex, border: "1px solid #E2E8F0" }} />
                                        <input
                                            type="text"
                                            value={color.hex}
                                            onChange={e => updateColor(color.id, e.target.value)}
                                            style={{ ...inputStyle, flex: 1, padding: "8px 10px", fontSize: 12, textTransform: "uppercase" }}
                                        />
                                        <button onClick={() => removeColor(color.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {activeBrand.colors.filter(c => c.group === group).length === 0 && (
                                    <div style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>No colors added.</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === "typography" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Live Preview Panel */}
                    <div style={{
                        background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", marginBottom: 8
                    }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 12 }}>Typography Preview</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{
                                fontFamily: activeBrand.typography.headingFont,
                                fontSize: activeBrand.typography.h1Size,
                                fontWeight: activeBrand.typography.headingWeight,
                                textTransform: activeBrand.typography.headingTransform,
                                lineHeight: activeBrand.typography.baseLineHeight,
                                letterSpacing: `${activeBrand.typography.letterSpacing}px`,
                                color: activeBrand.colors.find(c => c.group === "Primary")?.hex || "#1e293b"
                            }}>Heading One</div>
                            <div style={{
                                fontFamily: activeBrand.typography.headingFont,
                                fontSize: activeBrand.typography.h2Size,
                                fontWeight: activeBrand.typography.headingWeight,
                                textTransform: activeBrand.typography.headingTransform,
                                lineHeight: activeBrand.typography.baseLineHeight,
                                color: "#334155"
                            }}>Heading Two</div>
                            <div style={{
                                fontFamily: activeBrand.typography.bodyFont,
                                fontSize: activeBrand.typography.bodySize,
                                fontWeight: activeBrand.typography.bodyWeight,
                                lineHeight: activeBrand.typography.baseLineHeight,
                                color: "#475569"
                            }}>This is a preview of your body text. It uses the selected body font and base line height settings.</div>
                            <button style={{
                                width: "fit-content", padding: "8px 16px", borderRadius: 8,
                                background: activeBrand.colors.find(c => c.group === "Primary")?.hex || "#4F46E5",
                                color: "#fff", border: "none", fontSize: 13,
                                fontFamily: activeBrand.typography.bodyFont,
                                fontWeight: activeBrand.typography.buttonWeight,
                                textTransform: activeBrand.typography.buttonTransform,
                                letterSpacing: `${activeBrand.typography.letterSpacing}px`
                            }}>Button Text</button>
                        </div>
                    </div>

                    {/* Font Selection */}
                    <div style={{ paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
                        <Label style={{ fontSize: 11, color: "#6366F1", textTransform: "uppercase" }}>Font Selection</Label>
                        <FormGroup style={{ marginBottom: 12 }}>
                            <Label>Heading Font</Label>
                            <select
                                value={activeBrand.typography.headingFont}
                                onChange={e => updateTypography("headingFont", e.target.value)}
                                style={inputStyle}
                            >
                                <option value="Inter, sans-serif">Inter</option>
                                <option value="Arial, sans-serif">Arial</option>
                                <option value="'Times New Roman', serif">Times New Roman</option>
                                <option value="Georgia, serif">Georgia</option>
                                <option value="'Montserrat', sans-serif">Montserrat</option>
                                <option value="'Playfair Display', serif">Playfair Display</option>
                            </select>
                        </FormGroup>
                        <FormGroup style={{ marginBottom: 0 }}>
                            <Label>Body Font</Label>
                            <select
                                value={activeBrand.typography.bodyFont}
                                onChange={e => updateTypography("bodyFont", e.target.value)}
                                style={inputStyle}
                            >
                                <option value="Inter, sans-serif">Inter</option>
                                <option value="Arial, sans-serif">Arial</option>
                                <option value="'Times New Roman', serif">Times New Roman</option>
                                <option value="Roboto, sans-serif">Roboto</option>
                                <option value="'Open Sans', sans-serif">Open Sans</option>
                                <option value="'Lato', sans-serif">Lato</option>
                            </select>
                        </FormGroup>
                    </div>

                    {/* Hierarchy & Scale */}
                    <div style={{ paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Label style={{ fontSize: 11, color: "#6366F1", textTransform: "uppercase", margin: 0 }}>Hierarchy & Scale</Label>
                            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={activeBrand.typography.autoScale}
                                    onChange={e => updateTypography("autoScale", e.target.checked)}
                                /> Auto Scale
                            </label>
                        </div>

                        <FormGroup style={{ marginBottom: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <Label style={{ margin: 0 }}>H1 Size: {activeBrand.typography.h1Size}px</Label>
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
                                        updateTypography("h1Size", val);
                                    }
                                }}
                                style={{ width: "100%" }}
                            />
                        </FormGroup>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <FormGroup style={{ marginBottom: 0 }}>
                                <Label>H2 Size</Label>
                                <input type="number" value={activeBrand.typography.h2Size} onChange={e => updateTypography("h2Size", +e.target.value)} style={{ ...inputStyle, padding: "6px 10px" }} />
                            </FormGroup>
                            <FormGroup style={{ marginBottom: 0 }}>
                                <Label>H3 Size</Label>
                                <input type="number" value={activeBrand.typography.h3Size} onChange={e => updateTypography("h3Size", +e.target.value)} style={{ ...inputStyle, padding: "6px 10px" }} />
                            </FormGroup>
                        </div>
                    </div>

                    {/* Readability */}
                    <div style={{ paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
                        <Label style={{ fontSize: 11, color: "#6366F1", textTransform: "uppercase" }}>Readability</Label>
                        <FormGroup style={{ marginBottom: 12 }}>
                            <Label>Line Height: {activeBrand.typography.baseLineHeight}</Label>
                            <input
                                type="range" min="1" max="2.5" step="0.1"
                                value={activeBrand.typography.baseLineHeight}
                                onChange={e => updateTypography("baseLineHeight", parseFloat(e.target.value))}
                                style={{ width: "100%" }}
                            />
                        </FormGroup>
                        <FormGroup style={{ marginBottom: 0 }}>
                            <Label>Letter Spacing: {activeBrand.typography.letterSpacing}px</Label>
                            <input
                                type="range" min="-2" max="10" step="0.5"
                                value={activeBrand.typography.letterSpacing}
                                onChange={e => updateTypography("letterSpacing", parseFloat(e.target.value))}
                                style={{ width: "100%" }}
                            />
                        </FormGroup>
                    </div>

                    {/* Weights & Transform */}
                    <div style={{ paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
                        <Label style={{ fontSize: 11, color: "#6366F1", textTransform: "uppercase" }}>Weights & Style</Label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <FormGroup style={{ marginBottom: 8 }}>
                                <Label>Heading Weight</Label>
                                <select value={activeBrand.typography.headingWeight} onChange={e => updateTypography("headingWeight", e.target.value)} style={inputStyle}>
                                    <option value="normal">Normal</option>
                                    <option value="600">Semibold</option>
                                    <option value="bold">Bold</option>
                                    <option value="900">Black</option>
                                </select>
                            </FormGroup>
                            <FormGroup style={{ marginBottom: 8 }}>
                                <Label>Heading Transform</Label>
                                <select value={activeBrand.typography.headingTransform} onChange={e => updateTypography("headingTransform", e.target.value)} style={inputStyle}>
                                    <option value="none">None</option>
                                    <option value="uppercase">Uppercase</option>
                                    <option value="capitalize">Capitalize</option>
                                </select>
                            </FormGroup>
                        </div>
                        <FormGroup style={{ marginBottom: 0 }}>
                            <Label>Button Text Weight</Label>
                            <select value={activeBrand.typography.buttonWeight} onChange={e => updateTypography("buttonWeight", e.target.value)} style={inputStyle}>
                                <option value="normal">Normal</option>
                                <option value="600">Semibold</option>
                                <option value="bold">Bold</option>
                            </select>
                        </FormGroup>
                    </div>

                    {/* Responsive */}
                    <div>
                        <Label style={{ fontSize: 11, color: "#6366F1", textTransform: "uppercase" }}>Responsive Behavior</Label>
                        <FormGroup style={{ marginBottom: 0 }}>
                            <Label>Mobile Scale Factor: {Math.round(activeBrand.typography.mobileScale * 100)}%</Label>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 10, color: "#94A3B8" }}>0.6x</span>
                                <input
                                    type="range" min="0.6" max="1.0" step="0.05"
                                    value={activeBrand.typography.mobileScale}
                                    onChange={e => updateTypography("mobileScale", parseFloat(e.target.value))}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ fontSize: 10, color: "#94A3B8" }}>1.0x</span>
                            </div>
                            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 8, fontStyle: "italic" }}>
                                Reduces text sizes on mobile devices to prevent overflow.
                            </p>
                        </FormGroup>
                    </div>
                </div>
            )}

            {activeTab === "assets" && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <Label style={{ margin: 0 }}>Brand Assets</Label>
                        <button style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", color: "#4F46E5", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Plus size={12} /> Upload
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                        {activeBrand.assets.map(asset => (
                            <div
                                key={asset.id}
                                style={{ 
                                    background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 8, textAlign: "center", cursor: "pointer", position: "relative"
                                }}
                                onClick={() => {
                                    // In a real impl, this would replace the selected image block URL
                                    alert(`Selected ${asset.name}. This will update your selected image.`);
                                }}
                            >
                                <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, background: "#F8FAFC", borderRadius: 6 }}>
                                    <img src={asset.url} alt={asset.name} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 4 }} />
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{asset.name}</div>
                                <div style={{ fontSize: 9, color: "#94A3B8", textTransform: "uppercase" }}>{asset.type} • {asset.variant}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 20, padding: 12, background: "#F1F5F9", borderRadius: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 4 }}>SMART SUGGESTION</div>
                        <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>When editing a <b>Header</b>, your Primary Logo will be prioritized here.</p>
                    </div>
                </div>
            )}

            {activeTab === "components" && (
                <div>
                    <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: 12, border: "1px dashed #CBD5E1", textAlign: "center", marginBottom: 16 }}>
                        <LayoutTemplate size={20} color="#94A3B8" style={{ marginBottom: 8 }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Reusable Blocks</div>
                        <p style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>Select a block on the canvas to save it to your brand library.</p>
                    </div>

                    <Label style={{ fontSize: 12 }}>Your Saved Components</Label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {activeBrand.components.length === 0 ? (
                            <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic", textAlign: "center", padding: 20 }}>No components saved yet.</div>
                        ) : (
                            activeBrand.components.map(comp => (
                                <div key={comp.id} style={{
                                    background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 12
                                }}>
                                    <div style={{ width: 40, height: 40, background: "#F1F5F9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <LayoutTemplate size={16} color="#6366F1" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{comp.name}</div>
                                        <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase" }}>{comp.category} {comp.isLocked && "• Locked"}</div>
                                    </div>
                                    <button style={{ padding: "4px 8px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>Insert</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === "guidelines" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ padding: 16, background: "#EEF2FF", borderRadius: 12, border: "1px solid #C7D2FE" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 18, height: 18, background: "#4F46E5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10 }}>
                                <Check size={10} />
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#4338CA" }}>Brand Voice: {activeBrand.guidelines.tone.name}</div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {activeBrand.guidelines.tone.rules.map((rule, i) => (
                                <span key={i} style={{ padding: "2px 8px", background: "#fff", border: "1px solid #C7D2FE", borderRadius: 10, fontSize: 10, color: "#4F46E5", fontWeight: 600 }}>{rule}</span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label style={{ fontSize: 11, color: "#6366F1", textTransform: "uppercase" }}>Design Rules</Label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {activeBrand.guidelines.designRules.map((r, i) => (
                                <div key={i} style={{ display: "flex", gap: 10, padding: 10, background: "#fff", border: "1px solid #F1F5F9", borderRadius: 8 }}>
                                    <div style={{ color: r.severity === "error" ? "#EF4444" : "#F59E0B" }}>
                                        <Settings size={14} />
                                    </div>
                                    <div style={{ fontSize: 11, color: "#475569", fontWeight: 500 }}>{r.rule}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <FormGroup style={{ marginBottom: 0 }}>
                        <Label>Special Instructions</Label>
                        <textarea
                            value={activeBrand.guidelines.instructions}
                            readOnly
                            style={{ ...inputStyle, minHeight: 80, fontSize: 11, color: "#64748B", background: "#F8FAFC", cursor: "default" }}
                        />
                    </FormGroup>
                </div>
            )}
        </div>
    );
};

// ── TYPES ──────────────────────────────────────────────────────────────────
export type BlockType = "text" | "image" | "button" | "divider" | "spacer" | "social" | "hero" | "footer" | "shape" | "line" | "floating-text" | "floating-image" | "layout" | "rating" | "countdown" | "html";

export interface DesignBlock { id: string; type: BlockType; props: Record<string, any>; }
export interface DesignTheme { 
    background: string; 
    contentWidth: number; 
    fontFamily: string; 
    primaryColor: string; 
    borderRadius: number;
    paragraphColor: string;
}

export interface TemplateSettings {
    general: { name: string; description: string; category: string; tags: string[] };
    responsive: { desktop: boolean; tablet: boolean; mobile: boolean; breakpoints: { tablet: number; mobile: number }; stackOnMobile: boolean };
    actions: { url: string; target: "_blank" | "_self"; actionType: string };
    variables: { name: string; defaultValue: string }[];
    email: { subject: string; preheader: string; senderName: string; senderEmail: string; unsubscribeUrl: string };
    permissions: { locked: boolean; editable: boolean };
    global: { primaryColor: string; secondaryColor: string; fontFamily: string; darkMode: boolean };
    analytics: { trackingCode: string; enableTracking: boolean };
    advanced: { autoSave: boolean };
}

export interface DesignJSON { 
    theme: DesignTheme; 
    settings: TemplateSettings;
    headerBlocks: DesignBlock[];
    bodyBlocks: DesignBlock[];
    footerBlocks: DesignBlock[];
}

export interface SelectedNode { type: "block"; id: string; }

// ── DEFAULTS ───────────────────────────────────────────────────────────────
export const DEFAULT_THEME: DesignTheme = {
    background: "#f8f9fb", contentWidth: 600,
    fontFamily: "'Inter', Arial, sans-serif", primaryColor: "#6366F1",
    borderRadius: 8, paragraphColor: "#475569",
};

export const DEFAULT_SETTINGS: TemplateSettings = {
    general: { name: "Untitled Template", description: "", category: "Email", tags: [] },
    responsive: { desktop: true, tablet: true, mobile: true, breakpoints: { tablet: 768, mobile: 480 }, stackOnMobile: true },
    actions: { url: "", target: "_blank", actionType: "none" },
    variables: [],
    email: { subject: "", preheader: "", senderName: "", senderEmail: "", unsubscribeUrl: "" },
    permissions: { locked: false, editable: true },
    global: { primaryColor: "#6366F1", secondaryColor: "#94A3B8", fontFamily: "'Inter', Arial, sans-serif", darkMode: false },
    analytics: { trackingCode: "", enableTracking: false },
    advanced: { autoSave: true },
};

export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// ── BLOCK REGISTRY ─────────────────────────────────────────────────────────
export const BLOCK_DEFAULTS: Record<BlockType, { label: string; defaults: Record<string, any> }> = {
    text: { label: "Text", defaults: { content: "", fontSize: 16, align: "left", color: "#475569", fontWeight: "normal", lineHeight: 1.6, letterSpacing: 0 } },
    image: { label: "Image", defaults: { src: "https://placehold.co/540x200/e2e8f0/94a3b8?text=Your+Image", alt: "Image", align: "center", width: "100%", linkUrl: "", borderRadius: 8, shadow: 0, shadowColor: "rgba(0,0,0,0.1)" } },
    button: { label: "Button", defaults: { text: "Click Here →", url: "#", backgroundColor: "#6366F1", color: "#ffffff", align: "center", borderRadius: 8, paddingV: 14, paddingH: 28, lineHeight: 1, letterSpacing: 1, shadow: 0, shadowColor: "rgba(0,0,0,0.2)" } },
    divider: { label: "Divider", defaults: { color: "#E5E7EB", thickness: 1 } },
    spacer: { label: "Spacer", defaults: { height: 32 } },
    social: { label: "Social", defaults: { align: "center", icons: [{ platform: "facebook", url: "#" }, { platform: "instagram", url: "#" }, { platform: "twitter", url: "#" }, { platform: "linkedin", url: "#" }] } },
    hero: { label: "Hero", defaults: { headline: "Big Announcement!", subheadline: "Something amazing is coming.", bgColor: "#6366F1", textColor: "#ffffff", lineHeight: 1.4, letterSpacing: 0 } },
    footer: { label: "Footer", defaults: { content: "© 2026 Company · Unsubscribe", fontSize: 12, color: "#9CA3AF", align: "center", lineHeight: 1.5, letterSpacing: 0 } },
    shape: { label: "Shape", defaults: { shapeType: "rect", backgroundColor: "#6366F1", borderColor: "transparent", borderWidth: 0, width: 100, height: 100, borderRadius: 0, align: "center", shadow: 0, shadowColor: "rgba(0,0,0,0.1)" } },
    line: { label: "Line", defaults: { lineType: "solid", color: "#475569", thickness: 2, width: "100%", align: "center", paddingTop: 10, paddingBottom: 10 } },
    "floating-text": { label: "Floating Text", defaults: { content: "I'm a floating box!", fontSize: 16, color: "#475569", x: 100, y: 100, width: 200, padding: 12, backgroundColor: "transparent", borderRadius: 8, borderColor: "#6366F1", borderWidth: 2, lineHeight: 1.5, shadow: 0 } },
    "floating-image": { label: "Floating Image", defaults: { src: "https://placehold.co/200x200/e2e8f0/94a3b8?text=Floating+Image", alt: "Image", x: 150, y: 150, width: 200, padding: 0, borderRadius: 0, borderColor: "transparent", borderWidth: 0, shadow: 0 } },
    layout: { label: "Layout Row", defaults: { layoutType: "2-col", columns: [{ blocks: [] }, { blocks: [] }], padding: 20, gap: 20 } },
    rating: { label: "Rating", defaults: { count: 5, color: "#FFD700", align: "center" } },
    countdown: { label: "Countdown", defaults: { endTime: "", color: "#334155", align: "center" } },
    html: { label: "HTML", defaults: { content: "<div>Custom HTML</div>" } },
};

// ── BRAND KIT TYPES ────────────────────────────────────────────────────────
export interface BrandColor {
    id: string;
    name: string;
    hex: string;
    group: "Primary" | "Secondary" | "Accent";
}

export interface BrandTypography {
    headingFont: string;
    bodyFont: string;
    h1Size: number;
    h2Size: number;
    h3Size: number;
    bodySize: number;
    smallSize: number;
    headingWeight: string | number;
    bodyWeight: string | number;
    buttonWeight: string | number;
    headingTransform: "none" | "uppercase" | "capitalize" | "lowercase";
    buttonTransform: "none" | "uppercase" | "capitalize" | "lowercase";
    baseLineHeight: number;
    letterSpacing: number;
    paragraphSpacing: number;
    mobileScale: number;
    autoScale: boolean;
}

export interface BrandAsset {
    id: string;
    type: "logo" | "icon" | "image" | "illustration" | "badge";
    variant: "light" | "dark" | "primary" | "secondary" | "accent" | "social" | "success" | "warning" | "illustration" | "badge";
    url: string;
    name: string;
    suggestedFor?: string[];
}

export interface BrandComponent {
    id: string;
    name: string;
    category: "header" | "footer" | "hero" | "cta" | "product" | "custom" | "body" | "testimonial";
    block: DesignBlock;
    isLocked?: boolean;
}

export interface BrandGuidelines {
    description: string;
    tone: {
        name: string;
        rules: string[];
    };
    designRules: {
        rule: string;
        severity: "warning" | "error";
    }[];
    instructions: string;
}

export interface BrandKit {
    id: string;
    name: string;
    colors: BrandColor[];
    typography: BrandTypography;
    assets: BrandAsset[];
    components: BrandComponent[];
    guidelines: BrandGuidelines;
}

export const DEFAULT_BRAND_KITS: BrandKit[] = [
    {
        id: "brand-1",
        name: "Acme Corp",
        colors: [
            { id: "c1", name: "Acme Blue", hex: "#2563EB", group: "Primary" },
            { id: "c2", name: "Acme Dark", hex: "#0F172A", group: "Secondary" },
            { id: "c3", name: "Acme Pink", hex: "#EC4899", group: "Accent" }
        ],
        typography: { 
            headingFont: "Inter, sans-serif", 
            bodyFont: "Inter, sans-serif", 
            h1Size: 32, 
            h2Size: 24, 
            h3Size: 20, 
            bodySize: 16,
            smallSize: 12,
            headingWeight: "bold",
            bodyWeight: "normal",
            buttonWeight: "bold",
            headingTransform: "none",
            buttonTransform: "none",
            baseLineHeight: 1.6,
            letterSpacing: 0,
            paragraphSpacing: 16,
            mobileScale: 0.85,
            autoScale: true
        },
        assets: [
            { id: "a1", name: "Main Logo", url: "https://api.dicebear.com/7.x/initials/svg?seed=Brand", type: "logo", variant: "primary", suggestedFor: ["header"] },
            { id: "a2", name: "Icon Mark", url: "https://api.dicebear.com/7.x/shapes/svg?seed=icon", type: "icon", variant: "primary", suggestedFor: ["footer"] },
            { id: "a3", name: "Facebook Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=facebook", type: "icon", variant: "social", suggestedFor: ["footer"] },
            { id: "a4", name: "Instagram Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=instagram", type: "icon", variant: "social", suggestedFor: ["footer"] },
            { id: "a5", name: "Twitter Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=twitter", type: "icon", variant: "social", suggestedFor: ["footer"] },
            { id: "a6", name: "LinkedIn Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=linkedin", type: "icon", variant: "social", suggestedFor: ["footer"] },
            { id: "a7", name: "YouTube Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=youtube", type: "icon", variant: "social", suggestedFor: ["footer"] },
            { id: "a8", name: "Product Hero 1", url: "https://api.dicebear.com/7.x/shapes/svg?seed=p1", type: "image", variant: "primary", suggestedFor: ["hero"] },
            { id: "a9", name: "Product Hero 2", url: "https://api.dicebear.com/7.x/shapes/svg?seed=p2", type: "image", variant: "secondary", suggestedFor: ["hero"] },
            { id: "a10", name: "Divider Pattern", url: "https://api.dicebear.com/7.x/identicon/svg?seed=div", type: "icon", variant: "secondary", suggestedFor: ["body"] },
            { id: "a11", name: "Checkmark Green", url: "https://api.dicebear.com/7.x/icons/svg?seed=check&backgroundColor=22c55e", type: "icon", variant: "success", suggestedFor: ["body"] },
            { id: "a12", name: "Warning Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=warn&backgroundColor=f59e0b", type: "icon", variant: "warning", suggestedFor: ["body"] },
            { id: "a13", name: "Profile Placeholder", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=user", type: "image", variant: "primary", suggestedFor: ["body"] },
            { id: "a14", name: "Abstract Illustration", url: "https://api.dicebear.com/7.x/shapes/svg?seed=art", type: "image", variant: "illustration", suggestedFor: ["hero"] },
            { id: "a15", name: "App Store Badge", url: "https://api.dicebear.com/7.x/icons/svg?seed=apple", type: "icon", variant: "badge", suggestedFor: ["footer"] },
            { id: "a16", name: "Play Store Badge", url: "https://api.dicebear.com/7.x/icons/svg?seed=google", type: "icon", variant: "badge", suggestedFor: ["footer"] },
            { id: "a17", name: "Email Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=mail", type: "icon", variant: "primary", suggestedFor: ["footer"] },
            { id: "a18", name: "Phone Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=phone", type: "icon", variant: "primary", suggestedFor: ["footer"] },
            { id: "a19", name: "Location Pin", url: "https://api.dicebear.com/7.x/icons/svg?seed=map", type: "icon", variant: "primary", suggestedFor: ["footer"] },
            { id: "a20", name: "Quote Mark", url: "https://api.dicebear.com/7.x/icons/svg?seed=quote", type: "icon", variant: "accent", suggestedFor: ["body"] },
            { id: "a21", name: "Sale Badge", url: "https://api.dicebear.com/7.x/shapes/svg?seed=sale", type: "icon", variant: "accent", suggestedFor: ["hero"] },
            { id: "a22", name: "Star Rating", url: "https://api.dicebear.com/7.x/icons/svg?seed=star", type: "icon", variant: "warning", suggestedFor: ["body"] }
        ],
        components: [
            { 
                id: "c1", name: "Modern Header", category: "header", isLocked: false,
                block: { id: "b1", type: "layout", props: { layoutType: "1-col", columns: [{ blocks: [{ id: "i1", type: "image", props: { src: "https://api.dicebear.com/7.x/initials/svg?seed=Brand", width: "120px", align: "center" } }] }] } }
            },
            { 
                id: "c2", name: "Hero CTA", category: "hero", isLocked: false,
                block: { id: "b2", type: "layout", props: { layoutType: "1-col", columns: [{ blocks: [
                    { id: "i2", type: "image", props: { src: "https://api.dicebear.com/7.x/shapes/svg?seed=hero", width: "100%", align: "center" } },
                    { id: "t1", type: "text", props: { content: "<h1>Unlock Your Potential</h1>", fontSize: 32, align: "center" } },
                    { id: "btn1", type: "button", props: { text: "Get Started", buttonStyle: "primary", align: "center" } }
                ] }] } }
            },
            { 
                id: "c3", name: "Product Feature", category: "product", isLocked: false,
                block: { id: "b3", type: "layout", props: { layoutType: "2-col", columns: [
                    { blocks: [{ id: "i3", type: "image", props: { src: "https://api.dicebear.com/7.x/shapes/svg?seed=feature", width: "100%", align: "center" } }] },
                    { blocks: [{ id: "t2", type: "text", props: { content: "<h3>Premium Quality</h3><p>Built for performance and reliability.</p>", fontSize: 16, align: "left" } }] }
                ] } }
            },
            { 
                id: "c4", name: "Customer Quote", category: "testimonial", isLocked: true,
                block: { id: "b4", type: "layout", props: { layoutType: "1-col", columns: [{ blocks: [
                    { id: "t3", type: "text", props: { content: "<p><i>\"This system transformed our workflow entirely.\"</i></p>", fontSize: 18, align: "center", color: "#6366F1" } },
                    { id: "t4", type: "text", props: { content: "<b>— Jane Doe, CEO</b>", fontSize: 14, align: "center" } }
                ] }] } }
            },
            { 
                id: "c5", name: "Social Footer", category: "footer", isLocked: false,
                block: { id: "b5", type: "layout", props: { layoutType: "1-col", columns: [{ blocks: [
                    { id: "s1", type: "social", props: { icons: [{ platform: "facebook", url: "#" }, { platform: "twitter", url: "#" }, { platform: "linkedin", url: "#" }], align: "center" } },
                    { id: "t5", type: "text", props: { content: "<p>© 2024 Your Brand. All rights reserved.</p>", fontSize: 12, align: "center", color: "#94A3B8" } }
                ] }] } }
            }
        ],
        guidelines: { 
            description: "Modern and professional.", 
            tone: { name: "Professional", rules: ["No slang", "Direct voice"] },
            designRules: [
                { rule: "Max 1 H1 headline", severity: "error" }
            ],
            instructions: "Always use Acme Blue for primary CTAs." 
        }
    },
    // ── Nova Startup ──────────────────────────────────────────────────────────
    {
        id: "brand-2", name: "Nova Startup",
        colors: [
            { id: "b2-c1", name: "Nova Violet", hex: "#7C3AED", group: "Primary" },
            { id: "b2-c2", name: "Nova Dark", hex: "#1E1B4B", group: "Secondary" },
            { id: "b2-c3", name: "Nova Lime", hex: "#84CC16", group: "Accent" }
        ],
        typography: { headingFont: "'Poppins', sans-serif", bodyFont: "'Poppins', sans-serif", h1Size: 36, h2Size: 26, h3Size: 20, bodySize: 16, smallSize: 12, headingWeight: "bold", bodyWeight: "normal", buttonWeight: "bold", headingTransform: "none", buttonTransform: "uppercase", baseLineHeight: 1.5, letterSpacing: 0.5, paragraphSpacing: 16, mobileScale: 0.85, autoScale: true },
        assets: [
            { id: "b2-a1", name: "Nova Logo", url: "https://api.dicebear.com/7.x/initials/svg?seed=Nova", type: "logo", variant: "primary", suggestedFor: ["header"] },
            { id: "b2-a2", name: "Icon Mark", url: "https://api.dicebear.com/7.x/shapes/svg?seed=nova", type: "icon", variant: "primary", suggestedFor: ["footer"] }
        ],
        components: [
            { id: "b2-comp1", name: "Startup Header", category: "header", isLocked: false, block: { id: "b2-b1", type: "hero", props: { headline: "Build Something Great", subheadline: "Nova helps startups ship faster.", bgColor: "#7C3AED", textColor: "#ffffff" } } }
        ],
        guidelines: { description: "Bold and energetic startup brand.", tone: { name: "Energetic", rules: ["Use action verbs", "Be concise", "Inspire urgency"] }, designRules: [{ rule: "Always use violet for primary CTAs", severity: "error" }], instructions: "Uppercase button text. Keep headlines punchy." }
    },
    // ── Classic Bank ──────────────────────────────────────────────────────────
    {
        id: "brand-3", name: "Classic Bank",
        colors: [
            { id: "b3-c1", name: "Navy Blue", hex: "#1E3A5F", group: "Primary" },
            { id: "b3-c2", name: "Steel Gray", hex: "#475569", group: "Secondary" },
            { id: "b3-c3", name: "Gold", hex: "#B8860B", group: "Accent" }
        ],
        typography: { headingFont: "Georgia, serif", bodyFont: "'Times New Roman', serif", h1Size: 30, h2Size: 22, h3Size: 18, bodySize: 15, smallSize: 11, headingWeight: "bold", bodyWeight: "normal", buttonWeight: "bold", headingTransform: "none", buttonTransform: "none", baseLineHeight: 1.7, letterSpacing: 0.3, paragraphSpacing: 18, mobileScale: 0.9, autoScale: false },
        assets: [
            { id: "b3-a1", name: "Bank Logo", url: "https://api.dicebear.com/7.x/initials/svg?seed=Bank", type: "logo", variant: "primary", suggestedFor: ["header"] },
            { id: "b3-a2", name: "Shield Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=shield", type: "icon", variant: "primary", suggestedFor: ["body"] }
        ],
        components: [
            { id: "b3-comp1", name: "Bank Header", category: "header", isLocked: true, block: { id: "b3-b1", type: "hero", props: { headline: "Your Trusted Financial Partner", subheadline: "Security. Stability. Trust.", bgColor: "#1E3A5F", textColor: "#ffffff" } } }
        ],
        guidelines: { description: "Formal, trustworthy financial brand.", tone: { name: "Formal", rules: ["No slang", "Use full sentences", "Avoid exclamation marks"] }, designRules: [{ rule: "Never use bright colors for CTAs", severity: "warning" }], instructions: "Use navy for all primary elements. Gold only for accents." }
    },
    // ── Fresh Market ──────────────────────────────────────────────────────────
    {
        id: "brand-4", name: "Fresh Market",
        colors: [
            { id: "b4-c1", name: "Forest Green", hex: "#16A34A", group: "Primary" },
            { id: "b4-c2", name: "Earthy Brown", hex: "#78350F", group: "Secondary" },
            { id: "b4-c3", name: "Sunny Yellow", hex: "#FACC15", group: "Accent" }
        ],
        typography: { headingFont: "'Lato', sans-serif", bodyFont: "'Lato', sans-serif", h1Size: 34, h2Size: 24, h3Size: 19, bodySize: 16, smallSize: 12, headingWeight: "bold", bodyWeight: "normal", buttonWeight: "600", headingTransform: "none", buttonTransform: "none", baseLineHeight: 1.65, letterSpacing: 0, paragraphSpacing: 16, mobileScale: 0.85, autoScale: true },
        assets: [
            { id: "b4-a1", name: "Market Logo", url: "https://api.dicebear.com/7.x/initials/svg?seed=Fresh", type: "logo", variant: "primary", suggestedFor: ["header"] },
            { id: "b4-a2", name: "Leaf Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=leaf", type: "icon", variant: "primary", suggestedFor: ["body"] }
        ],
        components: [
            { id: "b4-comp1", name: "Market Hero", category: "hero", isLocked: false, block: { id: "b4-b1", type: "hero", props: { headline: "Farm Fresh, Delivered Daily", subheadline: "Organic produce straight to your door.", bgColor: "#16A34A", textColor: "#ffffff" } } }
        ],
        guidelines: { description: "Natural, organic, health-focused brand.", tone: { name: "Warm", rules: ["Be friendly", "Emphasize freshness", "Use natural language"] }, designRules: [{ rule: "Use green for all CTAs", severity: "error" }], instructions: "Keep imagery bright and natural. Avoid dark backgrounds." }
    },
    // ── Luxe Fashion ──────────────────────────────────────────────────────────
    {
        id: "brand-5", name: "Luxe Fashion",
        colors: [
            { id: "b5-c1", name: "Jet Black", hex: "#0F0F0F", group: "Primary" },
            { id: "b5-c2", name: "Warm White", hex: "#FAF7F5", group: "Secondary" },
            { id: "b5-c3", name: "Rose Gold", hex: "#C9967C", group: "Accent" }
        ],
        typography: { headingFont: "'Playfair Display', serif", bodyFont: "Georgia, serif", h1Size: 40, h2Size: 28, h3Size: 20, bodySize: 15, smallSize: 11, headingWeight: "normal", bodyWeight: "normal", buttonWeight: "normal", headingTransform: "none", buttonTransform: "uppercase", baseLineHeight: 1.8, letterSpacing: 2, paragraphSpacing: 20, mobileScale: 0.9, autoScale: false },
        assets: [
            { id: "b5-a1", name: "Luxe Logo", url: "https://api.dicebear.com/7.x/initials/svg?seed=Luxe", type: "logo", variant: "dark", suggestedFor: ["header"] },
            { id: "b5-a2", name: "Monogram", url: "https://api.dicebear.com/7.x/shapes/svg?seed=luxe", type: "icon", variant: "primary", suggestedFor: ["footer"] }
        ],
        components: [
            { id: "b5-comp1", name: "Fashion Hero", category: "hero", isLocked: false, block: { id: "b5-b1", type: "hero", props: { headline: "Refined. Elegant. Timeless.", subheadline: "The new collection has arrived.", bgColor: "#0F0F0F", textColor: "#FAF7F5" } } }
        ],
        guidelines: { description: "Ultra-premium fashion and lifestyle brand.", tone: { name: "Elegant", rules: ["Minimal words", "Evoke aspiration", "No exclamation marks"] }, designRules: [{ rule: "Max 2 font sizes per email", severity: "warning" }, { rule: "No bright colors", severity: "error" }], instructions: "Generous white space. Let the product breathe." }
    },
    // ── Tech Forge ────────────────────────────────────────────────────────────
    {
        id: "brand-6", name: "Tech Forge",
        colors: [
            { id: "b6-c1", name: "Cyber Cyan", hex: "#0EA5E9", group: "Primary" },
            { id: "b6-c2", name: "Dark Slate", hex: "#0F172A", group: "Secondary" },
            { id: "b6-c3", name: "Electric Green", hex: "#22C55E", group: "Accent" }
        ],
        typography: { headingFont: "'Roboto Mono', monospace", bodyFont: "Roboto, sans-serif", h1Size: 32, h2Size: 24, h3Size: 18, bodySize: 15, smallSize: 11, headingWeight: "bold", bodyWeight: "normal", buttonWeight: "bold", headingTransform: "uppercase", buttonTransform: "uppercase", baseLineHeight: 1.5, letterSpacing: 1, paragraphSpacing: 16, mobileScale: 0.85, autoScale: true },
        assets: [
            { id: "b6-a1", name: "Tech Logo", url: "https://api.dicebear.com/7.x/initials/svg?seed=TechForge", type: "logo", variant: "dark", suggestedFor: ["header"] },
            { id: "b6-a2", name: "Circuit Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=cpu", type: "icon", variant: "primary", suggestedFor: ["body"] }
        ],
        components: [
            { id: "b6-comp1", name: "Tech Hero", category: "hero", isLocked: false, block: { id: "b6-b1", type: "hero", props: { headline: "FORGE THE FUTURE", subheadline: "Developer tools built for performance.", bgColor: "#0F172A", textColor: "#0EA5E9" } } }
        ],
        guidelines: { description: "Dark, powerful, developer-focused tech brand.", tone: { name: "Technical", rules: ["Be precise", "Use data", "Avoid fluff"] }, designRules: [{ rule: "Dark backgrounds preferred", severity: "warning" }], instructions: "Uppercase headings. Monospace font for all headlines." }
    },
    // ── Sunset Agency ─────────────────────────────────────────────────────────
    {
        id: "brand-7", name: "Sunset Agency",
        colors: [
            { id: "b7-c1", name: "Sunset Orange", hex: "#F97316", group: "Primary" },
            { id: "b7-c2", name: "Deep Plum", hex: "#581C87", group: "Secondary" },
            { id: "b7-c3", name: "Coral Pink", hex: "#FB7185", group: "Accent" }
        ],
        typography: { headingFont: "'Montserrat', sans-serif", bodyFont: "'Montserrat', sans-serif", h1Size: 38, h2Size: 26, h3Size: 20, bodySize: 16, smallSize: 12, headingWeight: "bold", bodyWeight: "normal", buttonWeight: "bold", headingTransform: "none", buttonTransform: "none", baseLineHeight: 1.6, letterSpacing: -0.5, paragraphSpacing: 16, mobileScale: 0.85, autoScale: true },
        assets: [
            { id: "b7-a1", name: "Agency Logo", url: "https://api.dicebear.com/7.x/initials/svg?seed=Sunset", type: "logo", variant: "primary", suggestedFor: ["header"] },
            { id: "b7-a2", name: "Creative Icon", url: "https://api.dicebear.com/7.x/shapes/svg?seed=sunset", type: "icon", variant: "accent", suggestedFor: ["body"] }
        ],
        components: [
            { id: "b7-comp1", name: "Agency Hero", category: "hero", isLocked: false, block: { id: "b7-b1", type: "hero", props: { headline: "We Create. We Inspire.", subheadline: "Award-winning creative agency.", bgColor: "#F97316", textColor: "#ffffff" } } }
        ],
        guidelines: { description: "Warm, vibrant, creative agency brand.", tone: { name: "Creative", rules: ["Be expressive", "Tell a story", "Use vivid language"] }, designRules: [{ rule: "Use gradient-inspired color pairings", severity: "warning" }], instructions: "Orange for CTAs. Plum for backgrounds. Keep energy high." }
    },
    // ── Health Plus ───────────────────────────────────────────────────────────
    {
        id: "brand-8", name: "Health Plus",
        colors: [
            { id: "b8-c1", name: "Teal", hex: "#0D9488", group: "Primary" },
            { id: "b8-c2", name: "Soft Blue", hex: "#BFDBFE", group: "Secondary" },
            { id: "b8-c3", name: "Mint Green", hex: "#6EE7B7", group: "Accent" }
        ],
        typography: { headingFont: "'Open Sans', sans-serif", bodyFont: "'Open Sans', sans-serif", h1Size: 30, h2Size: 22, h3Size: 18, bodySize: 16, smallSize: 12, headingWeight: "600", bodyWeight: "normal", buttonWeight: "600", headingTransform: "none", buttonTransform: "none", baseLineHeight: 1.7, letterSpacing: 0, paragraphSpacing: 18, mobileScale: 0.9, autoScale: true },
        assets: [
            { id: "b8-a1", name: "Health Logo", url: "https://api.dicebear.com/7.x/initials/svg?seed=Health", type: "logo", variant: "primary", suggestedFor: ["header"] },
            { id: "b8-a2", name: "Heart Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=heart", type: "icon", variant: "primary", suggestedFor: ["body"] }
        ],
        components: [
            { id: "b8-comp1", name: "Health Hero", category: "hero", isLocked: false, block: { id: "b8-b1", type: "hero", props: { headline: "Your Health, Our Priority", subheadline: "Evidence-based care at your fingertips.", bgColor: "#0D9488", textColor: "#ffffff" } } }
        ],
        guidelines: { description: "Clean, calm, medical and wellness brand.", tone: { name: "Caring", rules: ["Be empathetic", "Use plain language", "Avoid medical jargon"] }, designRules: [{ rule: "Always use sufficient color contrast", severity: "error" }], instructions: "Teal for all CTAs. Keep layouts open and breathable." }
    },
    // ── Edu Learn ─────────────────────────────────────────────────────────────
    {
        id: "brand-9", name: "Edu Learn",
        colors: [
            { id: "b9-c1", name: "Study Purple", hex: "#8B5CF6", group: "Primary" },
            { id: "b9-c2", name: "Deep Navy", hex: "#1E1B4B", group: "Secondary" },
            { id: "b9-c3", name: "Bright Amber", hex: "#F59E0B", group: "Accent" }
        ],
        typography: { headingFont: "Inter, sans-serif", bodyFont: "Inter, sans-serif", h1Size: 32, h2Size: 24, h3Size: 18, bodySize: 16, smallSize: 12, headingWeight: "bold", bodyWeight: "normal", buttonWeight: "bold", headingTransform: "none", buttonTransform: "none", baseLineHeight: 1.65, letterSpacing: 0, paragraphSpacing: 16, mobileScale: 0.85, autoScale: true },
        assets: [
            { id: "b9-a1", name: "Edu Logo", url: "https://api.dicebear.com/7.x/initials/svg?seed=Edu", type: "logo", variant: "primary", suggestedFor: ["header"] },
            { id: "b9-a2", name: "Book Icon", url: "https://api.dicebear.com/7.x/icons/svg?seed=book", type: "icon", variant: "primary", suggestedFor: ["body"] }
        ],
        components: [
            { id: "b9-comp1", name: "Course Hero", category: "hero", isLocked: false, block: { id: "b9-b1", type: "hero", props: { headline: "Learn Something New Today", subheadline: "Expert-led courses for every skill level.", bgColor: "#8B5CF6", textColor: "#ffffff" } } }
        ],
        guidelines: { description: "Friendly, approachable education brand.", tone: { name: "Encouraging", rules: ["Be motivating", "Keep it simple", "Celebrate progress"] }, designRules: [{ rule: "Use amber sparingly for highlights only", severity: "warning" }], instructions: "Purple for primary CTAs. Amber for badges and highlights." }
    },
    // ── Minimal Studio ────────────────────────────────────────────────────────
    {
        id: "brand-10", name: "Minimal Studio",
        colors: [
            { id: "b10-c1", name: "Near Black", hex: "#18181B", group: "Primary" },
            { id: "b10-c2", name: "Light Gray", hex: "#F4F4F5", group: "Secondary" },
            { id: "b10-c3", name: "Pure White", hex: "#FFFFFF", group: "Accent" }
        ],
        typography: { headingFont: "Inter, sans-serif", bodyFont: "Inter, sans-serif", h1Size: 36, h2Size: 24, h3Size: 18, bodySize: 15, smallSize: 11, headingWeight: "300", bodyWeight: "normal", buttonWeight: "normal", headingTransform: "none", buttonTransform: "none", baseLineHeight: 1.8, letterSpacing: 1, paragraphSpacing: 20, mobileScale: 0.9, autoScale: false },
        assets: [
            { id: "b10-a1", name: "Studio Logo", url: "https://api.dicebear.com/7.x/initials/svg?seed=Minimal", type: "logo", variant: "dark", suggestedFor: ["header"] },
            { id: "b10-a2", name: "Dot Mark", url: "https://api.dicebear.com/7.x/shapes/svg?seed=minimal", type: "icon", variant: "primary", suggestedFor: ["footer"] }
        ],
        components: [
            { id: "b10-comp1", name: "Minimal Hero", category: "hero", isLocked: false, block: { id: "b10-b1", type: "hero", props: { headline: "Less is More.", subheadline: "Design with intention.", bgColor: "#18181B", textColor: "#FFFFFF" } } }
        ],
        guidelines: { description: "Ultra-minimal design studio brand.", tone: { name: "Refined", rules: ["Use fewer words", "No decoration without purpose", "Silence is design"] }, designRules: [{ rule: "Max 2 visual elements per section", severity: "error" }, { rule: "No gradients", severity: "warning" }], instructions: "Near-black everything. Generous white space. Light font weight." }
    }
];

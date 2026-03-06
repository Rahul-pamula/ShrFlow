export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  compiledHtml?: string;
  design?: any;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start from scratch with a clean slate.",
    category: "general",
  },
  {
    id: "ecommerce-flash-sale",
    name: "Flash Sale Newsletter",
    description: "Product showcase with hero, 2-column grid, social icons, and footer.",
    category: "ecommerce",
    design: {
      theme: { background: "#f3f4f6", contentWidth: 600, fontFamily: "Arial, sans-serif", primaryColor: "#4f46e5" },
      rows: [
        {
          id: "row-hero", settings: { backgroundColor: "#111827", paddingTop: 40, paddingBottom: 40 },
          columns: [{
            id: "col-hero", width: 100, blocks: [
              { id: "hero-title", type: "text", props: { content: "🔥 Midnight Flash Sale", fontSize: 32, color: "#ffffff", align: "center" } },
              { id: "hero-subtitle", type: "text", props: { content: "Up to 50% OFF for the next 24 hours", fontSize: 18, color: "#d1d5db", align: "center" } },
              { id: "hero-button", type: "button", props: { text: "Shop Now", url: "https://yourstore.com", backgroundColor: "#4f46e5", color: "#ffffff", align: "center", borderRadius: 6, padding: 12 } },
            ]
          }],
        },
        {
          id: "row-divider", settings: { backgroundColor: "#ffffff", paddingTop: 20, paddingBottom: 20 },
          columns: [{
            id: "col-divider", width: 100, blocks: [
              { id: "divider-1", type: "divider", props: { color: "#e5e7eb", thickness: 1 } },
            ]
          }],
        },
        {
          id: "row-products", settings: { backgroundColor: "#ffffff", paddingTop: 20, paddingBottom: 40 },
          columns: [
            {
              id: "col-p1", width: 50, blocks: [
                { id: "p-img-1", type: "image", props: { src: "https://via.placeholder.com/250x200/e2e8f0/4f46e5?text=Product+1", alt: "Product 1", align: "center" } },
                { id: "p-title-1", type: "text", props: { content: "Premium Sneakers", fontSize: 18, align: "center" } },
                { id: "p-price-1", type: "text", props: { content: "$79.99", fontSize: 16, color: "#4f46e5", align: "center" } },
                { id: "p-btn-1", type: "button", props: { text: "Buy Now", url: "#", backgroundColor: "#111827", color: "#ffffff", align: "center", borderRadius: 4, padding: 10 } },
              ]
            },
            {
              id: "col-p2", width: 50, blocks: [
                { id: "p-img-2", type: "image", props: { src: "https://via.placeholder.com/250x200/e2e8f0/4f46e5?text=Product+2", alt: "Product 2", align: "center" } },
                { id: "p-title-2", type: "text", props: { content: "Smart Watch", fontSize: 18, align: "center" } },
                { id: "p-price-2", type: "text", props: { content: "$129.99", fontSize: 16, color: "#4f46e5", align: "center" } },
                { id: "p-btn-2", type: "button", props: { text: "Buy Now", url: "#", backgroundColor: "#111827", color: "#ffffff", align: "center", borderRadius: 4, padding: 10 } },
              ]
            },
          ],
        },
        {
          id: "row-social", settings: { backgroundColor: "#f9fafb", paddingTop: 30, paddingBottom: 30 },
          columns: [{
            id: "col-social", width: 100, blocks: [
              { id: "social-title", type: "text", props: { content: "Follow Us", fontSize: 16, align: "center" } },
              { id: "social-icons", type: "social", props: { align: "center", icons: [{ platform: "twitter", url: "#" }, { platform: "facebook", url: "#" }, { platform: "instagram", url: "#" }] } },
            ]
          }],
        },
        {
          id: "row-footer", settings: { backgroundColor: "#111827", paddingTop: 20, paddingBottom: 20 },
          columns: [{
            id: "col-footer", width: 100, blocks: [
              { id: "footer-txt", type: "text", props: { content: "You are receiving this because you subscribed.", fontSize: 12, color: "#9ca3af", align: "center" } },
              { id: "unsub", type: "text", props: { content: "<a href='{{unsubscribe_url}}' style='color:#4f46e5'>Unsubscribe</a>", fontSize: 12, align: "center" } },
            ]
          }],
        },
      ],
    },
  },
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Clean onboarding email with hero, intro text, and CTA button.",
    category: "onboarding",
    design: {
      theme: { background: "#f8fafc", contentWidth: 600, fontFamily: "Arial, sans-serif", primaryColor: "#2563eb" },
      rows: [
        {
          id: "row-hero-w", settings: { backgroundColor: "#2563eb", paddingTop: 50, paddingBottom: 50 },
          columns: [{
            id: "col-hw", width: 100, blocks: [
              { id: "hw-1", type: "text", props: { content: "Welcome aboard! 🎉", fontSize: 30, color: "#ffffff", align: "center" } },
              { id: "hw-2", type: "text", props: { content: "We're thrilled to have you. Here's what you need to know to get started.", fontSize: 16, color: "#bfdbfe", align: "center" } },
            ]
          }],
        },
        {
          id: "row-body-w", settings: { backgroundColor: "#ffffff", paddingTop: 30, paddingBottom: 30 },
          columns: [{
            id: "col-bw", width: 100, blocks: [
              { id: "bw-1", type: "text", props: { content: "Getting Started", fontSize: 22, align: "left", color: "#1e293b" } },
              { id: "bw-2", type: "text", props: { content: "Your account is all set up. Click the button below to explore your dashboard and start using the platform right away.", fontSize: 15, align: "left", color: "#475569" } },
              { id: "bw-3", type: "button", props: { text: "Go to Dashboard →", url: "#", backgroundColor: "#2563eb", color: "#ffffff", align: "center", borderRadius: 8, padding: 14 } },
            ]
          }],
        },
        {
          id: "row-footer-w", settings: { backgroundColor: "#f1f5f9", paddingTop: 20, paddingBottom: 20 },
          columns: [{
            id: "col-fw", width: 100, blocks: [
              { id: "fw-1", type: "text", props: { content: "Questions? Reply to this email or contact support.", fontSize: 12, color: "#94a3b8", align: "center" } },
            ]
          }],
        },
      ],
    },
  },
  {
    id: "announcement",
    name: "Announcement",
    description: "Simple announcement with header, body text, and action button.",
    category: "marketing",
    design: {
      theme: { background: "#fafafa", contentWidth: 600, fontFamily: "Arial, sans-serif", primaryColor: "#8b5cf6" },
      rows: [
        {
          id: "row-ann-h", settings: { backgroundColor: "#7c3aed", paddingTop: 40, paddingBottom: 40 },
          columns: [{
            id: "col-ah", width: 100, blocks: [
              { id: "ah-1", type: "text", props: { content: "📢 Big News!", fontSize: 28, color: "#ffffff", align: "center" } },
            ]
          }],
        },
        {
          id: "row-ann-b", settings: { backgroundColor: "#ffffff", paddingTop: 30, paddingBottom: 30 },
          columns: [{
            id: "col-ab", width: 100, blocks: [
              { id: "ab-1", type: "text", props: { content: "We have an exciting update to share with you. Our platform has been upgraded with new powerful features that will help you work smarter.", fontSize: 15, align: "left", color: "#374151" } },
              { id: "ab-2", type: "button", props: { text: "Learn More", url: "#", backgroundColor: "#7c3aed", color: "#ffffff", align: "center", borderRadius: 6, padding: 12 } },
            ]
          }],
        },
      ],
    },
  },
];

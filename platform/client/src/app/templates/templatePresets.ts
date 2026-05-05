export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  compiledHtml?: string;
  design?: any;
}

const ecommerceDesign = {
  theme: { background: "#f3f4f6", contentWidth: 600, fontFamily: "Arial, sans-serif", primaryColor: "#2558d9" },
  rows: [
    {
      id: "row-hero", settings: { backgroundColor: "#111827", paddingTop: 40, paddingBottom: 40 },
      columns: [{
        id: "col-hero", width: 100, blocks: [
          { id: "hero-title", type: "text", props: { content: "🔥 Midnight Flash Sale", fontSize: 32, color: "#ffffff", align: "center" } },
          { id: "hero-subtitle", type: "text", props: { content: "Up to 50% OFF for the next 24 hours", fontSize: 18, color: "#d1d5db", align: "center" } },
          { id: "hero-button", type: "button", props: { text: "Shop Now", url: "#", backgroundColor: "#2558d9", color: "#ffffff", align: "center", borderRadius: 6, padding: 12 } },
        ]
      }],
    }
  ],
};

const onboardingDesign = {
  theme: { background: "#f8fafc", contentWidth: 600, fontFamily: "Arial, sans-serif", primaryColor: "#2558d9" },
  rows: [
    {
      id: "row-hero-w", settings: { backgroundColor: "#2558d9", paddingTop: 50, paddingBottom: 50 },
      columns: [{
        id: "col-hw", width: 100, blocks: [
          { id: "hw-1", type: "text", props: { content: "Welcome aboard! 🎉", fontSize: 30, color: "#ffffff", align: "center" } },
          { id: "hw-2", type: "text", props: { content: "We're thrilled to have you.", fontSize: 16, color: "#bfdbfe", align: "center" } },
        ]
      }],
    }
  ],
};

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  // Ecommerce Category
  {
    id: "back-in-stock-1",
    name: "Back in Stock",
    description: "Inventory alert for customers.",
    category: "Ecommerce",
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
    design: ecommerceDesign
  },
  {
    id: "new-arrivals-1",
    name: "New Arrivals Showcase",
    description: "Display your latest collection.",
    category: "Ecommerce",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
    design: ecommerceDesign
  },
  {
    id: "flash-sale-1",
    name: "Midnight Flash Sale",
    description: "Urgency driven discount template.",
    category: "Ecommerce",
    thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&q=80",
    design: ecommerceDesign
  },
  {
    id: "order-confirmation",
    name: "Order Confirmation",
    description: "Post-purchase customer experience.",
    category: "Ecommerce",
    thumbnail: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=400&q=80",
    design: ecommerceDesign
  },
  // Marketing Category
  {
    id: "monthly-newsletter",
    name: "Monthly Digest",
    description: "Keep your audience updated.",
    category: "Marketing",
    thumbnail: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80",
    design: onboardingDesign
  },
  {
    id: "product-announcement",
    name: "Product Launch",
    description: "Announce new features or services.",
    category: "Marketing",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",
    design: onboardingDesign
  },
  {
    id: "event-invitation",
    name: "Live Webinar Invite",
    description: "Drive registrations for your events.",
    category: "Marketing",
    thumbnail: "https://images.unsplash.com/photo-1505373633560-82d6ef29631d?auto=format&fit=crop&w=400&q=80",
    design: onboardingDesign
  },
  {
    id: "seasonal-promo",
    name: "Seasonal Promotion",
    description: "Holiday themed marketing email.",
    category: "Marketing",
    thumbnail: "https://images.unsplash.com/photo-1512418490979-92798ccc13b0?auto=format&fit=crop&w=400&q=80",
    design: onboardingDesign
  },
  // Onboarding Category
  {
    id: "welcome-email",
    name: "Welcome Onboarding",
    description: "First touchpoint for new users.",
    category: "Onboarding",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80",
    design: onboardingDesign
  },
  {
    id: "feature-walkthrough",
    name: "Feature Spotlight",
    description: "Teach users how to use your tool.",
    category: "Onboarding",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80",
    design: onboardingDesign
  },
  {
    id: "account-verified",
    name: "Account Verified",
    description: "Transactional onboarding email.",
    category: "Onboarding",
    thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=400&q=80",
    design: onboardingDesign
  },
  // Transactional Category
  {
    id: "password-reset",
    name: "Password Reset",
    description: "Clean security notification.",
    category: "Transactional",
    thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80",
    design: onboardingDesign
  },
  {
    id: "billing-invoice",
    name: "Billing Invoice",
    description: "Receipt and payment confirmation.",
    category: "Transactional",
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80",
    design: onboardingDesign
  },
];

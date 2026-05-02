export interface ProjectCardData {
    id: string;
    title: string;
    thumbnail: string;
    category: string;
}

export interface ProjectCategory {
    id: string;
    title: string;
    projects: ProjectCardData[];
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to generate a batch of projects
const generateProjects = (category: string, count: number, titles: string[], imgOffset: number): ProjectCardData[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: generateId(),
        title: titles[i % titles.length] || `${category} Template ${i + 1}`,
        category,
        thumbnail: `https://picsum.photos/seed/${category.replace(/\s+/g, '')}${imgOffset + i}/400/250`
    }));
};

export const PROJECTS_DATA: ProjectCategory[] = [
    {
        id: "trending",
        title: "Trending Designs",
        projects: generateProjects(
            "Trending", 
            12, 
            ["Modern Portfolio", "SaaS Landing Page", "Minimalist Blog", "E-commerce Hero", "Creative Agency", "Tech Newsletter", "App Showcase", "Event Promo", "Real Estate Listing", "Fashion Lookbook", "Podcast Cover", "Webinar Invite"],
            10
        )
    },
    {
        id: "social",
        title: "Social Media Posts",
        projects: generateProjects(
            "Social Media", 
            12, 
            ["Instagram Story", "Facebook Ad", "Twitter Header", "LinkedIn Post", "Pinterest Pin", "YouTube Thumbnail", "TikTok Overlay", "Sale Announcement", "Quote Graphic", "Giveaway Post", "New Post Alert", "Carousel Slide"],
            20
        )
    },
    {
        id: "business",
        title: "Business Designs",
        projects: generateProjects(
            "Business", 
            12, 
            ["Company Pitch Deck", "Annual Report", "Business Card", "Invoice Template", "Letterhead", "Meeting Agenda", "Employee Handbook", "Project Proposal", "Brand Guidelines", "Press Release", "Certificate of Award", "Organizational Chart"],
            30
        )
    },
    {
        id: "resume",
        title: "Resume Templates",
        projects: generateProjects(
            "Resume", 
            12, 
            ["Professional CV", "Creative Resume", "Minimalist Resume", "Executive Profile", "Academic CV", "Tech Resume", "Entry Level Resume", "Designer Portfolio", "Cover Letter", "Reference List", "Infographic Resume", "Modern Timeline"],
            40
        )
    },
    {
        id: "posters",
        title: "Posters & Flyers",
        projects: generateProjects(
            "Print", 
            12, 
            ["Concert Poster", "Real Estate Flyer", "Lost Pet Flyer", "Hiring Poster", "Grand Opening", "Missing Person", "Movie Poster", "Election Campaign", "Charity Event", "Bake Sale", "Garage Sale", "Nightclub Promo"],
            50
        )
    }
];

export const MY_PROJECTS_DATA: ProjectCardData[] = generateProjects(
    "Saved",
    8,
    ["Q3 Marketing Update", "Welcome Email Flow", "Black Friday Promo", "Monthly Newsletter", "Abandoned Cart", "Onboarding Sequence", "Holiday Greetings", "Product Launch"],
    80
);

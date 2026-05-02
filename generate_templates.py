import json
import random
import string

def uid():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

# 5 New Categories, 15 templates each
new_categories = {
    "Welcome Emails": [
        "Welcome Aboard", "Get Started", "Your Account is Ready", "Hello and Welcome",
        "First Steps", "Thanks for Joining", "You are In", "Welcome to the Family",
        "Account Activated", "Let us Begin", "Your Journey Starts", "Nice to Meet You",
        "Glad You are Here", "Welcome Gift Inside", "Start Exploring"
    ],
    "Order and Transactional": [
        "Order Confirmed", "Your Receipt", "Payment Successful", "Order Shipped",
        "Out for Delivery", "Delivered", "Return Requested", "Refund Processed",
        "Subscription Renewed", "Invoice Ready", "Order Cancelled", "Track Your Order",
        "Item Back in Cart", "Pre-Order Confirmed", "Pickup Ready"
    ],
    "Product Launch": [
        "Introducing", "Now Available", "Meet the New", "Just Launched",
        "First Look", "Sneak Peek", "Launching Soon", "Pre-Order Open",
        "Limited Edition Drop", "Version 2 Point 0", "New Feature Alert", "It is Here",
        "The Wait is Over", "Grand Reveal", "Exclusive Early Access"
    ],
    "Holiday and Seasonal": [
        "Happy New Year", "Valentine Day", "Spring Sale", "Easter Special",
        "Summer Kickoff", "Back to School", "Halloween Treat", "Black Friday",
        "Cyber Monday", "Christmas Gift", "Holiday Greetings", "New Year Offer",
        "Festive Sale", "Seasons Best", "Year End Clearance"
    ],
    "SaaS and Tech": [
        "Feature Update", "Product Changelog", "Usage Report", "Trial Ending Soon",
        "Upgrade Your Plan", "API Announcement", "Maintenance Notice", "New Integration",
        "Security Alert", "Data Export Ready", "Onboarding Complete", "Weekly Analytics",
        "Team Invite", "Workspace Created", "Pro Plan Unlocked"
    ]
}

base_designs = [
    {
        "theme": {"primaryColor": "{COLOR}", "paragraphColor": "#475569", "borderRadius": 12, "background": "#f8fafc", "contentWidth": 600, "fontFamily": "Inter"},
        "headerBlocks": [{"id": "h1", "type": "text", "props": {"content": "{TITLE}", "fontSize": 22, "fontWeight": "bold", "align": "center", "color": "#1e293b"}}],
        "bodyBlocks": [
            {"id": "b1", "type": "image", "props": {"src": "{IMAGE}", "borderRadius": 12}},
            {"id": "b2", "type": "text", "props": {"content": "{DESC}", "align": "center", "fontSize": 16, "color": "#475569"}},
            {"id": "b3", "type": "button", "props": {"text": "Get Started", "backgroundColor": "{COLOR}", "color": "#ffffff", "borderRadius": 8, "align": "center", "padding": 14}}
        ],
        "footerBlocks": [{"id": "f1", "type": "text", "props": {"content": "2024 Your Brand. All rights reserved.", "fontSize": 12, "align": "center", "color": "#94a3b8"}}]
    },
    {
        "theme": {"primaryColor": "{COLOR}", "paragraphColor": "#1e293b", "borderRadius": 0, "background": "#ffffff", "contentWidth": 600, "fontFamily": "Inter"},
        "headerBlocks": [{"id": "h1", "type": "text", "props": {"content": "{TITLE}", "fontSize": 30, "fontWeight": "900", "align": "center", "color": "{COLOR}"}}],
        "bodyBlocks": [
            {"id": "b1", "type": "text", "props": {"content": "Do not miss out.", "align": "center", "fontSize": 44, "fontWeight": "900", "color": "#111827"}},
            {"id": "b2", "type": "image", "props": {"src": "{IMAGE}"}},
            {"id": "b3", "type": "button", "props": {"text": "SHOP NOW", "backgroundColor": "#000000", "color": "#ffffff", "borderRadius": 0, "align": "center", "padding": 20}}
        ],
        "footerBlocks": [{"id": "f1", "type": "text", "props": {"content": "Unsubscribe | View in Browser", "fontSize": 12, "align": "center", "color": "#6b7280"}}]
    },
    {
        "theme": {"primaryColor": "{COLOR}", "paragraphColor": "#4b5563", "borderRadius": 4, "background": "#ffffff", "contentWidth": 600, "fontFamily": "Helvetica"},
        "headerBlocks": [{"id": "h1", "type": "text", "props": {"content": "{TITLE}", "fontSize": 20, "fontWeight": "bold", "align": "center", "color": "#1e293b"}}],
        "bodyBlocks": [
            {"id": "b1", "type": "text", "props": {"content": "{DESC}", "fontSize": 22, "align": "center", "color": "{COLOR}"}},
            {"id": "b2", "type": "divider", "props": {"thickness": 2, "color": "#e5e7eb"}},
            {"id": "b3", "type": "image", "props": {"src": "{IMAGE}", "borderRadius": 8}},
            {"id": "b4", "type": "button", "props": {"text": "Learn More", "backgroundColor": "{COLOR}", "color": "#ffffff", "align": "center", "borderRadius": 6}}
        ],
        "footerBlocks": [{"id": "f1", "type": "text", "props": {"content": "Help Center | Contact Support", "fontSize": 12, "align": "center"}}]
    },
    {
        "theme": {"primaryColor": "{COLOR}", "paragraphColor": "#334155", "borderRadius": 8, "background": "#ffffff", "contentWidth": 600, "fontFamily": "Georgia"},
        "headerBlocks": [{"id": "h1", "type": "text", "props": {"content": "{TITLE}", "fontSize": 26, "fontWeight": "bold", "align": "left", "color": "#0f172a"}}],
        "bodyBlocks": [
            {"id": "b1", "type": "spacer", "props": {"height": 20}},
            {"id": "b2", "type": "text", "props": {"content": "{DESC}", "align": "left", "fontSize": 16, "color": "#334155"}},
            {"id": "b3", "type": "spacer", "props": {"height": 20}},
            {"id": "b4", "type": "button", "props": {"text": "Read More", "backgroundColor": "{COLOR}", "color": "#ffffff", "borderRadius": 4, "align": "left"}}
        ],
        "footerBlocks": [
            {"id": "f1", "type": "divider", "props": {"thickness": 1, "color": "#e2e8f0"}},
            {"id": "f2", "type": "text", "props": {"content": "2024 Your Brand", "fontSize": 11, "align": "center", "color": "#94a3b8"}}
        ]
    },
    {
        "theme": {"primaryColor": "{COLOR}", "paragraphColor": "#1e293b", "borderRadius": 6, "background": "#f1f5f9", "contentWidth": 600, "fontFamily": "Inter"},
        "headerBlocks": [],
        "bodyBlocks": [
            {"id": "b1", "type": "image", "props": {"src": "{IMAGE}", "borderRadius": 0}},
            {"id": "b2", "type": "text", "props": {"content": "{TITLE}", "fontSize": 28, "fontWeight": "800", "align": "center", "color": "#0f172a"}},
            {"id": "b3", "type": "text", "props": {"content": "{DESC}", "align": "center", "fontSize": 15, "color": "#64748b"}},
            {"id": "b4", "type": "button", "props": {"text": "Take Action", "backgroundColor": "{COLOR}", "color": "#ffffff", "borderRadius": 999, "align": "center", "padding": 16}}
        ],
        "footerBlocks": [{"id": "f1", "type": "text", "props": {"content": "Unsubscribe | Privacy Policy", "fontSize": 11, "align": "center", "color": "#94a3b8"}}]
    },
    {
        "theme": {"primaryColor": "{COLOR}", "paragraphColor": "#e2e8f0", "borderRadius": 0, "background": "#0f172a", "contentWidth": 600, "fontFamily": "Inter"},
        "headerBlocks": [{"id": "h1", "type": "text", "props": {"content": "{TITLE}", "fontSize": 32, "fontWeight": "900", "align": "center", "color": "{COLOR}"}}],
        "bodyBlocks": [
            {"id": "b1", "type": "image", "props": {"src": "{IMAGE}", "borderRadius": 8}},
            {"id": "b2", "type": "text", "props": {"content": "{DESC}", "align": "center", "fontSize": 16, "color": "#94a3b8"}},
            {"id": "b3", "type": "button", "props": {"text": "Explore Now", "backgroundColor": "{COLOR}", "color": "#ffffff", "borderRadius": 6, "align": "center"}}
        ],
        "footerBlocks": [{"id": "f1", "type": "text", "props": {"content": "2024 Your Brand - Unsubscribe", "fontSize": 11, "align": "center", "color": "#475569"}}]
    },
    {
        "theme": {"primaryColor": "{COLOR}", "paragraphColor": "#374151", "borderRadius": 8, "background": "#ffffff", "contentWidth": 600, "fontFamily": "Roboto"},
        "headerBlocks": [
            {"id": "h1", "type": "text", "props": {"content": "{TITLE}", "fontSize": 24, "fontWeight": "700", "align": "center", "color": "#ffffff", "padding": 24}}
        ],
        "bodyBlocks": [
            {"id": "b1", "type": "image", "props": {"src": "{IMAGE}", "borderRadius": 8}},
            {"id": "b2", "type": "text", "props": {"content": "{DESC}", "align": "center", "fontSize": 16}},
            {"id": "b3", "type": "button", "props": {"text": "View Details", "backgroundColor": "{COLOR}", "color": "#ffffff", "borderRadius": 8, "align": "center"}}
        ],
        "footerBlocks": [
            {"id": "f1", "type": "social", "props": {"icons": [{"platform": "facebook", "url": "#"}, {"platform": "twitter", "url": "#"}, {"platform": "instagram", "url": "#"}], "align": "center"}},
            {"id": "f2", "type": "text", "props": {"content": "2024 Your Brand. All rights reserved.", "fontSize": 11, "align": "center", "color": "#9ca3af"}}
        ]
    }
]

colors = ["#6366f1", "#ef4444", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6",
          "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#0ea5e9", "#84cc16",
          "#a855f7", "#f43f5e", "#22c55e"]

lib_path = "c:/Sh_R_Mail/platform/client/src/app/templates/[id]/block/templates_library.ts"

with open(lib_path, "r", encoding="utf-8") as f:
    existing = f.read()

# Remove closing ];\n so we can append
existing = existing.rstrip()
if existing.endswith("];"):
    existing = existing[:-2].rstrip()
    if not existing.endswith(","):
        existing += ","
    existing += "\n"

new_entries = ""
count = 0

for category, names in new_categories.items():
    for i, name in enumerate(names):
        t_id = f"tpl_{uid()}"
        desc = f"A professionally designed {name.lower()} email template."
        seed = uid()
        thumbnail = f"https://picsum.photos/seed/{seed}/800/400"
        hero_image = f"https://picsum.photos/seed/{seed}_hero/800/400"
        color = colors[i % len(colors)]

        base = base_designs[i % len(base_designs)]
        design_str = json.dumps(base)
        design_str = design_str.replace("{TITLE}", name.upper())
        design_str = design_str.replace("{DESC}", desc)
        design_str = design_str.replace("{IMAGE}", hero_image)
        design_str = design_str.replace("{COLOR}", color)
        design = json.loads(design_str)
        design["theme"]["primaryColor"] = color

        design_json = json.dumps(design, indent=4)
        design_json = design_json[:-1] + '    ,"settings": DEFAULT_SETTINGS\n}'

        new_entries += f"""    {{
        id: "{t_id}",
        name: "{name}",
        description: "{desc}",
        thumbnail: "{thumbnail}",
        design: {design_json}
    }},\n"""
        count += 1

updated = existing + new_entries + "];\n"

with open(lib_path, "w", encoding="utf-8") as f:
    f.write(updated)

print(f"Done! Added {count} new templates (5 categories x 15 each).")
print(f"File: {lib_path}")

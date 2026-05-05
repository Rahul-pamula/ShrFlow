import { DesignJSON, DEFAULT_SETTINGS } from "./types";

export interface TemplatePreset {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    design: DesignJSON;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
    {
        id: "tpl_kn14pla1",
        name: "Back in Stock 1",
        description: "A beautiful and responsive template for back in stock 1.",
        thumbnail: "https://picsum.photos/seed/angpn6kn/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "BACK IN STOCK 1",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#f59e0b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/angpn6kn_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_9ilkvptn",
        name: "New Arrivals 2",
        description: "A beautiful and responsive template for new arrivals 2.",
        thumbnail: "https://picsum.photos/seed/8feyz58i/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "NEW ARRIVALS 2",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for new arrivals 2.",
                "fontSize": 24,
                "align": "center",
                "color": "#3b82f6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/8feyz58i_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_cnxj11rh",
        name: "New Arrivals 3",
        description: "A beautiful and responsive template for new arrivals 3.",
        thumbnail: "https://picsum.photos/seed/xlfv8pdf/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "NEW ARRIVALS 3",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#3b82f6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/xlfv8pdf_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_mkm716yc",
        name: "New Arrivals 4",
        description: "A beautiful and responsive template for new arrivals 4.",
        thumbnail: "https://picsum.photos/seed/zzpdqm8g/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "NEW ARRIVALS 4",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for new arrivals 4.",
                "fontSize": 24,
                "align": "center",
                "color": "#f59e0b"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/zzpdqm8g_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_cmdwf88w",
        name: "Back in Stock 5",
        description: "A beautiful and responsive template for back in stock 5.",
        thumbnail: "https://picsum.photos/seed/ymgafvvz/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "BACK IN STOCK 5",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#06b6d4"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/ymgafvvz_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ra6sd46v",
        name: "Flash Sale 6",
        description: "A beautiful and responsive template for flash sale 6.",
        thumbnail: "https://picsum.photos/seed/om14q485/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "FLASH SALE 6",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for flash sale 6.",
                "fontSize": 24,
                "align": "center",
                "color": "#14b8a6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/om14q485_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_537bpc2j",
        name: "Flash Sale 7",
        description: "A beautiful and responsive template for flash sale 7.",
        thumbnail: "https://picsum.photos/seed/n2erjexb/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "FLASH SALE 7",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for flash sale 7.",
                "fontSize": 24,
                "align": "center",
                "color": "#ec4899"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/n2erjexb_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_8q3fbeap",
        name: "Flash Sale 8",
        description: "A beautiful and responsive template for flash sale 8.",
        thumbnail: "https://picsum.photos/seed/3c4udrm7/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "FLASH SALE 8",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/3c4udrm7_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for flash sale 8.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#f97316",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_upkxu6bh",
        name: "Back in Stock 9",
        description: "A beautiful and responsive template for back in stock 9.",
        thumbnail: "https://picsum.photos/seed/482idl99/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "BACK IN STOCK 9",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for back in stock 9.",
                "fontSize": 24,
                "align": "center",
                "color": "#8b5cf6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/482idl99_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_vvwbl6n5",
        name: "Back in Stock 10",
        description: "A beautiful and responsive template for back in stock 10.",
        thumbnail: "https://picsum.photos/seed/s1k6pyf8/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "BACK IN STOCK 10",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#10b981"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/s1k6pyf8_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_it4iesqj",
        name: "Weekly Deals 11",
        description: "A beautiful and responsive template for weekly deals 11.",
        thumbnail: "https://picsum.photos/seed/wcz1jefu/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "WEEKLY DEALS 11",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for weekly deals 11.",
                "fontSize": 24,
                "align": "center",
                "color": "#f59e0b"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/wcz1jefu_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_idk02cc3",
        name: "Weekly Deals 12",
        description: "A beautiful and responsive template for weekly deals 12.",
        thumbnail: "https://picsum.photos/seed/k5w2xrvy/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "WEEKLY DEALS 12",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#8b5cf6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/k5w2xrvy_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_qym1ad10",
        name: "Flash Sale 13",
        description: "A beautiful and responsive template for flash sale 13.",
        thumbnail: "https://picsum.photos/seed/1gr11haa/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "FLASH SALE 13",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/1gr11haa_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for flash sale 13.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#ef4444",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_5jfcj20l",
        name: "Exclusive Offer 14",
        description: "A beautiful and responsive template for exclusive offer 14.",
        thumbnail: "https://picsum.photos/seed/ija2vxty/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "EXCLUSIVE OFFER 14",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/ija2vxty_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for exclusive offer 14.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_y7o950lx",
        name: "Abandoned Cart 15",
        description: "A beautiful and responsive template for abandoned cart 15.",
        thumbnail: "https://picsum.photos/seed/cfswqonj/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "ABANDONED CART 15",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/cfswqonj_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for abandoned cart 15.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_f7dbnpb2",
        name: "Special Discount 16",
        description: "A beautiful and responsive template for special discount 16.",
        thumbnail: "https://picsum.photos/seed/5j9ns694/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "SPECIAL DISCOUNT 16",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for special discount 16.",
                "fontSize": 24,
                "align": "center",
                "color": "#f59e0b"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/5j9ns694_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_4qv64v4s",
        name: "Abandoned Cart 17",
        description: "A beautiful and responsive template for abandoned cart 17.",
        thumbnail: "https://picsum.photos/seed/cz5i9eum/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "ABANDONED CART 17",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/cz5i9eum_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for abandoned cart 17.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_k1ogp7ak",
        name: "Flash Sale 18",
        description: "A beautiful and responsive template for flash sale 18.",
        thumbnail: "https://picsum.photos/seed/rot5l7gj/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "FLASH SALE 18",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#f59e0b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/rot5l7gj_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ewpgffwf",
        name: "Back in Stock 19",
        description: "A beautiful and responsive template for back in stock 19.",
        thumbnail: "https://picsum.photos/seed/xg4qe9zn/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "BACK IN STOCK 19",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for back in stock 19.",
                "fontSize": 24,
                "align": "center",
                "color": "#10b981"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/xg4qe9zn_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_livrzte3",
        name: "Product Launch 20",
        description: "A beautiful and responsive template for product launch 20.",
        thumbnail: "https://picsum.photos/seed/zlpwrvhi/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PRODUCT LAUNCH 20",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for product launch 20.",
                "fontSize": 24,
                "align": "center",
                "color": "#ec4899"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/zlpwrvhi_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_mq365bbk",
        name: "Daily Brief 1",
        description: "A beautiful and responsive template for daily brief 1.",
        thumbnail: "https://picsum.photos/seed/llsbyoq0/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "DAILY BRIEF 1",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/llsbyoq0_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for daily brief 1.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_gapuucb6",
        name: "Monthly Newsletter 2",
        description: "A beautiful and responsive template for monthly newsletter 2.",
        thumbnail: "https://picsum.photos/seed/nn5cpgah/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MONTHLY NEWSLETTER 2",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/nn5cpgah_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for monthly newsletter 2.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_mntwm50w",
        name: "Community Highlights 3",
        description: "A beautiful and responsive template for community highlights 3.",
        thumbnail: "https://picsum.photos/seed/8x0c0fnl/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "COMMUNITY HIGHLIGHTS 3",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/8x0c0fnl_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for community highlights 3.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_49hkxpi8",
        name: "Product Update 4",
        description: "A beautiful and responsive template for product update 4.",
        thumbnail: "https://picsum.photos/seed/tu4b31c3/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PRODUCT UPDATE 4",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/tu4b31c3_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for product update 4.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_d6095mgd",
        name: "Tech Trends 5",
        description: "A beautiful and responsive template for tech trends 5.",
        thumbnail: "https://picsum.photos/seed/i5mq7udd/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "TECH TRENDS 5",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#3b82f6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/i5mq7udd_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_pe293n4e",
        name: "Tech Trends 6",
        description: "A beautiful and responsive template for tech trends 6.",
        thumbnail: "https://picsum.photos/seed/2mz1fhew/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "TECH TRENDS 6",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/2mz1fhew_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for tech trends 6.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_1s46y8rv",
        name: "Blog Roundup 7",
        description: "A beautiful and responsive template for blog roundup 7.",
        thumbnail: "https://picsum.photos/seed/hf1sgwlz/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "BLOG ROUNDUP 7",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/hf1sgwlz_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for blog roundup 7.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#f97316",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_hjbvhfr1",
        name: "Daily Brief 8",
        description: "A beautiful and responsive template for daily brief 8.",
        thumbnail: "https://picsum.photos/seed/8h24lmu7/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "DAILY BRIEF 8",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#06b6d4"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/8h24lmu7_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_i0xgzb7n",
        name: "Industry News 9",
        description: "A beautiful and responsive template for industry news 9.",
        thumbnail: "https://picsum.photos/seed/ye1p383a/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "INDUSTRY NEWS 9",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#8b5cf6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/ye1p383a_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_0f10v8a5",
        name: "Industry News 10",
        description: "A beautiful and responsive template for industry news 10.",
        thumbnail: "https://picsum.photos/seed/h1dg9sre/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "INDUSTRY NEWS 10",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#ef4444"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/h1dg9sre_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_o7geix8n",
        name: "Community Highlights 11",
        description: "A beautiful and responsive template for community highlights 11.",
        thumbnail: "https://picsum.photos/seed/8n95vszl/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "COMMUNITY HIGHLIGHTS 11",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#6366f1"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/8n95vszl_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_m5odyw1a",
        name: "Industry News 12",
        description: "A beautiful and responsive template for industry news 12.",
        thumbnail: "https://picsum.photos/seed/4xh4t5vn/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "INDUSTRY NEWS 12",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#3b82f6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/4xh4t5vn_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_2pxgif0b",
        name: "Community Highlights 13",
        description: "A beautiful and responsive template for community highlights 13.",
        thumbnail: "https://picsum.photos/seed/cc6b3f3z/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "COMMUNITY HIGHLIGHTS 13",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/cc6b3f3z_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for community highlights 13.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#06b6d4",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ba5ows2m",
        name: "Blog Roundup 14",
        description: "A beautiful and responsive template for blog roundup 14.",
        thumbnail: "https://picsum.photos/seed/qs8m8rn0/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "BLOG ROUNDUP 14",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for blog roundup 14.",
                "fontSize": 24,
                "align": "center",
                "color": "#ec4899"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/qs8m8rn0_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ri6pqqhq",
        name: "Industry News 15",
        description: "A beautiful and responsive template for industry news 15.",
        thumbnail: "https://picsum.photos/seed/kdeqv8lw/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "INDUSTRY NEWS 15",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for industry news 15.",
                "fontSize": 24,
                "align": "center",
                "color": "#f59e0b"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/kdeqv8lw_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_xxrf7zbl",
        name: "Monthly Newsletter 16",
        description: "A beautiful and responsive template for monthly newsletter 16.",
        thumbnail: "https://picsum.photos/seed/fjdd21n9/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MONTHLY NEWSLETTER 16",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#ef4444"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/fjdd21n9_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_v62y2qem",
        name: "Product Update 17",
        description: "A beautiful and responsive template for product update 17.",
        thumbnail: "https://picsum.photos/seed/nugbjbxh/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PRODUCT UPDATE 17",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for product update 17.",
                "fontSize": 24,
                "align": "center",
                "color": "#ef4444"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/nugbjbxh_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#ef4444",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_fsb43o0w",
        name: "Product Update 18",
        description: "A beautiful and responsive template for product update 18.",
        thumbnail: "https://picsum.photos/seed/h0ka2ke0/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PRODUCT UPDATE 18",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for product update 18.",
                "fontSize": 24,
                "align": "center",
                "color": "#f59e0b"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/h0ka2ke0_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_kaer4u1d",
        name: "Industry News 19",
        description: "A beautiful and responsive template for industry news 19.",
        thumbnail: "https://picsum.photos/seed/by7xo5x8/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "INDUSTRY NEWS 19",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#f97316"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/by7xo5x8_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_rr9svo36",
        name: "Tech Trends 20",
        description: "A beautiful and responsive template for tech trends 20.",
        thumbnail: "https://picsum.photos/seed/36m9qs9g/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "TECH TRENDS 20",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for tech trends 20.",
                "fontSize": 24,
                "align": "center",
                "color": "#10b981"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/36m9qs9g_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_spvk02uo",
        name: "Partnership 1",
        description: "A beautiful and responsive template for partnership 1.",
        thumbnail: "https://picsum.photos/seed/1rga98zp/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PARTNERSHIP 1",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for partnership 1.",
                "fontSize": 24,
                "align": "center",
                "color": "#10b981"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/1rga98zp_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_9t5h13k7",
        name: "Welcome Aboard 2",
        description: "A beautiful and responsive template for welcome aboard 2.",
        thumbnail: "https://picsum.photos/seed/elzw84n9/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "WELCOME ABOARD 2",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#14b8a6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/elzw84n9_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_01ad4rzp",
        name: "Policy Change 3",
        description: "A beautiful and responsive template for policy change 3.",
        thumbnail: "https://picsum.photos/seed/a3n3weaf/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "POLICY CHANGE 3",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/a3n3weaf_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for policy change 3.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#ef4444",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_bslnlmxz",
        name: "Welcome Aboard 4",
        description: "A beautiful and responsive template for welcome aboard 4.",
        thumbnail: "https://picsum.photos/seed/0h3s6h93/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "WELCOME ABOARD 4",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#ef4444"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/0h3s6h93_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_x872r3s2",
        name: "Policy Change 5",
        description: "A beautiful and responsive template for policy change 5.",
        thumbnail: "https://picsum.photos/seed/6pnoc7qs/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "POLICY CHANGE 5",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/6pnoc7qs_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for policy change 5.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#f97316",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_i8mffbf9",
        name: "Policy Change 6",
        description: "A beautiful and responsive template for policy change 6.",
        thumbnail: "https://picsum.photos/seed/jy69zz3o/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "POLICY CHANGE 6",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for policy change 6.",
                "fontSize": 24,
                "align": "center",
                "color": "#14b8a6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/jy69zz3o_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_fh6sv4ff",
        name: "Financial Review 7",
        description: "A beautiful and responsive template for financial review 7.",
        thumbnail: "https://picsum.photos/seed/saelwq9a/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "FINANCIAL REVIEW 7",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/saelwq9a_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for financial review 7.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_wovin3id",
        name: "Internal Memo 8",
        description: "A beautiful and responsive template for internal memo 8.",
        thumbnail: "https://picsum.photos/seed/o0fb712r/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "INTERNAL MEMO 8",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for internal memo 8.",
                "fontSize": 24,
                "align": "center",
                "color": "#10b981"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/o0fb712r_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ivzl66av",
        name: "Team Meeting 9",
        description: "A beautiful and responsive template for team meeting 9.",
        thumbnail: "https://picsum.photos/seed/v2a08hhv/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "TEAM MEETING 9",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#06b6d4"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/v2a08hhv_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_u7xyg28x",
        name: "Partnership 10",
        description: "A beautiful and responsive template for partnership 10.",
        thumbnail: "https://picsum.photos/seed/fgg56qv3/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PARTNERSHIP 10",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#06b6d4"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/fgg56qv3_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_we15us62",
        name: "Strategic Plan 11",
        description: "A beautiful and responsive template for strategic plan 11.",
        thumbnail: "https://picsum.photos/seed/qqu3goa5/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "STRATEGIC PLAN 11",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for strategic plan 11.",
                "fontSize": 24,
                "align": "center",
                "color": "#ec4899"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/qqu3goa5_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_bysmklwn",
        name: "Policy Change 12",
        description: "A beautiful and responsive template for policy change 12.",
        thumbnail: "https://picsum.photos/seed/9nn3u63a/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "POLICY CHANGE 12",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#f59e0b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/9nn3u63a_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_vfer99bi",
        name: "Policy Change 13",
        description: "A beautiful and responsive template for policy change 13.",
        thumbnail: "https://picsum.photos/seed/5aq41wda/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "POLICY CHANGE 13",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/5aq41wda_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for policy change 13.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_djq6k9dq",
        name: "Quarterly Report 14",
        description: "A beautiful and responsive template for quarterly report 14.",
        thumbnail: "https://picsum.photos/seed/gam02au1/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "QUARTERLY REPORT 14",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/gam02au1_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for quarterly report 14.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#06b6d4",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_f7dfezap",
        name: "Partnership 15",
        description: "A beautiful and responsive template for partnership 15.",
        thumbnail: "https://picsum.photos/seed/72tcatdu/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PARTNERSHIP 15",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for partnership 15.",
                "fontSize": 24,
                "align": "center",
                "color": "#f97316"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/72tcatdu_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#f97316",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_89ixo0vr",
        name: "Welcome Aboard 16",
        description: "A beautiful and responsive template for welcome aboard 16.",
        thumbnail: "https://picsum.photos/seed/kd632yeo/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "WELCOME ABOARD 16",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for welcome aboard 16.",
                "fontSize": 24,
                "align": "center",
                "color": "#ec4899"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/kd632yeo_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_x19thd02",
        name: "Financial Review 17",
        description: "A beautiful and responsive template for financial review 17.",
        thumbnail: "https://picsum.photos/seed/04lulzsb/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "FINANCIAL REVIEW 17",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/04lulzsb_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for financial review 17.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_3ko0okv3",
        name: "Investor Update 18",
        description: "A beautiful and responsive template for investor update 18.",
        thumbnail: "https://picsum.photos/seed/uwxpli80/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "INVESTOR UPDATE 18",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/uwxpli80_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for investor update 18.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ruqkz5fi",
        name: "Policy Change 19",
        description: "A beautiful and responsive template for policy change 19.",
        thumbnail: "https://picsum.photos/seed/85x98kd7/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "POLICY CHANGE 19",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/85x98kd7_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for policy change 19.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ut4m2y3o",
        name: "Strategic Plan 20",
        description: "A beautiful and responsive template for strategic plan 20.",
        thumbnail: "https://picsum.photos/seed/v0trh0hu/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "STRATEGIC PLAN 20",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#14b8a6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/v0trh0hu_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_g35k5frj",
        name: "Trade Show 1",
        description: "A beautiful and responsive template for trade show 1.",
        thumbnail: "https://picsum.photos/seed/cw1i1g35/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "TRADE SHOW 1",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#10b981"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/cw1i1g35_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ybn13v6p",
        name: "Networking 2",
        description: "A beautiful and responsive template for networking 2.",
        thumbnail: "https://picsum.photos/seed/tu87hcac/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "NETWORKING 2",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for networking 2.",
                "fontSize": 24,
                "align": "center",
                "color": "#8b5cf6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/tu87hcac_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_2jtwuzo3",
        name: "Networking 3",
        description: "A beautiful and responsive template for networking 3.",
        thumbnail: "https://picsum.photos/seed/gx11tuhe/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "NETWORKING 3",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/gx11tuhe_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for networking 3.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_6wy980kc",
        name: "Meetup 4",
        description: "A beautiful and responsive template for meetup 4.",
        thumbnail: "https://picsum.photos/seed/928qfeql/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MEETUP 4",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/928qfeql_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for meetup 4.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_u70gkdi5",
        name: "Conference 5",
        description: "A beautiful and responsive template for conference 5.",
        thumbnail: "https://picsum.photos/seed/pp3wos19/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "CONFERENCE 5",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/pp3wos19_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for conference 5.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_mglmij29",
        name: "Virtual Event 6",
        description: "A beautiful and responsive template for virtual event 6.",
        thumbnail: "https://picsum.photos/seed/7nntur3z/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "VIRTUAL EVENT 6",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/7nntur3z_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for virtual event 6.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#f97316",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_q6u64g5i",
        name: "Conference 7",
        description: "A beautiful and responsive template for conference 7.",
        thumbnail: "https://picsum.photos/seed/zll82u2s/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "CONFERENCE 7",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#06b6d4"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/zll82u2s_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_yglolmpe",
        name: "Conference 8",
        description: "A beautiful and responsive template for conference 8.",
        thumbnail: "https://picsum.photos/seed/0blf446e/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "CONFERENCE 8",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/0blf446e_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for conference 8.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_1t2oh7nj",
        name: "Live Q&A 9",
        description: "A beautiful and responsive template for live q&a 9.",
        thumbnail: "https://picsum.photos/seed/4b6dchgb/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "LIVE Q&A 9",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/4b6dchgb_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for live q&a 9.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_bk1a8syj",
        name: "Trade Show 10",
        description: "A beautiful and responsive template for trade show 10.",
        thumbnail: "https://picsum.photos/seed/gd3a6ub5/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "TRADE SHOW 10",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/gd3a6ub5_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for trade show 10.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_8j3z0s2z",
        name: "Trade Show 11",
        description: "A beautiful and responsive template for trade show 11.",
        thumbnail: "https://picsum.photos/seed/q4241e4x/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "TRADE SHOW 11",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#ec4899"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/q4241e4x_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_u4til2t9",
        name: "Panel Discussion 12",
        description: "A beautiful and responsive template for panel discussion 12.",
        thumbnail: "https://picsum.photos/seed/4g9igz4q/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PANEL DISCUSSION 12",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#10b981"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/4g9igz4q_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ptb0sqok",
        name: "Workshop 13",
        description: "A beautiful and responsive template for workshop 13.",
        thumbnail: "https://picsum.photos/seed/hubw5czq/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "WORKSHOP 13",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for workshop 13.",
                "fontSize": 24,
                "align": "center",
                "color": "#3b82f6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/hubw5czq_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_qida3g5u",
        name: "Conference 14",
        description: "A beautiful and responsive template for conference 14.",
        thumbnail: "https://picsum.photos/seed/fktfm5q3/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "CONFERENCE 14",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/fktfm5q3_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for conference 14.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#06b6d4",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_7w7uen7p",
        name: "Meetup 15",
        description: "A beautiful and responsive template for meetup 15.",
        thumbnail: "https://picsum.photos/seed/cp5548e4/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MEETUP 15",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for meetup 15.",
                "fontSize": 24,
                "align": "center",
                "color": "#14b8a6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/cp5548e4_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_e1h614dh",
        name: "Live Q&A 16",
        description: "A beautiful and responsive template for live q&a 16.",
        thumbnail: "https://picsum.photos/seed/uycj8air/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "LIVE Q&A 16",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/uycj8air_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for live q&a 16.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_rbvzmo08",
        name: "Workshop 17",
        description: "A beautiful and responsive template for workshop 17.",
        thumbnail: "https://picsum.photos/seed/5sqoh5f8/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "WORKSHOP 17",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/5sqoh5f8_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for workshop 17.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_jb6dvvvl",
        name: "Virtual Event 18",
        description: "A beautiful and responsive template for virtual event 18.",
        thumbnail: "https://picsum.photos/seed/77v9hfzs/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "VIRTUAL EVENT 18",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for virtual event 18.",
                "fontSize": 24,
                "align": "center",
                "color": "#f59e0b"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/77v9hfzs_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_z4y09l7c",
        name: "Trade Show 19",
        description: "A beautiful and responsive template for trade show 19.",
        thumbnail: "https://picsum.photos/seed/dkw08qja/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "TRADE SHOW 19",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#f59e0b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/dkw08qja_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_75b681zu",
        name: "Trade Show 20",
        description: "A beautiful and responsive template for trade show 20.",
        thumbnail: "https://picsum.photos/seed/i6ynbllz/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "TRADE SHOW 20",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for trade show 20.",
                "fontSize": 24,
                "align": "center",
                "color": "#6366f1"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/i6ynbllz_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#6366f1",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_0h51pc3m",
        name: "Gold Status 1",
        description: "A beautiful and responsive template for gold status 1.",
        thumbnail: "https://picsum.photos/seed/hikh9j0e/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "GOLD STATUS 1",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/hikh9j0e_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for gold status 1.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_oil4dpd3",
        name: "Gold Status 2",
        description: "A beautiful and responsive template for gold status 2.",
        thumbnail: "https://picsum.photos/seed/h0szfw6x/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "GOLD STATUS 2",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/h0szfw6x_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for gold status 2.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_wishy25e",
        name: "Happy Birthday 3",
        description: "A beautiful and responsive template for happy birthday 3.",
        thumbnail: "https://picsum.photos/seed/zpjuiefe/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "HAPPY BIRTHDAY 3",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/zpjuiefe_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for happy birthday 3.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#6366f1",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_llj6wmdl",
        name: "Points Update 4",
        description: "A beautiful and responsive template for points update 4.",
        thumbnail: "https://picsum.photos/seed/jb2vfzcs/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "POINTS UPDATE 4",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#8b5cf6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/jb2vfzcs_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_lzmxllye",
        name: "Milestone 5",
        description: "A beautiful and responsive template for milestone 5.",
        thumbnail: "https://picsum.photos/seed/i4pwp0h5/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MILESTONE 5",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for milestone 5.",
                "fontSize": 24,
                "align": "center",
                "color": "#8b5cf6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/i4pwp0h5_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_fzrru3mq",
        name: "Gold Status 6",
        description: "A beautiful and responsive template for gold status 6.",
        thumbnail: "https://picsum.photos/seed/4tjdsdqr/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "GOLD STATUS 6",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/4tjdsdqr_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for gold status 6.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#f97316",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_axo1jgdv",
        name: "Points Update 7",
        description: "A beautiful and responsive template for points update 7.",
        thumbnail: "https://picsum.photos/seed/njp86vad/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "POINTS UPDATE 7",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#6366f1"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/njp86vad_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_7a7505uz",
        name: "Level Up 8",
        description: "A beautiful and responsive template for level up 8.",
        thumbnail: "https://picsum.photos/seed/fqldc6l4/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "LEVEL UP 8",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for level up 8.",
                "fontSize": 24,
                "align": "center",
                "color": "#3b82f6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/fqldc6l4_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_umcpay8p",
        name: "VIP Access 9",
        description: "A beautiful and responsive template for vip access 9.",
        thumbnail: "https://picsum.photos/seed/zdt7c1tq/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "VIP ACCESS 9",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for vip access 9.",
                "fontSize": 24,
                "align": "center",
                "color": "#f59e0b"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/zdt7c1tq_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_q1prggtm",
        name: "Account Anniversary 10",
        description: "A beautiful and responsive template for account anniversary 10.",
        thumbnail: "https://picsum.photos/seed/0lrgbj8k/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "ACCOUNT ANNIVERSARY 10",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for account anniversary 10.",
                "fontSize": 24,
                "align": "center",
                "color": "#ec4899"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/0lrgbj8k_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_61qovo0i",
        name: "Gold Status 11",
        description: "A beautiful and responsive template for gold status 11.",
        thumbnail: "https://picsum.photos/seed/9uq4py63/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "GOLD STATUS 11",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for gold status 11.",
                "fontSize": 24,
                "align": "center",
                "color": "#8b5cf6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/9uq4py63_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_lw2oie46",
        name: "Account Anniversary 12",
        description: "A beautiful and responsive template for account anniversary 12.",
        thumbnail: "https://picsum.photos/seed/8g20zf3e/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "ACCOUNT ANNIVERSARY 12",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for account anniversary 12.",
                "fontSize": 24,
                "align": "center",
                "color": "#6366f1"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/8g20zf3e_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#6366f1",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ea0gdad7",
        name: "Milestone 13",
        description: "A beautiful and responsive template for milestone 13.",
        thumbnail: "https://picsum.photos/seed/7vbuu63c/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MILESTONE 13",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#6366f1"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/7vbuu63c_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_6yeokr1m",
        name: "Gold Status 14",
        description: "A beautiful and responsive template for gold status 14.",
        thumbnail: "https://picsum.photos/seed/1auwyoux/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "GOLD STATUS 14",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/1auwyoux_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for gold status 14.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#6366f1",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_gn79og1h",
        name: "Loyalty Reward 15",
        description: "A beautiful and responsive template for loyalty reward 15.",
        thumbnail: "https://picsum.photos/seed/3iio2h9a/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "LOYALTY REWARD 15",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/3iio2h9a_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for loyalty reward 15.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#ef4444",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_pya86yhr",
        name: "Loyalty Reward 16",
        description: "A beautiful and responsive template for loyalty reward 16.",
        thumbnail: "https://picsum.photos/seed/gpmejqsp/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "LOYALTY REWARD 16",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#ec4899"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/gpmejqsp_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_d1jvqdtq",
        name: "Milestone 17",
        description: "A beautiful and responsive template for milestone 17.",
        thumbnail: "https://picsum.photos/seed/kn8wiu5f/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MILESTONE 17",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/kn8wiu5f_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for milestone 17.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_f29hsbmt",
        name: "Happy Birthday 18",
        description: "A beautiful and responsive template for happy birthday 18.",
        thumbnail: "https://picsum.photos/seed/j1wdzkye/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "HAPPY BIRTHDAY 18",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for happy birthday 18.",
                "fontSize": 24,
                "align": "center",
                "color": "#ef4444"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/j1wdzkye_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#ef4444",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_4xuqjn7l",
        name: "Gold Status 19",
        description: "A beautiful and responsive template for gold status 19.",
        thumbnail: "https://picsum.photos/seed/7oovy725/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "GOLD STATUS 19",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#ef4444"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/7oovy725_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_2tqph0km",
        name: "Milestone 20",
        description: "A beautiful and responsive template for milestone 20.",
        thumbnail: "https://picsum.photos/seed/xi47i28r/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MILESTONE 20",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/xi47i28r_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A beautiful and responsive template for milestone 20.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
];

export const MY_TEMPLATE_PRESETS: TemplatePreset[] = [
    {
        id: "mytpl_ul4hd91p",
        name: "My Custom Design 1",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/b0tj1oit/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 1",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A personalized design saved to my library.",
                "fontSize": 24,
                "align": "center",
                "color": "#ec4899"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/b0tj1oit_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "mytpl_8wwk80ty",
        name: "My Custom Design 2",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/gah3ue8d/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 2",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/gah3ue8d_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A personalized design saved to my library.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "mytpl_3wqrclcl",
        name: "My Custom Design 3",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/5u600t9r/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 3",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#ec4899"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/5u600t9r_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "mytpl_6i1xutfl",
        name: "My Custom Design 4",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/om4bvr09/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 4",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/om4bvr09_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A personalized design saved to my library.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "mytpl_sbx5d4na",
        name: "My Custom Design 5",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/v75gpmup/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 5",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A personalized design saved to my library.",
                "fontSize": 24,
                "align": "center",
                "color": "#3b82f6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/v75gpmup_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "mytpl_o6c4p79j",
        name: "My Custom Design 6",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/rhznoabp/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 6",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#10b981"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/rhznoabp_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "mytpl_l8dfmcdp",
        name: "My Custom Design 7",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/sn50mwwz/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 7",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/sn50mwwz_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A personalized design saved to my library.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "mytpl_cfu74crf",
        name: "My Custom Design 8",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/19cvya93/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 8",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#ef4444"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/19cvya93_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "mytpl_8h994xvz",
        name: "My Custom Design 9",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/c8fxcfak/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 9",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#ef4444"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/c8fxcfak_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "mytpl_3njy71l7",
        name: "My Custom Design 10",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/rtzud19j/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 10",
                "fontSize": 18,
                "fontWeight": "bold",
                "align": "center"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A personalized design saved to my library.",
                "fontSize": 24,
                "align": "center",
                "color": "#8b5cf6"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/rtzud19j_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "LEARN MORE",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "mytpl_af7cczrn",
        name: "My Custom Design 11",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/tjf1s0zp/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 11",
                "fontSize": 28,
                "fontWeight": "900",
                "align": "center",
                "color": "#f97316"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "DON'T MISS OUT.",
                "align": "center",
                "fontSize": 48,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/tjf1s0zp_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "mytpl_sudjd9ii",
        name: "My Custom Design 12",
        description: "A personalized design saved to my library.",
        thumbnail: "https://picsum.photos/seed/ztpusb8h/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 8,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MY CUSTOM DESIGN 12",
                "fontSize": 24,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/ztpusb8h_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A personalized design saved to my library.",
                "align": "center",
                "fontSize": 18
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Click Here",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "\u00a9 2024 Your Brand.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_7mxq517y",
        name: "Welcome Aboard",
        description: "A professionally designed welcome aboard email template.",
        thumbnail: "https://picsum.photos/seed/pxjg5k8y/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "WELCOME ABOARD",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/pxjg5k8y_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed welcome aboard email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#6366f1",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_d0lm6u76",
        name: "Get Started",
        description: "A professionally designed get started email template.",
        thumbnail: "https://picsum.photos/seed/mhp71bty/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "GET STARTED",
                "fontSize": 30,
                "fontWeight": "900",
                "align": "center",
                "color": "#ef4444"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "Do not miss out.",
                "align": "center",
                "fontSize": 44,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/mhp71bty_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_v563k3fq",
        name: "Your Account is Ready",
        description: "A professionally designed your account is ready email template.",
        thumbnail: "https://picsum.photos/seed/hjcb8gqb/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "YOUR ACCOUNT IS READY",
                "fontSize": 20,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A professionally designed your account is ready email template.",
                "fontSize": 22,
                "align": "center",
                "color": "#10b981"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 2,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/hjcb8gqb_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Learn More",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "align": "center",
                "borderRadius": 6
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_t30c524l",
        name: "Hello and Welcome",
        description: "A professionally designed hello and welcome email template.",
        thumbnail: "https://picsum.photos/seed/d68wuwy4/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#334155",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Georgia"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "HELLO AND WELCOME",
                "fontSize": 26,
                "fontWeight": "bold",
                "align": "left",
                "color": "#0f172a"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed hello and welcome email template.",
                "align": "left",
                "fontSize": 16,
                "color": "#334155"
            }
        },
        {
            "id": "b3",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Read More",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "borderRadius": 4,
                "align": "left"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e2e8f0"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_437ho8gq",
        name: "First Steps",
        description: "A professionally designed first steps email template.",
        thumbnail: "https://picsum.photos/seed/ukk3xtnz/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#1e293b",
        "borderRadius": 6,
        "background": "#f1f5f9",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/ukk3xtnz_hero/800/400",
                "borderRadius": 0
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "FIRST STEPS",
                "fontSize": 28,
                "fontWeight": "800",
                "align": "center",
                "color": "#0f172a"
            }
        },
        {
            "id": "b3",
            "type": "text",
            "props": {
                "content": "A professionally designed first steps email template.",
                "align": "center",
                "fontSize": 15,
                "color": "#64748b"
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Take Action",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "borderRadius": 999,
                "align": "center",
                "padding": 16
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | Privacy Policy",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_dxwdu8pg",
        name: "Thanks for Joining",
        description: "A professionally designed thanks for joining email template.",
        thumbnail: "https://picsum.photos/seed/tw79702s/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#e2e8f0",
        "borderRadius": 0,
        "background": "#0f172a",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "THANKS FOR JOINING",
                "fontSize": 32,
                "fontWeight": "900",
                "align": "center",
                "color": "#8b5cf6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/tw79702s_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed thanks for joining email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#94a3b8"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Explore Now",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 6,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand - Unsubscribe",
                "fontSize": 11,
                "align": "center",
                "color": "#475569"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_hvi1ka21",
        name: "You are In",
        description: "A professionally designed you are in email template.",
        thumbnail: "https://picsum.photos/seed/z7h5ps6i/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#374151",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Roboto"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "YOU ARE IN",
                "fontSize": 24,
                "fontWeight": "700",
                "align": "center",
                "color": "#ffffff",
                "padding": 24
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/z7h5ps6i_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed you are in email template.",
                "align": "center",
                "fontSize": 16
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "View Details",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "social",
            "props": {
                "icons": [
                    {
                        "platform": "facebook",
                        "url": "#"
                    },
                    {
                        "platform": "twitter",
                        "url": "#"
                    },
                    {
                        "platform": "instagram",
                        "url": "#"
                    }
                ],
                "align": "center"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 11,
                "align": "center",
                "color": "#9ca3af"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_u1dtvhuv",
        name: "Welcome to the Family",
        description: "A professionally designed welcome to the family email template.",
        thumbnail: "https://picsum.photos/seed/faxuj63s/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "WELCOME TO THE FAMILY",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/faxuj63s_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed welcome to the family email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_7dnhuma9",
        name: "Account Activated",
        description: "A professionally designed account activated email template.",
        thumbnail: "https://picsum.photos/seed/hl54qjbc/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "ACCOUNT ACTIVATED",
                "fontSize": 30,
                "fontWeight": "900",
                "align": "center",
                "color": "#f97316"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "Do not miss out.",
                "align": "center",
                "fontSize": 44,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/hl54qjbc_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_kq5qkr70",
        name: "Let us Begin",
        description: "A professionally designed let us begin email template.",
        thumbnail: "https://picsum.photos/seed/xujbko32/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "LET US BEGIN",
                "fontSize": 20,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A professionally designed let us begin email template.",
                "fontSize": 22,
                "align": "center",
                "color": "#06b6d4"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 2,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/xujbko32_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Learn More",
                "backgroundColor": "#06b6d4",
                "color": "#ffffff",
                "align": "center",
                "borderRadius": 6
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_whe4h81d",
        name: "Your Journey Starts",
        description: "A professionally designed your journey starts email template.",
        thumbnail: "https://picsum.photos/seed/tndm72io/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#0ea5e9",
        "paragraphColor": "#334155",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Georgia"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "YOUR JOURNEY STARTS",
                "fontSize": 26,
                "fontWeight": "bold",
                "align": "left",
                "color": "#0f172a"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed your journey starts email template.",
                "align": "left",
                "fontSize": 16,
                "color": "#334155"
            }
        },
        {
            "id": "b3",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Read More",
                "backgroundColor": "#0ea5e9",
                "color": "#ffffff",
                "borderRadius": 4,
                "align": "left"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e2e8f0"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_2yq48vqk",
        name: "Nice to Meet You",
        description: "A professionally designed nice to meet you email template.",
        thumbnail: "https://picsum.photos/seed/9zpdneon/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#84cc16",
        "paragraphColor": "#1e293b",
        "borderRadius": 6,
        "background": "#f1f5f9",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/9zpdneon_hero/800/400",
                "borderRadius": 0
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "NICE TO MEET YOU",
                "fontSize": 28,
                "fontWeight": "800",
                "align": "center",
                "color": "#0f172a"
            }
        },
        {
            "id": "b3",
            "type": "text",
            "props": {
                "content": "A professionally designed nice to meet you email template.",
                "align": "center",
                "fontSize": 15,
                "color": "#64748b"
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Take Action",
                "backgroundColor": "#84cc16",
                "color": "#ffffff",
                "borderRadius": 999,
                "align": "center",
                "padding": 16
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | Privacy Policy",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_yt0hv1lw",
        name: "Glad You are Here",
        description: "A professionally designed glad you are here email template.",
        thumbnail: "https://picsum.photos/seed/6lj3ipou/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#a855f7",
        "paragraphColor": "#e2e8f0",
        "borderRadius": 0,
        "background": "#0f172a",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "GLAD YOU ARE HERE",
                "fontSize": 32,
                "fontWeight": "900",
                "align": "center",
                "color": "#a855f7"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/6lj3ipou_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed glad you are here email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#94a3b8"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Explore Now",
                "backgroundColor": "#a855f7",
                "color": "#ffffff",
                "borderRadius": 6,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand - Unsubscribe",
                "fontSize": 11,
                "align": "center",
                "color": "#475569"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_yaxcwu9j",
        name: "Welcome Gift Inside",
        description: "A professionally designed welcome gift inside email template.",
        thumbnail: "https://picsum.photos/seed/sdns9eb6/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f43f5e",
        "paragraphColor": "#374151",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Roboto"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "WELCOME GIFT INSIDE",
                "fontSize": 24,
                "fontWeight": "700",
                "align": "center",
                "color": "#ffffff",
                "padding": 24
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/sdns9eb6_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed welcome gift inside email template.",
                "align": "center",
                "fontSize": 16
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "View Details",
                "backgroundColor": "#f43f5e",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "social",
            "props": {
                "icons": [
                    {
                        "platform": "facebook",
                        "url": "#"
                    },
                    {
                        "platform": "twitter",
                        "url": "#"
                    },
                    {
                        "platform": "instagram",
                        "url": "#"
                    }
                ],
                "align": "center"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 11,
                "align": "center",
                "color": "#9ca3af"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_0vk5jrgr",
        name: "Start Exploring",
        description: "A professionally designed start exploring email template.",
        thumbnail: "https://picsum.photos/seed/7vvk9reo/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#22c55e",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "START EXPLORING",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/7vvk9reo_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed start exploring email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#22c55e",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_f5oieb7j",
        name: "Order Confirmed",
        description: "A professionally designed order confirmed email template.",
        thumbnail: "https://picsum.photos/seed/jvg235w1/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "ORDER CONFIRMED",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/jvg235w1_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed order confirmed email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#6366f1",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_oum2z435",
        name: "Your Receipt",
        description: "A professionally designed your receipt email template.",
        thumbnail: "https://picsum.photos/seed/2yplmxog/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "YOUR RECEIPT",
                "fontSize": 30,
                "fontWeight": "900",
                "align": "center",
                "color": "#ef4444"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "Do not miss out.",
                "align": "center",
                "fontSize": 44,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/2yplmxog_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_uj6w9hd7",
        name: "Payment Successful",
        description: "A professionally designed payment successful email template.",
        thumbnail: "https://picsum.photos/seed/4rqny7y7/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PAYMENT SUCCESSFUL",
                "fontSize": 20,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A professionally designed payment successful email template.",
                "fontSize": 22,
                "align": "center",
                "color": "#10b981"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 2,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/4rqny7y7_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Learn More",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "align": "center",
                "borderRadius": 6
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_7x6j8lxd",
        name: "Order Shipped",
        description: "A professionally designed order shipped email template.",
        thumbnail: "https://picsum.photos/seed/0dbkzsxc/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#334155",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Georgia"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "ORDER SHIPPED",
                "fontSize": 26,
                "fontWeight": "bold",
                "align": "left",
                "color": "#0f172a"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed order shipped email template.",
                "align": "left",
                "fontSize": 16,
                "color": "#334155"
            }
        },
        {
            "id": "b3",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Read More",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "borderRadius": 4,
                "align": "left"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e2e8f0"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_a0zvz2ks",
        name: "Out for Delivery",
        description: "A professionally designed out for delivery email template.",
        thumbnail: "https://picsum.photos/seed/ifmvkxq7/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#1e293b",
        "borderRadius": 6,
        "background": "#f1f5f9",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/ifmvkxq7_hero/800/400",
                "borderRadius": 0
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "OUT FOR DELIVERY",
                "fontSize": 28,
                "fontWeight": "800",
                "align": "center",
                "color": "#0f172a"
            }
        },
        {
            "id": "b3",
            "type": "text",
            "props": {
                "content": "A professionally designed out for delivery email template.",
                "align": "center",
                "fontSize": 15,
                "color": "#64748b"
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Take Action",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "borderRadius": 999,
                "align": "center",
                "padding": 16
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | Privacy Policy",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_s7e1wuqk",
        name: "Delivered",
        description: "A professionally designed delivered email template.",
        thumbnail: "https://picsum.photos/seed/wul58qx1/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#e2e8f0",
        "borderRadius": 0,
        "background": "#0f172a",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "DELIVERED",
                "fontSize": 32,
                "fontWeight": "900",
                "align": "center",
                "color": "#8b5cf6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/wul58qx1_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed delivered email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#94a3b8"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Explore Now",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 6,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand - Unsubscribe",
                "fontSize": 11,
                "align": "center",
                "color": "#475569"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_k5bm4mnc",
        name: "Return Requested",
        description: "A professionally designed return requested email template.",
        thumbnail: "https://picsum.photos/seed/xsxasw5u/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#374151",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Roboto"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "RETURN REQUESTED",
                "fontSize": 24,
                "fontWeight": "700",
                "align": "center",
                "color": "#ffffff",
                "padding": 24
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/xsxasw5u_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed return requested email template.",
                "align": "center",
                "fontSize": 16
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "View Details",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "social",
            "props": {
                "icons": [
                    {
                        "platform": "facebook",
                        "url": "#"
                    },
                    {
                        "platform": "twitter",
                        "url": "#"
                    },
                    {
                        "platform": "instagram",
                        "url": "#"
                    }
                ],
                "align": "center"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 11,
                "align": "center",
                "color": "#9ca3af"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_csn6q2h2",
        name: "Refund Processed",
        description: "A professionally designed refund processed email template.",
        thumbnail: "https://picsum.photos/seed/2kn5baja/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "REFUND PROCESSED",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/2kn5baja_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed refund processed email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_k864cs0j",
        name: "Subscription Renewed",
        description: "A professionally designed subscription renewed email template.",
        thumbnail: "https://picsum.photos/seed/5tayb0lg/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "SUBSCRIPTION RENEWED",
                "fontSize": 30,
                "fontWeight": "900",
                "align": "center",
                "color": "#f97316"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "Do not miss out.",
                "align": "center",
                "fontSize": 44,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/5tayb0lg_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_m5ju0xqn",
        name: "Invoice Ready",
        description: "A professionally designed invoice ready email template.",
        thumbnail: "https://picsum.photos/seed/v2jsqs7f/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "INVOICE READY",
                "fontSize": 20,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A professionally designed invoice ready email template.",
                "fontSize": 22,
                "align": "center",
                "color": "#06b6d4"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 2,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/v2jsqs7f_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Learn More",
                "backgroundColor": "#06b6d4",
                "color": "#ffffff",
                "align": "center",
                "borderRadius": 6
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_kz2plzo2",
        name: "Order Cancelled",
        description: "A professionally designed order cancelled email template.",
        thumbnail: "https://picsum.photos/seed/xsh3ewzj/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#0ea5e9",
        "paragraphColor": "#334155",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Georgia"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "ORDER CANCELLED",
                "fontSize": 26,
                "fontWeight": "bold",
                "align": "left",
                "color": "#0f172a"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed order cancelled email template.",
                "align": "left",
                "fontSize": 16,
                "color": "#334155"
            }
        },
        {
            "id": "b3",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Read More",
                "backgroundColor": "#0ea5e9",
                "color": "#ffffff",
                "borderRadius": 4,
                "align": "left"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e2e8f0"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_qhij0yow",
        name: "Track Your Order",
        description: "A professionally designed track your order email template.",
        thumbnail: "https://picsum.photos/seed/03myz2oy/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#84cc16",
        "paragraphColor": "#1e293b",
        "borderRadius": 6,
        "background": "#f1f5f9",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/03myz2oy_hero/800/400",
                "borderRadius": 0
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "TRACK YOUR ORDER",
                "fontSize": 28,
                "fontWeight": "800",
                "align": "center",
                "color": "#0f172a"
            }
        },
        {
            "id": "b3",
            "type": "text",
            "props": {
                "content": "A professionally designed track your order email template.",
                "align": "center",
                "fontSize": 15,
                "color": "#64748b"
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Take Action",
                "backgroundColor": "#84cc16",
                "color": "#ffffff",
                "borderRadius": 999,
                "align": "center",
                "padding": 16
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | Privacy Policy",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_kizk4yf2",
        name: "Item Back in Cart",
        description: "A professionally designed item back in cart email template.",
        thumbnail: "https://picsum.photos/seed/ijvh83yf/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#a855f7",
        "paragraphColor": "#e2e8f0",
        "borderRadius": 0,
        "background": "#0f172a",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "ITEM BACK IN CART",
                "fontSize": 32,
                "fontWeight": "900",
                "align": "center",
                "color": "#a855f7"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/ijvh83yf_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed item back in cart email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#94a3b8"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Explore Now",
                "backgroundColor": "#a855f7",
                "color": "#ffffff",
                "borderRadius": 6,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand - Unsubscribe",
                "fontSize": 11,
                "align": "center",
                "color": "#475569"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ennnhh3w",
        name: "Pre-Order Confirmed",
        description: "A professionally designed pre-order confirmed email template.",
        thumbnail: "https://picsum.photos/seed/zp4rfycz/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f43f5e",
        "paragraphColor": "#374151",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Roboto"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PRE-ORDER CONFIRMED",
                "fontSize": 24,
                "fontWeight": "700",
                "align": "center",
                "color": "#ffffff",
                "padding": 24
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/zp4rfycz_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed pre-order confirmed email template.",
                "align": "center",
                "fontSize": 16
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "View Details",
                "backgroundColor": "#f43f5e",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "social",
            "props": {
                "icons": [
                    {
                        "platform": "facebook",
                        "url": "#"
                    },
                    {
                        "platform": "twitter",
                        "url": "#"
                    },
                    {
                        "platform": "instagram",
                        "url": "#"
                    }
                ],
                "align": "center"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 11,
                "align": "center",
                "color": "#9ca3af"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_n7vdujwx",
        name: "Pickup Ready",
        description: "A professionally designed pickup ready email template.",
        thumbnail: "https://picsum.photos/seed/o3dtwikb/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#22c55e",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PICKUP READY",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/o3dtwikb_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed pickup ready email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#22c55e",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_1spgtf5b",
        name: "Introducing",
        description: "A professionally designed introducing email template.",
        thumbnail: "https://picsum.photos/seed/pt9i856e/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "INTRODUCING",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/pt9i856e_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed introducing email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#6366f1",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_1ofnmsyw",
        name: "Now Available",
        description: "A professionally designed now available email template.",
        thumbnail: "https://picsum.photos/seed/fake5t2a/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "NOW AVAILABLE",
                "fontSize": 30,
                "fontWeight": "900",
                "align": "center",
                "color": "#ef4444"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "Do not miss out.",
                "align": "center",
                "fontSize": 44,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/fake5t2a_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_krkgrd90",
        name: "Meet the New",
        description: "A professionally designed meet the new email template.",
        thumbnail: "https://picsum.photos/seed/tjqtt7wt/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MEET THE NEW",
                "fontSize": 20,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A professionally designed meet the new email template.",
                "fontSize": 22,
                "align": "center",
                "color": "#10b981"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 2,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/tjqtt7wt_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Learn More",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "align": "center",
                "borderRadius": 6
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_hfmpmn30",
        name: "Just Launched",
        description: "A professionally designed just launched email template.",
        thumbnail: "https://picsum.photos/seed/z7bmgaer/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#334155",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Georgia"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "JUST LAUNCHED",
                "fontSize": 26,
                "fontWeight": "bold",
                "align": "left",
                "color": "#0f172a"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed just launched email template.",
                "align": "left",
                "fontSize": 16,
                "color": "#334155"
            }
        },
        {
            "id": "b3",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Read More",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "borderRadius": 4,
                "align": "left"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e2e8f0"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_vr6e1l45",
        name: "First Look",
        description: "A professionally designed first look email template.",
        thumbnail: "https://picsum.photos/seed/rjlxfvmu/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#1e293b",
        "borderRadius": 6,
        "background": "#f1f5f9",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/rjlxfvmu_hero/800/400",
                "borderRadius": 0
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "FIRST LOOK",
                "fontSize": 28,
                "fontWeight": "800",
                "align": "center",
                "color": "#0f172a"
            }
        },
        {
            "id": "b3",
            "type": "text",
            "props": {
                "content": "A professionally designed first look email template.",
                "align": "center",
                "fontSize": 15,
                "color": "#64748b"
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Take Action",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "borderRadius": 999,
                "align": "center",
                "padding": 16
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | Privacy Policy",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_27ni7kko",
        name: "Sneak Peek",
        description: "A professionally designed sneak peek email template.",
        thumbnail: "https://picsum.photos/seed/zv2hih1m/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#e2e8f0",
        "borderRadius": 0,
        "background": "#0f172a",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "SNEAK PEEK",
                "fontSize": 32,
                "fontWeight": "900",
                "align": "center",
                "color": "#8b5cf6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/zv2hih1m_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed sneak peek email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#94a3b8"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Explore Now",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 6,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand - Unsubscribe",
                "fontSize": 11,
                "align": "center",
                "color": "#475569"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_zli4jmg9",
        name: "Launching Soon",
        description: "A professionally designed launching soon email template.",
        thumbnail: "https://picsum.photos/seed/kyhfd0mt/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#374151",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Roboto"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "LAUNCHING SOON",
                "fontSize": 24,
                "fontWeight": "700",
                "align": "center",
                "color": "#ffffff",
                "padding": 24
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/kyhfd0mt_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed launching soon email template.",
                "align": "center",
                "fontSize": 16
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "View Details",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "social",
            "props": {
                "icons": [
                    {
                        "platform": "facebook",
                        "url": "#"
                    },
                    {
                        "platform": "twitter",
                        "url": "#"
                    },
                    {
                        "platform": "instagram",
                        "url": "#"
                    }
                ],
                "align": "center"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 11,
                "align": "center",
                "color": "#9ca3af"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_bzuj2qu5",
        name: "Pre-Order Open",
        description: "A professionally designed pre-order open email template.",
        thumbnail: "https://picsum.photos/seed/08kl3jpx/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PRE-ORDER OPEN",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/08kl3jpx_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed pre-order open email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_itsq01wx",
        name: "Limited Edition Drop",
        description: "A professionally designed limited edition drop email template.",
        thumbnail: "https://picsum.photos/seed/swe51a3h/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "LIMITED EDITION DROP",
                "fontSize": 30,
                "fontWeight": "900",
                "align": "center",
                "color": "#f97316"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "Do not miss out.",
                "align": "center",
                "fontSize": 44,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/swe51a3h_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_kpunm9w9",
        name: "Version 2 Point 0",
        description: "A professionally designed version 2 point 0 email template.",
        thumbnail: "https://picsum.photos/seed/dx4lvra9/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "VERSION 2 POINT 0",
                "fontSize": 20,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A professionally designed version 2 point 0 email template.",
                "fontSize": 22,
                "align": "center",
                "color": "#06b6d4"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 2,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/dx4lvra9_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Learn More",
                "backgroundColor": "#06b6d4",
                "color": "#ffffff",
                "align": "center",
                "borderRadius": 6
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_uxxve0ew",
        name: "New Feature Alert",
        description: "A professionally designed new feature alert email template.",
        thumbnail: "https://picsum.photos/seed/0sjkeqql/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#0ea5e9",
        "paragraphColor": "#334155",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Georgia"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "NEW FEATURE ALERT",
                "fontSize": 26,
                "fontWeight": "bold",
                "align": "left",
                "color": "#0f172a"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed new feature alert email template.",
                "align": "left",
                "fontSize": 16,
                "color": "#334155"
            }
        },
        {
            "id": "b3",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Read More",
                "backgroundColor": "#0ea5e9",
                "color": "#ffffff",
                "borderRadius": 4,
                "align": "left"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e2e8f0"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_jy25efgk",
        name: "It is Here",
        description: "A professionally designed it is here email template.",
        thumbnail: "https://picsum.photos/seed/n0zwpous/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#84cc16",
        "paragraphColor": "#1e293b",
        "borderRadius": 6,
        "background": "#f1f5f9",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/n0zwpous_hero/800/400",
                "borderRadius": 0
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "IT IS HERE",
                "fontSize": 28,
                "fontWeight": "800",
                "align": "center",
                "color": "#0f172a"
            }
        },
        {
            "id": "b3",
            "type": "text",
            "props": {
                "content": "A professionally designed it is here email template.",
                "align": "center",
                "fontSize": 15,
                "color": "#64748b"
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Take Action",
                "backgroundColor": "#84cc16",
                "color": "#ffffff",
                "borderRadius": 999,
                "align": "center",
                "padding": 16
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | Privacy Policy",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_uhyjcyr7",
        name: "The Wait is Over",
        description: "A professionally designed the wait is over email template.",
        thumbnail: "https://picsum.photos/seed/lpx025jg/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#a855f7",
        "paragraphColor": "#e2e8f0",
        "borderRadius": 0,
        "background": "#0f172a",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "THE WAIT IS OVER",
                "fontSize": 32,
                "fontWeight": "900",
                "align": "center",
                "color": "#a855f7"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/lpx025jg_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed the wait is over email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#94a3b8"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Explore Now",
                "backgroundColor": "#a855f7",
                "color": "#ffffff",
                "borderRadius": 6,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand - Unsubscribe",
                "fontSize": 11,
                "align": "center",
                "color": "#475569"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_npcj818a",
        name: "Grand Reveal",
        description: "A professionally designed grand reveal email template.",
        thumbnail: "https://picsum.photos/seed/16guoayg/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f43f5e",
        "paragraphColor": "#374151",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Roboto"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "GRAND REVEAL",
                "fontSize": 24,
                "fontWeight": "700",
                "align": "center",
                "color": "#ffffff",
                "padding": 24
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/16guoayg_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed grand reveal email template.",
                "align": "center",
                "fontSize": 16
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "View Details",
                "backgroundColor": "#f43f5e",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "social",
            "props": {
                "icons": [
                    {
                        "platform": "facebook",
                        "url": "#"
                    },
                    {
                        "platform": "twitter",
                        "url": "#"
                    },
                    {
                        "platform": "instagram",
                        "url": "#"
                    }
                ],
                "align": "center"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 11,
                "align": "center",
                "color": "#9ca3af"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_5fshcv23",
        name: "Exclusive Early Access",
        description: "A professionally designed exclusive early access email template.",
        thumbnail: "https://picsum.photos/seed/0eogp3iz/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#22c55e",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "EXCLUSIVE EARLY ACCESS",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/0eogp3iz_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed exclusive early access email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#22c55e",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_l4xd6aew",
        name: "Happy New Year",
        description: "A professionally designed happy new year email template.",
        thumbnail: "https://picsum.photos/seed/7vn8vldf/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "HAPPY NEW YEAR",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/7vn8vldf_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed happy new year email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#6366f1",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_fgpg0l9s",
        name: "Valentine Day",
        description: "A professionally designed valentine day email template.",
        thumbnail: "https://picsum.photos/seed/kkguo6qq/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "VALENTINE DAY",
                "fontSize": 30,
                "fontWeight": "900",
                "align": "center",
                "color": "#ef4444"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "Do not miss out.",
                "align": "center",
                "fontSize": 44,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/kkguo6qq_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ncyqwwc5",
        name: "Spring Sale",
        description: "A professionally designed spring sale email template.",
        thumbnail: "https://picsum.photos/seed/j854nx3g/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "SPRING SALE",
                "fontSize": 20,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A professionally designed spring sale email template.",
                "fontSize": 22,
                "align": "center",
                "color": "#10b981"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 2,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/j854nx3g_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Learn More",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "align": "center",
                "borderRadius": 6
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_isyr9iyy",
        name: "Easter Special",
        description: "A professionally designed easter special email template.",
        thumbnail: "https://picsum.photos/seed/wg7qr9xn/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#334155",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Georgia"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "EASTER SPECIAL",
                "fontSize": 26,
                "fontWeight": "bold",
                "align": "left",
                "color": "#0f172a"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed easter special email template.",
                "align": "left",
                "fontSize": 16,
                "color": "#334155"
            }
        },
        {
            "id": "b3",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Read More",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "borderRadius": 4,
                "align": "left"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e2e8f0"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_w1u7e9nl",
        name: "Summer Kickoff",
        description: "A professionally designed summer kickoff email template.",
        thumbnail: "https://picsum.photos/seed/0tw139oi/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#1e293b",
        "borderRadius": 6,
        "background": "#f1f5f9",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/0tw139oi_hero/800/400",
                "borderRadius": 0
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "SUMMER KICKOFF",
                "fontSize": 28,
                "fontWeight": "800",
                "align": "center",
                "color": "#0f172a"
            }
        },
        {
            "id": "b3",
            "type": "text",
            "props": {
                "content": "A professionally designed summer kickoff email template.",
                "align": "center",
                "fontSize": 15,
                "color": "#64748b"
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Take Action",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "borderRadius": 999,
                "align": "center",
                "padding": 16
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | Privacy Policy",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_wapvbknl",
        name: "Back to School",
        description: "A professionally designed back to school email template.",
        thumbnail: "https://picsum.photos/seed/t1rfiz6f/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#e2e8f0",
        "borderRadius": 0,
        "background": "#0f172a",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "BACK TO SCHOOL",
                "fontSize": 32,
                "fontWeight": "900",
                "align": "center",
                "color": "#8b5cf6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/t1rfiz6f_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed back to school email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#94a3b8"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Explore Now",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 6,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand - Unsubscribe",
                "fontSize": 11,
                "align": "center",
                "color": "#475569"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ea6pb2qa",
        name: "Halloween Treat",
        description: "A professionally designed halloween treat email template.",
        thumbnail: "https://picsum.photos/seed/8al04mkd/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#374151",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Roboto"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "HALLOWEEN TREAT",
                "fontSize": 24,
                "fontWeight": "700",
                "align": "center",
                "color": "#ffffff",
                "padding": 24
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/8al04mkd_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed halloween treat email template.",
                "align": "center",
                "fontSize": 16
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "View Details",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "social",
            "props": {
                "icons": [
                    {
                        "platform": "facebook",
                        "url": "#"
                    },
                    {
                        "platform": "twitter",
                        "url": "#"
                    },
                    {
                        "platform": "instagram",
                        "url": "#"
                    }
                ],
                "align": "center"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 11,
                "align": "center",
                "color": "#9ca3af"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_sxv4zgqo",
        name: "Black Friday",
        description: "A professionally designed black friday email template.",
        thumbnail: "https://picsum.photos/seed/msbmq06g/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "BLACK FRIDAY",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/msbmq06g_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed black friday email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_702iksyf",
        name: "Cyber Monday",
        description: "A professionally designed cyber monday email template.",
        thumbnail: "https://picsum.photos/seed/h5z1pdim/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "CYBER MONDAY",
                "fontSize": 30,
                "fontWeight": "900",
                "align": "center",
                "color": "#f97316"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "Do not miss out.",
                "align": "center",
                "fontSize": 44,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/h5z1pdim_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_6u8vyaou",
        name: "Christmas Gift",
        description: "A professionally designed christmas gift email template.",
        thumbnail: "https://picsum.photos/seed/p35vdehc/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "CHRISTMAS GIFT",
                "fontSize": 20,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A professionally designed christmas gift email template.",
                "fontSize": 22,
                "align": "center",
                "color": "#06b6d4"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 2,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/p35vdehc_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Learn More",
                "backgroundColor": "#06b6d4",
                "color": "#ffffff",
                "align": "center",
                "borderRadius": 6
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_gjvw06u8",
        name: "Holiday Greetings",
        description: "A professionally designed holiday greetings email template.",
        thumbnail: "https://picsum.photos/seed/pi92a7vk/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#0ea5e9",
        "paragraphColor": "#334155",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Georgia"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "HOLIDAY GREETINGS",
                "fontSize": 26,
                "fontWeight": "bold",
                "align": "left",
                "color": "#0f172a"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed holiday greetings email template.",
                "align": "left",
                "fontSize": 16,
                "color": "#334155"
            }
        },
        {
            "id": "b3",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Read More",
                "backgroundColor": "#0ea5e9",
                "color": "#ffffff",
                "borderRadius": 4,
                "align": "left"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e2e8f0"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_tvycfcbe",
        name: "New Year Offer",
        description: "A professionally designed new year offer email template.",
        thumbnail: "https://picsum.photos/seed/i39t0paj/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#84cc16",
        "paragraphColor": "#1e293b",
        "borderRadius": 6,
        "background": "#f1f5f9",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/i39t0paj_hero/800/400",
                "borderRadius": 0
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "NEW YEAR OFFER",
                "fontSize": 28,
                "fontWeight": "800",
                "align": "center",
                "color": "#0f172a"
            }
        },
        {
            "id": "b3",
            "type": "text",
            "props": {
                "content": "A professionally designed new year offer email template.",
                "align": "center",
                "fontSize": 15,
                "color": "#64748b"
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Take Action",
                "backgroundColor": "#84cc16",
                "color": "#ffffff",
                "borderRadius": 999,
                "align": "center",
                "padding": 16
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | Privacy Policy",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_ksl4lu7u",
        name: "Festive Sale",
        description: "A professionally designed festive sale email template.",
        thumbnail: "https://picsum.photos/seed/xoibcjc8/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#a855f7",
        "paragraphColor": "#e2e8f0",
        "borderRadius": 0,
        "background": "#0f172a",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "FESTIVE SALE",
                "fontSize": 32,
                "fontWeight": "900",
                "align": "center",
                "color": "#a855f7"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/xoibcjc8_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed festive sale email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#94a3b8"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Explore Now",
                "backgroundColor": "#a855f7",
                "color": "#ffffff",
                "borderRadius": 6,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand - Unsubscribe",
                "fontSize": 11,
                "align": "center",
                "color": "#475569"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_v4o5u7gu",
        name: "Seasons Best",
        description: "A professionally designed seasons best email template.",
        thumbnail: "https://picsum.photos/seed/wehkpitc/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f43f5e",
        "paragraphColor": "#374151",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Roboto"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "SEASONS BEST",
                "fontSize": 24,
                "fontWeight": "700",
                "align": "center",
                "color": "#ffffff",
                "padding": 24
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/wehkpitc_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed seasons best email template.",
                "align": "center",
                "fontSize": 16
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "View Details",
                "backgroundColor": "#f43f5e",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "social",
            "props": {
                "icons": [
                    {
                        "platform": "facebook",
                        "url": "#"
                    },
                    {
                        "platform": "twitter",
                        "url": "#"
                    },
                    {
                        "platform": "instagram",
                        "url": "#"
                    }
                ],
                "align": "center"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 11,
                "align": "center",
                "color": "#9ca3af"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_nzyz35ru",
        name: "Year End Clearance",
        description: "A professionally designed year end clearance email template.",
        thumbnail: "https://picsum.photos/seed/9xyopf0m/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#22c55e",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "YEAR END CLEARANCE",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/9xyopf0m_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed year end clearance email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#22c55e",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_iajg1tq4",
        name: "Feature Update",
        description: "A professionally designed feature update email template.",
        thumbnail: "https://picsum.photos/seed/1y82teqz/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#6366f1",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "FEATURE UPDATE",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/1y82teqz_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed feature update email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#6366f1",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_o848kj8p",
        name: "Product Changelog",
        description: "A professionally designed product changelog email template.",
        thumbnail: "https://picsum.photos/seed/aexwkvhg/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ef4444",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PRODUCT CHANGELOG",
                "fontSize": 30,
                "fontWeight": "900",
                "align": "center",
                "color": "#ef4444"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "Do not miss out.",
                "align": "center",
                "fontSize": 44,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/aexwkvhg_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_pj8cedqa",
        name: "Usage Report",
        description: "A professionally designed usage report email template.",
        thumbnail: "https://picsum.photos/seed/d02shgmg/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#10b981",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "USAGE REPORT",
                "fontSize": 20,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A professionally designed usage report email template.",
                "fontSize": 22,
                "align": "center",
                "color": "#10b981"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 2,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/d02shgmg_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Learn More",
                "backgroundColor": "#10b981",
                "color": "#ffffff",
                "align": "center",
                "borderRadius": 6
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_nqbotjm7",
        name: "Trial Ending Soon",
        description: "A professionally designed trial ending soon email template.",
        thumbnail: "https://picsum.photos/seed/4neegs2r/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f59e0b",
        "paragraphColor": "#334155",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Georgia"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "TRIAL ENDING SOON",
                "fontSize": 26,
                "fontWeight": "bold",
                "align": "left",
                "color": "#0f172a"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed trial ending soon email template.",
                "align": "left",
                "fontSize": 16,
                "color": "#334155"
            }
        },
        {
            "id": "b3",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Read More",
                "backgroundColor": "#f59e0b",
                "color": "#ffffff",
                "borderRadius": 4,
                "align": "left"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e2e8f0"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_dw0penb1",
        name: "Upgrade Your Plan",
        description: "A professionally designed upgrade your plan email template.",
        thumbnail: "https://picsum.photos/seed/ry6pv2x5/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#3b82f6",
        "paragraphColor": "#1e293b",
        "borderRadius": 6,
        "background": "#f1f5f9",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/ry6pv2x5_hero/800/400",
                "borderRadius": 0
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "UPGRADE YOUR PLAN",
                "fontSize": 28,
                "fontWeight": "800",
                "align": "center",
                "color": "#0f172a"
            }
        },
        {
            "id": "b3",
            "type": "text",
            "props": {
                "content": "A professionally designed upgrade your plan email template.",
                "align": "center",
                "fontSize": 15,
                "color": "#64748b"
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Take Action",
                "backgroundColor": "#3b82f6",
                "color": "#ffffff",
                "borderRadius": 999,
                "align": "center",
                "padding": 16
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | Privacy Policy",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_oaurpynv",
        name: "API Announcement",
        description: "A professionally designed api announcement email template.",
        thumbnail: "https://picsum.photos/seed/g2ejurno/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#8b5cf6",
        "paragraphColor": "#e2e8f0",
        "borderRadius": 0,
        "background": "#0f172a",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "API ANNOUNCEMENT",
                "fontSize": 32,
                "fontWeight": "900",
                "align": "center",
                "color": "#8b5cf6"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/g2ejurno_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed api announcement email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#94a3b8"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Explore Now",
                "backgroundColor": "#8b5cf6",
                "color": "#ffffff",
                "borderRadius": 6,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand - Unsubscribe",
                "fontSize": 11,
                "align": "center",
                "color": "#475569"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_eceex5w5",
        name: "Maintenance Notice",
        description: "A professionally designed maintenance notice email template.",
        thumbnail: "https://picsum.photos/seed/h6br9igo/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#ec4899",
        "paragraphColor": "#374151",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Roboto"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "MAINTENANCE NOTICE",
                "fontSize": 24,
                "fontWeight": "700",
                "align": "center",
                "color": "#ffffff",
                "padding": 24
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/h6br9igo_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed maintenance notice email template.",
                "align": "center",
                "fontSize": 16
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "View Details",
                "backgroundColor": "#ec4899",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "social",
            "props": {
                "icons": [
                    {
                        "platform": "facebook",
                        "url": "#"
                    },
                    {
                        "platform": "twitter",
                        "url": "#"
                    },
                    {
                        "platform": "instagram",
                        "url": "#"
                    }
                ],
                "align": "center"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 11,
                "align": "center",
                "color": "#9ca3af"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_3rm9f6yk",
        name: "New Integration",
        description: "A professionally designed new integration email template.",
        thumbnail: "https://picsum.photos/seed/k7bwtvbn/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#14b8a6",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "NEW INTEGRATION",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/k7bwtvbn_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed new integration email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#14b8a6",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_iqdzttz8",
        name: "Security Alert",
        description: "A professionally designed security alert email template.",
        thumbnail: "https://picsum.photos/seed/o7icshqy/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f97316",
        "paragraphColor": "#1e293b",
        "borderRadius": 0,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "SECURITY ALERT",
                "fontSize": 30,
                "fontWeight": "900",
                "align": "center",
                "color": "#f97316"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "Do not miss out.",
                "align": "center",
                "fontSize": 44,
                "fontWeight": "900",
                "color": "#111827"
            }
        },
        {
            "id": "b2",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/o7icshqy_hero/800/400"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "SHOP NOW",
                "backgroundColor": "#000000",
                "color": "#ffffff",
                "borderRadius": 0,
                "align": "center",
                "padding": 20
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | View in Browser",
                "fontSize": 12,
                "align": "center",
                "color": "#6b7280"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_spjoif3d",
        name: "Data Export Ready",
        description: "A professionally designed data export ready email template.",
        thumbnail: "https://picsum.photos/seed/31l72mcl/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#06b6d4",
        "paragraphColor": "#4b5563",
        "borderRadius": 4,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Helvetica"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "DATA EXPORT READY",
                "fontSize": 20,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "text",
            "props": {
                "content": "A professionally designed data export ready email template.",
                "fontSize": 22,
                "align": "center",
                "color": "#06b6d4"
            }
        },
        {
            "id": "b2",
            "type": "divider",
            "props": {
                "thickness": 2,
                "color": "#e5e7eb"
            }
        },
        {
            "id": "b3",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/31l72mcl_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Learn More",
                "backgroundColor": "#06b6d4",
                "color": "#ffffff",
                "align": "center",
                "borderRadius": 6
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Help Center | Contact Support",
                "fontSize": 12,
                "align": "center"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_t8ojtduf",
        name: "Onboarding Complete",
        description: "A professionally designed onboarding complete email template.",
        thumbnail: "https://picsum.photos/seed/e43dqhbt/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#0ea5e9",
        "paragraphColor": "#334155",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Georgia"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "ONBOARDING COMPLETE",
                "fontSize": 26,
                "fontWeight": "bold",
                "align": "left",
                "color": "#0f172a"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed onboarding complete email template.",
                "align": "left",
                "fontSize": 16,
                "color": "#334155"
            }
        },
        {
            "id": "b3",
            "type": "spacer",
            "props": {
                "height": 20
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Read More",
                "backgroundColor": "#0ea5e9",
                "color": "#ffffff",
                "borderRadius": 4,
                "align": "left"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "divider",
            "props": {
                "thickness": 1,
                "color": "#e2e8f0"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_v1wxbuzw",
        name: "Weekly Analytics",
        description: "A professionally designed weekly analytics email template.",
        thumbnail: "https://picsum.photos/seed/rrvsxmeo/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#84cc16",
        "paragraphColor": "#1e293b",
        "borderRadius": 6,
        "background": "#f1f5f9",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/rrvsxmeo_hero/800/400",
                "borderRadius": 0
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "WEEKLY ANALYTICS",
                "fontSize": 28,
                "fontWeight": "800",
                "align": "center",
                "color": "#0f172a"
            }
        },
        {
            "id": "b3",
            "type": "text",
            "props": {
                "content": "A professionally designed weekly analytics email template.",
                "align": "center",
                "fontSize": 15,
                "color": "#64748b"
            }
        },
        {
            "id": "b4",
            "type": "button",
            "props": {
                "text": "Take Action",
                "backgroundColor": "#84cc16",
                "color": "#ffffff",
                "borderRadius": 999,
                "align": "center",
                "padding": 16
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "Unsubscribe | Privacy Policy",
                "fontSize": 11,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_m0z0y6l1",
        name: "Team Invite",
        description: "A professionally designed team invite email template.",
        thumbnail: "https://picsum.photos/seed/kbuhcs0q/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#a855f7",
        "paragraphColor": "#e2e8f0",
        "borderRadius": 0,
        "background": "#0f172a",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "TEAM INVITE",
                "fontSize": 32,
                "fontWeight": "900",
                "align": "center",
                "color": "#a855f7"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/kbuhcs0q_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed team invite email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#94a3b8"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Explore Now",
                "backgroundColor": "#a855f7",
                "color": "#ffffff",
                "borderRadius": 6,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand - Unsubscribe",
                "fontSize": 11,
                "align": "center",
                "color": "#475569"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_zngbqm5q",
        name: "Workspace Created",
        description: "A professionally designed workspace created email template.",
        thumbnail: "https://picsum.photos/seed/ijs2qq9z/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#f43f5e",
        "paragraphColor": "#374151",
        "borderRadius": 8,
        "background": "#ffffff",
        "contentWidth": 600,
        "fontFamily": "Roboto"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "WORKSPACE CREATED",
                "fontSize": 24,
                "fontWeight": "700",
                "align": "center",
                "color": "#ffffff",
                "padding": 24
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/ijs2qq9z_hero/800/400",
                "borderRadius": 8
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed workspace created email template.",
                "align": "center",
                "fontSize": 16
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "View Details",
                "backgroundColor": "#f43f5e",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center"
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "social",
            "props": {
                "icons": [
                    {
                        "platform": "facebook",
                        "url": "#"
                    },
                    {
                        "platform": "twitter",
                        "url": "#"
                    },
                    {
                        "platform": "instagram",
                        "url": "#"
                    }
                ],
                "align": "center"
            }
        },
        {
            "id": "f2",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 11,
                "align": "center",
                "color": "#9ca3af"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
    {
        id: "tpl_wo3sjuko",
        name: "Pro Plan Unlocked",
        description: "A professionally designed pro plan unlocked email template.",
        thumbnail: "https://picsum.photos/seed/7v58zo1d/800/400",
        design: {
    "rows": [], "theme": {
        "primaryColor": "#22c55e",
        "paragraphColor": "#475569",
        "borderRadius": 12,
        "background": "#f8fafc",
        "contentWidth": 600,
        "fontFamily": "Inter"
    },
    "headerBlocks": [
        {
            "id": "h1",
            "type": "text",
            "props": {
                "content": "PRO PLAN UNLOCKED",
                "fontSize": 22,
                "fontWeight": "bold",
                "align": "center",
                "color": "#1e293b"
            }
        }
    ],
    "bodyBlocks": [
        {
            "id": "b1",
            "type": "image",
            "props": {
                "src": "https://picsum.photos/seed/7v58zo1d_hero/800/400",
                "borderRadius": 12
            }
        },
        {
            "id": "b2",
            "type": "text",
            "props": {
                "content": "A professionally designed pro plan unlocked email template.",
                "align": "center",
                "fontSize": 16,
                "color": "#475569"
            }
        },
        {
            "id": "b3",
            "type": "button",
            "props": {
                "text": "Get Started",
                "backgroundColor": "#22c55e",
                "color": "#ffffff",
                "borderRadius": 8,
                "align": "center",
                "padding": 14
            }
        }
    ],
    "footerBlocks": [
        {
            "id": "f1",
            "type": "text",
            "props": {
                "content": "2024 Your Brand. All rights reserved.",
                "fontSize": 12,
                "align": "center",
                "color": "#94a3b8"
            }
        }
    ]
    ,"settings": DEFAULT_SETTINGS
}
    },
];

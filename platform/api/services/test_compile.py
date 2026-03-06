import json
from compile_service import compile_design_json

test_json = {
  "theme": {
    "background": "#f3f4f6",
    "contentWidth": 600,
    "fontFamily": "Arial, sans-serif",
    "primaryColor": "#4f46e5"
  },
  "rows": [
    {
      "id": "row-hero",
      "settings": {
        "backgroundColor": "#111827",
        "paddingTop": 40,
        "paddingBottom": 40
      },
      "columns": [
        {
          "id": "col-hero",
          "width": 100,
          "blocks": [
            {
              "id": "hero-title",
              "type": "text",
              "props": {
                "content": "🔥 Midnight Flash Sale",
                "fontSize": 32,
                "color": "#ffffff",
                "align": "center",
                "bold": True
              }
            }
          ]
        }
      ]
    }
  ]
}

if __name__ == "__main__":
    print("Compiling test JSON...")
    html = compile_design_json(test_json)
    print("Compilation Output Length:", len(html))
    print("First 200 chars:\n", html[:200])

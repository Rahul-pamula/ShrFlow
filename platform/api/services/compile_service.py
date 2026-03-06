"""
compile_service.py – Recursive Backend HTML Compiler
-----------------------------------------------------
Pipeline: DesignJSON → MJML markup → HTML (via npx mjml)

Structure:
  render_design()
    └ render_row()
        └ render_column()
            └ render_block()

All rendering uses the MJML engine for Outlook-safe nested table output.
No frontend compilation allowed. This is the single source of truth.
"""

import html as html_mod
import os
import re
import subprocess
import tempfile
from typing import Any, Dict, List


# ---------------------------------------------------------------------------
# XML / attribute helpers
# ---------------------------------------------------------------------------

def _esc(text: str) -> str:
    """Escape for safe inclusion in MJML/XML attributes and text nodes."""
    if not isinstance(text, str):
        text = str(text)
    return html_mod.escape(text, quote=True)


# ---------------------------------------------------------------------------
# Block Renderers  (each returns an MJML snippet string)
# ---------------------------------------------------------------------------

def _render_text(props: Dict[str, Any]) -> str:
    align = props.get("align", "left")
    font_size = props.get("fontSize", 16)
    color = props.get("color", "#000000")
    bold_open = "<b>" if props.get("bold") else ""
    bold_close = "</b>" if props.get("bold") else ""
    content = props.get("content", props.get("html", ""))
    return (
        f'<mj-text align="{align}" font-size="{font_size}px" color="{_esc(color)}" '
        f'padding="10px 0px">'
        f'{bold_open}{content}{bold_close}'
        f'</mj-text>'
    )


def _render_image(props: Dict[str, Any]) -> str:
    align = props.get("align", "center")
    src = _esc(props.get("src", props.get("url", "")))
    alt = _esc(props.get("alt", "Image"))
    width = props.get("width", "")
    width_attr = f'width="{width}px"' if width and str(width) != "100%" else ""
    return (
        f'<mj-image align="{align}" src="{src}" alt="{alt}" {width_attr} '
        f'padding="10px 0px" />'
    )


def _render_button(props: Dict[str, Any]) -> str:
    align = props.get("align", "center")
    text = _esc(props.get("text", props.get("label", "Click Here")))
    url = _esc(props.get("url", "#"))
    bg = props.get("backgroundColor", "#4f46e5")
    color = props.get("color", "#ffffff")
    radius = props.get("borderRadius", 4)
    padding = props.get("padding", 10)
    return (
        f'<mj-button align="{align}" href="{url}" '
        f'background-color="{_esc(bg)}" color="{_esc(color)}" '
        f'border-radius="{radius}px" inner-padding="{padding}px 25px">'
        f'{text}'
        f'</mj-button>'
    )


def _render_divider(props: Dict[str, Any]) -> str:
    color = props.get("color", "#e5e7eb")
    thickness = props.get("thickness", 1)
    return (
        f'<mj-divider border-width="{thickness}px" '
        f'border-color="{_esc(color)}" padding="10px 0px" />'
    )


def _render_spacer(props: Dict[str, Any]) -> str:
    height = props.get("height", 30)
    return f'<mj-spacer height="{height}px" />'


def _render_social(props: Dict[str, Any]) -> str:
    align = props.get("align", "center")
    icons = props.get("icons", props.get("links", []))
    elements: List[str] = []
    for icon in icons:
        platform = icon.get("platform", icon.get("label", "twitter")).lower()
        name_map = {
            "twitter": "twitter-noshare",
            "x": "twitter-noshare",
            "facebook": "facebook-noshare",
            "instagram": "instagram-noshare",
            "linkedin": "linkedin-noshare",
            "youtube": "youtube-noshare",
        }
        mj_name = name_map.get(platform, f"{platform}-noshare")
        href = _esc(icon.get("url", "#"))
        elements.append(
            f'<mj-social-element name="{mj_name}" href="{href}" />'
        )
    return (
        f'<mj-social align="{align}" icon-size="30px" mode="horizontal" padding="10px 0px">'
        + "".join(elements)
        + "</mj-social>"
    )


def _render_hero(props: Dict[str, Any]) -> str:
    """Hero block = full-width image + overlaid headline."""
    src = _esc(props.get("src", props.get("imageUrl", "")))
    headline = _esc(props.get("headline", props.get("content", "")))
    sub = _esc(props.get("subheadline", ""))
    align = props.get("align", "center")
    return (
        f'<mj-image src="{src}" width="600px" padding="0px" />'
        f'<mj-text align="{align}" font-size="32px" font-weight="bold" padding="20px 10px 5px 10px">'
        f'{headline}</mj-text>'
        + (f'<mj-text align="{align}" font-size="16px" color="#6b7280" padding="0px 10px 10px 10px">{sub}</mj-text>' if sub else "")
    )


def _render_footer(props: Dict[str, Any]) -> str:
    content = props.get("content", "")
    return (
        f'<mj-text align="center" font-size="12px" color="#9ca3af" padding="10px">'
        f'{content}'
        f'</mj-text>'
    )


BLOCK_RENDERERS: Dict[str, Any] = {
    "text":    _render_text,
    "image":   _render_image,
    "button":  _render_button,
    "divider": _render_divider,
    "spacer":  _render_spacer,
    "social":  _render_social,
    "hero":    _render_hero,
    "footer":  _render_footer,
}


# ---------------------------------------------------------------------------
# Recursive renderers
# ---------------------------------------------------------------------------

def render_block(block: Dict[str, Any]) -> str:
    b_type = block.get("type", "")
    renderer = BLOCK_RENDERERS.get(b_type)
    if renderer:
        return renderer(block.get("props", {}))
    return ""


def render_column(column: Dict[str, Any]) -> str:
    width = column.get("width", "")
    width_attr = f'width="{width}%"' if width else ""
    blocks_mjml = "\n".join(render_block(b) for b in column.get("blocks", []))
    return f"<mj-column {width_attr}>\n{blocks_mjml}\n</mj-column>"


def render_row(row: Dict[str, Any]) -> str:
    settings = row.get("settings", {})
    bg = settings.get("backgroundColor", "transparent")
    pt = settings.get("paddingTop", 0)
    pb = settings.get("paddingBottom", 0)
    pl = settings.get("paddingLeft", 0)
    pr = settings.get("paddingRight", 0)
    padding = f"{pt}px {pr}px {pb}px {pl}px"

    cols_mjml = "\n".join(render_column(c) for c in row.get("columns", []))
    return (
        f'<mj-section background-color="{_esc(bg)}" padding="{padding}">\n'
        f'{cols_mjml}\n'
        f'</mj-section>'
    )


def render_design(design_json: Dict[str, Any]) -> str:
    """Top-level: convert full DesignJSON dict to MJML document string."""
    theme = design_json.get("theme", {})
    bg = theme.get("background", "#f3f4f6")
    width = theme.get("contentWidth", 600)
    font = _esc(theme.get("fontFamily", "Arial, sans-serif"))

    rows_mjml = "\n".join(render_row(r) for r in design_json.get("rows", []))

    return f"""<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="{font}" />
      <mj-text padding="0px" />
      <mj-image padding="0px" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="{_esc(bg)}" width="{width}px">
{rows_mjml}
  </mj-body>
</mjml>"""


# ---------------------------------------------------------------------------
# MJML → HTML  (shells out to Node.js mjml-cli)
# ---------------------------------------------------------------------------

def compile_mjml_to_html(mjml_string: str) -> str:
    """Write MJML to a temp file, run `npx mjml`, return compiled HTML."""
    fd, tmp_path = tempfile.mkstemp(suffix=".mjml")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(mjml_string)
        result = subprocess.run(
            ["npx", "-y", "mjml", tmp_path, "-s"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(f"MJML compilation error: {result.stderr}")
        return result.stdout
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


# ---------------------------------------------------------------------------
# Public entry-point
# ---------------------------------------------------------------------------

def compile_design_json(design_json: Dict[str, Any]) -> str:
    """Full pipeline: JSON → MJML → HTML."""
    mjml = render_design(design_json)
    return compile_mjml_to_html(mjml)


# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------

SPAM_TRIGGER_WORDS = [
    "act now", "free!!!", "limited time offer",
    "click here", "buy now", "order now",
]


def run_preflight_checks(
    compiled_html: str, design_json: Dict[str, Any]
) -> List[Dict[str, str]]:
    warnings: List[Dict[str, str]] = []
    size_kb = len(compiled_html.encode("utf-8")) / 1024

    if size_kb > 102:
        warnings.append({
            "type": "size_warning", "severity": "error",
            "message": f"Email is {size_kb:.1f} KB — Gmail clips emails over 102 KB.",
        })
    elif size_kb > 80:
        warnings.append({
            "type": "size_warning", "severity": "warning",
            "message": f"Email is {size_kb:.1f} KB — approaching Gmail 102 KB clip limit.",
        })

    if "unsubscribe" not in compiled_html.lower():
        warnings.append({
            "type": "compliance_error", "severity": "error",
            "message": "No unsubscribe link found.",
        })

    text_only = re.sub(r"<[^>]+>", " ", compiled_html)
    alpha = [c for c in text_only if c.isalpha()]
    if alpha:
        caps = sum(1 for c in alpha if c.isupper()) / len(alpha)
        if caps > 0.45:
            warnings.append({
                "type": "spam_flag", "severity": "warning",
                "message": f"High ALL-CAPS ratio ({caps:.0%}).",
            })

    lower = text_only.lower()
    hits = [w for w in SPAM_TRIGGER_WORDS if w in lower]
    if hits:
        warnings.append({
            "type": "spam_flag", "severity": "warning",
            "message": f"Spam trigger words: {', '.join(hits[:3])}.",
        })

    return warnings

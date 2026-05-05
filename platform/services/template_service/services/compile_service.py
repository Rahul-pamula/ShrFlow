import hashlib
import html as html_mod
import json
import os
import re
import subprocess
import tempfile
from typing import Any, Dict, List, Optional

# ── OPTIONAL REDIS CACHE ───────────────────────────────────────────────────
try:
    import redis as _redis
    _redis_client: Optional[_redis.Redis] = _redis.Redis(
        host=os.environ.get("REDIS_HOST", "localhost"),
        port=int(os.environ.get("REDIS_PORT", 6379)),
        db=0, decode_responses=True, socket_connect_timeout=2
    )
    _redis_client.ping()  # test connection
except Exception:
    _redis_client = None

CACHE_TTL = 300  # 5 minutes

def _esc(text: Any) -> str:
    if not isinstance(text, str):
        text = str(text)
    return html_mod.escape(text, quote=True)

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
    icons = props.get("icons") or props.get("links") or []
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

def _render_layout(props: Dict[str, Any]) -> str:
    columns = props.get("columns", [])
    if not columns:
        return '<mj-section padding="0px"><mj-column><mj-text>Empty layout</mj-text></mj-column></mj-section>'
    col_count = len(columns)
    col_width = f"{100 // col_count}%"
    parts = [f'<mj-section padding="0px">']
    for col in columns:
        parts.append(f'<mj-column width="{col_width}" padding="8px">')
        col_blocks = col.get("blocks", [])
        if not col_blocks:
            text = col.get("content", col.get("text", ""))
            if text:
                parts.append(f'<mj-text font-size="14px" padding="4px 0">{text}</mj-text>')
        else:
            for b in col_blocks:
                renderer = BLOCK_RENDERERS.get(b.get("type", ""))
                if renderer:
                    parts.append(renderer(b.get("props", {})))
        parts.append("</mj-column>")
    parts.append("</mj-section>")
    return "\n".join(parts)

def _render_line(props: Dict[str, Any]) -> str:
    color = props.get("color", "#475569")
    thickness = props.get("thickness", 2)
    return (
        f'<mj-divider border-width="{thickness}px" '
        f'border-color="{_esc(color)}" padding="8px 0px" />'
    )

def _render_shape(props: Dict[str, Any]) -> str:
    bg = props.get("backgroundColor", "#6366F1")
    width = props.get("width", 100)
    height = props.get("height", 100)
    align = props.get("align", "center")
    radius = props.get("borderRadius", 0)
    # Render as a colored spacer block — shapes are decorative in email
    return (
        f'<mj-section padding="0px" background-color="transparent">'
        f'<mj-column>'
        f'<mj-image src="https://placehold.co/{width}x{height}/{bg.lstrip("#")}/{bg.lstrip("#")}" '
        f'align="{align}" border-radius="{radius}px" padding="4px 0" width="{width}px" />'
        f'</mj-column></mj-section>'
    )

def _render_rating(props: Dict[str, Any]) -> str:
    count = props.get("count", 5)
    color = props.get("color", "#FFD700")
    align = props.get("align", "center")
    stars = "★" * count
    return (
        f'<mj-text align="{align}" font-size="24px" color="{_esc(color)}" padding="8px 0">'
        f'{stars}</mj-text>'
    )

def _render_countdown(props: Dict[str, Any]) -> str:
    end_time = props.get("endTime", "")
    align = props.get("align", "center")
    color = props.get("color", "#334155")
    label = end_time if end_time else "Limited time offer"
    return (
        f'<mj-text align="{align}" font-size="14px" color="{_esc(color)}" '
        f'padding="8px 0"><b>⏰ {_esc(label)}</b></mj-text>'
    )

def _render_html(props: Dict[str, Any]) -> str:
    content = props.get("content", "")
    return f'<mj-raw>{content}</mj-raw>'

def _render_floating_text(props: Dict[str, Any]) -> str:
    """Floating text degrades gracefully to a standard text block in email."""
    return _render_text(props)

def _render_floating_image(props: Dict[str, Any]) -> str:
    """Floating image degrades gracefully to a standard image block in email."""
    return _render_image(props)

BLOCK_RENDERERS: Dict[str, Any] = {
    "text":           _render_text,
    "image":          _render_image,
    "button":         _render_button,
    "divider":        _render_divider,
    "spacer":         _render_spacer,
    "social":         _render_social,
    "hero":           _render_hero,
    "footer":         _render_footer,
    "layout":         _render_layout,
    "line":           _render_line,
    "shape":          _render_shape,
    "rating":         _render_rating,
    "countdown":      _render_countdown,
    "html":           _render_html,
    "floating-text":  _render_floating_text,
    "floating-image": _render_floating_image,
}

def render_block(block: Dict[str, Any]) -> str:
    b_type = block.get("type", "")
    props = block.get("props", {})
    renderer = BLOCK_RENDERERS.get(b_type)
    if not renderer:
        return ""
    mjml_content = renderer(props)
    return (
        f'<mj-section padding="0px">\n'
        f'  <mj-column width="100%">\n'
        f'    {mjml_content}\n'
        f'  </mj-column>\n'
        f'</mj-section>'
    )

def render_zone(blocks: List[Dict[str, Any]], zone_name: str) -> str:
    if not blocks:
        return ""
    parts = [f'<!-- {zone_name.upper()} ZONE -->']
    for b in blocks:
        parts.append(render_block(b))
    return "\n".join(parts)

def render_design(design_json: Dict[str, Any]) -> str:
    theme = design_json.get("theme", {})
    bg = theme.get("background", "#f3f4f6")
    width = theme.get("contentWidth", 600)
    font = _esc(theme.get("fontFamily", "Arial, sans-serif"))
    header_mjml = render_zone(design_json.get("headerBlocks", []), "header")
    body_mjml = render_zone(design_json.get("bodyBlocks", []), "body")
    footer_mjml = render_zone(design_json.get("footerBlocks", []), "footer")

    return f"""<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="{font}" />
      <mj-text padding="0px" color="{_esc(theme.get('paragraphColor', '#475569'))}" />
      <mj-button border-radius="{theme.get('borderRadius', 8)}px" />
      <mj-image padding="0px" border-radius="{theme.get('borderRadius', 0)}px" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="{_esc(bg)}" width="{width}px">
{header_mjml}
{body_mjml}
{footer_mjml}
  </mj-body>
</mjml>"""

def compile_mjml_to_html(mjml_string: str) -> str:
    fd, tmp_path = tempfile.mkstemp(suffix=".mjml")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(mjml_string)
        result = subprocess.run(
            ["npx", "-y", "mjml", tmp_path, "-s"],
            capture_output=True,
            text=True,
            shell=os.name == "nt"
        )
        if result.returncode != 0:
            raise RuntimeError(f"MJML compilation error: {result.stderr}")
        return result.stdout or ""
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
    return ""

def compile_design_json(design_json: Dict[str, Any]) -> str:
    """Compile design_json to HTML, using Redis cache when available."""
    cache_key: Optional[str] = None
    if _redis_client:
        try:
            digest = hashlib.sha256(
                json.dumps(design_json, sort_keys=True).encode()
            ).hexdigest()
            cache_key = f"compile:v1:{digest}"
            cached = _redis_client.get(cache_key)
            if cached:
                return cached
        except Exception:
            cache_key = None  # Redis unavailable — proceed without cache

    mjml = render_design(design_json)
    html = compile_mjml_to_html(mjml)

    if _redis_client and cache_key:
        try:
            _redis_client.setex(cache_key, CACHE_TTL, html)
        except Exception:
            pass  # Cache write failure is non-fatal

    return html

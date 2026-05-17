import re
from typing import Any, Dict

def sanitize_and_process_tags(html: str, contact: Dict[str, Any]) -> str:
    if not html:
        return ""
        
    # 1. Backend Enrichment & Fallbacks
    raw_first = contact.get("first_name") or ""
    raw_last = contact.get("last_name") or ""
    
    first_str = str(raw_first).strip()
    last_str = str(raw_last).strip()
    
    enriched_first = first_str if first_str else "there"
    enriched_last = last_str if last_str else "Customer"
    
    if first_str and last_str:
        enriched_full = f"{first_str} {last_str}"
    elif first_str:
        enriched_full = first_str
    elif last_str:
        enriched_full = last_str
    else:
        enriched_full = "Valued Customer"
        
    enriched_contact = {k: v for k, v in contact.items()}
    enriched_contact["first_name"] = enriched_first
    enriched_contact["last_name"] = enriched_last
    enriched_contact["full_name"] = enriched_full
    
    # 2. Tag Regex for matching {{ ... }} with re.DOTALL to handle multiline tags
    tag_pattern = re.compile(r"\{\{(.*?)\}\}", re.DOTALL)
    
    def replace_tag(match) -> str:
        inner = match.group(1)
        
        # Strip all HTML tags inside the curly braces
        clean_inner = re.sub(r"<[^>]+>", "", inner)
        
        # Normalize whitespace (replace newlines and multiple spaces with a single space, then strip)
        clean_inner = " ".join(clean_inner.split())
        
        if not clean_inner:
            return ""
            
        # Parse fallback if any
        parts = clean_inner.split("|", 1)
        tag_name = parts[0].strip().lower()
        fallback_value = parts[1].strip() if len(parts) > 1 else None
        
        # Original value in raw contact
        orig_val = contact.get(tag_name)
        orig_val_str = str(orig_val).strip() if orig_val is not None else ""
        
        # Standard enrichment fields
        standard_fields = {"first_name", "last_name", "full_name"}
        
        if tag_name in standard_fields:
            # Check if original value was blank
            if tag_name == "full_name":
                orig_has_value = bool(first_str or last_str)
            else:
                orig_has_value = bool(orig_val_str)
                
            if not orig_has_value:
                if fallback_value is not None:
                    return fallback_value
                return str(enriched_contact[tag_name])
            else:
                if tag_name == "full_name":
                    return f"{first_str} {last_str}".strip()
                return orig_val_str
                
        # For non-standard but allowed fields present in contact
        elif tag_name in enriched_contact:
            if not orig_val_str:
                if fallback_value is not None:
                    return fallback_value
                return ""
            return orig_val_str
            
        # For completely unknown fields
        else:
            return fallback_value if fallback_value is not None else ""
            
    return tag_pattern.sub(replace_tag, html)


# --- Unit Tests ---

def run_tests():
    print("🚀 Starting personalization engine unit tests...")
    
    # Test Case 1: Standard inputs with complete names
    c1 = {"first_name": "Sri", "last_name": "Krishna", "email": "krishna@dwaraka.in"}
    assert sanitize_and_process_tags("Hello {{first_name}} {{last_name}}!", c1) == "Hello Sri Krishna!"
    assert sanitize_and_process_tags("Welcome, {{full_name}}.", c1) == "Welcome, Sri Krishna."
    print("✅ Test Case 1: Standard inputs passed!")

    # Test Case 2: Missing inputs resolving to global fallbacks
    c2 = {}
    assert sanitize_and_process_tags("Hello {{first_name}} {{last_name}}!", c2) == "Hello there Customer!"
    assert sanitize_and_process_tags("Welcome, {{full_name}}.", c2) == "Welcome, Valued Customer."
    print("✅ Test Case 2: Missing inputs global fallbacks passed!")

    # Test Case 3: Empty inputs with custom local fallback overrides
    c3 = {"first_name": "", "last_name": "  "}
    assert sanitize_and_process_tags("Hey {{first_name|Friend}}!", c3) == "Hey Friend!"
    assert sanitize_and_process_tags("Dear {{last_name|User}}!", c3) == "Dear User!"
    assert sanitize_and_process_tags("Welcome, {{full_name|Honored Guest}}.", c3) == "Welcome, Honored Guest."
    print("✅ Test Case 3: Local fallback overrides passed!")

    # Test Case 4: Casing and whitespace normalization
    c4 = {"first_name": "Radha"}
    assert sanitize_and_process_tags("Hey {{ FIRST_NAME }}!", c4) == "Hey Radha!"
    assert sanitize_and_process_tags("Hey {{first_name | Devotee}}!", c4) == "Hey Radha!"
    assert sanitize_and_process_tags("Hey {{first_name | Devotee}}!", {}) == "Hey Devotee!"
    print("✅ Test Case 4: Casing and whitespace passed!")

    # Test Case 5: HTML pollution inside tags
    c5 = {"first_name": "Arjuna"}
    assert sanitize_and_process_tags("Hello {{<strong>first_name</strong>}}!", c5) == "Hello Arjuna!"
    assert sanitize_and_process_tags("Hello {{first_<br>name}}!", c5) == "Hello Arjuna!"
    assert sanitize_and_process_tags("Hello {{  first_name <em>|</em> Friend  }}!", {}) == "Hello Friend!"
    print("✅ Test Case 5: HTML pollution inside tags passed!")

    # Test Case 6: Multiline tags
    c6 = {"first_name": "Balarama"}
    template_multiline = """Hello {{\n  first_name\n  |\n  brother\n}}!"""
    assert sanitize_and_process_tags(template_multiline, c6) == "Hello Balarama!"
    assert sanitize_and_process_tags(template_multiline, {}) == "Hello brother!"
    print("✅ Test Case 6: Multiline tags passed!")

    # Test Case 7: Unknown tag protection
    c7 = {"first_name": "Ganesha"}
    assert sanitize_and_process_tags("Invoke {{unknown_tag}}.", c7) == "Invoke ."
    assert sanitize_and_process_tags("Invoke {{unknown_tag|Supreme Deity}}.", c7) == "Invoke Supreme Deity."
    print("✅ Test Case 7: Unknown tag protection passed!")

    # Test Case 8: Malformed tags / no regex failure safety
    c8 = {"first_name": "Shiva"}
    assert sanitize_and_process_tags("Hello {first_name}", c8) == "Hello {first_name}"
    assert sanitize_and_process_tags("Hello {{first_name", c8) == "Hello {{first_name"
    assert sanitize_and_process_tags("Hello {{}}!", c8) == "Hello !"
    print("✅ Test Case 8: Malformed tags safety passed!")

    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The personalization engine is 100% robust.")

if __name__ == "__main__":
    run_tests()

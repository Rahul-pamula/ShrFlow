import time
from uuid import uuid4
from datetime import datetime
from utils.supabase_client import db
import logging
import random
import re
from typing import Any, cast

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("CampaignWorker")

def process_spintax(text: str) -> str:
    """Process Spintax: {Hello|Hi|Hey} -> randomly picks one"""
    if not text: return ""
    pattern = r"(?<!\{)\{([^{}]+)\}(?!\})"
    def replace_spintax(match):
        options = match.group(1).split('|')
        return random.choice(options)
    while re.search(pattern, text):
        text = re.sub(pattern, replace_spintax, text)
    return text

def process_merge_tags(text: str, contact: dict) -> str:
    """Process merge tags: {{first_name}} -> actual value"""
    if not text: return ""
        
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
        
        # Normalize whitespace
        clean_inner = " ".join(clean_inner.split())
        
        if not clean_inner:
            return ""
            
        # Parse static fallback if any
        parts = clean_inner.split("|", 1)
        dynamic_chain_str = parts[0]
        static_fallback = parts[1].strip() if len(parts) > 1 else None
        
        # Parse dynamic candidates (e.g. first_name || full_name)
        candidates = [c.strip().lower() for c in dynamic_chain_str.split("||")]
        
        for candidate in candidates:
            if not candidate:
                continue
                
            orig_val = contact.get(candidate)
            orig_val_str = str(orig_val).strip() if orig_val is not None else ""
            
            if candidate == "full_name":
                if first_str or last_str:
                    return f"{first_str} {last_str}".strip()
            else:
                if orig_val_str:
                    return orig_val_str
                    
        # Exhausted all dynamic candidates without finding a valid string
        if static_fallback is not None:
            return static_fallback
            
        # If no static fallback was provided, use the default enrichment fallback of the PRIMARY candidate
        primary_candidate = candidates[0] if candidates else ""
        if primary_candidate in {"first_name", "last_name", "full_name"}:
            return str(enriched_contact[primary_candidate])
            
        return ""
            
    return tag_pattern.sub(replace_tag, text)

# Mocked for now - we don't have segmentation yet, so we get ALL contacts for tenant
def get_contacts_for_campaign(tenant_id: str, list_id: str | None = None):
    # In V1: Project ID = Tenant ID. So we get contacts where project_id = tenant_id.
    result = db.client.table("contacts").select("*").eq("project_id", tenant_id).execute()
    return result.data if result.data else []

def process_campaigns():
    """
    Main loop:
    1. Find campaigns with status='processing'
    2. Generate Tasks
    3. Update status='sending'
    """
    logger.info("Checking for pending campaigns...")
    
    # 1. Fetch campaigns to process
    campaigns = db.client.table("campaigns").select("*").eq("status", "processing").execute()
    campaigns_data = campaigns.data or []
    
    for campaign_raw in campaigns_data:
        campaign = cast(dict, campaign_raw)
        campaign_id = str(campaign['id'])
        tenant_id = str(campaign['tenant_id'])
        logger.info(f"Processing Campaign: {campaign['name']} ({campaign_id})")
        
        # 2. Get Snapshot
        snapshot_res = db.client.table("campaign_snapshots").select("*").eq("campaign_id", campaign_id).order("created_at", desc=True).limit(1).execute()
        
        if not snapshot_res.data:
            logger.error(f"No snapshot found for campaign {campaign_id}. Skipping.")
            continue
            
        snapshot = cast(dict, snapshot_res.data[0])
        body_template = str(snapshot.get('body_snapshot') or '')
        subject_template = str(snapshot.get('subject_snapshot') or '')
        
        # 3. Get Contacts
        contacts = get_contacts_for_campaign(tenant_id)
        logger.info(f"Found {len(contacts)} contacts.")
        
        if not contacts:
             # No contacts? Mark as sent (empty)
            db.client.table("campaigns").update({"status": "sent"}).eq("id", campaign_id).execute()
            continue

        # 4. Generate Tasks
        email_tasks = []
        for contact_raw in contacts:
            contact = cast(dict, contact_raw)
            email = str(contact.get('email') or '')
            domain = email.split('@')[-1] if '@' in email else 'unknown'
            isp = 'gmail' if 'gmail' in domain else 'outlook' if 'outlook' in domain else 'yahoo' if 'yahoo' in domain else 'other'
            
            # Rendering
            html_content = process_spintax(body_template)
            html_content = process_merge_tags(html_content, contact)
            
            subject = process_spintax(subject_template)
            subject = process_merge_tags(subject, contact)
            
            task = {
                "trace_id": str(uuid4()),
                "tenant_id": tenant_id, # Keep task isolated
                "project_id": tenant_id,
                "campaign_id": campaign_id,
                "snapshot_id": str(snapshot.get('id') or ''),
                "recipient_email": email,
                "recipient_domain": domain,
                "recipient_isp": isp,
                "status": "pending",
                "payload_rendered": html_content
            }
            email_tasks.append(task)
            
        # Bulk Insert
        # Supabase API limits might require batching, but for <1000 contacts this is fine.
        # In production -> batch by 100
        batch_size = 100
        for i in range(0, len(email_tasks), batch_size):
            batch = email_tasks[i:i + batch_size]
            db.client.table("email_tasks").insert(batch).execute()
            logger.info(f"Inserted batch {i} to {i+len(batch)}")
            
        # 5. Update Status
        db.client.table("campaigns").update({"status": "sending"}).eq("id", campaign_id).execute()
        logger.info(f"Campaign {campaign_id} moved to 'sending'.")
        
if __name__ == "__main__":
    while True:
        try:
            process_campaigns()
        except Exception as e:
            logger.error(f"Worker Error: {e}")
        
        time.sleep(10) # Poll every 10s

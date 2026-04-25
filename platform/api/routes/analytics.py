"""
Phase 6 — Campaign Analytics API

Endpoints:
  GET /analytics/campaigns/{id}   → per-campaign stats (open, click, bounce, unsub rates)
  GET /analytics/sender-health    → tenant-wide reputation metrics
  GET /analytics/campaigns/{id}/recipients → per-recipient event breakdown
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from utils.jwt_middleware import require_active_tenant
from utils.supabase_client import db
import logging

logger = logging.getLogger("email_engine.analytics")
router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ── Per-Campaign Analytics ────────────────────────────────────────────────────

@router.get("/campaigns/{campaign_id}")
async def get_campaign_analytics(
    campaign_id: str,
    tenant_id: str = Depends(require_active_tenant)
):
    """
    Full analytics for a single campaign.
    Returns: sent, opens, unique_opens, bounces, unsubscribes.
    Includes all proxy/bot events.
    """
    # Verify campaign belongs to tenant
    camp_res = db.client.table("campaigns")\
        .select("id, name, subject, status, created_at")\
        .eq("id", campaign_id)\
        .eq("tenant_id", tenant_id)\
        .execute()

    if not camp_res.data:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign = camp_res.data[0]

    # Count sent (DISPATCHED dispatch records)
    sent_res = db.client.table("campaign_dispatch")\
        .select("id", count="exact")\
        .eq("campaign_id", campaign_id)\
        .eq("status", "DISPATCHED")\
        .execute()
    sent = sent_res.count or 0

    # Count failed
    failed_res = db.client.table("campaign_dispatch")\
        .select("id", count="exact")\
        .eq("campaign_id", campaign_id)\
        .eq("status", "FAILED")\
        .execute()
    failed = failed_res.count or 0

    # Fetch tracking events
    events_query = db.client.table("email_events")\
        .select("event_type, contact_id, dispatch_id, source")\
        .eq("campaign_id", campaign_id)
    events_res = events_query.execute()

    events = events_res.data or []

    # Deduplicate raw events: keep only the first event per (dispatch_id, event_type)
    # This prevents double-counting if the same pixel fires twice (retry, proxy + user, etc.)
    seen = set()
    deduped_events = []
    for e in events:
        key = (e["dispatch_id"], e["event_type"])
        if key not in seen:
            seen.add(key)
            deduped_events.append(e)

    # Aggregate (using deduped events only)
    opens        = [e for e in deduped_events if e["event_type"] == "open"]
    bounces      = [e for e in deduped_events if e["event_type"] == "bounce"]
    unsub_events = [e for e in deduped_events if e["event_type"] == "unsubscribe"]

    # Cross-check against current contact status to honour re-subscriptions
    unsub_contact_ids = [e["contact_id"] for e in unsub_events if e.get("contact_id")]
    active_unsubs = set()
    if unsub_contact_ids:
        status_res = db.client.table("contacts").select("id, status").in_("id", unsub_contact_ids).execute()
        for c in (status_res.data or []):
            if c["status"] == "unsubscribed":
                active_unsubs.add(c["id"])
    unsubs = [e for e in unsub_events if e.get("contact_id") in active_unsubs]

    unique_opens  = len(set(e["contact_id"] for e in opens if e["contact_id"]))

    attempted = sent + failed

    def rate(num, denom):
        return round((num / denom) * 100, 2) if denom > 0 else 0.0

    return {
        "campaign": campaign,
        "stats": {
            "sent":            sent,
            "failed":          failed,
            "opens":           len(opens),
            "unique_opens":    unique_opens,
            "bounces":         len(bounces) + failed,  # SMTP failed = bounce too
            "unsubscribes":    len(unsubs),
            # Rates
            "open_rate":       rate(unique_opens, sent),
            "bounce_rate":     rate(len(bounces) + failed, attempted),
            "unsubscribe_rate": rate(len(unsubs), sent),
        },
        "sources": {
            "gmail_proxy": sum(1 for e in deduped_events if e.get("source") == "gmail_proxy"),
            "apple_mpp":   sum(1 for e in deduped_events if e.get("source") == "apple_mpp"),
            "outlook":     sum(1 for e in deduped_events if e.get("source") == "outlook_proxy"),
            "yahoo":       sum(1 for e in deduped_events if e.get("source") == "yahoo_proxy"),
            "scanner":     sum(1 for e in deduped_events if e.get("source") == "scanner"),
            "honeypot":    sum(1 for e in deduped_events if e.get("source") == "honeypot"),
            "human":       sum(1 for e in deduped_events if e.get("source") == "human"),
        }
    }


# ── Per-Campaign Recipient Breakdown ──────────────────────────────────────────

@router.get("/campaigns/{campaign_id}/recipients")
async def get_campaign_recipients(
    campaign_id: str,
    tenant_id: str = Depends(require_active_tenant)
):
    """
    Returns per-recipient status for a campaign:
    who opened, who bounced, who unsubscribed.
    """
    # Verify ownership
    camp_res = db.client.table("campaigns")\
        .select("id")\
        .eq("id", campaign_id)\
        .eq("tenant_id", tenant_id)\
        .execute()

    if not camp_res.data:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Dispatch rows with subscriber info
    dispatch_res = db.client.table("campaign_dispatch")\
        .select("id, status, subscriber_id, contacts!inner(email, first_name, last_name)")\
        .eq("campaign_id", campaign_id)\
        .execute()

    dispatches = {d["id"]: d for d in (dispatch_res.data or [])}

    # Tracking events
    events_q = db.client.table("email_events")\
        .select("dispatch_id, event_type, contact_id, source")\
        .eq("campaign_id", campaign_id)
    events_res = events_q.execute()

    # Group events by dispatch_id
    events_by_dispatch: dict = {}
    for e in (events_res.data or []):
        did = e["dispatch_id"]
        if did not in events_by_dispatch:
            events_by_dispatch[did] = []
        events_by_dispatch[did].append(e)

    # ── Also fetch current contact statuses to reflect resubscriptions ──
    contact_ids = [r.get("subscriber_id") for r in dispatches.values() if r.get("subscriber_id")]
    status_map: dict = {}
    if contact_ids:
        stat_res = db.client.table("contacts").select("id, status").in_("id", contact_ids).execute()
        for c in (stat_res.data or []):
            status_map[c["id"]] = c["status"]

    recipients = []
    for did, d in dispatches.items():
        contact = d.get("contacts") or {}
        event_list = events_by_dispatch.get(did, [])
        event_types = {e["event_type"] for e in event_list}
        sources = {e.get("source", "unknown") for e in event_list}
        contact_id = d.get("subscriber_id")
        # Show unsubscribed = True only if event history has it AND contact is still unsubscribed now
        current_status = status_map.get(contact_id, "")
        recipients.append({
            "dispatch_id":  did,
            "contact_id":   contact_id,
            "email":        contact.get("email", ""),
            "name":         f"{contact.get('first_name','')} {contact.get('last_name','')}".strip(),
            "status":       d.get("status"),
            "opened":       "open" in event_types,
            "bounced":      d.get("status") == "FAILED" or "bounce" in event_types,
            "unsubscribed": "unsubscribe" in event_types and current_status == "unsubscribed",
            "sources":      list(sources),
        })

    return {"recipients": recipients, "total": len(recipients)}


# ── Sender Health (Tenant-Wide Reputation) ────────────────────────────────────

@router.get("/sender-health")
async def get_sender_health(tenant_id: str = Depends(require_active_tenant)):
    """
    Tenant's overall sender reputation.
    Aggregates last 30 days of data across all campaigns.
    Returns traffic-light ratings per metric.
    """
    # All campaigns for this tenant
    camps_res = db.client.table("campaigns")\
        .select("id")\
        .eq("tenant_id", tenant_id)\
        .execute()

    camp_ids = [c["id"] for c in (camps_res.data or [])]

    if not camp_ids:
        return _health_response(sent=0, opens=0, clicks=0, bounces=0, spam=0)

    # Total dispatched (sent)
    sent_res = db.client.table("campaign_dispatch")\
        .select("id", count="exact")\
        .in_("campaign_id", camp_ids)\
        .eq("status", "DISPATCHED")\
        .execute()

    failed_res = db.client.table("campaign_dispatch")\
        .select("id", count="exact")\
        .in_("campaign_id", camp_ids)\
        .eq("status", "FAILED")\
        .execute()

    # Tracking events (non-bot)
    events_res = db.client.table("email_events")\
        .select("event_type")\
        .eq("tenant_id", tenant_id)\
        .eq("is_bot", False)\
        .execute()

    events = events_res.data or []
    sent    = sent_res.count or 0
    failed  = failed_res.count or 0
    opens   = sum(1 for e in events if e["event_type"] == "open")
    clicks  = sum(1 for e in events if e["event_type"] == "click")
    spam    = sum(1 for e in events if e["event_type"] == "spam")

    return _health_response(sent, opens, clicks, failed, spam)


def _health_response(sent, opens, clicks, bounces, spam):
    def rate(n, d): return round((n / d) * 100, 2) if d > 0 else 0.0

    attempted = sent + bounces
    bounce_rate = rate(bounces, attempted)
    spam_rate   = rate(spam, sent)
    open_rate   = rate(opens, sent)

    def bounce_status(r):
        if r < 2:    return "green"
        elif r < 5:  return "yellow"
        return "red"

    def spam_status(r):
        if r < 0.1:   return "green"
        elif r < 0.5: return "yellow"
        return "red"

    def open_status(r):
        if r > 20:   return "green"
        elif r > 10: return "yellow"
        return "red"

    return {
        "sent":         sent,
        "opens":        opens,
        "clicks":       clicks,
        "bounces":      bounces,
        "spam":         spam,
        "rates": {
            "bounce_rate": bounce_rate,
            "spam_rate":   spam_rate,
            "open_rate":   open_rate,
            "click_rate":  rate(clicks, sent),
        },
        "health": {
            "bounce": {"status": bounce_status(bounce_rate), "value": bounce_rate},
            "spam":   {"status": spam_status(spam_rate),     "value": spam_rate},
            "open":   {"status": open_status(open_rate),     "value": open_rate},
        },
        "overall": "red" if bounce_status(bounce_rate) == "red" or spam_status(spam_rate) == "red"
                   else "yellow" if bounce_status(bounce_rate) == "yellow" or spam_status(spam_rate) == "yellow"
                   else "green"
    }

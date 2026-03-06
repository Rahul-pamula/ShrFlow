"""
Phase 6 — Campaign Analytics API

Endpoints:
  GET /analytics/campaigns/{id}   → per-campaign stats (open, click, bounce, unsub rates)
  GET /analytics/sender-health    → tenant-wide reputation metrics
  GET /analytics/campaigns/{id}/recipients → per-recipient event breakdown
"""
from fastapi import APIRouter, Depends, HTTPException
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
    Returns: sent, opens, unique_opens, clicks, unique_clicks, bounces, unsubscribes.
    All bot events excluded from rates.
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

    # Fetch all non-bot tracking events for this campaign
    events_res = db.client.table("email_events")\
        .select("event_type, contact_id, dispatch_id")\
        .eq("campaign_id", campaign_id)\
        .eq("is_bot", False)\
        .execute()

    events = events_res.data or []

    # Aggregate
    opens        = [e for e in events if e["event_type"] == "open"]
    clicks       = [e for e in events if e["event_type"] == "click"]
    bounces      = [e for e in events if e["event_type"] == "bounce"]
    unsubs       = [e for e in events if e["event_type"] == "unsubscribe"]

    unique_opens  = len(set(e["contact_id"] for e in opens))
    unique_clicks = len(set(e["contact_id"] for e in clicks))

    def rate(num, denom):
        return round((num / denom) * 100, 2) if denom > 0 else 0.0

    return {
        "campaign": campaign,
        "stats": {
            "sent":            sent,
            "failed":          failed,
            "opens":           len(opens),
            "unique_opens":    unique_opens,
            "clicks":          len(clicks),
            "unique_clicks":   unique_clicks,
            "bounces":         len(bounces) + failed,  # SMTP failed = bounce too
            "unsubscribes":    len(unsubs),
            # Rates
            "open_rate":       rate(unique_opens, sent),
            "click_rate":      rate(unique_clicks, sent),
            "click_to_open":   rate(unique_clicks, unique_opens),
            "bounce_rate":     rate(len(bounces) + failed, sent),
            "unsubscribe_rate": rate(len(unsubs), sent),
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
    who opened, who clicked, who bounced.
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
    events_res = db.client.table("email_events")\
        .select("dispatch_id, event_type, contact_id")\
        .eq("campaign_id", campaign_id)\
        .eq("is_bot", False)\
        .execute()

    # Group events by dispatch_id
    events_by_dispatch: dict = {}
    for e in (events_res.data or []):
        did = e["dispatch_id"]
        if did not in events_by_dispatch:
            events_by_dispatch[did] = set()
        events_by_dispatch[did].add(e["event_type"])

    recipients = []
    for did, d in dispatches.items():
        contact = d.get("contacts") or {}
        event_types = events_by_dispatch.get(did, set())
        recipients.append({
            "dispatch_id":  did,
            "contact_id":   d.get("subscriber_id"),
            "email":        contact.get("email", ""),
            "name":         f"{contact.get('first_name','')} {contact.get('last_name','')}".strip(),
            "status":       d.get("status"),
            "opened":       "open" in event_types,
            "clicked":      "click" in event_types,
            "bounced":      d.get("status") == "FAILED" or "bounce" in event_types,
            "unsubscribed": "unsubscribe" in event_types,
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

    bounce_rate = rate(bounces, sent)
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

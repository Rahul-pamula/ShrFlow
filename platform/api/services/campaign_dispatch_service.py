from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple
import random
import re
import uuid


def process_spintax(text: str) -> str:
    if not text:
        return ""
    pattern = r"\{([^{}]+)\}"

    def replace_spintax(match: re.Match[str]) -> str:
        return random.choice(match.group(1).split("|"))

    while re.search(pattern, text):
        text = re.sub(pattern, replace_spintax, text)
    return text


def process_merge_tags(text: str, contact: Dict[str, Any]) -> str:
    if not text:
        return ""
    pattern = r"\{\{(\w+)(?:\|([^}]+))?\}\}"

    def replace_tag(match: re.Match[str]) -> str:
        field = match.group(1)
        fallback = match.group(2) or ""
        return str(contact.get(field, fallback) or fallback)

    return re.sub(pattern, replace_tag, text)


def build_contacts_query(
    supabase: Any,
    tenant_id: str,
    target: str = "all",
    exclude_suppressed: bool = False,
):
    query = supabase.table("contacts").select("id, email, first_name, last_name").eq("tenant_id", tenant_id)
    if exclude_suppressed:
        query = query.not_.in_("status", ["bounced", "unsubscribed"])

    audience_label = "All Contacts"

    if target.startswith("batch_domains:"):
        _, batch_id, domain_blob = target.split(":", 2)
        domains = [item.strip().lower() for item in domain_blob.split(",") if item.strip()]
        query = query.eq("import_batch_id", batch_id)
        if len(domains) == 1:
            query = query.eq("email_domain", domains[0])
        elif domains:
            query = query.in_("email_domain", domains)
        audience_label = f"Batch domains: {', '.join(domains[:3])}"
    elif target.startswith("batch_domain:"):
        _, batch_id, domain = target.split(":", 2)
        query = query.eq("import_batch_id", batch_id).eq("email_domain", domain.strip().lower())
        audience_label = f"Batch domain: {domain}"
    elif target.startswith("domains:"):
        domains = [item.strip().lower() for item in target.split("domains:", 1)[1].split(",") if item.strip()]
        if len(domains) == 1:
            query = query.eq("email_domain", domains[0])
        elif domains:
            query = query.in_("email_domain", domains)
        audience_label = f"Domains: {', '.join(domains[:3])}"
    elif target.startswith("domain:"):
        domain = target.split("domain:", 1)[1].strip().lower()
        query = query.eq("email_domain", domain)
        audience_label = f"Domain: {domain}"
    elif target.startswith("batch:"):
        batch_id = target.split("batch:", 1)[1]
        query = query.eq("import_batch_id", batch_id)
        audience_label = f"Batch: {batch_id[:8]}..."
    elif target != "all":
        list_members = supabase.table("list_members").select("contact_id").eq("list_id", target).execute()
        if list_members.data:
            contact_ids = [member["contact_id"] for member in list_members.data]
            query = query.in_("id", contact_ids)
        else:
            query = query.eq("id", "00000000-0000-0000-0000-000000000000")
        audience_label = "Selected List"

    return query, audience_label


def fetch_contacts_for_target(
    supabase: Any,
    tenant_id: str,
    target: str = "all",
    exclude_suppressed: bool = False,
) -> Tuple[List[Dict[str, Any]], str]:
    """Load ALL contacts into memory. Safe for small lists; use stream_contacts_for_target for large audiences."""
    query, audience_label = build_contacts_query(
        supabase=supabase,
        tenant_id=tenant_id,
        target=target,
        exclude_suppressed=exclude_suppressed,
    )
    result = query.execute()
    return result.data or [], audience_label


async def stream_contacts_for_target(
    tenant_id: str,
    target: str = "all",
    exclude_suppressed: bool = False,
    page_size: int = 500,
) -> AsyncIterator[List[Dict[str, Any]]]:
    """
    Fix 8 — Cursor-based streaming audience loader.

    Yields contacts in pages of `page_size` rows without ever loading
    the full audience into memory. Safe for 1M+ contact lists.

    Uses asyncpg directly (bypasses Supabase PostgREST HTTP limit).
    Falls back to an empty stream if the asyncpg pool is not ready.

    Usage:
        async for page in stream_contacts_for_target(tenant_id, target):
            for contact in page:
                process(contact)
    """
    try:
        from utils.db_engine import get_pool
        pool = get_pool()
    except RuntimeError:
        # asyncpg pool not initialised (e.g. running in scheduler before API starts)
        return

    # Build SQL filter clause based on target
    where_clauses = ["c.tenant_id = $1"]
    params: list = [tenant_id]
    idx = 2  # next param index

    if exclude_suppressed:
        where_clauses.append("c.status NOT IN ('bounced', 'unsubscribed')")

    if target.startswith("batch:"):
        batch_id = target.split("batch:", 1)[1]
        where_clauses.append(f"c.import_batch_id = ${idx}")
        params.append(batch_id)
        idx += 1
    elif target.startswith("domain:"):
        domain = target.split("domain:", 1)[1].strip().lower()
        where_clauses.append(f"c.email_domain = ${idx}")
        params.append(domain)
        idx += 1
    elif target.startswith("domains:"):
        domains = [d.strip().lower() for d in target.split("domains:", 1)[1].split(",") if d.strip()]
        where_clauses.append(f"c.email_domain = ANY(${idx}::text[])")
        params.append(domains)
        idx += 1
    # "all" and unknown targets: no extra filter

    where_sql = " AND ".join(where_clauses)
    sql = f"""
        SELECT c.id, c.email, c.first_name, c.last_name
        FROM public.contacts c
        WHERE {where_sql}
        ORDER BY c.id
    """

    async with pool.acquire() as conn:
        # SET LOCAL for RLS so the pool connection is scoped to this tenant
        async with conn.transaction():
            await conn.execute("SET LOCAL app.current_tenant_id = $1", tenant_id)
            # Server-side cursor — streams rows without loading all into memory
            async with conn.transaction():
                cursor = await conn.cursor(sql, *params)
                while True:
                    rows = await cursor.fetch(page_size)
                    if not rows:
                        break
                    yield [
                        {
                            "id": str(r["id"]),
                            "email": r["email"],
                            "first_name": r["first_name"],
                            "last_name": r["last_name"],
                        }
                        for r in rows
                    ]


def claim_scheduled_campaign(supabase: Any, campaign_id: str, tenant_id: str, claimed_at: str | None = None) -> bool:
    result = (
        supabase.table("campaigns")
        .update({"status": "sending"})
        .eq("id", campaign_id)
        .eq("tenant_id", tenant_id)
        .eq("status", "scheduled")
        .execute()
    )
    return bool(result.data)


def _resolve_domain_name(supabase: Any, campaign: Dict[str, Any], tenant_id: str) -> str:
    joined = campaign.get("domains") or {}
    domain_name = joined.get("domain_name") if isinstance(joined, dict) else None
    if domain_name:
        return domain_name

    domain_id = campaign.get("domain_id")
    if not domain_id:
        return ""

    result = (
        supabase.table("domains")
        .select("domain_name")
        .eq("id", str(domain_id))
        .eq("tenant_id", tenant_id)
        .execute()
    )
    if not result.data:
        return ""
    return result.data[0].get("domain_name") or ""


async def queue_campaign_dispatch(
    supabase: Any,
    mq_client: Any,
    campaign: Dict[str, Any],
    tenant_id: str,
    contacts: List[Dict[str, Any]],
    redis_client: Any | None = None,
    mark_campaign_sending: bool = False,
    touch_scheduled_at: bool = False,
) -> Dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    campaign_id = campaign["id"]

    if mark_campaign_sending:
        update_payload: Dict[str, Any] = {"status": "sending"}
        if touch_scheduled_at:
            update_payload["scheduled_at"] = now_iso
        supabase.table("campaigns").update(update_payload).eq("id", campaign_id).execute()

    if redis_client is not None:
        await redis_client.set_campaign_status(campaign_id, "SENDING")

    snapshot_id = str(uuid.uuid4())
    supabase.table("campaign_snapshots").insert(
        {
            "id": snapshot_id,
            "campaign_id": campaign_id,
            "body_snapshot": campaign.get("body_html", ""),
            "subject_snapshot": campaign.get("subject", ""),
            "created_at": now_iso,
        }
    ).execute()

    domain_name = _resolve_domain_name(supabase, campaign, tenant_id)
    if not domain_name:
        raise ValueError("Campaign has no associated verified domain.")

    dispatch_records: List[Dict[str, Any]] = []
    tasks: List[Dict[str, Any]] = []

    for contact in contacts:
        dispatch_id = str(uuid.uuid4())
        html_content = process_merge_tags(process_spintax(campaign.get("body_html", "")), contact)
        subject = process_merge_tags(process_spintax(campaign.get("subject", "")), contact)

        dispatch_records.append(
            {
                "id": dispatch_id,
                "campaign_id": campaign_id,
                "subscriber_id": contact["id"],
                "status": "PENDING",
                "created_at": now_iso,
                "updated_at": now_iso,
            }
        )

        tasks.append(
            {
                "dispatch_id": dispatch_id,
                "campaign_id": campaign_id,
                "tenant_id": tenant_id,
                "recipient_email": contact["email"],
                "recipient_id": contact["id"],
                "subject": subject,
                "body_html": html_content,
                "from_name": campaign.get("from_name", "Email Engine"),
                "from_email": f"{campaign.get('from_prefix', 'noreply')}@{domain_name}",
            }
        )

    chunk_size = 1000
    for index in range(0, len(dispatch_records), chunk_size):
        supabase.table("campaign_dispatch").insert(dispatch_records[index:index + chunk_size]).execute()

    await mq_client.publish_tasks(tasks)

    return {
        "snapshot_id": snapshot_id,
        "dispatched": len(tasks),
    }

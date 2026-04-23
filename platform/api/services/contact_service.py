"""
Contact Service Layer
Business logic for contact management, validation, and plan limit enforcement

Production Hardened:
- Accurate plan limits (subtracts existing contacts before enforcing)
- Batch chunking for large uploads (500 per batch)
- Email validation
- Deduplication
- Structured logging
- Contact status management (subscribed/unsubscribed/bounced/complained)
"""
from typing import Any, Dict, List, Optional, Tuple
from utils.supabase_client import db  # type: ignore
import re
import logging
from collections import Counter
from difflib import get_close_matches

logger = logging.getLogger("email_engine.contacts")

BATCH_SIZE = 500  # Chunk size for bulk upsert
COMMON_EMAIL_DOMAINS = {
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "proton.me",
    "protonmail.com",
    "aol.com",
    "live.com",
    "msn.com",
    "edu.in",
}

class ContactService:
    @staticmethod
    def normalize_domains(domains: Optional[List[str]]) -> List[str]:
        """Normalize, deduplicate, and discard blank domain filters."""
        if not domains:
            return []

        normalized: List[str] = []
        seen = set()
        for domain in domains:
            value = (domain or "").strip().lower()
            if not value or value in seen:
                continue
            seen.add(value)
            normalized.append(value)
        return normalized

    @staticmethod
    def extract_email_domain(email: str) -> Optional[str]:
        """Extract and normalize the domain portion of an email address."""
        if not email or "@" not in email:
            return None

        _, domain = email.rsplit("@", 1)
        normalized = domain.strip().lower()
        return normalized or None

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format using regex"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email.strip()))
    
    @staticmethod
    def check_plan_limits(tenant_id: str, additional_count: int = 0) -> Tuple[bool, Dict]:
        """
        Check if tenant can add more contacts within their plan limit.
        Returns: (can_add: bool, stats: dict)
        """
        # Get current count
        result = db.client.table("contacts")\
            .select("id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .execute()
        
        current_count = result.count or 0
        
        # Get max limit from the tenant's current plan
        tenant = db.client.table("tenants")\
            .select("plan_id, plans!tenants_plan_id_fkey(max_contacts)")\
            .eq("id", tenant_id)\
            .single()\
            .execute()
        
        # Default fallback to 500 (Free plan limit) if relation is totally broken
        max_contacts = 500
        if tenant.data and tenant.data.get("plans"):
            max_contacts = tenant.data["plans"].get("max_contacts", 500)
            
        can_add = (current_count + additional_count) <= max_contacts
        
        return can_add, {
            "current": current_count,
            "limit": max_contacts,
            "available": max_contacts - current_count,
            "requested": additional_count
        }
    
    @staticmethod
    def _count_existing_emails(tenant_id: str, emails: List[str]) -> int:
        """
        Count how many of the given emails already exist in the DB for this tenant.
        This is used to calculate accurate plan limits (only count genuinely new contacts).
        """
        if not emails:
            return 0
        
        # Query in batches of 100 to avoid query size limits
        existing_count = 0
        for i in range(0, len(emails), 100):
            batch = emails[i:i+100]  # type: ignore
            result = db.client.table("contacts")\
                .select("email", count="exact")\
                .eq("tenant_id", tenant_id)\
                .in_("email", batch)\
                .execute()
            existing_count += (result.count or 0)
        
        return existing_count
    
    @staticmethod
    def _get_existing_email_set(tenant_id: str, emails: List[str]) -> set:
        """Return a set of emails that already exist for this tenant."""
        existing = set()
        if not emails:
            return existing
        for i in range(0, len(emails), 100):
            batch = emails[i:i+100]
            result = db.client.table("contacts")\
                .select("email")\
                .eq("tenant_id", tenant_id)\
                .in_("email", batch)\
                .execute()
            for row in result.data or []:
                if row.get("email"):
                    existing.add(row["email"])
        return existing

    @staticmethod
    def get_contacts(
        tenant_id: str,
        jwt_payload: Any,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        batch_id: Optional[str] = None,
        domains: Optional[List[str]] = None
    ) -> Dict:
        """
        Get paginated contacts with optional search and batch filter.
        """
        offset = (page - 1) * limit
        
        query = db.client.table("contacts")\
            .select("id, email, email_domain, first_name, last_name, custom_fields, tags, status, created_at", count="exact")\
            .eq("tenant_id", tenant_id)

        from utils.jwt_middleware import apply_data_isolation
        query = apply_data_isolation(query, jwt_payload)

        if batch_id:
            query = query.eq("import_batch_id", batch_id)

        normalized_domains = ContactService.normalize_domains(domains)
        if normalized_domains:
            if len(normalized_domains) == 1:
                query = query.eq("email_domain", normalized_domains[0])
            else:
                query = query.in_("email_domain", normalized_domains)

        if search:
            query = query.or_(f"email.ilike.%{search}%,first_name.ilike.%{search}%,last_name.ilike.%{search}%")
        
        query = query.order("created_at", desc=True)\
            .range(offset, offset + limit - 1)
        
        result = query.execute()
        
        total = result.count or 0
        total_pages = (total + limit - 1) // limit if total else 0
        
        return {
            "data": result.data,
            "meta": {
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
                "active_domains": normalized_domains
            }
        }

    @staticmethod
    def suggest_domain_correction(domain: Optional[str], known_domains: Optional[List[str]] = None) -> Optional[Dict]:
        """Suggest a likely correction for suspicious typo domains."""
        if not domain:
            return None

        normalized = domain.strip().lower()
        if not normalized or normalized in COMMON_EMAIL_DOMAINS:
            return None

        candidates = sorted(set(COMMON_EMAIL_DOMAINS).union(set(known_domains or [])))
        match = get_close_matches(normalized, candidates, n=1, cutoff=0.84)
        if not match or match[0] == normalized:
            return None

        return {
            "suggested_domain": match[0],
            "reason": "Possible domain typo"
        }
    
    @staticmethod
    def bulk_upsert(tenant_id: str, contacts: List[Dict], import_batch_id: Optional[str] = None) -> Dict:
        """
        Bulk insert/update contacts with validation.
        
        Production logic:
        1. Validate emails
        2. Deduplicate within batch
        3. Query DB for existing emails → count only NEW contacts
        4. Enforce plan limits on NEW contacts only
        5. Upsert in batches of 500
        """
        logger.info(f"[IMPORT_START] tenant={tenant_id} total_rows={len(contacts)} batch_id={import_batch_id}")
        valid_contacts = []
        invalid_contacts = []
        
        for idx, contact in enumerate(contacts):
            email = contact.get("email", "").strip()
            
            if not email or not ContactService.validate_email(email):
                invalid_contacts.append({
                    "row": idx + 1,
                    "email": email,
                    "first_name": contact.get("first_name", ""),
                    "last_name": contact.get("last_name", ""),
                    "reason": "Invalid email format"
                })
                continue
            
            row = {
                "tenant_id": tenant_id,
                "email": email.lower(),
                "email_domain": ContactService.extract_email_domain(email),
                "first_name": contact.get("first_name", "").strip() or None,
                "last_name": contact.get("last_name", "").strip() or None
            }
            if "created_by_user_id" in contact:
                row["created_by_user_id"] = contact["created_by_user_id"]
            if import_batch_id:
                row["import_batch_id"] = import_batch_id
            if contact.get("custom_fields"):
                row["custom_fields"] = contact["custom_fields"]
            valid_contacts.append(row)
        
        # Deduplicate within batch (keep first occurrence)
        seen = set()
        unique_contacts = []
        for contact in valid_contacts:
            email_lower = contact["email"]
            if email_lower not in seen:
                seen.add(email_lower)
                unique_contacts.append(contact)
        
        # Count how many already exist in DB → only NEW ones count against limit
        all_emails = [str(c["email"]) for c in unique_contacts if c.get("email")]
        existing_emails = ContactService._get_existing_email_set(tenant_id, all_emails)
        existing_count = len(existing_emails)
        new_count = len(unique_contacts) - existing_count
        
        # Enforce plan limits on genuinely NEW contacts only
        if new_count > 0:
            can_add, stats = ContactService.check_plan_limits(tenant_id, new_count)
            if not can_add:
                logger.warning(f"[IMPORT_LIMIT] tenant={tenant_id} current={stats['current']} limit={stats['limit']} requested={new_count}")
                return {
                    "success": 0,
                    "failed": len(contacts),
                    "errors": [{
                        "reason": f"Plan limit exceeded. Current: {stats['current']}, Limit: {stats['limit']}, New contacts: {new_count}"
                    }]
                }
        
        # Upsert in batches of BATCH_SIZE
        total_inserted = 0
        total_updated = existing_count
        if unique_contacts:
            for i in range(0, len(unique_contacts), BATCH_SIZE):
                batch_slice = unique_contacts[i:i + BATCH_SIZE]  # type: ignore
                # Split into new vs existing so we don't overwrite import_batch_id for existing contacts
                new_rows = []
                existing_rows = []
                for row in batch_slice:
                    if row["email"] in existing_emails:
                        r = row.copy()
                        r.pop("import_batch_id", None)  # keep original batch association
                        existing_rows.append(r)
                    else:
                        new_rows.append(row)
                try:
                    if new_rows:
                        result = db.client.table("contacts")\
                            .upsert(new_rows, on_conflict="tenant_id,email")\
                            .execute()
                        total_inserted += len(result.data) if result.data else 0
                    if existing_rows:
                        db.client.table("contacts")\
                            .upsert(existing_rows, on_conflict="tenant_id,email")\
                            .execute()
                except Exception as e:
                    logger.error(f"[IMPORT_ERROR] tenant={tenant_id} batch_chunk={i//BATCH_SIZE + 1} error={str(e)}")
                    return {
                        "success": total_inserted,
                        "failed": len(contacts) - total_inserted,
                        "errors": [{"reason": f"Database error at batch {i//BATCH_SIZE + 1}: {str(e)}"}]
                    }
        
        logger.info(f"[IMPORT_END] tenant={tenant_id} success={total_inserted} failed={len(invalid_contacts)} new={new_count} updated={existing_count}")

        return {
            "total": len(contacts),
            "success": total_inserted + existing_count,
            "new": new_count,
            "updated": existing_count,
            "skipped_duplicates": len(valid_contacts) - len(unique_contacts),
            "failed": len(invalid_contacts),
            "errors": invalid_contacts
        }

    # ===== DELETE OPERATIONS =====

    @staticmethod
    def delete_bulk(tenant_id: str, contact_ids: List[str]) -> int:
        """
        Delete selected contacts by IDs (tenant-scoped).
        Single SQL statement — no row-by-row loop.
        """
        if not contact_ids:
            return 0

        result = db.client.table("contacts")\
            .delete()\
            .eq("tenant_id", tenant_id)\
            .in_("id", contact_ids)\
            .execute()

        deleted = len(result.data) if result.data else 0
        logger.info(f"[BULK_DELETE] tenant={tenant_id} requested={len(contact_ids)} deleted={deleted}")
        return deleted

    @staticmethod
    def delete_all(tenant_id: str) -> int:
        """
        Delete ALL contacts for a tenant (tenant reset).
        Single SQL statement.
        """
        result = db.client.table("contacts")\
            .delete()\
            .eq("tenant_id", tenant_id)\
            .execute()

        deleted = len(result.data) if result.data else 0
        logger.warning(f"[DELETE_ALL] tenant={tenant_id} deleted={deleted}")
        return deleted

    @staticmethod
    def delete_by_batch(tenant_id: str, batch_id: str) -> int:
        """
        Delete all contacts from a specific import batch (tenant-scoped).
        Single SQL statement.
        """
        result = db.client.table("contacts")\
            .delete()\
            .eq("tenant_id", tenant_id)\
            .eq("import_batch_id", batch_id)\
            .execute()

        deleted = len(result.data) if result.data else 0
        logger.info(f"[DELETE_BATCH] tenant={tenant_id} batch={batch_id} deleted={deleted}")
        return deleted

    @staticmethod
    def get_subscribable_contacts(tenant_id: str) -> List[Dict]:
        """
        Get all contacts eligible for campaigns (status = 'subscribed').
        Used by Phase 3 Campaign Engine.
        """
        result = db.client.table("contacts")\
            .select("id, email, first_name, last_name")\
            .eq("tenant_id", tenant_id)\
            .eq("status", "subscribed")\
            .execute()

        return result.data or []

    # ===== PHASE 2: TAGS, SUPPRESSION, AND EXPORT =====

    @staticmethod
    def update_tags(tenant_id: str, contact_id: str, tags: List[str]) -> Dict:
        """Update the tags array for a specific contact."""
        result = db.client.table("contacts")\
            .update({"tags": tags})\
            .eq("tenant_id", tenant_id)\
            .eq("id", contact_id)\
            .execute()
        return result.data[0] if result.data else {}

    @staticmethod
    def update_contact(
        tenant_id: str,
        contact_id: str,
        email: str,
        custom_fields: Optional[Dict[str, Any]] = None
    ) -> Dict:
        """Update a contact email and custom fields."""
        normalized_email = email.strip().lower()
        if not normalized_email or not ContactService.validate_email(normalized_email):
            raise ValueError("Invalid email format")

        payload: Dict[str, Any] = {
            "email": normalized_email,
            "email_domain": ContactService.extract_email_domain(normalized_email),
            "custom_fields": custom_fields or {}
        }

        result = db.client.table("contacts")\
            .update(payload)\
            .eq("tenant_id", tenant_id)\
            .eq("id", contact_id)\
            .execute()

        return result.data[0] if result.data else {}

    @staticmethod
    def get_suppression_list(tenant_id: str, jwt_payload: Any, page: int = 1, limit: int = 50) -> Dict:
        """Get contacts mapped to bounced or unsubscribed status."""
        offset = (page - 1) * limit
        
        result = db.client.table("contacts")\
            .select("id, email, first_name, last_name, status, bounce_reason, created_at", count="exact")\
            .eq("tenant_id", tenant_id)\
            .in_("status", ["bounced", "unsubscribed", "complained"])
            
        from utils.jwt_middleware import apply_data_isolation
        result = apply_data_isolation(result, jwt_payload)
            
        result = result.order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
            
        total = result.count or 0
        total_pages = (total + limit - 1) // limit if total else 0
        
        return {
            "data": result.data,
            "meta": {
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages
            }
        }

    @staticmethod
    def get_domain_summary(tenant_id: str, limit: int = 12, batch_id: Optional[str] = None) -> Dict:
        """
        Return the most common contact domains for a tenant.
        This is currently aggregated in Python from tenant-scoped contact rows.
        """
        query = db.client.table("contacts")\
            .select("email_domain")\
            .eq("tenant_id", tenant_id)

        if batch_id:
            query = query.eq("import_batch_id", batch_id)

        result = query.execute()

        domains = [
            row.get("email_domain", "").strip().lower()
            for row in (result.data or [])
            if row.get("email_domain")
        ]
        counts = Counter(domains)
        top_domains = [
            {
                "domain": domain,
                "count": count,
                **(ContactService.suggest_domain_correction(domain, list(counts.keys())) or {})
            }
            for domain, count in counts.most_common(limit)
        ]

        return {
            "data": top_domains,
            "meta": {
                "total_domains": len(counts),
                "contacts_with_domain": len(domains)
            }
        }

    @staticmethod
    def export_contacts(tenant_id: str, batch_id: Optional[str] = None) -> str:
        """Fetch all contacts for export and return CSV format string."""
        import csv
        import io
        
        query = db.client.table("contacts")\
            .select("email, first_name, last_name, status, bounce_reason, custom_fields, tags, created_at")\
            .eq("tenant_id", tenant_id)
            
        if batch_id:
            query = query.eq("import_batch_id", batch_id)
            
        result = query.execute()
            
        contacts = result.data or []
        
        # Determine all possible custom fields across all contacts
        all_custom_keys = set()
        for c in contacts:
            custom_fields = c.get("custom_fields")
            if isinstance(custom_fields, dict):
                all_custom_keys.update(custom_fields.keys())
        
        custom_keys = sorted(list(all_custom_keys))
        
        # Build headers
        headers = ["Email", "First Name", "Last Name", "Status", "Bounce Reason", "Tags", "Date Added"] + custom_keys
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        
        for c in contacts:
            row = [
                c.get("email", ""),
                c.get("first_name", ""),
                c.get("last_name", ""),
                c.get("status", ""),
                c.get("bounce_reason", ""),
                ", ".join(c.get("tags") or []),
                c.get("created_at", "")
            ]
            
            # Append custom fields dynamically
            c_custom = c.get("custom_fields") or {}
            for key in custom_keys:
                row.append(c_custom.get(key, ""))
                
            writer.writerow(row)
            
        return output.getvalue()

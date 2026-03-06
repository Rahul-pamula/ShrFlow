"""
Unsubscribe Token Utility
Generates and verifies signed HMAC tokens for unsubscribe links.
Format: base64url(contact_id:campaign_id:hmac_sha256)
"""
import hmac
import hashlib
import base64
import os

_SECRET = os.getenv("UNSUBSCRIBE_SECRET", "dev-unsub-secret-change-in-production")

def generate_unsub_token(contact_id: str, campaign_id: str) -> str:
    payload = f"{contact_id}:{campaign_id}"
    sig = hmac.new(_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    token = base64.urlsafe_b64encode(f"{payload}:{sig}".encode()).decode()
    return token

def verify_unsub_token(token: str):
    """
    Returns (contact_id, campaign_id) if valid, raises ValueError if not.
    """
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
        parts = decoded.rsplit(":", 3)
        if len(parts) != 3:
            raise ValueError("Invalid token format")
        contact_id, campaign_id, sig = parts
        expected = hmac.new(_SECRET.encode(), f"{contact_id}:{campaign_id}".encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            raise ValueError("Invalid token signature")
        return contact_id, campaign_id
    except Exception:
        raise ValueError("Invalid or expired unsubscribe token")

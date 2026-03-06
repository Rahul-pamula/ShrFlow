"""
Shared Rate Limiter instance (Phase 7.5)
Extracted to avoid circular imports between main.py and route modules.
"""
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
limiter = Limiter(key_func=get_remote_address, storage_uri=REDIS_URL)

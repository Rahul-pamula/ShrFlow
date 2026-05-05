import os
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseManager:
    def __init__(self):
        url: str = os.getenv("SUPABASE_URL")
        key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            # Fallback for local dev if .env is missing in the subfolder
            # In production, these are env vars
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

        # Force HTTP/1.1 for stability
        http1_transport = httpx.HTTPTransport(http2=False)
        http1_client = httpx.Client(transport=http1_transport, timeout=30.0)

        self.client: Client = create_client(url, key)
        self.client.postgrest.session = http1_client

db = SupabaseManager()

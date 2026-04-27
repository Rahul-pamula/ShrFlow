import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing credentials")
    exit(1)

client = create_client(url, key)

try:
    # Test if exec_sql RPC exists
    res = client.rpc("exec_sql", {"query": "SELECT 1"}).execute()
    print("RPC exec_sql exists!")
except Exception as e:
    print(f"RPC exec_sql error: {e}")

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables from .env
load_dotenv()

def run():
    if len(sys.argv) < 2:
        print("Usage: python scripts/apply_sql.py <path_to_sql_file>")
        return

    sql_file = sys.argv[1]
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
        return

    if not os.path.exists(sql_file):
        print(f"❌ Error: File not found: {sql_file}")
        return

    print(f"🚀 Connecting to Supabase...")
    client = create_client(url, key)

    print(f"📜 Reading {sql_file}...")
    with open(sql_file, "r") as f:
        sql = f.read()

    print("▶️ Executing SQL migration...")
    try:
        # We use the RPC 'exec_sql' which is expected to be defined in Supabase
        # If it doesn't exist, this will fail.
        result = client.rpc("exec_sql", {"query": sql}).execute()
        print("✅ Success! Migration applied successfully.")
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        print("\nNote: Ensure the 'exec_sql' RPC exists in your Supabase database.")

if __name__ == "__main__":
    run()

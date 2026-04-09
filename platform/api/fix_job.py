import asyncio
from utils.supabase_client import db

async def fix():
    res = db.client.table("jobs").update({"status": "failed", "error_log": "Crashed before fix applied"}).eq("status", "pending").execute()
    print(f"Fixed {len(res.data)} stuck jobs.")

if __name__ == "__main__":
    asyncio.run(fix())

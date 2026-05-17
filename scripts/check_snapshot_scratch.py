import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("No DATABASE_URL found.")
        return
        
    conn = await asyncpg.connect(db_url, statement_cache_size=0)
    
    print("--- RECENT SNAPSHOTS ---")
    snapshots = await conn.fetch("SELECT id, body_snapshot FROM campaign_snapshots ORDER BY created_at DESC LIMIT 1")
    for s in snapshots:
        print(f"ID: {s['id']}")
        body = s['body_snapshot'] or ''
        print(f"Contains 'Email Engine Inc': {'Email Engine Inc' in body}")
        if 'Email Engine Inc' in body:
            idx = body.find('Email Engine Inc')
            start = max(0, idx - 100)
            end = min(len(body), idx + 100)
            print(f"Snippet: {body[start:end]}")
        
    await conn.close()

asyncio.run(main())

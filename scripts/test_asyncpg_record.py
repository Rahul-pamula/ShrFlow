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
    
    row = await conn.fetchrow("SELECT company_name FROM tenants LIMIT 1")
    print(f"Row type: {type(row)}")
    print(f"Row keys: {row.keys()}")
    
    try:
        val = row.get("company_name")
        print(f"row.get('company_name') = {val}")
    except Exception as e:
        print(f"row.get() failed: {type(e).__name__}: {e}")
        
    try:
        val = row.get("nonexistent")
        print(f"row.get('nonexistent') = {val}")
    except Exception as e:
        print(f"row.get('nonexistent') failed: {type(e).__name__}: {e}")
        
    await conn.close()

asyncio.run(main())

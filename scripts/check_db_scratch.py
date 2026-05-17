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
        
    conn = await asyncpg.connect(db_url)
    
    print("--- TENANTS TABLE ---")
    tenants = await conn.fetch("SELECT id, company_name, business_address, business_city, business_state, business_zip, business_country FROM tenants")
    for t in tenants:
        print(dict(t))
        
    print("\n--- RECENT EMAIL TASKS ---")
    tasks = await conn.fetch("SELECT id, tenant_id FROM email_tasks ORDER BY created_at DESC LIMIT 3")
    for t in tasks:
        print(dict(t))
        
    await conn.close()

asyncio.run(main())

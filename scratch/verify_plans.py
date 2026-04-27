import asyncio
import os
import asyncpg

async def verify():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = await asyncpg.connect(db_url)
        rows = await conn.fetch("SELECT name, price_monthly, max_contacts, max_monthly_emails FROM plans ORDER BY price_monthly")
        print("\n--- Current Plans ---")
        for r in rows:
            print(f"Name: {r['name']:<10} | Price: ₹{r['price_monthly']:<5} | Contacts: {r['max_contacts']:<8} | Emails: {r['max_monthly_emails']}")
        await conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(verify())

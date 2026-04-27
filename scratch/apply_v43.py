import asyncio
import os
import asyncpg

async def run_migration():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = await asyncpg.connect(db_url)
        with open("043_pricing_v2_final.sql", "r") as f:
            sql = f.read()
            print("Applying migration 043 using asyncpg...")
            await conn.execute(sql)
            print("✅ Migration applied successfully!")
        await conn.close()
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        exit(1)

if __name__ == "__main__":
    asyncio.run(run_migration())

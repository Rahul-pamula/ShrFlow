import asyncio
import os
import asyncpg
import sys

async def run_migration(filename):
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = await asyncpg.connect(db_url)
        with open(filename, "r") as f:
            sql = f.read()
            print(f"Applying migration {filename} using asyncpg...")
            await conn.execute(sql)
            print("✅ Migration applied successfully!")
        await conn.close()
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python apply_sql.py <filename>")
        exit(1)
    asyncio.run(run_migration(sys.argv[1]))

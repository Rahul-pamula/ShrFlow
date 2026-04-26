import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import asyncpg

# Load .env from root
ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(dotenv_path=ROOT_DIR / ".env")

async def run_sql_direct():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ Error: Missing DATABASE_URL in .env")
        return

    sql_file = ROOT_DIR / "migrations" / "041_add_missing_tenant_columns.sql"
    if not sql_file.exists():
        print(f"❌ Error: Migration file not found: {sql_file}")
        return

    print(f"🚀 Connecting to database...")
    conn = await asyncpg.connect(database_url)
    
    try:
        print(f"📜 Reading {sql_file.name}...")
        with open(sql_file, "r") as f:
            sql = f.read()

        print("▶️ Executing SQL migration direct via asyncpg...")
        await conn.execute(sql)
        print("✅ Success! Missing columns added to 'tenants' table.")
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_sql_direct())

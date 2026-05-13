"""Add expires_at column to audit_logs table."""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from root
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(dotenv_path=ROOT_DIR / ".env")

DB_URL = os.environ.get("DATABASE_URL")

SQL = """
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_audit_logs_expires ON audit_logs(expires_at);
"""

async def run():
    if not DB_URL:
        print("ERROR: DATABASE_URL not set")
        return
    conn = await asyncpg.connect(DB_URL, statement_cache_size=0)
    try:
        await conn.execute(SQL)
        print("SUCCESS — audit_logs table updated with expires_at column")
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run())

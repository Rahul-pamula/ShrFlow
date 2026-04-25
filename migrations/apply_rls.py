#!/usr/bin/env python3
"""
apply_rls.py — Apply RLS migration 035 to Supabase
Usage: python migrations/apply_rls.py
"""

import asyncio
import os
import re
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

MIGRATION_FILE = Path(__file__).parent / "035_rls_tenant_isolation.sql"


def split_sql(sql: str) -> list[str]:
    """Split SQL file into individual statements, stripping comments and blanks."""
    # Remove line comments
    sql = re.sub(r'--[^\n]*', '', sql)
    statements = [s.strip() for s in sql.split(';')]
    return [s for s in statements if s]


async def main():
    try:
        import asyncpg
    except ImportError:
        print("ERROR: asyncpg not installed. Run: pip install asyncpg")
        return

    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        print("ERROR: DATABASE_URL not set in .env")
        return

    statements = split_sql(MIGRATION_FILE.read_text())
    print(f"Connecting to database...")

    try:
        conn = await asyncpg.connect(dsn=dsn, statement_cache_size=0)
    except Exception as e:
        print(f"ERROR: Could not connect: {e}")
        return

    print(f"Applying {len(statements)} statements from {MIGRATION_FILE.name}...\n")

    ok = 0
    skipped = 0
    failed = 0

    for i, stmt in enumerate(statements, 1):
        first_line = stmt.split('\n')[0][:80]
        try:
            await conn.execute(stmt)
            print(f"  [{i:02d}] ✅  {first_line}")
            ok += 1
        except Exception as e:
            err = str(e)
            # Table doesn't exist — safe to skip (optional tables)
            if "does not exist" in err and any(
                t in stmt for t in ["email_events", "audit_logs", "campaign_snapshots", "invitations", "jobs"]
            ):
                print(f"  [{i:02d}] ⏭   SKIPPED (table not yet created): {first_line}")
                skipped += 1
            else:
                print(f"  [{i:02d}] ❌  FAILED: {err[:120]}")
                print(f"         SQL: {first_line}")
                failed += 1

    await conn.close()

    print(f"\n── Result: {ok} ok · {skipped} skipped · {failed} failed ──")

    # Verify
    print("\n── RLS Policies Created ──")
    try:
        conn2 = await asyncpg.connect(dsn=dsn, statement_cache_size=0)
        rows = await conn2.fetch("""
            SELECT tablename, policyname, cmd
            FROM pg_policies
            WHERE schemaname = 'public'
              AND policyname LIKE 'rls_%'
            ORDER BY tablename
        """)
        await conn2.close()

        if rows:
            print(f"  {'TABLE':<30} {'POLICY':<45} CMD")
            print("  " + "-" * 82)
            for r in rows:
                print(f"  {r['tablename']:<30} {r['policyname']:<45} {r['cmd']}")
            print(f"\n  Total: {len(rows)} policies active.")
        else:
            print("  No RLS policies found.")
    except Exception as e:
        print(f"  Verification failed: {e}")


if __name__ == "__main__":
    asyncio.run(main())

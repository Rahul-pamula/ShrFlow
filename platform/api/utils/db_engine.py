"""
platform/api/utils/db_engine.py

asyncpg Connection Pool — Phase 1.7 (Fix 5)

WHY THIS EXISTS:
  The Supabase Python client uses PostgREST (HTTP) to talk to Postgres.
  PostgREST cannot set Postgres session variables (SET LOCAL ...).
  Session variables are REQUIRED for Row Level Security (RLS) to work —
  specifically: SET LOCAL app.current_tenant_id = '{tenant_id}'

  asyncpg connects directly to Postgres over TCP, supports session variables,
  and uses a real connection pool — making it 10–100× faster than PostgREST
  for bulk operations.

USAGE (in a FastAPI route):
  from utils.db_engine import get_conn

  async with get_conn(tenant_id="abc-123") as conn:
      rows = await conn.fetch("SELECT id, email FROM contacts LIMIT 10")

  # The RLS policy on 'contacts' automatically filters to tenant "abc-123"
  # because SET LOCAL app.current_tenant_id was called on the connection.

USAGE (raw, no RLS):
  from utils.db_engine import pool
  async with pool.acquire() as conn:
      await conn.execute("SELECT 1")
"""

import os
import asyncpg
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator, Optional

logger = logging.getLogger("email_engine.db_engine")

# ── Pool singleton ─────────────────────────────────────────────────────

_pool: Optional[asyncpg.Pool] = None


async def init_pool() -> None:
    """
    Create the global asyncpg connection pool.
    Call this once at application startup (FastAPI lifespan).

    Pool settings:
      min_size=2   — keep 2 connections warm at all times
      max_size=10  — scale up to 10 connections under load
      max_inactive_connection_lifetime=300  — recycle idle connections every 5 min
        (prevents Supabase from closing idle connections on their side)
    """
    global _pool
    if _pool is not None:
        return  # Already initialised

    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise RuntimeError(
            "DATABASE_URL is not set. asyncpg pool cannot be initialised."
        )

    # Supabase connection pooler (port 6543) uses PgBouncer in transaction mode.
    # In transaction mode, prepared statements are NOT supported.
    # statement_cache_size=0 disables asyncpg's prepared statement cache.
    _pool = await asyncpg.create_pool(
        dsn=dsn,
        min_size=2,
        max_size=10,
        max_inactive_connection_lifetime=300,
        statement_cache_size=0,   # Required for PgBouncer transaction mode
        command_timeout=30,
    )
    logger.info("✅ asyncpg connection pool initialised (min=2, max=10)")


async def close_pool() -> None:
    """Close the pool gracefully. Call at application shutdown."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("asyncpg connection pool closed.")


def get_pool() -> asyncpg.Pool:
    """Return the pool. Raises RuntimeError if init_pool() was not called."""
    if _pool is None:
        raise RuntimeError(
            "asyncpg pool is not initialised. "
            "Call await init_pool() in FastAPI lifespan before using get_pool()."
        )
    return _pool


# ── Tenant-scoped connection context manager ───────────────────────────

@asynccontextmanager
async def get_conn(tenant_id: Optional[str] = None) -> AsyncIterator[asyncpg.Connection]:
    """
    Acquire a connection from the pool and optionally set the RLS tenant context.

    When tenant_id is provided:
      - Sets SET LOCAL app.current_tenant_id = '{tenant_id}' inside a transaction.
      - PostgreSQL RLS policies read this variable to filter rows automatically.
      - The variable is LOCAL to this transaction — it cannot leak to other connections.

    When tenant_id is None:
      - Returns a raw connection with no RLS context (for admin/system queries).

    Example:
      async with get_conn(tenant_id=current_user.tenant_id) as conn:
          contacts = await conn.fetch(
              "SELECT id, email FROM contacts WHERE status = 'active'"
          )
          # RLS ensures only this tenant's contacts are returned,
          # even without an explicit WHERE tenant_id = ... clause.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        if tenant_id:
            # Use a transaction so SET LOCAL is scoped correctly
            async with conn.transaction():
                await conn.execute(
                    "SET LOCAL app.current_tenant_id = $1", tenant_id
                )
                yield conn
        else:
            yield conn


# ── Convenience helpers ────────────────────────────────────────────────

async def fetchrow(sql: str, *args, tenant_id: Optional[str] = None):
    """Fetch a single row. Returns None if not found."""
    async with get_conn(tenant_id=tenant_id) as conn:
        return await conn.fetchrow(sql, *args)


async def fetch(sql: str, *args, tenant_id: Optional[str] = None):
    """Fetch all rows as a list of Record objects."""
    async with get_conn(tenant_id=tenant_id) as conn:
        return await conn.fetch(sql, *args)


async def execute(sql: str, *args, tenant_id: Optional[str] = None):
    """Execute a DML statement (INSERT/UPDATE/DELETE). Returns status string."""
    async with get_conn(tenant_id=tenant_id) as conn:
        return await conn.execute(sql, *args)


async def executemany(sql: str, args_list: list, tenant_id: Optional[str] = None):
    """
    Execute a DML statement for many rows in a single round-trip.
    Used for batch inserts/updates (e.g. batch dispatch row updates).

    args_list: list of tuples, one per row
    """
    async with get_conn(tenant_id=tenant_id) as conn:
        return await conn.executemany(sql, args_list)

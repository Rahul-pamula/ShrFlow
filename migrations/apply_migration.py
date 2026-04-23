"""
Apply Phase 2 migration using Supabase Python client.
Runs ALTER TABLE statements to add columns needed for Contacts Module.
"""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'api'))

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

client = create_client(url, key)

# Run each statement individually
statements = [
    "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE",
    "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name TEXT",
    "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name TEXT",
    "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_domain TEXT",
    "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_contacts INT DEFAULT 1000",
    """CREATE TABLE IF NOT EXISTS contact_custom_fields (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
        field_key TEXT NOT NULL,
        field_value TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(contact_id, field_key)
    )""",
    "CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email ON contacts(tenant_id, email)",
    "CREATE INDEX IF NOT EXISTS idx_contacts_tenant_created ON contacts(tenant_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email_domain ON contacts(tenant_id, email_domain)",
]

print("🔄 Applying Phase 2 migration...")

for i, sql in enumerate(statements):
    try:
        result = client.rpc("exec_sql", {"query": sql}).execute()
        print(f"  ✅ Statement {i+1} applied")
    except Exception as e:
        print(f"  ⚠️ Statement {i+1}: {e}")

print("\n✅ Migration complete!")

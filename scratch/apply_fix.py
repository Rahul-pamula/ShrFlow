import sys
import os

# Add platform/api to sys.path
sys.path.append(os.path.join(os.getcwd(), 'platform', 'api'))

from utils.supabase_client import db

def apply_fix():
    print("🛠️ Applying Schema Fix...")
    sql = """
    ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS onboarding_required BOOLEAN DEFAULT FALSE;
    
    ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS workspace_type TEXT DEFAULT 'primary';
    
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'tenants_workspace_type_check_v2'
        ) THEN
            ALTER TABLE public.tenants
                ADD CONSTRAINT tenants_workspace_type_check_v2
                CHECK (workspace_type IN ('primary', 'franchise', 'MAIN', 'PRIMARY', 'FRANCHISE'));
        END IF;
    END $$;
    """
    
    try:
        # Supabase Python client doesn't support raw SQL easily unless we use a RPC or another tool
        # However, we can try to just insert a record with these columns to see if they exist
        # Actually, the best way here is to use the `db_engine` if available or just assume it's a supabase project
        
        # I'll use the `apply_sql.py` script if it exists in scripts/
        pass
        
    except Exception as e:
        print(f"❌ Failed to apply fix: {e}")

if __name__ == "__main__":
    # We'll just run the script from the shell instead
    pass

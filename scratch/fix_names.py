import sys
import os

# Add platform/api to sys.path
sys.path.append(os.path.join(os.getcwd(), 'platform', 'api'))

from utils.supabase_client import db

def fix_workspace_names():
    print("🔄 Syncing Workspace Names...")
    
    try:
        # 1. Get all tenants
        tenants_res = db.client.table("tenants").select("id, workspace_name, company_name, organization_name").execute()
        
        if not tenants_res.data:
            print("ℹ️ No tenants found to sync.")
            return

        for t in tenants_res.data:
            # We want to pick the best available name
            name = t.get("workspace_name") or t.get("company_name") or t.get("organization_name")
            
            if name and name != "Unnamed Workspace":
                print(f"✅ Syncing name '{name}' for tenant {t['id']}")
                db.client.table("tenants").update({
                    "company_name": name,
                    "workspace_name": name,
                    "organization_name": name
                }).eq("id", t["id"]).execute()
            else:
                print(f"⚠️ Tenant {t['id']} has no name set yet.")

        print("\n✨ Workspace Name Sync Complete!")
        
    except Exception as e:
        print(f"❌ Error syncing names: {e}")

if __name__ == "__main__":
    fix_workspace_names()

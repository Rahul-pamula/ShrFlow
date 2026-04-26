import sys
import os

# Add platform/api to sys.path
sys.path.append(os.path.join(os.getcwd(), 'platform', 'api'))

from utils.supabase_client import db

def reset_db():
    print("🚀 Starting Database Reset...")
    
    # 1. Clear dependent tables first to avoid FK violations
    tables_to_clear = [
        "tenant_users",
        "users",
        "tenants",
        "join_requests",
        "onboarding_progress",
        "campaigns",
        "contacts",
        "email_events",
        "verified_senders",
        "verified_domains",
        "plans" # Now clearing plans too to ensure a truly fresh state
    ]
    
    for table in tables_to_clear:
        try:
            print(f"🧹 Clearing {table}...")
            # We use a filter that matches everything to perform a mass delete
            db.client.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        except Exception as e:
            # Table might not exist or already be empty
            pass

    # 2. Seed the plans (CRITICAL for tenant creation)
    print("\n🌱 Seeding Plans...")
    plans = [
        {"id": "11111111-1111-1111-1111-111111111111", "name": "Free", "max_monthly_emails": 1000, "max_contacts": 500, "allow_custom_domain": False, "price_monthly": 0.00},
        {"id": "22222222-2222-2222-2222-222222222222", "name": "Starter", "max_monthly_emails": 10000, "max_contacts": 5000, "allow_custom_domain": True, "price_monthly": 29.00},
        {"id": "33333333-3333-3333-3333-333333333333", "name": "Pro", "max_monthly_emails": 100000, "max_contacts": 50000, "allow_custom_domain": True, "price_monthly": 99.00},
        {"id": "44444444-4444-4444-4444-444444444444", "name": "Enterprise", "max_monthly_emails": 1000000, "max_contacts": 500000, "allow_custom_domain": True, "price_monthly": 499.00}
    ]
    
    try:
        db.client.table("plans").insert(plans).execute()
        print("✅ Plans seeded successfully.")
    except Exception as e:
        print(f"❌ Failed to seed plans: {e}")

    print("\n📊 Verifying Counts:")
    counts = {
        "users": len(db.client.table("users").select("id").execute().data),
        "tenants": len(db.client.table("tenants").select("id").execute().data),
        "tenant_users": len(db.client.table("tenant_users").select("user_id").execute().data),
        "plans": len(db.client.table("plans").select("id").execute().data)
    }
    
    for table, count in counts.items():
        print(f"✅ {table}: {count}")
        
    if counts["plans"] > 0 and counts["users"] == 0:
        print("\n✨ Database Reset & Seeding Successful! System is ready for first-time signup.")
    else:
        print("\n❌ Database Reset Incomplete.")

if __name__ == "__main__":
    reset_db()

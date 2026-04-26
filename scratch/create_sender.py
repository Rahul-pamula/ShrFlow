import sys
import os
import asyncio
import secrets
from datetime import datetime, timezone, timedelta

# Add platform/api to sys.path
sys.path.append(os.path.join(os.getcwd(), 'platform', 'api'))

from utils.supabase_client import db
from services.email_service import send_sender_verification

async def create_sender():
    tenant_id = "2808c988-9ca5-4459-9a3e-62c48c4f4ddf"
    user_id = "1f39005a-d076-4748-8a46-e6b760129f28"
    email = "sales@rahulpamula.me"
    
    print(f"🚀 Creating sender identity for {email}...")
    
    # 1. Generate token
    token = secrets.token_urlsafe(48)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    
    try:
        # 2. Insert into DB
        res = db.client.table("sender_identities").insert({
            "tenant_id": tenant_id,
            "user_id": user_id,
            "email": email,
            "status": "pending",
            "verification_token": token,
            "token_expires_at": expires_at
        }).execute()
        
        if not res.data:
            print("❌ Failed to insert sender identity.")
            return

        print(f"✅ Sender record created (ID: {res.data[0]['id']})")
        
        # 3. Trigger verification email
        print("📧 Sending verification email...")
        success = await send_sender_verification(email, token)
        
        if success:
            print(f"✨ Verification email sent successfully to {email}!")
        else:
            print(f"⚠️ Failed to send verification email. Please check RabbitMQ/Centralized Worker logs.")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_sender())

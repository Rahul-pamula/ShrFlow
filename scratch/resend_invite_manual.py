import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add platform/api to path
sys.path.append(str(Path(__file__).resolve().parents[1] / "platform" / "api"))

# Load .env
load_dotenv()

from services.email_service import send_team_invite

async def resend():
    
    email = "chatnalyxerteam@gmail.com"
    inviter_name = "Rahul Pamula"
    workspace_name = "rahul_chatnalyxer_pvt"
    token = "BxYfZkTXvhluAg5r06Erpsv3Uk1KFcK-5EK9DDcNKwo"
    
    print(f"🔄 Manually re-triggering invite send to {email}...")
    await send_team_invite(email, inviter_name, workspace_name, token)
    print("✅ Enqueued 'team_invite' task.")

if __name__ == "__main__":
    asyncio.run(resend())

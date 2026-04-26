import asyncio
import aiosmtplib
import os
from email.mime.text import MIMEText
from pathlib import Path
from dotenv import load_dotenv

# Load .env
load_dotenv()

async def test_smtp():
    host = os.getenv("SYSTEM_SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SYSTEM_SMTP_PORT", "587"))
    user = os.getenv("SYSTEM_SMTP_USERNAME", "shrmail.app@gmail.com")
    password = os.getenv("SYSTEM_SMTP_PASSWORD", "")
    from_email = os.getenv("SYSTEM_SMTP_FROM_EMAIL", "shrmail.app@gmail.com")
    
    to_email = "chatnalyxerteam@gmail.com"
    
    print(f"🧪 Testing SMTP to {to_email} via {host}...")
    
    msg = MIMEText("This is a test email from the Email Engine diagnostics.")
    msg["Subject"] = "SMTP Test"
    msg["From"] = from_email
    msg["To"] = to_email
    
    try:
        await aiosmtplib.send(
            msg,
            hostname=host,
            port=port,
            username=user,
            password=password,
            start_tls=True
        )
        print("✅ SMTP Test Successful!")
    except Exception as e:
        print(f"❌ SMTP Test Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_smtp())

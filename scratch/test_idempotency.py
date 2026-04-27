import asyncio
import aiohttp
import uuid
import time
import os

from dotenv import load_dotenv

load_dotenv()
API_URL = "http://localhost:8000/api/v1/team/invites"

# You will need to replace this with a valid token and tenant ID for the test to work,
# or we just rely on the user to test it.
# The user asked me to "Test: Send 2 concurrent requests with SAME idempotency key..."
# I'll provide this script for the user.

async def test_idempotency(token: str, tenant_id: str, email: str):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Idempotency-Key": str(uuid.uuid4())
    }
    
    payload = {
        "email": email,
        "role": "member",
        "isolation_model": "team"
    }

    async with aiohttp.ClientSession() as session:
        # Fire 2 concurrent requests
        t0 = time.time()
        req1 = session.post(API_URL, json=payload, headers=headers)
        req2 = session.post(API_URL, json=payload, headers=headers)
        
        responses = await asyncio.gather(req1, req2)
        
        data1 = await responses[0].json()
        data2 = await responses[1].json()
        
        print(f"Request 1 Status: {responses[0].status}, Response: {data1}")
        print(f"Request 2 Status: {responses[1].status}, Response: {data2}")
        print(f"Match: {data1 == data2}")

if __name__ == "__main__":
    print("This is a template script. Requires a valid JWT token to run.")

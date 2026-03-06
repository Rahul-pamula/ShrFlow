import os
import redis.asyncio as redis
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class RedisManager:
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.client = redis.from_url(redis_url, decode_responses=True)

    async def get_client(self):
        return self.client

    async def set_campaign_status(self, campaign_id: str, status: str):
        """Set the campaign status in Redis (e.g., PAUSED, CANCELLED, SENDING)"""
        key = f"campaign:{campaign_id}:status"
        await self.client.set(key, status)
        logger.info(f"Redis updated: {key} -> {status}")

    async def get_campaign_status(self, campaign_id: str) -> str:
        """Get the current campaign status from Redis"""
        key = f"campaign:{campaign_id}:status"
        status = await self.client.get(key)
        # Default to SENDING if not explicitly paused or cancelled
        return status if status else "SENDING"

    async def close(self):
        await self.client.aclose()

redis_client = RedisManager()

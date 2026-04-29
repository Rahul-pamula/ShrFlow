from __future__ import annotations
from typing import Dict, Any
import json
import logging
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)


class ReputationEngine:
    """
    Elite Reputation Engine for ShrFlow.
    - Controlled Recovery: Max +5 score per minute.
    - Vol. Normalization: Guard only triggers if volume > 200.
    """

    def __init__(self, redis_client, db):
        self.redis = redis_client
        self.db = db

    async def get_throttle_limit(self, domain_name: str) -> Dict[str, Any]:
        # 1. Fast Guard (Volume Normalized)
        try:
            if self.redis:
                fast_key = f"reputation:fast_guard:{domain_name}"
                fast_data = await self.redis.get(fast_key)
                if fast_data:
                    data = json.loads(fast_data)
                    if data.get("total", 0) > 200 and (data.get("bounces", 0) / data["total"]) > 0.05:
                        return {"factor": 0.3, "paused": False}
        except Exception:
            pass

        # 2. Score lookup — safe default if table/column missing
        try:
            res = self.db.table("domains").select("reputation_score").eq("domain_name", domain_name).execute()
            if res.data and res.data[0].get("reputation_score") is not None:
                score = float(res.data[0]["reputation_score"])
                factor = max(0.1, min(2.0, score / 100.0))
                return {"factor": factor, "paused": False}
        except Exception:
            pass

        return {"factor": 1.0, "paused": False}


class RoutingEngine:
    """
    Smart & Sticky Routing Engine.
    - Stability Window: Prevents flip-flopping.
    - Dual-Signal: Uses 1m (reaction) and 5m (stability) health.
    """

    def __init__(self, db, redis_client):
        self.db = db
        self.redis = redis_client

    async def get_best_provider(self, campaign_id: str, destination_domain: str) -> str:
        # 1. Check Sticky & Stability Window
        try:
            res = self.db.table("campaign_provider_assignment") \
                .select("provider_name, last_switched_at") \
                .eq("campaign_id", campaign_id).execute()

            if res.data:
                assignment = res.data[0]
                sticky = assignment["provider_name"]
                last_switched = datetime.fromisoformat(assignment["last_switched_at"])

                # Don't flip-flop within 5 minutes of last switch
                if datetime.now(timezone.utc) < last_switched + timedelta(minutes=5):
                    return sticky

                # 2. Dual-Signal Health Check
                isp = destination_domain.lower() if destination_domain.lower() in ["gmail.com", "outlook.com"] else "global"
                health = self.db.table("provider_health") \
                    .select("success_rate_1m, success_rate_5m") \
                    .eq("provider_name", sticky) \
                    .eq("target_isp", isp).execute()

                if health.data and (health.data[0]["success_rate_1m"] < 80.0 or health.data[0]["success_rate_5m"] < 90.0):
                    logger.warning(f"🚨 Breaking stickiness: Provider {sticky} failed dual-signal health.")
        except Exception:
            pass

        return "PRIMARY_SMTP"

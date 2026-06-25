import time
from datetime import datetime, timezone
from typing import Dict, Optional
import redis.asyncio as aioredis
from app.config import settings

# Global Redis client reference
redis_client: Optional[aioredis.Redis] = None

# Fallback local in-memory dictionaries
memory_requests: Dict[int, int] = {}
memory_errors: Dict[int, int] = {}

async def init_redis_client():
    global redis_client
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis_client.ping()
        print("Telemetry Redis Client connected successfully.")
    except Exception as e:
        print(f"Telemetry Redis connection failed ({e}). Fallback to memory.")
        redis_client = None

async def close_redis_client():
    global redis_client
    if redis_client:
        try:
            await redis_client.close()
        except Exception:
            pass
        redis_client = None

def _incr_memory(bucket: int, is_error: bool):
    global memory_requests, memory_errors
    
    # Prune old entries (older than 2 hours)
    cutoff = int(time.time() / 60) - 120
    memory_requests = {k: v for k, v in memory_requests.items() if k >= cutoff}
    memory_errors = {k: v for k, v in memory_errors.items() if k >= cutoff}
    
    memory_requests[bucket] = memory_requests.get(bucket, 0) + 1
    if is_error:
        memory_errors[bucket] = memory_errors.get(bucket, 0) + 1

async def increment_traffic(is_error: bool):
    minute_bucket = int(time.time() / 60)
    
    if redis_client:
        try:
            req_key = f"bcore_traffic:requests:{minute_bucket}"
            async with redis_client.pipeline(transaction=True) as pipe:
                pipe.incr(req_key)
                pipe.expire(req_key, 7200)
                if is_error:
                    err_key = f"bcore_traffic:errors:{minute_bucket}"
                    pipe.incr(err_key)
                    pipe.expire(err_key, 7200)
                await pipe.execute()
            return
        except Exception:
            pass
            
    # Fallback to local memory
    _incr_memory(minute_bucket, is_error)

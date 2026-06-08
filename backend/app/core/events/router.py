import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from typing import Dict, List, Optional
from uuid import UUID
from jose import jwt
import redis.asyncio as aioredis

from app.database import get_db
from app.config import settings
from app.core.auth.router import get_current_user, RoleTierChecker
from app.core.auth.models import User
from app.core.events.models import EventLog
from app.core.events.schemas import EventLogCreate, EventLogResponse

router = APIRouter(prefix="/events", tags=["Event Engine"])

class ConnectionManager:
    def __init__(self):
        # Maps entity_id (str) -> list of WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.redis_client: Optional[aioredis.Redis] = None
        self.pubsub_task: Optional[asyncio.Task] = None

    async def startup(self):
        try:
            self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            # Ping redis to check connectivity
            await self.redis_client.ping()
            # Start background listener for pub/sub channel
            self.pubsub_task = asyncio.create_task(self._redis_listener())
            print("Event Engine: Redis Pub/Sub Backplane activated successfully.")
        except Exception as e:
            self.redis_client = None
            print(f"Event Engine: Redis connection failed ({e}). Running in localized in-memory mode.")

    async def shutdown(self):
        if self.pubsub_task:
            self.pubsub_task.cancel()
        if self.redis_client:
            await self.redis_client.close()

    async def connect(self, entity_id: str, websocket: WebSocket):
        await websocket.accept()
        if entity_id not in self.active_connections:
            self.active_connections[entity_id] = []
        self.active_connections[entity_id].append(websocket)

    def disconnect(self, entity_id: str, websocket: WebSocket):
        if entity_id in self.active_connections:
            self.active_connections[entity_id].remove(websocket)
            if not self.active_connections[entity_id]:
                del self.active_connections[entity_id]

    async def broadcast(self, entity_id: str, message_dict: dict):
        # Broadcast locally on this server instance
        await self._local_broadcast(entity_id, message_dict)
        # Publish to Redis Pub/Sub for other distributed server instances
        if self.redis_client:
            try:
                payload = {
                    "entity_id": entity_id,
                    "message": message_dict
                }
                await self.redis_client.publish("bcore_events", json.dumps(payload))
            except Exception as e:
                print(f"Event Engine: Redis publish failure ({e})")

    async def _local_broadcast(self, entity_id: str, message_dict: dict):
        if entity_id in self.active_connections:
            # Format payload: { "type": "event_type", "entity_id": "uuid", "payload": { ... } }
            formatted_msg = json.dumps({
                "type": message_dict.get("event_type"),
                "entity_id": entity_id,
                "payload": message_dict.get("payload", {})
            })
            disconnected_sockets = []
            for connection in self.active_connections[entity_id]:
                try:
                    await connection.send_text(formatted_msg)
                except Exception:
                    disconnected_sockets.append(connection)
            
            # Clean up dead sockets
            for socket in disconnected_sockets:
                self.disconnect(entity_id, socket)

    async def _redis_listener(self):
        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe("bcore_events")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    entity_id = data["entity_id"]
                    msg_dict = data["message"]
                    await self._local_broadcast(entity_id, msg_dict)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Event Engine: Redis listener encountered an error ({e})")

manager = ConnectionManager()

# WebSocket Route with query-based JWT Auth
@router.websocket("/ws/{entity_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    entity_id: str,
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication token missing")
        return
        
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise Exception("Invalid payload")
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid credentials")
        return

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_active:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User deactivated or not found")
        return

    await manager.connect(entity_id, websocket)
    try:
        while True:
            # Maintain active connection and process incoming text frames
            data = await websocket.receive_text()
            try:
                msg_payload = json.loads(data)
                
                # Check for blocker beacon resolution rights via WebSocket directly
                event_type = msg_payload.get("event_type", "message")
                if event_type == "resolve_blocker" and user.role_tier > 3:
                    await websocket.send_text(json.dumps({
                        "error": "Access denied: Only Tier 1-3 users can resolve blocker beacons."
                    }))
                    continue
                
                new_event = EventLog(
                    entity_id=UUID(entity_id),
                    entity_type=msg_payload.get("entity_type", "generic"),
                    event_type=event_type,
                    payload=msg_payload.get("payload", {}),
                    created_by=user.id
                )
                db.add(new_event)
                await db.commit()
                await db.refresh(new_event)
                
                broadcast_payload = {
                    "event_type": new_event.event_type,
                    "payload": {
                        "id": str(new_event.id),
                        "created_by": str(user.id),
                        "email": user.email,
                        "created_at": new_event.created_at.isoformat(),
                        **new_event.payload
                    }
                }
                await manager.broadcast(entity_id, broadcast_payload)
            except Exception as e:
                await websocket.send_text(json.dumps({"error": f"Failed to process message: {str(e)}"}))
    except WebSocketDisconnect:
        manager.disconnect(entity_id, websocket)

# REST endpoints for history retrieving and POST injection
@router.post("", response_model=EventLogResponse, status_code=status.HTTP_201_CREATED)
async def post_event(
    event_in: EventLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Blocker Beacon Emergency Protocol Guard
    # Only Tier 1-3 can execute the resolution payload
    if event_in.event_type == "resolve_blocker" and current_user.role_tier > 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Tier 1-3 users can resolve blocker beacons."
        )

    new_event = EventLog(
        entity_id=event_in.entity_id,
        entity_type=event_in.entity_type,
        event_type=event_in.event_type,
        payload=event_in.payload,
        created_by=current_user.id
    )
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)

    # Broadcast to websocket channel
    broadcast_payload = {
        "event_type": new_event.event_type,
        "payload": {
            "id": str(new_event.id),
            "created_by": str(current_user.id),
            "email": current_user.email,
            "created_at": new_event.created_at.isoformat(),
            **new_event.payload
        }
    }
    await manager.broadcast(str(new_event.entity_id), broadcast_payload)

    return new_event

@router.get("/{entity_id}", response_model=List[EventLogResponse])
async def get_event_stream(
    entity_id: UUID,
    limit: int = Query(default=100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_user)
):
    query = (
        select(EventLog)
        .filter(EventLog.entity_id == entity_id)
        .order_by(EventLog.created_at.desc()) # Newest first, or we can fetch newest first and let UI display
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()

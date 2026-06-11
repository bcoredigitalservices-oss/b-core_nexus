import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Core imports
from app.core.events.router import manager as event_manager
from app.core.auth.router import router as auth_router
from app.core.auth.bootstrapper import init_router
from app.core.directory.router import router as directory_router
from app.core.catalog.router import router as catalog_router
from app.core.events.router import router as events_router
from app.core.system.router import router as system_router
from app.core.shell.router import router as shell_router
from app.core.workspace.router import router as workspace_router
from app.core.organization.router import router as organization_router
from app.core.iam.router import router as iam_router
from app.core.workspace.registry import init_workspaces

# ─── Eagerly import core models
from app.models.organization import Department, Organization  # noqa: F401
from app.models.user import User, UserWorkspace  # noqa: F401

# ─── Dynamically import workspace models to ensure mapper relationships configure
from app.core.workspace.loader import load_workspace_models
load_workspace_models()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect WebSockets to Redis Pub/Sub if available
    await event_manager.startup()
    yield
    # Shutdown: Clean up connections
    await event_manager.shutdown()

from datetime import datetime, timezone
from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from app.core.exceptions import CoreERPException
from app.core.schemas import ErrorResponse

app = FastAPI(
    title="B-Core Headless ERP Core",
    description="Headless, Code-First, Instance-Isolated ERP Core",
    version="1.0.0",
    lifespan=lifespan
)

@app.exception_handler(CoreERPException)
async def core_erp_exception_handler(request: Request, exc: CoreERPException):
    error_payload = ErrorResponse(
        error_code=exc.error_code,
        message=exc.message,
        timestamp=datetime.now(timezone.utc),
        path=request.url.path
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_payload.model_dump(mode="json")
    )



# Enable CORS for frontend requests
allowed_origins_str = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_str:
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
else:
    allowed_origins = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time
import uuid
import logging
import json
from app.core.context import set_current_request_id

logger = logging.getLogger("bcore.api")

@app.middleware("http")
async def context_and_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    set_current_request_id(request_id)
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Request-ID"] = request_id
    
    log_payload = {
        "request_id": request_id,
        "method": request.method,
        "path": request.url.path,
        "duration": f"{process_time:.4f}s",
        "status_code": response.status_code
    }
    logger.info(json.dumps(log_payload))
    return response

# 1. Mount Immutable Core Layer
app.include_router(init_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(directory_router, prefix="/api/v1")
app.include_router(catalog_router, prefix="/api/v1")
app.include_router(events_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")
app.include_router(shell_router, prefix="/api/v1")
app.include_router(workspace_router, prefix="/api/v1")
app.include_router(organization_router, prefix="/api/v1")
app.include_router(iam_router, prefix="/api/v1")

# 2. Mount Pluggable Workspace Layer
# Registers all entries in WORKSPACE_REGISTRY under /api/v1/workspaces/<name>
init_workspaces(app)


from typing import Optional
import json
from fastapi import WebSocket, WebSocketDisconnect, Query
from jose import jwt
from app.config import settings
from app.core.events.websocket import ws_manager
from app.database import AsyncSessionLocal
from sqlalchemy.future import select
from app.core.auth.models import User

@app.websocket("/api/v1/stream")
async def global_ws_stream(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    workspace: Optional[str] = Query(None)
):
    if not token:
        await websocket.close(code=4003, reason="Token query parameter required")
        return
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise Exception("Invalid sub")
    except Exception:
        await websocket.close(code=4003, reason="Invalid credentials")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalars().first()
        if not user or not user.is_active:
            await websocket.close(code=4003, reason="User not active")
            return

    await ws_manager.connect(websocket, user_id=user_id, workspace=workspace)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg_payload = json.loads(data)
                if msg_payload.get("type") == "subscribe":
                    ws_manager.update_workspace(websocket, msg_payload.get("workspace"))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "B-Core Nexus",
        "documentation": "/docs"
    }

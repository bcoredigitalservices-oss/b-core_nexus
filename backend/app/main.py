import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Core imports
from app.core.auth.router import router as auth_router
from app.core.auth.bootstrapper import init_router
from app.core.system.router import router as system_router
from app.core.organization.router import router as organization_router
from app.core.iam.router import router as iam_router
from app.core.crm.router import router as crm_router
from app.core.sales.router import router as sales_router
from app.core.tasks.router import router as tasks_router

# ─── Eagerly import core models
from app.models.organization import Department, Organization  # noqa: F401
from app.models.user import User, UserWorkspace  # noqa: F401

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.system.telemetry import init_redis_client, close_redis_client
    await init_redis_client()
    yield
    # Shutdown: Clean up connections
    await close_redis_client()
    # Stop logging listener thread cleanly
    try:
        listener.stop()
    except Exception:
        pass

import re
from datetime import datetime, timezone
from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DataError
from app.core.exceptions import CoreERPException
from app.core.schemas import ErrorResponse

app = FastAPI(
    title="B-Core Headless ERP Core",
    description="Headless, Code-First, Instance-Isolated ERP Core",
    version="1.2.1-alpha",
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

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    orig_msg = str(exc.orig) if exc.orig else str(exc)
    orig_msg_lower = orig_msg.lower()
    
    status_code = 400
    error_code = "INTEGRITY_VIOLATION"
    message = "Database integrity constraint violated."
    
    # 1. Unique Constraint Violation
    if "unique constraint" in orig_msg_lower or "uniqueviolation" in orig_msg_lower or "duplicate key" in orig_msg_lower:
        status_code = 409
        error_code = "UNIQUE_VIOLATION"
        match = re.search(r"Key \((.*?)\)=\(.*?\)", orig_msg)
        if match:
            field = match.group(1)
            message = f"{field.replace('_', ' ').capitalize()} already exists."
        else:
            constraint_match = re.search(r"constraint \"(.*?)\"", orig_msg)
            if constraint_match:
                message = f"Unique constraint violation on '{constraint_match.group(1)}'."
            else:
                message = "Unique constraint violation: resource already exists."
                
    # 2. Foreign Key Constraint Violation
    elif "foreign key" in orig_msg_lower or "foreignkeyviolation" in orig_msg_lower:
        status_code = 422
        error_code = "FOREIGN_KEY_VIOLATION"
        match = re.search(r"Key \((.*?)\)=\(.*?\)", orig_msg)
        if match:
            field = match.group(1)
            message = f"{field.replace('_', ' ').capitalize()} not found."
        else:
            constraint_match = re.search(r"constraint \"(.*?)\"", orig_msg)
            if constraint_match:
                message = f"Referenced relation constraint violation on '{constraint_match.group(1)}'."
            else:
                message = "Foreign key constraint violation: referenced resource not found."
                
    # 3. Check Constraint Violation
    elif "check constraint" in orig_msg_lower:
        status_code = 422
        error_code = "CHECK_CONSTRAINT_VIOLATION"
        constraint_match = re.search(r"constraint \"(.*?)\"", orig_msg)
        if constraint_match:
            message = f"Validation check failed on constraint '{constraint_match.group(1)}'."
        else:
            message = "Database check constraint validation failed."
            
    # 4. Not Null Violation
    elif "not-null constraint" in orig_msg_lower or "violates not-null" in orig_msg_lower:
        status_code = 422
        error_code = "NOT_NULL_VIOLATION"
        match = re.search(r"column \"(.*?)\"", orig_msg)
        if match:
            message = f"Field '{match.group(1)}' cannot be null."
        else:
            message = "A required field cannot be null."

    error_payload = ErrorResponse(
        error_code=error_code,
        message=message,
        timestamp=datetime.now(timezone.utc),
        path=request.url.path
    )
    return JSONResponse(
        status_code=status_code,
        content=error_payload.model_dump(mode="json")
    )

@app.exception_handler(DataError)
async def data_error_handler(request: Request, exc: DataError):
    orig_msg = str(exc.orig) if exc.orig else str(exc)
    orig_msg_lower = orig_msg.lower()
    
    message = "Invalid data format or value range."
    
    if "value too long" in orig_msg_lower:
        message = "Value exceeds the maximum length allowed."
    elif "invalid input syntax" in orig_msg_lower:
        message = "Invalid input syntax for type."
        
    error_payload = ErrorResponse(
        error_code="DATA_FORMAT_ERROR",
        message=message,
        timestamp=datetime.now(timezone.utc),
        path=request.url.path
    )
    return JSONResponse(
        status_code=422,
        content=error_payload.model_dump(mode="json")
    )



# Enable CORS for frontend requests
allowed_origins_str = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_str:
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
else:
    allowed_origins = []

# Add common local development frontend URLs
allowed_origins.extend(["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time
import logging
import json
import queue
from datetime import datetime, timezone
from logging.handlers import QueueHandler, QueueListener
from app.core.context import set_current_request_id

class JsonFormatter(logging.Formatter):
    def format(self, record):
        timestamp = datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat().replace("+00:00", "Z")
        log_payload = {
            "timestamp": timestamp,
            "level": record.levelname,
            "message": record.getMessage(),
        }
        
        standard_attrs = {
            "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
            "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
            "created", "msecs", "relativeCreated", "thread", "threadName",
            "processName", "process"
        }
        for key, val in record.__dict__.items():
            if key not in standard_attrs and not key.startswith("_"):
                log_payload[key] = val
                
        try:
            return json.dumps(log_payload, default=str)
        except Exception:
            return json.dumps({"error": "Failed to serialize log message", "message": record.getMessage()})

# Setup logging queue for asynchronous non-blocking logging
log_queue = queue.Queue(-1)
queue_handler = QueueHandler(log_queue)

# Configure the bcore.api logger
logger = logging.getLogger("bcore.api")
logger.handlers = []
logger.addHandler(queue_handler)
logger.setLevel(logging.INFO)
logger.propagate = False

# The actual destination handler (stdout)
console_handler = logging.StreamHandler()
console_handler.setFormatter(JsonFormatter())

# Start the listener thread
listener = QueueListener(log_queue, console_handler)
listener.start()

@app.middleware("http")
async def context_and_logging_middleware(request: Request, call_next):
    # Highly optimized request_id generation using os.urandom
    request_id = os.urandom(16).hex()
    set_current_request_id(request_id)
    
    start_time = time.time()
    is_error = False
    response = None
    try:
        response = await call_next(request)
        if response.status_code >= 500:
            is_error = True
        return response
    except Exception as exc:
        is_error = True
        raise exc
    finally:
        process_time = time.time() - start_time
        try:
            from app.core.system.telemetry import increment_traffic
            await increment_traffic(is_error)
        except Exception:
            pass
            
        status_code = response.status_code if response is not None else 500
        if response is not None:
            response.headers["X-Request-ID"] = request_id
            
        log_payload = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "duration": f"{process_time:.4f}s",
            "status_code": status_code
        }
        logger.info("Request processed", extra=log_payload)

# 1. Mount Immutable Core Layer
app.include_router(init_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")
app.include_router(organization_router, prefix="/api/v1")
app.include_router(iam_router, prefix="/api/v1")
app.include_router(crm_router, prefix="/api/v1")
app.include_router(sales_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "B-Core Nexus",
        "documentation": "/docs"
    }

from contextvars import ContextVar
import uuid

# Define context variables with sensible defaults
request_id_ctx_var: ContextVar[str] = ContextVar("request_id", default="")

def get_current_request_id() -> str:
    """Safely retrieves the current request ID."""
    return request_id_ctx_var.get()

def set_current_request_id(request_id: str) -> None:
    """Sets the request ID for the current context."""
    request_id_ctx_var.set(request_id)

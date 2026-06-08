from contextvars import ContextVar
import uuid

# Define context variables with sensible defaults
request_id_ctx_var: ContextVar[str] = ContextVar("request_id", default="")
current_user_tier_ctx_var: ContextVar[int] = ContextVar("current_user_tier", default=4)

def get_current_request_id() -> str:
    """Safely retrieves the current request ID."""
    return request_id_ctx_var.get()

def set_current_request_id(request_id: str) -> None:
    """Sets the request ID for the current context."""
    request_id_ctx_var.set(request_id)

def get_current_user_tier() -> int:
    """Safely retrieves the current user's role tier."""
    return current_user_tier_ctx_var.get()

def set_current_user_tier(tier: int) -> None:
    """Sets the user's role tier for the current context."""
    current_user_tier_ctx_var.set(tier)

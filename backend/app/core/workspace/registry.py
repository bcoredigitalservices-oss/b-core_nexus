"""
Workspace Registry
------------------
Central mount point for all pluggable workspace routers.

To add a new workspace:
  1. Create backend/app/workspaces/<name>/router.py with an APIRouter.
  2. Import its router below and add it to WORKSPACE_REGISTRY.
  3. Call init_workspaces(app) in main.py (already wired in).
"""

from fastapi import FastAPI

from app.workspaces.finance.router import router as finance_router
from app.workspaces.crm.router import router as crm_router
from app.workspaces.inventory.router import router as inventory_router
from app.workspaces.operations.router import router as operations_router
from app.workspaces.hr.router import router as hr_router

# ---------------------------------------------------------------------------
# Master workspace registry
# Keys must match the workspace_string values stored in UserWorkspace rows.
# ---------------------------------------------------------------------------
WORKSPACE_REGISTRY: dict = {
    "finance": finance_router,
    "crm": crm_router,
    "inventory": inventory_router,
    "operations": operations_router,
    "hr": hr_router,
}

# Global prefix under which every workspace is mounted.
WORKSPACE_API_PREFIX = "/api/v1/workspaces"


def init_workspaces(app: FastAPI) -> None:
    """
    Iterates through WORKSPACE_REGISTRY and mounts every workspace router
    under the global /api/v1/workspaces prefix.

    Final route shape example:
        GET /api/v1/workspaces/finance/meta
        GET /api/v1/workspaces/crm/meta
    """
    for name, workspace_router in WORKSPACE_REGISTRY.items():
        app.include_router(workspace_router, prefix=WORKSPACE_API_PREFIX)
        print(f"[WorkspaceRegistry] Mounted workspace '{name}' -> {WORKSPACE_API_PREFIX}{workspace_router.prefix}")

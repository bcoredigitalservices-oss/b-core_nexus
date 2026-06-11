"""
Workspace Registry
------------------
Central mount point for all pluggable workspace routers.

Workspaces are dynamically discovered from app.workspaces.*.
"""

from fastapi import FastAPI
from app.core.workspace.loader import get_workspace_routers

WORKSPACE_API_PREFIX = "/api/v1/workspaces"

def init_workspaces(app: FastAPI) -> None:
    """
    Dynamically loads and mounts every workspace router
    under the global /api/v1/workspaces prefix.
    """
    routers = get_workspace_routers()
    for name, workspace_router in routers.items():
        app.include_router(workspace_router, prefix=WORKSPACE_API_PREFIX)
        print(f"[WorkspaceRegistry] Mounted workspace '{name}' -> {WORKSPACE_API_PREFIX}{workspace_router.prefix}")


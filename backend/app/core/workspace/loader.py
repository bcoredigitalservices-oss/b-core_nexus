import importlib
import pkgutil
import logging
from fastapi import FastAPI

logger = logging.getLogger("bcore.api")

def discover_workspaces(package_name="app.workspaces"):
    """
    Dynamically discover all workspaces in the given package.
    """
    try:
        package = importlib.import_module(package_name)
    except ImportError:
        logger.warning(f"Could not import {package_name}. No workspaces loaded.")
        return []

    workspaces = []
    if hasattr(package, "__path__"):
        for _, name, is_pkg in pkgutil.iter_modules(package.__path__):
            if is_pkg:
                workspaces.append(name)
    return workspaces

def load_workspace_models(package_name="app.workspaces"):
    """
    Dynamically imports models.py from each discovered workspace.
    This ensures SQLAlchemy metadata is populated without hardcoded imports.
    """
    workspaces = discover_workspaces(package_name)
    for ws in workspaces:
        try:
            importlib.import_module(f"{package_name}.{ws}.models")
            logger.info(f"Loaded models for workspace: {ws}")
        except ImportError as e:
            logger.debug(f"No models found for workspace {ws}: {e}")

def get_workspace_routers(package_name="app.workspaces"):
    """
    Dynamically imports router.py from each discovered workspace and returns a dict mapping workspace name to APIRouter.
    """
    workspaces = discover_workspaces(package_name)
    routers = {}
    for ws in workspaces:
        try:
            module = importlib.import_module(f"{package_name}.{ws}.router")
            if hasattr(module, "router"):
                routers[ws] = module.router
                logger.info(f"Loaded router for workspace: {ws}")
            else:
                logger.warning(f"Workspace {ws} has router.py but no 'router' attribute.")
        except ImportError as e:
            logger.debug(f"No router found for workspace {ws}: {e}")
    return routers

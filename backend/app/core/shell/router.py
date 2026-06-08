from fastapi import APIRouter, Depends
from app.core.auth.security import get_current_user
from app.core.auth.models import User
from app.core.shell.schemas import ShellMatrix, NavItem

shell_router = APIRouter(prefix="/shell", tags=["Shell UI"])
router = shell_router

MASTER_SIDEBAR_LINKS = [
    NavItem(label="Global Directory", path="/directory", icon="directory", required_tier=4),
    NavItem(label="Universal Catalog", path="/catalog", icon="catalog", required_tier=4),
    NavItem(label="Security Logs", path="/events", icon="shield", required_tier=2),
    NavItem(label="Executive Boardroom", path="/executive", icon="executive", required_tier=1),
    NavItem(label="Root Control", path="/root", icon="cpu", required_tier=0),
]

MASTER_QUICK_ACTIONS = [
    NavItem(label="Invite User", path="/invite", icon="user-plus", required_tier=1),
    NavItem(label="Add Catalog Item", path="/catalog/new", icon="plus", required_tier=3),
    NavItem(label="Accounts Dashboard", path="/accounts", icon="dollar-sign", required_tier=4, required_functional_roles=["accounts_manager"]),
    NavItem(label="Field Actions", path="/field", icon="activity", required_tier=4, required_functional_roles=["field_operator"]),
]

MASTER_SETTINGS_MODULES = [
    NavItem(label="My Profile", path="/settings/profile", icon="user", required_tier=4),
    NavItem(label="Company Settings", path="/settings/org", icon="briefcase", required_tier=1),
    NavItem(label="System Config", path="/settings/config", icon="settings", required_tier=0),
]

@shell_router.get("/navigation", response_model=ShellMatrix)
async def get_navigation_matrix(current_user: User = Depends(get_current_user)):
    def filter_items(items: list[NavItem]) -> list[NavItem]:
        filtered = []
        for item in items:
            # 1. Tier ceiling check
            if current_user.role_tier > item.required_tier:
                continue
            # 2. Functional roles check (bypassed by Tier 0 Root Admins)
            if item.required_functional_roles and current_user.role_tier != 0:
                if not any(role in current_user.functional_roles for role in item.required_functional_roles):
                    continue
            filtered.append(item)
        return filtered

    return ShellMatrix(
        sidebar_links=filter_items(MASTER_SIDEBAR_LINKS),
        quick_actions=filter_items(MASTER_QUICK_ACTIONS),
        settings_modules=filter_items(MASTER_SETTINGS_MODULES)
    )

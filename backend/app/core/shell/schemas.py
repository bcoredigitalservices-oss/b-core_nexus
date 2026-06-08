from pydantic import BaseModel, Field
from typing import Optional, List

class NavItem(BaseModel):
    label: str
    path: str
    icon: str
    required_tier: int
    required_functional_roles: Optional[List[str]] = Field(default=None)

class ShellMatrix(BaseModel):
    sidebar_links: List[NavItem] = Field(default_factory=list)
    quick_actions: List[NavItem] = Field(default_factory=list)
    settings_modules: List[NavItem] = Field(default_factory=list)

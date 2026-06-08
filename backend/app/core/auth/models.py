# Re-export User model and related objects from app.models.user to maintain backward compatibility
from app.models.user import User, user_workspaces, UserWorkspace

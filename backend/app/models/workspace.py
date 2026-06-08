import uuid
from sqlalchemy import String, ForeignKey, Table, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database import CoreModel, Base

# Import many-to-many association table from app.models.user to track decoupled workspace strings
from app.models.user import user_workspaces

class Workspace(CoreModel):
    __tablename__ = "workspaces"

    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    identifier: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String, default="Active", nullable=False)  # "Active" / "Inactive"

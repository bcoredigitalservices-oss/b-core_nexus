import uuid
from datetime import datetime
from sqlalchemy import Table, Column, String, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.associationproxy import association_proxy
from app.database import Base, CoreModel, JSONType

# Create the Many-to-Many Junction Table (user_workspaces)
user_workspaces = Table(
    "user_workspaces",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("workspace_string", String, primary_key=True),
    UniqueConstraint("user_id", "workspace_string", name="uq_user_workspace_string")
)

class UserWorkspace(Base):
    __table__ = user_workspaces

class User(CoreModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(nullable=True)
    first_name: Mapped[str | None] = mapped_column(nullable=True)
    last_name: Mapped[str | None] = mapped_column(nullable=True)
    invite_token: Mapped[str | None] = mapped_column(unique=True, index=True, nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    role_tier: Mapped[int] = mapped_column(default=4, nullable=False)  # 0 = System Admin (Root), 1 = Executive Admin, 2 = Directional, 3 = Leadership, 4 = Execution
    functional_roles: Mapped[list[str]] = mapped_column(JSONType, default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    totp_secret: Mapped[str | None] = mapped_column(default=None, nullable=True)
    mfa_enabled: Mapped[bool] = mapped_column(default=False, nullable=False)
    
    # Designation (e.g., 'Lead Developer', 'Sales Executive')
    designation: Mapped[str | None] = mapped_column(nullable=True)
    
    # Department Link
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), 
        nullable=True
    )
    preferences = Column(JSON, nullable=True)

    # Relationships
    department: Mapped["Department | None"] = relationship(
        "Department", 
        foreign_keys=[department_id], 
        back_populates="members"
    )
    
    # Relationship to user_workspaces junction table to easily fetch a user's active workspaces list upon authentication
    _workspaces: Mapped[list["UserWorkspace"]] = relationship(
        "UserWorkspace",
        lazy="selectin",
        cascade="all, delete-orphan"
    )

    workspaces = association_proxy("_workspaces", "workspace_string")

    @property
    def is_totp_enabled(self) -> bool:
        return self.mfa_enabled

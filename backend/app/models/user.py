import uuid
from datetime import datetime
from sqlalchemy import Table, Column, String, DateTime, ForeignKey, Boolean, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.associationproxy import association_proxy
from app.database import Base, CoreModel

# Junction table: user_roles
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

# Junction table: role_permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

# Junction table: user_permissions (direct user-to-permission mapping for workspace access)
user_permissions = Table(
    "user_permissions",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

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

class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)

    roles: Mapped[list["Role"]] = relationship("Role", secondary=role_permissions, back_populates="permissions")
    users: Mapped[list["User"]] = relationship("User", secondary=user_permissions, back_populates="direct_permissions")

class Role(Base):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    users: Mapped[list["User"]] = relationship("User", secondary=user_roles, back_populates="roles")
    permissions: Mapped[list["Permission"]] = relationship("Permission", secondary=role_permissions, back_populates="roles")

class User(CoreModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    mfa_secret: Mapped[str | None] = mapped_column(String, nullable=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Invitation columns to preserve onboarding flow
    invite_token: Mapped[str | None] = mapped_column(String, unique=True, index=True, nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Keeping designation and department for compatibility
    designation: Mapped[str | None] = mapped_column(String, nullable=True)
    preferences = Column(JSON, nullable=True)

    # Relationships
    roles: Mapped[list["Role"]] = relationship("Role", secondary=user_roles, back_populates="users", lazy="selectin")
    direct_permissions: Mapped[list["Permission"]] = relationship(
        "Permission", secondary=user_permissions, back_populates="users", lazy="selectin"
    )
    employee_profile: Mapped["EmployeeProfile | None"] = relationship("EmployeeProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin")

    @property
    def department_id(self) -> uuid.UUID | None:
        return self.employee_profile.department_id if self.employee_profile else None

    @department_id.setter
    def department_id(self, value: uuid.UUID | None):
        if self.employee_profile:
            self.employee_profile.department_id = value
    
    _workspaces: Mapped[list["UserWorkspace"]] = relationship(
        "UserWorkspace",
        lazy="selectin",
        cascade="all, delete-orphan"
    )

    workspaces = association_proxy("_workspaces", "workspace_string")

    # Compatibility properties for password hashing & MFA
    @property
    def hashed_password(self) -> str | None:
        return self.password_hash

    @hashed_password.setter
    def hashed_password(self, value: str | None):
        self.password_hash = value

    @property
    def totp_secret(self) -> str | None:
        return self.mfa_secret

    @totp_secret.setter
    def totp_secret(self, value: str | None):
        self.mfa_secret = value

    @property
    def is_totp_enabled(self) -> bool:
        return self.mfa_enabled

    @property
    def functional_roles(self) -> list[str]:
        """
        Exposes role names as a list of strings for Pydantic serialization.
        """
        return [role.name for role in self.roles]

class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name: Mapped[str | None] = mapped_column(String, nullable=True)
    last_name: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    hire_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="employee_profile")
    department: Mapped["Department | None"] = relationship("Department", foreign_keys=[department_id], back_populates="members")

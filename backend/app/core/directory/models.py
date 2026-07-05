import enum
import uuid
from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base, CoreModel, JSONType, is_postgres

class ProfileType(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    VENDOR = "VENDOR"
    SITE = "SITE"

class DirectoryProfile(Base):
    __tablename__ = "directory_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_type = Column(SQLEnum(ProfileType), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    custom_attributes = Column(JSONType, default=dict, nullable=False)

# GIN Index for rapid search/filtering across custom fields
if is_postgres:
    Index("idx_directory_profiles_custom_attributes", DirectoryProfile.custom_attributes, postgresql_using="gin")
else:
    Index("idx_directory_profiles_custom_attributes", DirectoryProfile.custom_attributes)


class EntityType(str, enum.Enum):
    CUSTOMER = "customer"
    VENDOR = "vendor"
    BRANCH = "branch"
    WAREHOUSE = "warehouse"
    SUBSIDIARY = "subsidiary"


# Import mapped_column and Mapped for SQLAlchemy 2.0 style
from sqlalchemy.orm import Mapped, mapped_column
from app.database import CoreModel

class Entity(CoreModel):
    __tablename__ = "entities"

    legal_name: Mapped[str] = mapped_column(String, nullable=False)
    trade_name: Mapped[str | None] = mapped_column(String, nullable=True)
    entity_type: Mapped[EntityType] = mapped_column(SQLEnum(EntityType, name="entity_type_enum"), nullable=False)
    tax_identifier: Mapped[str | None] = mapped_column(String, nullable=True)
    primary_billing_address: Mapped[dict | None] = mapped_column(JSONType, nullable=True)
    primary_shipping_address: Mapped[dict | None] = mapped_column(JSONType, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


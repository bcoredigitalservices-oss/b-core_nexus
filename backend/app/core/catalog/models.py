import uuid
from sqlalchemy import Column, String, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base, JSONType, is_postgres

class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    custom_attributes = Column(JSONType, default=dict, nullable=False)

# GIN Index for rapid search/filtering across custom fields
if is_postgres:
    Index("idx_catalog_items_custom_attributes", CatalogItem.custom_attributes, postgresql_using="gin")
else:
    Index("idx_catalog_items_custom_attributes", CatalogItem.custom_attributes)


from sqlalchemy import ForeignKey, String, UUID as SQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.finance.tax_models import TaxCategory
from app.database import CoreModel

class ItemGroup(CoreModel):
    __tablename__ = "item_groups"

    name: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("item_groups.id"), nullable=True)

class Item(CoreModel):
    __tablename__ = "items"

    sku: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    barcode: Mapped[str | None] = mapped_column(String, unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    catalog_type: Mapped[str] = mapped_column(String, nullable=False)
    default_uom: Mapped[str] = mapped_column(String, nullable=False)
    tax_category_id: Mapped[uuid.UUID | None] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("tax_categories.id"), nullable=True)
    item_group_id: Mapped[uuid.UUID | None] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("item_groups.id"), nullable=True)

    tax_category = relationship("app.core.finance.tax_models.TaxCategory")
    item_group = relationship("app.core.catalog.models.ItemGroup")


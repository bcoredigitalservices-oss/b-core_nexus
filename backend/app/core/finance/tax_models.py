from sqlalchemy import String, Numeric, DateTime, ForeignKey, Index, UUID as SQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import CoreModel
from datetime import datetime
from decimal import Decimal
import uuid

class TaxRegion(CoreModel):
    __tablename__ = "tax_regions"

    region_name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)

class TaxCategory(CoreModel):
    __tablename__ = "tax_categories"

    category_name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)

class TaxRule(CoreModel):
    __tablename__ = "tax_rules"

    region_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("tax_regions.id"), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("tax_categories.id"), nullable=False)
    tax_rate_percent: Mapped[Decimal] = mapped_column(Numeric(precision=5, scale=2), nullable=False)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    region = relationship("TaxRegion")
    category = relationship("TaxCategory")

    __table_args__ = (
        Index("idx_tax_rules_region_category_effective", "region_id", "category_id", "effective_from", unique=True),
    )

from sqlalchemy import String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import CoreModel
from datetime import datetime, timezone
from decimal import Decimal

class Currency(CoreModel):
    __tablename__ = "currencies"

    iso_code: Mapped[str] = mapped_column(String(3), unique=True, index=True, nullable=False)
    symbol: Mapped[str] = mapped_column(String(10), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    fractional_unit_name: Mapped[str] = mapped_column(String(50), nullable=False)

class ExchangeRate(CoreModel):
    __tablename__ = "exchange_rates"

    from_currency_code: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso_code"), nullable=False)
    to_currency_code: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso_code"), nullable=False)
    conversion_rate: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=6), nullable=False)
    effective_from_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    from_currency = relationship("Currency", foreign_keys=[from_currency_code])
    to_currency = relationship("Currency", foreign_keys=[to_currency_code])

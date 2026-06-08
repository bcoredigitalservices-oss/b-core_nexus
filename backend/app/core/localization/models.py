from sqlalchemy.orm import Mapped, mapped_column
from app.database import CoreModel

class SystemSettings(CoreModel):
    __tablename__ = "system_settings"

    organization_name: Mapped[str] = mapped_column(nullable=False)
    base_currency: Mapped[str] = mapped_column(nullable=False)
    default_timezone: Mapped[str] = mapped_column(nullable=False, default="UTC")
    fiscal_year_start_month: Mapped[int] = mapped_column(nullable=False, default=1)
    date_format: Mapped[str] = mapped_column(nullable=False, default="YYYY-MM-DD")

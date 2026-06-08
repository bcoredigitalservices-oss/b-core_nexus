from sqlalchemy.orm import Mapped, mapped_column
from app.database import CoreModel

class InstanceProfile(CoreModel):
    __tablename__ = "instance_profiles"

    organization_name: Mapped[str] = mapped_column(nullable=False)
    base_currency: Mapped[str] = mapped_column(default="INR", nullable=False)
    timezone: Mapped[str] = mapped_column(default="UTC", nullable=False)
    is_initialized: Mapped[bool] = mapped_column(default=False, nullable=False)

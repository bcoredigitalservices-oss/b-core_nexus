from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import CoreModel

class DocumentSequence(CoreModel):
    __tablename__ = "document_sequences"

    sequence_key: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    prefix: Mapped[str] = mapped_column(String, nullable=False)
    next_value: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    padding_length: Mapped[int] = mapped_column(Integer, default=6, nullable=False)

from sqlalchemy import Index, text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.models import Base


class FileProcessor(Base):
    __tablename__ = "file_processor"

    id: Mapped[int] = mapped_column(primary_key=True)
    file_name: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(default="pending")
    total_number_of_records: Mapped[int] = mapped_column(default=0)
    records_inserted: Mapped[int] = mapped_column(default=0)
    records_updated: Mapped[int] = mapped_column(default=0)
    file_with_errors: Mapped[str] = mapped_column(default="")

    __table_args__ = (
        Index(
            "uq_file_processor_file_name_lower",
            text("lower(file_name)"),
            unique=True
        ),
    )

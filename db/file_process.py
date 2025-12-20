from sqlalchemy import Column, Integer, String, Boolean, Index, text
from db.models import Base

class FileProcessor(Base):
    __tablename__ = "file_processor"

    id = Column(Integer, primary_key=True)
    file_name = Column(String, nullable=False)
    status = Column(String)
    total_number_of_records = Column(Integer, default=0)
    records_inserted = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)

    __table_args__ = (
        Index(
            "uq_file_processor_file_name_lower",
            text("lower(file_name)"),
            unique=True
        ),
    )

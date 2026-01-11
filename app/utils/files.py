"""Utility functions for file processing."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.file_process import FileProcessor


def get_file_status(db: Session, file_id: str) -> str | None:
    """Get the status of a file processor record."""
    file_processor: FileProcessor | None = db.execute(
        select(FileProcessor).where(FileProcessor.id == file_id)
    ).scalar_one_or_none()
    if not file_processor:
        return None
    return file_processor.status

def get_file_progress(db: Session, file_id: str) -> int:
    """Get the number of records inserted for a file."""
    file_processor: FileProcessor | None = db.execute(
        select(FileProcessor).where(FileProcessor.id == file_id)
    ).scalar_one_or_none()
    if not file_processor:
        return 0
    return file_processor.records_inserted

def get_total_records(db: Session, file_id: str) -> int:
    """Get the total number of records for a file."""
    file_processor: FileProcessor | None = db.execute(
        select(FileProcessor).where(FileProcessor.id == file_id)
    ).scalar_one_or_none()
    if not file_processor:
        return 0
    return file_processor.total_number_of_records

def get_error_count(db: Session, file_id: str) -> int:
    """Get the error count for a file."""
    file_processor: FileProcessor | None = db.execute(
        select(FileProcessor).where(FileProcessor.id == file_id)
    ).scalar_one_or_none()
    if not file_processor:
        return 0
    return file_processor.file_with_errors.count(',') + 1 if file_processor.file_with_errors else 0

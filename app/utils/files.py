from sqlalchemy.orm import Session
from app.db.file_process import FileProcessor
from sqlalchemy import select

def get_file_status(file_id: str, db: Session) -> str | None:
    file_processor: FileProcessor | None = db.execute(
        select(FileProcessor).where(FileProcessor.id == file_id)
    ).scalar_one_or_none()
    if not file_processor:
        return None
    return file_processor.status

def get_file_progress(file_id: str, db: Session) -> int:
    file_processor: FileProcessor | None = db.execute(
        select(FileProcessor).where(FileProcessor.id == file_id)
    ).scalar_one_or_none()
    if not file_processor:
        return 0
    return file_processor.records_inserted

def get_total_records(file_id: str, db: Session) -> int:
    file_processor: FileProcessor | None = db.execute(
        select(FileProcessor).where(FileProcessor.id == file_id)
    ).scalar_one_or_none()
    if not file_processor:
        return 0
    return file_processor.total_number_of_records

def get_error_count(file_id: str, db: Session) -> int:
    file_processor: FileProcessor | None = db.execute(
        select(FileProcessor).where(FileProcessor.id == file_id)
    ).scalar_one_or_none()
    if not file_processor:
        return 0
    return file_processor.file_with_errors.count(',') + 1 if file_processor.file_with_errors else 0

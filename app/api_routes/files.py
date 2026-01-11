"""API routes for file upload and management."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.db.file_process import FileProcessor
from app.pydantic_models import FileUploadResponse
from app.tasks.csv_task import process_csv
from app.utils.aws import create_session

router = APIRouter()


@router.post("/files")
async def upload_file(
    file: UploadFile = File(...), db: Session = Depends(get_db),
    file_name: str = None
) -> FileUploadResponse:
    """Upload a CSV file for processing."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No selected file")

    session = create_session()
    if file:
        session.client("s3").upload_fileobj(
            Bucket="temp-csv-files-product-importer",
            Fileobj=file.file,
            Key=file.filename
        )
    if not file_name:
        file_name = file.filename
    file_processor = db.execute(
        select(FileProcessor).where(FileProcessor.file_name == file_name)
    ).scalar_one_or_none()
    if file_processor:
        print("File with the same name already exists")
        raise HTTPException(
            status_code=400,
            detail={
                "message": "File with the same name already exists"
            }
        )
    file_record = FileProcessor(
        file_name=file_name,
        status="processing",
        total_number_of_records=0,
        records_inserted=0,
        records_updated=0
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)
    process_csv.delay(file_name)
    return FileUploadResponse(
        message="File uploaded successfully",
        file_name=file_record.file_name,
        file_id=file_record.id
    )

@router.get("/files")
def list_files(db: Session = Depends(get_db)):
    """List all uploaded files with their status."""
    files = db.execute(
        select(FileProcessor).order_by(desc(FileProcessor.id))
    ).scalars().all()
    files_res = [
        {
            "id": file.id,
            "file_name": file.file_name,
            "status": file.status,
            "total_number_of_records": file.total_number_of_records,
            "records_inserted": file.records_inserted,
            "records_updated": file.records_updated,
            "file_with_errors": file.file_with_errors
        }
        for file in files
    ]
    return {
        "files": files_res,
        "status": "ok"
    }


@router.get("/files/{file_id}/error-download-url")
async def get_error_file_download_url(
    file_id: int, db: Session = Depends(get_db)
) -> dict[str, str]:
    """Get a presigned URL to download error file for a given file ID."""
    file_record = db.execute(
        select(FileProcessor).where(FileProcessor.id == file_id)
    ).scalar_one_or_none()

    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    if not file_record.file_with_errors:
        raise HTTPException(status_code=404, detail="No error file available")

    session = create_session()
    s3_client = session.client("s3")
    presigned_url = s3_client.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': 'temp-csv-files-product-importer',
            'Key': file_record.file_with_errors
        },
        ExpiresIn=3600
    )

    return {"error_file_download_url": presigned_url}


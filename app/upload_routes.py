from fastapi import UploadFile, File, HTTPException
import csv
from app.utils.aws import create_session
from app.db.file_process import FileProcessor
from app.db.connection import get_db
from fastapi import Depends
from fastapi import APIRouter
from sqlalchemy import select
from app.tasks.csv_task import process_csv
router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), db=Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No selected file")

    contents = file.file
    reader = csv.DictReader(
        (line.decode("utf-8") for line in contents)
    )

    count = 0
    data = []
    session = create_session()
    status = session.client("s3").upload_fileobj(
        Bucket="temp-csv-files-product-importer",
        Fileobj=file.file,
        Key=file.filename
    )
    print(status)
    file_record = FileProcessor(
        file_name=file.filename,
        status="processing",
        total_number_of_records=0,
        records_inserted=0,
        records_updated=0
    )
    db.add(file_record)
    db.commit()
    process_csv.delay(file.filename)
    return {
        "message": "File uploaded successfully",
        "file_name": file.filename
    }

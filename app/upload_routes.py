from fastapi import UploadFile, File, HTTPException, WebSocket
import asyncio
from app.utils.aws import create_session
from app.db.file_process import FileProcessor
from app.db.connection import get_db
from fastapi import Depends
from fastapi import APIRouter
from app.tasks.csv_task import process_csv
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.redis import redis_client
router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No selected file")

    session = create_session()
    status = session.client("s3").upload_fileobj(
        Bucket="temp-csv-files-product-importer",
        Fileobj=file.file,
        Key=file.filename
    )
    file_record = FileProcessor(
        file_name=file.filename,
        status="processing",
        total_number_of_records=0,
        records_inserted=0,
        records_updated=0
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)
    process_csv.delay(file.filename)
    return {
        "message": "File uploaded successfully",
        "file_name": file_record.file_name,
        "file_id": file_record.id
    }


@router.websocket("/ws/progress/{file_id}")
async def websocket_endpoint(websocket: WebSocket,  file_id: str, db: Session = Depends(get_db)):
    await websocket.accept()
    for i in range(0, 1010, 10):
        await websocket.send_json({
            "status": "processing",
            "progress": int(redis_client.hget("file_processing", file_id) or 0)
        })
        await asyncio.sleep(1)

    await websocket.send_json({
        "status": "completed",
        "progress": 100
    })
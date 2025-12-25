import csv
import time
from sqlalchemy import func
import boto3
from typing import List
from app.celery_app import celery_app
from app.utils.aws import create_session
from app.db.connection import get_db
from app.db.file_process import FileProcessor
from app.db.products import Product
from app.redis import redis_client
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select

def upsert_products(
    db: Session,
    rows: list[dict[str, str | int | bool | None]],
    file_name: str,
):
    if not rows:
        return

    stmt = insert(Product).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=[func.lower(Product.sku)],
        set_={
            "name": stmt.excluded.name,
            "description": stmt.excluded.description,
        },
    )

    try:
        result = db.execute(stmt)
        print(result, "rows upserted.")

        file_processor = db.execute(
            select(FileProcessor).where(FileProcessor.file_name == file_name)
        ).scalar_one_or_none()
        redis_client.hincrby("file_processing", file_processor.id, len(rows))
        processed = redis_client.hget("file_processing", file_processor.id)
        processed = int(processed) if processed else 0
        if not file_processor:
            raise ValueError(f"FileProcessor not found for file_name={file_name}")

        file_processor.records_inserted += len(rows)

        db.commit()

    except Exception:
        db.rollback()
        raise


@celery_app.task(bind=True, name="process_csv")
def process_csv(self, file_name: str):
    db = next(get_db())
    print(f"Processing job {file_name}")
    session: boto3.Session = create_session()
    s3_client = session.client("s3")
    obj = s3_client.get_object(
        Bucket="temp-csv-files-product-importer",
        Key=file_name
    )
    contents = obj['Body'].read().decode('utf-8').splitlines()
    reader = csv.DictReader(contents)
    rows_to_insert: List[dict[str, str | int | bool | None]] = []
    for row in reader:
        new_row = {
            "sku": row.get("sku", "").strip(),
            "name": row.get("name", "").strip(),
            "description": row.get("description", "").strip()
        }
        rows_to_insert.append(new_row)
        if len(rows_to_insert) >= 2:
            upsert_products(db, rows_to_insert, file_name)
            time.sleep(3)  # Simulate processing time
            rows_to_insert = []
    if rows_to_insert:
        upsert_products(db, rows_to_insert, file_name)

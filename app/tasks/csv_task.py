import csv
import boto3
from sqlalchemy import select, insert
from typing import List
from app.celery_app import celery_app
from app.utils.aws import create_session
from app.db.connection import get_db
from app.db.file_process import FileProcessor
from app.db.products import Product


def upsert_products(db, rows: List[dict[str, str | int | bool | None]], file_name: str):
    db.insert()
    file_processor: FileProcessor | None = db.execute(
        select(FileProcessor).where(FileProcessor.file_name == file_name)
    ).scalar_one_or_none()
    file_processor.records_inserted += len(rows)
    db.commit()

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
        if len(rows_to_insert) >= 100:
            upsert_products(db, rows_to_insert, file_name)
            rows_to_insert = []
    if rows_to_insert:
        upsert_products(db, rows_to_insert, file_name)

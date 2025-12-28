import csv
import os
import tempfile
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
    rows: list[dict[str, str | int | bool | None]]
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
        db.commit()
        return len(rows)

    except Exception:
        db.rollback()
        raise

def count_total_rows(
    s3_client: boto3.client,
    file_name: str
) -> int:
    obj = s3_client.get_object(
        Bucket="temp-csv-files-product-importer",
        Key=file_name
    )

    total_rows = sum(1 for _ in obj["Body"].iter_lines()) - 1  # minus header
    return total_rows


def process_csv_task(
    file_name: str, file_processor: FileProcessor,
    db: Session, s3_client: boto3.client
):
    obj = s3_client.get_object(
        Bucket="temp-csv-files-product-importer",
        Key=file_name
    )

    reader = csv.DictReader(
        (line.decode("utf-8") for line in obj["Body"].iter_lines())
    )

    rows_to_insert: list[dict] = []
    redis_client.hset("file_status", file_processor.id, "processing")
    rows_with_errors: list[dict] = []

    for row in reader:
        new_row = {
            "sku": row.get("sku", "").strip(),
            "name": row.get("name", "").strip(),
            "description": row.get("description", "").strip()
        }
        if not new_row["sku"]:
            rows_with_errors.append(row)
            redis_client.hincrby("row_with_errors", file_processor.id, 1)
            continue

        rows_to_insert.append(new_row)

        if len(rows_to_insert) >= 2:
            rows_updated = upsert_products(db, rows_to_insert)
            redis_client.hincrby("file_processing", file_processor.id, rows_updated)
            file_processor.records_inserted += rows_updated
            rows_to_insert.clear()
            time.sleep(3)

    if rows_to_insert:
        rows_updated = upsert_products(db, rows_to_insert)
        file_processor.records_inserted += rows_updated
        redis_client.hincrby("file_processing", file_processor.id, rows_updated)

    if rows_with_errors:
        handle_error_file(rows_with_errors, s3_client, db, file_processor)


def handle_error_file(
    rows_with_errors: List[dict],
    s3_client: boto3.client,
    db: Session,
    file_processor: FileProcessor
):
    if not rows_with_errors:
        return

    with tempfile.NamedTemporaryFile(
        mode="w",
        newline="",
        suffix=".csv",
        delete=False
    ) as error_file:
        fieldnames = ["sku", "name", "description"]
        writer = csv.DictWriter(error_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows_with_errors)
        temp_path = error_file.name

    s3_client.upload_file(
        Filename=temp_path,
        Bucket="temp-csv-files-product-importer",
        Key=f"errors/{file_processor.id}.csv",
    )
    file_processor.file_with_errors = f"errors/{file_processor.id}.csv"
    db.commit()

    os.remove(temp_path)


@celery_app.task(bind=True, name="process_csv")
def process_csv(self, file_name: str):
    db = next(get_db())
    session: boto3.Session = create_session()
    s3_client = session.client("s3")

    file_processor: FileProcessor | None = db.execute(
        select(FileProcessor).where(FileProcessor.file_name == file_name)
    ).scalar_one_or_none()

    if file_processor is None:
        print(f"FileProcessor record not found for file: {file_name}")
        return

    file_processor.status = "processing"
    db.commit()

    # =========================
    # PASS 1: COUNT TOTAL ROWS
    # =========================
    total_rows = count_total_rows(s3_client, file_name)
    file_processor.total_number_of_records = total_rows
    redis_client.hset(
        name="file_total",
        key=str(file_processor.id),
        value=str(total_rows),
    )


    # =========================
    # PASS 2: PROCESS ROWS
    # =========================
    process_csv_task(file_name, file_processor, db, s3_client)

    file_processor.status = "completed"
    db.commit()
    redis_client.hset("file_status", file_processor.id, "completed")

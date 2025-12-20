import csv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
from db.models import engine, Base
from backend.products import router as ProductsRouter
from db.connection import get_db
from sqlalchemy import select
from db.products import Product
from db.file_process import FileProcessor
from utils.aws import create_session
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:5175"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(ProductsRouter)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No selected file")

    # Example: read file content
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
    db = next(get_db())
    db.add(file_record)
    db.commit()
    return {
        "message": "File uploaded successfully",
        "file_name": file.filename
    }

def process_csv(file_path: str):
    for row in reader:
        data.append(row)
        count += 1
    for item in data:
        product = db.execute(
            select(Product).where(Product.sku.ilike(item["sku"]))
        ).scalar_one_or_none()
        if product:
            for k, v in item.items():
                setattr(product, k, v)
        else:
            product = Product(**item)
            db.add(product)

    return {
        "message": "CSV processed",
        "rows": count
    }
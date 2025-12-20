from sqlalchemy import select
import asyncio
from fastapi import Depends
from sqlalchemy.orm import Session
from db.products import Product
from db.file_process import FileProcessor
from db.connection import get_db
from fastapi import APIRouter
from pydantic import BaseModel

class ProductSchema(BaseModel):
    sku: str
    name: str | None = None
    description: str | None = None


router = APIRouter()
@router.post("/products")
# @router.post("/products/{sku}")
def upsert_product(data: ProductSchema, db: Session = Depends(get_db)):
    product = db.execute(
        select(Product).where(Product.sku.ilike(data.sku))
    ).scalar_one_or_none()
    data_dict = data.model_dump()

    if product:
        for k, v in data_dict.items():
            setattr(product, k, v)
    else:
        product = Product(**data_dict)
        db.add(product)

    db.commit()
    return {"status": "ok"}


@router.get("/products/{sku}")
def get_product(sku: str, db: Session = Depends(get_db)):
    product = db.execute(
        select(Product).where(Product.sku.ilike(sku))
    ).scalar_one_or_none()

    if not product:
        return {"error": "Product not found"}

    return {
        "id": product.id,
        "sku": product.sku,
        "name": product.name,
        "description": product.description,
        "active": product.active
    }

@router.delete("/products/{sku}")
def delete_product(sku: str, db: Session = Depends(get_db)):
    product = db.execute(
        select(Product).where(Product.sku.ilike(sku))
    ).scalar_one_or_none()

    if not product:
        return {"error": "Product not found"}

    db.delete(product)
    db.commit()
    return {"status": "deleted"}

@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    products = db.execute(select(Product)).scalars().all()
    products_res = [
        {
            "id": product.id,
            "sku": product.sku,
            "name": product.name,
            "description": product.description,
            "active": product.active
        }
        for product in products
    ]
    return {
        "products": products_res,
        "status": "ok"
    }


# @app.websocket("/ws/progress/{file_id}")
# async def websocket_endpoint(websocket: WebSocket,  file_id: str, db: Depends(get_db)):
#     await websocket.accept()
#     file_processor = db.execute(
#         select(FileProcessor).where(FileProcessor.file_name.ilike(file_id))
#     ).scalar_one_or_none()
#     for i in range(0, 101, 10):
#         await websocket.send_json({
#             "status": "processing",
#             "progress": i
#         })
#         await asyncio.sleep(1)

#     await websocket.send_json({
#         "status": "completed",
#         "progress": 100
#     })

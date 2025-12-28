from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import (Depends, APIRouter)
from app.db.products import Product
from app.db.connection import get_db
from app.pydantic_models import ProductResponse, ProductSchema


router = APIRouter()
@router.post("/products")
def upsert_product(data: ProductSchema, db: Session = Depends(get_db)):
    '''Upsert a product based on SKU'''
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
def get_product(
    sku: str, db: Session = Depends(get_db)
) -> ProductResponse:
    product: Product | None = db.execute(
        select(Product).where(Product.sku.ilike(sku))
    ).scalar_one_or_none()

    if not product:
        return {"error": "Product not found"}

    return ProductResponse(
        sku=product.sku,
        name=product.name,
        description=product.description,
        active=product.active
    )


@router.delete("/products/{sku}")
def delete_product(sku: str, db: Session = Depends(get_db)) -> dict[str, str]:
    """Delete a product based on SKU"""
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

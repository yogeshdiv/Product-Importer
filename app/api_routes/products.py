"""API routes for product management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.db.products import Product
from app.pydantic_models import ProductSchema

router = APIRouter()


@router.post("/products")
def upsert_product(data: ProductSchema, db: Session = Depends(get_db)):
    """Upsert a product based on SKU."""
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
def get_products(
    db: Session = Depends(get_db),
    sku: str | None = None,
    q: str | None = None,
    cursor: int | None = None,
    limit: int = 50,
):
    if sku and q:
        raise HTTPException(400, "Use either sku or q, not both")

    stmt = select(Product)

    # 🎯 GET by SKU
    if sku:
        stmt = stmt.where(Product.sku == sku)
        product = db.execute(stmt).scalar_one_or_none()

        if not product:
            raise HTTPException(404, "Product not found")

        return {
            "products": [{
                "id": product.id,
                "sku": product.sku,
                "name": product.name,
                "description": product.description,
                "active": product.active,
            }],
            "has_more": False,
            "next_cursor": None,
            "status": "ok",
        }

    if q:
        search_term = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Product.sku.ilike(search_term),
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
            )
        )

    if cursor:
        stmt = stmt.where(Product.id > cursor)

    stmt = stmt.order_by(Product.id).limit(limit)

    products = db.execute(stmt).scalars().all()

    return {
        "products": [
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "description": p.description,
                "active": p.active,
            }
            for p in products
        ],
        "next_cursor": products[-1].id if products else None,
        "has_more": len(products) == limit,
        "status": "ok",
    }

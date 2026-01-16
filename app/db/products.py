"""Product database model."""
from sqlalchemy import Boolean, Column, Index, Integer, String, func, text

from app.db.models import Base


class Product(Base):
    """Database model for products."""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    sku = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    active = Column(Boolean, nullable=False, server_default=text("true"))

    __table_args__ = (
        Index(
            "uq_products_sku_lower",
            func.lower(sku),
            unique=True
        ),
    )

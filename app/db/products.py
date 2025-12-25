from sqlalchemy import Column, String, Boolean, Integer, Index, func, text
from app.db.models import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    sku = Column(String(64), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String)
    active = Column(Boolean, nullable=False, server_default=text("true"))

    __table_args__ = (
        Index(
            "uq_products_sku_lower",
            func.lower(sku),
            unique=True
        ),
    )

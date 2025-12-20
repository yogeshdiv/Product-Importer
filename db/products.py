from sqlalchemy import Column, Integer, String, Boolean, Index, text
from db.models import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    sku = Column(String, nullable=False)
    name = Column(String)
    description = Column(String)
    active = Column(Boolean, default=True)

    __table_args__ = (
        Index(
            "uq_products_sku_lower",
            text("lower(sku)"),
            unique=True
        ),
    )

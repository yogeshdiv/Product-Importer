from sqlalchemy import Column, String, Boolean
from app.db.models import Base

class Product(Base):
    __tablename__ = "products"

    sku = Column(String, primary_key=True)
    name = Column(String)
    description = Column(String)
    active = Column(Boolean, default=True)


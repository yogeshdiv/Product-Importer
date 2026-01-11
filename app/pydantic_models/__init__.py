"""Pydantic models for API request/response validation."""
from pydantic import BaseModel


class ProductSchema(BaseModel):
    """Schema for product data."""
    sku: str
    name: str | None = None
    description: str | None = None


class FileUploadResponse(BaseModel):
    """Response model for file upload."""
    message: str
    file_name: str
    file_id: int


class HealthCheckResponse(BaseModel):
    """Response model for health check."""
    status: str


class ProductResponse(BaseModel):
    """Response model for product data."""
    sku: str
    name: str | None = None
    description: str | None = None
    active: bool | None = None

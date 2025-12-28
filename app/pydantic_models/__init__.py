from pydantic import BaseModel

class ProductSchema(BaseModel):
    sku: str
    name: str | None = None
    description: str | None = None

class FileUploadResponse(BaseModel):
    message: str
    file_name: str
    file_id: int


class HealthCheckResponse(BaseModel):
    status: str

class ProductResponse(BaseModel):
    sku: str
    name: str | None = None
    description: str | None = None
    active: bool | None = None
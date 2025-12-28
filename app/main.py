from app.api_routes.products import router as ProductsRouter
from app.api_routes.files import router as UploadRouter
from app.websockets.file_process import router as FileProcessRouter
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
from app.db.models import engine, Base
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(ProductsRouter)
app.include_router(UploadRouter)
app.include_router(FileProcessRouter)

@app.get("/health")
def health_check():
    return {"status": "ok"}

from app.products import router as ProductsRouter
from app.upload_routes import router as UploadRouter
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
from app.db.models import engine, Base
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:5175"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(ProductsRouter)
app.include_router(UploadRouter)

@app.get("/health")
def health_check():
    return {"status": "ok"}

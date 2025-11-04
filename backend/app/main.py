from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth, produce, external_apis, forum, profit_estimator
from app.database import settings
from pathlib import Path

app = FastAPI(
    title="Smart Agriculture Market Tracker API",
    description="Backend API for tracking agricultural produce prices and providing smart farming advice",
    version="1.0.0"
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS Configuration
origins = settings.allowed_origins.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(produce.router)
app.include_router(external_apis.router)
app.include_router(forum.router)
app.include_router(profit_estimator.router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Smart Agriculture Market Tracker API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

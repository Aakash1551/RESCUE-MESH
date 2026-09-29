"""
MeshSOS Backend - FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db, SessionLocal
from .routes import sos, auth
from .models import UserDB, UserRole
from .routes.auth import get_password_hash
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    print("Starting MeshSOS Backend...")
    init_db()
    print("Database initialized")
    
    # Seed default admin user if not exists
    db = SessionLocal()
    try:
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin")
        admin_email = os.getenv("ADMIN_EMAIL", "admin@meshsos.local")
        existing_admin = db.query(UserDB).filter(UserDB.username == admin_username).first()
        if not existing_admin:
            hashed = get_password_hash(admin_password)
            new_admin = UserDB(
                name="System Admin",
                username=admin_username, 
                email=admin_email,
                hashed_password=hashed,
                role=UserRole.ADMIN
            )
            db.add(new_admin)
            db.commit()
            print(f"Default admin user '{admin_username}' seeded. IMPORTANT: Change default password in production!")
    finally:
        db.close()
        
    yield
    print("Shutting down...")


app = FastAPI(
    title="MeshSOS Backend",
    description="Backend API for Offline Emergency Mesh SOS Network",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173,http://localhost:3000")
origins = [url.strip() for url in frontend_url.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router)
app.include_router(sos.router)


@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "MeshSOS Backend",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

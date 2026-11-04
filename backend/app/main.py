import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.database import init_db
from app.database.tables import seed_default_users
from app.routes import auth, students, certificates, download, logs, rpa

app = FastAPI(
    title="Student Certificate Generator API",
    description="Enterprise API backend for managing students, generating vector PDF certificates, and batch processing.",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and default admin user on startup
@app.on_event("startup")
def startup_event():
    init_db()
    seed_default_users()
    print("Database initialized and default credentials seeded.")

# Register routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(certificates.router)
app.include_router(download.router)
app.include_router(logs.router)
app.include_router(rpa.router)

# Mount generated certificates static directory
BASE_DIR = Path(__file__).parent.parent
GENERATED_DIR = BASE_DIR / "generated_certificates"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static/certificates", StaticFiles(directory=str(GENERATED_DIR)), name="certificates")

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Student Certificate Generator API",
        "docs": "/docs",
        "endpoints": [
            "/api/auth/login",
            "/api/auth/auto-login",
            "/api/students",
            "/api/certificates",
            "/api/download/{cert_id}",
            "/api/rpa/start",
            "/api/rpa/history"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.websocket_routes import router as websocket_router

app = FastAPI(title="IntervieHire Backend")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(websocket_router)

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "IntervieHire API is running"}

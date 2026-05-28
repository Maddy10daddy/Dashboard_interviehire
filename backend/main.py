from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.websocket_routes import router as websocket_router
from app.database import Base, engine
from app.routers import jobs, team, career, usage, settings as settings_router
 
# Import all models so SQLAlchemy registers them before create_all
import app.models  # noqa
 
# Create all tables
Base.metadata.create_all(bind=engine)

# Auto-migrate: Add parameters columns to jobs if they don't exist
with engine.connect() as conn:
    from sqlalchemy import text
    conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS resume_parameters TEXT;"))
    conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS screening_parameters TEXT;"))
    conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS functional_parameters TEXT;"))
    conn.commit()

app = FastAPI(title=settings.APP_NAME)
 
# CORS — allows Next.js frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Routers
app.include_router(websocket_router)  # existing WS routes
app.include_router(jobs.router,             prefix="/api/jobs",     tags=["Jobs"])
app.include_router(team.router,             prefix="/api/team",     tags=["Team"])
app.include_router(career.router,           prefix="/api/career",   tags=["Career"])
app.include_router(usage.router,            prefix="/api/usage",    tags=["Usage"])
app.include_router(settings_router.router,  prefix="/api/settings", tags=["Settings"])
 
 
@app.get("/")
def root():
    return {"status": "ok", "app": settings.APP_NAME}
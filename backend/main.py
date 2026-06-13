from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.websocket_routes import router as websocket_router
from app.database import Base, engine
from app.routers import jobs, team, organisation, usage, settings as settings_router, deepseek
 
# Import all models so SQLAlchemy registers them before create_all
import app.models  # noqa
 
# Create all tables
Base.metadata.create_all(bind=engine)

# Auto-migrate: Add parameters columns to jobs and applicants if they don't exist
with engine.connect() as conn:
    from sqlalchemy import text
    conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS resume_parameters TEXT;"))
    conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS screening_parameters TEXT;"))
    conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS functional_parameters TEXT;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS recruiter_screening VARCHAR;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS recruiter_screening_score FLOAT;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS attempted_at TIMESTAMP;"))
    
    # Applicants table migrations
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS resume_analysed BOOLEAN DEFAULT FALSE;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS resume_shortlisted BOOLEAN DEFAULT FALSE;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS resume_waitlisted BOOLEAN DEFAULT FALSE;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS resume_score FLOAT;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS screening_status VARCHAR;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS screening_score FLOAT;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS screening_scheduled_at TIMESTAMP WITH TIME ZONE;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS functional_status VARCHAR;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS functional_score FLOAT;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS functional_scheduled_at TIMESTAMP WITH TIME ZONE;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS cheat_probability VARCHAR;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS report_url VARCHAR;"))
    conn.execute(text("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS source VARCHAR;"))
    conn.commit()

    # Rename / Migrate career_pages -> organisations
    try:
        is_postgres = settings.DATABASE_URL.startswith("postgresql")
        if is_postgres:
            check_career_pages = conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'career_pages');")).scalar()
            check_organisations = conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organisations');")).scalar()
        else:
            check_career_pages = conn.execute(text("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='career_pages';")).scalar()
            check_organisations = conn.execute(text("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='organisations';")).scalar()

        if check_career_pages:
            if check_organisations:
                count_orgs = conn.execute(text("SELECT count(*) FROM organisations;")).scalar()
                if count_orgs == 0:
                    print("Migrating data from career_pages to organisations...")
                    conn.execute(text("""
                        INSERT INTO organisations (id, org_name, domain, contact_email, website_link, location, logo_url, description, created_at, updated_at)
                        SELECT id, org_name, domain, contact_email, website_link, location, logo_url, description, created_at, updated_at
                        FROM career_pages;
                    """))
                    conn.commit()
            print("Dropping legacy career_pages table...")
            conn.execute(text("DROP TABLE career_pages;"))
            conn.commit()
    except Exception as migration_err:
        print(f"Migration error (career_pages -> organisations): {migration_err}")

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
app.include_router(organisation.router,     prefix="/api/organisation", tags=["Organisation"])
app.include_router(usage.router,            prefix="/api/usage",    tags=["Usage"])
app.include_router(settings_router.router,  prefix="/api/settings", tags=["Settings"])
app.include_router(deepseek.router,         prefix="/api/deepseek", tags=["DeepSeek"])
 
 
@app.get("/")
def root():
    return {"status": "ok", "app": settings.APP_NAME}
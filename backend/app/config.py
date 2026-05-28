from pydantic_settings import BaseSettings
 
 
class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/hiring_dashboard"
 
    # App
    SECRET_KEY: str = "change-this-in-production"
    APP_NAME: str = "Hiring Dashboard"
 
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # API Keys
    GROQ_API_KEY: str | None = None
    GROK_API_KEY: str | None = None
    XAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
 
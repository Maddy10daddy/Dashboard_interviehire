from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    port: int = 8000
    log_level: str = "info"
    allowed_origins: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"

settings = Settings()

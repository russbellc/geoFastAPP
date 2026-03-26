from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "GeoIntel API"
    API_V1_PREFIX: str = "/api/v1"

    # PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://geointel:geointel_dev_2024@postgres:5432/geointel"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # JWT
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24  # 24 horas

    # Claude API
    CLAUDE_API_KEY: str = ""

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()

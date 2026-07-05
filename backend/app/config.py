import os
from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v:
            raise ValueError("DATABASE_URL must be defined.")
        # Fail-fast validation: restrict database dialect to PostgreSQL (postgresql:// or postgresql+asyncpg:// or postgres://)
        if not v.startswith("postgresql") and not v.startswith("postgres"):
            raise ValueError(
                f"Fail-Safe Guardrail: DATABASE_URL must point to a PostgreSQL database (got '{v}'). "
                "Local file-based databases (e.g. SQLite) are prohibited to prevent container data loss."
            )
        return v

    class Config:
        # Load .env from the parent directory of backend/app/config.py (backend/)
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

try:
    settings = Settings()
except Exception as e:
    import sys
    print(f"CRITICAL INFRASTRUCTURE FAILURE: Env validation failed.\n{e}", file=sys.stderr)
    sys.exit(1)

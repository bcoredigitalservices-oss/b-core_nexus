import os
from pydantic_settings import BaseSettings
from pydantic import field_validator
import os


class Settings(BaseSettings):
    DATABASE_URL: str | None = None
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "bcore_dev_secret_change_me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v:
            # Provide a safe local sqlite dev fallback when no DATABASE_URL is set
            dev_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dev_bcore.db")
            v = f"sqlite+aiosqlite:///{dev_db_path}"
        # Accept either Postgres async dialects or sqlite+aiosqlite for local development
        if v.startswith("postgresql") or v.startswith("postgres"):
            return v
        if v.startswith("sqlite+aiosqlite://"):
            return v
        raise ValueError(
            f"Fail-Safe Guardrail: DATABASE_URL must point to a PostgreSQL database or a local sqlite+aiosqlite DB (got '{v}')."
        )

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

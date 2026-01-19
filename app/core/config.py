import os
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Multi-Tenant SaaS Control Plane"
    API_V1_STR: str = "/api/v1"
    
    # Database - Smart Fallback
    LOCAL_DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/control_plane",
        description="Local PostgreSQL connection (development)"
    )
    MASTER_DATABASE_URL: str = Field(
        default="",
        description="Remote PostgreSQL connection (production - NeonDB)"
    )
    
    @property
    def DATABASE_URL(self) -> str:
        """
        Smart fallback: Use LOCAL_DATABASE_URL if MASTER_DATABASE_URL is not set.
        This allows local development without changing config.
        """
        if self.MASTER_DATABASE_URL and self.MASTER_DATABASE_URL.strip():
            return self.MASTER_DATABASE_URL
        return self.LOCAL_DATABASE_URL
    
    # Security
    VAULT_MASTER_KEY: str = Field(..., description="32-byte hex string for credential encryption")
    SECRET_KEY: str = Field("changeme", description="Secret key for JWT generation")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # NeonDB API Configuration (for automated database creation)
    NEONDB_API_KEY: str = Field(default="", description="NeonDB API key")
    NEONDB_PROJECT_ID: str = Field(default="", description="NeonDB project ID")
    NEONDB_HOST: str = Field(default="", description="NeonDB host")
    NEONDB_USER: str = Field(default="", description="NeonDB username")
    NEONDB_PASSWORD: str = Field(default="", description="NeonDB password")
    
    # SMTP Settings
    SMTP_HOST: str = Field(default="smtp.gmail.com", description="SMTP host")
    SMTP_PORT: int = Field(default=587, description="SMTP port")
    SMTP_USER: str = Field(default="", description="SMTP username")
    SMTP_PASSWORD: str = Field(default="", description="SMTP password")
    EMAILS_FROM_EMAIL: str = Field(default="", description="Email sender address")
    EMAILS_FROM_NAME: str = Field(default="PakAi Nexus", description="Email sender name")
    
    # App Configuration
    APP_DOMAIN: str = Field(default="pakainexus.com", description="Base domain for tenant subdomains")
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
        description="Comma-separated list of allowed CORS origins"
    )
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

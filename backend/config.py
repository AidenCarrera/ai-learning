"""
Configuration management for AI-Learning API.
Centralizes all settings, constants, and environment variables.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Uses pydantic-settings for validation and type safety.
    """
    
    # ---- Required Settings ----
    OLLAMA_API_KEY: str  # Required - will raise error if not set
    
    # ---- API Configuration ----
    API_TITLE: str = "AI-Learning API"
    API_VERSION: str = "0.1.0"
    API_DESCRIPTION: str = "Generate flashcards from PDFs or text using AI"
    
    # ---- CORS Settings ----
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]
    
    # ---- File Upload Limits ----
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_TYPES: List[str] = [".pdf"]
    
    # ---- Text Processing Limits ----
    MAX_TEXT_LENGTH: int = 500_000  # 500KB of text (~200 pages)
    CHUNK_SIZE_CHARS: int = 2000    # Characters per chunk
    
    # ---- Flashcard Generation ----
    DEFAULT_FLASHCARD_COUNT: int = 5
    MIN_FLASHCARD_COUNT: int = 1
    MAX_FLASHCARD_COUNT: int = 20
    
    # ---- Ollama/LLM Configuration ----
    OLLAMA_HOST: str = "https://ollama.com"
    OLLAMA_MODEL: str = "gpt-oss:120b-cloud"
    OLLAMA_TIMEOUT: int = 60  # seconds
    OLLAMA_MAX_RETRIES: int = 3
    
    # ---- Logging Configuration ----
    LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields in .env
    )
    
    # ---- Computed Properties ----
    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB to bytes for file size validation"""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024
    
    @property
    def ollama_headers(self) -> dict:
        """Generate headers for Ollama API requests"""
        return {"Authorization": f"Bearer {self.OLLAMA_API_KEY}"}
    
    def validate_settings(self) -> None:
        """
        Validate settings on startup.
        Raises ValueError if configuration is invalid.
        """
        if not self.OLLAMA_API_KEY:
            raise ValueError("OLLAMA_API_KEY is required but not set")
        
        if self.MAX_FILE_SIZE_MB < 1:
            raise ValueError("MAX_FILE_SIZE_MB must be at least 1")
        
        if self.MAX_TEXT_LENGTH < 1000:
            raise ValueError("MAX_TEXT_LENGTH must be at least 1000 characters")
        
        if self.DEFAULT_FLASHCARD_COUNT < self.MIN_FLASHCARD_COUNT:
            raise ValueError("DEFAULT_FLASHCARD_COUNT cannot be less than MIN_FLASHCARD_COUNT")
        
        if self.DEFAULT_FLASHCARD_COUNT > self.MAX_FLASHCARD_COUNT:
            raise ValueError("DEFAULT_FLASHCARD_COUNT cannot exceed MAX_FLASHCARD_COUNT")


# ---- Singleton Instance ----
# Load settings once at module import
try:
    settings = Settings()
    settings.validate_settings()
except Exception as e:
    print(f"❌ Configuration Error: {str(e)}")
    print("Please check your .env file and ensure all required variables are set.")
    raise


# ---- Environment Check Helper ----
def is_production() -> bool:
    """Check if running in production environment"""
    return os.getenv("ENVIRONMENT", "development").lower() == "production"


def is_development() -> bool:
    """Check if running in development environment"""
    return not is_production()


# ---- Configuration Summary ----
def print_config_summary() -> None:
    """Print configuration summary on startup (for debugging)"""
    print("=" * 70)
    print(f"🚀 {settings.API_TITLE} v{settings.API_VERSION}")
    print("=" * 70)
    print(f"Environment:        {'Production' if is_production() else 'Development'}")
    print(f"Ollama API Key:     {'✓ Configured' if settings.OLLAMA_API_KEY else '✗ Missing'}")
    print(f"Ollama Model:       {settings.OLLAMA_MODEL}")
    print(f"Max File Size:      {settings.MAX_FILE_SIZE_MB}MB")
    print(f"Max Text Length:    {settings.MAX_TEXT_LENGTH:,} chars")
    print(f"Default Flashcards: {settings.DEFAULT_FLASHCARD_COUNT}")
    print(f"CORS Origins:       {', '.join(settings.CORS_ORIGINS)}")
    print(f"Log Level:          {settings.LOG_LEVEL}")
    print("=" * 70)
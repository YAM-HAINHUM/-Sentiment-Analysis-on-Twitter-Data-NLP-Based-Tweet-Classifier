from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "sentiment_db"
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    
    # AI/ML Config
    DEFAULT_MODEL: str = "best"
    ENABLE_AI_INSIGHTS: bool = True
    INSIGHTS_DAYS: int = 30
    
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    OPENAI_API_BASE: str = "https://api.openai.com"

    # Groq (free tier — https://console.groq.com/keys)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-8b-8192"
    GROQ_API_BASE: str = "https://api.groq.com/openai"
    USE_GROQ: bool = True

    # Ollama (local, free, no API key)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    OLLAMA_CONTEXT_MESSAGES: int = 10
    USE_OLLAMA: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()

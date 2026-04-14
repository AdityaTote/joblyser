import os

from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

APP_ROOT = Path(__file__).resolve().parents[2]
WORKSPACE_ROOT = APP_ROOT.parent

class Config(BaseSettings):
  gemini_api_key: str
  gemini_model: str
 
  tavily_search_key: str
 
  mongodb_uri: str
  mongodb_name: str

  postgres_host: str
  postgres_port: int
  postgres_password: str
  postgres_name: str
  postgres_user: str
 
  rag_service_uri: str

  rabbitmq_uri: str

  jwt_secret_key: str
  jwt_algorithm: str

 

  model_config = SettingsConfigDict(
    env_file=(APP_ROOT / ".env", WORKSPACE_ROOT / ".env"),
    env_file_encoding="utf-8",
    case_sensitive=False,
    extra="ignore",
  )

config = Config(
  gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
  gemini_model=os.getenv("GEMINI_MODEL", ""),
  tavily_search_key=os.getenv("TAVILY_SEARCH_KEY", ""),
  jwt_secret_key=os.getenv("WORKER_JWT_SECRET_KEY", ""),
  jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
  rag_service_uri=os.getenv("RAG_SERVICE_URI", "http://localhost:8080/api/v1"),
  postgres_host=os.getenv("POSTGRES_HOST", "localhost"),
  postgres_port=int(os.getenv("POSTGRES_PORT", 5432)),
  postgres_name=os.getenv("POSTGRES_NAME", "postgres"),
  postgres_password=os.getenv("POSTGRES_PASSWORD", "postgres"),
  postgres_user=os.getenv("POSTGRES_USER", "postgres"),
  mongodb_uri=os.getenv("MONGODB_URI", ""),
  mongodb_name=os.getenv("MONGODB_NAME", ""),
  rabbitmq_uri=os.getenv("RABBITMQ_URI", ""),
)
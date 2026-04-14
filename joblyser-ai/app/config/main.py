from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[2]
WORKSPACE_ROOT = APP_ROOT.parent

class Config(BaseSettings):
  chroma_host: str
  chroma_port: int
  chroma_collection: str
  chroma_ssl: bool
  aws_access_key_id: str
  aws_secret_access_key: str
  aws_region_name: str
  aws_bucket: str
  aws_cloudfront_url: str
  jwt_secret_key_worker: str
  jwt_secret_key_api: str
  jwt_algorithm: str = "HS256"
  postgres_host: str
  postgres_port: int
  postgres_password: str
  postgres_name: str
  postgres_user: str
  mongodb_uri: str
  mongodb_name: str
  rabbitmq_uri: str
  s3_max_upload_size_mb: int = 5

  model_config = SettingsConfigDict(
    env_file=(APP_ROOT / ".env", WORKSPACE_ROOT / ".env"),
    env_file_encoding="utf-8",
    case_sensitive=False,
    extra="ignore",
  )

config = Config()
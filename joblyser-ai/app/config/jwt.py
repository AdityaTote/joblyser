from enum import StrEnum

from jwt import decode
from app.config import config

class DepSvc(StrEnum):
  worker = "worker"
  api = "api"

class JWT:
  def __init__(self, secret_worker: str, secret_api: str):
    self._secret_worker = secret_worker
    self._secret_api = secret_api

  def verify(self, token, svc: DepSvc, algorithms: list[str] | None = None):
    effective_algorithms = algorithms or [config.jwt_algorithm]
    return decode(
      token,
      self._secret_api if svc == DepSvc.api else self._secret_worker,
      algorithms=effective_algorithms,
      issuer=svc.value,
      options={"verify_aud": False},
    )

jwt = JWT(secret_api=config.jwt_secret_key_api, secret_worker=config.jwt_secret_key_worker)
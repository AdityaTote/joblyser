from enum import StrEnum

from jwt import decode
from jwt.exceptions import InvalidTokenError
from app.config import config

class DepSvc(StrEnum):
  worker = "worker"
  api = "api"
  auth = "auth"

class JWT:
  def __init__(self, secret_worker: str, secret_api: str, secret_auth: str):
    self._secret_by_service = {
      DepSvc.worker: secret_worker,
      DepSvc.api: secret_api,
      DepSvc.auth: secret_auth,
    }

  def verify(self, token: str, svc: DepSvc, algorithms: list[str] | None = None):
    effective_algorithms = algorithms or [config.jwt_algorithm]
    secret = self._secret_by_service.get(svc)

    if not secret:
      raise ValueError(f"Unsupported service for JWT verification: {svc}")

    return decode(
      token,
      secret,
      algorithms=effective_algorithms,
      issuer=svc.value,
      options={"verify_aud": False},
    )

  def verify_any(
    self,
    token: str,
    preferred_svc: DepSvc | None = None,
    algorithms: list[str] | None = None,
  ) -> tuple[dict, DepSvc]:
    candidate_services = [DepSvc.api, DepSvc.worker, DepSvc.auth]
    if preferred_svc is not None:
      candidate_services = [preferred_svc, *[svc for svc in candidate_services if svc != preferred_svc]]

    last_error: InvalidTokenError | None = None

    for svc in candidate_services:
      try:
        decoded = self.verify(token=token, svc=svc, algorithms=algorithms)
        return decoded, svc
      except InvalidTokenError as error:
        last_error = error

    if last_error is not None:
      raise last_error

    raise ValueError("Unable to verify token")

jwt = JWT(secret_api=config.jwt_secret_key_api, secret_worker=config.jwt_secret_key_worker, secret_auth=config.jwt_secret_key_auth)
import httpx
import jwt

from app.schema.rag import RagQuery
from app.core.config import config

class RagService:
	@staticmethod
	async def retrieve(query: RagQuery):
		token = jwt.encode(
			{"user_id": query.user_id, "iss": "worker"},
			config.jwt_secret_key,
			algorithm=config.jwt_algorithm,
		)
		base_url = config.rag_service_uri.rstrip("/")
		if not base_url.endswith("/api/v1"):
			base_url = f"{base_url}/api/v1"
		headers = {
			"X-Service-Name": "worker",
			"Authorization": f"Bearer {token}",
			"Content-Type": "application/json",
		}
		async with httpx.AsyncClient() as client:
			res = await client.post(f"{base_url}/rag/retrieval", headers=headers, json=query.dict())
			res.raise_for_status()
		payload = res.json()
		if isinstance(payload, dict) and "data" in payload:
			return payload.get("data")
		return payload
from pydantic import BaseModel

ALLOWED_CONTENT_TYPES = {
    "application/pdf": ".pdf",
}

class GeneratePresignedURLResponseSchema(BaseModel):
    upload_url: str
    object_key: str
import uuid
from typing import Any
import boto3
import httpx

from app.config import config
from .schema import GeneratePresignedURLResponseSchema, ALLOWED_CONTENT_TYPES


class S3Client:
    def __init__(self, bucket_name: str):
        self._bucket = bucket_name
        self._max_upload_size_bytes = config.s3_max_upload_size_mb * 1024 * 1024
        self._client = boto3.client(
            "s3",
            aws_access_key_id=config.aws_access_key_id,
            aws_secret_access_key=config.aws_secret_access_key,
            region_name=config.aws_region_name,
        )

    def generate_put_presigned_url(
        self,
        content_type: str,
        file_size_bytes: int | None = None,
        expires_in: int = 300,
    ):
        self._validate_upload(content_type, file_size_bytes)
        object_key = self._generate_object_key(content_type)

        params: dict[str, Any] = {
            "Bucket": self._bucket,
            "Key": object_key,
            "ContentType": content_type,
        }
        if file_size_bytes is not None:
            params["ContentLength"] = file_size_bytes

        url = self._client.generate_presigned_url(
            ClientMethod="put_object",
            Params=params,
            ExpiresIn=expires_in,
            HttpMethod="PUT",
        )

        return GeneratePresignedURLResponseSchema(
            object_key=object_key,
            upload_url=url,
        )

    def upload_file_to_presigned_url(
        self, url: str, object_key: str, file: bytes, content_type: str
    ):
        self._validate_upload(content_type, len(file))
        response = httpx.put(
            url,
            headers={
                "Content-Type": content_type,
            },
            content=file,
            timeout=60,
        )

        response.raise_for_status()

        if config.aws_cloudfront_url:
            return f"{config.aws_cloudfront_url.rstrip('/')}/{object_key}"
        return object_key

    def _generate_object_key(self, content_type: str):
        ext = ALLOWED_CONTENT_TYPES[content_type]
        return f"uploads/{uuid.uuid4()}{ext}"

    def _validate_upload(self, content_type: str, file_size_bytes: int | None = None):
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise ValueError("Unsupported file type")
        if file_size_bytes is not None and file_size_bytes > self._max_upload_size_bytes:
            raise ValueError(
                f"File too large: {file_size_bytes} bytes. "
                f"Maximum allowed is {self._max_upload_size_bytes} bytes "
                f"({config.s3_max_upload_size_mb} MB)."
            )


s3 = S3Client(bucket_name=config.aws_bucket)
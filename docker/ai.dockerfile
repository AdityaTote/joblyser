FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	UV_LINK_MODE=copy \
	UV_PYTHON_DOWNLOADS=never

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY ./joblyser-ai/pyproject.toml ./joblyser-ai/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY ./joblyser-ai/ ./
RUN uv sync --frozen --no-dev

FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	PATH="/app/.venv/bin:$PATH" \
	HOST=0.0.0.0 \
	PORT=8080 \
	RELOAD=false

WORKDIR /app

RUN useradd --system --create-home --uid 10001 appuser

COPY --from=builder /app /app
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

CMD ["python", "main.py"]
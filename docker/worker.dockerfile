FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	UV_LINK_MODE=copy \
	UV_PYTHON_DOWNLOADS=never

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY ./agent-worker/pyproject.toml ./agent-worker/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY ./agent-worker/ ./
RUN uv sync --frozen --no-dev

FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	PATH="/app/.venv/bin:$PATH"

WORKDIR /app

RUN useradd --system --create-home --uid 10001 appuser

COPY --from=builder /app /app
RUN chown -R appuser:appuser /app

USER appuser

CMD ["python", "main.py"]
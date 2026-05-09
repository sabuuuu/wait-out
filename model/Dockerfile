# ── Stage 1: builder ────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build tools (needed to compile some wheels; not included in final image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install into a separate prefix so we can copy just the packages
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: runner ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS runner

WORKDIR /app

# Create a non-root user — running as root inside a container is a security risk
RUN addgroup --system pausy && adduser --system --ingroup pausy pausy

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY main.py model.py ./

# Switch to non-root
USER pausy

# Health check — Railway / Fly will mark the container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

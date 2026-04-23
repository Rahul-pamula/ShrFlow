# ============================================================
# Email Engine — Backend API (FastAPI)
# ============================================================
# ── Builder Stage ──────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app
# Install build dependencies (e.g., gcc) if needed for some python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment so we can easily copy it to the final stage
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY platform/api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ── Final Stage ────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install only runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the compiled virtual environment from the builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy source code exactly matching the nested directory structure
COPY platform/api/ ./platform/api/

# Keep the nested path context matching local environments
WORKDIR /app/platform/api

# Create assets directory
RUN mkdir -p assets

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

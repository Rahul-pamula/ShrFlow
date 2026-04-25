# ============================================================
# Email Engine — Background Workers
# ============================================================
# ── Builder Stage ──────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app
# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY platform/api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ── Final Stage ────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy source configuration to mirror monolithic architecture
COPY platform/ ./platform/

# Set Python path so worker scripts can import correctly
ENV PYTHONPATH="/app/platform/api"
WORKDIR /app/platform/worker

# Start the primary worker (can be overridden by docker-compose)
CMD ["python", "email_sender.py"]

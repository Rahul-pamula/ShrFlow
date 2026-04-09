# ============================================================
# Email Engine — Backend API (FastAPI)
# ============================================================
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (layer caching)
COPY platform/api/requirements.txt ./platform/api/
RUN pip install --no-cache-dir -r platform/api/requirements.txt

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

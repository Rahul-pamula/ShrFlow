# ============================================================
# Email Engine — Background Workers
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

# Copy source configuration to mirror monolithic architecture
COPY platform/ ./platform/

# Set Python path so worker scripts can import correctly
ENV PYTHONPATH="/app/platform/api"
WORKDIR /app/platform/worker

# Start the primary worker (can be overridden by docker-compose)
CMD ["python", "email_sender.py"]

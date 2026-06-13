FROM python:3.11-slim

# Security: don't run as root
RUN useradd -m -u 1000 actarium

WORKDIR /app

# Install system deps for lxml, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libxml2-dev libxslt-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Ensure data directories exist
RUN mkdir -p data/raw data/audio chroma_db

# Change ownership
RUN chown -R actarium:actarium /app
USER actarium

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

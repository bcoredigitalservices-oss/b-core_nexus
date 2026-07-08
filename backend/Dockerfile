FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if any are required later
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Copy entrypoint script and make it executable (handles Windows CRLF formatting issues too)
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && \
    sed -i 's/\r$//' /app/docker-entrypoint.sh

# Set environment path to find modules correctly
ENV PYTHONPATH=/app

# Expose internal port 8000
EXPOSE 8000

# Set the entrypoint to run migrations first
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Run uvicorn server (this gets passed to the entrypoint script)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

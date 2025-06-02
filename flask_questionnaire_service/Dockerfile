# Build stage
FROM python:3.10-slim AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Final stage
FROM python:3.10-slim

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy wheels from builder stage
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt && \
    rm -rf /wheels

# Copy application code
COPY . .

# Create a directory for logs
RUN mkdir -p /app/logs && chown -R appuser:appuser /app

# Set environment variables
ENV PORT=5001
ENV BACKEND_API_URL=http://backend:5000
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Expose the port
EXPOSE 5001

# Switch to non-root user
USER appuser

# Run the application with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "4", "--log-level", "info", "app:app"] 
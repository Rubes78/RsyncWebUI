# Base Image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy all files into container
COPY . /app

# Install required Python packages
RUN pip install --no-cache-dir flask

# Install rsync (needed for sync functionality)
RUN apt-get update && apt-get install -y rsync && apt-get clean && rm -rf /var/lib/apt/lists/*

# Expose Flask app port
EXPOSE 5050

# Default command
CMD ["python", "rsync_web_browser.py"]

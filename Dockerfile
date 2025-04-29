FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y rsync && \
    pip install flask schedule && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy source files
COPY . /app

# Expose the Flask port
EXPOSE 5050

# Run the application
CMD ["python", "rsync_web_browser.py"]

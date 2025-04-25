# RsyncWebUI Minimal Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install rsync and Flask
RUN apt-get update && apt-get install -y rsync && \
    pip install flask && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Expose Flask app port
EXPOSE 5050

# Run the app
CMD ["python", "rsync_web_browser.py"]

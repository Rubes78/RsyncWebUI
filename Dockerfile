FROM python:3.9-slim

WORKDIR /app

# Install rsync and cleanup
RUN apt-get update && apt-get install -y rsync && rm -rf /var/lib/apt/lists/*

COPY . /app
COPY start.sh /app/start.sh
COPY scheduler_runner.py /app/scheduler_runner.py

RUN pip install --no-cache-dir -r requirements.txt

RUN chmod +x /app/start.sh

ENV FLASK_APP=rsync_web_browser.py
ENV FLASK_ENV=production

EXPOSE 5050

CMD ["/app/start.sh"]

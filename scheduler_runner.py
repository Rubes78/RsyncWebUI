
import json
import subprocess
import time
import sys
import os
from datetime import datetime, timezone
from pathlib import Path

CONFIG_DIR = Path("/app/config")
SCHEDULE_FILE = CONFIG_DIR / "scheduled_jobs.json"
HISTORY_FILE = CONFIG_DIR / "sync_history.json"
BROWSE_ROOT = os.environ.get("BROWSE_ROOT", "/mnt/data")
CHECK_INTERVAL = 60  # seconds

FORCE_MODE = "--force" in sys.argv

def log(msg):
    print(f"[{datetime.now().astimezone().isoformat()}] {msg}", flush=True)

def load_json(path):
    if not path.exists():
        return []
    with open(path, "r") as f:
        return json.load(f)

def save_history(entry):
    history = load_json(HISTORY_FILE)
    history.append(entry)
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2, default=str)
    log("History updated")

def should_run(job, now):
    if FORCE_MODE:
        log("FORCE mode enabled — skipping schedule checks")
        return True

    last_run = job.get("last_run")
    if last_run:
        last_run = datetime.fromisoformat(last_run)
    else:
        last_run = datetime.min.replace(tzinfo=timezone.utc)

    recurrence = job.get("scheduleType", "once")
    scheduled_str = job.get("scheduleDateTime")
    try:
        scheduled_time = datetime.fromisoformat(scheduled_str)
        if scheduled_time.tzinfo is None:
            scheduled_time = scheduled_time.replace(tzinfo=timezone.utc)
    except Exception as e:
        log(f"Invalid datetime format in job {job.get('id', '?')}: {e}")
        return False

    log(f"Evaluating job: {job['source']} → {job['destination']} | recurrence: {recurrence}")
    log(f"Scheduled for: {scheduled_time.isoformat()}, Last run: {last_run.isoformat()}, Now: {now.isoformat()}")

    if recurrence == "once":
        return last_run == datetime.min.replace(tzinfo=timezone.utc) and now >= scheduled_time
    elif recurrence == "daily":
        return now.date() > last_run.date() and now.time() >= scheduled_time.time()
    elif recurrence == "weekly":
        return (now - last_run).days >= 7 and now.time() >= scheduled_time.time()
    else:
        log("Unknown recurrence; skipping")
        return False

def resolve_path(rel_path):
    # Convert web-style relative path into an absolute path inside container
    return os.path.abspath(os.path.join(BROWSE_ROOT, rel_path.lstrip("/")))

def run_rsync(job):
    source = job["source"]
    destination = job["destination"]
    options = job.get("options", "-avh --progress")

    abs_source = resolve_path(source)
    abs_dest = resolve_path(destination)

    command = f'rsync {options} "{abs_source}" "{abs_dest}"'

    log(f"Running rsync: {command}")

    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        log(f"rsync completed with return code {result.returncode}")
        if result.stdout:
            log("STDOUT:\n" + result.stdout)
        if result.stderr:
            log("STDERR:\n" + result.stderr)

        return {
            "source": source,
            "destination": destination,
            "options": options,
            "timestamp": datetime.now().astimezone().isoformat(),
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "returncode": result.returncode
        }
    except Exception as e:
        log(f"Exception during rsync: {str(e)}")
        return {
            "source": source,
            "destination": destination,
            "options": options,
            "timestamp": datetime.now().astimezone().isoformat(),
            "stdout": "",
            "stderr": str(e),
            "returncode": -1
        }

def update_last_run(job, now):
    job["last_run"] = now.isoformat()

def main():
    log("Scheduler started")
    while True:
        now = datetime.now().astimezone()
        schedule = load_json(SCHEDULE_FILE)
        updated = False

        for job in schedule:
            if should_run(job, now):
                result = run_rsync(job)
                save_history(result)
                update_last_run(job, now)
                updated = True
            else:
                log("Job not due yet")

        if updated:
            with open(SCHEDULE_FILE, "w") as f:
                json.dump(schedule, f, indent=2)

        if FORCE_MODE:
            break

        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()

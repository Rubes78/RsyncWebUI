from flask import Flask, render_template, request, jsonify
import subprocess, json, os, uuid, time, threading
from pathlib import Path
from datetime import datetime, timedelta

# Try to import schedule, but don't fail if it's not available
try:
    import schedule
    SCHEDULER_AVAILABLE = True
except ImportError:
    SCHEDULER_AVAILABLE = False
    print("Warning: 'schedule' module not found. Scheduling functionality will be disabled.")

app = Flask(__name__, static_url_path='/static', static_folder='static', template_folder='templates')

# Configuration using environment variables with sensible defaults
# CONFIG_PATH: Directory for persistent JSON files (default: /app/config in Docker, current dir otherwise)
# HISTORY_FILENAME: Filename for sync history (default: sync_history.json)
# PATHS_FILENAME: Filename for saved paths (default: saved_paths.json)
# BROWSE_ROOT: Root directory for file browsing (default: /mnt/data)

default_config_dir = "/app/config" if Path("/app/config").exists() or os.environ.get("FLASK_ENV") else "."
CONFIG_DIR = Path(os.environ.get("CONFIG_PATH", default_config_dir))
CONFIG_DIR.mkdir(exist_ok=True)  # Ensure the directory exists

HISTORY_FILE = CONFIG_DIR / os.environ.get("HISTORY_FILENAME", "sync_history.json")
PATHS_FILE = CONFIG_DIR / os.environ.get("PATHS_FILENAME", "saved_paths.json")
SCHEDULED_JOBS_FILE = CONFIG_DIR / os.environ.get("SCHEDULED_JOBS_FILENAME", "scheduled_jobs.json")
BROWSE_ROOT = os.environ.get("BROWSE_ROOT", "/mnt/data")

print(f"Using config directory: {CONFIG_DIR.absolute()}")
print(f"History file: {HISTORY_FILE}")
print(f"Paths file: {PATHS_FILE}")
print(f"Scheduled jobs file: {SCHEDULED_JOBS_FILE}")
print(f"Browse root: {BROWSE_ROOT}")

# Global variable to store the scheduler thread
scheduler_thread = None

@app.route("/")
def index():
    return render_template("select.html")

@app.route("/schedule")
def schedule_page():
    return render_template("schedule.html")

@app.route("/run_rsync_stream", methods=["POST"])
def run_rsync_stream():
    source = request.form["source"]
    destination = request.form["destination"]
    options = request.form["options"]

    abs_source = os.path.abspath(os.path.join(BROWSE_ROOT, source.lstrip("/")))
    abs_dest = os.path.abspath(os.path.join(BROWSE_ROOT, destination.lstrip("/")))

    cmd = ["rsync"] + options.split() + [abs_source, abs_dest]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

    history = json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else []

    def generate():
        output = ""
        for line in iter(proc.stdout.readline, ''):
            output += line
            yield line
        proc.stdout.close()
        proc.wait()

        job = {
            "timestamp": datetime.now().astimezone().isoformat(),
            "source": source,
            "destination": destination,
            "options": options,
            "stdout": output,
            "stderr": "",
            "returncode": proc.returncode
        }
        history.insert(0, job)
        HISTORY_FILE.write_text(json.dumps(history, indent=2))

    return app.response_class(generate(), mimetype="text/plain")

@app.route("/history")
def history():
    return jsonify(json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else [])

@app.route("/paths", methods=["GET", "POST"])
def saved_paths():
    if request.method == "POST":
        PATHS_FILE.write_text(json.dumps(request.json, indent=2))
        return jsonify(success=True)
    return jsonify(json.loads(PATHS_FILE.read_text()) if PATHS_FILE.exists() else {})

@app.route("/browse")
def browse():
    rel_path = request.args.get("path", "/")
    full_path = os.path.abspath(os.path.join(BROWSE_ROOT, rel_path.lstrip("/")))

    if not full_path.startswith(BROWSE_ROOT):
        return jsonify(error="Invalid path"), 400

    try:
        entries = sorted(os.listdir(full_path))
        result = [{
            "name": entry,
            "is_dir": os.path.isdir(os.path.join(full_path, entry))
        } for entry in entries]
        return jsonify(current=rel_path, contents=result)
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route("/create_folder", methods=["POST"])
def create_folder():
    rel_path = request.json.get("path")
    name = request.json.get("name")
    target = os.path.abspath(os.path.join(BROWSE_ROOT, rel_path.lstrip("/"), name))

    if not target.startswith(BROWSE_ROOT):
        return jsonify(success=False, error="Invalid folder path")

    try:
        os.makedirs(target, exist_ok=True)
        return jsonify(success=True, new_path=os.path.relpath(target, BROWSE_ROOT))
    except Exception as e:
        return jsonify(success=False, error=str(e))

@app.route("/delete_history", methods=["POST"])
def delete_history():
    indices = request.json.get("indices", [])
    if not HISTORY_FILE.exists():
        return jsonify(success=False)
    history = json.loads(HISTORY_FILE.read_text())
    history = [h for i, h in enumerate(history) if i not in indices]
    HISTORY_FILE.write_text(json.dumps(history, indent=2))
    return jsonify(success=True)

@app.route("/scheduled_jobs", methods=["GET"])
def get_scheduled_jobs():
    if SCHEDULED_JOBS_FILE.exists():
        return jsonify(json.loads(SCHEDULED_JOBS_FILE.read_text()))
    return jsonify([])

@app.route("/schedule_job", methods=["POST"])
def schedule_job():
    try:
        job_data = request.json
        
        # Generate a unique ID for the job
        job_data["id"] = str(uuid.uuid4())
        
        # Add creation timestamp
        job_data["created_at"] = datetime.now().astimezone().isoformat()
        
        # Load existing jobs
        jobs = []
        if SCHEDULED_JOBS_FILE.exists():
            jobs = json.loads(SCHEDULED_JOBS_FILE.read_text())
        
        # Add the new job
        jobs.append(job_data)
        
        # Save jobs back to file
        SCHEDULED_JOBS_FILE.write_text(json.dumps(jobs, indent=2))
        
        # Update the scheduler
        update_scheduler()
        
        return jsonify({"success": True, "id": job_data["id"]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/delete_scheduled_job", methods=["POST"])
def delete_scheduled_job():
    try:
        job_id = request.json.get("id")
        
        if not SCHEDULED_JOBS_FILE.exists():
            return jsonify({"success": False, "error": "No scheduled jobs found"})
        
        # Load existing jobs
        jobs = json.loads(SCHEDULED_JOBS_FILE.read_text())
        
        # Filter out the job to delete
        jobs = [job for job in jobs if job.get("id") != job_id]
        
        # Save jobs back to file
        SCHEDULED_JOBS_FILE.write_text(json.dumps(jobs, indent=2))
        
        # Update the scheduler
        update_scheduler()
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/delete_scheduled_jobs", methods=["POST"])
def delete_scheduled_jobs():
    try:
        job_ids = request.json.get("ids", [])
        
        if not SCHEDULED_JOBS_FILE.exists():
            return jsonify({"success": False, "error": "No scheduled jobs found"})
        
        # Load existing jobs
        jobs = json.loads(SCHEDULED_JOBS_FILE.read_text())
        
        # Filter out the jobs to delete
        jobs = [job for job in jobs if job.get("id") not in job_ids]
        
        # Save jobs back to file
        SCHEDULED_JOBS_FILE.write_text(json.dumps(jobs, indent=2))
        
        # Update the scheduler
        update_scheduler()
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

def run_scheduled_rsync(job):
    """Run an rsync job from a scheduled task"""
    source = job["source"]
    destination = job["destination"]
    options = job["options"]
    
    abs_source = os.path.abspath(os.path.join(BROWSE_ROOT, source.lstrip("/")))
    abs_dest = os.path.abspath(os.path.join(BROWSE_ROOT, destination.lstrip("/")))
    
    cmd = ["rsync"] + options.split() + [abs_source, abs_dest]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    output = ""
    for line in iter(proc.stdout.readline, ''):
        output += line
    proc.stdout.close()
    proc.wait()
    
    # Record in history
    history = json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else []
    
    history_entry = {
        "timestamp": datetime.now().astimezone().isoformat(),
        "source": source,
        "destination": destination,
        "options": options,
        "stdout": output,
        "stderr": "",
        "returncode": proc.returncode,
        "scheduled": True,
        "job_id": job.get("id", "unknown")
    }
    
    history.insert(0, history_entry)
    HISTORY_FILE.write_text(json.dumps(history, indent=2))
    
    return history_entry

def update_scheduler():
    """Update the scheduler with the current jobs"""
    global scheduler_thread
    
    try:
        # Import schedule here to avoid issues if the module is not available
        import schedule
        
        # Clear all scheduled jobs
        schedule.clear()
        
        if not SCHEDULED_JOBS_FILE.exists():
            return
        
        jobs = json.loads(SCHEDULED_JOBS_FILE.read_text())
        
        for job in jobs:
            if job["scheduleType"] == "once":
                # Parse the datetime
                run_time = datetime.fromisoformat(job["scheduleDateTime"].replace('Z', '+00:00'))
                
                # If the time is in the past, skip it
                if run_time < datetime.now():
                    continue
                
                # Schedule the job
                schedule.once(run_time, run_scheduled_rsync, job)
            else:
                # Handle recurring jobs
                if job["frequency"] == "hourly":
                    interval = int(job["hourlyInterval"])
                    schedule.every(interval).hours.do(run_scheduled_rsync, job)
                
                elif job["frequency"] == "daily":
                    interval = int(job["dailyInterval"])
                    time_parts = job["dailyTime"].split(":")
                    hour, minute = int(time_parts[0]), int(time_parts[1])
                    
                    schedule.every(interval).days.at(f"{hour:02d}:{minute:02d}").do(run_scheduled_rsync, job)
                
                elif job["frequency"] == "weekly":
                    interval = int(job["weeklyInterval"])
                    time_parts = job["weeklyTime"].split(":")
                    hour, minute = int(time_parts[0]), int(time_parts[1])
                    
                    for day in job["weekdays"]:
                        day_name = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][int(day)]
                        getattr(schedule.every(interval).weeks, day_name).at(f"{hour:02d}:{minute:02d}").do(run_scheduled_rsync, job)
                
                elif job["frequency"] == "monthly":
                    day = int(job["monthDay"])
                    time_parts = job["monthlyTime"].split(":")
                    hour, minute = int(time_parts[0]), int(time_parts[1])
                    
                    # This is a bit of a hack since schedule doesn't support monthly directly
                    def monthly_job():
                        now = datetime.now()
                        target_day = day
                        
                        # If today is the target day and we haven't passed the time yet, run today
                        if now.day == target_day and now.hour < hour or (now.hour == hour and now.minute < minute):
                            run_scheduled_rsync(job)
                    
                    # Run the monthly check daily
                    schedule.every().day.at(f"{hour:02d}:{minute:02d}").do(monthly_job)
        
        # Start the scheduler in a background thread if not already running
        if scheduler_thread is None or not scheduler_thread.is_alive():
            def run_scheduler():
                while True:
                    schedule.run_pending()
                    time.sleep(60)  # Check every minute
            
            scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
            scheduler_thread.start()
    except ImportError:
        print("Warning: 'schedule' module not found. Scheduling functionality will be disabled.")
    except Exception as e:
        print(f"Warning: Error initializing scheduler: {e}")

if __name__ == "__main__":
    # Initialize the scheduler if the schedule module is available
    try:
        update_scheduler()
        print("Scheduler initialized successfully")
    except Exception as e:
        print(f"Warning: Could not initialize scheduler: {e}")
        print("Scheduling functionality will be disabled")
    
    app.run(host="0.0.0.0", port=5050)

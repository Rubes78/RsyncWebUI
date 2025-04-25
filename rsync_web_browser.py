from flask import Flask, render_template, request, jsonify
import subprocess, json, os
from pathlib import Path
from datetime import datetime

app = Flask(__name__, static_url_path='/static', static_folder='static', template_folder='templates')

MOUNT_TRANSLATIONS = {
    '/Quarks': '/mnt/data/Quarks',
    '/USB': '/mnt/data/USB'
}

CONFIG_DIR = Path("config")
HISTORY_FILE = CONFIG_DIR / "sync_history.json"
PATHS_FILE = CONFIG_DIR / "saved_paths.json"

@app.route("/")
def index():
    return render_template("select.html")

def translate_path(path):
    for external, internal in MOUNT_TRANSLATIONS.items():
        if path.startswith(external):
            return path.replace(external, internal, 1)
    return path

@app.route("/browse")
def browse():
    path = request.args.get("path", "/")
    if path == "/":
        # Virtual root view
        result = [{"name": "Quarks", "is_dir": True}, {"name": "USB", "is_dir": True}]
        return jsonify(current=path, contents=result)

    real_path = translate_path(path)
    try:
        entries = sorted(os.listdir(real_path))
        result = [{"name": entry, "is_dir": os.path.isdir(os.path.join(real_path, entry))} for entry in entries]
        return jsonify(current=path, contents=result)
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route("/run_rsync", methods=["POST"])
def run_rsync():
    source = request.form["source"]
    destination = request.form["destination"]
    options = request.form["options"]

    real_source = translate_path(source)
    real_destination = translate_path(destination)

    cmd = ["rsync"] + options.split() + [real_source + "/", real_destination + "/"]
    result = subprocess.run(cmd, capture_output=True, text=True)

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    history = json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else []
    job = {
        "timestamp": datetime.now().astimezone().isoformat(),
        "source": source,
        "destination": destination,
        "options": options,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "returncode": result.returncode
    }
    history.insert(0, job)
    HISTORY_FILE.write_text(json.dumps(history, indent=2))

    return jsonify(stdout=result.stdout, stderr=result.stderr, returncode=result.returncode)

@app.route("/history", methods=["GET", "POST"])
def history():
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if request.method == "POST":
        jobs = request.get_json()
        HISTORY_FILE.write_text(json.dumps(jobs, indent=2))
        return '', 204
    else:
        return jsonify(json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else [])

@app.route("/paths", methods=["GET", "POST"])
def paths():
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if request.method == "POST":
        data = request.json
        PATHS_FILE.write_text(json.dumps(data, indent=2))
        return '', 204
    else:
        return jsonify(json.loads(PATHS_FILE.read_text()) if PATHS_FILE.exists() else {})

@app.route("/create_folder", methods=["POST"])
def create_folder():
    data = request.get_json()
    base = translate_path(data["base"])
    name = data["name"]
    try:
        Path(base, name).mkdir(parents=True, exist_ok=True)
        return '', 204
    except Exception as e:
        return jsonify(error=str(e)), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)

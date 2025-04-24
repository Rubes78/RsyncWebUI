
from flask import Flask, render_template, request, jsonify, send_from_directory
import subprocess, json, os
from pathlib import Path
from datetime import datetime

app = Flask(__name__, static_url_path='/static', static_folder='static', template_folder='templates')
HISTORY_FILE = Path("sync_history.json")

@app.route("/")
def index():
    return render_template("select.html")

@app.route("/run_rsync", methods=["POST"])
def run_rsync():
    source = request.form["source"]
    destination = request.form["destination"]
    options = request.form["options"]
    cmd = ["rsync"] + options.split() + [source, destination]
    result = subprocess.run(cmd, capture_output=True, text=True)

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
    history.append(job)
    HISTORY_FILE.write_text(json.dumps(history, indent=2))

    return jsonify(stdout=result.stdout, stderr=result.stderr, returncode=result.returncode)

@app.route("/history")
def history():
    return jsonify(json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else [])

@app.route("/browse")
def browse():
    path = request.args.get("path", "/")
    try:
        entries = sorted(os.listdir(path))
        result = [{"name": entry, "is_dir": os.path.isdir(os.path.join(path, entry))} for entry in entries]
        return jsonify(current=path, contents=result)
    except Exception as e:
        return jsonify(error=str(e)), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)

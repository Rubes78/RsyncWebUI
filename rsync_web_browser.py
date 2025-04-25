from flask import Flask, render_template, request, jsonify
import subprocess, json, os
from pathlib import Path
from datetime import datetime

app = Flask(__name__, static_url_path='/static', static_folder='static', template_folder='templates')

HISTORY_FILE = Path("sync_history.json")
PATHS_FILE = Path("saved_paths.json")
BROWSE_ROOT = "/mnt/data"

@app.route("/")
def index():
    return render_template("select.html")

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)

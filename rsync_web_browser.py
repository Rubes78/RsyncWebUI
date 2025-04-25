
from flask import Flask, render_template, request, jsonify, Response
import subprocess, json, os, re
from pathlib import Path
from datetime import datetime

app = Flask(__name__, static_folder='static', template_folder='templates')

HISTORY_FILE = Path("sync_history.json")
PATHS_FILE = Path("saved_paths.json")

@app.route("/")
def index():
    return render_template("select.html")

@app.route("/paths", methods=["GET", "POST"])
def paths():
    if request.method == "POST":
        data = request.get_json()
        PATHS_FILE.write_text(json.dumps(data, indent=2))
        return '', 204
    return jsonify(json.loads(PATHS_FILE.read_text()) if PATHS_FILE.exists() else {})

@app.route("/history")
def history():
    return jsonify(json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else [])

@app.route("/browse")
def browse():
    path = request.args.get("path", "/")
    try:
        entries = sorted(os.listdir(path))
        contents = [{"name": e, "is_dir": os.path.isdir(os.path.join(path, e))} for e in entries]
        return jsonify(current=path, contents=contents)
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route("/run_rsync_stream", methods=["POST"])
def run_rsync_stream():
    source = request.form["source"]
    destination = request.form["destination"]
    options = request.form["options"]
    cmd = ["rsync"] + options.split() + [source, destination]

    def generate():
        start_time = datetime.now()
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        output = ""
        for line in proc.stdout:
            output += line
            yield line
        proc.wait()
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        file_count = None
        match = re.search(r'Number of regular files transferred: (\d+)', output)
        if match:
            file_count = int(match.group(1))

        job = {
            "timestamp": datetime.now().astimezone().isoformat(),
            "source": source,
            "destination": destination,
            "options": options,
            "stdout": output,
            "stderr": "",
            "returncode": proc.returncode,
            "duration": duration,
            "file_count": file_count
        }

        history = json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else []
        history.insert(0, job)
        HISTORY_FILE.write_text(json.dumps(history[:50], indent=2))

    return Response(generate(), mimetype="text/plain")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)

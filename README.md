# RsyncWebUI

A lightweight, browser-based interface to run and manage `rsync` jobs.  
Perfect for syncing folders across local systems with visual control, history, and logging.

---

## 🚀 Features

- 🔍 Browse & select source/destination paths from root
- ⚙️ Configure rsync options (`-avh`, `--progress`, etc.)
- 🕘 View full sync history
- ✅ Re-run any previous job
- 📁 Create folders directly within the browser modal
- ✅ Auto-select newly created folders
- ✅ Live sync log with show/hide toggle
- 📉 Log output truncated to last 100 lines (for clarity)
- ✅ Sync notification bar with timestamp
- 🗑 Select & delete sync history entries
- ☑ Select-all checkbox with header toggle
- 🔁 Restartable via `run_webui.sh`

---

## 📦 How to Run

### 1. Start the Web UI

```bash
./run_webui.sh
```

🔗 Opens at: [http://localhost:5050](http://localhost:5050)  
or your LAN IP (e.g. `http://192.168.x.x:5050`)

### 2. Command Options

| Command                | Description                    |
|------------------------|--------------------------------|
| `./run_webui.sh`       | Start the app silently         |
| `./run_webui.sh --stop`| Stop the background server     |
| `./run_webui.sh --restart` | Stop and restart the server     |

---

## 📂 Folder Structure

```text
.
├── rsync_web_browser.py     # Flask server
├── templates/
│   └── select.html          # Web UI HTML
├── static/
│   ├── js/
│   │   ├── folderpicker.js
│   │   └── rsync_runner.js
│   └── style.css            # UI styling
├── sync_history.json        # Job log (auto-managed)
├── saved_paths.json         # Remembers last used paths
├── run_webui.sh             # Start/Stop/Restart script
```

---

## ✅ Requirements

- Python 3.7+
- Flask (`pip install flask`)

---

## 🛡️ Notes

- This version is for **testing/dev only** – not secured for production
- Sync history is stored in JSON locally
- rsync must be installed and available in system PATH

---

## 🧠 Roadmap

- 🔐 Add authentication
- 💾 Export/import sync configs
- 📈 Real-time sync progress bar

---

## 📜 License

MIT — use freely and customize.

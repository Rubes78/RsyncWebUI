# RsyncWebUI

A simple, styled web interface for running `rsync` jobs with history tracking, folder browsing, and saved path memory.

## 🚀 Features

- Browse and select source/destination folders visually
- Save most recently used paths between sessions
- Customize rsync options (e.g., `-avh`, `--progress`)
- View detailed sync output
- Sync history panel with re-run capability
- Unified and responsive interface

## 🖥️ Usage

```bash
# Start the Flask app
python3 rsync_web_browser.py
```

Then open your browser to:
```
http://localhost:5050
```

## 📂 Project Structure

```
RsyncWebUI/
├── app/
│   └── rsync_runner.py              # (optional for advanced rsync control)
├── static/
│   ├── js/
│   │   ├── rsync_runner.js
│   │   └── folderpicker.js
│   └── style.css
├── templates/
│   └── select.html
├── rsync_web_browser.py             # Main Flask app
├── sync_history.json                # (ignored by git)
├── saved_paths.json                 # (ignored by git)
├── AppLog.log                       # (ignored by git)
└── README.md
```

## 🛠️ Requirements

- Python 3.x
- Flask
- `rsync` installed and available in the system path

---

Let me know if you'd like this wrapped into a Docker image or systemd service!
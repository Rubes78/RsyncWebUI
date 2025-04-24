# RsyncWebUI

A simple, styled web interface for running `rsync` jobs with history tracking and folder browsing.

## 🚀 Features

- Select source and destination folders via browser UI
- Customizable rsync options (`-avh`, `--progress`, etc.)
- Sync job history with ability to re-run
- Live output and job status messages
- No terminal needed — fully web-based

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
│   └── rsync_runner.py
├── static/
│   ├── js/
│   │   ├── rsync_runner.js
│   │   └── folderpicker.js
│   └── style.css
├── templates/
│   └── select.html
├── rsync_web_browser.py
├── sync_history.json  # (ignored)
├── saved_paths.json   # (ignored)
└── AppLog.log         # (ignored)
```

## 🛠️ Requirements

- Python 3.x
- Flask
- `rsync` installed and available in the system path

---

Let me know if you want a Docker version or systemd service installer.
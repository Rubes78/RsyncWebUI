#!/bin/bash

cd "$(dirname "$0")"

function detect_ip() {
  if command -v hostname &> /dev/null && hostname -I &> /dev/null; then
    echo $(hostname -I | awk '{print $1}')
  elif command -v ipconfig &> /dev/null; then
    echo $(ipconfig getifaddr en0)
  else
    echo "localhost"
  fi
}

if [ "$1" == "--stop" ]; then
  echo "Stopping Rsync Web UI..."
  pkill -f "python3 rsync_web_browser.py"
  exit 0
fi

if [ "$1" == "--restart" ]; then
  echo "Restarting Rsync Web UI..."
  pkill -f "python3 rsync_web_browser.py"
  sleep 1
fi

if ! command -v python3 &> /dev/null; then
  echo "Python3 not found. Please install Python3 before running this script."
  exit 1
fi

IP=$(detect_ip)

export FLASK_APP=rsync_web_browser.py
export FLASK_ENV=production

echo "Rsync Web UI launched at http://$IP:5050"
echo "Use './run_webui.sh --stop' to stop it or '--restart' to relaunch."

nohup python3 rsync_web_browser.py > /dev/null 2>&1 &

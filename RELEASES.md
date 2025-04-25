# RsyncWebUI Releases

---

## 🏷️ Release: v2.0.0-docker
**Branch:** `docker`  
**Tag:** `v2.0.0-docker`

---

## 🚀 What's New

This release introduces **full Docker support** for RsyncWebUI, allowing you to run the entire web interface in an isolated, portable container environment.

---

## 🧩 Key Features

- ✅ Dockerized Flask App with automatic rsync execution
- ✅ .env-driven configuration for mount paths and user IDs
- ✅ Multi-directory browsing support (`/Quarks`, `/USB`, etc.)
- ✅ Seamless folder creation and live rsync job status
- ✅ Preserves all RsyncWebUI features

---

## 🛠 Environment Variables (.env)

```env
DATA_PATH=/Quarks
USB_PATH=/USB
DOCKER_PATH=/HoloMedia/Dockers
PUID=1000
PGID=1000
```

---

## 🐳 Docker Usage

```bash
docker-compose up --build
```
Access the UI at: http://localhost:5050

---

## 📁 Folder Structure (Inside Container)

| Path in Container     | Maps to Host          |
|------------------------|------------------------|
| `/mnt/data/Quarks`     | `${DATA_PATH}`         |
| `/mnt/data/USB`        | `${USB_PATH}`          |
| `/app/config`          | `${DOCKER_PATH}/rsyncwebui/config` |

---

## 🛡️ Security

This version isolates browsing and syncing to specific mapped folders — no full-root access required.

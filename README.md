# RsyncWebUI 🚀

RsyncWebUI is a web-based tool that makes it easy to synchronize folders across directories using `rsync`.  
It features a modern UI with live folder browsing, job history, and configurable sync options — all running inside a lightweight Docker container.

---

## ✨ Features at a Glance
- Live browse your server directories
- Choose source and destination folders
- Customize rsync options
- Real-time sync output with live status
- View full sync history
- Re-run previous jobs
- Create new folders during browsing
- Dockerized for easy deployment!

---

## 🛠 Requirements
- Docker installed (v20.10+)
- Docker Compose installed (v2+)
- Basic familiarity with local folders you want to sync

---

## 📦 Installation & Setup

### 1. Clone or pull the RsyncWebUI repository
```bash
git clone https://github.com/Rubes78/RsyncWebUI.git
cd RsyncWebUI
```

> Or simply use the provided `docker-compose.yml` to pull directly!

---

### 2. Configure `.env` File

Example `.env`:
```env
DATA_PATH=/Quarks
USB_PATH=/USB
DOCKER_PATH=/HoloMedia/Dockers/rsyncwebui
PUID=1000
PGID=1000
```

- `DATA_PATH`: Path to your first source folder (like /Quarks)
- `USB_PATH`: Path to your second source (like external drive /USB)
- `DOCKER_PATH`: Where to store RsyncWebUI's runtime config
- `PUID/PGID`: User and Group IDs for Docker permissions

---

### 3. Launch the WebUI

#### For Developers (local builds):
```bash
docker compose -f docker-compose.dev.yml --env-file .env up --build
```

#### For Testers / Friends (GitHub Pull):
```bash
docker compose --env-file .env up --build
```

Then open your browser:
```
http://localhost:5050
```

✅ You'll see the RsyncWebUI interface ready to go!

---

## 📂 Accessing Host Folders
The Docker container mounts your `DATA_PATH` and `USB_PATH` into `/mnt/data/Quarks` and `/mnt/data/USB` respectively.  
You can browse, sync, and manage these folders from the web interface.

---

## ⚙️ Managing the Container

- Stop the WebUI:
  ```bash
  docker compose down
  ```

- Rebuild after updates:
  ```bash
  docker compose up --build
  ```

- Restart cleanly:
  ```bash
  docker compose down && docker compose up --build
  ```

---

## 🧹 Cleaning Up

Delete containers and images:
```bash
docker compose down --rmi all --volumes
```

---

## 🏁 Quick Git Push Commands

Located in:
```
GIT_PUSH_COMMANDS.txt
```

Follow it to quickly update GitHub after changes!

---

## 🔥 Project Status
- Actively developed
- Dockerized deployment completed
- Feature-rich, simple UI
- Open to contributions!

---

Happy syncing! 🚀

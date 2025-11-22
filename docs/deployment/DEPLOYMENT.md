# LLM-Memory Deployment Guide

This guide covers deployment for two scenarios:
1. **Local Development** (Docker Desktop on Windows)
2. **NAS Deployment** (Synology DSM 7.2 via SSH)

---

## 1. Local Development (Windows)

Run the entire stack (Agent + Postgres + LLM connection) locally on your machine.

### Prerequisites
- Docker Desktop installed & running
- Node.js 20+
- LM Studio (or Ollama) running locally

### Setup
1. **Configure Environment**
   Copy `.env.example` to `.env` (or use `.env.dev`):
   ```powershell
   cp .env.dev .env
   ```
   Ensure `LLM_BASE_URL` points to your local LLM (e.g., `http://host.docker.internal:11434` for Docker to reach host).

2. **Start Services**
   ```powershell
   # Start Postgres & Agent
   docker-compose -f docker-compose.dev.yml up -d --build
   ```

3. **Access**
   - UI: http://localhost:3000/ui
   - API: http://localhost:3000
   - Health: http://localhost:3000/health

---

## 2. NAS Deployment (Synology DSM 7.2)

Run the Agent and Database on your Synology NAS, connecting to an LLM running on your PC (or elsewhere).

### Prerequisites
- Synology NAS with **Container Manager** (Docker) installed
- SSH access enabled on NAS
- **LM Studio** running on your PC (Server mode ON, Port 11434, CORS enabled)

### Architecture
- **NAS**: Runs `llm-memory-agent` and `postgres` (pgvector)
- **PC**: Runs LM Studio (LLM Provider)
- **Network**: NAS connects to PC via local IP (e.g., `192.168.5.46`)

### Deployment Steps

#### 1. Prepare Configuration
Edit `.env.synology` locally:
- Set `LLM_BASE_URL=http://YOUR_PC_IP:11434` (NO `/v1` suffix!)
- Set `LLM_PROVIDER=openai` (for LM Studio)

#### 2. Build & Deploy Image
We build the image locally for ARM64 (Synology architecture) and upload it.

```powershell
# 1. Build image locally (creates llm-memory-agent.tar)
.\scripts\build-nas-image.ps1

# 2. Copy files to NAS
scp llm-memory-agent.tar robertorahl@rahlnas3:/volume1/docker/llm-memory/
scp docker-compose.synology.yml robertorahl@rahlnas3:/volume1/docker/llm-memory/docker-compose.yml
scp .env.synology robertorahl@rahlnas3:/volume1/docker/llm-memory/.env
scp -r scripts/init-pgvector.sql robertorahl@rahlnas3:/volume1/docker/llm-memory/scripts/
```

#### 3. Start on NAS
Connect via SSH and start the stack:

```bash
ssh robertorahl@rahlnas3
cd /volume1/docker/llm-memory

# Load the new image
sudo docker load -i llm-memory-agent.tar

# Start services (recreates containers if config changed)
sudo docker-compose down
sudo docker-compose up -d
```

### Troubleshooting NAS

- **Check Status**: `http://rahlnas3:3000/health`
- **View Logs**: `ssh robertorahl@rahlnas3 "cd /volume1/docker/llm-memory && sudo docker-compose logs -f agent"`
- **Database Reset**: If password issues occur (`auth failed`), reset the DB volume:
  ```bash
  sudo docker-compose down -v
  sudo docker-compose up -d
  ```

---

## 🤖 Copilot Instructions

**If the user asks to deploy to NAS:**
1. Check if `.env.synology` has the correct PC IP.
2. Run `.\scripts\deploy-image-to-synology.ps1` to build the ARM64 image.
3. Instruct user to copy files (`scp`) and restart on NAS (`docker-compose up -d`).

**If the user asks to test locally:**
1. Use `docker-compose.dev.yml`.
2. Ensure `LLM_BASE_URL` uses `host.docker.internal` to reach LM Studio on Windows.

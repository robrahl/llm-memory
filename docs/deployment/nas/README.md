# Synology NAS Deployment Guide

Deploy llm-memory to your Synology NAS for always-on, shared team access.

## Architecture Overview

```
┌─────────────┐         ┌──────────────────┐
│   Your PC   │         │  Synology NAS    │
│             │         │                  │
│ LM Studio   │◄────────┤  llm-memory      │
│ Port 11434  │  LAN    │  PostgreSQL      │
└─────────────┘         └──────────────────┘
```

- **NAS**: Runs Docker containers (agent + database)
- **PC**: Runs LM Studio or Ollama (LLM provider)
- **Network**: NAS connects to PC via local network

## Prerequisites

### Synology NAS Requirements
- **DSM Version**: 7.2 or higher
- **Package**: Container Manager installed (replaces Docker)
- **SSH**: Enabled and accessible
- **Storage**: At least 2GB free space

### PC Requirements (for LLM)
- **LM Studio** or **Ollama** running
- **Server mode** enabled on port 11434
- **CORS** enabled (for LM Studio)
- **Fixed IP** recommended (or use hostname)

### Your Machine (for deployment)
- **SSH client** (built-in on Mac/Linux, or use PuTTY on Windows)
- **Docker** installed (for building ARM64 image)
- **Git** to clone repository

## Deployment Steps

### 1. Enable SSH on Synology

1. Open **DSM Control Panel**
2. Go to **Terminal & SNMP**
3. Enable **SSH service**
4. Keep default port 22 (or note custom port)

### 2. Create Directory on NAS

SSH into your NAS:

```bash
ssh your_username@your_nas_hostname
# Example: ssh robertorahl@rahlnas3
```

Create the deployment directory:

```bash
mkdir -p /volume1/docker/llm-memory/scripts
cd /volume1/docker/llm-memory
```

### 3. Configure Environment (on your local machine)

Clone the repository:

```bash
git clone https://github.com/robrahl/llm-memory.git
cd llm-memory
```

Edit `.env.synology` file:

```bash
# Find your PC's IP address
# Windows: ipconfig
# Mac: ipconfig getifaddr en0
# Linux: hostname -I

# Edit .env.synology
LLM_BASE_URL=http://YOUR_PC_IP:11434  # NO /v1 suffix!
LLM_PROVIDER=openai
LLM_MODEL=llama2

# Database (use strong passwords in production!)
POSTGRES_USER=llm_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=llm_memory

PORT=3000
```

**Important:** Use your PC's IP address, not `localhost` or `host.docker.internal` (those don't work from NAS containers).

### 4. Build Docker Image for ARM64

Synology NAS uses ARM64 architecture. Build the image on your machine:

```bash
# Windows PowerShell
.\scripts\build-nas-image.ps1

# Mac/Linux
chmod +x scripts/build-nas-image.sh
./scripts/build-nas-image.sh
```

This creates `llm-memory-agent.tar` (ARM64 image).

### 5. Copy Files to NAS

```bash
# Copy Docker image
scp llm-memory-agent.tar your_username@your_nas:/volume1/docker/llm-memory/

# Copy configuration files
scp docker-compose.synology.yml your_username@your_nas:/volume1/docker/llm-memory/docker-compose.yml
scp .env.synology your_username@your_nas:/volume1/docker/llm-memory/.env

# Copy database init script
scp scripts/init-pgvector.sql your_username@your_nas:/volume1/docker/llm-memory/scripts/

# Example with actual hostname:
scp llm-memory-agent.tar robertorahl@rahlnas3:/volume1/docker/llm-memory/
scp docker-compose.synology.yml robertorahl@rahlnas3:/volume1/docker/llm-memory/docker-compose.yml
scp .env.synology robertorahl@rahlnas3:/volume1/docker/llm-memory/.env
scp scripts/init-pgvector.sql robertorahl@rahlnas3:/volume1/docker/llm-memory/scripts/
```

### 6. Load Image and Start Services on NAS

SSH into your NAS:

```bash
ssh your_username@your_nas
cd /volume1/docker/llm-memory
```

Load the Docker image:

```bash
sudo docker load -i llm-memory-agent.tar
```

Start the services:

```bash
# Stop any existing containers
sudo docker-compose down

# Start services (creates containers)
sudo docker-compose up -d
```

### 7. Verify Deployment

Check service status:

```bash
# Check running containers
sudo docker-compose ps

# View logs
sudo docker-compose logs -f agent
```

**From your PC**, test the health endpoint:

```bash
curl http://your_nas_hostname:3000/health

# Example:
curl http://rahlnas3:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "postgres": "connected",
  "llm": "reachable"
}
```

**Access Web UI:**
Open http://your_nas_hostname:3000/ui in your browser.

## Updates and Maintenance

### Update to New Version

1. **Build new image locally:**
   ```bash
   git pull
   .\scripts\build-nas-image.ps1  # or .sh on Mac/Linux
   ```

2. **Copy to NAS:**
   ```bash
   scp llm-memory-agent.tar your_username@your_nas:/volume1/docker/llm-memory/
   ```

3. **Reload and restart on NAS:**
   ```bash
   ssh your_username@your_nas
   cd /volume1/docker/llm-memory
   sudo docker load -i llm-memory-agent.tar
   sudo docker-compose down
   sudo docker-compose up -d
   ```

### View Logs

```bash
# All services
sudo docker-compose logs -f

# Agent only
sudo docker-compose logs -f agent

# Database only
sudo docker-compose logs -f postgres

# Last 100 lines
sudo docker-compose logs --tail=100 agent
```

### Restart Services

```bash
cd /volume1/docker/llm-memory
sudo docker-compose restart
```

### Stop Services

```bash
cd /volume1/docker/llm-memory
sudo docker-compose down
```

### Reset Database

**WARNING:** This deletes all stored policies and data!

```bash
cd /volume1/docker/llm-memory
sudo docker-compose down -v  # -v removes volumes
sudo docker-compose up -d
```

## Troubleshooting

### Agent Can't Reach LLM on PC

**Symptom:** Health check shows `llm: unreachable`

**Solutions:**

1. **Verify LM Studio is running on PC:**
   - Open LM Studio
   - Check "Server" is enabled
   - Port is 11434
   - CORS is enabled

2. **Test from your PC:**
   ```bash
   curl http://localhost:11434/v1/models
   ```

3. **Test from NAS to PC:**
   ```bash
   ssh your_username@your_nas
   curl http://YOUR_PC_IP:11434/v1/models
   ```

4. **Check firewall on PC:**
   - Windows: Allow port 11434 through Windows Firewall
   - Mac: System Preferences → Security & Privacy → Firewall → Options
   - Linux: `sudo ufw allow 11434`

5. **Verify IP address in `.env`:**
   ```bash
   # On NAS
   cat /volume1/docker/llm-memory/.env | grep LLM_BASE_URL
   ```

### Database Authentication Failed

**Symptom:** `FATAL: password authentication failed for user`

**Solution:** Reset the database volume:
```bash
cd /volume1/docker/llm-memory
sudo docker-compose down -v
sudo docker-compose up -d
```

### Port Already in Use

**Symptom:** `bind: address already in use`

**Solution:** Change port in `.env` file on NAS:
```bash
# Edit .env on NAS
PORT=3001

# Restart
sudo docker-compose down
sudo docker-compose up -d
```

### Container Won't Start

**Check logs:**
```bash
sudo docker-compose logs agent
```

**Common issues:**
- Database not ready: Wait 30 seconds and check again
- Missing environment variables: Verify `.env` file exists
- Image not loaded: Run `sudo docker load -i llm-memory-agent.tar`

### Out of Space

```bash
# Check disk space
df -h

# Clean up old Docker images
sudo docker system prune -a
```

## Git Repository Setup (Optional)

You can configure your NAS as a Git backup remote. See [Git Setup Guide](git-setup.md).

## Network Considerations

### Static IP for PC

Consider setting a static IP for your PC in your router to avoid updating `.env` when IP changes.

### Access from Other Devices

To access llm-memory from other devices on your network:
- Find NAS hostname or IP
- Access: `http://nas_hostname:3000/ui`
- Ensure firewall allows port 3000

### VPN/Remote Access

If using Synology VPN or QuickConnect:
- Configure port forwarding for port 3000
- Update LLM_BASE_URL to use VPN IP
- Consider security implications

## Security Best Practices

1. **Use strong passwords** in `.env` file
2. **Don't expose port 3000** to the internet without authentication
3. **Keep DSM updated** for security patches
4. **Backup database** regularly (see [Backup Guide](../backup.md))
5. **Use SSH keys** instead of passwords for SSH access

## Next Steps

- [Configure Copilot Integration](../../copilot/README.md)
- [Set up Git Backup](git-setup.md)
- [Configure Automated Backups](../backup.md)
- [Load Example Policies](../../reference/example-policies.md)

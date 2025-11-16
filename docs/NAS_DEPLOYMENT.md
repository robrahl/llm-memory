# NAS Deployment Guide

## Prerequisites

- Synology DSM 7+ with Docker enabled
- Ollama or LM Studio running on RTX 3090 eGPU (on same LAN or accessible via IP)
- SSH access to NAS

## 1. Copy Files to NAS

From your dev machine:

```bash
# SSH into NAS
ssh admin@synology.local

# Create project directory
mkdir -p /volume1/docker/llm-memory
cd /volume1/docker/llm-memory

# Exit and copy from host
exit
```

From your Windows machine (PowerShell):

```powershell
# Copy project files to NAS
scp -r .\src admin@synology.local:/volume1/docker/llm-memory/
scp .\Dockerfile.agent admin@synology.local:/volume1/docker/llm-memory/
scp .\docker-compose.yml admin@synology.local:/volume1/docker/llm-memory/
scp .\package.json admin@synology.local:/volume1/docker/llm-memory/
scp .\tsconfig.json admin@synology.local:/volume1/docker/llm-memory/
scp .\healthcheck.js admin@synology.local:/volume1/docker/llm-memory/
scp -r .\scripts admin@synology.local:/volume1/docker/llm-memory/
```

## 2. Configure Environment on NAS

SSH into NAS:

```bash
ssh admin@synology.local
cd /volume1/docker/llm-memory

# Create .env file
cat > .env << 'EOF'
DB_USER=postgres
DB_PASSWORD=secure_password_123
NODE_ENV=production
LOG_LEVEL=info
LLM_PROVIDER=ollama
LLM_BASE_URL=http://192.168.1.100:11434
LLM_MODEL=mistral:7b
EOF
```

Replace `192.168.1.100` with the IP of your RTX 3090 machine running Ollama.

## 3. Start Stack on NAS

```bash
# SSH to NAS
ssh admin@synology.local
cd /volume1/docker/llm-memory

# Build and start
docker-compose up --build -d

# Verify
docker-compose ps
docker-compose logs -f agent
```

## 4. Verify Deployment

From your dev machine (or from NAS):

```powershell
# Health check
Invoke-WebRequest http://synology.local:3000/health

# Test query
$body = @{ query = "naming"; topK = 3 } | ConvertTo-Json
Invoke-WebRequest -Uri http://synology.local:3000/query -Method POST `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body
```

## 5. Persistent Data

Volumes are stored on NAS:

```bash
# Check volumes
docker volume ls | grep llm-memory

# Backup database
docker-compose exec postgres pg_dump -U postgres ai_memory > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres ai_memory < backup.sql
```

## 6. Troubleshooting

### Agent can't reach Ollama on RTX 3090

```bash
# From NAS container, test Ollama connectivity
docker-compose exec agent curl http://192.168.1.100:11434/api/tags

# If unreachable:
# - Verify RTX 3090 machine is on same LAN
# - Check Ollama is listening on all interfaces (not just localhost)
# - Firewall may need to allow port 11434
```

### Postgres won't start

```bash
# Check logs
docker-compose logs postgres

# Verify pgvector image is available
docker pull pgvector/pgvector:pg16

# Rebuild
docker-compose down -v
docker-compose up --build -d
```

### Update agent code

```bash
cd /volume1/docker/llm-memory
git pull origin main  # or manually update src/
docker-compose build agent
docker-compose up -d agent
```

## 7. Monitoring

```bash
# Tail logs
docker-compose logs -f

# Check disk usage
du -sh /volume1/docker/llm-memory

# Database stats
docker-compose exec postgres psql -U postgres -d ai_memory -c "SELECT COUNT(*) FROM architectural_policies;"
```

## Notes

- Default admin password on NAS: Check your DSM settings
- Agent listens on port 3000 inside container; exposed as `0.0.0.0:3000` on NAS
- Database volume persists across restarts and updates
- Logs are stored in `agent_logs` volume and `.env.LOG_LEVEL` controls verbosity

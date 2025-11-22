# Local Development Setup

Run llm-memory locally on your Windows, Mac, or Linux machine using Docker Desktop.

## Prerequisites

- **Docker Desktop** installed and running
- **Node.js 20+** (for development)
- **LM Studio** or **Ollama** running locally (for LLM)

## Quick Setup (5 Minutes)

### 1. Clone Repository

```bash
git clone https://github.com/robrahl/llm-memory.git
cd llm-memory
```

### 2. Configure Environment

Copy the development environment file:

```bash
# Windows PowerShell
cp .env.dev .env

# Linux/Mac
cp .env.dev .env
```

The default configuration connects to:
- **LLM**: `http://host.docker.internal:11434` (Docker → Host machine)
- **Database**: PostgreSQL with pgvector (in Docker)
- **Port**: 3000

### 3. Start LLM (LM Studio or Ollama)

**Option A: LM Studio**
1. Open LM Studio
2. Enable "Server" mode
3. Set Port: `11434`
4. Enable CORS
5. Load a model (e.g., `llama-2-7b`)

**Option B: Ollama**
```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama
ollama serve

# Pull a model
ollama pull llama2
```

### 4. Start Services

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

This starts:
- PostgreSQL database (port 5432)
- llm-memory agent (port 3000)

### 5. Verify Setup

**Check health:**
```bash
curl http://localhost:3000/health
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
Open http://localhost:3000/ui

## Development Workflow

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Agent only
docker-compose -f docker-compose.dev.yml logs -f agent

# Database only
docker-compose -f docker-compose.dev.yml logs -f postgres
```

### Stop Services

```bash
docker-compose -f docker-compose.dev.yml down
```

### Restart Services

```bash
docker-compose -f docker-compose.dev.yml restart
```

### Reset Database

```bash
# WARNING: This deletes all data
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

## Configuration

### Environment Variables

Edit `.env` file to customize:

```bash
# LLM Configuration
LLM_BASE_URL=http://host.docker.internal:11434
LLM_PROVIDER=openai
LLM_MODEL=llama2

# Database
POSTGRES_USER=llm_user
POSTGRES_PASSWORD=llm_pass
POSTGRES_DB=llm_memory

# Application
PORT=3000
NODE_ENV=development
```

### Using Different LLM Providers

**OpenAI:**
```bash
LLM_BASE_URL=https://api.openai.com/v1
LLM_PROVIDER=openai
LLM_MODEL=gpt-4
OPENAI_API_KEY=sk-...
```

**Azure OpenAI:**
```bash
LLM_BASE_URL=https://your-resource.openai.azure.com
LLM_PROVIDER=azure
LLM_MODEL=gpt-4
AZURE_API_KEY=...
```

## Troubleshooting

### Agent Can't Reach LLM

**Symptom:** `health` check shows `llm: unreachable`

**Solution:**
1. Verify LLM is running: `curl http://localhost:11434/api/tags`
2. Check Docker can reach host: `docker-compose -f docker-compose.dev.yml exec agent curl http://host.docker.internal:11434/api/tags`
3. Try using host IP instead of `host.docker.internal`:
   ```bash
   # Find your IP
   ipconfig getifaddr en0  # Mac
   hostname -I  # Linux
   
   # Update .env
   LLM_BASE_URL=http://192.168.1.100:11434
   ```

### Database Connection Failed

**Symptom:** `health` check shows `postgres: disconnected`

**Solution:**
1. Check if database is running: `docker-compose -f docker-compose.dev.yml ps`
2. View database logs: `docker-compose -f docker-compose.dev.yml logs postgres`
3. Reset database: `docker-compose -f docker-compose.dev.yml down -v && docker-compose -f docker-compose.dev.yml up -d`

### Port Already in Use

**Symptom:** `Error: bind: address already in use`

**Solution:**
1. Change port in `.env`: `PORT=3001`
2. Or stop the conflicting service
3. Restart: `docker-compose -f docker-compose.dev.yml up -d`

### Build Failures

```bash
# Clean rebuild
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

## Next Steps

- [Configure Copilot Integration](../../copilot/README.md)
- [Load Example Policies](../../reference/example-policies.md)
- [Deploy to Production (NAS)](../nas/README.md)

# Copilot Context & Quick Start

## Project Overview
**llm-memory** is a persistent memory service for LLMs, storing architectural policies and knowledge in a PostgreSQL (pgvector) database. It provides a semantic search API and a Web UI for managing policies.

## Documentation Structure

The documentation is now organized into clear sections:
- **[docs/getting-started/](docs/getting-started/)** - Overview and setup paths
- **[docs/deployment/local/](docs/deployment/local/)** - Local development setup
- **[docs/deployment/nas/](docs/deployment/nas/)** - Synology NAS deployment
- **[docs/copilot/](docs/copilot/)** - Copilot integration guides
- **[docs/reference/](docs/reference/)** - Technical documentation

## Deployment Targets

### 1. Local Development (Windows/Mac/Linux)
- **Docker Compose**: `docker-compose.dev.yml`
- **Environment**: `.env.dev`
- **Command**: `docker-compose -f docker-compose.dev.yml up -d`
- **LLM Connection**: `host.docker.internal:11434`
- **Guide**: [docs/deployment/local/README.md](docs/deployment/local/README.md)

### 2. Synology NAS (Production)
- **Docker Compose**: `docker-compose.synology.yml` (copied to NAS as `docker-compose.yml`)
- **Environment**: `.env.synology` (copied to NAS as `.env`)
- **Build Script**: `scripts/build-nas-image.ps1` - Builds ARM64 image locally
- **Manual Steps**: Copy `.tar`, `.env`, and `.yml` to NAS; run `docker load` & `docker-compose up`
- **Guide**: [docs/deployment/nas/README.md](docs/deployment/nas/README.md)

## Key Files
- `src/agent.ts`: Main Express server & API logic
- `src/ui/`: Vue.js Frontend
- `Dockerfile.agent`: Multi-stage build for the agent
- `scripts/build-nas-image.ps1`: Build ARM64 image for Synology

## Common Tasks

### "Deploy to NAS"
1. Verify `.env.synology` has correct PC IP address
2. Run `.\scripts\build-nas-image.ps1` to build ARM64 image
3. Copy files to NAS:
   ```bash
   scp llm-memory-agent.tar user@nas:/volume1/docker/llm-memory/
   scp docker-compose.synology.yml user@nas:/volume1/docker/llm-memory/docker-compose.yml
   scp .env.synology user@nas:/volume1/docker/llm-memory/.env
   ```
4. SSH to NAS and restart containers:
   ```bash
   ssh user@nas
   cd /volume1/docker/llm-memory
   sudo docker load -i llm-memory-agent.tar
   sudo docker-compose down && sudo docker-compose up -d
   ```

### "Test Locally"
1. Ensure `.env` or `.env.dev` is configured
2. Start services: `docker-compose -f docker-compose.dev.yml up -d`
3. Check health: `curl http://localhost:3000/health`
4. Access UI: `http://localhost:3000/ui`

### "Reset Database"
- **Local**: `docker-compose -f docker-compose.dev.yml down -v && docker-compose -f docker-compose.dev.yml up -d`
- **NAS**: SSH to NAS, then:
  ```bash
  cd /volume1/docker/llm-memory
  sudo docker-compose down -v
  sudo docker-compose up -d
  ```

### "Check Health"
- **Local**: http://localhost:3000/health
- **NAS**: http://nas_hostname:3000/health

## Quick Reference

For commands, prompts, and troubleshooting:
→ [docs/copilot/quick-reference.md](docs/copilot/quick-reference.md)

## Need More Info?

- **Getting Started**: [docs/getting-started/README.md](docs/getting-started/README.md)
- **Local Setup**: [docs/deployment/local/README.md](docs/deployment/local/README.md)
- **NAS Setup**: [docs/deployment/nas/README.md](docs/deployment/nas/README.md)
- **Copilot Integration**: [docs/copilot/README.md](docs/copilot/README.md)
- **Architecture**: [docs/reference/architecture.md](docs/reference/architecture.md)

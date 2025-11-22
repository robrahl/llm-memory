# Deployment Overview

This document provides a high-level overview of deployment options for llm-memory.

## Deployment Options

### 1. Local Development
**Best for:** Testing, development, learning

Run llm-memory on your local machine using Docker Desktop.

→ **[Local Deployment Guide](local/README.md)**

**Quick Start:**
```bash
cp .env.dev .env
docker-compose -f docker-compose.dev.yml up -d
```

---

### 2. Synology NAS
**Best for:** Always-on service, shared team access, production use

Deploy to your Synology NAS for 24/7 availability.

→ **[NAS Deployment Guide](nas/README.md)**

**Quick Start:**
```bash
.\scripts\build-nas-image.ps1
scp llm-memory-agent.tar user@nas:/volume1/docker/llm-memory/
ssh user@nas "cd /volume1/docker/llm-memory && sudo docker load -i llm-memory-agent.tar && sudo docker-compose up -d"
```

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Your Setup    │         │   llm-memory     │
│                 │         │                  │
│ LM Studio/      │◄────────┤  Agent Service   │
│ Ollama          │  HTTP   │  PostgreSQL      │
│ (Port 11434)    │         │  (pgvector)      │
└─────────────────┘         └──────────────────┘
```

**Components:**
- **Agent Service**: Node.js/TypeScript API server
- **PostgreSQL**: Database with pgvector extension
- **LLM Provider**: LM Studio, Ollama, or cloud API

---

## Choose Your Path

| Deployment | Setup Time | Availability | Best For |
|------------|------------|--------------|----------|
| **Local** | 5 minutes | When PC is on | Development, testing |
| **NAS** | 15 minutes | 24/7 | Production, team use |

---

## Next Steps

1. **[Local Setup](local/README.md)** - Run on your machine
2. **[NAS Setup](nas/README.md)** - Deploy to Synology
3. **[Copilot Integration](../copilot/README.md)** - Connect with GitHub Copilot
4. **[Quick Reference](../copilot/quick-reference.md)** - Commands cheat sheet

# Copilot Context & Quick Start

## Project Overview
**llm-memory** is a persistent memory service for LLMs, storing architectural policies and knowledge in a PostgreSQL (pgvector) database. It provides a semantic search API and a Web UI.

## Deployment Targets

### 1. Local Development (Windows)
- **File**: `docker-compose.dev.yml`
- **Env**: `.env.dev`
- **Command**: `docker-compose -f docker-compose.dev.yml up -d`
- **LLM**: Connects to `host.docker.internal:11434`

### 2. Synology NAS (Production)
- **File**: `docker-compose.synology.yml` (renamed to `docker-compose.yml` on NAS)
- **Env**: `.env.synology` (renamed to `.env` on NAS)
- **Scripts**:
  - `scripts/build-nas-image.ps1`: Builds ARM64 image locally & saves to `.tar`
- **Manual Steps**: Copy `.tar`, `.env`, and `.yml` to NAS; run `docker load` & `docker-compose up`.

## Key Files
- `src/agent.ts`: Main Express server & API logic.
- `src/ui/`: Vue.js Frontend.
- `Dockerfile.agent`: Multi-stage build for the agent.

## Common Tasks

**"Deploy to NAS"**
1. Verify `.env.synology` IP address.
2. Run `.\scripts\build-nas-image.ps1`.
3. SCP files to NAS (`/volume1/docker/llm-memory`).
4. SSH to NAS and restart containers.

**"Reset Database"**
- **Local**: `docker-compose -f docker-compose.dev.yml down -v`
- **NAS**: `ssh ... "cd ... && sudo docker-compose down -v && sudo docker-compose up -d"`

**"Check Health"**
- **Local**: http://localhost:3000/health
- **NAS**: http://rahlnas3:3000/health

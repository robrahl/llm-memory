# Copilot Quick Reference

Quick commands and prompts for working with llm-memory and GitHub Copilot.

## V0 Script Commands

### Health Check
```bash
./scripts/copilot-context.sh --health
```

### Query Knowledge Base
```bash
# General query
./scripts/copilot-context.sh "your question here"

# Naming conventions
./scripts/copilot-context.sh "naming conventions"

# Error handling
./scripts/copilot-context.sh "error handling patterns"

# Architecture
./scripts/copilot-context.sh "microservice architecture"
```

### With Remote Agent
```bash
# Set environment variables
export AGENT_HOST=192.168.1.100
export AGENT_PORT=3000
./scripts/copilot-context.sh "your question"
```

## Copilot Chat Prompts

### Using Generated Context (V0)

After running the script, use these prompts in VS Code Copilot Chat:

```
Based on .vscode/copilot-context.md, create a new UserService class

Following the naming conventions in .vscode/copilot-context.md, refactor this code

Using the error handling patterns from .vscode/copilot-context.md, add proper error handling
```

### Direct Tool Calls (V1+)

```
@llm-memory query "What are our naming conventions?"

@llm-memory query "How should we handle database errors?"

@llm-memory check_policy_compliance
code_snippet: "class UserService { ... }"
```

## Common Queries

| Topic | Query |
|-------|-------|
| Naming | `naming conventions` |
| Errors | `error handling patterns` |
| Architecture | `microservice architecture` |
| Security | `authentication and security` |
| Testing | `unit testing standards` |
| API Design | `REST API best practices` |
| Database | `database schema conventions` |
| Logging | `logging and monitoring` |

## Shell Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# llm-memory shortcuts
alias llm='cd /path/to/llm-memory && ./scripts/copilot-context.sh'
alias llm-naming='llm "naming convention"'
alias llm-errors='llm "error handling"'
alias llm-arch='llm "architecture patterns"'
alias llm-health='llm --health'
```

Usage:
```bash
llm-naming      # Get naming context
llm "your query"  # Custom query
```

## API Endpoints

Direct API access (for custom scripts):

### Health Check
```bash
curl http://localhost:3000/health
```

### Query
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "naming conventions", "limit": 5}'
```

### Load Policy
```bash
curl -X POST http://localhost:3000/policy \
  -H "Content-Type: application/json" \
  -d '{
    "key": "naming_conventions",
    "description": "Naming conventions",
    "value": { "services": "PascalCase", "tables": "snake_case" }
  }'
```

### Search Policies
```bash
curl "http://localhost:3000/search?q=naming&limit=10"
```

## Docker Commands

### Local Development
```bash
# Start
docker-compose -f docker-compose.dev.yml up -d

# Logs
docker-compose -f docker-compose.dev.yml logs -f agent

# Stop
docker-compose -f docker-compose.dev.yml down

# Reset
docker-compose -f docker-compose.dev.yml down -v
```

### NAS Deployment
```bash
# SSH to NAS
ssh user@nas

# View logs
cd /volume1/docker/llm-memory
sudo docker-compose logs -f agent

# Restart
sudo docker-compose restart

# Update
sudo docker load -i llm-memory-agent.tar
sudo docker-compose down && sudo docker-compose up -d
```

## Troubleshooting Commands

### Check Service Status
```bash
# Local
docker-compose ps

# NAS
ssh user@nas "cd /volume1/docker/llm-memory && sudo docker-compose ps"
```

### Test LLM Connection
```bash
# From host
curl http://localhost:11434/v1/models

# From Docker (local)
docker-compose exec agent curl http://host.docker.internal:11434/v1/models

# From NAS to PC
ssh user@nas "curl http://YOUR_PC_IP:11434/v1/models"
```

### Check Database
```bash
# Connect to Postgres (local)
docker-compose exec postgres psql -U llm_user -d llm_memory

# List tables
\dt

# Check policies
SELECT key, description FROM architectural_policies;
```

## Environment Variables

### Required
```bash
LLM_BASE_URL=http://host.docker.internal:11434
LLM_PROVIDER=openai
POSTGRES_USER=llm_user
POSTGRES_PASSWORD=llm_pass
POSTGRES_DB=llm_memory
```

### Optional
```bash
LLM_MODEL=llama2
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

## File Locations

### Configuration
- `.env` - Environment variables
- `.env.dev` - Local development config
- `.env.synology` - NAS deployment config

### Docker Compose
- `docker-compose.yml` - Production config
- `docker-compose.dev.yml` - Local development
- `docker-compose.synology.yml` - NAS deployment

### Scripts
- `scripts/copilot-context.sh` - V0 query script
- `scripts/build-nas-image.ps1` - Build ARM64 image

### Documentation
- `docs/getting-started/` - Setup guides
- `docs/deployment/local/` - Local setup
- `docs/deployment/nas/` - NAS setup
- `docs/copilot/` - Copilot integration
- `docs/reference/` - Technical reference

## Quick Links

- [Getting Started](../getting-started/README.md)
- [Local Setup](../deployment/local/README.md)
- [NAS Setup](../deployment/nas/README.md)
- [Copilot V0 Guide](v0-quick-start.md)
- [Architecture](../reference/architecture.md)

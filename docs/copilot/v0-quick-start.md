# V0 Quick Start Guide

This guide helps you set up and use the V0 Copilot integration in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- Bash shell (Linux/macOS/WSL/Git Bash)
- `jq` installed (`sudo apt install jq` or `brew install jq`)
- `curl` available (usually pre-installed)

## Setup Steps

### 1. Make Script Executable

```bash
chmod +x scripts/copilot-context.sh
```

### 2. Start the Services

```bash
# Start Agent and Database
docker-compose up -d

# Wait for services to be ready (15-30 seconds)
docker-compose logs -f agent
# Press Ctrl+C when you see "llm-memory agent listening on :3000"
```

### 3. Verify Health

```bash
./scripts/copilot-context.sh --health
```

**Expected output:**
```
✓ Agent: ok
✓ Postgres: connected
✓ Ollama: reachable
```

If you see errors, check the troubleshooting section below.

### 4. Load Example Policies (Optional)

```bash
# Example: Load a naming convention policy
curl -X POST http://localhost:3000/policy \
  -H "Content-Type: application/json" \
  -d '{
    "key": "naming_conventions",
    "description": "Standard naming conventions for the codebase",
    "value": {
      "services": "PascalCase with Service suffix (e.g., UserService)",
      "database_tables": "snake_case plural (e.g., user_profiles)",
      "api_endpoints": "kebab-case (e.g., /api/user-profiles)",
      "interfaces": "PascalCase with I prefix (e.g., IUserProfile)",
      "env_vars": "UPPER_SNAKE_CASE (e.g., DATABASE_URL)"
    }
  }'
```

### 5. Generate Your First Context

```bash
./scripts/copilot-context.sh "What are our naming conventions?"
```

This creates `.vscode/copilot-context.md` with the answer from llm-memory.

### 6. Use in VS Code Copilot

1. Open VS Code
2. Open Copilot Chat (Cmd/Ctrl + Shift + I)
3. Reference the context file:
   ```
   Based on .vscode/copilot-context.md, create a new UserService class following our conventions
   ```

Copilot will read the context and generate code aligned with your policies.

## Daily Usage

### Query Before Coding

```bash
# Get naming conventions
./scripts/copilot-context.sh "naming convention"

# Get error handling patterns
./scripts/copilot-context.sh "error handling patterns"

# Get architecture guidelines
./scripts/copilot-context.sh "microservice architecture"
```

### In VS Code Copilot Chat

After running the script, use these prompts:

```
Based on the context in .vscode/copilot-context.md, generate a REST API endpoint for user management

Following the policies from llm-memory, refactor this error handling code

Using our naming conventions from .vscode/copilot-context.md, suggest better names for these variables
```

## Script Options

```bash
# Get help
./scripts/copilot-context.sh --help

# Check system health
./scripts/copilot-context.sh --health

# Query with custom Agent location
AGENT_HOST=192.168.1.100 AGENT_PORT=3000 ./scripts/copilot-context.sh "your question"
```

## Troubleshooting

### "Agent unreachable"

**Check if services are running:**
```bash
docker-compose ps
```

**View logs:**
```bash
docker-compose logs agent
docker-compose logs postgres
```

**Restart services:**
```bash
docker-compose down
docker-compose up -d
```

### "Query failed"

**Check if Ollama is running** (if using local LLM):
```bash
# On your laptop (not in Docker)
ollama serve

# Test it
curl http://localhost:11434/api/tags
```

**Check Agent can reach Ollama:**
```bash
docker-compose exec agent curl http://host.docker.internal:11434/api/tags
```

### "No matching policy found"

**Load policies first:**
```bash
curl -X POST http://localhost:3000/policy \
  -H "Content-Type: application/json" \
  -d '{
    "key": "your_policy_key",
    "description": "Description of the policy",
    "value": "Your policy content here"
  }'
```

### Context file not updating

```bash
# Clear and regenerate
rm -f .vscode/copilot-context.md
./scripts/copilot-context.sh "your question"
```

### Permission denied on script

```bash
chmod +x scripts/copilot-context.sh
# Or run with bash explicitly
bash scripts/copilot-context.sh "your question"
```

## Advanced Usage

### Create Shell Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# llm-memory shortcuts
alias llm-naming='cd /path/to/llm-memory && ./scripts/copilot-context.sh "naming convention"'
alias llm-errors='cd /path/to/llm-memory && ./scripts/copilot-context.sh "error handling"'
alias llm-arch='cd /path/to/llm-memory && ./scripts/copilot-context.sh "architecture patterns"'
alias llm-health='cd /path/to/llm-memory && ./scripts/copilot-context.sh --health'
```

Then use anywhere:
```bash
llm-naming  # Generates context for naming conventions
```

### Remote Agent Setup

If Agent runs on a different machine (e.g., NAS):

```bash
# Set environment variables
export AGENT_HOST=192.168.1.50
export AGENT_PORT=3000

# Or add to ~/.bashrc
echo 'export AGENT_HOST=192.168.1.50' >> ~/.bashrc
echo 'export AGENT_PORT=3000' >> ~/.bashrc

# Test connection
./scripts/copilot-context.sh --health
```

## Example Workflow

**Scenario:** Building a new authentication service

```bash
# Terminal: Get context on security policies
./scripts/copilot-context.sh "authentication and security best practices"

# VS Code Copilot Chat:
"Based on .vscode/copilot-context.md, generate an AuthService class with JWT token handling"

# Terminal: Get context on error handling
./scripts/copilot-context.sh "error handling for authentication failures"

# VS Code Copilot Chat:
"Following the error handling patterns in .vscode/copilot-context.md, add proper error handling to this login method"
```

## What's Next?

- **V0 (Current):** Manual script + copy-paste workflow
- **V1 (Future):** Direct Copilot integration via MCP
  - No manual script execution
  - Real-time tool calls from Copilot
  - See `docs/copilot-v1-mcp.md` for details

## Files and Directories

```
llm-memory/
├── scripts/
│   └── copilot-context.sh          # The V0 script
├── .vscode/
│   ├── copilot-context.md          # Generated context (gitignored)
│   ├── copilot-context.md.example  # Example output
│   └── copilot-queries.log         # Query history (gitignored)
└── docs/
    ├── copilot-v0-integration.md   # Detailed V0 docs
    └── V0_QUICK_START.md           # This file
```

## Support

- **Documentation:** See `docs/copilot-v0-integration.md` for detailed info
- **Issues:** Check `docker-compose logs` for errors
- **Help:** Run `./scripts/copilot-context.sh --help`

---

**Ready to start?** Run `./scripts/copilot-context.sh --health` to verify your setup!

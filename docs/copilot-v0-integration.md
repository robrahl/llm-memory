# VS Code Copilot Integration (V0)

**Goal:** Query llm-memory from Copilot before each coding session.

## Quick Start (5 minutes)

### 1. Make script executable

```bash
chmod +x scripts/copilot-context.sh
```

### 2. Check Agent Health

```bash
./scripts/copilot-context.sh --health
```

Expected output:
```
✓ Agent: ok
✓ Postgres: connected
✓ Ollama: reachable
```

### 3. Generate Context Before Coding

```bash
./scripts/copilot-context.sh "What's our naming convention?"
```

This creates `.vscode/copilot-context.md` with the answer.

### 4. Use Context in Copilot

1. Open VS Code Copilot Chat (Cmd+Shift+I or Ctrl+Shift+I)
2. Reference the context file:
   ```
   Based on .vscode/copilot-context.md, how should I name this new service?
   ```
3. Copilot reads the context and provides guidance aligned with your policies

## Workflow Example

**Scenario:** Starting a new microservice

```bash
# Terminal 1: Get context on naming
./scripts/copilot-context.sh "naming convention for services"

# Terminal 2: Get context on error handling
./scripts/copilot-context.sh "error handling patterns"

# VS Code: Copilot Chat
"Based on my llm-memory policies, generate a TypeScript service structure."
```

Copilot has context from both queries and can generate code aligned with your architecture.

## Environment Variables

If Agent is on different host/port:

```bash
export AGENT_HOST=192.168.1.100
export AGENT_PORT=3000
./scripts/copilot-context.sh "your question"
```

## Troubleshooting

### Agent unreachable

```bash
./scripts/copilot-context.sh --health
```

If unhealthy:
```bash
docker-compose logs agent
docker-compose logs postgres
```

### Query failed

Check:
1. Ollama running on laptop: `ollama serve`
2. Policies loaded: `agent-cli load-policy --file ./docs/policies/naming_convention.md`
3. Agent service: `docker-compose up agent`

### Context file not updating

```bash
# Clear cache and retry
rm -f .vscode/copilot-context.md
./scripts/copilot-context.sh "your question"
```

## Advanced: Create Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# llm-memory shortcuts
alias agent-naming='./scripts/copilot-context.sh "naming convention"'
alias agent-patterns='./scripts/copilot-context.sh "design patterns"'
alias agent-errors='./scripts/copilot-context.sh "error handling"'
alias agent-health='./scripts/copilot-context.sh --health'
```

Then use:
```bash
agent-naming  # Auto-generates context
```

## V0 Limitations

- Context is **manual** (you run the script)
- Context expires after 1 hour (refresh with new query)
- No auto-sync with Copilot (copy-paste answers)
- No MCP integration (direct tool calls)

## Next: V1 MCP Integration

In V1, Copilot will have direct access to llm-memory tools:
- `/query-knowledge-base` — Search automatically
- `/check-compliance` — Validate code against policies
- `/get-health` — System status
- No manual context files needed

See `docs/copilot-v1-mcp.md` for details.

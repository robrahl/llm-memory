# VS Code Copilot Integration (V1 - MCP)

**Goal:** Direct MCP integration so Copilot calls llm-memory tools directly.

## Architecture

```
VS Code Copilot
    ↓ (MCP Protocol, stdio)
llm-memory MCP Server (Node.js process)
    ↓ (HTTP)
Agent Service on NAS
    ↓
Postgres + Ollama (RTX 3090)
```

## Setup (V1)

### 1. Install Dependencies

```bash
npm install \
  @modelcontextprotocol/sdk \
  zod
```

### 2. Build MCP Server

```bash
# Compile TypeScript
npm run build:mcp

# Verify output
ls dist/mcp-server.js
```

### 3. Configure VS Code

Create `~/.vscode/mcp-servers.json`:

```json
{
  "mcpServers": {
    "llm-memory": {
      "command": "node",
      "args": ["/path/to/llm-memory/dist/mcp-server.js"],
      "env": {
        "AGENT_HOST": "192.168.1.100",
        "AGENT_PORT": "3000"
      }
    }
  }
}
```

Or for local Agent (NAS on localhost):

```json
{
  "mcpServers": {
    "llm-memory": {
      "command": "node",
      "args": ["/path/to/llm-memory/dist/mcp-server.js"]
    }
  }
}
```

### 4. Restart VS Code

Copilot now has access to llm-memory tools.

## Usage

### Query Knowledge Base

In Copilot Chat:

```
@llm-memory query_knowledge_base
"What's our naming convention for services?"
```

Copilot response includes:
- Answer from Agent
- Source documents
- Latency metrics

### Check Policy Compliance

```
@llm-memory check_policy_compliance
code_snippet: "
class UserService {
  async getUser(id) {
    try {
      return await db.query(...);
    } catch (e) {
      console.error(e);
    }
  }
}
"
```

Copilot response:
- Policy compliance feedback
- Suggested improvements
- Relevant policies

### Load Policy

```
@llm-memory load_policy
policy_file: "./docs/policies/error_handling.md"
```

Updates knowledge base with new policy.

### Check Health

```
@llm-memory get_health_status
```

Response:
```json
{
  "status": "ok",
  "postgres": "connected",
  "ollama": "reachable",
  "policies_loaded": 5,
  "documents_in_kb": 42
}
```

## Implementation Details

### Tools

| Tool | Purpose | Input |
|------|---------|-------|
| `query_knowledge_base` | Search KB | query, project_key?, top_k? |
| `check_policy_compliance` | Validate code | code_snippet, policy_key? |
| `load_policy` | Add/update policy | policy_file, overwrite? |
| `get_health_status` | System status | (none) |

### Error Handling

All tools handle failures gracefully:

```json
{
  "error": "Agent unreachable",
  "details": "Connection refused at 192.168.1.100:3000",
  "tip": "Check if Agent service is running"
}
```

### Performance

- Tool calls timeout after 10 seconds (configurable)
- Network failures return cached results when available
- MCP server logs to stderr for debugging

## Troubleshooting

### MCP not showing in Copilot

1. Check VS Code settings:
   ```bash
   cat ~/.vscode/mcp-servers.json
   ```

2. Verify MCP server builds:
   ```bash
   node dist/mcp-server.js
   # Should print: [llm-memory MCP] Server started
   # Kill with Ctrl+C
   ```

3. Restart VS Code

### "Agent unreachable" error

```bash
# Check Agent health
./scripts/copilot-context.sh --health

# Or test directly
curl -X GET http://localhost:3000/health
```

### MCP server crashes

```bash
# Check Node version
node --version  # Need 18+

# Check dependencies installed
npm ls @modelcontextprotocol/sdk

# Run with debug output
DEBUG=* node dist/mcp-server.js
```

## Advanced: Custom Tools

To add new tools in V1+:

1. Add to `src/mcp-server.ts` (see schema patterns)
2. Implement handler function
3. Register in `tools` array
4. Rebuild: `npm run build:mcp`
5. Restart VS Code

Example: Add `search_adr_decisions` tool

```typescript
const SearchAdrSchema = z.object({
  keyword: z.string().describe("ADR keyword to search"),
});

async function searchAdrDecisions(input: z.infer<typeof SearchAdrSchema>) {
  // Call Agent with ADR-specific query
  const response = await fetch(`${AGENT_URL}/query`, {
    method: "POST",
    body: JSON.stringify({
      query: `Find ADR decisions related to: ${input.keyword}`,
      topK: 10,
    }),
  });
  // Return formatted results
}

// Register tool
tools.push({
  name: "search_adr_decisions",
  description: "Search architecture decision records by keyword",
  inputSchema: SearchAdrSchema,
});
```

## Performance Tips

### Cache Queries

In Copilot, store answers:

```
@llm-memory query_knowledge_base
"naming convention"
```

Save response → reuse in current session.

### Batch Queries

Instead of 3 separate calls, combine:

```
@llm-memory query_knowledge_base
"naming, error handling, logging patterns"
```

Agent returns relevant policies for all topics.

### Monitor Latency

Check logs:

```bash
tail -f agent.log | grep "event.*query"
```

If latency > 500ms:
- Ollama may be overloaded → reduce top_k (default 5)
- Postgres slow → check indexes (pgvector queries)
- Network lag → check NAS connectivity

## V1 Success Metrics

- ✅ Copilot sees llm-memory tools in chat
- ✅ Tool calls complete within 5 seconds
- ✅ Responses include source documents
- ✅ Error messages are actionable
- ✅ Agent remains responsive (no timeouts)

## Package.json Scripts (V1)

Add to `package.json`:

```json
{
  "scripts": {
    "build:mcp": "tsc src/mcp-server.ts --outDir dist --declaration",
    "dev:mcp": "ts-node src/mcp-server.ts",
    "test:mcp": "node dist/mcp-server.js &",
    "stop:mcp": "pkill -f 'node dist/mcp-server.js'"
  }
}
```

Usage:

```bash
npm run build:mcp   # Build for production
npm run dev:mcp     # Run in development (TypeScript)
npm run test:mcp    # Start server in background
npm run stop:mcp    # Stop background server
```

## Debugging MCP Server

Enable debug logging:

```bash
DEBUG=* node dist/mcp-server.js
```

Output shows:
- MCP messages (request/response)
- Tool calls
- Network requests to Agent
- Errors with stack traces

## Next Steps

After V1 MCP:
- Add `policy_compliance_report` tool (auto-scan codebase)
- Add `suggest_refactoring` tool (AI-powered improvements)
- Add `generate_adr` tool (template-based ADR creation)
- Dashboard integration (real-time metrics)

# VS Code Copilot Integration (V2.0 - Enhanced MCP)

**Goal:** Enhanced MCP integration with advanced tools for codebase analysis, refactoring suggestions, and automated ADR generation.

## What's New in V2.0

V2.0 builds on V1's MCP foundation and adds powerful developer productivity tools:

1. **Policy Compliance Report** - Automatically scan entire codebase for policy violations
2. **Refactoring Suggestions** - AI-powered code improvement recommendations
3. **ADR Generation** - Template-based Architecture Decision Record creation
4. **Real-time Metrics** - System performance and usage analytics

## Architecture

```
VS Code Copilot
    ↓ (MCP Protocol, stdio)
llm-memory MCP Server V2.0 (Node.js process)
    ↓ (HTTP)
Agent Service on NAS
    ↓
Postgres + Ollama (RTX 3090)
```

## Setup (V2.0)

### Prerequisites

- V1 MCP Server installed and working
- Node.js 18+
- Agent Service running and accessible

### 1. Upgrade Dependencies

```bash
# Install/update MCP SDK
npm install @modelcontextprotocol/sdk zod
```

### 2. Build V2.0 MCP Server

```bash
# Compile TypeScript with V2.0 enhancements
npm run build:mcp

# Verify output
ls dist/mcp-server.js
```

### 3. VS Code Configuration

Your existing `~/.vscode/mcp-servers.json` configuration works with V2.0:

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

### 4. Restart VS Code

New V2.0 tools are now available in Copilot Chat.

## V2.0 Tools

### 1. Policy Compliance Report

**Purpose:** Scan entire codebase or specific files for policy violations.

**Usage in Copilot:**
```
@llm-memory policy_compliance_report
directory: "./src"
recursive: true
```

**Parameters:**
- `directory` (required): Path to scan (absolute or relative)
- `recursive` (optional, default: true): Scan subdirectories
- `file_patterns` (optional): Filter by file extensions (e.g., "*.ts,*.js")
- `policy_keys` (optional): Specific policies to check

**Response:**
```json
{
  "success": true,
  "summary": {
    "files_scanned": 42,
    "violations_found": 7,
    "compliance_score": 0.83
  },
  "violations": [
    {
      "file": "src/services/user.ts",
      "line": 45,
      "policy": "error-handling",
      "severity": "high",
      "message": "Missing try-catch block",
      "suggestion": "Wrap database call in try-catch"
    }
  ],
  "scan_time_ms": 1250
}
```

### 2. Suggest Refactoring

**Purpose:** Get AI-powered code improvement suggestions.

**Usage in Copilot:**
```
@llm-memory suggest_refactoring
code_snippet: "
class UserService {
  async getUser(id) {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return user;
  }
}
"
context: "typescript-service"
```

**Parameters:**
- `code_snippet` (required): Code to analyze
- `context` (optional): Language/framework context (e.g., "typescript-service", "react-component")
- `focus_areas` (optional): Array of focus areas (e.g., ["performance", "security", "readability"])

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "type": "security",
      "priority": "high",
      "title": "Use parameterized queries correctly",
      "description": "Query is parameterized but could use typed repository pattern",
      "before": "const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);",
      "after": "const user = await userRepository.findById(id);",
      "reasoning": "Repository pattern provides type safety and better error handling"
    },
    {
      "type": "error-handling",
      "priority": "medium",
      "title": "Add error handling",
      "description": "Missing try-catch for database operations",
      "reasoning": "Database calls can fail; proper error handling is required per policy"
    }
  ],
  "overall_score": 6.5,
  "analysis_time_ms": 850
}
```

### 3. Generate ADR

**Purpose:** Create Architecture Decision Record from template.

**Usage in Copilot:**
```
@llm-memory generate_adr
title: "Use PostgreSQL for vector storage"
context: "Need to store embeddings for semantic search"
decision: "Use pgvector extension with PostgreSQL"
consequences: "Consolidates storage, reduces dependencies"
```

**Parameters:**
- `title` (required): ADR title
- `context` (required): Background and problem statement
- `decision` (required): The decision made
- `consequences` (optional): Positive and negative outcomes
- `alternatives` (optional): Other options considered
- `status` (optional, default: "proposed"): One of "proposed", "accepted", "deprecated", "superseded"

**Response:**
```json
{
  "success": true,
  "adr": {
    "number": 15,
    "title": "Use PostgreSQL for vector storage",
    "status": "proposed",
    "date": "2024-01-15",
    "file_path": "docs/adr/0015-use-postgresql-for-vector-storage.md",
    "content": "# ADR 15: Use PostgreSQL for vector storage\n\n..."
  },
  "next_steps": [
    "Review with team",
    "Update status to 'accepted' after approval",
    "Load into knowledge base: @llm-memory load_policy policy_file: './docs/adr/0015-...'"
  ]
}
```

### 4. Get Metrics

**Purpose:** Real-time system performance and usage metrics.

**Usage in Copilot:**
```
@llm-memory get_metrics
time_range: "1h"
```

**Parameters:**
- `time_range` (optional, default: "1h"): Time window ("5m", "1h", "24h", "7d")
- `metric_types` (optional): Filter metrics (e.g., ["queries", "performance", "storage"])

**Response:**
```json
{
  "success": true,
  "time_range": "1h",
  "metrics": {
    "queries": {
      "total": 127,
      "avg_latency_ms": 245,
      "p95_latency_ms": 450,
      "p99_latency_ms": 820,
      "error_rate": 0.02
    },
    "storage": {
      "documents": 1523,
      "policies": 21,
      "total_size_mb": 45.3,
      "vector_index_size_mb": 12.7
    },
    "system": {
      "agent_uptime_hours": 72.5,
      "postgres_connections": 3,
      "ollama_status": "healthy",
      "memory_usage_mb": 512,
      "cpu_usage_percent": 15.3
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## V1 Tools (Still Available)

All V1 tools remain available in V2.0:

- `query_knowledge_base` - Search knowledge base
- `check_policy_compliance` - Validate single code snippet
- `load_policy` - Add/update policy
- `get_health_status` - System health check

## Advanced Usage Examples

### Example 1: Full Codebase Review

```
@llm-memory policy_compliance_report
directory: "./src"
recursive: true
file_patterns: "*.ts"

# Review results, then get suggestions for violations
@llm-memory suggest_refactoring
code_snippet: "<paste code from violation>"
focus_areas: ["security", "maintainability"]
```

### Example 2: Pre-Commit Workflow

```bash
# In your pre-commit hook
node dist/mcp-server.js --mode cli \
  --tool policy_compliance_report \
  --args '{"directory":"./src/modified","recursive":true}'
```

### Example 3: Document Decisions

```
# After architectural discussion
@llm-memory generate_adr
title: "Migrate to microservices architecture"
context: "Monolith becoming difficult to maintain..."
decision: "Split into domain-bounded services"
alternatives: "Modular monolith, Continue as-is"
status: "proposed"

# Once approved, load into knowledge base
@llm-memory load_policy
policy_file: "./docs/adr/0016-migrate-to-microservices.md"
```

### Example 4: Monitor Performance

```
# Daily standup - check system health
@llm-memory get_metrics
time_range: "24h"

# If latency is high, investigate
@llm-memory get_health_status

# Check specific query performance
@llm-memory query_knowledge_base
query: "What queries are slowest?"
```

## Performance Optimization

### Caching

V2.0 implements intelligent caching:

- Policy compliance reports cached for 5 minutes per directory
- Refactoring suggestions cached by code hash
- Metrics aggregated in 1-minute windows
- ADR templates cached indefinitely

### Parallel Processing

For large codebases:

```json
{
  "directory": "./src",
  "parallel": true,
  "max_workers": 4
}
```

### Incremental Scans

Only scan changed files:

```json
{
  "directory": "./src",
  "since_commit": "HEAD~1",
  "changed_only": true
}
```

## Troubleshooting

### "Scan timeout" error

Large codebases may timeout. Solutions:

1. Reduce scope:
   ```
   directory: "./src/services"  # Instead of "./src"
   ```

2. Increase timeout:
   ```bash
   export MCP_TIMEOUT=30000  # 30 seconds
   ```

3. Use file patterns:
   ```
   file_patterns: "*.ts"  # Skip tests, configs
   ```

### High memory usage

Monitor metrics:
```
@llm-memory get_metrics
metric_types: ["system"]
```

If memory > 1GB:
- Restart MCP server: `npm run stop:mcp && npm run test:mcp`
- Check Agent logs: `docker-compose logs agent`
- Reduce concurrent operations

### ADR generation fails

Ensure ADR directory exists:
```bash
mkdir -p docs/adr
```

Set ADR counter:
```bash
# In Agent service
echo "15" > /data/adr_counter.txt
```

## Configuration

### Environment Variables

```bash
# MCP Server V2.0 config
export AGENT_HOST="192.168.1.100"
export AGENT_PORT="3000"
export MCP_TIMEOUT="10000"           # 10 seconds default
export MCP_CACHE_TTL="300"           # 5 minutes
export MCP_MAX_WORKERS="4"           # Parallel scan workers
export ADR_TEMPLATE_PATH="./templates/adr.md"
```

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "llm-memory.mcp.version": "2.0",
  "llm-memory.mcp.enableCache": true,
  "llm-memory.mcp.autoScanOnSave": false,
  "llm-memory.mcp.metricsInterval": 3600
}
```

## V2.0 Success Metrics

- ✅ All V1 tools still working
- ✅ Policy compliance report scans 100+ files in < 10s
- ✅ Refactoring suggestions return in < 3s
- ✅ ADR generation creates valid markdown files
- ✅ Metrics dashboard updates in real-time
- ✅ Zero false positives in compliance reports
- ✅ Cache hit rate > 70% for repeated queries

## Migration from V1

V2.0 is fully backward compatible. No changes needed:

1. Rebuild MCP server: `npm run build:mcp`
2. Restart VS Code
3. New tools appear automatically
4. V1 tools continue working

## Next Steps (V2.1+)

Future enhancements:
- AI-powered test generation
- Automated dependency updates
- Security vulnerability scanning (integration with Snyk/Dependabot)
- Multi-repo support
- Team collaboration features (shared policies)

## Support

Issues or questions:
1. Check logs: `~/.vscode/logs/mcp-llm-memory.log`
2. Test Agent: `./scripts/copilot-context.sh --health`
3. Verify build: `node dist/mcp-server.js --version`

---

**Version:** 2.0.0  
**Release Date:** 2024-01-15  
**Compatibility:** VS Code 1.85+, Node 18+

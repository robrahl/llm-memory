# MCP V2 Tools User Guide

This guide covers the Model Context Protocol (MCP) V2 tools available in llm-memory for GitHub Copilot integration.

## Overview

The MCP V2 tools extend the base functionality with advanced features for codebase analysis, refactoring suggestions, ADR generation, and system monitoring.

## Available V2 Tools

### 1. policy_compliance_report

**Purpose:** Automatically scan your codebase for policy violations.

**Use Cases:**
- Pre-commit policy compliance checks
- Identifying architectural drift
- Ensuring coding standards are followed
- Auditing existing codebases

**Usage in Copilot Chat:**
```
@workspace Check this codebase for policy compliance
```

**Example:**
```
@workspace Scan the src/ directory for naming convention violations
```

**Parameters:**
- `directory` (required) - Path to scan
- `recursive` (optional) - Scan subdirectories (default: true)
- `file_patterns` (optional) - File patterns to include (e.g., '*.ts,*.js')
- `policy_keys` (optional) - Specific policies to check against

**Response:**
```json
{
  "summary": {
    "files_scanned": 45,
    "violations_found": 3,
    "compliance_score": 0.95
  },
  "violations": [...]
}
```

### 2. suggest_refactoring

**Purpose:** Get AI-powered code improvement suggestions.

**Use Cases:**
- Code reviews
- Technical debt reduction
- Performance optimization
- Security hardening
- Modernizing legacy code

**Usage in Copilot Chat:**
```
@workspace Suggest improvements for this function:
[paste code]
```

**Example:**
```
@workspace Analyze this code for security issues:
function authenticate(password) {
  var hash = md5(password);
  return hash === storedHash;
}
```

**Parameters:**
- `code_snippet` (required) - Code to analyze
- `context` (optional) - Language/framework context
- `focus_areas` (optional) - Areas to focus on: ['performance', 'security', 'readability', 'maintainability']

**Response:**
```json
{
  "suggestions": [
    {
      "category": "security",
      "priority": "high",
      "description": "Use bcrypt instead of MD5 for password hashing",
      "example": "const hash = await bcrypt.hash(password, 10);"
    }
  ],
  "overall_score": 0.4
}
```

### 3. generate_adr

**Purpose:** Create Architecture Decision Records (ADR) from templates.

**Use Cases:**
- Documenting architectural decisions
- Creating design documentation
- Tracking decision history
- Team communication

**Usage in Copilot Chat:**
```
@workspace Create an ADR for choosing PostgreSQL over MongoDB
```

**Example:**
```
@workspace Generate an ADR:
Title: Use Redis for session storage
Context: We need fast, distributed session management
Decision: Adopt Redis for session storage
Consequences: Better performance but adds infrastructure complexity
```

**Parameters:**
- `title` (required) - ADR title
- `context` (required) - Background and problem statement
- `decision` (required) - The decision made
- `consequences` (optional) - Positive and negative outcomes
- `alternatives` (optional) - Other options considered
- `status` (optional) - "proposed", "accepted", "deprecated", "superseded" (default: "proposed")

**Response:**
```json
{
  "number": "0001",
  "title": "Use Redis for session storage",
  "file_path": "docs/adr/adr-0001.md",
  "content": "# ADR-0001: Use Redis...",
  "next_steps": [
    "Review with team",
    "Update status to 'accepted' after approval"
  ]
}
```

**ADR is automatically stored in the knowledge base** with key `adr-{number}`.

### 4. get_metrics

**Purpose:** Get real-time system performance and usage metrics.

**Use Cases:**
- System health monitoring
- Performance troubleshooting
- Capacity planning
- Usage analytics

**Usage in Copilot Chat:**
```
@workspace Show me system metrics
```

**Example:**
```
@workspace What's the current status of the knowledge base?
```

**Parameters:**
- `time_range` (optional) - Time window (e.g., '5m', '1h', '24h', '7d')
- `metric_types` (optional) - Filter metrics: ['queries', 'storage', 'system']

**Response:**
```json
{
  "queries": {
    "total": 1250,
    "avg_latency_ms": 180,
    "error_rate": 0.02
  },
  "storage": {
    "documents": 156,
    "policies": 12,
    "total_size_mb": 45.3
  },
  "system": {
    "agent_uptime_hours": 24.5,
    "memory_usage_mb": 256.4
  }
}
```

## V1 Tools (Still Available)

### query_knowledge_base

Search the knowledge base for architectural decisions and patterns.

**Usage:**
```
@workspace What's our error handling policy?
```

### check_policy_compliance

Check if code follows established policies.

**Usage:**
```
@workspace Does this code follow our policies?
[paste code]
```

### load_policy

Load or update a policy in the knowledge base.

**Usage:**
```
@workspace Load policy from docs/policies/api-versioning.md
```

### get_health_status

Check system health.

**Usage:**
```
@workspace Check system health
```

## Workflow Examples

### Example 1: Pre-commit Policy Check

```
# Step 1: Check compliance
@workspace Scan src/ for policy violations

# Step 2: Review violations
[Review the compliance report]

# Step 3: Get refactoring suggestions
@workspace Suggest fixes for this code:
[paste violating code]

# Step 4: Apply fixes and verify
[Make changes]
@workspace Scan src/ for policy violations
```

### Example 2: Document an Architecture Decision

```
# Step 1: Generate ADR
@workspace Generate ADR:
Title: Migrate to microservices architecture
Context: Monolithic app is hard to scale
Decision: Split into 5 microservices
Consequences: Better scalability, more operational complexity
Alternatives: Modular monolith, serverless

# Step 2: ADR is automatically stored
# Step 3: Query it later
@workspace What did we decide about microservices?
```

### Example 3: Code Review Workflow

```
# Step 1: Get refactoring suggestions
@workspace Analyze this function for improvements:
[paste code]

# Step 2: Check against policies
@workspace Does this follow our policies?
[paste code]

# Step 3: Apply suggestions
[Make improvements]

# Step 4: Verify compliance
@workspace Scan the updated file for violations
```

## Configuration

### VS Code MCP Configuration

Add to `~/.vscode/mcp-servers.json` (or global settings):

```json
{
  "mcpServers": {
    "llm-memory": {
      "command": "node",
      "args": ["/path/to/llm-memory/dist/mcp-server.js"],
      "env": {
        "AGENT_HOST": "localhost",
        "AGENT_PORT": "3000"
      }
    }
  }
}
```

### Environment Variables

- `AGENT_HOST` - Agent service hostname (default: localhost)
- `AGENT_PORT` - Agent service port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `LLM_BASE_URL` - LLM service URL
- `LLM_MODEL` - Model name for completions

## Troubleshooting

### Tools Not Appearing in Copilot

1. Check MCP server is configured correctly
2. Restart VS Code
3. Check agent is running: `curl http://localhost:3000/health`
4. Check MCP server logs in VS Code Output panel

### LLM Service Unavailable

Some tools require LLM service:
- `suggest_refactoring` - Will return a message if LLM unavailable
- `generate_adr` - Works without LLM
- `policy_compliance_report` - Planned feature, returns placeholder
- `get_metrics` - Works without LLM

### Agent Not Responding

1. Check agent is running: `docker-compose ps`
2. Check logs: `docker-compose logs agent`
3. Verify database connection: `docker-compose logs postgres`
4. Check health endpoint: `curl http://localhost:3000/health`

### Slow Performance

1. Check metrics: `@workspace Show system metrics`
2. Review vector search index tuning in `scripts/init-pgvector.sql`
3. Adjust `ivfflat.probes` setting for speed vs accuracy
4. Consider rebuilding vector index: `REINDEX INDEX idx_documents_embedding`

## Best Practices

### Policy Compliance

- Run compliance checks regularly (e.g., in CI/CD)
- Store policies in the knowledge base using `load_policy`
- Create ADRs for policy decisions
- Update policies as architecture evolves

### Code Refactoring

- Use specific focus areas for targeted suggestions
- Provide context (language, framework) for better results
- Review suggestions carefully before applying
- Use refactoring tools alongside automated suggestions

### ADR Management

- Create ADRs for significant decisions
- Update status as decisions progress (proposed → accepted)
- Reference ADRs in code and documentation
- Query ADRs when making related decisions

### System Monitoring

- Check metrics regularly
- Monitor latency trends
- Review storage growth
- Plan capacity based on metrics

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Policy Compliance Check

on: [pull_request]

jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start llm-memory
        run: docker-compose up -d
      - name: Wait for service
        run: sleep 10
      - name: Check compliance
        run: |
          curl -X POST http://localhost:3000/scan/compliance \
            -H "Content-Type: application/json" \
            -d '{"directory": "./src", "recursive": true}'
```

## API Reference

For detailed API documentation, see [API Reference](../reference/api-reference.md).

## See Also

- [V1 MCP Integration Guide](v1-mcp-integration.md) - V1 tools documentation
- [V2 Advanced Integration](v2-advanced-integration.md) - Advanced features
- [Quick Reference](quick-reference.md) - Command cheat sheet
- [Architecture](../reference/architecture.md) - Technical architecture

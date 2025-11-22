# V2.0 MCP Quick Reference

**Quick commands for VS Code Copilot Chat**

## V2.0 Tools (New)

### 1. Policy Compliance Report
**Scan codebase for policy violations**
```
@llm-memory policy_compliance_report
directory: "./src"
recursive: true
file_patterns: "*.ts,*.js"
```

**Fast scan (current dir only):**
```
@llm-memory policy_compliance_report
directory: "."
recursive: false
```

---

### 2. Suggest Refactoring
**Get AI-powered code improvements**
```
@llm-memory suggest_refactoring
code_snippet: "
class UserService {
  async getUser(id) {
    return await db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}
"
focus_areas: ["security", "performance"]
```

**Quick check:**
```
@llm-memory suggest_refactoring
code_snippet: "<paste-your-code>"
```

---

### 3. Generate ADR
**Create Architecture Decision Record**
```
@llm-memory generate_adr
title: "Use PostgreSQL for vector storage"
context: "Need efficient storage for embeddings"
decision: "Use pgvector extension with PostgreSQL"
```

**With full details:**
```
@llm-memory generate_adr
title: "Migrate to microservices"
context: "Monolith becoming difficult to maintain..."
decision: "Split into domain-bounded services"
alternatives: "Modular monolith, Continue as-is"
consequences: "Better scaling, more complexity"
status: "proposed"
```

---

### 4. Get Metrics
**Real-time system metrics**
```
@llm-memory get_metrics
time_range: "1h"
```

**Filtered metrics:**
```
@llm-memory get_metrics
time_range: "24h"
metric_types: ["queries", "system"]
```

**Quick health check:**
```
@llm-memory get_metrics
```

---

## V1 Tools (Still Available)

### Query Knowledge Base
```
@llm-memory query_knowledge_base
query: "What's our naming convention?"
```

### Check Policy Compliance
```
@llm-memory check_policy_compliance
code_snippet: "class User { ... }"
```

### Load Policy
```
@llm-memory load_policy
policy_file: "./docs/policies/error_handling.md"
```

### Health Status
```
@llm-memory get_health_status
```

---

## Common Workflows

### Pre-Commit Check
```
1. @llm-memory policy_compliance_report directory: "./src/modified"
2. Review violations
3. @llm-memory suggest_refactoring code_snippet: "<fix-code>"
4. Apply suggestions
5. Commit
```

### Code Review
```
1. @llm-memory suggest_refactoring code_snippet: "<review-code>"
2. @llm-memory check_policy_compliance code_snippet: "<review-code>"
3. Discuss with team
```

### Document Decision
```
1. @llm-memory generate_adr title: "..." context: "..." decision: "..."
2. Review generated ADR
3. @llm-memory load_policy policy_file: "<adr-path>"
```

### Monitor Performance
```
1. @llm-memory get_metrics time_range: "24h"
2. If issues found: @llm-memory get_health_status
3. Check specific components
```

---

## Tips

**Reduce scan time:**
- Use `file_patterns` to filter files
- Set `recursive: false` for single directory
- Scan only changed files

**Better suggestions:**
- Include `context` (e.g., "typescript-service", "react-component")
- Specify `focus_areas` (e.g., ["security", "readability"])
- Provide complete code snippets with context

**ADR best practices:**
- Be specific in title (searchable keywords)
- Include measurable consequences
- List alternatives considered
- Update status after team review

**Metrics analysis:**
- Use shorter time ranges for recent issues
- Filter by `metric_types` for focused view
- Compare metrics over time

---

## Troubleshooting

**"Agent unreachable" error:**
```
@llm-memory get_health_status
```

**Slow compliance scan:**
```
@llm-memory policy_compliance_report
directory: "./src/services"
file_patterns: "*.ts"
```

**Empty suggestions:**
- Ensure code snippet has enough context
- Try different `focus_areas`
- Check if code already optimal

**ADR generation fails:**
- Ensure docs/adr/ directory exists
- Check Agent service logs
- Verify ADR template is configured

---

## Keyboard Shortcuts

**In VS Code:**
- `Ctrl+I` / `Cmd+I` - Open Copilot Chat
- Type `@llm-memory` - See available tools
- `Tab` - Autocomplete tool name
- `Enter` - Submit query

**Multi-line code:**
```
code_snippet: "
line 1
line 2
line 3
"
```

---

**Version:** 2.0.0  
**Last Updated:** 2024-11-17  
**Full Docs:** [docs/copilot-v2-mcp.md](./copilot-v2-mcp.md)

# Copilot Integration Quick Reference

## Test Setup (Windows Docker Desktop)

```bash
# 1. Start Agent + Postgres
cd C:\Z_D-LW\GIT_REPOS\llm-memory
docker-compose -f docker-compose.dev.yml up --build -d

# 2. Generate context
.\scripts\test-copilot-context.ps1

# 3. Verify file exists
cat .vscode/copilot-context.md
```

## In Copilot Chat

### Example 1: Generate Code with Policies

**Prompt:**
```
Based on .vscode/copilot-context.md, write a PaymentService class that:
1. Follows our naming convention
2. Has proper error handling with timeouts
3. Uses structured JSON logging
```

**Result:** Copilot generates code matching all 3 policies

### Example 2: Review Code Against Policies

**Prompt:**
```
Review this code snippet against our policies in .vscode/copilot-context.md:

[paste code]

What policies does it follow? What needs fixing?
```

**Result:** Copilot identifies policy violations and suggests fixes

### Example 3: Ask About Patterns

**Prompt:**
```
Using our policies in .vscode/copilot-context.md:
- What naming pattern should I use for a service that handles authentication?
- What error handling should it have?
- How should I structure the logs?
```

**Result:** Copilot provides pattern guidance based on policies

## Policies Available

| Policy | Source | Content |
|--------|--------|---------|
| **naming_convention** | Postgres | Services named `{SomethingService}` |
| **error_handling** | Postgres | Timeout + retry for async ops (30s, 3x) |
| **logging_level** | Postgres | Structured JSON logging (debug/info/warn/error) |

## Regenerate Context

When policies change (via API or Admin CLI):

```powershell
# Pull latest policies from Agent
.\scripts\test-copilot-context.ps1

# Use in Copilot
# (Paste updated .vscode/copilot-context.md)
```

## Context Lifetime

- Generated: Timestamp at top of `.vscode/copilot-context.md`
- Latency: Shows how fresh each policy is (ms since fetch)
- Expires: When Agent/Postgres goes down (regenerate to refresh)

## On NAS (Production)

Same workflow, just update Agent URL:

```powershell
# Edit script or set env var
$AgentHost = "192.168.1.100"  # Your NAS IP
.\scripts\test-copilot-context.ps1

# Context now pulls from NAS Agent
```


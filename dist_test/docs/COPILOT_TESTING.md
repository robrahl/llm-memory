# Testing Copilot Integration with llm-memory

This guide shows how to test the Copilot integration locally before deploying to NAS.

## Prerequisites

- Docker Desktop running on Windows 11
- VS Code with Copilot extension
- llm-memory Agent running (`docker-compose -f docker-compose.dev.yml up`)

## Quick Start

### Step 1: Generate Context

Run the context generation script from PowerShell:

```powershell
cd C:\Z_D-LW\GIT_REPOS\llm-memory
.\scripts\test-copilot-context.ps1
```

This creates `.vscode/copilot-context.md` with your architectural policies.

**Expected Output:**
```
[+] Fetching policy context from Agent at http://localhost:3000...
[*] Query 1: Naming convention...
[+] Got response: Policy "naming_convention": Consistent service naming for discovery and contracts...
[*] Query 2: Error handling...
[+] Got response: Policy "error_handling": Prevent hanging requests in distributed systems...
[*] Query 3: Logging...
[+] Got response: Policy "logging_level": Structured logging for debugging and monitoring...
[OK] Context written to .vscode/copilot-context.md
```

### Step 2: Open Copilot Chat

In VS Code:
1. Open Copilot Chat (Cmd/Ctrl + Shift + I)
2. Reference the context file in your prompt

**Example Prompt:**

```
Based on .vscode/copilot-context.md:
1. Create a new AuthService class following our naming convention
2. Make sure it uses proper error handling with timeouts
3. Add structured JSON logging
```

**Copilot Response:**
Copilot will generate code that:
- Names the class `AuthService` (matches naming_convention policy)
- Adds timeout + retry logic to async methods (matches error_handling policy)
- Uses structured JSON logging (matches logging_level policy)

### Step 3: Copy to Your Project

Once you've validated the pattern works, you can:

1. **Add policies via /policy endpoint:**
   ```powershell
   $newPolicy = @{
       key = "my_custom_rule"
       description = "Your custom rule"
       value = @{ rule = "..."; examples = @() }
   } | ConvertTo-Json
   
   Invoke-WebRequest -Uri "http://localhost:3000/policy" `
       -Method POST `
       -Headers @{'Content-Type'='application/json'} `
       -Body $newPolicy
   ```

2. **Regenerate context after adding policies:**
   ```powershell
   .\scripts\test-copilot-context.ps1
   ```

3. **Use in Copilot Chat:**
   - Reference the updated `.vscode/copilot-context.md`
   - Copilot will use your new policies

## Workflow During Development

1. **Session Start:**
   ```powershell
   .\scripts\test-copilot-context.ps1  # Update context
   ```

2. **In Copilot Chat:**
   - Paste or reference `.vscode/copilot-context.md`
   - Ask for code generation
   - Accept + adapt generated code

3. **If policies change:**
   ```powershell
   .\scripts\test-copilot-context.ps1  # Refresh context
   ```

## Files

| File | Purpose |
|------|---------|
| `.vscode/copilot-context.md` | Generated context for Copilot (auto-updated) |
| `scripts/test-copilot-context.ps1` | Script to fetch policies from Agent |
| `.vscode/settings.json` | VS Code configuration for Copilot |

## Troubleshooting

**Problem:** Script returns "No matching policy found"
- **Solution:** Ensure Agent is healthy: `curl http://localhost:3000/health`

**Problem:** Copilot not seeing context
- **Solution:** Make sure `.vscode/copilot-context.md` exists and is referenced in chat

**Problem:** Context is stale
- **Solution:** Run `.\scripts\test-copilot-context.ps1` again to refresh

## Next: Production Deployment

Once testing is complete, the same pattern works on NAS:
1. Copy context generation script to NAS
2. Update `LLM_BASE_URL` to NAS Agent IP
3. Run script before each session (or automate via cron)


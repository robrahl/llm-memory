# Quick test: Generate Copilot context from running Agent (Windows PowerShell)

param(
    [string]$AgentHost = "localhost",
    [int]$AgentPort = 3000
)

$OutputFile = ".vscode/copilot-context.md"
$VscodeDir = ".vscode"

if (-not (Test-Path $VscodeDir)) {
    New-Item -ItemType Directory -Path $VscodeDir | Out-Null
}

Write-Host "[+] Fetching policy context from Agent at http://${AgentHost}:${AgentPort}..." -ForegroundColor Cyan

# Query 1: Naming conventions
Write-Host "[*] Query 1: Naming convention..." -ForegroundColor Gray
$body1 = @{ query = "naming"; topK = 1 } | ConvertTo-Json
$resp1 = Invoke-WebRequest -Uri "http://${AgentHost}:${AgentPort}/query" `
    -Method POST `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body1 `
    -ErrorAction Stop | Select-Object -ExpandProperty Content | ConvertFrom-Json
$policy1 = $resp1
Write-Host "[+] Got response: $($policy1.answer.Substring(0, [Math]::Min(80, $policy1.answer.Length)))..." -ForegroundColor Green

# Query 2: Error handling
Write-Host "[*] Query 2: Error handling..." -ForegroundColor Gray
$body2 = @{ query = "error"; topK = 1 } | ConvertTo-Json
$resp2 = Invoke-WebRequest -Uri "http://${AgentHost}:${AgentPort}/query" `
    -Method POST `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body2 `
    -ErrorAction Stop | Select-Object -ExpandProperty Content | ConvertFrom-Json
$policy2 = $resp2
Write-Host "[+] Got response: $($policy2.answer.Substring(0, [Math]::Min(80, $policy2.answer.Length)))..." -ForegroundColor Green

# Query 3: Logging level
Write-Host "[*] Query 3: Logging..." -ForegroundColor Gray
$body3 = @{ query = "logging"; topK = 1 } | ConvertTo-Json
$resp3 = Invoke-WebRequest -Uri "http://${AgentHost}:${AgentPort}/query" `
    -Method POST `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body3 `
    -ErrorAction Stop | Select-Object -ExpandProperty Content | ConvertFrom-Json
$policy3 = $resp3
Write-Host "[+] Got response: $($policy3.answer.Substring(0, [Math]::Min(80, $policy3.answer.Length)))..." -ForegroundColor Green

# Generate markdown for Copilot
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$content = @"
# llm-memory Context for Copilot

Generated: $timestamp
Health: Agent responding at http://${AgentHost}:${AgentPort}

## Architectural Policies

### 1. Naming Convention
$($policy1.answer)

**Source:** $($policy1.sources[0].key)  
**Latency:** $($policy1.latency_ms)ms

---

### 2. Error Handling
$($policy2.answer)

**Source:** $($policy2.sources[0].key)  
**Latency:** $($policy2.latency_ms)ms

---

### 3. Logging Standards
$($policy3.answer)

**Source:** $($policy3.sources[0].key)  
**Latency:** $($policy3.latency_ms)ms

---

## Usage in Copilot Chat

Reference this file when coding:

\`\`\`
@copilot Based on .vscode/copilot-context.md, generate a new Service class following our naming convention
\`\`\`

Or ask Copilot directly:

\`\`\`
Use the policies in .vscode/copilot-context.md. What error handling pattern should I use for async operations?
\`\`\`

## Last Updated

- Naming Conv: $($policy1.latency_ms)ms ago
- Error Handling: $($policy2.latency_ms)ms ago  
- Code Review: $($policy3.latency_ms)ms ago

Regenerate by running: \`.\scripts\test-copilot-context.ps1\`
"@

$content | Set-Content -Path $OutputFile -Encoding UTF8

Write-Host "[OK] Context written to $OutputFile" -ForegroundColor Green
Write-Host ""
Write-Host "=== COPILOT CONTEXT READY ===" -ForegroundColor Green
Write-Host ""
Write-Host $content
Write-Host ""
Write-Host "Next: Open Copilot Chat and reference the context file" -ForegroundColor Cyan

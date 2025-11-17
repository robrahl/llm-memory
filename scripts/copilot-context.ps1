# copilot-context.ps1
# PowerShell version of copilot-context.sh for Windows
# Simple script to inject llm-memory context into VS Code Copilot sessions
# Usage: .\scripts\copilot-context.ps1 "your question here"
# Usage: .\scripts\copilot-context.ps1 -Health
# Usage: .\scripts\copilot-context.ps1 -Help

param(
    [Parameter(Position=0)]
    [string]$Query,
    
    [switch]$Health,
    [switch]$Help,
    [string]$AgentHost = $(if ($env:AGENT_HOST) { $env:AGENT_HOST } else { "localhost" }),
    [int]$AgentPort = $(if ($env:AGENT_PORT) { [int]$env:AGENT_PORT } else { 3000 })
)

# Configuration
$CONTEXT_FILE = ".vscode/copilot-context.md"
$QUERIES_LOG = ".vscode/copilot-queries.log"

# Create .vscode directory if not exists
if (-not (Test-Path ".vscode")) {
    New-Item -ItemType Directory -Path ".vscode" | Out-Null
}

# Function: Query the Agent
function Query-Agent {
    param([string]$QueryText)
    
    Write-Host "[*] Querying llm-memory Agent..." -ForegroundColor Blue
    
    try {
        $body = @{
            query = $QueryText
            topK = 5
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://${AgentHost}:${AgentPort}/query" `
            -Method POST `
            -Headers @{'Content-Type'='application/json'} `
            -Body $body `
            -TimeoutSec 30
        
        return $response
    }
    catch {
        return @{
            error = "Agent unreachable at ${AgentHost}:${AgentPort}"
            message = $_.Exception.Message
        }
    }
}

# Function: Format context for Copilot
function Format-Context {
    param(
        [string]$QueryText,
        [object]$Response
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $responseJson = $Response | ConvertTo-Json -Depth 10
    
    $content = @"
# llm-memory Context for Copilot

**Generated:** $timestamp
**Query:** $QueryText

## Agent Response

``````json
$responseJson
``````

## How to Use

1. Reference this context in Copilot chat:
   - "Based on the context in .vscode/copilot-context.md, ..."
   - "Following our policies from llm-memory, ..."

2. Copy specific policies/answers from above into your prompt

3. Generate new context: ``.\scripts\copilot-context.ps1 "your question"``

---

**Note:** This context is auto-generated and expires after 1 hour.
Refresh by running the script again.
"@
    
    $content | Set-Content -Path $CONTEXT_FILE -Encoding UTF8
}

# Function: Check Agent health
function Test-AgentHealth {
    Write-Host "[*] Checking Agent health..." -ForegroundColor Blue
    
    try {
        $health = Invoke-RestMethod -Uri "http://${AgentHost}:${AgentPort}/health" `
            -Method GET `
            -TimeoutSec 10
        
        $status = if ($health.status) { $health.status } else { "unknown" }
        $dbStatus = if ($health.postgres) { $health.postgres } else { "unknown" }
        $llmStatus = if ($health.ollama) { $health.ollama } else { "unknown" }
        
        if ($status -eq "ok") {
            Write-Host "[+] Agent: $status" -ForegroundColor Green
            Write-Host "[+] Postgres: $dbStatus" -ForegroundColor Green
            Write-Host "[+] Ollama: $llmStatus" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "[-] Agent unhealthy" -ForegroundColor Red
            Write-Host "[-] Status: $status" -ForegroundColor Red
            Write-Host "[!] Tip: Check if Agent Service is running:" -ForegroundColor Yellow
            Write-Host "    docker-compose logs agent" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "[-] Agent unreachable or unhealthy" -ForegroundColor Red
        Write-Host "[-] Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "[!] Tip: Check if Agent Service is running:" -ForegroundColor Yellow
        Write-Host "    docker-compose logs agent" -ForegroundColor Yellow
        return $false
    }
}

# Function: Display usage
function Show-Help {
    Write-Host "llm-memory Copilot Context Generator" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Blue
    Write-Host "  .\scripts\copilot-context.ps1 <query>"
    Write-Host "  .\scripts\copilot-context.ps1 -Health"
    Write-Host "  .\scripts\copilot-context.ps1 -Help"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Blue
    Write-Host '  .\scripts\copilot-context.ps1 "What''s our naming convention?"'
    Write-Host '  .\scripts\copilot-context.ps1 "error handling patterns"'
    Write-Host "  .\scripts\copilot-context.ps1 -Health"
    Write-Host ""
    Write-Host "Environment Variables:" -ForegroundColor Blue
    Write-Host "  AGENT_HOST    Agent service hostname (default: localhost)"
    Write-Host "  AGENT_PORT    Agent service port (default: 3000)"
    Write-Host ""
    Write-Host "Output:" -ForegroundColor Blue
    Write-Host "  Context saved to: .vscode/copilot-context.md"
    Write-Host "  Query logged to: .vscode/copilot-queries.log"
    Write-Host ""
    Write-Host "Workflow:" -ForegroundColor Blue
    Write-Host '  1. Run: .\scripts\copilot-context.ps1 "your question"'
    Write-Host "  2. Check: .vscode/copilot-context.md"
    Write-Host "  3. Use in Copilot: Copy answers into chat"
    Write-Host '  4. Reference: "Based on the context I just generated, ..."'
    Write-Host ""
}

# Main logic
if ($Help) {
    Show-Help
    exit 0
}

if ($Health) {
    $healthy = Test-AgentHealth
    if ($healthy) { exit 0 } else { exit 1 }
}

if (-not $Query) {
    Write-Host "Error: Query required" -ForegroundColor Red
    Show-Help
    exit 1
}

# Check health first
$isHealthy = Test-AgentHealth
if (-not $isHealthy) {
    Write-Host "[!] Agent is unreachable. Context may be stale." -ForegroundColor Yellow
    Write-Host "    Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Query agent
$response = Query-Agent -QueryText $Query

# Check for errors
if ($response.error) {
    Write-Host "[-] Query failed" -ForegroundColor Red
    Write-Host ($response | ConvertTo-Json)
    exit 1
}

# Format and save context
Format-Context -QueryText $Query -Response $response

# Log query
$logEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Query: $Query"
Add-Content -Path $QUERIES_LOG -Value $logEntry

# Display result
Write-Host "[+] Context generated" -ForegroundColor Green
Write-Host "[+] Saved to: $CONTEXT_FILE" -ForegroundColor Green
Write-Host ""
Write-Host "Answer:" -ForegroundColor Blue
Write-Host $response.answer
Write-Host ""
Write-Host "Sources:" -ForegroundColor Blue
if ($response.sources -and $response.sources.Count -gt 0) {
    foreach ($source in $response.sources) {
        Write-Host "  - $($source.key): $($source.excerpt)" -ForegroundColor Gray
    }
}
else {
    Write-Host "  None" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Next step:" -ForegroundColor Yellow
Write-Host "1. Open .vscode/copilot-context.md" -ForegroundColor Yellow
Write-Host "2. Copy relevant context" -ForegroundColor Yellow
Write-Host "3. Paste into Copilot chat" -ForegroundColor Yellow

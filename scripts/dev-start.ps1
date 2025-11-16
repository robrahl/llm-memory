#!/usr/bin/env pwsh

# Quick-start script for local Windows development
# Usage: .\scripts\dev-start.ps1 [up|down|logs|clean]

param(
    [Parameter(Position=0)]
    [ValidateSet("up", "down", "logs", "clean", "restart", "test", "status")]
    [string]$Command = "up"
)

$ErrorActionPreference = "Stop"
$compose_file = "docker-compose.dev.yml"
$env_file = ".env.dev"

function Check-Docker {
    try {
        $version = docker --version
        Write-Host "OK Docker: $version" -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR: Docker Desktop not found or not running!" -ForegroundColor Red
        Write-Host "  Install: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }
}

function Check-LLM {
    try {
        # Try LM Studio (OpenAI compatible)
        $response = Invoke-WebRequest -Uri "http://localhost:11434/v1/models" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "OK LLM: OpenAI-compatible server on localhost:11434" -ForegroundColor Green
            return
        }
        throw "not openai"
    }
    catch {
        try {
            # Fallback: Ollama endpoint
            $r2 = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($r2.StatusCode -eq 200) {
                Write-Host "OK LLM: Ollama server on localhost:11434" -ForegroundColor Green
                return
            }
            throw "no llm"
        }
        catch {
            Write-Host "WARN LLM: No server detected on localhost:11434" -ForegroundColor Yellow
            Write-Host "  Start LM Studio or Ollama" -ForegroundColor Yellow
        }
    }
}

function Check-EnvFile {
    if (-not (Test-Path $env_file)) {
        Write-Host "Missing $env_file" -ForegroundColor Yellow
        Write-Host "  Creating template..." -ForegroundColor Yellow
        
        $template = @"
# Development Environment Variables
DB_USER=postgres
DB_PASSWORD=dev_password_123
NODE_ENV=development
LOG_LEVEL=debug
    LLM_PROVIDER=openai
    LLM_BASE_URL=http://host.docker.internal:11434
"@
        Set-Content -Path $env_file -Value $template
        Write-Host "Created $env_file (edit as needed)" -ForegroundColor Green
    }
}

function Start-Services {
    Write-Host "`nStarting local development stack..." -ForegroundColor Cyan
    Check-EnvFile
    docker-compose -f $compose_file --env-file $env_file up --build -d
    Write-Host "`nWaiting for services to be healthy..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Health check
    $health = docker-compose -f $compose_file ps --filter "status=running"
    if ($health) {
        Write-Host "Services started:" -ForegroundColor Green
        docker-compose -f $compose_file ps
        
        Write-Host "`nEndpoints:" -ForegroundColor Cyan
        Write-Host "  - Agent API: http://localhost:3000" -ForegroundColor Green
        Write-Host "  - Postgres: localhost:5432 (user=postgres)" -ForegroundColor Green
        Write-Host "  - Logs: docker-compose -f $compose_file logs -f" -ForegroundColor Green
        
        Write-Host "`nQuick commands:" -ForegroundColor Cyan
        Write-Host "  - Status: .\scripts\dev-start.ps1 status" -ForegroundColor White
        Write-Host "  - Logs: .\scripts\dev-start.ps1 logs" -ForegroundColor White
        Write-Host "  - Stop: .\scripts\dev-start.ps1 down" -ForegroundColor White
        Write-Host "  - Clean: .\scripts\dev-start.ps1 clean" -ForegroundColor White
    }
}

function Stop-Services {
    Write-Host "`nStopping services..." -ForegroundColor Yellow
    docker-compose -f $compose_file down
    Write-Host "Services stopped" -ForegroundColor Green
}

function Show-Logs {
    docker-compose -f $compose_file logs -f --tail 100
}

function Clean-Services {
    Write-Host "`nCleaning volumes and images..." -ForegroundColor Yellow
    $confirm = Read-Host "This will delete all data. Continue? (yes/no)"
    if ($confirm -eq "yes") {
        docker-compose -f $compose_file down -v --rmi all
        Write-Host "Cleaned" -ForegroundColor Green
    }
    else {
        Write-Host "Cancelled" -ForegroundColor Yellow
    }
}

function Restart-Services {
    Write-Host "`nRestarting..." -ForegroundColor Yellow
    docker-compose -f $compose_file restart
    Start-Sleep -Seconds 3
    Show-Status
}

function Show-Status {
    Write-Host "`nService Status:" -ForegroundColor Cyan
    docker-compose -f $compose_file ps
    
    Write-Host "`nHealth Checks:" -ForegroundColor Cyan
    
    # Agent health
    try {
        $agent_health = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($agent_health.StatusCode -eq 200) {
            Write-Host "  Agent: Healthy" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  Agent: Unreachable" -ForegroundColor Red
    }
    
    # Postgres health via psql inside container
    try {
        $pg_health = docker-compose -f $compose_file exec -T postgres pg_isready -U postgres 2>$null
        if ($?) {
            Write-Host "  Postgres: Healthy" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  Postgres: Unhealthy" -ForegroundColor Red
    }
    
    # LLM health (LM Studio or Ollama)
    Check-LLM
}

function Test-API {
    Write-Host "`nTesting Agent API..." -ForegroundColor Cyan
    
    $body = @{
        query = "What's our naming convention?"
        topK = 3
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/query" `
            -Method POST `
            -Headers @{'Content-Type'='application/json'} `
            -Body $body `
            -TimeoutSec 10 `
            -ErrorAction SilentlyContinue
        
        Write-Host "Query successful:" -ForegroundColor Green
        $response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
    }
    catch {
        Write-Host "Query failed: $_" -ForegroundColor Red
        Write-Host "  Check logs: .\scripts\dev-start.ps1 logs" -ForegroundColor Yellow
    }
}

# Main
Write-Host "`n=== llm-memory Local Development (Win11) ===" -ForegroundColor Cyan

Check-Docker
Check-LLM

switch ($Command) {
    "up" {
        Start-Services
    }
    "down" {
        Stop-Services
    }
    "logs" {
        Show-Logs
    }
    "clean" {
        Clean-Services
    }
    "restart" {
        Restart-Services
    }
    "status" {
        Show-Status
    }
    "test" {
        Show-Status
        Test-API
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        exit 1
    }
}

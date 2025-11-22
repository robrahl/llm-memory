# Build Agent Image for Synology (Local Only)
# Usage: .\build-nas-image.ps1

$ImageName = "llm-memory-agent:latest"
$TarFile = "llm-memory-agent.tar"

Write-Host "Building Docker image for ARM64 (Synology)..." -ForegroundColor Cyan
# Build for ARM64 platform specifically
docker buildx build --platform linux/arm64 -t $ImageName -f Dockerfile.agent . --load

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Saving image to file: $TarFile" -ForegroundColor Yellow
docker save -o $TarFile $ImageName

Write-Host "Build complete!" -ForegroundColor Green
Write-Host "Manual steps to deploy:" -ForegroundColor Cyan
Write-Host "1. Copy $TarFile to your NAS"
Write-Host "2. SSH into NAS and run: docker load -i $TarFile"
Write-Host "3. Start services: docker-compose up -d"

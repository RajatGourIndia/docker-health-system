# Applies .env / flag changes for the plain `docker run` deployment path by
# stopping, removing, and recreating the container with the same flags as
# the Quick Start command in README.md. `docker restart` does NOT pick up
# .env changes -- it reuses the container's original environment -- so this
# is the one-command equivalent for docker-run users. (Compose users don't
# need this: `docker compose up -d` already recreates on config changes.)
#
# Usage:
#   .\scripts\recreate.ps1
#   .\scripts\recreate.ps1 -HostPort 3001          # different host port
#   .\scripts\recreate.ps1 -ContainerName my-dashboard

param(
    [string]$ContainerName = "dashboard",
    [int]$HostPort = 3000,
    [string]$Image = "rajatindia/docker-health-system:latest"
)

Write-Host "Stopping and removing '$ContainerName' (if it exists)..."
docker stop $ContainerName 2>$null | Out-Null
docker rm $ContainerName 2>$null | Out-Null

# Picked up automatically if present in the current directory -- matches the
# Quick Start command's zero-config default when there isn't one.
$envFileArgs = @()
if (Test-Path ".env") {
    $envFileArgs = @("--env-file", ".env")
}

Write-Host "Starting '$ContainerName' from $Image on port $HostPort..."
docker run -d --name $ContainerName `
  -p "${HostPort}:3000" `
  --user root `
  @envFileArgs `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -v dashboard-data:/app/data `
  $Image

Write-Host "Done -- dashboard available at http://localhost:$HostPort"

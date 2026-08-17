#!/usr/bin/env bash
# Applies .env / flag changes for the plain `docker run` deployment path by
# stopping, removing, and recreating the container with the same flags as
# the Quick Start command in README.md. `docker restart` does NOT pick up
# .env changes — it reuses the container's original environment — so this
# is the one-command equivalent for docker-run users. (Compose users don't
# need this: `docker compose up -d` already recreates on config changes.)
#
# Usage:
#   ./scripts/recreate.sh
#   HOST_PORT=3001 ./scripts/recreate.sh          # different host port
#   CONTAINER_NAME=my-dashboard ./scripts/recreate.sh
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-dashboard}"
HOST_PORT="${HOST_PORT:-3000}"
IMAGE="${IMAGE:-rajatindia/docker-health-system:latest}"

echo "Stopping and removing '$CONTAINER_NAME' (if it exists)..."
docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true

# Picked up automatically if present in the current directory — matches the
# Quick Start command's zero-config default when there isn't one.
ENV_FILE_ARGS=()
if [ -f .env ]; then
  ENV_FILE_ARGS=(--env-file .env)
fi

echo "Starting '$CONTAINER_NAME' from $IMAGE on port $HOST_PORT..."
docker run -d --name "$CONTAINER_NAME" \
  -p "${HOST_PORT}:3000" \
  --user root \
  ${ENV_FILE_ARGS[@]+"${ENV_FILE_ARGS[@]}"} \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v dashboard-data:/app/data \
  "$IMAGE"

echo "Done — dashboard available at http://localhost:${HOST_PORT}"

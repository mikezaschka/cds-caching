#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
compose=(
    docker compose
    -f "$root/test/docker/docker-compose.yaml"
    -f "$root/test/docker/docker-compose.matrix.yaml"
)

"${compose[@]}" up -d --wait redis postgres

status=0
bash "$root/scripts/docker-test-cds.sh" 9 || status=1
START_SERVICES=0 bash "$root/scripts/docker-test-cds.sh" 10 || status=1

"${compose[@]}" down
exit "$status"

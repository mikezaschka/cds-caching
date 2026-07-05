#!/usr/bin/env bash
set -euo pipefail

cds="${1:?Usage: $0 <8|9|10>}"
start_services="${START_SERVICES:-1}"

root="$(cd "$(dirname "$0")/.." && pwd)"
compose=(
    docker compose
    -f "$root/test/docker/docker-compose.yaml"
    -f "$root/test/docker/docker-compose.matrix.yaml"
)

if [ "$start_services" = "1" ]; then
    "${compose[@]}" up -d --wait redis postgres
fi

export CDS_MAJOR="$cds"
"${compose[@]}" build --build-arg "CDS_MAJOR=$cds" test
"${compose[@]}" run --rm test

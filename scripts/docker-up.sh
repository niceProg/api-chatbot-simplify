#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f ".env" ]]; then
     echo "File .env belum ada. Buat dulu dari .env.example"
     exit 1
fi

docker compose up -d --build
docker compose ps

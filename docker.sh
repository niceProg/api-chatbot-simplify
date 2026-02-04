#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"

usage() {
     cat <<'EOF'
Usage:
  ./docker.sh --setup
  ./docker.sh --resetup
  ./docker.sh --help

Options:
  --setup    Build and start containers.
  --resetup  Recreate from scratch (down + up --build --force-recreate).
  --help     Show this help.
EOF
}

ensure_env_file() {
     if [[ -f "${ENV_FILE}" ]]; then
          return 0
     fi

     if [[ -f ".env.example" ]]; then
          cp .env.example "${ENV_FILE}"
          echo "File ${ENV_FILE} dibuat dari .env.example."
          echo "Isi GEMINI_API_KEY di ${ENV_FILE}, lalu jalankan ulang perintah."
          exit 1
     fi

     echo "File ${ENV_FILE} tidak ditemukan."
     exit 1
}

validate_env() {
     if ! grep -q '^GEMINI_API_KEY=' "${ENV_FILE}"; then
          echo "GEMINI_API_KEY belum ada di ${ENV_FILE}."
          exit 1
     fi

     local key
     key="$(grep '^GEMINI_API_KEY=' "${ENV_FILE}" | tail -n1 | cut -d'=' -f2-)"
     if [[ -z "${key}" || "${key}" == "your_gemini_api_key_here" ]]; then
          echo "GEMINI_API_KEY di ${ENV_FILE} masih kosong/placeholder."
          exit 1
     fi
}

setup() {
     ensure_env_file
     validate_env
     docker compose up -d --build
     docker compose ps
}

resetup() {
     ensure_env_file
     validate_env
     docker compose down --remove-orphans
     docker compose up -d --build --force-recreate
     docker compose ps
}

main() {
     if [[ $# -ne 1 ]]; then
          usage
          exit 1
     fi

     case "$1" in
          --setup) setup ;;
          --resetup) resetup ;;
          --help|-h) usage ;;
          *)
               echo "Argumen tidak dikenal: $1"
               usage
               exit 1
               ;;
     esac
}

main "$@"

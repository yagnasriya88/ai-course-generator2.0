#!/usr/bin/env bash
# Restores a backup produced by export_mongo.sh. Usage:
#   scripts/restore_mongo.sh backups/20260704-101500
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IN_DIR="${1:?Usage: restore_mongo.sh <backup-dir>}"

if [ ! -f "$IN_DIR/dump.archive" ]; then
  echo "No dump.archive found in $IN_DIR" >&2
  exit 1
fi

cd "$REPO_ROOT"

echo "Restoring from $IN_DIR/dump.archive ..."
docker compose exec -T mongo mongorestore --archive --drop < "$IN_DIR/dump.archive"

echo "Restore complete."

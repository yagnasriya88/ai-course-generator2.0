#!/usr/bin/env bash
# Backs up the app's MongoDB data: a full BSON dump (mongodump) plus a
# human-readable JSON export per collection (mongoexport). Runs the mongo
# tooling inside the compose container — no host-installed Mongo required.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/backend/.env"
DB_NAME="learnify_ai"
if [ -f "$ENV_FILE" ]; then
  DB_NAME="$(grep -E '^MONGO_DB_NAME=' "$ENV_FILE" | tail -1 | cut -d= -f2- || true)"
  DB_NAME="${DB_NAME:-learnify_ai}"
fi

OUT_DIR="${1:-$REPO_ROOT/backups/$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$OUT_DIR"

cd "$REPO_ROOT"

echo "Dumping database '$DB_NAME' to $OUT_DIR/dump.archive ..."
docker compose exec -T mongo mongodump --db "$DB_NAME" --archive > "$OUT_DIR/dump.archive"

for collection in users courses lessons video_notes; do
  echo "Exporting collection '$collection' to $OUT_DIR/$collection.json ..."
  docker compose exec -T mongo mongoexport \
    --db "$DB_NAME" --collection "$collection" --jsonArray \
    > "$OUT_DIR/$collection.json" || echo "  (skipped — collection may not exist yet)"
done

echo "Backup complete: $OUT_DIR"

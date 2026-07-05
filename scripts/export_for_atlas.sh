#!/usr/bin/env bash
# One-time migration dump: exports the local MongoDB database as a
# mongodump archive directly importable into MongoDB Atlas via mongorestore.
#
# Differs from export_mongo.sh (routine timestamped backups/ snapshots) —
# this writes a single file to the project root specifically for migrating
# an existing local dataset into a freshly-provisioned Atlas cluster.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/backend/.env"
DB_NAME="learnify_ai"
if [ -f "$ENV_FILE" ]; then
  DB_NAME="$(grep -E '^MONGO_DB_NAME=' "$ENV_FILE" | tail -1 | cut -d= -f2- || true)"
  DB_NAME="${DB_NAME:-learnify_ai}"
fi

OUT_FILE="$REPO_ROOT/atlas_migration.archive"

cd "$REPO_ROOT"
echo "Dumping database '$DB_NAME' to $OUT_FILE ..."
docker compose exec -T mongo mongodump --db "$DB_NAME" --archive > "$OUT_FILE"

echo ""
echo "Done: $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"
echo ""
echo "To import into MongoDB Atlas:"
echo "  mongorestore --uri=\"<your-atlas-connection-string>\" --archive=\"$OUT_FILE\" --drop"
echo ""
echo "Then point the backend's MONGO_URI at the same Atlas connection string"
echo "(MONGO_DB_NAME stays '$DB_NAME' unless you chose a different database name)."
echo ""
echo "This file contains real user data (emails, bcrypt hashes) — it is"
echo "gitignored on purpose. Never commit or share it; delete it once the"
echo "migration is confirmed."

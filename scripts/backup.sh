#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/mechanica-backups/$TIMESTAMP"
ENVIRONMENT="${1:-development}"

echo "=== Mechanica Backup ($ENVIRONMENT) ==="
mkdir -p "$BACKUP_DIR"

if command -v pg_dump &>/dev/null; then
  echo "Backing up database..."
  DB_URL="${DATABASE_URL:-postgresql://mechanica:mechanica_secret@localhost:5432/mechanica}"
  pg_dump "$DB_URL" -F c -f "$BACKUP_DIR/database.dump"
  echo "  -> $BACKUP_DIR/database.dump"
else
  echo "  Skipping database backup (pg_dump not found)"
fi

echo "Backup complete: $BACKUP_DIR"

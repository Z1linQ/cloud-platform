#!/bin/bash

set -euo pipefail

set -a
source .env
set +a

TIMESTAMP=$(date +%F_%H-%M-%S)
BACKUP_FILE="backup_$TIMESTAMP.sql"
DB_CONTAINER=""

find_db_container() {
  if docker ps --format '{{.Names}}' | grep -qx 'collab_db'; then
    echo "collab_db"
    return 0
  fi

  docker ps --format '{{.Names}}' | grep -E '^collab_db\.[0-9]+\.' | head -n 1
}

cleanup() {
  rm -f "$BACKUP_FILE"
}

trap cleanup ERR

DB_CONTAINER="$(find_db_container)"

if [ -z "$DB_CONTAINER" ]; then
  echo "Error: could not find a running PostgreSQL container for this project." >&2
  echo "Expected either 'collab_db' (Docker Compose) or 'collab_db.*' (Docker Swarm)." >&2
  exit 1
fi

docker exec "$DB_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "/tmp/$BACKUP_FILE"
docker cp "$DB_CONTAINER:/tmp/$BACKUP_FILE" "$BACKUP_FILE"
docker exec "$DB_CONTAINER" rm -f "/tmp/$BACKUP_FILE"

trap - ERR

echo "Backup saved to $BACKUP_FILE"

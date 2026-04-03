#!/bin/bash

set -euo pipefail

set -a
source .env
set +a

TIMESTAMP=$(date +%F_%H-%M-%S)
BACKUP_FILE="backup_$TIMESTAMP.sql"

cleanup() {
  rm -f "$BACKUP_FILE"
}

trap cleanup ERR

docker exec collab_db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "/tmp/$BACKUP_FILE"
docker cp "collab_db:/tmp/$BACKUP_FILE" "$BACKUP_FILE"
docker exec collab_db rm -f "/tmp/$BACKUP_FILE"

trap - ERR

echo "Backup saved to $BACKUP_FILE"

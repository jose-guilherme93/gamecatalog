#!/bin/bash
set -e

PGHOST=${PGHOST:-postgres}
PGPORT=${PGPORT:-5432}

echo "Waiting for postgres at $PGHOST:$PGPORT..."
while ! nc -z "$PGHOST" "$PGPORT"; do
  sleep 0.5
done
echo "Database ready."

exec "$@"

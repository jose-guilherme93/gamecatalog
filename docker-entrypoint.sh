#!/bin/sh
set -e

PGHOST=${PGHOST:-postgres}
PGPORT=${PGPORT:-5432}

echo "⏳ Aguardando Postgres em $PGHOST:$PGPORT..."
while ! nc -z "$PGHOST" "$PGPORT"; do
  sleep 0.5
done
echo "✅ Banco de dados pronto."

echo "🚀 Executando migrations..."

npx pnpm run migrate


echo "🟢 Iniciando aplicação..."
exec "$@"

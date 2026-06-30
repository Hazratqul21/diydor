#!/usr/bin/env bash
# Diydor — PostgreSQL backup (pg_dump). Konteyner ichida bajariladi, host'ga yoziladi.
# Ishlatish:  ./scripts/backup-db.sh   ->  backups/diydor-YYYYmmdd-HHMMSS.sql.gz
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker-compose.prod.yml"

# .env.docker dan POSTGRES_* o'qish (bo'lmasa standart 'diydor')
PGUSER=$(grep -E '^POSTGRES_USER=' .env.docker 2>/dev/null | cut -d= -f2- || true)
PGDB=$(grep -E '^POSTGRES_DB=' .env.docker 2>/dev/null | cut -d= -f2- || true)
PGUSER=${PGUSER:-diydor}
PGDB=${PGDB:-diydor}

mkdir -p backups
OUT="backups/diydor-$(date +%Y%m%d-%H%M%S).sql.gz"

echo "==> pg_dump ($PGDB) -> $OUT"
$COMPOSE exec -T postgres pg_dump -U "$PGUSER" "$PGDB" | gzip > "$OUT"
echo "Backup tayyor: $OUT  ($(du -h "$OUT" | cut -f1))"

# Oxirgi 14 backup'ni saqlab, eskilarini tozalash
ls -1t backups/diydor-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f

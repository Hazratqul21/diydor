#!/usr/bin/env bash
# Diydor — XAVFSIZ qayta deploy. Ma'lumotlar bazasini HECH QACHON o'chirmaydi.
# Ishlatish (server'da, repo ildizidan):  ./scripts/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> 1/4  GitHub'dan yangilash"
git pull --ff-only

if [ ! -f .env.docker ]; then
  echo "XATO: .env.docker topilmadi. Avval: cp .env.docker.example .env.docker  va to'ldiring." >&2
  exit 1
fi

echo "==> 2/4  Deploy oldidan DB backup"
./scripts/backup-db.sh || echo "(backup o'tkazib yuborildi — DB hali ishga tushmagan bo'lishi mumkin)"

echo "==> 3/4  Image'larni qayta qurish va konteynerlarni yangilash (volume'larga tegmaydi)"
# DIQQAT: 'down -v' YOKI 'volume rm' ISHLATILMAYDI — ma'lumotlar saqlanadi.
$COMPOSE up -d --build

echo "==> 4/4  Holat"
$COMPOSE ps
echo "Tayyor. Loglar uchun:  $COMPOSE logs -f api"

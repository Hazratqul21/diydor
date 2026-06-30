#!/bin/sh
# Diydor API container entrypoint.
# Ishga tushishdan oldin DB migratsiyalarini qo'llaydi, so'ng API ni boshlaydi.
set -e

echo "[entrypoint] Prisma migrate deploy..."
pnpm exec prisma migrate deploy || echo "[entrypoint] migrate o'tkazib yuborildi/xato (davom etamiz)"

echo "[entrypoint] Diydor API ishga tushmoqda..."
exec node dist/main.js

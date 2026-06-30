#!/bin/sh
# Diydor API container entrypoint.
# Schema'ni DB ga sinxronlaydi (db push — manba haqiqati schema.prisma, prod shu
# yo'l bilan qurilgan; migration tarixi to'liq emas), admin/sozlama/rejalarni
# idempotent seed qiladi, so'ng API ni boshlaydi.
set -e

echo "[entrypoint] Prisma db push (schema -> DB)..."
pnpm exec prisma db push --skip-generate

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "[entrypoint] Admin + sozlama + rejalarni seed qilish (idempotent)..."
  pnpm exec ts-node prisma/admin-seed.ts || echo "[entrypoint] seed o'tkazib yuborildi/xato (davom etamiz)"
fi

echo "[entrypoint] Diydor API ishga tushmoqda..."
exec node dist/main.js

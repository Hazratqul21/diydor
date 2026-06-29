# Diydor API (`@diydor/api`)

NestJS backend — REST + (keyin) Socket.IO real-time. MVP "core loop":
**auth → profil → onboarding → svayp → match → chat**.

## Stack

- **NestJS 10** (TypeScript)
- **PostgreSQL 16** + **Prisma 5** (ORM/migratsiya)
- **Redis 7** (kesh, presence — keyingi bosqich)
- **JWT** + **Telegram initData** HMAC auth

## Ishga tushirish (lokal)

Quyidagilar **root papkadan** (`tanishuv_ilova/`) ishlaydi:

```bash
# 1. Bog'lamalar
pnpm install

# 2. Postgres + Redis (Docker)
pnpm db:up

# 3. Baza migratsiyasi + Prisma client
pnpm db:migrate

# 4. API'ni dev rejimda ishga tushirish (watch)
pnpm api:dev
```

API: `http://localhost:3000/api` · Health: `GET /api/health`

> **Portlar:** Postgres `5433`, Redis `6380` (lokal konfliktlardan qochish uchun).
> Sozlamalar: `apps/api/.env` (namuna: `.env.example`).

## Auth oqimi

1. TMA `WebApp.initData` (xom string) ni `POST /api/auth/telegram` ga yuboradi.
2. Backend HMAC-SHA256 bilan imzoni tekshiradi (`TELEGRAM_BOT_TOKEN` kerak), userni upsert qiladi, **JWT** qaytaradi.
3. Keyingi so'rovlar: `Authorization: Bearer <token>`.

**Lokal test uchun** (`@BotFather` tokenisiz): `.env` da `AUTH_DEV_BYPASS=true` qo'ying — shunda `initData` xom JSON sifatida qabul qilinadi:

```bash
curl -X POST http://localhost:3000/api/auth/telegram \
  -H 'Content-Type: application/json' \
  -d '{"initData":"{\"id\":123,\"first_name\":\"Aziz\"}"}'
```

> ⚠️ `AUTH_DEV_BYPASS=true` — FAQAT lokal. Productionda har doim `false`.

## Hozir tayyor endpointlar

| Metod | Yo'l | Izoh |
|-------|------|------|
| `GET` | `/api/health` | Holat tekshiruvi (ochiq) |
| `POST` | `/api/auth/telegram` | initData → JWT (ochiq) |
| `GET` | `/api/users/me` | To'liq profil (rasm + promptlar) |
| `PATCH` | `/api/users/me` | Profil: jins, tug'ilgan sana (18+), niyat, joylashuv |

## Modul tuzilishi

```
src/
├── main.ts              # bootstrap, global ValidationPipe, CORS
├── app.module.ts        # root modul
├── health.controller.ts
├── prisma/              # PrismaService (global)
├── auth/                # Telegram initData + JWT + global guard
│   ├── telegram.util.ts # HMAC tekshiruv (xavfsizlik kritik)
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   └── ...
└── users/               # profil + onboarding (18+ guard)
```

## Keyingi bosqichlar (backend)

- [ ] `photos` — rasm yuklash (S3/MinIO) + moderatsiya stub
- [ ] `prompts` — Hinge uslubidagi savol-javob
- [ ] `discovery` — svayp navbati (matching: niyat+jins+yosh+joylashuv)
- [ ] `match` — match yaratish + "Sizni kim yoqtirdi"
- [ ] `chat` — Socket.IO real-time + Redis adapter
- [ ] Pul/sovg'a/verify — alohida faza

# Diydor — Tanishuv va aloqa ilovasi

**Buyurtmachi:** INNASOFT MChJ · Muzaffar (Asoschi / CEO)
**Holat:** Brainstorm / loyihalash bosqichi (boshlandi: 2026-06-19)
**Slogan:** "Qalblar uchrashadigan joy"

Diydor — O'zbekiston va MDH bozori uchun moslashtirilgan tanishuv ilovasi. Markaziy g'oya ikki ustunga tayanadi: (1) Tinder/Bumble/Hinge'ning isbotlangan mexanizmlari (svayp, match, suhbat), (2) ikki tomon roziligiga asoslangan sovg'a iqtisodiyoti.

---

## 📁 Hujjatlar (papka tarkibi)

| Fayl | Mazmun | Muallif |
|------|--------|---------|
| `Diydor_Strategiya.csv` | To'liq biznes-strategiya: 14 bo'lim — bozor tahlili, raqobatchi (Olove), monetizatsiya, SWOT, moliyaviy model, xavflar, roadmap | Muzaffar |
| `Diydor_Master_Flow.csv` | Birlashtirilgan to'liq foydalanuvchi flow — 30 ekran, 6 bosqich (A–F); backend logikasi, holatlar, KPI, xavf ustunlari bilan | Loyihalash |
| `Diydor_Tech_Stack.csv` | Texnologiya + dizayn metodlari — 37 qator, MVP/V2 fazaga ajratilgan | Loyihalash |

> `Diydor_Master_Flow.csv` eski `Diydor_TMA_Flow.csv` va `Diydor_TMA_Flow_va_Dizayn.csv` dublikatlarining o'rnini bosadi (ular o'chirilgan).

---

## 🎯 Kelishilgan asosiy qarorlar

**Ketma-ketlik:** avval Telegram Mini App (MVP) → keyin Flutter native (iOS App Store + Google Play).

**Pul / monetizatsiya modeli:**
- **MVP (Variant 1):** virtual sovg'a = faqat status/e'tibor ramzi (pulga aylanmaydi) + REAL sovg'a (hamkor gulchi/kafe orqali, komissiya bilan). Bu e-pul litsenziyasi, AML va Apple/Google rad etishi muammosini chetlab o'tadi.
- **V2 (cash-out):** pul yechish faqat **litsenziyali PSP** (Payme/Click payout API) orqali — o'z e-hamyon EMAS. Faqat qizlarga emas, har qanday **tasdiqlangan** faol userga. KYC + limit + AML majburiy.

**Verifikatsiya:** selfie liveness + face-match orqali. Python servis (FastAPI + MediaPipe + DeepFace/ArcFace). Telegram avatari yetarli emas — selfie majburiy.

---

## ⚠️ Asosiy xavflar (e'tiborda tutilsin)

1. **Sovg'a → cash-out** — Apple/Google rad etishi, MB litsenziyasi, konservativ jamiyatda obro' xavfi. (MVP'da cash-out yo'q qilib hal qilindi.)
2. **TMA to'lov siyosati** — Telegram Mini App'da digital goods uchun Telegram Stars majburlashi mumkin — tekshirish shart.
3. **Cold-start (tovuq-tuxum)** — ayollarni jalb qilish alohida reja talab qiladi; sovg'a modeli ularsiz ishlamaydi.
4. **Moliyaviy modelda xarajat tomoni yo'q** — PSP komissiya, KYC vendor, moderatsiya, CAC modellashtirilishi kerak.
5. **Raqobatchi:** Olove (2021'dan, reyting ~2.7, faqat obuna modeli) — zaif raqib, bo'sh joy katta.

---

## 🏗️ Rejalashtirilgan arxitektura (MVP)

```
tanishuv_ilova/
├── apps/
│   ├── mobile/         # React + Vite + TS — PWA / Telegram Mini App frontend
│   └── api/          # NestJS — REST + Socket.IO real-time backend
└── services/
    └── verify/       # FastAPI — selfie liveness + face match (MediaPipe + DeepFace)
```

**Stack qisqacha:** React+Tailwind+Framer Motion (TMA) · NestJS+PostgreSQL+Redis (backend) · Socket.IO (chat) · Payme/Click (to'lov) · Python/FastAPI (verifikatsiya) · UZ mahalliy hosting (qonun talabi). To'liq tafsilot → `Diydor_Tech_Stack.csv`.

---

## ▶️ Keyingi qadamlar

1. Tech stack tasdiqlash → repo skeletini yoqish (yuqoridagi struktura)
2. Dizayn tizimi (Variant A palitra, tokenlar) + asosiy ekran mock'lari (Figma / vizual)
3. Verifikatsiya servisi prototipi (FastAPI + MediaPipe + DeepFace)
4. MVP funksiyalari: onboarding → svayp → match → chat → sovg'a

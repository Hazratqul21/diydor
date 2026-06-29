# Diydor — Flutter qayta qurish hujjatlar paketi

Bu papka Diydor tanishuv ilovasini **React/PWA dan Flutter (iOS + Android)** ga ko'chirish uchun to'liq, ishlatishga tayyor hujjatlar va AI-promtlar to'plamidir.

Manba ilova: `~/Desktop/tanishuv_ilova` (React 18 + Vite + Tailwind + NestJS backend, prodda `diydorapp.uz`).
Maqsad: bir xil mahsulot mantig'i, **lekin Flutter'da wow-darajada premium** dizayn va **admin paneldan boshqariladigan animatsiyalar** bilan.

---

## 📁 Fayllar va ulardan foydalanish tartibi

| Fayl | Nima uchun | Qachon o'qiladi |
|------|-----------|------------------|
| `00_README.md` | Shu fayl — yo'l xaritasi | Birinchi |
| `01_MASTER.md` | **Asosiy hujjat**: arxitektura, dizayn tizimi, motion engine, store qoidalari, kutubxonalar, barcha ekranlar ro'yxati | Ikkinchi (to'liq o'qing) |
| `02_FIGMA_IMPORT.md` | Mavjud dizaynni Figma'ga `html.to.design` bilan olib kirish + Dev Mode MCP bilan o'qish workflow | Figma ishi boshlanganda |
| `03_DESIGN_TOKENS.json` | Tokens Studio (Figma plagini) uchun design-token JSON — ranglar/shrift/spacing/radius/motion | Figma'da token ulaganda + Flutter theme'da |
| `prompts/P00_bootstrap.md` … `P10` | **Modul-promtlari**: Claude Code / AI bilan ketma-ket ishlatiladigan, har biri bitta modulni qurib beradigan to'liq promt | Kod yozish boshlanganda, tartib bilan |

---

## 🔁 Tavsiya etilgan ish oqimi (workflow)

1. **`01_MASTER.md` ni to'liq o'qing.** Bu sizning "bitilgan haqiqat" (single source of truth) hujjatingiz. Hamma promt unga tayanadi.
2. **Figma:** `02_FIGMA_IMPORT.md` bo'yicha mavjud app'ni Figma'ga import qiling → qo'lda sayqallang. `03_DESIGN_TOKENS.json` ni Tokens Studio bilan ulang.
3. **Flutter qurish:** `prompts/` ichidagi promtlarni **tartib bilan** (P00 → P10) Claude Code'ga bering. Har bir promt o'zidan oldingisiga tayanadi.
4. Figma'da bir ekranni o'zgartirsangiz → Dev Mode MCP'ni yoqib, o'sha freymni tanlang, men o'qib Flutter widgetiga aylantiraman (`02_FIGMA_IMPORT.md` da batafsil).

---

## ⚠️ Eng muhim 5 ta qaror (batafsili `01_MASTER.md` §9 da)

1. **iOS/Android raqamli tovar = majburiy IAP.** Tanga va obunani Payme orqali sotsangiz Apple (Guideline 3.1.1) va Google rad etadi. Mobil ilovada `in_app_purchase` (StoreKit + Play Billing) ishlatiladi. Payme faqat web va **jismoniy** sovg'alar (haqiqiy gul yetkazib berish) uchun qoladi.
2. **Hisobni o'chirish (account deletion) ilova ichida bo'lishi SHART** — ikkala do'kon ham 2022/2023 dan beri talab qiladi. Backend'ga `DELETE /users/me` qo'shiladi.
3. **18+ va kontent moderatsiyasi** — Apple Guideline 1.2 (UGC). Report/Block bor, lekin selfie verifikatsiya + matn moderatsiyasi kuchaytiriladi. Yosh reytingi 17+.
4. **Motion engine** — barcha animatsiyalar `MotionConfig` orqali (admin paneldan). Kod ichida "sehrli raqam" yo'q; default qiymatlar + remote override.
5. **Dizayn tili saqlanadi, premiumlashtiriladi** — coral `#A73833`, Manrope, M3, lekin Lottie + glassmorphism + haptics + mikro-animatsiyalar qo'shiladi.

---

## 🧱 Texnologiya steki (qisqacha; to'lig'i MASTER §3)

- **Framework:** Flutter 3.x (Dart 3), Material 3.
- **State:** Riverpod (riverpod_generator).
- **Routing:** go_router (deep link + redirect guard).
- **Network:** dio + retrofit, `flutter_secure_storage` (JWT).
- **Real-time:** socket_io_client (backend Socket.IO bilan mos).
- **Animatsiya:** built-in + `flutter_animate` + `lottie` + `confetti`; svayp = custom (AnimationController).
- **Rasm:** cached_network_image.
- **To'lov:** `in_app_purchase` (mobil) + Payme WebView (web/jismoniy).
- **Push:** firebase_messaging.

Backend O'ZGARMAYDI (NestJS, `diydorapp.uz/api`). Flutter shunchaki yangi klient. Kichik qo'shimchalar: `DELETE /users/me`, IAP receipt validatsiya endpointlari, motion config maydonlari (MASTER §7).

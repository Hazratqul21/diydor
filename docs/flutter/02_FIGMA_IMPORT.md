# Figma bilan ishlash — import + Dev Mode MCP workflow

> Maqsad: mavjud React/Tailwind dizaynni Figma'ga olib kirish → siz qo'lda sayqallash → men (Claude) Dev Mode MCP orqali o'qib Flutter widgetiga aylantirish.

## ⚠️ Avval bilib qo'ying: MCP nima qila oladi / qila olmaydi

| MCP qila oladi (✅) | MCP qila OLMAYDI (❌) |
|---|---|
| Figma'da **tanlangan freym**ni o'qish (`get_metadata`) | Figma'ga dizayn **yaratish/yuklash** |
| Freymdan kod generatsiya (`get_design_context`) | Hujjatdan avtomatik Figma sahifasi qurish |
| Skrinshot olish (`get_screenshot`) | Komponentlarni avtomatik joylashtirish |
| Variable/token'larni o'qish (`get_variable_defs`) | |

Demak Figma'ni **to'ldirish qo'lda** bo'ladi (import plagini + sizning tahririz). MCP keyin **o'qish** uchun ishlatiladi.

---

## A bosqich — Mavjud app'ni Figma'ga import qilish

Eng tez yo'l: jonli sayt + `html.to.design` plagini.

1. Figma'da yangi Design fayl oching: **"Diydor — App"**.
2. Figma → Plugins → **html.to.design** ni o'rnating.
3. Plaginda quyidagi URL'larni navbat bilan import qiling (har biri alohida freym bo'ladi). Jonli ilova: `https://diydorapp.uz`
   - Yoki lokal: `pnpm --filter @diydor/mobile dev` → `http://localhost:5173/<route>`
4. Importga arzigulik route'lar (har biri telefon o'lchami 390×844 da):
   - `/` (Welcome), `/onboarding/gender`, `/onboarding/age`, `/onboarding/intent`, `/onboarding/photos`, `/onboarding/verify`, `/onboarding/done`
   - `/discover` (svayp), `/likes`, `/messages`, `/chat/<biror-id>`, `/profile`, `/profile/edit`, `/subscription`, `/u/<id>`, `/settings`
   - `/coins`, `/wallet`, `/wallet/withdraw`, `/gifts/<matchId>`
   - **Eslatma:** auth talab qiladigan ekranlar uchun avval ilovada guest sessiya oching (Boshlash bosing), keyin shu sahifani import qiling — yoki skrinshot import qiling.
5. Import bo'lgach: freymlarni **Pages** bo'yicha tartiblang: `01 Onboarding`, `02 Discover`, `03 Chat`, `04 Profil`, `05 Monetizatsiya`, `06 Komponentlar`, `07 Tokens`.

> Muqobil: agar `html.to.design` HTML'ni yaxshi tortmasa — har ekrandan **skrinshot** (`mcp__Claude_Preview__preview_screenshot` yoki brauzer) olib, Figma'ga rasm sifatida qo'ying va ustidan qayta chizing. Svayp/modal kabi dinamik holatlar uchun shu yaxshiroq.

---

## B bosqich — Design tokenlarni Figma'ga ulash (Tokens Studio)

1. Figma → Plugins → **Tokens Studio for Figma** o'rnating.
2. Plaginda **Import** → `03_DESIGN_TOKENS.json` ni yuklang (yoki nusxa-joylashtiring).
3. Token to'plamlarini Figma **Variables** ga "Create Variables" bilan bog'lang (ranglar, radius, spacing).
4. Endi Figma'da rang/o'lchov o'zgartirsangiz — token nomi bo'yicha o'zgaradi, men MCP `get_variable_defs` bilan aniq token nomini o'qib Flutter `AppColors`/`AppSpacing` ga moslashtiraman.

---

## C bosqich — Sayqallash (siz qo'lda)

Figma'da:
- Komponentlar yarating: Button (variant: primary/secondary/ghost; state: default/pressed), Card, Chip, SegmentedTabs, BottomNav, BottomSheet, MatchOverlay.
- Dark mode varianti (token JSON'dagi `dark` qiymatlari).
- "Wow" elementlarini qo'shing: gradient mesh fon, glassmorphism panel, Lottie placeholder (rasm + izoh "Lottie: rose.json").
- Auto-layout + constraints — responsive (telefon → planshet).

---

## D bosqich — Men Figma'dan o'qib Flutter'ga aylantirishim

Bir ekran/komponentni Flutter'ga ko'chirmoqchi bo'lsangiz:

1. **Figma desktop app**'da Dev Mode MCP'ni yoqing (bir martalik):
   - Figma desktop'ni eng oxirgi versiyaga yangilang.
   - Yuqori-chap menyu → Preferences → **"Enable Dev Mode MCP Server"**.
   - Claude Code'ni qayta ishga tushiring.
2. Figma'da kerakli **freym/komponentni tanlang** (yoki menga node URL bering: `figma.com/design/<key>/<name>?node-id=1-2`).
3. Menga ayting: "shu ekranni Flutter'ga aylantir". Men:
   - `get_metadata` → struktura,
   - `get_design_context` → layout/qiymatlar,
   - `get_variable_defs` → token nomlari,
   - `get_screenshot` → vizual tekshiruv,
   keyin MASTER §4 tokenlari va §6 motion bilan moslab **token-asoslangan Flutter widget** yozaman (hardcode rang YO'Q).

> Maslahat: bitta ekranni to'liq tugatib, undan komponent-pattern chiqaramiz, keyin qolganlari tez ketadi.

---

## Eslatma — workflow takrori
Figma (siz tahrirlaysiz) → MCP (men o'qiyman) → Flutter (men yozaman) → MASTER hujjat (o'zgarish bo'lsa yangilanadi). Token o'zgarsa — `03_DESIGN_TOKENS.json` ham yangilanadi (yagona manba).
